<?php
require_once __DIR__ . '/config.php';

$currentUser = requireAdmin($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/users -> List all users with stats
if ($method === 'GET') {
    $stmt = $pdo->query("
        SELECT 
            u.id, 
            u.username, 
            u.name, 
            u.role, 
            u.created_at,
            COUNT(t.id) as total_tasks,
            SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed_tasks
        FROM users u
        LEFT JOIN tasks t ON u.id = t.user_id
        GROUP BY u.id
        ORDER BY u.created_at ASC
    ");
    $users = $stmt->fetchAll();

    $result = array_map(function($u) {
        $total = (int)$u['total_tasks'];
        $done = (int)($u['completed_tasks'] ?? 0);
        return [
            'id' => $u['id'],
            'username' => $u['username'],
            'name' => $u['name'],
            'role' => $u['role'],
            'createdAt' => $u['created_at'],
            'totalTasks' => $total,
            'completedTasks' => $done,
            'progressPercent' => $total > 0 ? round(($done / $total) * 100) : 0,
        ];
    }, $users);

    jsonResponse(['users' => $result]);
}

// POST /api/users -> Create new user
if ($method === 'POST') {
    $input = getJsonInput();
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $name = trim($input['name'] ?? '');
    $role = in_array($input['role'] ?? '', ['admin', 'user']) ? $input['role'] : 'user';

    if (empty($username) || empty($password) || empty($name)) {
        jsonResponse(['error' => 'لطفاً تمامی فیلدهای الزامی (نام، نام کاربری و رمز عبور) را وارد کنید.'], 400);
    }

    // Check if username already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'این نام کاربری قبلاً استفاده شده است.'], 400);
    }

    $id = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (id, username, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $username, $hash, $name, $role, date('Y-m-d H:i:s')]);

    jsonResponse([
        'message' => 'کاربر جدید با موفقیت ایجاد شد.',
        'user' => [
            'id' => $id,
            'username' => $username,
            'name' => $name,
            'role' => $role,
            'createdAt' => date('Y-m-d H:i:s'),
            'totalTasks' => 0,
            'completedTasks' => 0,
            'progressPercent' => 0,
        ]
    ], 201);
}

// PUT /api/users -> Update user
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? '';
    $name = trim($input['name'] ?? '');
    $role = in_array($input['role'] ?? '', ['admin', 'user']) ? $input['role'] : 'user';
    $password = $input['password'] ?? null;

    if (empty($id) || empty($name)) {
        jsonResponse(['error' => 'شناسه و نام کاربر الزامی است.'], 400);
    }

    if (!empty($password)) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?");
        $stmt->execute([$name, $role, $hash, $id]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, role = ? WHERE id = ?");
        $stmt->execute([$name, $role, $id]);
    }

    jsonResponse(['message' => 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.']);
}

// DELETE /api/users -> Delete user
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه کاربر الزامی است.'], 400);
    }

    if ($id === $currentUser['id']) {
        jsonResponse(['error' => 'شما نمی‌توانید حساب کاربری فعلی خود را حذف کنید.'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['message' => 'کاربر با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
