<?php
require_once __DIR__ . '/config.php';

$currentUser = requireAuth($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// Helper to format task row
function formatTaskRow($row) {
    return [
        'id' => $row['id'],
        'userId' => $row['user_id'],
        'userName' => $row['user_name'] ?? '',
        'title' => $row['title'],
        'description' => $row['description'] ?? '',
        'date' => $row['date'],
        'time' => $row['time'] ?? '',
        'durationMinutes' => (int)($row['duration_minutes'] ?? 0),
        'completed' => (bool)$row['completed'],
        'completedAt' => $row['completed_at'],
        'priority' => $row['priority'],
        'categoryId' => $row['category_id'],
        'isPinned' => (bool)$row['is_pinned'],
        'focusMinutesSpent' => (int)($row['focus_minutes_spent'] ?? 0),
        'subtasks' => !empty($row['subtasks_json']) ? json_decode($row['subtasks_json'], true) : [],
        'createdAt' => $row['created_at'],
    ];
}

// GET /api/tasks
if ($method === 'GET') {
    $where = [];
    $params = [];

    // Filter by user
    if ($currentUser['role'] === 'admin') {
        if (!empty($_GET['user_id'])) {
            $where[] = "t.user_id = ?";
            $params[] = $_GET['user_id'];
        }
    } else {
        $where[] = "t.user_id = ?";
        $params[] = $currentUser['id'];
    }

    // Filter by date
    if (!empty($_GET['date'])) {
        $where[] = "t.date = ?";
        $params[] = $_GET['date'];
    }

    // Filter by category
    if (!empty($_GET['category_id'])) {
        $where[] = "t.category_id = ?";
        $params[] = $_GET['category_id'];
    }

    // Filter by completed status
    if (isset($_GET['completed'])) {
        $where[] = "t.completed = ?";
        $params[] = (int)$_GET['completed'];
    }

    $sql = "
        SELECT t.*, u.name as user_name 
        FROM tasks t 
        LEFT JOIN users u ON t.user_id = u.id
    ";
    if (count($where) > 0) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }
    $sql .= " ORDER BY t.is_pinned DESC, t.time ASC, t.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $tasks = array_map('formatTaskRow', $rows);
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

    // Determine target user
    $targetUserId = $currentUser['id'];
    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $targetUserId = $input['userId'];
    }

    $id = 'task_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
    $description = $input['description'] ?? null;
    $time = $input['time'] ?? null;
    $duration = (int)($input['durationMinutes'] ?? 0);
    $priority = in_array($input['priority'] ?? '', ['high', 'medium', 'low']) ? $input['priority'] : 'medium';
    $categoryId = $input['categoryId'] ?? 'cat-work';
    $isPinned = !empty($input['isPinned']) ? 1 : 0;
    $subtasksJson = !empty($input['subtasks']) ? json_encode($input['subtasks'], JSON_UNESCAPED_UNICODE) : '[]';

    $stmt = $pdo->prepare("
        INSERT INTO tasks (
            id, user_id, title, description, date, time, duration_minutes, 
            completed, priority, category_id, is_pinned, focus_minutes_spent, 
            subtasks_json, created_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, ?
        )
    ");
    $now = date('Y-m-d H:i:s');
    $stmt->execute([
        $id, $targetUserId, $title, $description, $date, $time, $duration,
        $priority, $categoryId, $isPinned, $subtasksJson, $now
    ]);

    // Fetch user name
    $userStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
    $userStmt->execute([$targetUserId]);
    $uRow = $userStmt->fetch();

    $createdTask = [
        'id' => $id,
        'userId' => $targetUserId,
        'userName' => $uRow['name'] ?? '',
        'title' => $title,
        'description' => $description,
        'date' => $date,
        'time' => $time,
        'durationMinutes' => $duration,
        'completed' => false,
        'completedAt' => null,
        'priority' => $priority,
        'categoryId' => $categoryId,
        'isPinned' => (bool)$isPinned,
        'focusMinutesSpent' => 0,
        'subtasks' => !empty($input['subtasks']) ? $input['subtasks'] : [],
        'createdAt' => $now,
    ];

    jsonResponse(['message' => 'تسک با موفقیت اضافه شد.', 'task' => $createdTask], 201);
}

// PUT /api/tasks -> Update task
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? '';

    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    // Verify permission
    $checkStmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
    $checkStmt->execute([$id]);
    $task = $checkStmt->fetch();

    if (!$task) {
        jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
    }

    if ($currentUser['role'] !== 'admin' && $task['user_id'] !== $currentUser['id']) {
        jsonResponse(['error' => 'شما اجازه ویرایش این تسک را ندارید.'], 403);
    }

    $title = trim($input['title'] ?? $task['title']);
    $description = array_key_exists('description', $input) ? $input['description'] : $task['description'];
    $date = $input['date'] ?? $task['date'];
    $time = array_key_exists('time', $input) ? $input['time'] : $task['time'];
    $priority = $input['priority'] ?? $task['priority'];
    $categoryId = $input['categoryId'] ?? $task['category_id'];
    $isPinned = isset($input['isPinned']) ? ((bool)$input['isPinned'] ? 1 : 0) : $task['is_pinned'];
    $subtasksJson = isset($input['subtasks']) ? json_encode($input['subtasks'], JSON_UNESCAPED_UNICODE) : $task['subtasks_json'];
    $focusMinutes = isset($input['focusMinutesSpent']) ? (int)$input['focusMinutesSpent'] : (int)$task['focus_minutes_spent'];
    $completed = isset($input['completed']) ? ((bool)$input['completed'] ? 1 : 0) : $task['completed'];
    $completedAt = $completed ? ($task['completed_at'] ?: date('Y-m-d H:i:s')) : null;

    $targetUserId = $task['user_id'];
    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $targetUserId = $input['userId'];
    }

    $stmt = $pdo->prepare("
        UPDATE tasks SET 
            user_id = ?, title = ?, description = ?, date = ?, time = ?, 
            priority = ?, category_id = ?, is_pinned = ?, subtasks_json = ?, 
            focus_minutes_spent = ?, completed = ?, completed_at = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $targetUserId, $title, $description, $date, $time,
        $priority, $categoryId, $isPinned, $subtasksJson,
        $focusMinutes, $completed, $completedAt, $id
    ]);

    jsonResponse(['message' => 'تسک به‌روزرسانی شد.']);
}

// PATCH /api/tasks -> Quick actions (toggle, subtask toggle)
if ($method === 'PATCH') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    $action = $_GET['action'] ?? $input['action'] ?? 'toggle';

    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
    $stmt->execute([$id]);
    $task = $stmt->fetch();

    if (!$task) {
        jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
    }

    if ($currentUser['role'] !== 'admin' && $task['user_id'] !== $currentUser['id']) {
        jsonResponse(['error' => 'عدم دسترسی.'], 403);
    }

    if ($action === 'toggle') {
        $newStatus = $task['completed'] ? 0 : 1;
        $completedAt = $newStatus ? date('Y-m-d H:i:s') : null;
        $up = $pdo->prepare("UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?");
        $up->execute([$newStatus, $completedAt, $id]);
        jsonResponse(['completed' => (bool)$newStatus, 'completedAt' => $completedAt]);
    }

    if ($action === 'addFocus') {
        $mins = (int)($input['minutes'] ?? 25);
        $up = $pdo->prepare("UPDATE tasks SET focus_minutes_spent = focus_minutes_spent + ? WHERE id = ?");
        $up->execute([$mins, $id]);
        jsonResponse(['message' => 'دقایق تمرکز اضافه شد.']);
    }
}

// DELETE /api/tasks
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
    $stmt->execute([$id]);
    $task = $stmt->fetch();

    if (!$task) {
        jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
    }

    if ($currentUser['role'] !== 'admin' && $task['user_id'] !== $currentUser['id']) {
        jsonResponse(['error' => 'عدم دسترسی.'], 403);
    }

    $del = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
    $del->execute([$id]);

    jsonResponse(['message' => 'تسک با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
