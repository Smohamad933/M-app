<?php
/**
 * TaskRooz - Daily Notes API
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
$userId = $currentUser['id'] ?? 'usr_admin_mohusyn';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $notes = $db->getDailyNotes($userId);
    jsonResponse(['notes' => $notes]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $date = $input['date'] ?? date('Y-m-d');
    $content = $input['content'] ?? '';
    $db->saveDailyNote($userId, $date, $content);
    jsonResponse(['message' => 'یادداشت با موفقیت ذخیره شد.']);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
