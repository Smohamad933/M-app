<?php
/**
 * TaskRooz - Users Management Endpoint (Admin Only)
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAdmin();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/users -> List all users with stats
if ($method === 'GET') {
    $users = $db->getAllUsers();
    jsonResponse(['users' => $users]);
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

    $existing = $db->getUserByUsername($username);
    if ($existing) {
        jsonResponse(['error' => 'این نام کاربری قبلاً استفاده شده است.'], 400);
    }

    $user = $db->createUser($username, $password, $name, $role);
    jsonResponse([
        'message' => 'کاربر جدید با موفقیت ایجاد شد.',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'],
            'createdAt' => $user['createdAt'],
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

    $ok = $db->updateUser($id, $name, $role, $password);
    if ($ok) {
        jsonResponse(['message' => 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.']);
    } else {
        jsonResponse(['error' => 'کاربر پیدا نشد.'], 404);
    }
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

    $db->deleteUser($id);
    jsonResponse(['message' => 'کاربر با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
