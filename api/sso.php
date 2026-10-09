<?php
/**
 * TaskRooz - Unified SSO (Single Sign-On) Authentication Gateway
 * Provides test integration for centralized organization SSO & user migration.
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

// Configuration for SSO (Can be customized via environment or database settings)
$ssoConfig = [
    'enabled' => true,
    'testMode' => true,
    'providerName' => 'سامانه احراز هویت یکپارچه',
    'authUrl' => getenv('SSO_AUTH_URL') ?: 'https://sso.example.com/oauth/authorize',
    'tokenUrl' => getenv('SSO_TOKEN_URL') ?: 'https://sso.example.com/oauth/token',
    'userInfoUrl' => getenv('SSO_USERINFO_URL') ?: 'https://sso.example.com/oauth/userinfo',
    'clientId' => getenv('SSO_CLIENT_ID') ?: 'taskrooz_app',
    'clientSecret' => getenv('SSO_CLIENT_SECRET') ?: '',
    'redirectUri' => getAppBaseUrl() . '/api/sso.php?action=callback',
];

// Helper to get base URL
function getAppBaseUrl() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $dir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    return rtrim($protocol . $host . $dir, '/');
}

// 1. GET /api/sso.php?action=status -> Returns SSO capabilities and test config
if ($action === 'status') {
    jsonResponse([
        'enabled' => $ssoConfig['enabled'],
        'testMode' => $ssoConfig['testMode'],
        'providerName' => $ssoConfig['providerName'],
        'redirectUri' => $ssoConfig['redirectUri'],
        'hasCustomConfig' => !empty(getenv('SSO_AUTH_URL')),
    ]);
}

// 2. GET /api/sso.php?action=authorize -> Starts SSO flow
if ($action === 'authorize') {
    $state = bin2hex(random_bytes(16));
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }
    $_SESSION['sso_state'] = $state;

    // In test mode, if no real SSO server is configured, allow simulated test login
    if ($ssoConfig['testMode'] && empty(getenv('SSO_AUTH_URL'))) {
        jsonResponse([
            'testMode' => true,
            'message' => 'سیستم احراز هویت یکپارچه در حالت تست فعال است.',
            'testAccounts' => [
                [
                    'ssoId' => 'sso_emp_101',
                    'username' => 'sso_user1',
                    'name' => 'کاربر تستی احراز یکپارچه (توسعه)',
                    'email' => 'user1@company.ir',
                    'role' => 'user',
                    'jobTitle' => 'توسعه‌دهنده نرم‌افزار',
                ],
                [
                    'ssoId' => 'sso_emp_102',
                    'username' => 'sso_admin',
                    'name' => 'مدیر احراز هویت یکپارچه',
                    'email' => 'admin@company.ir',
                    'role' => 'admin',
                    'jobTitle' => 'مدیر سامانه',
                ],
            ],
            'callbackUrl' => getAppBaseUrl() . '/api/sso.php?action=mock_login',
        ]);
    }

    $loginUrl = $ssoConfig['authUrl'] . '?' . http_build_query([
        'response_type' => 'code',
        'client_id' => $ssoConfig['clientId'],
        'redirect_uri' => $ssoConfig['redirectUri'],
        'scope' => 'openid profile email phone',
        'state' => $state,
    ]);

    jsonResponse(['url' => $loginUrl]);
}

// 3. POST /api/sso.php?action=mock_login -> Test mode login handler
if ($action === 'mock_login') {
    $input = getJsonInput();
    $ssoId = $input['ssoId'] ?? 'sso_emp_101';
    $name = $input['name'] ?? 'کاربر تستی احراز یکپارچه';
    $username = $input['username'] ?? ('sso_' . substr(md5($ssoId), 0, 8));
    $role = $input['role'] ?? 'user';

    // Find existing user by ssoId or username
    $user = null;
    $allUsers = $db->getUsers();
    foreach ($allUsers as $u) {
        if (($u['ssoId'] ?? '') === $ssoId || strtolower($u['username'] ?? '') === strtolower($username)) {
            $user = $u;
            break;
        }
    }

    if (!$user) {
        // Automatically provision new user migrated from SSO
        $user = $db->createUser($username, bin2hex(random_bytes(8)), $name, $role);
        if ($user) {
            $db->updateUser([
                'id' => $user['id'],
                'ssoId' => $ssoId,
                'ssoProvider' => 'unified_sso_test',
                'isVerified' => true,
                'status' => 'active',
                'jobTitle' => $input['jobTitle'] ?? 'عضو سامانه یکپارچه',
            ]);
            $user = $db->getUserById($user['id']);
        }
    }

    if (!$user) {
        jsonResponse(['error' => 'خطا در ایجاد کاربر از سامانه احراز هویت یکپارچه.'], 500);
    }

    $token = generateToken($user['id']);
    jsonResponse([
        'message' => 'ورود با احراز هویت یکپارچه با موفقیت انجام شد.',
        'user' => $user,
        'token' => $token,
    ]);
}

// 4. GET /api/sso.php?action=callback -> Production OAuth2/OIDC code callback
if ($action === 'callback') {
    $code = $_GET['code'] ?? '';
    if (empty($code)) {
        jsonResponse(['error' => 'کد احراز هویت از سرور SSO دریافت نشد.'], 400);
    }

    // Exchange code for token
    $ch = curl_init($ssoConfig['tokenUrl']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => $ssoConfig['redirectUri'],
        'client_id' => $ssoConfig['clientId'],
        'client_secret' => $ssoConfig['clientSecret'],
    ]));
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $tokenData = json_decode($res, true);
    $accessToken = $tokenData['access_token'] ?? '';
    if (empty($accessToken)) {
        jsonResponse(['error' => 'تبادل توکن با سرور SSO با خطا مواجه شد.', 'details' => $res], 400);
    }

    // Fetch user profile from SSO
    $ch = curl_init($ssoConfig['userInfoUrl']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$accessToken}"]);
    $userRes = curl_exec($ch);
    curl_close($ch);

    $ssoUser = json_decode($userRes, true);
    $ssoId = $ssoUser['sub'] ?? $ssoUser['id'] ?? $ssoUser['userId'] ?? '';
    $username = $ssoUser['preferred_username'] ?? $ssoUser['username'] ?? ('sso_' . substr(md5($ssoId), 0, 8));
    $name = $ssoUser['name'] ?? $username;

    // Check or create local user
    $user = null;
    foreach ($db->getUsers() as $u) {
        if (($u['ssoId'] ?? '') === $ssoId || strtolower($u['username'] ?? '') === strtolower($username)) {
            $user = $u;
            break;
        }
    }

    if (!$user) {
        $user = $db->createUser($username, bin2hex(random_bytes(8)), $name, 'user');
        if ($user) {
            $db->updateUser([
                'id' => $user['id'],
                'ssoId' => $ssoId,
                'ssoProvider' => 'unified_sso',
                'isVerified' => true,
                'status' => 'active',
            ]);
            $user = $db->getUserById($user['id']);
        }
    }

    $token = generateToken($user['id']);
    // Redirect to web app with token
    header("Location: /?sso_token=" . urlencode($token));
    exit;
}

jsonResponse(['error' => 'عملیات نامعتبر است.'], 400);
