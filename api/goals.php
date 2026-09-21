<?php
/**
 * TaskRooz - Career Goals API
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
$userId = $currentUser['id'] ?? 'usr_admin_mohusyn';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $goals = $db->getGoals($userId);
    jsonResponse(['goals' => $goals]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['title'])) {
        jsonResponse(['error' => 'عنوان هدف الزامی است.'], 400);
    }
    $goal = $db->createGoal($input, $userId);
    jsonResponse(['message' => 'هدف با موفقیت ثبت شد.', 'goal' => $goal], 201);
}

if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? '';
    if (empty($id)) jsonResponse(['error' => 'شناسه هدف الزامی است.'], 400);
    $ok = $db->updateGoal($id, $input);
    jsonResponse(['message' => 'هدف به‌روزرسانی شد.']);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (empty($id)) jsonResponse(['error' => 'شناسه هدف الزامی است.'], 400);
    $db->deleteGoal($id);
    jsonResponse(['message' => 'هدف با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
