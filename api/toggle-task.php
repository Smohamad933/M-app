<?php
/**
 * TaskRooz - Dedicated Ultra-Fast Task Completion & Tick Recording Endpoint
 * Directly updates MySQL tasks table and task_completions table.
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = getJsonInput();
$taskId = trim($_GET['id'] ?? $input['id'] ?? '');

if (empty($taskId)) {
    jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
}

$explicitCompleted = null;
if (array_key_exists('completed', $input)) {
    $explicitCompleted = (bool)$input['completed'];
} elseif (isset($_GET['completed'])) {
    $explicitCompleted = (bool)$_GET['completed'];
}

$res = $db->toggleTask($taskId, $currentUser['id'], $explicitCompleted);

if ($res) {
    jsonResponse([
        'ok' => true,
        'taskId' => $taskId,
        'completed' => (bool)$res['completed'],
        'completedAt' => $res['completedAt'] ?? null,
        'message' => 'وضعیت تسک با موفقیت در پایگاه داده ثبت شد.',
    ]);
}

jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
