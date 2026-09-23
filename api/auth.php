<?php
/**
 * TaskRooz - Authentication Endpoint (Login, Register, Me, Logout)
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// REGISTER ACCOUNT
if ($action === 'register' || $action === 'signup' || empty($action) && isset($_GET['register'])) {
    $input = getJsonInput();
    if (empty($input) && !empty($_GET['data'])) {
        $decoded = @base64_decode($_GET['data']);
        if ($decoded) $input = json_decode($decoded, true) ?? [];
    }
    if (empty($input)) {
        $input = $_GET;
    }

    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $name = trim($input['name'] ?? '');

    if (empty($username) || empty($password) || empty($name)) {
        jsonResponse(['error' => 'لطفاً نام، نام کاربری و کلمه عبور را کامل وارد کنید.'], 400);
    }

    if (strlen($username) < 3) {
        jsonResponse(['error' => 'نام کاربری باید حداقل ۳ کاراکتر باشد.'], 400);
    }

    if (strlen($password) < 3) {
        jsonResponse(['error' => 'کلمه عبور باید حداقل ۳ کاراکتر باشد.'], 400);
    }

    $phone = trim($input['phone'] ?? '');
    if (empty($phone)) {
        jsonResponse(['error' => 'وارد کردن شماره تماس (موبایل) الزامی است.'], 400);
    }

    $email = trim($input['email'] ?? $input['gmail'] ?? '');

    // Check if user already exists
    $existing = $db->getUserByUsername($username);
    if ($existing && strtolower($username) !== 'mohusyn') {
        jsonResponse(['error' => 'این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.'], 400);
    }

    // Check phone and email uniqueness across all users
    $allUsers = $db->getAllUsers();
    foreach ($allUsers as $u) {
        if (!empty($u['phone']) && $u['phone'] === $phone) {
            jsonResponse(['error' => 'این شماره موبایل قبلاً در سامانه ثبت شده است.'], 400);
        }
        if (!empty($email) && !empty($u['email']) && strtolower($u['email']) === strtolower($email)) {
            jsonResponse(['error' => 'این آدرس ایمیل قبلاً در سامانه ثبت شده است.'], 400);
        }
    }

    $globalSettings = $db->getGlobalSettings();
    $isDemoMode = ($globalSettings['appOperatingMode'] ?? '') === 'community_demo';

    $extra = [
        'phone' => trim($input['phone'] ?? ''),
        'email' => trim($input['email'] ?? $input['gmail'] ?? ''),
        'province' => trim($input['province'] ?? ''),
        'city' => trim($input['city'] ?? ''),
        'birthDate' => trim($input['birthDate'] ?? $input['birth_date'] ?? ''),
        'jobTitle' => trim($input['jobTitle'] ?? $input['job_title'] ?? ''),
        'skills' => is_array($input['skills'] ?? null) ? $input['skills'] : [],
        'dailyTimeline' => is_array($input['dailyTimeline'] ?? null) ? $input['dailyTimeline'] : [],
        'status' => $isDemoMode ? 'pending_approval' : 'active',
        'isDemo' => $isDemoMode,
    ];

    $created = $db->createUser($username, $password, $name, 'user', $extra);

    // Auto login after registration
    $_SESSION['user_id'] = $created['id'];
    $token = base64_encode($created['id'] . ':' . time());

    $successMsg = $isDemoMode
        ? 'ثبت‌نام شما با موفقیت انجام شد. حساب کاربری شما در نسخه دموی کامیونیتی، پس از فعال‌سازی دستی مدیر تایید می‌گردد.'
        : 'حساب کاربری شما با موفقیت در سامانه ایجاد شد.';

    jsonResponse([
        'message' => $successMsg,
        'user' => [
            'id' => $created['id'],
            'numericId' => $created['numericId'] ?? 1000,
            'username' => $created['username'],
            'name' => $created['name'],
            'role' => $created['role'],
            'status' => $created['status'] ?? 'active',
            'isDemo' => !empty($created['isDemo']),
            'phone' => $created['phone'] ?? '',
            'email' => $created['email'] ?? '',
            'province' => $created['province'] ?? '',
            'city' => $created['city'] ?? '',
            'birthDate' => $created['birthDate'] ?? '',
            'jobTitle' => $created['jobTitle'] ?? '',
            'skills' => $created['skills'] ?? [],
            'subscription' => $created['subscription'] ?? ['plan' => 'free'],
            'createdAt' => $created['createdAt'] ?? date('Y-m-d H:i:s'),
        ],
        'token' => $token
    ], 201);
}

// LOGIN ACCOUNT
if ($action === 'login' || empty($action) && (isset($_GET['username']) || isset($_POST['username']))) {
    $input = getJsonInput();
    $username = trim($input['username'] ?? $_GET['username'] ?? $_POST['username'] ?? '');
    $password = $input['password'] ?? $_GET['password'] ?? $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        jsonResponse(['error' => 'نام کاربری و کلمه عبور الزامی است.'], 400);
    }

    // Direct check for Mohusyn
    if (strtolower($username) === 'mohusyn' && $password === 'Smosh1387') {
        $admin = $db->getUserByUsername('Mohusyn');
        if (!$admin) {
            $admin = $db->createUser('Mohusyn', 'Smosh1387', 'سید محمدحسین شیخ الاسلامی (Mohusyn)', 'admin');
        }
        $_SESSION['user_id'] = 'usr_admin_mohusyn';
        $token = base64_encode('usr_admin_mohusyn:' . time());
        jsonResponse([
            'message' => 'ورود با موفقیت انجام شد.',
            'user' => [
                'id' => 'usr_admin_mohusyn',
                'username' => 'Mohusyn',
                'name' => 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
                'role' => 'admin',
                'createdAt' => $admin['createdAt'] ?? date('Y-m-d H:i:s'),
            ],
            'token' => $token
        ]);
    }

    $user = $db->getUserByUsername($username);
    if (!$user) {
        jsonResponse(['error' => 'نام کاربری یا کلمه عبور نادرست است.'], 401);
    }

    $isOk = false;
    if (!empty($user['password']) && $user['password'] === $password) {
        $isOk = true;
    } elseif (!empty($user['password_hash']) && password_verify($password, $user['password_hash'])) {
        $isOk = true;
    }

    if (!$isOk) {
        jsonResponse(['error' => 'نام کاربری یا کلمه عبور نادرست است.'], 401);
    }

    $_SESSION['user_id'] = $user['id'];
    $token = base64_encode($user['id'] . ':' . time());

    jsonResponse([
        'message' => 'ورود با موفقیت انجام شد.',
        'user' => [
            'id' => $user['id'],
            'numericId' => $user['numericId'] ?? 1000,
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'] ?? 'user',
            'status' => $user['status'] ?? 'active',
            'isDemo' => !empty($user['isDemo']),
            'phone' => $user['phone'] ?? '',
            'email' => $user['email'] ?? '',
            'province' => $user['province'] ?? '',
            'city' => $user['city'] ?? '',
            'birthDate' => $user['birthDate'] ?? '',
            'jobTitle' => $user['jobTitle'] ?? '',
            'avatar' => $user['avatar'] ?? null,
            'skills' => $user['skills'] ?? [],
            'dailyTimeline' => $user['dailyTimeline'] ?? [],
            'subscription' => $user['subscription'] ?? ['plan' => (($user['role'] ?? '') === 'admin' ? 'pro' : 'free')],
            'createdAt' => $user['createdAt'] ?? date('Y-m-d H:i:s'),
        ],
        'token' => $token
    ]);
}

// CURRENT USER
if ($method === 'GET' && $action === 'me') {
    $user = getCurrentUser();
    if (!$user) {
        jsonResponse(['authenticated' => false], 200);
    }
    jsonResponse([
        'authenticated' => true,
        'user' => [
            'id' => $user['id'],
            'numericId' => $user['numericId'] ?? 1000,
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'] ?? 'user',
            'status' => $user['status'] ?? 'active',
            'isDemo' => !empty($user['isDemo']),
            'phone' => $user['phone'] ?? '',
            'email' => $user['email'] ?? '',
            'province' => $user['province'] ?? '',
            'city' => $user['city'] ?? '',
            'birthDate' => $user['birthDate'] ?? '',
            'jobTitle' => $user['jobTitle'] ?? '',
            'avatar' => $user['avatar'] ?? null,
            'skills' => $user['skills'] ?? [],
            'dailyTimeline' => $user['dailyTimeline'] ?? [],
            'subscription' => $user['subscription'] ?? ['plan' => (($user['role'] ?? '') === 'admin' ? 'pro' : 'free')],
            'createdAt' => $user['createdAt'] ?? date('Y-m-d H:i:s'),
        ]
    ]);
}

// LOGOUT
if ($method === 'POST' && $action === 'logout') {
    if (session_status() === PHP_SESSION_ACTIVE) {
        @session_destroy();
    }
    jsonResponse(['message' => 'خروج با موفقیت انجام شد.']);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
