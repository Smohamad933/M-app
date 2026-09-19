<?php
/**
 * TaskRooz - Tasks Endpoint
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/tasks
if ($method === 'GET') {
    $targetUserId = null;
    if ($currentUser['role'] === 'admin') {
        if (!empty($_GET['user_id'])) {
            $targetUserId = $_GET['user_id'];
        }
    } else {
        $targetUserId = $currentUser['id'];
    }

    $date = !empty($_GET['date']) ? $_GET['date'] : null;
    $categoryId = !empty($_GET['category_id']) ? $_GET['category_id'] : null;
    $completed = isset($_GET['completed']) ? (bool)$_GET['completed'] : null;

    $tasks = $db->getTasks($targetUserId, $date, $categoryId, $completed);
    jsonResponse(['tasks' => $tasks]);
}

// POST /api/tasks -> Create task
if ($method === 'POST') {
    $input = getJsonInput();
    $title = trim($input['title'] ?? '');
    $date = trim($input['date'] ?? date('Y-m-d'));

    if (empty($title)) {
        jsonResponse(['error' => 'عنوان تسک الزامی است.'], 400);
    }

    $targetUserId = $currentUser['id'];
    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $targetUserId = $input['userId'];
    }

    $taskData = [
        'userId' => $targetUserId,
        'title' => $title,
        'description' => $input['description'] ?? '',
        'date' => $date,
        'time' => $input['time'] ?? '',
        'durationMinutes' => (int)($input['durationMinutes'] ?? 0),
        'priority' => in_array($input['priority'] ?? '', ['high', 'medium', 'low']) ? $input['priority'] : 'medium',
        'categoryId' => $input['categoryId'] ?? 'cat-work',
        'isPinned' => !empty($input['isPinned']) ? 1 : 0,
        'subtasks' => !empty($input['subtasks']) ? $input['subtasks'] : [],
    ];

    $created = $db->createTask($taskData);
    jsonResponse(['message' => 'تسک با موفقیت اضافه شد.', 'task' => $created], 201);
}

// PUT /api/tasks -> Update task
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? '';

    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    $targetUserId = $currentUser['id'];
    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $targetUserId = $input['userId'];
    }

    $updateData = [
        'id' => $id,
        'userId' => $targetUserId,
        'title' => isset($input['title']) ? trim($input['title']) : null,
        'description' => $input['description'] ?? null,
        'date' => $input['date'] ?? null,
        'time' => $input['time'] ?? null,
        'durationMinutes' => isset($input['durationMinutes']) ? (int)$input['durationMinutes'] : null,
        'priority' => $input['priority'] ?? null,
        'categoryId' => $input['categoryId'] ?? null,
        'isPinned' => isset($input['isPinned']) ? $input['isPinned'] : null,
        'subtasks' => isset($input['subtasks']) ? $input['subtasks'] : null,
        'completed' => isset($input['completed']) ? $input['completed'] : null,
    ];

    $db->updateTask($updateData);
    jsonResponse(['message' => 'تسک به‌روزرسانی شد.']);
}

// PATCH /api/tasks -> Quick actions (toggle, focus)
if ($method === 'PATCH') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    $action = $_GET['action'] ?? $input['action'] ?? 'toggle';

    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    if ($action === 'toggle') {
        $res = $db->toggleTask($id);
        if ($res) {
            jsonResponse($res);
        } else {
            jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
        }
    }

    if ($action === 'addFocus') {
        $mins = (int)($input['minutes'] ?? 25);
        $db->addFocusMinutes($id, $mins);
        jsonResponse(['message' => 'دقایق تمرکز با موفقیت افزوده شد.']);
    }
}

// DELETE /api/tasks
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    $db->deleteTask($id);
    jsonResponse(['message' => 'تسک با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
