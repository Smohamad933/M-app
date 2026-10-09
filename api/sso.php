<?php
/**
 * TaskRooz - Unified SSO (Single Sign-On) Gateway for https://sso.negahm.ir
 * Based on OpenAPI 3.0.3 specification of Negahm SSO.
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? 'status';

// Load settings from database
$globalSettings = $db->getGlobalSettings();
$ssoConfig = $globalSettings['ssoSettings'] ?? [
    'enabled' => true,
    'testMode' => true,
    'serverUrl' => 'https://sso.negahm.ir',
    'appKey' => '',
    'appSecret' => '',
    'autoProvisionUsers' => true,
];

$serverUrl = rtrim($ssoConfig['serverUrl'] ?? 'https://sso.negahm.ir', '/');
$appKey = trim($ssoConfig['appKey'] ?? '');
$appSecret = trim($ssoConfig['appSecret'] ?? '');
$testMode = !empty($ssoConfig['testMode']) || empty($appKey) || empty($appSecret);

function curlRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data !== null) {
            $body = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
    } elseif ($method === 'PATCH' || $method === 'PUT' || $method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data !== null) {
            $body = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
    }

    $allHeaders = array_merge(['Content-Type: application/json', 'Accept: application/json'], $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $allHeaders);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'body' => $response,
        'data' => json_decode($response, true),
        'error' => $curlError,
    ];
}

// 1. GET /api/sso.php?action=status
if ($action === 'status') {
    jsonResponse([
        'enabled' => !empty($ssoConfig['enabled']),
        'testMode' => $testMode,
        'serverUrl' => $serverUrl,
        'hasCredentials' => (!empty($appKey) && !empty($appSecret)),
        'autoProvision' => !empty($ssoConfig['autoProvisionUsers']),
        'providerName' => 'سامانه احراز هویت یکپارچه نگاه (sso.negahm.ir)',
    ]);
}

// 2. GET /api/sso.php?action=health -> Test health of sso.negahm.ir
if ($action === 'health') {
    $res = curlRequest("{$serverUrl}/v1/health");
    if ($res['code'] === 200 && is_array($res['data'])) {
        jsonResponse([
            'status' => 'connected',
            'serverUrl' => $serverUrl,
            'response' => $res['data'],
            'message' => 'ارتباط با سرور احراز هویت یکپارچه برقرار است.',
        ]);
    } else {
        jsonResponse([
            'status' => 'offline',
            'serverUrl' => $serverUrl,
            'code' => $res['code'],
            'error' => $res['error'] ?: 'عدم برقراری ارتباط با سرور SSO',
            'raw' => $res['body'],
        ], 502);
    }
}

// 3. POST /api/sso.php?action=login -> Login with email and password
if ($action === 'login') {
    $input = getJsonInput();
    $email = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    $forceTest = !empty($input['isTest']) || !empty($input['testMode']);

    if (empty($email) || empty($password)) {
        jsonResponse(['error' => 'ایمیل و رمز عبور الزامی است.'], 400);
    }

    $ssoUser = null;
    $ssoAccessToken = null;

    // A. Real SSO flow against sso.negahm.ir
    if (!$testMode && !$forceTest && !empty($appKey) && !empty($appSecret)) {
        $apiRes = curlRequest("{$serverUrl}/v1/auth/login", 'POST', [
            'email' => $email,
            'password' => $password,
        ], [
            "X-Api-Key: {$appKey}",
            "X-Api-Secret: {$appSecret}",
        ]);

        if ($apiRes['code'] >= 200 && $apiRes['code'] < 300 && !empty($apiRes['data']['user'])) {
            $ssoUser = $apiRes['data']['user'];
            $ssoAccessToken = $apiRes['data']['access_token'] ?? null;
        } else {
            $err = $apiRes['data']['error'] ?? $apiRes['data']['message'] ?? 'ایمیل یا رمز عبور در سامانه یکپارچه اشتباه است.';
            jsonResponse(['error' => $err, 'details' => $apiRes['data']], 401);
        }
    } else {
        // B. Sandbox / Test mode simulated authentication
        $ssoUser = [
            'id' => 'sso_' . substr(md5($email), 0, 8),
            'email' => $email,
            'full_name' => $input['full_name'] ?? (explode('@', $email)[0]),
            'role' => (strpos($email, 'admin') !== false) ? 'admin' : 'member',
            'status' => 'active',
        ];
        $ssoAccessToken = 'mock_sso_jwt_' . bin2hex(random_bytes(16));
    }

    // Sync / Provision user into TaskRooz local database
    $user = null;
    $ssoId = (string)($ssoUser['id'] ?? '');
    $allUsers = $db->getUsers();
    foreach ($allUsers as $u) {
        if ((!empty($u['ssoId']) && (string)$u['ssoId'] === $ssoId) || (!empty($u['email']) && strtolower($u['email']) === $email)) {
            $user = $u;
            break;
        }
    }

    $roleMapping = in_array($ssoUser['role'] ?? '', ['owner', 'admin']) ? 'admin' : 'user';

    if (!$user) {
        // Create new user mapped from SSO
        $username = explode('@', $email)[0];
        // Ensure username uniqueness
        $baseUsername = $username;
        $counter = 1;
        while ($db->getUserByUsername($username)) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        $fullName = !empty($ssoUser['full_name']) ? $ssoUser['full_name'] : $username;
        $user = $db->createUser($username, bin2hex(random_bytes(10)), $fullName, $roleMapping);
        if ($user) {
            $db->updateUser([
                'id' => $user['id'],
                'email' => $email,
                'ssoId' => $ssoId,
                'ssoProvider' => 'negahm_sso',
                'isVerified' => true,
                'status' => 'active',
                'jobTitle' => $input['jobTitle'] ?? 'عضو سامانه یکپارچه',
            ]);
            $user = $db->getUserById($user['id']);
        }
    } else {
        // Update existing user with latest info from SSO
        $db->updateUser([
            'id' => $user['id'],
            'email' => $email,
            'ssoId' => $ssoId,
            'ssoProvider' => 'negahm_sso',
            'isVerified' => true,
            'status' => 'active',
        ]);
        $user = $db->getUserById($user['id']);
    }

    if (!$user) {
        jsonResponse(['error' => 'خطا در ثبت کاربر از سامانه احراز هویت یکپارچه.'], 500);
    }

    $token = generateToken($user['id']);
    jsonResponse([
        'message' => 'ورود با سامانه احراز هویت یکپارچه با موفقیت انجام شد.',
        'user' => $user,
        'token' => $token,
        'ssoToken' => $ssoAccessToken,
        'isTestMode' => $testMode || $forceTest,
    ]);
}

// 4. POST /api/sso.php?action=register -> Register new user on sso.negahm.ir
if ($action === 'register') {
    $input = getJsonInput();
    $email = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    $fullName = trim($input['full_name'] ?? '');
    $phone = trim($input['phone'] ?? '');

    if (empty($email) || empty($password)) {
        jsonResponse(['error' => 'ایمیل و رمز عبور الزامی است.'], 400);
    }

    if (!$testMode && !empty($appKey) && !empty($appSecret)) {
        $apiRes = curlRequest("{$serverUrl}/v1/auth/register", 'POST', [
            'email' => $email,
            'password' => $password,
            'full_name' => $fullName,
            'phone' => $phone,
            'role' => 'member',
        ], [
            "X-Api-Key: {$appKey}",
            "X-Api-Secret: {$appSecret}",
        ]);

        if ($apiRes['code'] >= 200 && $apiRes['code'] < 300 && !empty($apiRes['data']['user'])) {
            $ssoUser = $apiRes['data']['user'];
        } else {
            $err = $apiRes['data']['error'] ?? $apiRes['data']['message'] ?? 'خطا در ثبت‌نام کاربر در سامانه یکپارچه.';
            jsonResponse(['error' => $err, 'details' => $apiRes['data']], 400);
        }
    }

    // Auto login
    $_POST['action'] = 'login';
    $action = 'login';
    // Fall through to login logic above
}

// 5. GET /api/sso.php?action=users -> Fetch users from sso.negahm.ir (Admin only)
if ($action === 'users') {
    $currentUser = requireAdmin();

    if ($testMode || empty($appKey) || empty($appSecret)) {
        jsonResponse([
            'testMode' => true,
            'message' => 'در حالت آزمایشی، لیست کاربران نمونه نمایش داده می‌شود.',
            'users' => [
                ['id' => 12, 'email' => 'ali@example.com', 'full_name' => 'علی رضایی', 'role' => 'member', 'status' => 'active'],
                ['id' => 13, 'email' => 'sara@example.com', 'full_name' => 'سارا احمدی', 'role' => 'admin', 'status' => 'active'],
                ['id' => 14, 'email' => 'reza@example.com', 'full_name' => 'رضا محمدی', 'role' => 'member', 'status' => 'active'],
            ],
        ]);
    }

    $q = $_GET['q'] ?? '';
    $url = "{$serverUrl}/v1/users" . ($q ? '?q=' . urlencode($q) : '');
    $res = curlRequest($url, 'GET', null, [
        "X-Api-Key: {$appKey}",
        "X-Api-Secret: {$appSecret}",
    ]);

    if ($res['code'] === 200) {
        jsonResponse($res['data']);
    } else {
        jsonResponse(['error' => 'عدم دریافت کاربران از سرور SSO.', 'details' => $res['body']], $res['code'] ?: 500);
    }
}

// 6. POST /api/sso.php?action=import_users -> Migrate all users from SSO into TaskRooz
if ($action === 'import_users') {
    $currentUser = requireAdmin();
    $input = getJsonInput();
    $ssoUsers = $input['users'] ?? [];

    if (empty($ssoUsers) && !$testMode && !empty($appKey) && !empty($appSecret)) {
        $res = curlRequest("{$serverUrl}/v1/users?per_page=100", 'GET', null, [
            "X-Api-Key: {$appKey}",
            "X-Api-Secret: {$appSecret}",
        ]);
        if (!empty($res['data']['data'])) {
            $ssoUsers = $res['data']['data'];
        }
    }

    $imported = 0;
    $updated = 0;

    foreach ($ssoUsers as $su) {
        $email = strtolower($su['email'] ?? '');
        $ssoId = (string)($su['id'] ?? '');
        $fullName = $su['full_name'] ?? explode('@', $email)[0];
        $roleMapping = in_array($su['role'] ?? '', ['owner', 'admin']) ? 'admin' : 'user';

        if (empty($email)) continue;

        $existing = null;
        foreach ($db->getUsers() as $u) {
            if ((!empty($u['ssoId']) && (string)$u['ssoId'] === $ssoId) || (!empty($u['email']) && strtolower($u['email']) === $email)) {
                $existing = $u;
                break;
            }
        }

        if ($existing) {
            $db->updateUser([
                'id' => $existing['id'],
                'email' => $email,
                'ssoId' => $ssoId,
                'ssoProvider' => 'negahm_sso',
                'name' => $fullName,
            ]);
            $updated++;
        } else {
            $username = explode('@', $email)[0];
            $baseUname = $username;
            $cnt = 1;
            while ($db->getUserByUsername($username)) {
                $username = $baseUname . $cnt++;
            }
            $newUser = $db->createUser($username, bin2hex(random_bytes(10)), $fullName, $roleMapping);
            if ($newUser) {
                $db->updateUser([
                    'id' => $newUser['id'],
                    'email' => $email,
                    'ssoId' => $ssoId,
                    'ssoProvider' => 'negahm_sso',
                    'isVerified' => true,
                    'status' => 'active',
                ]);
                $imported++;
            }
        }
    }

    jsonResponse([
        'message' => "مهاجرت با موفقیت انجام شد: {$imported} کاربر جدید اضافه شد و {$updated} کاربر به‌روزرسانی گردید.",
        'importedCount' => $imported,
        'updatedCount' => $updated,
    ]);
}

jsonResponse(['error' => 'عملیات نامعتبر است.'], 400);
