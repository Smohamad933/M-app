<?php
/**
 * TaskRooz - Authentication Endpoint (Login, Register, Me, Logout)
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// REGISTER ACCOUNT
if ($method === 'POST' && ($action === 'register' || $action === 'signup')) {
    $input = getJsonInput();
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $name = trim($input['name'] ?? '');

    if (empty($username) || empty($password) || empty($name)) {
        jsonResponse(['error' => 'لطفاً نام، نام کاربری و کلمه عبور را کامل وارد کنید.'], 400);
    }

    if (strlen($username) < 3) {
        jsonResponse(['error' => 'نام کاربری باید حداقل ۳ کاراکتر باشد.'], 400);
    }

    if (strlen($password) < 4) {
        jsonResponse(['error' => 'کلمه عبور باید حداقل ۴ کاراکتر باشد.'], 400);
    }

    // Check if user already exists
    $existing = $db->getUserByUsername($username);
    if ($existing) {
        jsonResponse(['error' => 'این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.'], 400);
    }

    // Role is strictly user for any new registration
    $role = 'user';

    $created = $db->createUser($username, $password, $name, $role);

    // Auto login after registration
    $_SESSION['user_id'] = $created['id'];
    $token = base64_encode($created['id'] . ':' . time());

    jsonResponse([
        'message' => 'حساب کاربری شما با موفقیت ایجاد شد.',
        'user' => $created,
        'token' => $token
    ], 201);
}

// LOGIN ACCOUNT
if ($method === 'POST' && ($action === 'login' || empty($action))) {
    $input = getJsonInput();
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($username) || empty($password)) {
        jsonResponse(['error' => 'نام کاربری و کلمه عبور الزامی است.'], 400);
    }

    $user = $db->getUserByUsername($username);

    // Ensure Mohusyn exists as admin
    if (strtolower($username) === 'mohusyn' && $password === 'Smosh1387') {
        if (!$user) {
            $user = $db->createUser('Mohusyn', 'Smosh1387', 'سید محمدحسین شیخ الاسلامی (Mohusyn)', 'admin');
        } else if ($user['role'] !== 'admin') {
            $db->updateUser($user['id'], 'سید محمدحسین شیخ الاسلامی (Mohusyn)', 'admin');
            $user = $db->getUserById($user['id']);
        }
    }

    if (!$user) {
        jsonResponse(['error' => 'نام کاربری یا کلمه عبور اشتباه است.'], 401);
    }

    // Verify password
    $hash = $user['password_hash'] ?? '';
    $isOk = false;
    if ($hash && password_verify($password, $hash)) {
        $isOk = true;
    } elseif (strtolower($username) === 'mohusyn' && $password === 'Smosh1387') {
        $isOk = true;
    }

    if (!$isOk) {
        jsonResponse(['error' => 'نام کاربری یا کلمه عبور اشتباه است.'], 401);
    }

    $_SESSION['user_id'] = $user['id'];
    $token = base64_encode($user['id'] . ':' . time());

    jsonResponse([
        'message' => 'ورود با موفقیت انجام شد.',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'],
            'createdAt' => $user['created_at'] ?? date('Y-m-d H:i:s'),
        ],
        'token' => $token
    ]);
}

// CURRENT LOGGED IN USER
if ($method === 'GET' && $action === 'me') {
    $user = getCurrentUser();
    if (!$user) {
        jsonResponse(['authenticated' => false], 200);
    }
    jsonResponse([
        'authenticated' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'],
            'createdAt' => $user['created_at'] ?? date('Y-m-d H:i:s'),
        ]
    ]);
}

// LOGOUT
if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    jsonResponse(['message' => 'خروج با موفقیت انجام شد.']);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 400);
