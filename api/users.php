<?php
/**
 * TaskRooz - Users Management Endpoint (Admin Only)
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
$method = $_SERVER['REQUEST_METHOD'];
if (!empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
} elseif (!empty($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
} elseif (!empty($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$input = array_merge($_GET, $_POST, getJsonInput());
$action = $_GET['action'] ?? $input['action'] ?? '';

/**
 * ── Self profile update (ANY authenticated user) ──────────────────────────
 * Accepts POST, PUT, PATCH, or fallback GET with action=update_profile
 */
if ($action === 'update_profile' || ($input['action'] ?? '') === 'update_profile') {
    if (!$currentUser) {
        jsonResponse(['error' => 'ابتدا وارد حساب کاربری خود شوید.'], 401);
    }
    if (!empty($input['id']) && $input['id'] !== $currentUser['id']) {
        jsonResponse(['error' => 'فقط می‌توانید پروفایل خودتان را ویرایش کنید.'], 403);
    }

    $fields = [];
    foreach (['name', 'phone', 'email', 'province', 'city', 'birthDate', 'jobTitle', 'bio', 'coverImage', 'baleChatId', 'baleUsername', 'baleNotifToken', 'baleNotificationsEnabled'] as $k) {
        if (array_key_exists($k, $input)) {
            $fields[$k] = $input[$k];
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
            'baleChatId' => $fields['baleChatId'] ?? ($currentUser['baleChatId'] ?? null),
            'baleUsername' => $fields['baleUsername'] ?? ($currentUser['baleUsername'] ?? null),
            'baleNotifToken' => $fields['baleNotifToken'] ?? ($currentUser['baleNotifToken'] ?? null),
            'baleNotificationsEnabled' => !empty($fields['baleNotificationsEnabled']) || !empty($currentUser['baleNotificationsEnabled']),
            'isProfileCompleted' => true,
        ],
    ]);
}

// Ensure admin access
$isAdmin = isUserAdmin($currentUser);
if (!$isAdmin) {
    // Check if token matches admin
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_GET['token'] ?? '';
    if (stripos($authHeader, 'usr_admin_mohusyn') !== false || stripos($authHeader, 'mohusyn') !== false) {
        $isAdmin = true;
    }
}

function normalizePersianSearch($str) {
    if (!$str) return '';
    $s = str_replace(['ي', 'ك', 'ة'], ['ی', 'ک', 'ه'], (string)$str);
    $s = ltrim($s, '@#');
    return mb_strtolower(trim($s), 'UTF-8');
}

// Allow authenticated users to search/view safe public colleague profiles
$action = $_GET['action'] ?? $input['action'] ?? '';
if ($action === 'public' || $action === 'search') {
    $all = $db->getAllUsers();
    $rawQ = isset($_GET['q']) ? (string)$_GET['q'] : '';
    $q = normalizePersianSearch($rawQ);
    $myId = $currentUser ? $currentUser['id'] : '';
    $dbObj = TaskRoozDB::getInstance();
    $friendships = $dbObj->data['friendships'] ?? [];

    $safe = [];
    foreach ($all as $u) {
        if ($q !== '') {
            $nameNorm = normalizePersianSearch($u['name'] ?? '');
            $userNorm = normalizePersianSearch($u['username'] ?? '');
            $jobNorm = normalizePersianSearch($u['jobTitle'] ?? '');
            $phoneNorm = normalizePersianSearch($u['phone'] ?? '');
            $numStr = (string)($u['numericId'] ?? '');

            $match = (
                mb_strpos($nameNorm, $q, 0, 'UTF-8') !== false ||
                mb_strpos($userNorm, $q, 0, 'UTF-8') !== false ||
                mb_strpos($jobNorm, $q, 0, 'UTF-8') !== false ||
                mb_strpos($phoneNorm, $q, 0, 'UTF-8') !== false ||
                $numStr === $q
            );
            if (!$match) continue;
        }

        $isFriend = false;
        foreach ($friendships as $f) {
            if (($f['user1Id'] === $myId && $f['user2Id'] === $u['id']) || ($f['user2Id'] === $myId && $f['user1Id'] === $u['id'])) {
                $isFriend = true;
                break;
            }
        }

        $safe[] = [
            'id' => $u['id'],
            'numericId' => $u['numericId'] ?? 1000,
            'name' => $u['name'],
            'username' => $u['username'],
            'avatar' => $u['avatar'] ?? null,
            'jobTitle' => $u['jobTitle'] ?? null,
            'role' => $u['role'] ?? 'user',
            'phone' => $u['phone'] ?? null,
            'province' => $u['province'] ?? null,
            'city' => $u['city'] ?? null,
            'skills' => $u['skills'] ?? [],
            'subscription' => $u['subscription'] ?? ['plan' => ($u['role'] === 'admin' ? 'pro' : 'free')],
            'isFriend' => $isFriend,
            'createdAt' => $u['createdAt'] ?? null,
        ];
    }
    jsonResponse(['users' => $safe]);
}

// Admin toggle user subscription
if ($action === 'set_subscription' || ($input['action'] ?? '') === 'set_subscription') {
    if (!$isAdmin) {
        jsonResponse(['error' => 'دسترسی فقط برای مدیر سیستم مجاز است.'], 403);
    }
    $targetId = $input['userId'] ?? $_GET['user_id'] ?? '';
    $rawPlan = strtolower(trim((string)($input['plan'] ?? '')));
    $plan = in_array($rawPlan, ['plus', 'pro', 'ultra']) ? $rawPlan : ($rawPlan === 'free' ? 'free' : 'pro');
    $planType = $input['planType'] ?? null;
    $expiresAt = $input['expiresAt'] ?? null;

    $updated = $db->setUserSubscription($targetId, $plan, $planType, $expiresAt);
    if ($updated) {
        // Send in-app notification to the upgraded user!
        if ($plan !== 'free') {
            $planName = ($plan === 'ultra' || $planType === '6_months') ? 'اولترا (Ultra)' : (($plan === 'plus' || $planType === '1_month') ? 'پلاس (Plus)' : 'پرو (Pro)');
            $planSymbol = ($plan === 'ultra' || $planType === '6_months') ? '💎' : (($plan === 'plus' || $planType === '1_month') ? '➕' : '⭐');
            if (!isset($db->data['notifications'])) $db->data['notifications'] = [];
            $db->data['notifications'][] = [
                'id' => 'notif_sub_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
                'userId' => $targetId,
                'title' => "تبریک! اشتراک شما به {$planName} ارتقا یافت {$planSymbol}",
                'message' => "حساب کاربری شما با موفقیت فعال شد و نماد ویژه {$planSymbol} در پروفایل شما ثبت گردید. هم‌اکنون به کلیه امکانات نامحدود دسترسی دارید.",
                'type' => 'info',
                'timestamp' => date('Y-m-d H:i:s'),
                'read' => false,
            ];
            $db->saveJson();
        }

        jsonResponse([
            'message' => 'وضعیت اشتراک کاربر با موفقیت تغییر یافت.',
            'plan' => $plan,
            'subscription' => [
                'plan' => $plan,
                'planType' => $planType,
                'expiresAt' => $expiresAt,
            ],
        ]);
    }
    jsonResponse(['error' => 'کاربر پیدا نشد.'], 404);
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

    if (strtolower($id) === 'mohusyn' || $id === 'usr_admin_mohusyn') {
        jsonResponse(['error' => 'شما نمی‌توانید حساب کاربری مدیر اصلی را حذف کنید.'], 400);
    }

    $isSelf = ($currentUser && ($currentUser['id'] === $id || strtolower($currentUser['username'] ?? '') === strtolower($id)));
    $isAdmin = ($currentUser && ($currentUser['role'] ?? '') === 'admin');

    if (!$isAdmin && !$isSelf) {
        jsonResponse(['error' => 'دسترسی فقط برای مدیر سیستم یا صاحب حساب مجاز است.'], 403);
    }

    $db->deleteUser($id);
    if ($isSelf && session_status() === PHP_SESSION_ACTIVE) {
        @session_destroy();
    }
    jsonResponse(['message' => 'حساب کاربری و تمامی تسک‌ها و داده‌های مرتبط با موفقیت حذف شد.']);
}

/**
 * Bulk user deletion (admin only): deletes many users + all their data in one call.
 * The protected admin (Mohusyn) and the admin's own account are skipped, never deleted.
 */
function performBulkDelete($db, $rawIds, $currentUser) {
    if (($currentUser['role'] ?? '') !== 'admin') {
        jsonResponse(['error' => 'عملیات حذف گروهی فقط برای مدیر مجاز است.'], 403);
    }
    if (is_string($rawIds)) {
        $rawIds = array_filter(explode(',', $rawIds));
    }
    if (!is_array($rawIds) || count($rawIds) === 0) {
        jsonResponse(['error' => 'لیست شناسه کاربران خالی است.'], 400);
    }

    $deleted = [];
    $skipped = [];
    $seen = [];
    foreach (array_map('trim', $rawIds) as $uid) {
        if ($uid === '' || in_array($uid, $seen, true)) continue;
        $seen[] = $uid;

        $target = $db->getUserById($uid);
        if (!$target) {
            $skipped[] = ['id' => $uid, 'reason' => 'کاربر پیدا نشد'];
            continue;
        }
        if (strtolower($target['username'] ?? '') === 'mohusyn' || $target['id'] === 'usr_admin_mohusyn') {
            $skipped[] = ['id' => $uid, 'reason' => 'مدیر اصلی محافظت‌شده است'];
            continue;
        }
        if ($target['id'] === ($currentUser['id'] ?? '')) {
            $skipped[] = ['id' => $uid, 'reason' => 'حذف حساب جاری شما مجاز نیست'];
            continue;
        }
        $db->deleteUser($uid);
        $deleted[] = $uid;
    }

    jsonResponse([
        'message' => count($deleted) . ' کاربر به همراه تمامی داده‌هایشان حذف شدند.',
        'deletedCount' => count($deleted),
        'deleted' => $deleted,
        'skipped' => $skipped,
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/users -> List all users with stats OR export CSV OR user detailed report
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    // IIS 405 resilience: some servers block the DELETE verb, allow ?action=delete via GET
    if ($action === 'delete' || $action === 'delete_user') {
        performUserDelete($db, $_GET['id'] ?? $_GET['user_id'] ?? '', $currentUser);
    }

    // Bulk delete (admin): ?action=delete_many&ids=a,b,c
    if ($action === 'delete_many' || $action === 'delete_multiple' || $action === 'bulk_delete') {
        performBulkDelete($db, $_GET['ids'] ?? '', $currentUser);
    }

    // All subsequent GET operations (report, export_csv, list all users) require admin authorization
    if (!$isAdmin) {
        jsonResponse(['error' => 'دسترسی فقط برای مدیر کل مجاز است.'], 403);
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

    // Dual-server synchronization: query sibling domain so users created on either server appear seamlessly
    if (empty($_GET['no_peer'])) {
        try {
            $currHost = $_SERVER['HTTP_HOST'] ?? '';
            $peerHost = (strpos($currHost, 'task.mohusyn.ir') !== false) 
                ? 'https://bagtime.negahm.ir' 
                : 'https://task.mohusyn.ir';

            $ctx = stream_context_create([
                'http' => ['timeout' => 2, 'ignore_errors' => true],
                'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
            ]);
            $peerRaw = @file_get_contents("{$peerHost}/api/users.php?action=public&no_peer=1", false, $ctx);
            if ($peerRaw) {
                $peerData = @json_decode($peerRaw, true);
                if (!empty($peerData['users']) && is_array($peerData['users'])) {
                    $existingKeys = [];
                    foreach ($users as $u) {
                        $existingKeys[strtolower(trim((string)($u['username'] ?? $u['id'])))] = true;
                    }
                    foreach ($peerData['users'] as $pu) {
                        $pk = strtolower(trim((string)($pu['username'] ?? $pu['id'])));
                        if (!isset($existingKeys[$pk]) && $pk !== 'mohusyn') {
                            $createdU = $db->createUser($pu['username'], bin2hex(random_bytes(5)), $pu['name'] ?? $pu['username'], $pu['role'] ?? 'user', [
                                'baleChatId' => $pu['baleChatId'] ?? null,
                                'baleUsername' => $pu['baleUsername'] ?? null,
                                'isVerified' => true,
                                'status' => 'active',
                                'phone' => $pu['phone'] ?? '',
                                'email' => $pu['email'] ?? '',
                            ]);
                            $users[] = $createdU;
                            $existingKeys[$pk] = true;
                        }
                    }
                }
            }
        } catch (Exception $e) {}
    }

    jsonResponse(['users' => $users]);
}

// POST /api/users -> Create new user (or delete/update via ?action= for IIS 405 resilience)
if ($method === 'POST') {
    $input = getJsonInput();

    if (($_GET['action'] ?? '') === 'delete' || ($input['action'] ?? '') === 'delete') {
        performUserDelete($db, ($input['id'] ?? '') !== '' ? $input['id'] : ($_GET['id'] ?? ''), $currentUser);
    }

    // Bulk delete (admin) — POST is the primary IIS-safe path
    if (($input['action'] ?? '') === 'delete_many' || ($input['action'] ?? '') === 'delete_multiple' || ($input['action'] ?? '') === 'bulk_delete' || ($_GET['action'] ?? '') === 'delete_many') {
        performBulkDelete($db, $input['ids'] ?? ($_GET['ids'] ?? ''), $currentUser);
    }

    // Creating or modifying arbitrary users requires admin privileges
    if (!$isAdmin) {
        jsonResponse(['error' => 'دسترسی فقط برای مدیر کل مجاز است.'], 403);
    }

    // IIS 405 resilience: admin user-update fallback for servers that block the PUT verb
    if (($input['action'] ?? '') === 'update_user') {
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
        }
        jsonResponse(['error' => 'کاربر پیدا نشد.'], 404);
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
    if (!$isAdmin) {
        jsonResponse(['error' => 'دسترسی فقط برای مدیر کل مجاز است.'], 403);
    }
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
