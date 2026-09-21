<?php
/**
 * TaskRooz - Personality Test API
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
$userId = $currentUser['id'] ?? 'usr_admin_mohusyn';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $result = $db->getPersonalityResult($userId);
    jsonResponse(['result' => $result]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $db->savePersonalityResult($userId, $input);
    jsonResponse(['message' => 'نتیجه آزمون ثبت شد.']);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
