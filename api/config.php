<?php
/**
 * TaskRooz - Configuration & Database Initialization
 * Compatible with PHP 7.4, 8.0, 8.1, 8.2, 8.3, 8.4 on Windows IIS / Linux Apache / Nginx
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once __DIR__ . '/db.php';

$db = TaskRoozDB::getInstance();
$pdo = $db->getPdo();

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function getCurrentUser($dbInstance = null) {
    global $db;
    $storage = $dbInstance ?: $db;

    if (!empty($_SESSION['user_id'])) {
        $u = $storage->getUserById($_SESSION['user_id']);
        if ($u) {
            unset($u['password_hash']);
            return $u;
        }
    }

    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $decoded = base64_decode($token);
        if ($decoded && strpos($decoded, ':') !== false) {
            list($userId) = explode(':', $decoded);
            $u = $storage->getUserById($userId);
            if ($u) {
                unset($u['password_hash']);
                return $u;
            }
        }
    }

    return null;
}

function requireAuth($dbInstance = null) {
    $user = getCurrentUser($dbInstance);
    if (!$user) {
        jsonResponse(['error' => 'لطفاً ابتدا وارد شوید.'], 401);
    }
    return $user;
}

function requireAdmin($dbInstance = null) {
    $user = requireAuth($dbInstance);
    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'دسترسی فقط برای مدیر مجاز است.'], 403);
    }
    return $user;
}
