<?php
/**
 * TaskRooz - Configuration & Database Initialization
 * Compatible with PHP 7.4, 8.0, 8.1, 8.2, 8.3 on Windows IIS / Linux Apache / Nginx
 */

// Enable session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Allow CORS & JSON output
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Error reporting for production/dev
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Database path for SQLite
$dbDir = __DIR__ . '/../data';
if (!is_dir($dbDir)) {
    @mkdir($dbDir, 0777, true);
}
$dbPath = $dbDir . '/taskrooz.sqlite';

try {
    $dbExists = file_exists($dbPath);
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Initialize schema if newly created
    if (!$dbExists || filesize($dbPath) === 0) {
        $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
        $pdo->exec($schemaSql);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Helper: send JSON response
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Helper: get parsed JSON input
function getJsonInput() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// Helper: current authenticated user from session or Bearer token
function getCurrentUser($pdo) {
    // Check session
    if (!empty($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("SELECT id, username, name, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch() ?: null;
    }

    // Check Authorization header (Bearer token)
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        // For simplicity and token-based client storage, token is base64(user_id:timestamp)
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

// Helper: require authenticated user
function requireAuth($pdo) {
    $user = getCurrentUser($pdo);
    if (!$user) {
        jsonResponse(['error' => 'لطفاً ابتدا وارد حساب کاربری خود شوید.'], 401);
    }
    return $user;
}

// Helper: require admin role
function requireAdmin($pdo) {
    $user = requireAuth($pdo);
    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'شما دسترسی لازم برای این عملیات را ندارید.'], 403);
    }
    return $user;
}
