<?php
/**
 * TaskRooz - Direct & Project Messaging API
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

// GET Messages: either with a specific user, or for a project, or all conversations
if ($method === 'GET') {
    // Project chat
    $projectId = $_GET['project_id'] ?? '';
    if (!empty($projectId)) {
        $projMsgs = $dbObj->data['project_messages'] ?? [];
        $list = [];
        foreach ($projMsgs as $m) {
            if (($m['projectId'] ?? '') === $projectId) {
                $list[] = $m;
            }
        }
        jsonResponse(['messages' => $list]);
    }

    // Direct chat with a user
    $withUserId = $_GET['with'] ?? '';
    if (!empty($withUserId)) {
        $allMsgs = $dbObj->data['messages'] ?? [];
        $list = [];
        $changed = false;
        if (isset($dbObj->data['messages'])) {
            foreach ($dbObj->data['messages'] as &$m) {
                $s = $m['senderId'] ?? '';
                $r = $m['receiverId'] ?? '';
                if (($s === $myId && $r === $withUserId) || ($s === $withUserId && $r === $myId)) {
                    if ($r === $myId && empty($m['read'])) {
                        $m['read'] = true;
                        $changed = true;
                    }
                    $list[] = $m;
                }
            }
            if ($changed) {
                $dbObj->saveJson();
            }
        }
        jsonResponse(['messages' => $list]);
    }

    // Conversations summary
    if ($action === 'conversations' || isset($_GET['conversations'])) {
        $allMsgs = $dbObj->data['messages'] ?? [];
        $partners = [];
        foreach ($allMsgs as $m) {
            $s = $m['senderId'] ?? '';
            $r = $m['receiverId'] ?? '';
            if ($s === $myId || $r === $myId) {
                $pId = $s === $myId ? $r : $s;
                if (!isset($partners[$pId])) {
                    $partners[$pId] = ['lastMessage' => $m, 'unreadCount' => 0];
                }
                $partners[$pId]['lastMessage'] = $m;
                if ($r === $myId && empty($m['read'])) {
                    $partners[$pId]['unreadCount']++;
                }
            }
        }
        $allUsers = $dbObj->getAllUsers();
        $userMap = [];
        foreach ($allUsers as $u) {
            $userMap[$u['id']] = $u;
        }
        $res = [];
        foreach ($partners as $pId => $data) {
            $partner = $userMap[$pId] ?? null;
            $res[] = [
                'partnerId' => $pId,
                'partnerName' => $partner ? $partner['name'] : 'کاربر',
                'partnerUsername' => $partner ? $partner['username'] : '',
                'partnerAvatar' => $partner['avatar'] ?? null,
                'lastMessage' => $data['lastMessage'],
                'unreadCount' => $data['unreadCount'],
            ];
        }
        jsonResponse(['conversations' => $res]);
    }
}

// POST Message: send direct or project message
if ($method === 'POST') {
    // Project message
    $projectId = $input['projectId'] ?? $_GET['project_id'] ?? '';
    if (!empty($projectId)) {
        $text = trim((string)($input['text'] ?? ''));
        if (empty($text)) {
            jsonResponse(['error' => 'متن پیام الزامی است.'], 400);
        }
        if (!isset($dbObj->data['project_messages'])) {
            $dbObj->data['project_messages'] = [];
        }
        $newMsg = [
            'id' => 'pmsg_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
            'projectId' => $projectId,
            'senderId' => $myId,
            'senderName' => $currentUser['name'],
            'senderAvatar' => $currentUser['avatar'] ?? null,
            'text' => $text,
            'createdAt' => date('Y-m-d H:i:s'),
        ];
        $dbObj->data['project_messages'][] = $newMsg;
        $dbObj->saveJson();
        jsonResponse(['message' => 'پیام گروهی با موفقیت ارسال شد.', 'data' => $newMsg], 201);
    }

    // Direct message
    $receiverId = $input['receiverId'] ?? '';
    $text = trim((string)($input['text'] ?? ''));
    if (empty($receiverId) || empty($text)) {
        jsonResponse(['error' => 'گیرنده و متن پیام الزامی است.'], 400);
    }

    if (!isset($dbObj->data['messages'])) {
        $dbObj->data['messages'] = [];
    }
    $newMsg = [
        'id' => 'msg_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
        'senderId' => $myId,
        'senderName' => $currentUser['name'],
        'senderAvatar' => $currentUser['avatar'] ?? null,
        'receiverId' => $receiverId,
        'text' => $text,
        'createdAt' => date('Y-m-d H:i:s'),
        'read' => false,
    ];
    $dbObj->data['messages'][] = $newMsg;

    // Send in-app notification to receiver
    if (!isset($dbObj->data['notifications'])) $dbObj->data['notifications'] = [];
    $previewText = mb_substr($text, 0, 70) . (mb_strlen($text) > 70 ? '...' : '');
    $dbObj->data['notifications'][] = [
        'id' => 'notif_msg_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
        'userId' => $receiverId,
        'title' => "پیام جدید از {$currentUser['name']} 💬",
        'message' => $previewText,
        'type' => 'info',
        'timestamp' => date('Y-m-d H:i:s'),
        'read' => false,
        'senderId' => $myId,
        'senderName' => $currentUser['name'],
    ];

    $dbObj->saveJson();
    jsonResponse(['message' => 'پیام با موفقیت ارسال شد.', 'data' => $newMsg], 201);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
