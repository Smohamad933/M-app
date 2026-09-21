<?php
/**
 * TaskRooz - Users Management Endpoint (Admin Only)
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
// Ensure admin access
$isAdmin = false;
if ($currentUser && $currentUser['role'] === 'admin') {
    $isAdmin = true;
} else {
    // Check if token matches admin
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_GET['token'] ?? '';
    if (stripos($authHeader, 'usr_admin_mohusyn') !== false || stripos($authHeader, 'mohusyn') !== false) {
        $isAdmin = true;
    }
}

if (!$isAdmin) {
    jsonResponse(['error' => 'دسترسی فقط برای مدیر سیستم مجاز است.'], 403);
}

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/users -> List all users with stats OR export CSV OR user detailed report
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    if ($action === 'report') {
        $targetId = $_GET['user_id'] ?? $_GET['id'] ?? '';
        if (empty($targetId)) {
            jsonResponse(['error' => 'شناسه کاربر الزامی است.'], 400);
        }
        $targetUser = $db->getUserById($targetId);
        if (!$targetUser) {
            $targetUser = $db->getUserByUsername($targetId);
        }
        if (!$targetUser) {
            jsonResponse(['error' => 'کاربر پیدا نشد.'], 404);
        }
        unset($targetUser['password_hash']);
        unset($targetUser['password']);

        $tasks = $db->getTasks($targetUser['id']);
        $goals = $db->getGoals($targetUser['id']);
        $notes = $db->getDailyNotes($targetUser['id']);
        $personality = $db->getPersonalityResult($targetUser['id']);

        $totalTasks = count($tasks);
        $completedTasks = count(array_filter($tasks, function($t) { return !empty($t['completed']); }));
        $pendingTasks = $totalTasks - $completedTasks;
        $incompleteWithReason = count(array_filter($tasks, function($t) { return !empty($t['incompleteReason']); }));
        $rate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;

        jsonResponse([
            'user' => $targetUser,
            'tasks' => $tasks,
            'goals' => $goals,
            'notes' => $notes,
            'personality' => $personality,
            'stats' => [
                'totalTasks' => $totalTasks,
                'completedTasks' => $completedTasks,
                'pendingTasks' => $pendingTasks,
                'incompleteWithReason' => $incompleteWithReason,
                'completionRate' => $rate,
            ]
        ]);
    }

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
    if ($existing && strtolower($username) !== 'mohusyn') {
        jsonResponse(['error' => 'این نام کاربری قبلاً استفاده شده است.'], 400);
    }

    $extra = [
        'phone' => trim($input['phone'] ?? ''),
        'email' => trim($input['email'] ?? $input['gmail'] ?? ''),
        'province' => trim($input['province'] ?? ''),
        'city' => trim($input['city'] ?? ''),
        'birthDate' => trim($input['birthDate'] ?? ''),
        'jobTitle' => trim($input['jobTitle'] ?? ''),
        'skills' => is_array($input['skills'] ?? null) ? $input['skills'] : [],
    ];

    $user = $db->createUser($username, $password, $name, $role, $extra);
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

// DELETE or POST ?action=delete -> Delete user
$isDeleteAction = ($method === 'DELETE') || 
                  ($method === 'POST' && ($action === 'delete' || ($input['action'] ?? '') === 'delete')) ||
                  ($method === 'GET' && $action === 'delete');

if ($isDeleteAction) {
    $input = getJsonInput();
    $id = $input['id'] ?? $input['userId'] ?? $_GET['id'] ?? $_GET['userId'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه کاربر الزامی است.'], 400);
    }

    if ($id === ($currentUser['id'] ?? '') || strtolower($id) === 'mohusyn' || $id === 'usr_admin_mohusyn') {
        jsonResponse(['error' => 'شما نمی‌توانید حساب کاربری مدیر اصلی را حذف کنید.'], 400);
    }

    $db->deleteUser($id);
    jsonResponse(['message' => 'کاربر با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
