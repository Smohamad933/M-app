<?php
/**
 * TaskRooz / Bag Time - Bale Messenger Bot API & Webhook (docs.bale.ai)
 * Fully compliant with Bale Bot API & Inline Keyboards & Contact Verification
 * 
 * 1. Admin Token verification & connection testing (getMe)
 * 2. Automatic webhook registration (setWebhook)
 * 3. User account phone verification via Bale:
 *    - Start bot -> Click inline button "🔐 تایید و فعال‌سازی حساب کاربری"
 *    - Send 6-digit registration code
 *    - Mandatory contact sharing (request_contact: true) to match phone numbers
 * 4. Choose which account receives notifications via Bale inline buttons
 * 5. Task creation & query via Bale inline buttons and messages
 * 6. Get Chat ID tool for users to paste into Bag Time profile settings
 */
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'status');
$dbObj = TaskRoozDB::getInstance();

$baleConfig = $dbObj->data['globalSettings']['baleBot'] ?? [
    'enabled' => false,
    'token' => '',
    'botUsername' => 'BagTime_Bot',
    'verifyOnRegister' => true,
    'sendNotifications' => true,
    'allowTaskCreation' => true,
];

$botToken = trim($baleConfig['token'] ?? '');

/**
 * Send HTTP request to Bale Bot API
 */
function callBaleApi($token, $method, $params = []) {
    $url = 'https://tapi.bale.ai/bot' . $token . '/' . $method;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params, JSON_UNESCAPED_UNICODE));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json; charset=utf-8']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$response) {
        return ['ok' => false, 'error' => 'خطا در ارتباط با سرورهای بله', 'httpCode' => $httpCode];
    }
    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : ['ok' => false, 'raw' => $response, 'httpCode' => $httpCode];
}

/**
 * Send Bale message with optional inline or reply keyboard
 */
function sendBaleMessage($token, $chatId, $text, $replyMarkup = null) {
    if (empty($token) || empty($chatId)) return false;
    $payload = [
        'chat_id' => $chatId,
        'text' => $text,
    ];
    if ($replyMarkup) {
        $payload['reply_markup'] = $replyMarkup;
    }
    return callBaleApi($token, 'sendMessage', $payload);
}

/**
 * Answer callback query on inline button click
 */
function answerBaleCallback($token, $callbackQueryId, $text = null, $showAlert = false) {
    if (empty($token) || empty($callbackQueryId)) return false;
    $payload = [
        'callback_query_id' => $callbackQueryId,
        'show_alert' => $showAlert,
    ];
    if ($text) {
        $payload['text'] = $text;
    }
    return callBaleApi($token, 'answerCallbackQuery', $payload);
}

/**
 * Normalize Iranian phone numbers for 100% accurate matching
 * Supports +98912..., 0098912..., 98912..., 0912..., 912...
 */
function normalizePhoneNumber($p) {
    $d = preg_replace('/[^\d]/', '', (string)$p);
    if (substr($d, 0, 4) === '0098') $d = '0' . substr($d, 4);
    elseif (substr($d, 0, 2) === '98') $d = '0' . substr($d, 2);
    elseif (strlen($d) === 10 && substr($d, 0, 1) === '9') $d = '0' . $d;
    return $d;
}

/**
 * Helper to build Main Menu Inline Keyboard
 */
function getMainMenuKeyboard() {
    return [
        'inline_keyboard' => [
            [
                ['text' => '🔐 تأیید و احراز هویت حساب کاربری', 'callback_data' => 'verify_account'],
            ],
            [
                ['text' => '📋 لیست تسک‌های من', 'callback_data' => 'my_tasks'],
                ['text' => '➕ ثبت تسک جدید', 'callback_data' => 'new_task'],
            ],
            [
                ['text' => '⚙️ تنظیمات اعلان‌ها و اکانت', 'callback_data' => 'notif_settings'],
                ['text' => '🆔 شناسه عددی چت (Chat ID)', 'callback_data' => 'my_chat_id'],
            ],
            [
                ['text' => 'ℹ️ راهنمای بازوی بگ تایم', 'callback_data' => 'help'],
            ],
        ],
    ];
}

// 1. Check Bot Status & Test Token (Admin only)
if ($action === 'test' || $action === 'status') {
    $tokenToTest = trim($_POST['token'] ?? ($_GET['token'] ?? $botToken));
    if (empty($tokenToTest)) {
        jsonResponse([
            'ok' => false,
            'status' => 'not_configured',
            'message' => 'توکن ربات بله هنوز تنظیم نشده است.',
            'config' => $baleConfig,
        ]);
    }

    $me = callBaleApi($tokenToTest, 'getMe');
    if (!empty($me['ok'])) {
        jsonResponse([
            'ok' => true,
            'status' => 'connected',
            'message' => 'اتصال به ربات بله با موفقیت برقرار شد.',
            'bot' => $me['result'] ?? [],
            'config' => $baleConfig,
        ]);
    } else {
        jsonResponse([
            'ok' => false,
            'status' => 'error',
            'message' => 'توکن ربات بله نامعتبر است یا ارتباط با بله برقرار نشد.',
            'error' => $me['description'] ?? ($me['error'] ?? 'خطای احراز هویت توکن'),
        ], 400);
    }
}

// 2. Set Webhook on Bale
if ($action === 'set_webhook') {
    if (empty($botToken)) {
        jsonResponse(['error' => 'ابتدا توکن ربات بله را ذخیره کنید.'], 400);
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $webhookUrl = $_POST['url'] ?? ($protocol . $host . '/api/bale.php?action=webhook');

    $res = callBaleApi($botToken, 'setWebhook', ['url' => $webhookUrl]);
    jsonResponse([
        'ok' => !empty($res['ok']),
        'webhookUrl' => $webhookUrl,
        'baleResponse' => $res,
    ]);
}

// 3. Webhook Receiver from Bale Messenger (Handles Messages, Contacts, and Inline Keyboards)
if ($action === 'webhook') {
    $rawInput = file_get_contents('php://input');
    $update = json_decode($rawInput, true);

    if (!$update) {
        echo json_encode(['ok' => true]);
        exit;
    }

    if (!isset($dbObj->data['bale_pending_verifications'])) {
        $dbObj->data['bale_pending_verifications'] = [];
    }

    // =========================================================================
    // CASE 1: CALLBACK QUERY (User tapped an INLINE KEYBOARD BUTTON)
    // =========================================================================
    if (!empty($update['callback_query'])) {
        $cb = $update['callback_query'];
        $cbId = $cb['id'] ?? '';
        $chatId = $cb['message']['chat']['id'] ?? ($cb['from']['id'] ?? null);
        $cbData = trim($cb['data'] ?? '');
        $fromUser = $cb['from'] ?? [];

        answerBaleCallback($botToken, $cbId);

        // Find linked users for this chat
        $linkedUsers = [];
        foreach ($dbObj->data['users'] as $u) {
            if (!empty($u['baleChatId']) && strval($u['baleChatId']) === strval($chatId)) {
                $linkedUsers[] = $u;
            }
        }
        $primaryUser = !empty($linkedUsers) ? $linkedUsers[0] : null;

        // Route callback actions
        if ($cbData === 'verify_account') {
            $msg = "🔐 **مرحله ۱ از ۲: ارسال کد تأیید بگ تایم**\n\n" .
                "لطفاً کد ۶ رقمی نمایش‌داده‌شده در پنجره ثبت‌نام برنامه «بگ تایم» را به صورت یک پیام ارسال نمایید:\n\n" .
                "*(نمونه: 123456)*";
            
            $cancelKb = [
                'inline_keyboard' => [
                    [['text' => '❌ انصراف و بازگشت به منوی اصلی', 'callback_data' => 'main_menu']]
                ]
            ];
            sendBaleMessage($botToken, $chatId, $msg, $cancelKb);
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($cbData === 'my_tasks') {
            if (!$primaryUser) {
                $msg = "⚠️ هنوز حسابی به این چت متصل نشده است!\nجهت اتصال، ابتدا دکمه «🔐 تأیید و احراز هویت حساب کاربری» را لمس کنید.";
                sendBaleMessage($botToken, $chatId, $msg, getMainMenuKeyboard());
                echo json_encode(['ok' => true]);
                exit;
            }

            $userTasks = [];
            foreach ($dbObj->data['tasks'] ?? [] as $t) {
                if (($t['userId'] ?? '') === $primaryUser['id']) {
                    $userTasks[] = $t;
                }
            }

            if (empty($userTasks)) {
                $msg = "📋 لیست وظایف حساب کاربری «" . ($primaryUser['name'] ?? $primaryUser['username']) . "» خالی است.\n\n" .
                    "می‌توانید با دکمه زیر تسک جدید اضافه کنید:";
            } else {
                $msg = "📋 **لیست وظایف شما در بگ تایم (" . ($primaryUser['name'] ?? $primaryUser['username']) . "):**\n\n";
                $i = 1;
                foreach (array_slice($userTasks, 0, 8) as $t) {
                    $icon = !empty($t['completed']) ? '✅' : '⏳';
                    $time = !empty($t['time']) ? " [{$t['time']}]" : '';
                    $msg .= "{$i}. {$icon} {$t['title']}{$time}\n";
                    $i++;
                }
            }

            $tasksKb = [
                'inline_keyboard' => [
                    [
                        ['text' => '➕ ثبت تسک جدید', 'callback_data' => 'new_task'],
                        ['text' => '🔄 بروزرسانی لیست', 'callback_data' => 'my_tasks'],
                    ],
                    [
                        ['text' => '🔙 بازگشت به منوی اصلی', 'callback_data' => 'main_menu'],
                    ],
                ]
            ];
            sendBaleMessage($botToken, $chatId, $msg, $tasksKb);
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($cbData === 'new_task') {
            $msg = "➕ **ثبت سریع وظیفه جدید**\n\n" .
                "کافیست عنوان کار مورد نظر را در قالب پیام بنویسید و ارسال کنید.\n" .
                "همچنین می‌توانید زمان و تاریخ را هم اضافه کنید:\n\n" .
                "• مثال ۱: مطالعه فصل ۳ کتاب فردا ساعت 18:00\n" .
                "• مثال ۲: جلسه کاری تیم ساعت 11:30\n" .
                "• مثال ۳: تحویل گزارش هفتگی";
            $kb = [
                'inline_keyboard' => [
                    [['text' => '🔙 بازگشت به منوی اصلی', 'callback_data' => 'main_menu']]
                ]
            ];
            sendBaleMessage($botToken, $chatId, $msg, $kb);
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($cbData === 'notif_settings') {
            $kbButtons = [];
            if (!empty($linkedUsers)) {
                $msg = "⚙️ **تنظیمات اعلانات و حساب‌های متصل:**\n\n" .
                    "شناسه چت بله شما در حال حاضر به حساب‌های زیر متصل است. اعلان‌ها و پیام‌ها به این چت ارسال می‌شوند:\n\n";
                
                foreach ($linkedUsers as $idx => $u) {
                    $isPrimary = ($idx === 0);
                    $icon = $isPrimary ? '🔔 فعال' : '🔕 ثانویه';
                    $msg .= "• **{$u['name']}** (@{$u['username']}) - {$icon}\n";
                    $kbButtons[] = [
                        ['text' => "👤 انتخاب «{$u['name']}» جهت دریافت اعلان", 'callback_data' => "select_notif_acc_{$u['id']}"]
                    ];
                }
            } else {
                $msg = "⚙️ **تنظیمات اعلانات:**\n\n" .
                    "در حال حاضر هیچ حسابی به این چت متصل نیست.\n" .
                    "جهت دریافت نوتیفیکیشن‌ها در بله، یا در سامانه بگ تایم ثبت‌نام کنید یا شناسه چت خود (`{$chatId}`) را در تنظیمات پروفایل بگ تایم وارد فرمایید.";
            }

            $kbButtons[] = [
                ['text' => '➕ اتصال حساب دیگر', 'callback_data' => 'verify_account'],
                ['text' => '🔙 منوی اصلی', 'callback_data' => 'main_menu'],
            ];

            sendBaleMessage($botToken, $chatId, $msg, ['inline_keyboard' => $kbButtons]);
            echo json_encode(['ok' => true]);
            exit;
        }

        if (strpos($cbData, 'select_notif_acc_') === 0) {
            $selectedId = str_replace('select_notif_acc_', '', $cbData);
            // Move selected user to first position in linked users for notifications
            $updatedUsers = [];
            foreach ($dbObj->data['users'] as &$u) {
                if ($u['id'] === $selectedId) {
                    $u['baleChatId'] = $chatId;
                    $u['baleNotificationActive'] = true;
                }
            }
            $dbObj->saveJson();

            sendBaleMessage(
                $botToken,
                $chatId,
                "✅ با موفقیت تنظیم شد! از این پس کلیه نوتیفیکیشن‌های این حساب در همین چت برای شما ارسال خواهد شد.",
                getMainMenuKeyboard()
            );
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($cbData === 'my_chat_id') {
            $msg = "🆔 **شناسه عددی چت شما در بله:**\n\n" .
                "`{$chatId}`\n\n" .
                "💡 **راهنمای اتصال به بگ تایم:**\n" .
                "کافیست شناسه بالا را کپی کرده و در برنامه «بگ تایم» وارد بخش «ویرایش پروفایل» شوید و در فیلد «شناسه چت بله (Bale Chat ID)» قرار داده و ذخیره کنید.";
            $kb = [
                'inline_keyboard' => [
                    [['text' => '🔙 بازگشت به منوی اصلی', 'callback_data' => 'main_menu']]
                ]
            ];
            sendBaleMessage($botToken, $chatId, $msg, $kb);
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($cbData === 'help' || $cbData === 'main_menu') {
            $welcome = "⏱️ **بازوی رسمی سامانه بگ تایم (Bag Time)**\n\n" .
                "با این بازو می‌توانید کارهای روزانه خود را مدیریت کرده، تسک ثبت کنید و هشدارهای مهم کاری را مستقیماً دریافت نمایید.\n\n" .
                "👇 لطفاً یکی از گزینه‌های شیشه‌ای زیر را انتخاب کنید:";
            sendBaleMessage($botToken, $chatId, $welcome, getMainMenuKeyboard());
            echo json_encode(['ok' => true]);
            exit;
        }

        echo json_encode(['ok' => true]);
        exit;
    }

    // =========================================================================
    // CASE 2: REGULAR MESSAGE (Text or Contact Sharing)
    // =========================================================================
    if (empty($update['message'])) {
        echo json_encode(['ok' => true]);
        exit;
    }

    $msg = $update['message'];
    $chatId = $msg['chat']['id'] ?? ($msg['from']['id'] ?? null);
    $fromUser = $msg['from'] ?? [];
    $text = trim($msg['text'] ?? '');
    $contact = $msg['contact'] ?? null;

    if (!$chatId) {
        echo json_encode(['ok' => true]);
        exit;
    }

    // -------------------------------------------------------------------------
    // STEP 2 OF VERIFICATION: USER SHARED CONTACT VIA BUTTON (request_contact)
    // -------------------------------------------------------------------------
    if ($contact && !empty($contact['phone_number'])) {
        $sharedPhoneNorm = normalizePhoneNumber($contact['phone_number']);
        $pendingInfo = $dbObj->data['bale_pending_verifications'][$chatId] ?? null;

        // Find candidate user
        $targetUserIndex = -1;
        if ($pendingInfo && !empty($pendingInfo['userId'])) {
            foreach ($dbObj->data['users'] as $idx => $u) {
                if ($u['id'] === $pendingInfo['userId']) {
                    $targetUserIndex = $idx;
                    break;
                }
            }
        } else {
            // Check if there is an unverified user with this phone number
            foreach ($dbObj->data['users'] as $idx => $u) {
                if (empty($u['isVerified']) && !empty($u['phone']) && normalizePhoneNumber($u['phone']) === $sharedPhoneNorm) {
                    $targetUserIndex = $idx;
                    break;
                }
            }
        }

        if ($targetUserIndex !== -1) {
            $matchedUser = &$dbObj->data['users'][$targetUserIndex];
            $registeredPhoneNorm = normalizePhoneNumber($matchedUser['phone'] ?? '');

            // STRICT VERIFICATION: Phones MUST MATCH!
            if ($registeredPhoneNorm !== '' && $registeredPhoneNorm === $sharedPhoneNorm) {
                $matchedUser['isVerified'] = true;
                $matchedUser['status'] = 'active';
                $matchedUser['baleChatId'] = $chatId;
                $matchedUser['balePhoneNumber'] = $contact['phone_number'];
                $matchedUser['baleUsername'] = $fromUser['username'] ?? ($matchedUser['baleUsername'] ?? '');
                
                unset($dbObj->data['bale_pending_verifications'][$chatId]);
                $dbObj->saveJson();

                // Send success message with glass/inline buttons and remove reply keyboard
                $successMsg = "🎉 **احراز هویت و تأیید شماره با موفقیت کامل انجام شد!** ✅\n\n" .
                    "👤 کاربر گرامی: **{$matchedUser['name']}**\n" .
                    "📱 شماره تأیید شده: `{$sharedPhoneNorm}`\n\n" .
                    "حساب کاربری شما در سامانه «بگ تایم» فعال گردید و هم‌اکنون می‌توانید وارد برنامه شوید.";

                $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $webAppUrl = $protocol . $host . '/index.html';

                $successKb = [
                    'inline_keyboard' => [
                        [
                            ['text' => '🌐 ورود به اپلیکیشن بگ تایم', 'url' => $webAppUrl],
                        ],
                        [
                            ['text' => '📋 مشاهده کارهای من', 'callback_data' => 'my_tasks'],
                            ['text' => '➕ ثبت تسک جدید', 'callback_data' => 'new_task'],
                        ],
                        [
                            ['text' => '⚙️ تنظیمات اعلان‌ها', 'callback_data' => 'notif_settings'],
                        ],
                    ],
                ];

                // First send remove keyboard to dismiss contact button
                callBaleApi($botToken, 'sendMessage', [
                    'chat_id' => $chatId,
                    'text' => 'شماره تماس شما دریافت شد.',
                    'reply_markup' => ['remove_keyboard' => true],
                ]);

                // Then send success inline message
                sendBaleMessage($botToken, $chatId, $successMsg, $successKb);
                echo json_encode(['ok' => true, 'verified' => true]);
                exit;
            } else {
                // Phone numbers DO NOT MATCH!
                $mismatchMsg = "❌ **عدم تطابق شماره همراه!**\n\n" .
                    "شماره همراه حساب بله شما (`{$sharedPhoneNorm}`) با شماره وارد شده در ثبت‌نام بگ تایم (`{$registeredPhoneNorm}`) یکسان نیست!\n\n" .
                    "طبق الزامات امنیتی، فقط حسابی تأیید می‌شود که شماره ثبت‌نامی و شماره بله آن یکسان باشد.\n" .
                    "لطفاً در سامانه بگ تایم با همین شماره ثبت‌نام کنید یا از اکانت بله مرتبط استفاده فرمایید.";

                $retryKb = [
                    'inline_keyboard' => [
                        [['text' => '🔄 تلاش مجدد', 'callback_data' => 'verify_account']],
                        [['text' => '🔙 منوی اصلی', 'callback_data' => 'main_menu']],
                    ]
                ];
                sendBaleMessage($botToken, $chatId, $mismatchMsg, $retryKb);
                echo json_encode(['ok' => true]);
                exit;
            }
        } else {
            $notFoundMsg = "⚠️ حسابی در انتظار احراز هویت با این شماره یافت نشد.\nلطفاً ابتدا کد ۶ رقمی را ارسال فرمایید:";
            sendBaleMessage($botToken, $chatId, $notFoundMsg, getMainMenuKeyboard());
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    // -------------------------------------------------------------------------
    // STEP 1 OF VERIFICATION: USER SENDS 6-DIGIT CODE OR /verify 123456
    // -------------------------------------------------------------------------
    $incomingCode = null;
    if (preg_match('/^\/start\s+verify_([A-Za-z0-9]{4,10})/i', $text, $matches)) {
        $incomingCode = $matches[1];
    } elseif (preg_match('/^\/verify\s+([A-Za-z0-9]{4,10})/i', $text, $matches)) {
        $incomingCode = $matches[1];
    } elseif (preg_match('/^\b(\d{6})\b$/', $text, $matches)) {
        $incomingCode = $matches[1];
    }

    if ($incomingCode) {
        $matchedIndex = -1;
        foreach ($dbObj->data['users'] as $idx => $u) {
            if (!empty($u['verificationCode']) && strtolower(trim($u['verificationCode'])) === strtolower(trim($incomingCode))) {
                $matchedIndex = $idx;
                break;
            }
        }

        if ($matchedIndex !== -1) {
            $userFound = $dbObj->data['users'][$matchedIndex];

            // Save pending verification state for chatId
            $dbObj->data['bale_pending_verifications'][$chatId] = [
                'userId' => $userFound['id'],
                'code' => $incomingCode,
                'time' => time(),
            ];
            $dbObj->saveJson();

            // Ask for contact sharing using ReplyKeyboardMarkup with request_contact: true
            $step2Msg = "✅ **کد تأیید ۶ رقمی صحیح است.**\n\n" .
                "⚠️ **مرحله ۲ از ۲ (الزامی): احراز هویت با شماره تماس**\n" .
                "جهت تکمیل نهایی فعال‌سازی، باید شماره همراه ثبت‌شده در بله با شماره فرم ثبت‌نام شما (`{$userFound['phone']}`) تطبیق داده شود.\n\n" .
                "👇 لطفاً دکمه زیر را لمس نمایید تا شماره شما به بازو ارسال گردد:";

            $contactKeyboard = [
                'keyboard' => [
                    [
                        [
                            'text' => '📱 ارسال شماره تماس و اطلاعات من به بازو',
                            'request_contact' => true,
                        ],
                    ],
                ],
                'resize_keyboard' => true,
                'one_time_keyboard' => true,
            ];

            callBaleApi($botToken, 'sendMessage', [
                'chat_id' => $chatId,
                'text' => $step2Msg,
                'reply_markup' => $contactKeyboard,
            ]);
            echo json_encode(['ok' => true]);
            exit;
        } else {
            $failMsg = "⚠️ **کد تأیید نامعتبر است!**\nکد ارسال‌شده در سامانه یافت نشد یا منقضی گردیده است.\nلطفاً کد ۶ رقمی را بررسی کرده و مجدداً ارسال نمایید.";
            $failKb = [
                'inline_keyboard' => [
                    [['text' => '🔄 تلاش مجدد', 'callback_data' => 'verify_account']],
                    [['text' => '🔙 منوی اصلی', 'callback_data' => 'main_menu']],
                ]
            ];
            sendBaleMessage($botToken, $chatId, $failMsg, $failKb);
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    // -------------------------------------------------------------------------
    // FIND LINKED USER FOR TASK CREATION / QUERIES
    // -------------------------------------------------------------------------
    $linkedUser = null;
    foreach ($dbObj->data['users'] as $u) {
        if (!empty($u['baleChatId']) && strval($u['baleChatId']) === strval($chatId)) {
            $linkedUser = $u;
            break;
        }
    }

    // -------------------------------------------------------------------------
    // HANDLE TASK CREATION VIA TEXT (/task or plain text when linked)
    // -------------------------------------------------------------------------
    if (preg_match('/^\/(task|new)\s+(.+)$/is', $text, $matches) || (!empty($linkedUser) && mb_strlen($text, 'UTF-8') > 3 && !in_array($text, ['/start', '/help', '/tasks', 'تسک‌ها']))) {
        if (!$linkedUser) {
            $notLinkedMsg = "⚠️ **حساب کاربری شما هنوز به بگ تایم متصل نیست!**\n\nجهت استفاده، ابتدا دکمه زیر را برای تأیید حساب لمس کنید:";
            sendBaleMessage($botToken, $chatId, $notLinkedMsg, getMainMenuKeyboard());
            echo json_encode(['ok' => true]);
            exit;
        }

        $rawTask = !empty($matches[2]) ? trim($matches[2]) : $text;
        $taskTitle = $rawTask;
        $taskTime = null;
        $taskDate = date('Y-m-d');

        if (preg_match('/(?:ساعت|at)\s*(\d{1,2})(?::(\d{2}))?/u', $rawTask, $tm)) {
            $hour = str_pad($tm[1], 2, '0', STR_PAD_LEFT);
            $min = isset($tm[2]) ? str_pad($tm[2], 2, '0', STR_PAD_LEFT) : '00';
            $taskTime = "{$hour}:{$min}";
            $taskTitle = trim(preg_replace('/(?:ساعت|at)\s*\d{1,2}(?::\d{2})?/u', '', $taskTitle));
        }

        if (strpos($rawTask, 'فردا') !== false) {
            $taskDate = date('Y-m-d', strtotime('+1 day'));
            $taskTitle = trim(str_replace('فردا', '', $taskTitle));
        }

        $newTaskId = 'task_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        if (!isset($dbObj->data['tasks'])) $dbObj->data['tasks'] = [];
        
        $dbObj->data['tasks'][] = [
            'id' => $newTaskId,
            'title' => $taskTitle,
            'completed' => false,
            'date' => $taskDate,
            'time' => $taskTime,
            'priority' => 'medium',
            'categoryId' => 'general',
            'userId' => $linkedUser['id'],
            'createdAt' => date('Y-m-d H:i:s'),
        ];
        $dbObj->saveJson();

        $reply = "✅ **وظیفه جدید در تقویم شما ثبت شد:**\n\n" .
            "📌 **عنوان:** {$taskTitle}\n" .
            "📅 **تاریخ:** " . ($taskDate === date('Y-m-d') ? 'امروز' : 'فردا') . "\n" .
            ($taskTime ? "⏰ **ساعت:** {$taskTime}\n" : "") .
            "⚡ تسک در اپلیکیشن بگ تایم همگام شد.";

        $taskSavedKb = [
            'inline_keyboard' => [
                [
                    ['text' => '📋 مشاهده کارهای من', 'callback_data' => 'my_tasks'],
                    ['text' => '➕ ثبت تسک دیگر', 'callback_data' => 'new_task'],
                ],
                [
                    ['text' => '🔙 منوی اصلی', 'callback_data' => 'main_menu'],
                ],
            ]
        ];

        sendBaleMessage($botToken, $chatId, $reply, $taskSavedKb);
        echo json_encode(['ok' => true]);
        exit;
    }

    // -------------------------------------------------------------------------
    // DEFAULT: GREETING WITH GLASS BUTTONS
    // -------------------------------------------------------------------------
    $senderName = $fromUser['first_name'] ?? 'همکار';
    $greeting = "سلام {$senderName} عزیز! به بازوی رسمی «بگ تایم» خوش آمدید ⏱️✨\n\n" .
        "جهت دسترسی به امکانات، یکی از دکمه‌های شیشه‌ای زیر را انتخاب کنید:";

    sendBaleMessage($botToken, $chatId, $greeting, getMainMenuKeyboard());
    echo json_encode(['ok' => true]);
    exit;
}

// 4. Send outbound notification to user via Bale
if ($action === 'notify') {
    $userId = $_POST['userId'] ?? ($_GET['userId'] ?? '');
    $text = trim($_POST['text'] ?? ($_GET['text'] ?? ''));

    if (empty($botToken) || empty($baleConfig['sendNotifications'])) {
        jsonResponse(['error' => 'ارسال نوتیفیکیشن بله فعال نیست.'], 400);
    }

    $targetUser = null;
    foreach ($dbObj->data['users'] as $u) {
        if ($u['id'] === $userId || ($u['username'] ?? '') === $userId) {
            $targetUser = $u;
            break;
        }
    }

    if (!$targetUser || empty($targetUser['baleChatId'])) {
        jsonResponse(['error' => 'شناسه چت بله برای این کاربر ثبت نشده است.'], 404);
    }

    $res = sendBaleMessage($botToken, $targetUser['baleChatId'], $text);
    jsonResponse(['ok' => !empty($res['ok']), 'baleResponse' => $res]);
}

jsonResponse(['error' => 'اکشن نامعتبر است.'], 400);
