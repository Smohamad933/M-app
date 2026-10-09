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
    $projectId = !empty($_GET['project_id']) ? $_GET['project_id'] : null;

    $tasks = $db->getTasks($targetUserId, $date, $categoryId, $completed, $projectId);
    jsonResponse(['tasks' => $tasks]);
}

// POST /api/tasks -> Create task or quick toggle/delete/update
if ($method === 'POST') {
    requireVerifiedUser();
    $input = getJsonInput();
    $action = $input['action'] ?? $_GET['action'] ?? '';

    if ($action === 'toggle') {
        $id = $input['id'] ?? $_GET['id'] ?? '';
        if (empty($id)) jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
        $res = $db->toggleTask($id);
        if ($res) jsonResponse($res);
        jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
    }

    if ($action === 'delete' || $action === 'remove' || ($input['_method'] ?? '') === 'DELETE' || ($_GET['_method'] ?? '') === 'DELETE') {
        $id = $input['id'] ?? $_GET['id'] ?? '';
        if (empty($id)) jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
        $db->deleteTask($id);
        jsonResponse(['message' => 'تسک با موفقیت حذف شد.']);
    }

    if ($action === 'update' || $action === 'edit' || ($input['_method'] ?? '') === 'PUT' || ($_GET['_method'] ?? '') === 'PUT') {
        $id = $input['id'] ?? $_GET['id'] ?? '';
        if (empty($id)) jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);

        $updateData = ['id' => $id];
        if (isset($input['title'])) $updateData['title'] = trim((string)$input['title']);
        if (array_key_exists('description', $input)) $updateData['description'] = $input['description'];
        if (isset($input['date'])) $updateData['date'] = $input['date'];
        if (array_key_exists('time', $input)) $updateData['time'] = $input['time'];
        if (isset($input['durationMinutes'])) $updateData['durationMinutes'] = (int)$input['durationMinutes'];
        if (isset($input['priority'])) $updateData['priority'] = $input['priority'];
        if (isset($input['categoryId'])) $updateData['categoryId'] = $input['categoryId'];
        if (array_key_exists('projectId', $input)) $updateData['projectId'] = $input['projectId'];
        if (isset($input['isPinned'])) $updateData['isPinned'] = !empty($input['isPinned']);
        if (isset($input['subtasks'])) $updateData['subtasks'] = $input['subtasks'];
        if (array_key_exists('completed', $input)) $updateData['completed'] = !empty($input['completed']);
        if (array_key_exists('completedAt', $input)) $updateData['completedAt'] = $input['completedAt'];
        if (array_key_exists('reasonUncompleted', $input)) $updateData['reasonUncompleted'] = $input['reasonUncompleted'];
        if (array_key_exists('uncompletedCategory', $input)) $updateData['uncompletedCategory'] = $input['uncompletedCategory'];
        if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
            $updateData['userId'] = $input['userId'];
        }

        $db->updateTask($updateData);
        jsonResponse(['message' => 'تسک به‌روزرسانی شد.']);
    }

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
        'id' => !empty($input['id']) ? trim($input['id']) : null,
        'userId' => $targetUserId,
        'title' => $title,
        'description' => $input['description'] ?? '',
        'date' => $date,
        'time' => $input['time'] ?? '',
        'durationMinutes' => (int)($input['durationMinutes'] ?? 0),
        'priority' => in_array($input['priority'] ?? '', ['high', 'medium', 'low']) ? $input['priority'] : 'medium',
        'categoryId' => $input['categoryId'] ?? 'cat-work',
        'projectId' => $input['projectId'] ?? null,
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

    $updateData = ['id' => $id];
    if (isset($input['title'])) $updateData['title'] = trim((string)$input['title']);
    if (array_key_exists('description', $input)) $updateData['description'] = $input['description'];
    if (isset($input['date'])) $updateData['date'] = $input['date'];
    if (array_key_exists('time', $input)) $updateData['time'] = $input['time'];
    if (isset($input['durationMinutes'])) $updateData['durationMinutes'] = (int)$input['durationMinutes'];
    if (isset($input['priority'])) $updateData['priority'] = $input['priority'];
    if (isset($input['categoryId'])) $updateData['categoryId'] = $input['categoryId'];
    if (array_key_exists('projectId', $input)) $updateData['projectId'] = $input['projectId'];
    if (isset($input['isPinned'])) $updateData['isPinned'] = !empty($input['isPinned']);
    if (isset($input['subtasks'])) $updateData['subtasks'] = $input['subtasks'];
    if (array_key_exists('completed', $input)) $updateData['completed'] = !empty($input['completed']);
    if (array_key_exists('completedAt', $input)) $updateData['completedAt'] = $input['completedAt'];
    if (array_key_exists('reasonUncompleted', $input)) $updateData['reasonUncompleted'] = $input['reasonUncompleted'];
    if (array_key_exists('uncompletedCategory', $input)) $updateData['uncompletedCategory'] = $input['uncompletedCategory'];
    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $updateData['userId'] = $input['userId'];
    }

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
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    $db->deleteTask($id);
    jsonResponse(['message' => 'تسک با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
