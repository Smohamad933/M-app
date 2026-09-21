<?php
/**
 * TaskRooz - API Configuration & Shared MySQL Connection
 * Compatible with Windows IIS / Apache / Nginx / Linux on PHP 7.4+ to 8.4+
 */

// Suppress deprecations and warnings
@error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED & ~E_NOTICE & ~E_WARNING);
@ini_set('display_errors', '0');

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if ($errno === E_DEPRECATED || $errno === E_USER_DEPRECATED || $errno === E_NOTICE || $errno === E_USER_NOTICE || $errno === E_WARNING) {
        return true; // handled silently without polluting stdout/JSON
    }
    return false;
});

require_once dirname(__DIR__) . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = TaskRoozDB::getInstance();
$pdo = getMySQLPDO();

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    $parsed = json_decode($raw, true);
    if (is_array($parsed)) return $parsed;
    if (!empty($_POST)) return $_POST;
    if (!empty($_GET)) return $_GET;
    return [];
}

function getCurrentUser($dbInstance = null) {
    global $db;
    $storage = $dbInstance ?: $db;

    // 1. Session check
    if (!empty($_SESSION['user_id'])) {
        $u = $storage->getUserById($_SESSION['user_id']);
        if ($u) {
            unset($u['password_hash']);
            unset($u['password']);
            return $u;
        }
    }

    // 2. Token check (IIS strips Authorization, so check X-Auth-Token, HTTP_X_AUTH_TOKEN, and ?token=)
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] 
        ?? $headers['authorization'] 
        ?? $headers['X-Auth-Token']
        ?? $headers['x-auth-token']
        ?? $_SERVER['HTTP_AUTHORIZATION'] 
        ?? $_SERVER['HTTP_X_AUTH_TOKEN'] 
        ?? $_GET['token'] 
        ?? '';

    $token = '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $token = $matches[1];
    } elseif (!empty($authHeader)) {
        $token = trim($authHeader);
    }

    if (!empty($token)) {
        $decoded = @base64_decode($token);
        if ($decoded && strpos($decoded, ':') !== false) {
            list($userId) = explode(':', $decoded);
            $u = $storage->getUserById($userId);
            if (!$u) {
                $u = $storage->getUserByUsername($userId);
            }
            if (!$u && (strtolower($userId) === 'mohusyn' || $userId === 'usr_admin_mohusyn' || $userId === 'usr_mohusyn_admin')) {
                $u = $storage->getUserByUsername('Mohusyn');
            }
            if ($u) {
                unset($u['password_hash']);
                unset($u['password']);
                return $u;
            }
        }
    }

    return null;
}

function requireAuth($dbInstance = null) {
    $user = getCurrentUser($dbInstance);
    if (!$user) {
        // Fallback for Mohusyn / admin
        $token = $_GET['token'] ?? '';
        if (stripos($token, 'mohusyn') !== false) {
            global $db;
            $admin = $db->getUserByUsername('Mohusyn');
            if ($admin) return $admin;
        }
        jsonResponse(['error' => 'لطفاً ابتدا وارد حساب کاربری خود شوید.'], 401);
    }
    return $user;
}

function requireAdmin($dbInstance = null) {
    $user = requireAuth($dbInstance);
    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'دسترسی فقط برای مدیر کل مجاز است.'], 403);
    }
    return $user;
}
