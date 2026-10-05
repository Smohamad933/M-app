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
        $list = $dbObj->getProjectMessages($projectId);
        jsonResponse(['messages' => $list]);
    }

    // Direct chat with a user
    $withUserId = $_GET['with'] ?? '';
    if (!empty($withUserId)) {
        $list = $dbObj->getDirectMessages($myId, $withUserId);
        jsonResponse(['messages' => $list]);
    }

    // Conversations summary
    if ($action === 'conversations' || isset($_GET['conversations'])) {
        $res = $dbObj->getConversations($myId);
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
        $newMsg = $dbObj->sendProjectMessage($projectId, $currentUser, $text);
        jsonResponse(['message' => 'پیام گروهی با موفقیت ارسال شد.', 'data' => $newMsg], 201);
    }

    // Direct message
    $receiverId = trim((string)($input['receiverId'] ?? ''));
    $text = trim((string)($input['text'] ?? ''));
    if (empty($receiverId) || empty($text)) {
        jsonResponse(['error' => 'گیرنده و متن پیام الزامی است.'], 400);
    }

    $newMsg = $dbObj->sendDirectMessage($currentUser, $receiverId, $text);

    jsonResponse([
        'ok' => true,
        'message' => 'پیام با موفقیت ارسال شد.',
        'data' => $newMsg,
        'id' => $newMsg['id'],
        'senderId' => $newMsg['senderId'],
        'receiverId' => $newMsg['receiverId'],
        'text' => $newMsg['text'],
        'createdAt' => $newMsg['createdAt'],
        'senderName' => $newMsg['senderName'],
        'senderAvatar' => $newMsg['senderAvatar'],
        'read' => false,
    ], 201);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
