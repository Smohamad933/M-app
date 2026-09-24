<?php
/**
 * TaskRooz - Database Configuration & MySQL Connection
 * Compatible with Windows IIS / Apache / Nginx / Linux on PHP 7.4+ to 8.5+
 * Built by Mohusyn (mohusyn.ir)
 */

// Disable deprecation, notices and warnings from corrupting JSON API output
@error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED & ~E_NOTICE & ~E_WARNING);
@ini_set('display_errors', '0');

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

// 1. Load local configuration if exists (so extracting new zip files NEVER overwrites your database credentials)
if (file_exists(__DIR__ . '/config.local.php')) {
    @include_once __DIR__ . '/config.local.php';
}

// ==============================================================================
// تنظیمات اتصال به پایگاه داده MySQL
// می‌توانید این مقادیر را مطابق با مشخصات دیتابیس هاست یا لوکال تغییر دهید
// یا با باز کردن install.php در مرورگر، به صورت خودکار نصب و تنظیم کنید.
// ==============================================================================
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
if (!defined('DB_PORT')) define('DB_PORT', getenv('DB_PORT') ?: '3306');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'taskrooz_db');
if (!defined('DB_NAME_USERS')) define('DB_NAME_USERS', getenv('DB_NAME_USERS') ?: DB_NAME);
if (!defined('DB_NAME_TASKS')) define('DB_NAME_TASKS', getenv('DB_NAME_TASKS') ?: DB_NAME);
if (!defined('DB_NAME_MESSAGES')) define('DB_NAME_MESSAGES', getenv('DB_NAME_MESSAGES') ?: DB_NAME);
if (!defined('DB_NAME_NOTIFICATIONS')) define('DB_NAME_NOTIFICATIONS', getenv('DB_NAME_NOTIFICATIONS') ?: DB_NAME);
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'root');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');

$GLOBALS['taskrooz_db_error'] = null;

function getMySQLPDO($module = null) {
    static $connections = [];

    $dbName = DB_NAME;
    if ($module === 'users') $dbName = DB_NAME_USERS;
    elseif ($module === 'tasks') $dbName = DB_NAME_TASKS;
    elseif ($module === 'messages') $dbName = DB_NAME_MESSAGES;
    elseif ($module === 'notifications') $dbName = DB_NAME_NOTIFICATIONS;

    if (isset($connections[$dbName])) return $connections[$dbName];

    if (!extension_loaded('pdo_mysql') || !class_exists('PDO')) {
        $GLOBALS['taskrooz_db_error'] = 'اکستنشن pdo_mysql در PHP سرور فعال نیست.';
        return null;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . $dbName . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 4,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
        $connections[$dbName] = $pdo;
        return $pdo;
    } catch (Exception $e) {
        $GLOBALS['taskrooz_db_error'] = $e->getMessage();
        return null;
    }
}

// Load unified storage layer
require_once __DIR__ . '/api/db.php';
$db = TaskRoozDB::getInstance();

function getActiveUser() {
    global $db;
    if (!empty($_SESSION['user_id'])) {
        $u = $db->getUserById($_SESSION['user_id']);
        if ($u) {
            unset($u['password_hash']);
            unset($u['password']);
            return $u;
        }
    }
    return null;
}

function requireLogin() {
    $u = getActiveUser();
    if (!$u) {
        header('Location: login.php');
        exit;
    }
    return $u;
}

function requireAdminLogin() {
    $u = requireLogin();
    if ($u['role'] !== 'admin') {
        header('Location: dashboard.php?error=access_denied');
        exit;
    }
    return $u;
}

// ==============================================================================
// اگر این فایل مستقیماً در مرورگر باز شد (Diagnostic Status Card)
// ==============================================================================
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'config.php' && php_sapi_name() !== 'cli') {
    $testPdo = getMySQLPDO();
    $isConnected = ($testPdo !== null);
    $tableCount = 0;
    if ($isConnected) {
        try {
            $stmt = $testPdo->query("SHOW TABLES");
            $tableCount = count($stmt->fetchAll(PDO::FETCH_COLUMN));
        } catch (Exception $e) {}
    }
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>وضعیت اتصال پایگاه داده | تسک‌روز</title>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', sans-serif; }
            body { background: #09090b; color: #f4f4f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
            .card { background: #18181b; border: 1px solid #27272a; border-radius: 24px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
            .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
            .badge-error { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 13px; }
            .info-val { font-family: monospace; color: #a1a1aa; }
            .btn { display: block; text-align: center; padding: 12px; border-radius: 16px; font-weight: bold; font-size: 13px; text-decoration: none; margin-top: 12px; transition: all 0.2s; }
            .btn-primary { background: #ffffff; color: #09090b; }
            .btn-primary:hover { background: #e4e4e7; }
            .btn-secondary { background: #27272a; color: #d4d4d8; }
            .btn-secondary:hover { background: #3f3f46; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2 style="font-weight: 900; font-size: 18px; margin-bottom: 8px;">تسک‌روز (TaskRooz) • وضعیت تنظیمات</h2>
            <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 20px;">گزارش وضعیت اتصال بک‌اند به پایگاه داده MySQL</p>

            <div style="margin-bottom: 20px;">
                <?php if ($isConnected): ?>
                    <span class="badge badge-success">✓ پایگاه داده MySQL متصل است (فعال)</span>
                <?php else: ?>
                    <span class="badge badge-error">✕ عدم برقراری ارتباط با دیتابیس MySQL</span>
                <?php endif; ?>
            </div>

            <div style="background: #09090b; border: 1px solid #27272a; border-radius: 16px; padding: 16px; margin-bottom: 20px;">
                <div class="info-row"><span style="color:#a1a1aa;">آدرس سرور دیتابیس:</span><span class="info-val"><?= htmlspecialchars(DB_HOST . ':' . DB_PORT) ?></span></div>
                <div class="info-row"><span style="color:#a1a1aa;">نام دیتابیس:</span><span class="info-val"><?= htmlspecialchars(DB_NAME) ?></span></div>
                <div class="info-row"><span style="color:#a1a1aa;">نام کاربری دیتابیس:</span><span class="info-val"><?= htmlspecialchars(DB_USER) ?></span></div>
                <div class="info-row"><span style="color:#a1a1aa;">موتور فعال فعلی:</span><span class="info-val"><?= htmlspecialchars($db->mode) ?></span></div>
                <?php if ($isConnected): ?>
                <div class="info-row" style="border-bottom:none;"><span style="color:#a1a1aa;">تعداد جدول‌های ساخته شده:</span><span class="info-val"><?= $tableCount ?> جدول</span></div>
                <?php else: ?>
                <div class="info-row" style="border-bottom:none; color:#fb7185; font-size:11px;"><span style="color:#fb7185;">پیام خطا:</span><span class="info-val" style="color:#fb7185;"><?= htmlspecialchars($GLOBALS['taskrooz_db_error'] ?? 'دسترسی نامعتبر') ?></span></div>
                <?php endif; ?>
            </div>

            <a href="install.php" class="btn btn-primary">رفتن به نصب‌کننده خودکار دیتابیس (install.php)</a>
            <a href="dashboard.php" class="btn btn-secondary">ورود به پنل کاربری تسک‌روز</a>
            <div style="text-align: center; margin-top: 16px; font-size: 11px; color: #71717a;">mohusyn.ir • ۲۰۲۶</div>
        </div>
    </body>
    </html>
    <?php
    exit;
}
