<?php
/**
 * TaskRooz / Bag Time - Payments & Subscription Orders API
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
if (!$currentUser) {
    jsonResponse(['error' => 'ابتدا وارد حساب کاربری خود شوید.'], 401);
}

$myId = $currentUser['id'];
$isAdmin = ($currentUser['role'] === 'admin');
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = in_array($method, ['POST', 'PUT']) ? getJsonInput() : [];

$dbObj = TaskRoozDB::getInstance();
if (!isset($dbObj->data['payments'])) {
    $dbObj->data['payments'] = [];
}
if (!isset($dbObj->data['notifications'])) {
    $dbObj->data['notifications'] = [];
}

// 1. GET Payments List
if ($method === 'GET') {
    $all = $dbObj->data['payments'] ?? [];
    if ($isAdmin && ($action === 'all' || isset($_GET['all']))) {
        // Admin sees all payments, sorted by date desc
        usort($all, function($a, $b) {
            return strcmp($b['createdAt'] ?? '', $a['createdAt'] ?? '');
        });
        jsonResponse(['payments' => $all]);
    }

    // Regular users see only their own payment history
    $myPayments = array_values(array_filter($all, function($p) use ($myId) {
        return ($p['userId'] ?? '') === $myId;
    }));
    usort($myPayments, function($a, $b) {
        return strcmp($b['createdAt'] ?? '', $a['createdAt'] ?? '');
    });
    jsonResponse(['payments' => $myPayments]);
}

// 2. POST actions: Submit Payment, Approve, Reject
if ($method === 'POST') {
    $postAction = $input['action'] ?? $action;

    // A. Submit Payment Receipt by User
    if (empty($postAction) || $postAction === 'submit' || $postAction === 'pay') {
        $plan = $input['plan'] ?? 'pro';
        $planType = $input['planType'] ?? '3_months';
        $amount = trim((string)($input['amount'] ?? ''));
        $trackingCode = trim((string)($input['trackingCode'] ?? ''));
        $paymentMethod = $input['paymentMethod'] ?? 'card_to_card';
        $note = trim((string)($input['note'] ?? ''));

        if (empty($trackingCode)) {
            jsonResponse(['error' => 'وارد کردن شماره پیگیری یا ۴ رقم آخر کارت الزامی است.'], 400);
        }

        $planLabel = ($planType === '6_months' || $plan === 'ultra')
            ? 'اولترا (Ultra) 💎'
            : (($planType === '1_month' || $plan === 'plus') ? 'پلاس (Plus) ➕' : 'پرو (Pro) ⭐');

        $newPayment = [
            'id' => 'pay_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
            'userId' => $myId,
            'userName' => $currentUser['name'],
            'userUsername' => $currentUser['username'] ?? '',
            'plan' => $plan,
            'planType' => $planType,
            'planLabel' => $planLabel,
            'amount' => !empty($amount) ? $amount : 'طبق تعرفه',
            'trackingCode' => $trackingCode,
            'paymentMethod' => $paymentMethod,
            'note' => $note,
            'status' => 'pending',
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        $dbObj->data['payments'][] = $newPayment;

        // Notification for the user
        $dbObj->data['notifications'][] = [
            'id' => 'notif_pay_' . time() . '_' . substr(bin2hex(random_bytes(2)), 0, 4),
            'userId' => $myId,
            'title' => 'رسید پرداخت با موفقیت ثبت شد ⏳',
            'message' => "درخواست ارتقا به طرح {$planLabel} با کد پیگیری {$trackingCode} دریافت شد و در دست بررسی است.",
            'type' => 'info',
            'timestamp' => date('Y-m-d H:i:s'),
            'read' => false,
        ];

        // Notification for Admin
        $adminUser = $dbObj->getUserByUsername('Mohusyn');
        if ($adminUser) {
            $dbObj->data['notifications'][] = [
                'id' => 'notif_admin_pay_' . time() . '_' . substr(bin2hex(random_bytes(2)), 0, 4),
                'userId' => $adminUser['id'],
                'title' => "واریزی جدید برای {$planLabel} 💳",
                'message' => "کاربر {$currentUser['name']} (@{$currentUser['username']}) پرداخت جدید با کد پیگیری {$trackingCode} ثبت کرد.",
                'type' => 'info',
                'timestamp' => date('Y-m-d H:i:s'),
                'read' => false,
                'senderId' => $myId,
                'senderName' => $currentUser['name'],
            ];
        }

        $dbObj->saveJson();

        // Dispatch Bale notification to Admin immediately!
        if (file_exists(__DIR__ . '/bale.php')) {
            require_once __DIR__ . '/bale.php';
            $planEmoji = ($plan === 'ultra' || $planType === '6_months') ? '💎' : (($plan === 'plus' || $planType === '1_month') ? '➕' : '⭐');
            $admTitle = "درخواست ارتقای اشتراک {$planLabel} {$planEmoji}";
            $admMsg = "کاربر «{$currentUser['name']}» (@{$currentUser['username']}) متقاضی ارتقا به طرح {$planLabel} است.\n" .
                "💰 مبلغ: {$amount}\n" .
                "🔢 کد پیگیری: {$trackingCode}" .
                (!empty($note) ? "\n📝 پیام کاربر: {$note}" : "") .
                "\n\nلطفاً جهت بررسی و ارسال شماره کارت به بخش پیام‌های سامانه بگ تایم مراجعه فرمایید.";

            // 1. Send to Mohusyn user ID
            if ($adminUser) {
                sendBaleNotificationToUser($adminUser['id'], $admTitle, $admMsg);
            }

            // 2. Also send to globalSettings.baleBot.adminChatId if configured
            $baleConf = $dbObj->data['globalSettings']['baleBot'] ?? [];
            if (!empty($baleConf['adminChatId'])) {
                $botTk = cleanBaleToken($baleConf['token'] ?? '');
                if (!empty($botTk)) {
                    $baleFormatted = "🔔 **{$admTitle}**\n\n{$admMsg}\n\n⏱️ _ارسال شده از سامانه بگ تایم_";
                    sendBaleMessage($botTk, $baleConf['adminChatId'], $baleFormatted);
                }
            }
        }
        jsonResponse([
            'message' => 'اطلاعات پرداخت با موفقیت ثبت شد و در انتظار تأیید مدیر است.',
            'payment' => $newPayment,
        ], 201);
    }

    // B. Admin Approve Payment & Activate User Subscription
    if ($postAction === 'approve') {
        if (!$isAdmin) {
            jsonResponse(['error' => 'دسترسی فقط برای مدیر مجاز است.'], 403);
        }
        $paymentId = $input['paymentId'] ?? $input['id'] ?? '';
        $foundIndex = -1;
        foreach ($dbObj->data['payments'] as $idx => $p) {
            if ($p['id'] === $paymentId) {
                $foundIndex = $idx;
                break;
            }
        }
        if ($foundIndex === -1) {
            jsonResponse(['error' => 'تراکنش پرداخت یافت نشد.'], 404);
        }

        $payment = &$dbObj->data['payments'][$foundIndex];
        $payment['status'] = 'approved';
        $payment['approvedAt'] = date('Y-m-d H:i:s');

        $targetUserId = $payment['userId'];
        $plan = $payment['plan'] ?? 'pro';
        $planType = $payment['planType'] ?? '3_months';

        $days = ($planType === '6_months' || $plan === 'ultra') ? 180 : (($planType === '1_month' || $plan === 'plus') ? 30 : 90);
        $expiresAt = date('Y-m-d H:i:s', time() + ($days * 86400));

        // Activate subscription in DB
        $dbObj->setUserSubscription($targetUserId, $plan, $planType, $expiresAt);

        $planSymbol = ($plan === 'ultra' || $planType === '6_months') ? '💎' : (($plan === 'plus' || $planType === '1_month') ? '➕' : '⭐');
        $planName = ($plan === 'ultra' || $planType === '6_months') ? 'اولترا (Ultra)' : (($plan === 'plus' || $planType === '1_month') ? 'پلاس (Plus)' : 'پرو (Pro)');

        // Notification to User
        $dbObj->data['notifications'][] = [
            'id' => 'notif_sub_ok_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
            'userId' => $targetUserId,
            'title' => "پرداخت تأیید و اشتراک {$planName} فعال شد {$planSymbol}",
            'message' => "پرداخت شما با موفقیت تأیید شد و اشتراک {$planName} به مدت {$days} روز برای حساب شما فعال گردید.",
            'type' => 'info',
            'timestamp' => date('Y-m-d H:i:s'),
            'read' => false,
        ];

        $dbObj->saveJson();

        // Dispatch Bale notification to User upon approval
        if (file_exists(__DIR__ . '/bale.php')) {
            require_once __DIR__ . '/bale.php';
            sendBaleNotificationToUser(
                $targetUserId,
                "تأیید پرداخت و فعال‌سازی اشتراک {$planName} {$planSymbol}",
                "پرداخت شما با موفقیت تأیید شد و اشتراک {$planName} به مدت {$days} روز برای حساب شما فعال گردید. ✅"
            );
        }

        jsonResponse([
            'message' => "پرداخت تأیید و اشتراک {$planName} برای کاربر فعال گردید.",
            'payment' => $payment,
        ]);
    }

    // C. Admin Reject Payment
    if ($postAction === 'reject') {
        if (!$isAdmin) {
            jsonResponse(['error' => 'دسترسی فقط برای مدیر مجاز است.'], 403);
        }
        $paymentId = $input['paymentId'] ?? $input['id'] ?? '';
        $reason = trim((string)($input['reason'] ?? 'اطلاعات واریزی مطابقت نداشت.'));
        $found = false;
        foreach ($dbObj->data['payments'] as &$p) {
            if ($p['id'] === $paymentId) {
                $p['status'] = 'rejected';
                $p['rejectReason'] = $reason;
                $p['rejectedAt'] = date('Y-m-d H:i:s');
                $found = true;

                // Send rejection notice to user
                $dbObj->data['notifications'][] = [
                    'id' => 'notif_pay_rej_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
                    'userId' => $p['userId'],
                    'title' => 'پرداخت تأیید نشد ❌',
                    'message' => "درخواست پرداخت شما با کد پیگیری {$p['trackingCode']} رد شد: {$reason}",
                    'type' => 'info',
                    'timestamp' => date('Y-m-d H:i:s'),
                    'read' => false,
                ];
                break;
            }
        }
        if (!$found) {
            jsonResponse(['error' => 'تراکنش پرداخت یافت نشد.'], 404);
        }
        $dbObj->saveJson();
        jsonResponse(['message' => 'تراکنش رد شد.']);
    }
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
