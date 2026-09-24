<?php
/**
 * TaskRooz / Bag Time - Bale Messenger Bot API & Webhook (docs.bale.ai)
 * Handles:
 * 1. Admin Token verification & connection testing (getMe)
 * 2. Automatic webhook registration (setWebhook)
 * 3. User account phone verification via Bale (/start verify_XXXXXX or 6-digit code)
 * 4. Task creation via Bale bot (/task <title> or /new <title>)
 * 5. Outbound notifications to users on Bale
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
$baleApiBase = 'https://tapi.bale.ai/bot' . $botToken;

/**
 * Send HTTP request to Bale Bot API
 */
function callBaleApi($token, $method, $params = []) {
    $url = 'https://tapi.bale.ai/bot' . $token . '/' . $method;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
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
 * Send Bale text message
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

// 3. Webhook Receiver from Bale Messenger
if ($action === 'webhook') {
    $rawInput = file_get_contents('php://input');
    $update = json_decode($rawInput, true);

    if (!$update || empty($update['message'])) {
        // Just return OK to Bale
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

    // A. Check for verification code (/start verify_XXXXXX or 6 digit number)
    $verifyCode = null;
    if (preg_match('/^\/start\s+verify_([A-Za-z0-9]{4,10})/i', $text, $matches)) {
        $verifyCode = $matches[1];
    } elseif (preg_match('/^\/verify\s+([A-Za-z0-9]{4,10})/i', $text, $matches)) {
        $verifyCode = $matches[1];
    } elseif (preg_match('/^\b(\d{6})\b$/', $text, $matches)) {
        $verifyCode = $matches[1];
    }

    // Also check if phone contact was shared
    $sharedPhone = null;
    if ($contact && !empty($contact['phone_number'])) {
        $sharedPhone = preg_replace('/[^\d]/', '', $contact['phone_number']);
        if (substr($sharedPhone, 0, 2) === '98') {
            $sharedPhone = '0' . substr($sharedPhone, 2);
        }
    }

    // Match and verify user
    if ($verifyCode || $sharedPhone) {
        $foundIndex = -1;
        foreach ($dbObj->data['users'] as $idx => $u) {
            if ($verifyCode && !empty($u['verificationCode']) && strtolower(trim($u['verificationCode'])) === strtolower(trim($verifyCode))) {
                $foundIndex = $idx;
                break;
            }
            if ($sharedPhone && !empty($u['phone'])) {
                $cleanUserPhone = preg_replace('/[^\d]/', '', $u['phone']);
                if ($cleanUserPhone === $sharedPhone) {
                    $foundIndex = $idx;
                    break;
                }
            }
        }

        if ($foundIndex !== -1) {
            $matchedUser = &$dbObj->data['users'][$foundIndex];
            $matchedUser['isVerified'] = true;
            $matchedUser['status'] = 'active';
            $matchedUser['baleChatId'] = $chatId;
            $matchedUser['baleUsername'] = $fromUser['username'] ?? ($matchedUser['baleUsername'] ?? '');
            $dbObj->saveJson();

            $welcomeMsg = "🎉 تبریک " . ($matchedUser['name'] ?? 'عزیز') . "!\n" .
                "حساب کاربری شما در سامانه «بگ تایم» با موفقیت فعال و تأیید هویت شد. ✅\n\n" .
                "هم‌اکنون می‌توانید وارد برنامه شوید یا از طریق همین ربات، کارهای روزانه خود را مدیریت کنید:\n" .
                "📌 ثبت تسک جدید: /task عنوان کار [فردا ساعت ۱۰]\n" .
                "📋 لیست تسک‌های امروز: /tasks\n" .
                "⭐ روزی پر از تمرکز و موفقیت برای شما آرزومندیم!";

            sendBaleMessage($botToken, $chatId, $welcomeMsg);
            echo json_encode(['ok' => true, 'verified' => true]);
            exit;
        } else {
            sendBaleMessage(
                $botToken,
                $chatId,
                "⚠️ کد تأیید ارسال شده در سامانه یافت نشد یا قبلاً استفاده شده است.\nلطفاً کد ۶ رقمی نمایش داده شده در صفحه ثبت‌نام بگ تایم را ارسال نمایید."
            );
            echo json_encode(['ok' => true]);
            exit;
        }
    }

    // B. Find linked user for task creation / query
    $linkedUser = null;
    foreach ($dbObj->data['users'] as $u) {
        if (!empty($u['baleChatId']) && strval($u['baleChatId']) === strval($chatId)) {
            $linkedUser = $u;
            break;
        }
    }

    // C. Handle /task or /new
    if (preg_match('/^\/(task|new)\s+(.+)$/is', $text, $matches)) {
        if (!$linkedUser) {
            sendBaleMessage(
                $botToken,
                $chatId,
                "⚠️ حساب شما هنوز به بگ تایم متصل نشده است!\nلطفاً ابتدا در سامانه ثبت‌نام نمایید و کد تأیید خود را در اینجا ارسال فرمایید."
            );
            echo json_encode(['ok' => true]);
            exit;
        }

        $rawTask = trim($matches[2]);
        $taskTitle = $rawTask;
        $taskTime = null;
        $taskDate = date('Y-m-d');

        // Extract time e.g. "ساعت 14" or "ساعت 14:30" or "10:00"
        if (preg_match('/(?:ساعت|at)\s*(\d{1,2})(?::(\d{2}))?/u', $rawTask, $tm)) {
            $hour = str_pad($tm[1], 2, '0', STR_PAD_LEFT);
            $min = isset($tm[2]) ? str_pad($tm[2], 2, '0', STR_PAD_LEFT) : '00';
            $taskTime = "{$hour}:{$min}";
            $taskTitle = trim(preg_replace('/(?:ساعت|at)\s*\d{1,2}(?::\d{2})?/u', '', $taskTitle));
        }

        // Extract "فردا"
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
            'userId' => $linkedUser['id'],
            'createdAt' => date('Y-m-d H:i:s'),
        ];
        $dbObj->saveJson();

        $reply = "✅ وظیفه جدید در تقویم شما ثبت شد:\n" .
            "📌 عنوان: {$taskTitle}\n" .
            "📅 تاریخ: " . ($taskDate === date('Y-m-d') ? 'امروز' : 'فردا') . "\n" .
            ($taskTime ? "⏰ ساعت: {$taskTime}\n" : "") .
            "⚡ تسک در اپلیکیشن همگام‌سازی شد.";

        sendBaleMessage($botToken, $chatId, $reply);
        echo json_encode(['ok' => true]);
        exit;
    }

    // D. Handle /tasks (List user's tasks)
    if (in_array(strtolower($text), ['/tasks', 'تسک‌ها', 'لیست تسک‌ها', 'برنامه امروز'])) {
        if (!$linkedUser) {
            sendBaleMessage($botToken, $chatId, "⚠️ حساب شما متصل نیست. ابتدا در بگ تایم ثبت‌نام فرمایید.");
            echo json_encode(['ok' => true]);
            exit;
        }

        $today = date('Y-m-d');
        $myTasks = [];
        if (!empty($dbObj->data['tasks'])) {
            foreach ($dbObj->data['tasks'] as $t) {
                if (($t['userId'] ?? '') === $linkedUser['id']) {
                    $myTasks[] = $t;
                }
            }
        }

        if (empty($myTasks)) {
            sendBaleMessage($botToken, $chatId, "📋 شما در حال حاضر تسکی در لیست ندارید.\nجهت ثبت سریع: /task عنوان تسک");
        } else {
            $listText = "📋 لیست وظایف شما در بگ تایم:\n\n";
            $idx = 1;
            foreach (array_slice($myTasks, 0, 10) as $t) {
                $statusIcon = !empty($t['completed']) ? "✅" : "⏳";
                $timePart = !empty($t['time']) ? " (" . $t['time'] . ")" : "";
                $listText .= "{$idx}. {$statusIcon} {$t['title']}{$timePart}\n";
                $idx++;
            }
            sendBaleMessage($botToken, $chatId, $listText);
        }
        echo json_encode(['ok' => true]);
        exit;
    }

    // Default /start or /help
    $botUsername = $baleConfig['botUsername'] ?? 'BagTime_Bot';
    $helpText = "سلام! به ربات رسمی «بگ تایم» خوش آمدید ⏱️✨\n\n" .
        "🔹 تأیید حساب ثبت‌نام: کد ۶ رقمی یا /verify 123456\n" .
        "🔹 افزودن کار جدید: /task مطالعه کتاب ساعت 18\n" .
        "🔹 کارهای من: /tasks\n" .
        "🔹 راهنما: /help\n\n" .
        "جهت شروع، کد تأیید نمایش داده شده در اپلیکیشن را ارسال فرمایید.";

    sendBaleMessage($botToken, $chatId, $helpText);
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
