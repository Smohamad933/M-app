<?php
/**
 * TaskRooz - Server Health & Diagnostics (MySQL + Server Info)
 * Access at: https://task.mohusyn.ir/api/health.php
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$isMysqlConnected = ($db->mode === 'mysql' && $pdo !== null);
$dbTables = [];
if ($isMysqlConnected) {
    try {
        $stmt = $pdo->query("SHOW TABLES");
        $dbTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {}
}

$users = $db->getAllUsers();
$rooms = $db->listFocusRooms();

echo json_encode([
    'status' => 'ok',
    'app' => 'TaskRooz (تسک‌روز)',
    'author' => 'Mohusyn (mohusyn.ir)',
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'database' => [
        'engine' => $db->mode,
        'mysql_connected' => $isMysqlConnected,
        'db_host' => DB_HOST,
        'db_name' => DB_NAME,
        'db_user' => DB_USER,
        'tables_count' => count($dbTables),
        'tables' => $dbTables,
    ],
    'counts' => [
        'users' => count($users),
        'rooms' => count($rooms),
        'tasks' => count($db->getTasks(null)),
    ],
    'super_admin' => [
        'username' => 'Mohusyn',
        'status' => 'active',
        'default_pass' => 'Smosh1387',
    ],
    'registered_usernames' => array_map(function($u) { return $u['username']; }, $users),
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
