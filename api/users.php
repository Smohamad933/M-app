<?php
/**
 * TaskRooz - Users Management Endpoint (Admin Only)
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAdmin();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/users -> List all users with stats OR export CSV
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    if ($action === 'export_csv') {
        $users = $db->getAllUsers();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="taskrooz-users-' . date('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w');
        // UTF-8 BOM for Persian Excel support
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['ردیف', 'نام و نام خانوادگی', 'نام کاربری', 'نقش', 'شماره تماس', 'ایمیل', 'استان', 'شهر', 'تاریخ تولد', 'شغل', 'کل تسک‌ها', 'تسک‌های انجام‌شده', 'درصد پیشرفت', 'تاریخ عضویت']);
        $i = 1;
        foreach ($users as $u) {
            fputcsv($out, [
                $i++,
                $u['name'] ?? '',
                $u['username'] ?? '',
                ($u['role'] ?? '') === 'admin' ? 'مدیر سیستم' : 'کاربر عادی',
                $u['phone'] ?? '',
                $u['email'] ?? '',
                $u['province'] ?? '',
                $u['city'] ?? '',
                $u['birthDate'] ?? '',
                $u['jobTitle'] ?? '',
                $u['totalTasks'] ?? 0,
                $u['completedTasks'] ?? 0,
                ($u['progressPercent'] ?? 0) . '%',
                substr($u['createdAt'] ?? '', 0, 10),
            ]);
        }
        fclose($out);
        exit;
    }

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
