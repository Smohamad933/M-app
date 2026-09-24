<?php
/**
 * TaskRooz - User Notifications API
 * Handles subscription upgrade alerts, new message notices, and friend request alerts.
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
if (!$currentUser) {
    jsonResponse(['error' => 'ابتدا وارد حساب کاربری خود شوید.'], 401);
}

$myId = $currentUser['id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = in_array($method, ['POST', 'PUT']) ? getJsonInput() : [];

$dbObj = TaskRoozDB::getInstance();
if (!isset($dbObj->data['notifications'])) {
    $dbObj->data['notifications'] = [];
}

// 1. GET Notifications for Current User
if ($method === 'GET') {
    $all = $dbObj->data['notifications'] ?? [];
    $userNotifs = [];

    foreach ($all as $n) {
        if (($n['userId'] ?? '') === $myId) {
            $userNotifs[] = $n;
        }
    }

    // Also include pending incoming friend requests if not already added
    $friendReqs = $dbObj->data['friend_requests'] ?? [];
    foreach ($friendReqs as $fr) {
        if (($fr['toUserId'] ?? '') === $myId && ($fr['status'] ?? '') === 'pending') {
            $existingId = 'notif_freq_' . $fr['id'];
            $exists = false;
            foreach ($userNotifs as $un) {
                if ($un['id'] === $existingId) {
                    $exists = true;
                    break;
                }
            }
            if (!$exists) {
                $userNotifs[] = [
                    'id' => $existingId,
                    'userId' => $myId,
                    'title' => 'درخواست دوستی و همکاری جدید 👥',
                    'message' => ($fr['fromUserName'] ?? 'کاربر') . ' برای شما درخواست همکاری ارسال کرد.',
                    'type' => 'friend',
                    'timestamp' => $fr['createdAt'] ?? date('Y-m-d H:i:s'),
                    'read' => false,
                    'userId' => $fr['fromUserId'] ?? null,
                    'userName' => $fr['fromUserName'] ?? null,
                ];
            }
        }
    }

    // Sort by timestamp desc
    usort($userNotifs, function($a, $b) {
        return strcmp($b['timestamp'] ?? '', $a['timestamp'] ?? '');
    });

    jsonResponse(['notifications' => $userNotifs]);
}

// 2. POST actions: mark as read or clear
if ($method === 'POST') {
    $postAction = $input['action'] ?? $action;

    // Mark single or all as read
    if ($postAction === 'read' || $postAction === 'mark_read') {
        $notifId = $input['id'] ?? $_GET['id'] ?? '';
        $changed = false;
        foreach ($dbObj->data['notifications'] as &$n) {
            if (($n['userId'] ?? '') === $myId) {
                if (empty($notifId) || $n['id'] === $notifId) {
                    $n['read'] = true;
                    $changed = true;
                }
            }
        }
        if ($changed) {
            $dbObj->saveJson();
        }
        jsonResponse(['message' => 'اعلان‌ها با موفقیت خوانده شدند.']);
    }

    // Clear all notifications
    if ($postAction === 'clear' || $postAction === 'delete_all') {
        $dbObj->data['notifications'] = array_values(array_filter($dbObj->data['notifications'], function($n) use ($myId) {
            return ($n['userId'] ?? '') !== $myId;
        }));
        $dbObj->saveJson();
        jsonResponse(['message' => 'تمام اعلان‌ها پاک شدند.']);
    }

    // Test sending notification to Bale
    if ($postAction === 'test_bale' || $postAction === 'send_bale') {
        require_once __DIR__ . '/bale.php';
        $title = trim($input['title'] ?? 'اعلان آزمایشی بگ تایم ⏱️');
        $message = trim($input['message'] ?? 'این یک پیام آزمایشی جهت بررسی اتصال و دریافت اعلان‌ها در پیام‌رسان بله است.');

        // Add to in-app notifications
        $notifId = 'notif_test_' . time();
        $dbObj->data['notifications'][] = [
            'id' => $notifId,
            'userId' => $myId,
            'title' => $title,
            'message' => $message,
            'type' => 'info',
            'timestamp' => date('Y-m-d H:i:s'),
            'read' => false,
        ];
        $dbObj->saveJson();

        $res = sendBaleNotificationToUser($myId, $title, $message);
        if (!empty($res['ok'])) {
            jsonResponse([
                'ok' => true,
                'message' => 'پیام آزمایشی با موفقیت به اکانت بله شما ارسال شد.',
                'baleResponse' => $res,
            ]);
        } else {
            $err = $res['error'] ?? 'خطا در ارسال پیام به بله';
            jsonResponse([
                'ok' => false,
                'error' => $err,
                'baleResponse' => $res,
            ], 400);
        }
    }
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
