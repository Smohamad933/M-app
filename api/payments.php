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
$isAdmin = isUserAdmin($currentUser);
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
        $dbObj->addNotification(
            $myId,
            'رسید پرداخت با موفقیت ثبت شد ⏳',
            "درخواست ارتقا به طرح {$planLabel} با کد پیگیری {$trackingCode} دریافت شد و در دست بررسی است."
        );

        // Notification for Admin & dispatch to Bale
        $adminUser = $dbObj->getUserByUsername('Mohusyn');
        if ($adminUser) {
            $dbObj->addNotification(
                $adminUser['id'],
                "واریزی جدید برای {$planLabel} 💳",
                "کاربر {$currentUser['name']} (@{$currentUser['username']}) پرداخت جدید با کد پیگیری {$trackingCode} ثبت کرد."
            );
        }

        $dbObj->saveJson();
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

        $planSymbol = ($plan === 'ultra' || $planType === '6_months') ? '💎' : (($plan === 'plus' || planType === '1_month') ? '➕' : '⭐');
        $planName = ($plan === 'ultra' || $planType === '6_months') ? 'اولترا (Ultra)' : (($plan === 'plus' || $planType === '1_month') ? 'پلاس (Plus)' : 'پرو (Pro)');

        // Notification to User & Bale
        $dbObj->addNotification(
            $targetUserId,
            "پرداخت تأیید و اشتراک {$planName} فعال شد {$planSymbol}",
            "پرداخت شما با موفقیت تأیید شد و اشتراک {$planName} به مدت {$days} روز برای حساب شما فعال گردید."
        );

        $dbObj->saveJson();
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

                // Send rejection notice to user & Bale
                $dbObj->addNotification(
                    $p['userId'],
                    'پرداخت تأیید نشد ❌',
                    "درخواست پرداخت شما با کد پیگیری {$p['trackingCode']} رد شد: {$reason}"
                );
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
