<?php
/**
 * TaskRooz - Pomodoro Group Focus Rooms Endpoint
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/rooms.php?action=list
if ($method === 'GET' && $action === 'list') {
    $list = $db->listFocusRooms();
    jsonResponse(['rooms' => $list]);
}

// GET /api/rooms.php?action=get&room_id=...
if ($method === 'GET' && ($action === 'get' || !empty($_GET['room_id']))) {
    $roomId = $_GET['room_id'] ?? '';
    if (empty($roomId)) {
        jsonResponse(['error' => 'شناسه اتاق الزامی است.'], 400);
    }
    $room = $db->getFocusRoom($roomId);
    if (!$room) {
        jsonResponse(['error' => 'اتاق پیدا نشد یا پس از ۱۰ دقیقه منقضی و پاک شده است.'], 404);
    }
    jsonResponse(['room' => $room]);
}

// POST /api/rooms.php?action=create
if ($method === 'POST' && $action === 'create') {
    $input = getJsonInput();
    $name = trim($input['name'] ?? 'اتاق تمرکز گروهی');
    $focusDuration = (int)($input['focusDuration'] ?? 1500);
    $breakDuration = (int)($input['breakDuration'] ?? 300);

    $room = $db->createFocusRoom($name, $currentUser, $focusDuration, $breakDuration);
    jsonResponse(['message' => 'اتاق با موفقیت ایجاد شد.', 'room' => $room], 201);
}

// POST /api/rooms.php?action=join
if ($method === 'POST' && $action === 'join') {
    $input = getJsonInput();
    $roomId = $input['roomId'] ?? $_GET['room_id'] ?? '';
    if (empty($roomId)) {
        jsonResponse(['error' => 'شناسه اتاق الزامی است.'], 400);
    }
    $room = $db->joinFocusRoom($roomId, $currentUser);
    if (!$room) {
        jsonResponse(['error' => 'اتاق مورد نظر یافت نشد یا پاک شده است.'], 404);
    }
    jsonResponse(['message' => 'شما به اتاق ملحق شدید.', 'room' => $room]);
}

// POST /api/rooms.php?action=sync
if ($method === 'POST' && $action === 'sync') {
    $input = getJsonInput();
    $roomId = $input['roomId'] ?? '';
    $timerAction = $input['timerAction'] ?? 'start'; // start, pause, reset, setMode
    $timeLeft = isset($input['timeLeft']) ? (int)$input['timeLeft'] : null;
    $mode = $input['mode'] ?? null;

    if (empty($roomId)) {
        jsonResponse(['error' => 'شناسه اتاق الزامی است.'], 400);
    }
    $room = $db->syncFocusRoomTimer($roomId, $currentUser, $timerAction, $timeLeft, $mode);
    if (!$room) {
        jsonResponse(['error' => 'اتاق یافت نشد یا بسته شده است.'], 404);
    }
    jsonResponse(['room' => $room]);
}

// POST /api/rooms.php?action=message
if ($method === 'POST' && $action === 'message') {
    $input = getJsonInput();
    $roomId = $input['roomId'] ?? '';
    $text = trim($input['text'] ?? '');
    if (empty($roomId) || empty($text)) {
        jsonResponse(['error' => 'شناسه اتاق و متن پیام الزامی است.'], 400);
    }
    $room = $db->addFocusRoomMessage($roomId, $currentUser, $text);
    if (!$room) {
        jsonResponse(['error' => 'اتاق یافت نشد.'], 404);
    }
    jsonResponse(['message' => 'پیام ارسال شد.', 'room' => $room]);
}

// POST /api/rooms.php?action=leave
if ($method === 'POST' && $action === 'leave') {
    $input = getJsonInput();
    $roomId = $input['roomId'] ?? $_GET['room_id'] ?? '';
    if (!empty($roomId)) {
        $db->leaveFocusRoom($roomId, $currentUser['id']);
    }
    jsonResponse(['message' => 'از اتاق خارج شدید.']);
}

// POST /api/rooms.php?action=delete (Host or Admin deleting room, retaining messages for 10 min)
if ($method === 'POST' && ($action === 'delete' || $action === 'close')) {
    $input = getJsonInput();
    $roomId = $input['roomId'] ?? $_GET['room_id'] ?? '';
    if (empty($roomId)) {
        jsonResponse(['error' => 'شناسه اتاق الزامی است.'], 400);
    }
    $isAdmin = ($currentUser['role'] === 'admin');
    $ok = $db->deleteFocusRoom($roomId, $currentUser['id'], $isAdmin);
    if ($ok) {
        jsonResponse(['message' => 'اتاق با موفقیت بسته شد. پیام‌ها به مدت ۱۰ دقیقه تا پاکسازی کامل در سرور نگه‌داری می‌شوند.']);
    } else {
        jsonResponse(['error' => 'فقط میزبان یا مدیر سیستم مجاز به حذف اتاق هستند.'], 403);
    }
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 405);
