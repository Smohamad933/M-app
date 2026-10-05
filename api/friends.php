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
    $reqs = $dbObj->getFriendRequests($myId);
    jsonResponse(['incoming' => $reqs['incoming'], 'outgoing' => $reqs['outgoing']]);
}

// 2. GET Friends: list of accepted friends
if ($method === 'GET') {
    $friendIds = $dbObj->getFriendships($myId);
    $allUsers = $dbObj->getAllUsers();
    $friends = [];
    foreach ($allUsers as $u) {
        if (in_array($u['id'], $friendIds) || (isset($u['username']) && in_array($u['username'], $friendIds))) {
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
        $toUserId = trim((string)($input['toUserId'] ?? ''));
        if (empty($toUserId) || $toUserId === $myId) {
            jsonResponse(['error' => 'کاربر مقصد نامعتبر است.'], 400);
        }

        // Canonical user lookup
        $targetUser = $dbObj->getUserById($toUserId);
        if (!$targetUser) {
            $targetUser = $dbObj->getUserByUsername($toUserId);
        }
        if (!$targetUser) {
            foreach ($dbObj->getAllUsers() as $u) {
                if (isset($u['numericId']) && strval($u['numericId']) === strval($toUserId)) {
                    $targetUser = $u;
                    break;
                }
            }
        }
        if (!$targetUser) {
            jsonResponse(['error' => 'کاربر مقصد در سامانه یافت نشد.'], 404);
        }
        $canonicalToId = $targetUser['id'];

        if ($canonicalToId === $myId || strtolower($targetUser['username'] ?? '') === strtolower($currentUser['username'] ?? '')) {
            jsonResponse(['error' => 'ارسال درخواست دوستی به خودتان امکان‌پذیر نیست.'], 400);
        }

        // Check if already friends
        $existingFriends = $dbObj->getFriendships($myId);
        if (in_array($canonicalToId, $existingFriends) || in_array($targetUser['username'], $existingFriends)) {
            jsonResponse(['message' => 'این کاربر هم‌اکنون در لیست همکاران شما قرار دارد.', 'isFriend' => true]);
        }

        $newReq = $dbObj->createFriendRequest([
            'fromUserId' => $myId,
            'fromUserName' => $currentUser['name'],
            'fromUserUsername' => $currentUser['username'],
            'fromUserAvatar' => $currentUser['avatar'] ?? null,
            'toUserId' => $canonicalToId,
            'projectId' => $input['projectId'] ?? null,
            'projectName' => $input['projectName'] ?? null,
        ]);

        // Send in-app notification & dispatch to Bale
        $dbObj->addNotification(
            $canonicalToId,
            'درخواست دوستی و همکاری جدید 👥',
            "{$currentUser['name']} (@{$currentUser['username']}) برای شما درخواست همکاری ارسال کرد.",
            'friend',
            [
                'requestId' => $newReq['id'],
                'fromUserId' => $myId,
                'fromUserName' => $currentUser['name']
            ]
        );

        jsonResponse(['message' => 'درخواست دوستی و همکاری ارسال شد.', 'request' => $newReq], 201);
    }

    // Accept
    if ($postAction === 'accept') {
        $reqId = $input['requestId'] ?? $input['id'] ?? '';
        $found = $dbObj->acceptFriendRequest($reqId, $myId);
        if (!$found) {
            jsonResponse(['error' => 'درخواست یافت نشد.'], 404);
        }

        // If project invite, add to project
        if (!empty($found['projectId'])) {
            $dbObj->addProjectMember($found['projectId'], $myId);
        }

        $dbObj->addNotification(
            $found['fromUserId'],
            'پذیرش درخواست دوستی و همکاری ✅',
            "{$currentUser['name']} (@{$currentUser['username']}) درخواست همکاری شما را پذیرفت.",
            'friend'
        );

        jsonResponse(['message' => 'درخواست همکاری با موفقیت پذیرفته شد.']);
    }

    // Reject
    if ($postAction === 'reject') {
        $reqId = $input['requestId'] ?? $input['id'] ?? '';
        $dbObj->rejectFriendRequest($reqId, $myId);
        jsonResponse(['message' => 'درخواست رد شد.']);
    }
}

// 4. DELETE /api/friends.php?id=FRIEND_USER_ID (and POST action=delete)
$isFriendDelete = ($method === 'DELETE') ||
    ($method === 'POST' && (
        $action === 'delete' ||
        $action === 'remove' ||
        ($input['action'] ?? '') === 'delete' ||
        ($input['action'] ?? '') === 'remove' ||
        ($_GET['_method'] ?? '') === 'DELETE' ||
        ($_POST['_method'] ?? '') === 'DELETE'
    ));

if ($isFriendDelete) {
    $friendId = $_GET['id'] ?? $input['friendId'] ?? $input['id'] ?? $_POST['id'] ?? '';
    if (!empty($friendId)) {
        $isAdmin = ($currentUser['role'] === 'admin' || strtolower($currentUser['username'] ?? '') === 'mohusyn' || ($currentUser['id'] ?? '') === 'usr_admin_mohusyn');
        $dbObj->deleteFriendship($myId, $friendId, $isAdmin);
    }
    jsonResponse(['message' => 'کاربر از لیست همکاران حذف شد.']);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
