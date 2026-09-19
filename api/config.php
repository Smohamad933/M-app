<?php
/**
 * TaskRooz - Configuration & Database Initialization
 * Compatible with PHP 7.4, 8.0, 8.1, 8.2, 8.3 on Windows IIS / Linux Apache / Nginx
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

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// Database setup
$dbDir = __DIR__ . '/../data';
if (!is_dir($dbDir)) {
    @mkdir($dbDir, 0777, true);
}
$dbPath = $dbDir . '/taskrooz.sqlite';

$pdo = null;

if (!extension_loaded('pdo_sqlite')) {
    // Return friendly error if driver not loaded
    if (basename($_SERVER['PHP_SELF']) !== 'config.php') {
        // Will be handled per endpoint
    }
} else {
    try {
        $dbExists = file_exists($dbPath);
        $pdo = new PDO("sqlite:" . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        if (!$dbExists || filesize($dbPath) === 0) {
            $schemaFile = __DIR__ . '/schema.sql';
            if (file_exists($schemaFile)) {
                $schemaSql = file_get_contents($schemaFile);
                $pdo->exec($schemaSql);
            }
        }
    } catch (Exception $e) {
        $pdo = null;
    }
}

function getCurrentUser($pdo) {
    if (!$pdo) {
        // Fallback default admin if no DB
        return [
            'id' => 'usr_admin_1',
            'username' => 'admin',
            'name' => 'مدیر سیستم',
            'role' => 'admin',
            'created_at' => date('Y-m-d H:i:s'),
        ];
    }

    if (!empty($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("SELECT id, username, name, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch() ?: null;
    }

    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $decoded = base64_decode($token);
        if ($decoded && strpos($decoded, ':') !== false) {
            list($userId) = explode(':', $decoded);
            $stmt = $pdo->prepare("SELECT id, username, name, role, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            return $stmt->fetch() ?: null;
        }
    }

    return null;
}

function requireAuth($pdo) {
    $user = getCurrentUser($pdo);
    if (!$user) {
        jsonResponse(['error' => 'لطفاً ابتدا وارد شوید.'], 401);
    }
    return $user;
}

function requireAdmin($pdo) {
    $user = requireAuth($pdo);
    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'دسترسی فقط برای مدیر مجاز است.'], 403);
    }
    return $user;
}
