<?php
/**
 * Central API Router for IIS URL Rewrite & Apache
 */
$uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($uri, PHP_URL_PATH);

// Extract endpoint e.g. /api/users -> users
$segments = explode('/', trim($path, '/'));
$apiIndex = array_search('api', $segments);

$endpoint = 'tasks';
if ($apiIndex !== false && isset($segments[$apiIndex + 1])) {
    $endpoint = $segments[$apiIndex + 1];
} elseif (isset($_GET['endpoint'])) {
    $endpoint = $_GET['endpoint'];
}

switch ($endpoint) {
    case 'auth':
        require __DIR__ . '/auth.php';
        break;
    case 'users':
        require __DIR__ . '/users.php';
        break;
    case 'tasks':
        require __DIR__ . '/tasks.php';
        break;
    case 'categories':
        require __DIR__ . '/categories.php';
        break;
    case 'stats':
        require __DIR__ . '/stats.php';
        break;
    default:
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'API endpoint not found: ' . $endpoint]);
        break;
}
