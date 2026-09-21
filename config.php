<?php
/**
 * TaskRooz - Configuration & MySQL Connection
 * Compatible with PHP 7.4, 8.0, 8.1, 8.2, 8.3, 8.4 on Windows IIS / Linux Apache / Nginx
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// MySQL Configuration Defaults (Can be updated via install.php)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'taskrooz_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Load database layer
require_once __DIR__ . '/api/db.php';

$db = TaskRoozDB::getInstance();

function getMySQLPDO() {
    static $mysqlPdo = null;
    if ($mysqlPdo !== null) return $mysqlPdo;

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $mysqlPdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
        ]);
        return $mysqlPdo;
    } catch (Exception $e) {
        return null;
    }
}

function getActiveUser() {
    global $db;
    if (!empty($_SESSION['user_id'])) {
        $u = $db->getUserById($_SESSION['user_id']);
        if ($u) {
            unset($u['password_hash']);
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
