<?php
/**
 * TaskRooz - Central API Router for IIS URL Rewrite & Apache
 */
$uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($uri, PHP_URL_PATH);

// Extract endpoint e.g. /api/users -> users
$segments = explode('/', trim($path, '/'));
$apiIndex = array_search('api', $segments);

$endpoint = 'tasks';
if ($apiIndex !== false && isset($segments[$apiIndex + 1])) {
    $endpoint = str_replace('.php', '', $segments[$apiIndex + 1]);
} elseif (isset($_GET['endpoint'])) {
    $endpoint = str_replace('.php', '', $_GET['endpoint']);
}

switch ($endpoint) {
    case 'auth':
    case 'register':
    case 'login':
        require __DIR__ . '/auth.php';
        break;
    case 'users':
        require __DIR__ . '/users.php';
        break;
    case 'rooms':
        require __DIR__ . '/rooms.php';
        break;
    case 'projects':
        require __DIR__ . '/projects.php';
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
    case 'goals':
        require __DIR__ . '/goals.php';
        break;
    case 'notes':
        require __DIR__ . '/notes.php';
        break;
    case 'personality':
        require __DIR__ . '/personality.php';
        break;
    case 'settings':
        require __DIR__ . '/settings.php';
        break;
    case 'fonts':
        require __DIR__ . '/fonts.php';
        break;
    default:
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'مسیر درخواستی یافت نشد: ' . $endpoint], JSON_UNESCAPED_UNICODE);
        break;
}
