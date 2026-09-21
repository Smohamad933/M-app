<?php
/**
 * TaskRooz - Server Health & Diagnostics
 * Access at: https://task.mohusyn.ir/api/health.php
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$dbDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
$jsonFile = $dbDir . DIRECTORY_SEPARATOR . 'db.json';
$apiJsonFile = __DIR__ . DIRECTORY_SEPARATOR . 'db.json';

$isDataDirWritable = is_dir($dbDir) && is_writable($dbDir);
$isJsonWritable = file_exists($jsonFile) && is_writable($jsonFile);
$isApiJsonWritable = file_exists($apiJsonFile) && is_writable($apiJsonFile);

// Test write capability
$testWrite = false;
try {
    $db->saveJson();
    $testWrite = true;
} catch (Exception $e) {
    $testWrite = false;
}

$users = $db->getAllUsers();
$rooms = $db->listFocusRooms();

echo json_encode([
    'status' => 'ok',
    'app' => 'TaskRooz (تسک‌روز)',
    'author' => 'Mohusyn (mohusyn.ir)',
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'storage' => [
        'mode' => 'unified_json',
        'data_dir' => $dbDir,
        'data_dir_writable' => $isDataDirWritable,
        'db_file' => $jsonFile,
        'db_file_exists' => file_exists($jsonFile),
        'db_file_writable' => $isJsonWritable,
        'api_db_file' => $apiJsonFile,
        'api_db_exists' => file_exists($apiJsonFile),
        'test_write_success' => $testWrite,
    ],
    'counts' => [
        'users' => count($users),
        'rooms' => count($rooms),
        'tasks' => count($db->data['tasks'] ?? []),
    ],
    'registered_usernames' => array_map(function($u) { return $u['username']; }, $users),
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
