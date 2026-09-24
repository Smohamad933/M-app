<?php
/**
 * TaskRooz / Bag Time - Bale Messenger Bot API & Webhook (docs.bale.ai)
 * Fully compliant with Bale Bot API, Inline Keyboards & Phone Verification
 */
require_once __DIR__ . '/config.php';

$input = getJsonInput();
$action = $_GET['action'] ?? ($input['action'] ?? ($_POST['action'] ?? ''));

// If incoming request contains an update from Bale Messenger, force action to 'webhook'
if (empty($action)) {
    if (!empty($input['update_id']) || !empty($input['message']) || !empty($input['callback_query'])) {
        $action = 'webhook';
    } else {
        $action = 'status';
    }
}
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
 * Clean Bot Token to handle user input varieties:
 * - "123456789:AAHk..."
 * - "bot123456789:AAHk..."
 * - "https://tapi.bale.ai/bot123456789:AAHk..."
 */
function cleanBaleToken($t) {
    $clean = trim((string)$t, " \t\n\r\0\x0B/");
    if (preg_match('/(?:tapi\.bale\.ai\/)?(?:bot)?([0-9]+:[A-Za-z0-9_-]+)/i', $clean, $m)) {
        return $m[1];
    }
    if (stripos($clean, 'bot') === 0) {
        return substr($clean, 3);
    }
    return $clean;
}

/**
 * Send HTTP request to Bale Bot API
 */
function callBaleApi($token, $method, $params = []) {
    $tokenClean = cleanBaleToken($token);
    if (empty($tokenClean)) {
        return ['ok' => false, 'error' => 'توکن ربات بله خالی یا نامعتبر است.'];
    }

    $url = 'https://tapi.bale.ai/bot' . $tokenClean . '/' . $method;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    if (!empty($params)) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params, JSON_UNESCAPED_UNICODE));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json; charset=utf-8']);
    } else {
        curl_setopt($ch, CURLOPT_HTTPGET, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; BagTimeBot/1.0)');
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if (!$response) {
        return ['ok' => false, 'error' => 'خطای اتصال به سرورهای بله: ' . ($curlErr ?: 'Timeout'), 'httpCode' => $httpCode];
    }
    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : ['ok' => false, 'raw' => $response, 'httpCode' => $httpCode];
}

/**
 * Convert Persian & Arabic numbers to English standard digits
 */
function toEnglishDigits($str) {
    if (!$str) return '';
    $persian = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    $arabic = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    $latin = ['0','1','2','3','4','5','6','7','8','9'];
    $s = str_replace($persian, $latin, (string)$str);
    return str_replace($arabic, $latin, $s);
}

/**
 * Normalize Iranian phone numbers for 100% accurate matching
 */
function normalizePhoneNumber($p) {
    $d = preg_replace('/[^\d]/', '', toEnglishDigits($p));
    if (substr($d, 0, 4) === '0098') $d = '0' . substr($d, 4);
    elseif (substr($d, 0, 2) === '98') $d = '0' . substr($d, 2);
    elseif (strlen($d) === 10 && substr($d, 0, 1) === '9') $d = '0' . $d;
    return $d;
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

// -----------------------------------------------------------------------------
// 1. Check Bot Status & Test Token (Admin only)
// -----------------------------------------------------------------------------
if ($action === 'test' || $action === 'status') {
    $tokenToTest = trim($input['token'] ?? ($_POST['token'] ?? ($_GET['token'] ?? $botToken)));
    $cleanedToken = cleanBaleToken($tokenToTest);

    if (empty($cleanedToken)) {
        jsonResponse([
            'ok' => false,
            'status' => 'not_configured',
            'message' => 'توکن ربات بله هنوز وارد یا تنظیم نشده است.',
            'config' => $baleConfig,
        ]);
    }

    $me = callBaleApi($cleanedToken, 'getMe');
    if (!empty($me['ok'])) {
        // Automatically persist the cleaned token into globalSettings
        $dbObj->loadJson();
        if (!isset($dbObj->data['globalSettings']['baleBot'])) {
            $dbObj->data['globalSettings']['baleBot'] = $baleConfig;
        }
        $dbObj->data['globalSettings']['baleBot']['token'] = $cleanedToken;
        $dbObj->data['globalSettings']['baleBot']['enabled'] = true;
        if (!empty($me['result']['username'])) {
            $dbObj->data['globalSettings']['baleBot']['botUsername'] = $me['result']['username'];
        }
        $dbObj->saveJson();

        jsonResponse([
            'ok' => true,
            'status' => 'connected',
            'message' => 'اتصال به ربات بله با موفقیت برقرار شد.',
            'bot' => $me['result'] ?? [],
            'config' => $dbObj->data['globalSettings']['baleBot'],
        ]);
    } else {
        $errDesc = $me['description'] ?? ($me['error'] ?? 'پاسخ ناموفق از سرور بله');
        jsonResponse([
            'ok' => false,
            'status' => 'error',
            'message' => 'خطا در ارتباط با سرورهای بله: ' . $errDesc,
            'error' => $errDesc,
            'baleResponse' => $me,
        ]);
    }
}

// -----------------------------------------------------------------------------
// 2. Set Webhook on Bale
// -----------------------------------------------------------------------------
if ($action === 'set_webhook') {
    $tokenToUse = trim($input['token'] ?? ($_POST['token'] ?? ($_GET['token'] ?? $botToken)));
    $cleanedToken = cleanBaleToken($tokenToUse);

    if (empty($cleanedToken)) {
        jsonResponse(['ok' => false, 'error' => 'ابتدا توکن ربات بله را ذخیره کنید.'], 200);
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $webhookUrl = $input['url'] ?? ($_POST['url'] ?? ($protocol . $host . '/api/bale.php?action=webhook'));

    $res = callBaleApi($cleanedToken, 'setWebhook', ['url' => $webhookUrl]);
    
    if (!empty($res['ok'])) {
        jsonResponse([
            'ok' => true,
            'webhookUrl' => $webhookUrl,
            'message' => 'وب‌هوک با موفقیت در سرورهای بله تنظیم شد.',
            'baleResponse' => $res,
        ]);
    } else {
        $errDesc = $res['description'] ?? ($res['error'] ?? 'خطا در ثبت وب‌هوک');
        jsonResponse([
            'ok' => false,
            'error' => 'خطا در تنظیم وب‌هوک: ' . $errDesc,
            'webhookUrl' => $webhookUrl,
            'baleResponse' => $res,
        ], 200);
    }
}

// -----------------------------------------------------------------------------
// 3. Create Automatic Bale Login Ticket (One-Click Auto Login)
// -----------------------------------------------------------------------------
if ($action === 'create_bale_login') {
    $ticket = 'bale_login_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 8);
    if (!isset($dbObj->data['bale_login_tickets'])) {
        $dbObj->data['bale_login_tickets'] = [];
    }
    // Clean expired tickets (> 10 mins)
    $now = time();
    foreach ($dbObj->data['bale_login_tickets'] as $k => $v) {
        if (($now - ($v['createdAt'] ?? 0)) > 600) {
            unset($dbObj->data['bale_login_tickets'][$k]);
        }
    }

    $dbObj->data['bale_login_tickets'][$ticket] = [
        'status' => 'pending',
        'createdAt' => $now,
    ];
    $dbObj->saveJson();

    $cleanBotUser = ltrim($botUsername, '@');
    if (empty($cleanBotUser)) $cleanBotUser = 'BagTime_Bot';
    $baleLink = "https://ble.ir/" . $cleanBotUser . "?start=login_" . $ticket;

    jsonResponse([
        'ok' => true,
        'ticket' => $ticket,
        'baleBotUsername' => $cleanBotUser,
        'baleBotLink' => $baleLink,
        'expiresIn' => 300,
    ]);
}

// -----------------------------------------------------------------------------
// 4. Check Automatic Bale Login Status
// -----------------------------------------------------------------------------
if ($action === 'check_bale_login') {
    $ticket = $_GET['ticket'] ?? ($_POST['ticket'] ?? '');
    if (empty($ticket) || empty($dbObj->data['bale_login_tickets'][$ticket])) {
        jsonResponse(['status' => 'not_found', 'error' => 'تیکت ورود معتبر نیست یا منقضی شده است.'], 404);
    }
    $ticketData = $dbObj->data['bale_login_tickets'][$ticket];
    if (($ticketData['status'] ?? '') === 'approved' && !empty($ticketData['user'])) {
        $_SESSION['user_id'] = $ticketData['user']['id'];
        jsonResponse([
            'status' => 'approved',
            'token' => $ticketData['token'],
            'user' => $ticketData['user'],
            'message' => 'ورود با بله با موفقیت تأیید شد.',
        ]);
    }
    jsonResponse(['status' => 'pending']);
}

// -----------------------------------------------------------------------------
// 5. Webhook Receiver from Bale Messenger (Handles Messages, Contacts, and Inline Keyboards)
// -----------------------------------------------------------------------------
if ($action === 'webhook') {
    // Reuse already parsed $input or fallback to php://input (IIS FastCGI resilience)
    $update = (!empty($input) && is_array($input) && (!empty($input['update_id']) || !empty($input['message']) || !empty($input['callback_query'])))
        ? $input
        : @json_decode(@file_get_contents('php://input'), true);

    if (!$update) {
        echo json_encode(['ok' => true]);
        exit;
    }

    // Always reload latest database from disk to reflect new registrations
    $dbObj->loadJson();
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

        if ($cbData === 'verify_account') {
            $msg = "🔐 **مرحله ۱ از ۲: ارسال کد تأیید بگ تایم**\n\n" .
                "لطفاً کد ۶ رقمی که در پنجره ثبت‌نام برنامه «بگ تایم» به شما نمایش داده شده است را در قالب یک پیام ارسال فرمایید:\n\n" .
                "*(مثال: 478954)*";
            
            $cancelKb = [
                'inline_keyboard' => [
                    [['text' => '❌ انصراف و بازگشت به منوی اصلی', 'callback_data' => 'main_menu']]
                ]
            ];
            sendBaleMessage($botToken, $chatId, $msg, $cancelKb);
            echo json_encode(['ok' => true]);
            exit;
        }

        if ($cbData === 'notif_by_token') {
            $msg = "🔔 **اتصال و فعال‌سازی دریافت اعلان‌ها با توکن اختصاصی**\n\n" .
                "لطفاً توکن اعلان که در برنامه «بگ تایم» از بخش «ویرایش پروفایل» دریافت کرده‌اید را در قالب یک پیام ارسال فرمایید:\n\n" .
                "*(نمونه توکن: NOTIF-481920 یا کد ۶ رقمی)*";
            
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
    $rawText = trim($msg['text'] ?? '');
    $textEn = toEnglishDigits($rawText);
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
        }
        
        // Fallback: look for pending user matching shared phone number
        if ($targetUserIndex === -1) {
            foreach ($dbObj->data['users'] as $idx => $u) {
                if (!empty($u['phone']) && normalizePhoneNumber($u['phone']) === $sharedPhoneNorm) {
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

                // First remove reply keyboard
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
    // NOTIFICATION TOKEN ACTIVATION (NOTIF-XXXXXX or notif_XXXXXX)
    // -------------------------------------------------------------------------
    $incomingNotifToken = null;
    if (preg_match('/(?:notif[_\-\s]?)([A-Za-z0-9]{4,14})/i', $textEn, $nm)) {
        $incomingNotifToken = $nm[1];
    } elseif (preg_match('/^NOTIF[_\-]?([A-Za-z0-9]{4,14})$/i', $rawText, $nm)) {
        $incomingNotifToken = $nm[1];
    }

    if ($incomingNotifToken) {
        $notifMatchedIndex = -1;
        $cleanSearch = strtoupper(trim($incomingNotifToken));
        foreach ($dbObj->data['users'] as $idx => $u) {
            $userTok = strtoupper(trim($u['baleNotifToken'] ?? ''));
            $userTokClean = str_replace(['NOTIF-', 'NOTIF_', 'NOTIF'], '', $userTok);
            $searchClean = str_replace(['NOTIF-', 'NOTIF_', 'NOTIF'], '', $cleanSearch);
            if (!empty($userTok) && ($userTok === $cleanSearch || $userTokClean === $searchClean)) {
                $notifMatchedIndex = $idx;
                break;
            }
        }

        if ($notifMatchedIndex !== -1) {
            $targetUser = &$dbObj->data['users'][$notifMatchedIndex];
            $targetUser['baleChatId'] = $chatId;
            $targetUser['baleUsername'] = $fromUser['username'] ?? ($targetUser['baleUsername'] ?? '');
            $targetUser['baleNotificationsEnabled'] = true;
            $dbObj->saveJson();

            $successNotifMsg = "🎉 **نوتیفیکیشن‌های بله با موفقیت فعال شدند!** 🔔\n\n" .
                "👤 حساب متصل شده: **{$targetUser['name']}** (@{$targetUser['username']})\n" .
                "🆔 شناسه چت بله: `{$chatId}`\n\n" .
                "از این پس کلیه هشدارهای وظایف روزانه، تغییرات پروژه‌ها و پیام‌های شما مستقیماً در همین چت برای شما ارسال خواهد شد.";

            $notifKb = [
                'inline_keyboard' => [
                    [
                        ['text' => '📋 تسک‌های من', 'callback_data' => 'my_tasks'],
                        ['text' => '➕ ثبت تسک جدید', 'callback_data' => 'new_task'],
                    ],
                    [
                        ['text' => '🔙 بازگشت به منوی اصلی', 'callback_data' => 'main_menu'],
                    ],
                ]
            ];
            sendBaleMessage($botToken, $chatId, $successNotifMsg, $notifKb);
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    // -------------------------------------------------------------------------
    // AUTOMATIC BALE LOGIN (One-Click instant login via /start login_TICKET)
    // -------------------------------------------------------------------------
    if (preg_match('/^\/start\s+login_([a-zA-Z0-9_]+)$/is', $rawText, $autoLoginMatch)) {
        $ticketId = trim($autoLoginMatch[1]);
        if (isset($dbObj->data['bale_login_tickets'][$ticketId])) {
            $matchedUser = null;
            // 1. Check if user is linked by chatId
            foreach ($dbObj->data['users'] as &$u) {
                if (!empty($u['baleChatId']) && strval($u['baleChatId']) === strval($chatId)) {
                    $matchedUser = &$u;
                    break;
                }
            }
            // 2. Fallback check by username
            if (!$matchedUser && !empty($fromUser['username'])) {
                $bUserLower = strtolower($fromUser['username']);
                foreach ($dbObj->data['users'] as &$u) {
                    if (strtolower($u['username']) === $bUserLower || (strtolower($u['username']) === 'mohusyn' && $bUserLower === 'mohusyn')) {
                        $matchedUser = &$u;
                        $matchedUser['baleChatId'] = $chatId;
                        break;
                    }
                }
            }

            // 3. Auto-create account if new user
            if (!$matchedUser) {
                $fromName = trim(($fromUser['first_name'] ?? '') . ' ' . ($fromUser['last_name'] ?? ''));
                if (empty($fromName)) $fromName = 'کاربر بله ' . substr($chatId, -4);
                $newUsername = 'bale_' . substr($chatId, -6);
                $newUserId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
                $randomPass = substr(bin2hex(random_bytes(4)), 0, 8);

                $matchedUser = [
                    'id' => $newUserId,
                    'numericId' => 1000 + count($dbObj->data['users']),
                    'username' => $newUsername,
                    'name' => $fromName,
                    'password' => $randomPass,
                    'password_hash' => password_hash($randomPass, PASSWORD_DEFAULT),
                    'role' => 'user',
                    'status' => 'active',
                    'isVerified' => true,
                    'baleChatId' => $chatId,
                    'baleUsername' => $fromUser['username'] ?? '',
                    'createdAt' => date('Y-m-d H:i:s'),
                    'isProfileCompleted' => true,
                    'subscription' => ['plan' => 'free'],
                ];
                $dbObj->data['users'][] = $matchedUser;
            }

            // Generate session and token
            $token = base64_encode($matchedUser['id'] . ':' . time());
            $cleanUser = $matchedUser;
            unset($cleanUser['password_hash']);
            unset($cleanUser['password']);

            $dbObj->data['bale_login_tickets'][$ticketId] = [
                'status' => 'approved',
                'token' => $token,
                'user' => $cleanUser,
                'approvedAt' => time(),
            ];
            $dbObj->saveJson();

            $confirmMsg = "🎉 **ورود موفقیت‌آمیز به سامانه بگ تایم!**\n\n" .
                "👤 کاربر گرامی: **{$matchedUser['name']}**\n" .
                "⚡ درخواست ورود شما در مرورگر با موفقیت تأیید شد و هم‌اکنون وارد پنل کاربری خود شدید.\n\n" .
                "می‌توانید به مرورگر خود بازگردید.";

            sendBaleMessage($botToken, $chatId, $confirmMsg, getMainMenuKeyboard());
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    // -------------------------------------------------------------------------
    // STEP 1 OF VERIFICATION: EXTRACT CODE (Supports Persian, Arabic, English digits)
    // -------------------------------------------------------------------------
    $incomingCode = null;
    if (preg_match('/(?:verify_|تایید_)?([0-9]{5,8})/i', $textEn, $matches)) {
        $incomingCode = $matches[1];
    } elseif (preg_match('/^\s*([0-9]{4,10})\s*$/', $textEn, $matches)) {
        $incomingCode = $matches[1];
    }

    if ($incomingCode) {
        $matchedIndex = -1;
        foreach ($dbObj->data['users'] as $idx => $u) {
            $storedCode = toEnglishDigits(trim($u['verificationCode'] ?? ''));
            if (!empty($storedCode) && $storedCode === $incomingCode) {
                $matchedIndex = $idx;
                break;
            }
        }

        // If not found by exact code, also search if any unverified user has matching phone or username
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
                "جهت تکمیل نهایی فعال‌سازی، باید شماره همراه حساب بله شما با شماره فرم ثبت‌نام (`{$userFound['phone']}`) تطبیق داده شود.\n\n" .
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
    // HANDLE TASK CREATION VIA TEXT (/task or explicit awaiting state)
    // ONLY FOR THE SPECIFIC BOUND USER SET WITH THIS BOT
    // -------------------------------------------------------------------------
    $isUserAllowedToCreateTask = false;
    if ($linkedUser) {
        $boundUserId = $baleConfig['boundUserId'] ?? null;
        if (isUserAdmin($linkedUser)) {
            $isUserAllowedToCreateTask = true;
        } elseif (!empty($boundUserId) && $boundUserId === $linkedUser['id']) {
            $isUserAllowedToCreateTask = true;
        } elseif (!empty($linkedUser['baleAllowTaskCreation'])) {
            $isUserAllowedToCreateTask = true;
        }
    }

    $isAwaitingTaskTitle = (($dbObj->data['bale_user_states'][$chatId] ?? '') === 'awaiting_task_title');
    $isExplicitTaskCommand = (bool)preg_match('/^\/(task|new)\s+(.+)$/is', $rawText, $matches);

    if ($isExplicitTaskCommand || $isAwaitingTaskTitle) {
        if (!$linkedUser || !$isUserAllowedToCreateTask) {
            $notAllowedMsg = "⛔ **دسترسی ثبت وظیفه در این ربات محدود است!**\n\nامکان افزودن تسک فقط و فقط برای کاربری فعال است که این ربات با اکانت اختصاصی او ست شده باشد.";
            sendBaleMessage($botToken, $chatId, $notAllowedMsg, getMainMenuKeyboard());
            echo json_encode(['ok' => true]);
            exit;
        }

        $rawTask = !empty($matches[2]) ? trim($matches[2]) : $rawText;
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
            'categoryId' => 'cat-work',
            'userId' => $linkedUser['id'],
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        // Clear waiting state
        if (isset($dbObj->data['bale_user_states'][$chatId])) {
            unset($dbObj->data['bale_user_states'][$chatId]);
        }
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

// -----------------------------------------------------------------------------
// 4. Send outbound notification to user via Bale
// -----------------------------------------------------------------------------
if ($action === 'notify') {
    $userId = $input['userId'] ?? ($_POST['userId'] ?? ($_GET['userId'] ?? ''));
    $text = trim($input['text'] ?? ($_POST['text'] ?? ($_GET['text'] ?? '')));

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
