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

// Retrieve global settings from MySQL or JSON properly
$globalSettings = $dbObj->getGlobalSettings();
$baleConfig = $globalSettings['baleBot'] ?? [
    'enabled' => false,
    'token' => '',
    'botUsername' => 'BagTime_Bot',
    'providerToken' => '',
    'verifyOnRegister' => true,
    'sendNotifications' => true,
    'allowTaskCreation' => true,
];

$botToken = trim($baleConfig['token'] ?? '');
$botUsername = trim($baleConfig['botUsername'] ?? 'BagTime_Bot');
$providerToken = trim($baleConfig['providerToken'] ?? '');

function logBale($tag, $data = null) {
    try {
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        $file = $dir . DIRECTORY_SEPARATOR . 'bale.log';
        $time = date('Y-m-d H:i:s');
        $content = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE);
        @file_put_contents($file, "[{$time}] {$tag}: {$content}\n", FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {}
}

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

function getBaleTicketsData() {
    $filePath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'bale_tickets.json';
    if (file_exists($filePath)) {
        $raw = @file_get_contents($filePath);
        $data = $raw ? @json_decode($raw, true) : null;
        if (is_array($data)) return $data;
    }
    return [];
}

function saveBaleTicketsData($tickets) {
    $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    $filePath = $dir . DIRECTORY_SEPARATOR . 'bale_tickets.json';
    @file_put_contents($filePath, json_encode($tickets, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    @chmod($filePath, 0666);
}

/**
 * Send HTTP request to Bale Bot API
 */
function callBaleApi($token, $method, $params = []) {
    $tokenClean = cleanBaleToken($token);
    if (empty($tokenClean)) {
        logBale("CALL_FAILED_{$method}", 'Empty bot token');
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
        logBale("CURL_ERROR_{$method}", ['err' => $curlErr, 'http' => $httpCode]);
        return ['ok' => false, 'error' => 'خطای اتصال به سرورهای بله: ' . ($curlErr ?: 'Timeout'), 'httpCode' => $httpCode];
    }
    $decoded = json_decode($response, true);
    logBale("BALE_API_{$method}", ['http' => $httpCode, 'response' => $decoded]);
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
 * Dual-server user broadcast helper
 */
function broadcastBaleUserToPeer($user) {
    if (empty($user) || !is_array($user)) return;
    try {
        $currHost = $_SERVER['HTTP_HOST'] ?? '';
        $peerHost = (strpos($currHost, 'task.mohusyn.ir') !== false) 
            ? 'https://bagtime.negahm.ir' 
            : 'https://task.mohusyn.ir';
        $clean = $user;
        unset($clean['password_hash']);
        unset($clean['password']);
        $postBody = json_encode(['user' => $clean]);
        $chPeer = curl_init("{$peerHost}/api/bale.php?action=sync_user");
        curl_setopt($chPeer, CURLOPT_POST, true);
        curl_setopt($chPeer, CURLOPT_POSTFIELDS, $postBody);
        curl_setopt($chPeer, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($chPeer, CURLOPT_TIMEOUT, 2);
        curl_setopt($chPeer, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($chPeer, CURLOPT_SSL_VERIFYHOST, false);
        @curl_exec($chPeer);
        @curl_close($chPeer);
    } catch (Exception $e) {}
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
                ['text' => '💎 خرید و تمدید اشتراک ویژه (پرداخت در بله)', 'callback_data' => 'buy_subscription'],
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

/**
 * Subscription Plans Definition for Bale Payment
 */
function getBaleSubscriptionPlans() {
    return [
        'plus' => [
            'key' => 'plus',
            'type' => '1_month',
            'title' => 'اشتراک پلاس (۱ ماهه)',
            'desc' => 'دسترسی ۳۰ روزه به امکانات پیشرفته بگ تایم',
            'amountRials' => 2900000,
            'amountTomans' => '۲۹۰,۰۰۰ تومان',
            'days' => 30,
        ],
        'pro' => [
            'key' => 'pro',
            'type' => '3_months',
            'title' => 'اشتراک پرو (۳ ماهه)',
            'desc' => 'دسترسی ۹۰ روزه به پروژه‌های تیمی و فضای ابری بگ تایم',
            'amountRials' => 6900000,
            'amountTomans' => '۶۹۰,۰۰۰ تومان',
            'days' => 90,
        ],
        'ultra' => [
            'key' => 'ultra',
            'type' => '6_months',
            'title' => 'اشتراک اولترا (۶ ماهه)',
            'desc' => 'دسترسی ۱۸۰ روزه نامحدود و نماد الماس در پروفایل',
            'amountRials' => 11900000,
            'amountTomans' => '۱,۱۹۰,۰۰۰ تومان',
            'days' => 180,
        ],
    ];
}

/**
 * Dispatch official sendInvoice or interactive payment card in Bale
 * According to official docs: https://docs.bale.ai/#پرداخت
 */
function sendBalePlanInvoice($botToken, $baleConfig, $chatId, $planKey, $userId = null) {
    global $dbObj;
    $plans = getBaleSubscriptionPlans();
    if ($planKey === '1_month') $planKey = 'plus';
    if ($planKey === '3_months') $planKey = 'pro';
    if ($planKey === '6_months') $planKey = 'ultra';
    $selectedPlan = $plans[$planKey] ?? $plans['pro'];

    $providerToken = trim($baleConfig['providerToken'] ?? '');
    $uId = $userId ?: 'anon';
    $payload = "sub:{$uId}:{$selectedPlan['key']}:" . time();

    // In Bale, title must be between 1 and 32 characters!
    $cleanTitle = mb_substr($selectedPlan['title'], 0, 32);
    // Description between 1 and 255 characters
    $cleanDesc = mb_substr($selectedPlan['desc'], 0, 255);

    $invoiceSent = false;
    if (!empty($providerToken)) {
        // Official Bale Bot Payment: sendInvoice
        $invoiceParams = [
            'chat_id' => $chatId,
            'title' => $cleanTitle,
            'description' => $cleanDesc,
            'payload' => $payload,
            'provider_token' => $providerToken,
            'prices' => [
                [
                    'label' => $cleanTitle,
                    'amount' => (int)$selectedPlan['amountRials'],
                ],
            ],
        ];

        $invoiceRes = callBaleApi($botToken, 'sendInvoice', $invoiceParams);
        logBale('sendInvoice_result', ['res' => $invoiceRes, 'params' => $invoiceParams]);
        if (!empty($invoiceRes['ok'])) {
            $invoiceSent = true;
        }
    }

    if (!$invoiceSent) {
        $invoiceCard = "🧾 **فاکتور پرداخت اشتراک ویژه بگ تایم** 💳\n\n" .
            "📦 طرح انتخابی: **{$selectedPlan['title']}**\n" .
            "⏱️ مدت زمان: **{$selectedPlan['days']} روز**\n" .
            "💰 مبلغ قابل پرداخت: **{$selectedPlan['amountTomans']}**\n\n" .
            ($providerToken ? "⚠️ ارتباط مستقیم با درگاه برقرار نشد، می‌توانید از دکمه پرداخت زیر استفاده فرمایید:\n\n" : "🔹 پرداخت مستقیماً از طریق درگاه کیف پول بله و تمامی کارت‌های عضو شتاب انجام می‌شود.\n\n") .
            "جهت تکمیل پرداخت، روی گزینه زیر ضربه بزنید:";

        $invoiceKb = [
            'inline_keyboard' => [
                [
                    [
                        'text' => "💳 پرداخت آنلاین {$selectedPlan['amountTomans']} با بله",
                        'callback_data' => "sim_pay_{$selectedPlan['key']}_{$uId}",
                    ],
                ],
                [
                    ['text' => '🔄 انتخاب طرح دیگر', 'callback_data' => 'buy_subscription'],
                    ['text' => '🔙 بازگشت به منوی اصلی', 'callback_data' => 'main_menu'],
                ],
            ],
        ];

        sendBaleMessage($botToken, $chatId, $invoiceCard, $invoiceKb);
    }
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
        // Automatically persist the cleaned token into globalSettings (MySQL and JSON)
        $currSettings = $dbObj->getGlobalSettings();
        if (!isset($currSettings['baleBot'])) {
            $currSettings['baleBot'] = $baleConfig;
        }
        $currSettings['baleBot']['token'] = $cleanedToken;
        $currSettings['baleBot']['enabled'] = true;
        if (!empty($me['result']['username'])) {
            $currSettings['baleBot']['botUsername'] = $me['result']['username'];
        }
        $dbObj->updateGlobalSettings($currSettings);

        jsonResponse([
            'ok' => true,
            'status' => 'connected',
            'message' => 'اتصال به ربات بله با موفقیت برقرار شد.',
            'bot' => $me['result'] ?? [],
            'config' => $currSettings['baleBot'],
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

    $rawUrl = trim($input['url'] ?? ($_POST['url'] ?? ''));
    if (empty($rawUrl)) {
        $host = $_SERVER['HTTP_HOST'] ?? 'task.mohusyn.ir';
        $rawUrl = 'https://' . $host . '/api/bale.php?action=webhook';
    }
    // Bale API strictly requires HTTPS protocol! Force https://
    if (strpos($rawUrl, 'http://') === 0) {
        $rawUrl = 'https://' . substr($rawUrl, 7);
    }
    $webhookUrl = $rawUrl;

    $res = callBaleApi($cleanedToken, 'setWebhook', ['url' => $webhookUrl]);
    
    if (!empty($res['ok'])) {
        $currSettings = $dbObj->getGlobalSettings();
        if (isset($currSettings['baleBot'])) {
            $currSettings['baleBot']['webhookUrl'] = $webhookUrl;
            $dbObj->updateGlobalSettings($currSettings);
        }
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
// Get Current Webhook Info (Inspect whether Bale is connected to our URL)
// -----------------------------------------------------------------------------
if ($action === 'get_webhook_info') {
    $tokenToUse = trim($input['token'] ?? ($_POST['token'] ?? ($_GET['token'] ?? $botToken)));
    $cleanedToken = cleanBaleToken($tokenToUse);
    $res = callBaleApi($cleanedToken, 'getWebhookInfo');
    jsonResponse($res);
}

// -----------------------------------------------------------------------------
// Test Payment Provider Token via sendInvoice
// -----------------------------------------------------------------------------
if ($action === 'test_invoice') {
    $tokenToUse = trim($input['token'] ?? ($_POST['token'] ?? ($_GET['token'] ?? $botToken)));
    $cleanedToken = cleanBaleToken($tokenToUse);
    $provToken = trim($input['providerToken'] ?? ($_POST['providerToken'] ?? ($baleConfig['providerToken'] ?? '')));
    $chatId = trim($input['chatId'] ?? ($_POST['chatId'] ?? ''));

    if (empty($cleanedToken)) {
        jsonResponse(['ok' => false, 'error' => 'توکن بازوی بله الزامی است.'], 200);
    }
    if (empty($provToken)) {
        jsonResponse(['ok' => false, 'error' => 'توکن درگاه پرداخت کیف‌پول الزامی است.'], 200);
    }
    if (empty($chatId)) {
        jsonResponse(['ok' => false, 'error' => 'جهت ارسال فاکتور آزمایشی، شناسه عددی چت (Chat ID) الزامی است.'], 200);
    }

    $res = callBaleApi($cleanedToken, 'sendInvoice', [
        'chat_id' => $chatId,
        'title' => 'فاکتور تستی بگ تایم',
        'description' => 'تست عملکرد درگاه پرداخت و اتصال به کیف‌پول بله',
        'payload' => 'test_invoice_' . time(),
        'provider_token' => $provToken,
        'prices' => [
            ['label' => 'فاکتور تست', 'amount' => 10000],
        ],
    ]);

    jsonResponse([
        'ok' => !empty($res['ok']),
        'result' => $res,
        'message' => !empty($res['ok']) ? 'درخواست فاکتور با موفقیت به بله ارسال شد.' : ('خطای ارسال فاکتور: ' . ($res['description'] ?? 'عدم تأیید بله')),
    ]);
}

// -----------------------------------------------------------------------------
// 3. Create Automatic Bale Login Ticket (One-Click Auto Login)
// -----------------------------------------------------------------------------
if ($action === 'create_bale_login') {
    $ticket = 'bale_login_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 8);
    $tickets = getBaleTicketsData();
    // Clean expired tickets (> 10 mins)
    $now = time();
    foreach ($tickets as $k => $v) {
        if (($now - ($v['createdAt'] ?? 0)) > 600) {
            unset($tickets[$k]);
        }
    }

    $tickets[$ticket] = [
        'status' => 'pending',
        'createdAt' => $now,
    ];
    saveBaleTicketsData($tickets);

    $cleanBotUser = ltrim($botUsername, '@');
    if (empty($cleanBotUser)) $cleanBotUser = 'BagTime_Bot';
    $baleLink = "https://ble.ir/" . $cleanBotUser . "?start=" . $ticket;

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
    $ticket = trim($_GET['ticket'] ?? ($_POST['ticket'] ?? ''));
    $tickets = getBaleTicketsData();

    $foundTicket = $tickets[$ticket] ?? null;
    if (!$foundTicket) {
        // Try fuzzy match
        foreach ($tickets as $k => $v) {
            if ($k === $ticket || strpos($ticket, $k) !== false || strpos($k, $ticket) !== false) {
                $foundTicket = $v;
                break;
            }
        }
    }

    // If still not approved, check the sibling Bag Time server (dual-server failover sync)
    if (empty($_GET['no_peer']) && (!$foundTicket || ($foundTicket['status'] ?? '') !== 'approved')) {
        $currHost = $_SERVER['HTTP_HOST'] ?? '';
        $peerHost = (strpos($currHost, 'task.mohusyn.ir') !== false) 
            ? 'https://bagtime.negahm.ir' 
            : 'https://task.mohusyn.ir';
        
        $ch = curl_init("{$peerHost}/api/bale.php?action=check_bale_login&ticket=" . urlencode($ticket) . "&no_peer=1");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        $peerRaw = curl_exec($ch);
        curl_close($ch);
        if ($peerRaw) {
            $peerData = json_decode($peerRaw, true);
            if (!empty($peerData['status']) && $peerData['status'] === 'approved') {
                $tickets[$ticket] = [
                    'status' => 'approved',
                    'token' => $peerData['token'] ?? '',
                    'user' => $peerData['user'] ?? null,
                    'approvedAt' => time(),
                ];
                saveBaleTicketsData($tickets);
                $foundTicket = $tickets[$ticket];
            }
        }
    }

    if (!$foundTicket) {
        jsonResponse(['status' => 'not_found', 'error' => 'تیکت ورود معتبر نیست یا منقضی شده است.'], 404);
    }

    if (($foundTicket['status'] ?? '') === 'approved' && !empty($foundTicket['user'])) {
        $_SESSION['user_id'] = $foundTicket['user']['id'];
        jsonResponse([
            'status' => 'approved',
            'token' => $foundTicket['token'],
            'user' => $foundTicket['user'],
            'message' => 'ورود با بله با موفقیت تأیید شد.',
        ]);
    }
    jsonResponse(['status' => 'pending']);
}

// -----------------------------------------------------------------------------
// 4.2. Dual-Server Ticket & User Synchronization
// -----------------------------------------------------------------------------
if ($action === 'sync_ticket') {
    $data = getJsonInput();
    if (!empty($data['ticket']) && !empty($data['token']) && !empty($data['user'])) {
        $tickets = getBaleTicketsData();
        $tickets[$data['ticket']] = [
            'status' => 'approved',
            'token' => $data['token'],
            'user' => $data['user'],
            'approvedAt' => time(),
        ];
        saveBaleTicketsData($tickets);

        // Ensure user is created in local DB if not already present
        $u = $data['user'];
        $existing = $dbObj->getUserById($u['id'] ?? '');
        if (!$existing && !empty($u['username'])) {
            $existing = $dbObj->getUserByUsername($u['username']);
        }
        if (!$existing && !empty($u['username'])) {
            $dbObj->createUser($u['username'], bin2hex(random_bytes(5)), $u['name'] ?? $u['username'], $u['role'] ?? 'user', [
                'baleChatId' => $u['baleChatId'] ?? null,
                'baleUsername' => $u['baleUsername'] ?? null,
                'isVerified' => true,
                'status' => 'active',
                'phone' => $u['phone'] ?? '',
                'email' => $u['email'] ?? '',
            ]);
        }

        jsonResponse(['ok' => true]);
    }
    jsonResponse(['ok' => false]);
}

if ($action === 'sync_user') {
    $data = getJsonInput();
    if (!empty($data['user']) && is_array($data['user'])) {
        $u = $data['user'];
        $existing = $dbObj->getUserById($u['id'] ?? '');
        if (!$existing && !empty($u['username'])) {
            $existing = $dbObj->getUserByUsername($u['username']);
        }
        if (!$existing && !empty($u['username'])) {
            $dbObj->createUser($u['username'], bin2hex(random_bytes(5)), $u['name'] ?? $u['username'], $u['role'] ?? 'user', [
                'baleChatId' => $u['baleChatId'] ?? null,
                'baleUsername' => $u['baleUsername'] ?? null,
                'isVerified' => true,
                'status' => 'active',
                'phone' => $u['phone'] ?? '',
                'email' => $u['email'] ?? '',
            ]);
        }
        jsonResponse(['ok' => true]);
    }
    jsonResponse(['ok' => false]);
}

// -----------------------------------------------------------------------------
// 4.5. Create Bale Subscription Payment Invoice Link (for Web App)
// -----------------------------------------------------------------------------
if ($action === 'create_invoice' || $action === 'create_payment_invoice') {
    $user = getCurrentUser();
    if (!$user) {
        jsonResponse(['error' => 'ابتدا وارد حساب کاربری خود شوید.'], 401);
    }
    $rawReq = getJsonInput();
    $plan = $rawReq['plan'] ?? 'pro';
    $planType = $rawReq['planType'] ?? '3_months';

    $plansDef = getBaleSubscriptionPlans();
    if ($plan === '1_month') $plan = 'plus';
    if ($plan === '3_months') $plan = 'pro';
    if ($plan === '6_months') $plan = 'ultra';
    $planInfo = $plansDef[$plan] ?? $plansDef['pro'];

    $cleanBot = ltrim($botUsername, '@');
    if (empty($cleanBot)) $cleanBot = 'BagTime_Bot';

    $deepLink = "https://ble.ir/{$cleanBot}?start=pay_{$plan}_{$user['id']}";

    // Notice: Do NOT dispatch invoice directly here! The user opens $deepLink in Bale,
    // which triggers the bot to send the invoice exactly ONCE when the user clicks/starts it.

    jsonResponse([
        'ok' => true,
        'baleBotLink' => $deepLink,
        'baleBotUsername' => $cleanBot,
        'amountRials' => $planInfo['amountRials'],
        'amountTomans' => $planInfo['amountTomans'],
        'title' => $planInfo['title'],
        'directSentToBale' => false,
    ]);
}

// -----------------------------------------------------------------------------
// 5. Webhook Receiver from Bale Messenger (Handles Messages, Contacts, and Inline Keyboards)
// -----------------------------------------------------------------------------
$isWebhook = ($action === 'webhook') ||
    (empty($action) && $_SERVER['REQUEST_METHOD'] === 'POST' && (
        !empty($input['update_id']) ||
        !empty($input['message']) ||
        !empty($input['callback_query']) ||
        !empty($input['pre_checkout_query'])
    ));

if ($isWebhook) {
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
    $latestSettings = $dbObj->getGlobalSettings();
    if (!empty($latestSettings['baleBot']['token'])) {
        $botToken = trim($latestSettings['baleBot']['token']);
        $baleConfig = $latestSettings['baleBot'];
    } elseif (!empty($dbObj->data['globalSettings']['baleBot']['token'])) {
        $botToken = trim($dbObj->data['globalSettings']['baleBot']['token']);
        $baleConfig = $dbObj->data['globalSettings']['baleBot'];
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
        foreach ($dbObj->getAllUsers() as $u) {
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

        if ($cbData === 'buy_subscription') {
            $msg = "💎 **ارتقای حساب کاربری و خرید اشتراک ویژه بگ تایم** 🚀\n\n" .
                "با خرید اشتراک به تسک‌های نامحدود، پروژه‌های تیمی اختصاصی، اتاق‌های تمرکز طولانی و تمام امکانات حرفه‌ای دسترسی خواهید داشت.\n\n" .
                "👇 لطفاً طرح مورد نظر خود را جهت صدور فاکتور انتخاب فرمایید:";

            $plansKb = [
                'inline_keyboard' => [
                    [
                        ['text' => '➕ اشتراک ۱ ماهه پلاس (۲۹۰,۰۰۰ تومان)', 'callback_data' => 'select_plan_plus'],
                    ],
                    [
                        ['text' => '⭐ اشتراک ۳ ماهه پرو (۶۹۰,۰۰۰ تومان) [پیشنهادی]', 'callback_data' => 'select_plan_pro'],
                    ],
                    [
                        ['text' => '💎 اشتراک ۶ ماهه اولترا (۱,۱۹۰,۰۰۰ تومان)', 'callback_data' => 'select_plan_ultra'],
                    ],
                    [
                        ['text' => '🔙 بازگشت به منوی اصلی', 'callback_data' => 'main_menu'],
                    ],
                ],
            ];
            sendBaleMessage($botToken, $chatId, $msg, $plansKb);
            echo json_encode(['ok' => true]);
            exit;
        }

        if (strpos($cbData, 'select_plan_') === 0) {
            $planKey = str_replace('select_plan_', '', $cbData);
            $targetUserId = $primaryUser['id'] ?? null;
            sendBalePlanInvoice($botToken, $baleConfig, $chatId, $planKey, $targetUserId);
            echo json_encode(['ok' => true]);
            exit;
        }

        if (strpos($cbData, 'sim_pay_') === 0) {
            $parts = explode('_', str_replace('sim_pay_', '', $cbData));
            $planKey = $parts[0] ?? 'pro';
            $uid = $parts[1] ?? ($primaryUser['id'] ?? null);
            if (!$uid || $uid === 'current') {
                $uid = $primaryUser['id'] ?? null;
            }

            if ($uid) {
                $planType = $planKey === 'ultra' ? '6_months' : ($planKey === 'plus' ? '1_month' : '3_months');
                $days = $planKey === 'ultra' ? 180 : ($planKey === 'plus' ? 30 : 90);
                $expiresAt = date('Y-m-d H:i:s', time() + ($days * 86400));
                $planName = $planKey === 'ultra' ? 'اولترا (Ultra) 💎' : ($planKey === 'plus' ? 'پلاس (Plus) ➕' : 'پرو (Pro) ⭐');
                $amountStr = $planKey === 'ultra' ? '۱,۱۹۰,۰۰۰ تومان' : ($planKey === 'plus' ? '۲۹۰,۰۰۰ تومان' : '۶۹۰,۰۰۰ تومان');

                $dbObj->setUserSubscription($uid, $planKey, $planType, $expiresAt);

                if (!isset($dbObj->data['payments'])) {
                    $dbObj->data['payments'] = [];
                }
                $chargeId = 'BALE-TRX-' . rand(100000, 999999);
                $targetUser = $dbObj->getUserById($uid);
                $newPayment = [
                    'id' => 'pay_bale_' . time() . '_' . substr(bin2hex(random_bytes(2)), 0, 4),
                    'userId' => $uid,
                    'userName' => $targetUser['name'] ?? 'کاربر',
                    'userUsername' => $targetUser['username'] ?? '',
                    'plan' => $planKey,
                    'planType' => $planType,
                    'planLabel' => $planName,
                    'amount' => $amountStr,
                    'trackingCode' => $chargeId,
                    'paymentMethod' => 'bale_wallet',
                    'status' => 'approved',
                    'approvedAt' => date('Y-m-d H:i:s'),
                    'createdAt' => date('Y-m-d H:i:s'),
                ];
                $dbObj->data['payments'][] = $newPayment;
                $dbObj->saveJson();

                $host = $_SERVER['HTTP_HOST'] ?? 'task.mohusyn.ir';
                $webAppUrl = 'https://' . $host . '/index.html';

                $successMsg = "🎉 **پرداخت با موفقیت انجام شد!** ✅\n\n" .
                    "💎 اشتراک **{$planName}** به مدت **{$days} روز** برای حساب کاربری شما فعال گردید.\n" .
                    "🧾 کد پیگیری تراکنش بله: `{$chargeId}`\n\n" .
                    "می‌توانید به اپلیکیشن بازگردید و از امکانات نامحدود بگ تایم لذت ببرید.";

                $successKb = [
                    'inline_keyboard' => [
                        [['text' => '🌐 بازگشت به برنامه بگ تایم', 'url' => $webAppUrl]],
                        [['text' => '📋 مشاهده کارهای من', 'callback_data' => 'my_tasks']],
                    ]
                ];
                sendBaleMessage($botToken, $chatId, $successMsg, $successKb);
                echo json_encode(['ok' => true]);
                exit;
            }
        }

        echo json_encode(['ok' => true]);
        exit;
    }

    // =========================================================================
    // CASE 1.5: PRE_CHECKOUT_QUERY (Bale Official Payment Handshake)
    // =========================================================================
    if (!empty($update['pre_checkout_query'])) {
        $pcq = $update['pre_checkout_query'];
        $pcqId = $pcq['id'] ?? '';
        if ($pcqId) {
            callBaleApi($botToken, 'answerPreCheckoutQuery', [
                'pre_checkout_query_id' => $pcqId,
                'ok' => true,
            ]);
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
        $sharedFullName = trim(($contact['first_name'] ?? '') . ' ' . ($contact['last_name'] ?? ''));

        $pvFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'bale_pending.json';
        $pVerifs = [];
        if (file_exists($pvFile)) {
            $raw = @file_get_contents($pvFile);
            if ($raw) $pVerifs = @json_decode($raw, true) ?: [];
        }
        $pendingInfo = $pVerifs[strval($chatId)] ?? null;

        $targetUser = null;
        if ($pendingInfo && !empty($pendingInfo['userId'])) {
            $targetUser = $dbObj->getUserById($pendingInfo['userId']);
        }
        if (!$targetUser) {
            $targetUser = $dbObj->getUserByBaleChatId($chatId);
        }
        if (!$targetUser) {
            foreach ($dbObj->getAllUsers() as $u) {
                if (!empty($u['phone']) && normalizePhoneNumber($u['phone']) === $sharedPhoneNorm) {
                    $targetUser = $u;
                    break;
                }
            }
        }

        if ($targetUser) {
            $updateFields = [
                'phone' => $sharedPhoneNorm,
                'balePhoneNumber' => $contact['phone_number'],
                'isVerified' => true,
                'status' => 'active',
                'baleChatId' => $chatId,
                'baleUsername' => $fromUser['username'] ?? ($targetUser['baleUsername'] ?? ''),
            ];
            if (!empty($sharedFullName) && (empty($targetUser['name']) || strpos($targetUser['name'], 'کاربر بله') === 0 || strpos($targetUser['name'], 'bale_') === 0)) {
                $updateFields['name'] = $sharedFullName;
                $targetUser['name'] = $sharedFullName;
            }
            $dbObj->updateUserProfile($targetUser['id'], $updateFields);

            unset($pVerifs[strval($chatId)]);
            @file_put_contents($pvFile, json_encode($pVerifs, JSON_UNESCAPED_UNICODE), LOCK_EX);

            $host = $_SERVER['HTTP_HOST'] ?? 'task.mohusyn.ir';
            $webAppUrl = 'https://' . $host . '/index.html';

            // Remove reply keyboard first
            callBaleApi($botToken, 'sendMessage', [
                'chat_id' => $chatId,
                'text' => 'شماره تماس شما دریافت شد.',
                'reply_markup' => ['remove_keyboard' => true],
            ]);

            $finalSuccessMsg = "✨ **ثبت‌نام و مشخصات شما با موفقیت کامل تأیید شد!** 🎯\n\n" .
                "👤 نام: **{$targetUser['name']}**\n" .
                "📱 شماره همراه ثبت‌شده: `{$sharedPhoneNorm}`\n\n" .
                "🚀 اطلاعات حساب شما در پایگاه داده ذخیره گردید و ورود شما به برنامه بگ تایم فعال شد.";

            $finalKb = [
                'inline_keyboard' => [
                    [['text' => '🌐 بازگشت به برنامه بگ تایم', 'url' => $webAppUrl]],
                    [['text' => '📋 تسک‌های من', 'callback_data' => 'my_tasks']],
                    [['text' => '➕ ثبت تسک جدید', 'callback_data' => 'new_task']],
                ]
            ];
            sendBaleMessage($botToken, $chatId, $finalSuccessMsg, $finalKb);
            echo json_encode(['ok' => true, 'verified' => true]);
            exit;
        } else {
            $notFoundMsg = "⚠️ حسابی در انتظار احراز هویت با این شماره یافت نشد.\nلطفاً از منوی اصلی اقدام به اتصال حساب فرمایید.";
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
        $matchedUser = null;
        $cleanSearch = strtoupper(trim($incomingNotifToken));
        foreach ($dbObj->getAllUsers() as $u) {
            $userTok = strtoupper(trim($u['baleNotifToken'] ?? ''));
            $userTokClean = str_replace(['NOTIF-', 'NOTIF_', 'NOTIF'], '', $userTok);
            $searchClean = str_replace(['NOTIF-', 'NOTIF_', 'NOTIF'], '', $cleanSearch);
            if (!empty($userTok) && ($userTok === $cleanSearch || $userTokClean === $searchClean)) {
                $matchedUser = $u;
                break;
            }
        }

        if ($matchedUser) {
            $dbObj->updateUserProfile($matchedUser['id'], [
                'baleChatId' => $chatId,
                'baleUsername' => $fromUser['username'] ?? ($matchedUser['baleUsername'] ?? ''),
                'baleNotificationsEnabled' => true,
                'baleNotificationActive' => true,
            ]);

            $successNotifMsg = "🎉 **نوتیفیکیشن‌های بله با موفقیت فعال شدند!** 🔔\n\n" .
                "👤 حساب متصل شده: **{$matchedUser['name']}** (@{$matchedUser['username']})\n" .
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
    // OFFICIAL BALE PAYMENT SUCCESS (successful_payment)
    // -------------------------------------------------------------------------
    if (!empty($msg['successful_payment'])) {
        $sp = $msg['successful_payment'];
        $totalAmount = $sp['total_amount'] ?? 0;
        $payload = $sp['invoice_payload'] ?? '';
        $chargeId = $sp['provider_payment_charge_id'] ?? ($sp['telegram_payment_charge_id'] ?? ('bale_' . time()));

        $parts = explode('_', $payload);
        $targetUserId = null;
        $targetPlan = 'pro';
        if (count($parts) >= 3 && $parts[0] === 'sub') {
            $targetUserId = $parts[1];
            $targetPlan = $parts[2];
        }
        if (!$targetUserId || $targetUserId === 'anon') {
            $matched = $dbObj->getUserByBaleChatId($chatId);
            if ($matched) $targetUserId = $matched['id'];
        }

        if ($targetUserId) {
            $planType = $targetPlan === 'ultra' ? '6_months' : ($targetPlan === 'plus' ? '1_month' : '3_months');
            $days = $targetPlan === 'ultra' ? 180 : ($targetPlan === 'plus' ? 30 : 90);
            $expiresAt = date('Y-m-d H:i:s', time() + ($days * 86400));
            $planName = $targetPlan === 'ultra' ? 'اولترا (Ultra) 💎' : ($targetPlan === 'plus' ? 'پلاس (Plus) ➕' : 'پرو (Pro) ⭐');

            $dbObj->setUserSubscription($targetUserId, $targetPlan, $planType, $expiresAt);

            if (!isset($dbObj->data['payments'])) {
                $dbObj->data['payments'] = [];
            }
            $targetUser = $dbObj->getUserById($targetUserId);
            $newPayment = [
                'id' => 'pay_bale_' . time() . '_' . substr(bin2hex(random_bytes(2)), 0, 4),
                'userId' => $targetUserId,
                'userName' => $targetUser['name'] ?? 'کاربر',
                'userUsername' => $targetUser['username'] ?? '',
                'plan' => $targetPlan,
                'planType' => $planType,
                'planLabel' => $planName,
                'amount' => number_format($totalAmount / 10) . ' تومان',
                'trackingCode' => $chargeId,
                'paymentMethod' => 'bale_wallet',
                'status' => 'approved',
                'approvedAt' => date('Y-m-d H:i:s'),
                'createdAt' => date('Y-m-d H:i:s'),
            ];
            $dbObj->data['payments'][] = $newPayment;
            $dbObj->saveJson();

            $host = $_SERVER['HTTP_HOST'] ?? 'task.mohusyn.ir';
            $webAppUrl = 'https://' . $host . '/index.html';

            $successMsg = "🎉 **پرداخت شما با کیف پول بله با موفقیت انجام شد!** ✅\n\n" .
                "💎 اشتراک **{$planName}** به مدت **{$days} روز** برای حساب کاربری شما فعال گردید.\n" .
                "🧾 شماره پیگیری تراکنش بله: `{$chargeId}`\n\n" .
                "هم‌اکنون تمامی قابلیت‌های ویژه در برنامه برای شما فعال است.";

            $successKb = [
                'inline_keyboard' => [
                    [['text' => '🌐 بازگشت به برنامه بگ تایم', 'url' => $webAppUrl]],
                    [['text' => '📋 مشاهده کارهای من', 'callback_data' => 'my_tasks']],
                ]
            ];
            sendBaleMessage($botToken, $chatId, $successMsg, $successKb);
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    // -------------------------------------------------------------------------
    // BALE SUBSCRIPTION PAYMENT INVOICE (Deep-link: /start pay_PLAN_USERID)
    // -------------------------------------------------------------------------
    if (preg_match('/(?:^|\s)\/start\s+pay_([a-zA-Z0-9]+)_(usr_[a-zA-Z0-9_]+)/i', $rawText, $pm)) {
        $planKey = $pm[1];
        $targetUserId = $pm[2];

        // 30s de-duplication cache per chat
        $invLockKey = 'inv_lock_' . preg_replace('/[^0-9]/', '', strval($chatId));
        $lastInvTime = (int)($dbObj->data[$invLockKey] ?? 0);
        if ((time() - $lastInvTime) > 30) {
            $dbObj->data[$invLockKey] = time();
            sendBalePlanInvoice($botToken, $baleConfig, $chatId, $planKey, $targetUserId);
        }
        echo json_encode(['ok' => true]);
        exit;
    } elseif (preg_match('/(?:^|\s)\/start\s+pay_([a-zA-Z0-9_]+)/i', $rawText, $pm)) {
        $payParam = $pm[1];
        $parts = explode('_', $payParam);
        $planKey = $parts[0] ?? 'pro';
        $targetUserId = null;
        if (count($parts) > 1) {
            $targetUserId = substr($payParam, strlen($planKey) + 1);
        }
        if (!$targetUserId) {
            $u = $dbObj->getUserByBaleChatId($chatId);
            if ($u) $targetUserId = $u['id'];
        }

        $invLockKey = 'inv_lock_' . preg_replace('/[^0-9]/', '', strval($chatId));
        $lastInvTime = (int)($dbObj->data[$invLockKey] ?? 0);
        if ((time() - $lastInvTime) > 30) {
            $dbObj->data[$invLockKey] = time();
            sendBalePlanInvoice($botToken, $baleConfig, $chatId, $planKey, $targetUserId);
        }
        echo json_encode(['ok' => true]);
        exit;
    }

    // -------------------------------------------------------------------------
    // NOTIFICATION DEEP-LINK (/start notif_TOKEN)
    // -------------------------------------------------------------------------
    if (preg_match('/(?:^|\s)\/start\s+notif_([A-Za-z0-9_-]+)/i', $rawText, $nm)) {
        $notifToken = trim($nm[1]);
        $targetUser = null;
        $cleanSearch = strtoupper(str_replace(['NOTIF-', 'NOTIF_', 'notif_'], '', $notifToken));
        foreach ($dbObj->getAllUsers() as $u) {
            $uTok = strtoupper(str_replace(['NOTIF-', 'NOTIF_', 'notif_'], '', $u['baleNotifToken'] ?? ''));
            if (!empty($uTok) && $uTok === $cleanSearch) {
                $targetUser = $u;
                break;
            }
        }
        if ($targetUser) {
            $dbObj->updateUserProfile($targetUser['id'], [
                'baleChatId' => $chatId,
                'baleNotificationActive' => true,
            ]);
            $msg = "🎉 **اتصال اعلان‌ها با موفقیت انجام شد!** 🔔\n\n" .
                "حساب کاربری شما: **{$targetUser['name']}** (@{$targetUser['username']})\n" .
                "از این پس یادآورها، تغییرات وظایف و پیام‌های سامانه بگ تایم در این چت برای شما ارسال خواهند شد.";
            sendBaleMessage($botToken, $chatId, $msg, getMainMenuKeyboard());
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    // -------------------------------------------------------------------------
    // AUTOMATIC BALE LOGIN (One-Click instant login via /start login_TICKET or /start TICKET)
    // -------------------------------------------------------------------------
    $loginTicketMatch = null;
    if (preg_match('/(?:login_)?(bale_login_[a-zA-Z0-9_]+)/i', $rawText, $autoLoginMatch)) {
        $loginTicketMatch = trim($autoLoginMatch[1]);
    }

    if ($loginTicketMatch) {
        $tickets = getBaleTicketsData();
        $targetTicketKey = $loginTicketMatch;

        if (isset($tickets[$loginTicketMatch])) {
            $targetTicketKey = $loginTicketMatch;
        } else {
            // Fuzzy search key
            foreach ($tickets as $k => $v) {
                if ($k === $loginTicketMatch || strpos($loginTicketMatch, $k) !== false || strpos($k, $loginTicketMatch) !== false) {
                    $targetTicketKey = $k;
                    break;
                }
            }
        }

        $isNewUser = false;
        // 1. Check if user already linked by chatId
        $matchedUser = $dbObj->getUserByBaleChatId($chatId);

        // 2. Fallback check by Bale username
        if (!$matchedUser && !empty($fromUser['username'])) {
            $matchedUser = $dbObj->getUserByUsername($fromUser['username']);
            if ($matchedUser) {
                $dbObj->updateUserProfile($matchedUser['id'], ['baleChatId' => $chatId, 'baleUsername' => $fromUser['username']]);
                $matchedUser['baleChatId'] = $chatId;
            }
        }

        // 3. Fallback: Check if Mohusyn
        if (!$matchedUser && strtolower($fromUser['username'] ?? '') === 'mohusyn') {
            $matchedUser = $dbObj->getUserByUsername('Mohusyn');
            if ($matchedUser) {
                $dbObj->updateUserProfile($matchedUser['id'], ['baleChatId' => $chatId]);
                $matchedUser['baleChatId'] = $chatId;
            }
        }

        // 4. Auto-register user if brand new!
        if (!$matchedUser) {
            $isNewUser = true;
            $fromName = trim(($fromUser['first_name'] ?? '') . ' ' . ($fromUser['last_name'] ?? ''));
            if (empty($fromName)) $fromName = 'کاربر بله ' . substr(strval($chatId), -4);
            $cleanUname = !empty($fromUser['username']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $fromUser['username']) : ('bale_' . substr(strval($chatId), -6));
            if (empty($cleanUname)) $cleanUname = 'bale_' . substr(strval($chatId), -6);

            $testUname = $cleanUname;
            $counter = 1;
            while ($dbObj->getUserByUsername($testUname)) {
                $testUname = $cleanUname . '_' . $counter++;
            }

            $randomPass = substr(bin2hex(random_bytes(5)), 0, 10);
            $matchedUser = $dbObj->createUser($testUname, $randomPass, $fromName, 'user', [
                'baleChatId' => $chatId,
                'baleUsername' => $fromUser['username'] ?? '',
                'isVerified' => true,
                'status' => 'active',
            ]);
            broadcastBaleUserToPeer($matchedUser);
        }

        // Generate session and token
        $token = base64_encode($matchedUser['id'] . ':' . time());
        $cleanUser = $matchedUser;
        unset($cleanUser['password_hash']);
        unset($cleanUser['password']);

        $tickets[$targetTicketKey] = [
            'status' => 'approved',
            'token' => $token,
            'user' => $cleanUser,
            'approvedAt' => time(),
        ];
        saveBaleTicketsData($tickets);

        $host = $_SERVER['HTTP_HOST'] ?? 'task.mohusyn.ir';
        $webAppUrl = 'https://' . $host . '/index.html';
        $displayName = $matchedUser['name'] ?: $matchedUser['username'];

        // Send celebratory login confirmed message to Bale chat
        $confirmMsg = "🎉 **ورود شما به «بگ تایم» با موفقیت انجام شد!** ✅\n\n" .
            "👤 کاربر گرامی: **{$displayName}** (@{$matchedUser['username']})\n" .
            "⚡ حساب کاربری شما شناسایی و تأیید شد و ورود به برنامه انجام گرفت.\n\n" .
            "🔓 قفل افزونه مرورگر و پنل برنامه‌ریزی هم‌اکنون برای شما باز گردید.\n" .
            "می‌توانید به مرورگر خود بازگردید و از امکانات دستیار استفاده فرمایید ✨";

        $loginKb = [
            'inline_keyboard' => [
                [['text' => '🌐 بازگشت به سامانه بگ تایم', 'url' => $webAppUrl]],
                [
                    ['text' => '📋 کارهای امروز من', 'callback_data' => 'my_tasks'],
                    ['text' => '➕ ثبت تسک جدید', 'callback_data' => 'new_task'],
                ],
            ]
        ];
        $sentRes = sendBaleMessage($botToken, $chatId, $confirmMsg, $loginKb);
        logBale('BALE_LOGIN_SENT', ['chatId' => $chatId, 'user' => $matchedUser['username'], 'res' => $sentRes]);

        // Dual-server background synchronization (notify peer server so both know the ticket is approved)
        try {
            $currHost = $_SERVER['HTTP_HOST'] ?? '';
            $peerHost = (strpos($currHost, 'task.mohusyn.ir') !== false) 
                ? 'https://bagtime.negahm.ir' 
                : 'https://task.mohusyn.ir';
            $postBody = json_encode(['ticket' => $targetTicketKey, 'token' => $token, 'user' => $cleanUser]);
            $chPeer = curl_init("{$peerHost}/api/bale.php?action=sync_ticket");
            curl_setopt($chPeer, CURLOPT_POST, true);
            curl_setopt($chPeer, CURLOPT_POSTFIELDS, $postBody);
            curl_setopt($chPeer, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($chPeer, CURLOPT_TIMEOUT, 2);
            curl_setopt($chPeer, CURLOPT_SSL_VERIFYPEER, false);
            @curl_exec($chPeer);
            @curl_close($chPeer);
        } catch (Exception $e) {}

        echo json_encode(['ok' => true]);
        exit;
    }

    // -------------------------------------------------------------------------
    // PLAIN /start COMMAND: Greeting, auto-account creation, or auto-link recent pending session
    // -------------------------------------------------------------------------
    if (preg_match('/^\s*\/start\s*$/i', $rawText)) {
        $senderName = $fromUser['first_name'] ?? 'همکار';

        // 1. Always ensure an account exists for this Bale user in the database!
        $matchedUser = $dbObj->getUserByBaleChatId($chatId);
        if (!$matchedUser && !empty($fromUser['username'])) {
            $matchedUser = $dbObj->getUserByUsername($fromUser['username']);
        }
        if (!$matchedUser) {
            $fromName = trim(($fromUser['first_name'] ?? '') . ' ' . ($fromUser['last_name'] ?? ''));
            if (empty($fromName)) $fromName = 'کاربر بله ' . substr(strval($chatId), -4);
            $cleanUname = !empty($fromUser['username']) ? preg_replace('/[^a-zA-Z0-9_]/', '', $fromUser['username']) : ('bale_' . substr(strval($chatId), -6));
            if (empty($cleanUname)) $cleanUname = 'bale_' . substr(strval($chatId), -6);
            $testUname = $cleanUname;
            $counter = 1;
            while ($dbObj->getUserByUsername($testUname)) {
                $testUname = $cleanUname . '_' . $counter++;
            }
            $randomPass = substr(bin2hex(random_bytes(5)), 0, 10);
            $matchedUser = $dbObj->createUser($testUname, $randomPass, $fromName, 'user', [
                'baleChatId' => $chatId,
                'baleUsername' => $fromUser['username'] ?? '',
                'isVerified' => true,
                'status' => 'active',
            ]);
            broadcastBaleUserToPeer($matchedUser);
        } else {
            $dbObj->updateUserProfile($matchedUser['id'], [
                'baleChatId' => $chatId,
                'baleUsername' => $fromUser['username'] ?? '',
            ]);
        }

        // Check if there is an unapproved pending ticket created in the last 180s from this user's browser
        $recentTicketKey = null;
        $tickets = getBaleTicketsData();
        $now = time();
        foreach ($tickets as $k => $v) {
            if (($v['status'] ?? '') === 'pending' && ($now - ($v['createdAt'] ?? 0)) < 180) {
                $recentTicketKey = $k;
                break;
            }
        }

        if ($recentTicketKey) {
            $token = base64_encode($matchedUser['id'] . ':' . time());
            $cleanUser = $matchedUser;
            unset($cleanUser['password_hash']);
            unset($cleanUser['password']);

            $tickets[$recentTicketKey] = [
                'status' => 'approved',
                'token' => $token,
                'user' => $cleanUser,
                'approvedAt' => time(),
            ];
            saveBaleTicketsData($tickets);

            // Dual-server ticket sync
            try {
                $currHost = $_SERVER['HTTP_HOST'] ?? '';
                $peerHost = (strpos($currHost, 'task.mohusyn.ir') !== false) 
                    ? 'https://bagtime.negahm.ir' 
                    : 'https://task.mohusyn.ir';
                $postBody = json_encode(['ticket' => $recentTicketKey, 'token' => $token, 'user' => $cleanUser]);
                $chPeer = curl_init("{$peerHost}/api/bale.php?action=sync_ticket");
                curl_setopt($chPeer, CURLOPT_POST, true);
                curl_setopt($chPeer, CURLOPT_POSTFIELDS, $postBody);
                curl_setopt($chPeer, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($chPeer, CURLOPT_TIMEOUT, 2);
                curl_setopt($chPeer, CURLOPT_SSL_VERIFYPEER, false);
                @curl_exec($chPeer);
                @curl_close($chPeer);
            } catch (Exception $e) {}

            $host = $_SERVER['HTTP_HOST'] ?? 'task.mohusyn.ir';
            $webAppUrl = 'https://' . $host . '/index.html';
            $displayName = $matchedUser['name'] ?: $matchedUser['username'];

            $confirmMsg = "🎉 **ورود شما به «بگ تایم» با موفقیت انجام شد!** ✅\n\n" .
                "👤 کاربر گرامی: **{$displayName}** (@{$matchedUser['username']})\n" .
                "⚡ حساب کاربری شما با موفقیت به بازو متصل شد و ورود شما به برنامه تأیید گردید.\n\n" .
                "🔓 هم‌اکنون افزونه نیوتَب و سامانه برنامه‌ریزی شما فعال شد.\n" .
                "می‌توانید به مرورگر خود بازگردید تا به برنامه‌ریزی و کارهایتان ادامه دهید ✨";

            $loginKb = [
                'inline_keyboard' => [
                    [['text' => '🌐 بازگشت به سامانه بگ تایم', 'url' => $webAppUrl]],
                    [
                        ['text' => '📋 کارهای امروز من', 'callback_data' => 'my_tasks'],
                        ['text' => '➕ ثبت تسک جدید', 'callback_data' => 'new_task'],
                    ],
                ]
            ];
            sendBaleMessage($botToken, $chatId, $confirmMsg, $loginKb);
            echo json_encode(['ok' => true]);
            exit;
        }

        $host = $_SERVER['HTTP_HOST'] ?? 'task.mohusyn.ir';
        $webAppUrl = 'https://' . $host . '/index.html';
        $displayName = $matchedUser['name'] ?: $matchedUser['username'];

        $greeting = "سلام {$displayName} عزیز! به بازوی رسمی «بگ تایم» خوش آمدید ⏱️✨\n\n" .
            "✅ حساب کاربری شما با نام کاربری **@{$matchedUser['username']}** در سامانه ثبت و فعال است.\n" .
            "این بازو متصل به سیستم برنامه‌ریزی روزانه و مدیریت کارهای شماست.\n" .
            "جهت دسترسی به امکانات یا ورود به برنامه، گزینه‌های زیر را انتخاب فرمایید:";

        $welcomeKb = [
            'inline_keyboard' => [
                [['text' => '🌐 ورود به وب‌آپ بگ تایم', 'url' => $webAppUrl]],
                [
                    ['text' => '📋 کارهای امروز من', 'callback_data' => 'my_tasks'],
                    ['text' => '➕ ثبت تسک جدید', 'callback_data' => 'new_task'],
                ],
                [
                    ['text' => '💎 خرید و تمدید اشتراک ویژه', 'callback_data' => 'buy_subscription'],
                ],
            ]
        ];

        sendBaleMessage($botToken, $chatId, $greeting, $welcomeKb);
        echo json_encode(['ok' => true]);
        exit;
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
        $userFound = $dbObj->getUserByVerificationCode($incomingCode);

        // If not found by exact code, also search in all users
        if (!$userFound) {
            foreach ($dbObj->getAllUsers() as $u) {
                $storedCode = toEnglishDigits(trim($u['verificationCode'] ?? ''));
                if (!empty($storedCode) && $storedCode === $incomingCode) {
                    $userFound = $u;
                    break;
                }
            }
        }

        if ($userFound) {
            $pvFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'bale_pending.json';
            $pVerifs = [];
            if (file_exists($pvFile)) {
                $raw = @file_get_contents($pvFile);
                if ($raw) $pVerifs = @json_decode($raw, true) ?: [];
            }
            $pVerifs[strval($chatId)] = [
                'userId' => $userFound['id'],
                'code' => $incomingCode,
                'time' => time(),
            ];
            @file_put_contents($pvFile, json_encode($pVerifs, JSON_UNESCAPED_UNICODE), LOCK_EX);

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
// 4. Send outbound notification / message to user via Bale
// -----------------------------------------------------------------------------
if ($action === 'notify' || $action === 'send_message') {
    $userId = $input['userId'] ?? ($_POST['userId'] ?? ($_GET['userId'] ?? ''));
    $chatId = $input['chatId'] ?? ($_POST['chatId'] ?? ($_GET['chatId'] ?? ''));
    $text = trim($input['text'] ?? ($input['message'] ?? ($_POST['text'] ?? ($_POST['message'] ?? ''))));
    $title = trim($input['title'] ?? ($_POST['title'] ?? ''));

    if (!empty($title)) {
        $text = "📢 **{$title}**\n\n" . $text;
    }

    $tokenToUse = trim($input['token'] ?? ($_POST['token'] ?? $botToken));
    $cleanedToken = cleanBaleToken($tokenToUse);

    if (empty($cleanedToken)) {
        jsonResponse(['ok' => false, 'error' => 'توکن بازوی بله خالی یا نامعتبر است.'], 200);
    }
    if (empty($text)) {
        jsonResponse(['ok' => false, 'error' => 'متن پیام نمی‌تواند خالی باشد.'], 200);
    }

    // Resolve chatId if userId was provided
    if (empty($chatId) && !empty($userId)) {
        foreach ($dbObj->getAllUsers() as $u) {
            if ($u['id'] === $userId || ($u['username'] ?? '') === $userId) {
                $chatId = $u['baleChatId'] ?? null;
                break;
            }
        }
    }

    if (empty($chatId)) {
        jsonResponse(['ok' => false, 'error' => 'شناسه چت بله برای این کاربر یافت نشد. کاربر باید ابتدا بازوی بله را استارت کرده باشد.'], 200);
    }

    $res = sendBaleMessage($cleanedToken, $chatId, $text);
    if (!empty($res['ok'])) {
        jsonResponse(['ok' => true, 'message' => 'پیام با موفقیت به کاربر در بله ارسال شد.', 'baleResponse' => $res]);
    } else {
        $desc = $res['description'] ?? ($res['error'] ?? 'عدم تأیید ارسال از سرورهای بله');
        jsonResponse(['ok' => false, 'error' => $desc, 'baleResponse' => $res], 200);
    }
}

jsonResponse(['error' => 'اکشن نامعتبر است.'], 400);
