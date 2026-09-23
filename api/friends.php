<?php
/**
 * TaskRooz - Friends & Colleague Network API
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
if (!$currentUser) {
    jsonResponse(['error' => 'ابتدا وارد حساب کاربری خود شوید.'], 401);
}

$myId = $currentUser['id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = in_array($method, ['POST', 'PUT', 'DELETE']) ? getJsonInput() : [];

$dbObj = TaskRoozDB::getInstance();

// 1. GET Requests: incoming and outgoing
if ($method === 'GET' && ($action === 'requests' || isset($_GET['requests']))) {
    $allRequests = $dbObj->data['friend_requests'] ?? [];
    $incoming = [];
    $outgoing = [];
    foreach ($allRequests as $r) {
        if (($r['toUserId'] ?? '') === $myId && ($r['status'] ?? '') === 'pending') {
            $incoming[] = $r;
        }
        if (($r['fromUserId'] ?? '') === $myId) {
            $outgoing[] = $r;
        }
    }
    jsonResponse(['incoming' => $incoming, 'outgoing' => $outgoing]);
}

// 2. GET Friends: list of accepted friends
if ($method === 'GET') {
    $friendships = $dbObj->data['friendships'] ?? [];
    $friendIds = [];
    foreach ($friendships as $f) {
        if (($f['user1Id'] ?? '') === $myId) $friendIds[] = $f['user2Id'];
        if (($f['user2Id'] ?? '') === $myId) $friendIds[] = $f['user1Id'];
    }
    $friendIds = array_unique($friendIds);

    $allUsers = $dbObj->getAllUsers();
    $friends = [];
    foreach ($allUsers as $u) {
        if (in_array($u['id'], $friendIds)) {
            $friends[] = [
                'id' => $u['id'],
                'numericId' => $u['numericId'] ?? 1000,
                'name' => $u['name'],
                'username' => $u['username'],
                'avatar' => $u['avatar'] ?? null,
                'jobTitle' => $u['jobTitle'] ?? null,
                'phone' => $u['phone'] ?? null,
                'role' => $u['role'] ?? 'user',
                'subscription' => $u['subscription'] ?? ['plan' => 'free'],
                'online' => true,
            ];
        }
    }
    jsonResponse(['friends' => $friends]);
}

// 3. POST actions: send request, accept, reject
if ($method === 'POST') {
    $postAction = $input['action'] ?? $action;

    // Send Friend Request / Project Invite
    if ($postAction === 'request' || $postAction === 'send') {
        $toUserId = $input['toUserId'] ?? '';
        if (empty($toUserId) || $toUserId === $myId) {
            jsonResponse(['error' => 'کاربر مقصد نامعتبر است.'], 400);
        }

        // Check if already friends
        $friendships = $dbObj->data['friendships'] ?? [];
        foreach ($friendships as $f) {
            if (($f['user1Id'] === $myId && $f['user2Id'] === $toUserId) || ($f['user2Id'] === $myId && $f['user1Id'] === $toUserId)) {
                jsonResponse(['message' => 'این کاربر هم‌اکنون در لیست همکاران شما قرار دارد.', 'isFriend' => true]);
            }
        }

        if (!isset($dbObj->data['friend_requests'])) {
            $dbObj->data['friend_requests'] = [];
        }

        $newReq = [
            'id' => 'freq_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
            'fromUserId' => $myId,
            'fromUserName' => $currentUser['name'],
            'fromUserUsername' => $currentUser['username'],
            'fromUserAvatar' => $currentUser['avatar'] ?? null,
            'toUserId' => $toUserId,
            'projectId' => $input['projectId'] ?? null,
            'projectName' => $input['projectName'] ?? null,
            'status' => 'pending',
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        $dbObj->data['friend_requests'][] = $newReq;
        $dbObj->saveJson();
        jsonResponse(['message' => 'درخواست دوستی و همکاری ارسال شد.', 'request' => $newReq], 201);
    }

    // Accept
    if ($postAction === 'accept') {
        $reqId = $input['requestId'] ?? $input['id'] ?? '';
        $found = null;
        if (isset($dbObj->data['friend_requests'])) {
            foreach ($dbObj->data['friend_requests'] as &$r) {
                if ($r['id'] === $reqId && ($r['toUserId'] ?? '') === $myId) {
                    $r['status'] = 'accepted';
                    $found = $r;
                    break;
                }
            }
        }
        if (!$found) {
            jsonResponse(['error' => 'درخواست یافت نشد.'], 404);
        }

        if (!isset($dbObj->data['friendships'])) {
            $dbObj->data['friendships'] = [];
        }
        $dbObj->data['friendships'][] = [
            'id' => 'fs_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
            'user1Id' => $found['fromUserId'],
            'user2Id' => $myId,
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        // If project invite, add to project
        if (!empty($found['projectId']) && isset($dbObj->data['projects'])) {
            foreach ($dbObj->data['projects'] as &$p) {
                if ($p['id'] === $found['projectId']) {
                    if (!isset($p['memberIds'])) $p['memberIds'] = [];
                    if (!in_array($myId, $p['memberIds'])) {
                        $p['memberIds'][] = $myId;
                    }
                    break;
                }
            }
        }

        $dbObj->saveJson();
        jsonResponse(['message' => 'درخواست همکاری با موفقیت پذیرفته شد.']);
    }

    // Reject
    if ($postAction === 'reject') {
        $reqId = $input['requestId'] ?? $input['id'] ?? '';
        if (isset($dbObj->data['friend_requests'])) {
            foreach ($dbObj->data['friend_requests'] as &$r) {
                if ($r['id'] === $reqId && ($r['toUserId'] ?? '') === $myId) {
                    $r['status'] = 'rejected';
                    break;
                }
            }
            $dbObj->saveJson();
        }
        jsonResponse(['message' => 'درخواست رد شد.']);
    }
}

// 4. DELETE /api/friends.php?id=FRIEND_USER_ID
if ($method === 'DELETE' || ($method === 'POST' && ($input['action'] ?? '') === 'delete')) {
    $friendId = $_GET['id'] ?? $input['friendId'] ?? $input['id'] ?? '';
    if (!empty($friendId) && isset($dbObj->data['friendships'])) {
        $dbObj->data['friendships'] = array_values(array_filter($dbObj->data['friendships'], function($f) use ($myId, $friendId) {
            return !(($f['user1Id'] === $myId && $f['user2Id'] === $friendId) || ($f['user2Id'] === $myId && $f['user1Id'] === $friendId));
        }));
        $dbObj->saveJson();
    }
    jsonResponse(['message' => 'کاربر از لیست همکاران حذف شد.']);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
