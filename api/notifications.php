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

// 1. GET Notifications for Current User
if ($method === 'GET') {
    $userNotifs = $dbObj->getNotifications($myId);

    // Also include pending incoming friend requests if not already added
    $reqs = $dbObj->getFriendRequests($myId);
    $friendReqs = $reqs['incoming'];
    foreach ($friendReqs as $fr) {
        $existingId = 'notif_freq_' . $fr['id'];
        $exists = false;
        foreach ($userNotifs as $un) {
            if ($un['id'] === $existingId || (($un['type'] ?? '') === 'friend' && ($un['requestId'] ?? '') === $fr['id'])) {
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
                'fromUserId' => $fr['fromUserId'] ?? null,
                'fromUserName' => $fr['fromUserName'] ?? null,
                'requestId' => $fr['id'],
            ];
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
        $dbObj->markNotificationRead($myId, $notifId);
        jsonResponse(['message' => 'اعلان‌ها با موفقیت خوانده شدند.']);
    }

    // Clear all notifications
    if ($postAction === 'clear' || $postAction === 'delete_all') {
        $dbObj->clearNotifications($myId);
        jsonResponse(['message' => 'تمام اعلان‌ها پاک شدند.']);
    }
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
