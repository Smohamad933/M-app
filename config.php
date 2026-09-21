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

// ==============================================================================
// تنظیمات اتصال به پایگاه داده MySQL
// می‌توانید این مقادیر را مطابق با مشخصات دیتابیس هاست یا لوکال تغییر دهید
// یا با باز کردن install.php در مرورگر، به صورت خودکار نصب و تنظیم کنید.
// ==============================================================================
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'taskrooz_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');

function getMySQLPDO() {
    static $mysqlPdo = null;
    if ($mysqlPdo !== null) return $mysqlPdo;

    if (!extension_loaded('pdo_mysql') || !class_exists('PDO')) {
        return null;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 4,
        ];
        $mysqlPdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        // Execute UTF-8 collation directly (100% compatible across PHP 7.0 - 8.5+ without deprecated constants)
        $mysqlPdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
        return $mysqlPdo;
    } catch (Exception $e) {
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
