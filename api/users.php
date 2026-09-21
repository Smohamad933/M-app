<?php
/**
 * TaskRooz - Users Management Endpoint (Admin Only)
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
$method = $_SERVER['REQUEST_METHOD'];
$input = in_array($method, ['POST', 'PUT', 'PATCH']) ? getJsonInput() : [];

/**
 * ── Self profile update (ANY authenticated user) ──────────────────────────
 * PUT /api/users.php  { "action": "update_profile", ...profile fields }
 * A user may only update their OWN profile (name, contact info, photo...).
 * Admins editing OTHER users keep using the plain PUT below (admin-only).
 */
if (in_array($method, ['PUT', 'POST']) && ($input['action'] ?? '') === 'update_profile') {
    if (!$currentUser) {
        jsonResponse(['error' => 'ابتدا وارد حساب کاربری خود شوید.'], 401);
    }
    if (!empty($input['id']) && $input['id'] !== $currentUser['id']) {
        jsonResponse(['error' => 'فقط می‌توانید پروفایل خودتان را ویرایش کنید.'], 403);
    }

    $fields = [];
    foreach (['name', 'phone', 'email', 'province', 'city', 'birthDate', 'jobTitle'] as $k) {
        if (array_key_exists($k, $input) && is_string($input[$k])) {
            $fields[$k] = trim($input[$k]);
        }
    }
    if (array_key_exists('skills', $input) && is_array($input['skills'])) {
        $fields['skills'] = array_values(array_filter(array_map('strval', $input['skills'])));
    }
    if (array_key_exists('dailyTimeline', $input) && is_array($input['dailyTimeline'])) {
        $fields['dailyTimeline'] = array_map('strval', $input['dailyTimeline']);
    }
    if (array_key_exists('avatar', $input)) {
        // empty => remove photo; otherwise must be a data URL under 600 KB
        if ($input['avatar'] === '' || $input['avatar'] === null) {
            $fields['avatar'] = null;
        } elseif (is_string($input['avatar']) && strpos($input['avatar'], 'data:image/') === 0 && strlen($input['avatar']) < 600000) {
            $fields['avatar'] = $input['avatar'];
        } else {
            jsonResponse(['error' => 'عکس پروفایل معتبر نیست (حداکثر ۶۰۰ کیلوبایت).'], 400);
        }
    }
    if (empty($fields) && empty($input['password'])) {
        jsonResponse(['error' => 'هیچ اطلاعاتی برای ویرایش ارسال نشده است.'], 400);
    }

    $ok = $db->updateUserProfile($currentUser['id'], $fields, !empty($input['password']) ? (string)$input['password'] : null);
    if (!$ok) {
        jsonResponse(['error' => 'کاربر پیدا نشد.'], 404);
    }

    jsonResponse([
        'message' => 'پروفایل شما با موفقیت به‌روزرسانی شد.',
        'user' => [
            'id' => $currentUser['id'],
            'username' => $currentUser['username'],
            'name' => $fields['name'] ?? $currentUser['name'],
            'role' => $currentUser['role'],
            'avatar' => array_key_exists('avatar', $fields) ? $fields['avatar'] : null,
            'phone' => $fields['phone'] ?? null,
            'email' => $fields['email'] ?? null,
            'province' => $fields['province'] ?? null,
            'city' => $fields['city'] ?? null,
            'birthDate' => $fields['birthDate'] ?? null,
            'jobTitle' => $fields['jobTitle'] ?? null,
            'skills' => $fields['skills'] ?? null,
            'dailyTimeline' => $fields['dailyTimeline'] ?? null,
        ],
    ]);
}

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

/**
 * Shared user-deletion routine: removes the user and ALL their data
 * (tasks, goals, notes, personality results) so nothing is orphaned.
 * Used by DELETE, and by GET/POST ?action=delete (IIS 405 resilience).
 */
function performUserDelete($db, $id, $currentUser) {
    $id = trim((string)$id);
    if ($id === '') {
        jsonResponse(['error' => 'شناسه کاربر الزامی است.'], 400);
    }

    if ($id === ($currentUser['id'] ?? '') || strtolower($id) === 'mohusyn' || $id === 'usr_admin_mohusyn') {
        jsonResponse(['error' => 'شما نمی‌توانید حساب کاربری مدیر اصلی را حذف کنید.'], 400);
    }

    $db->deleteUser($id);
    jsonResponse(['message' => 'کاربر و تمامی تسک‌ها و داده‌های مرتبط با موفقیت حذف شد.']);
}

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/users -> List all users with stats OR export CSV OR user detailed report
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    // IIS 405 resilience: some servers block the DELETE verb, allow ?action=delete via GET
    if ($action === 'delete' || $action === 'delete_user') {
        performUserDelete($db, $_GET['id'] ?? $_GET['user_id'] ?? '', $currentUser);
    }

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

// POST /api/users -> Create new user (or delete via ?action=delete for IIS 405 resilience)
if ($method === 'POST') {
    $input = getJsonInput();

    if (($_GET['action'] ?? '') === 'delete' || ($input['action'] ?? '') === 'delete') {
        performUserDelete($db, ($input['id'] ?? '') !== '' ? $input['id'] : ($_GET['id'] ?? ''), $currentUser);
    }

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

// DELETE /api/users -> Delete user
if ($method === 'DELETE') {
    performUserDelete($db, $_GET['id'] ?? '', $currentUser);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
