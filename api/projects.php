<?php
/**
 * TaskRooz - Team Projects Endpoint
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = in_array($method, ['POST', 'PUT']) ? getJsonInput() : [];

// Project Team Chat Messages (GET /api/projects.php?action=messages&project_id=...)
if ($method === 'GET' && ($action === 'messages' || isset($_GET['messages']))) {
    $projectId = $_GET['project_id'] ?? $_GET['id'] ?? '';
    $dbObj = TaskRoozDB::getInstance();
    $all = $dbObj->data['project_messages'] ?? [];
    $list = [];
    foreach ($all as $m) {
        if (($m['projectId'] ?? '') === $projectId) $list[] = $m;
    }
    jsonResponse(['messages' => $list]);
}

// Project Team Chat Post (POST /api/projects.php?action=messages)
if ($method === 'POST' && ($action === 'messages' || ($input['action'] ?? '') === 'send_message')) {
    $projectId = $input['projectId'] ?? $_GET['project_id'] ?? '';
    $text = trim((string)($input['text'] ?? ''));
    if (empty($projectId) || empty($text)) {
        jsonResponse(['error' => 'شناسه پروژه و متن پیام الزامی است.'], 400);
    }
    $dbObj = TaskRoozDB::getInstance();
    if (!isset($dbObj->data['project_messages'])) $dbObj->data['project_messages'] = [];
    $newMsg = [
        'id' => 'pmsg_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
        'projectId' => $projectId,
        'senderId' => $currentUser['id'],
        'senderName' => $currentUser['name'],
        'senderAvatar' => $currentUser['avatar'] ?? null,
        'text' => $text,
        'createdAt' => date('Y-m-d H:i:s'),
    ];
    $dbObj->data['project_messages'][] = $newMsg;
    $dbObj->saveJson();
    jsonResponse(['message' => 'پیام با موفقیت ارسال شد.', 'data' => $newMsg], 201);
}

// GET /api/projects.php -> List user's team projects
if ($method === 'GET') {
    $projects = $db->getAllTeamProjects($currentUser['id'], false);
    jsonResponse(['projects' => $projects]);
}

// POST /api/projects.php -> Create team project
if ($method === 'POST') {
    $input = getJsonInput();
    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    $color = $input['color'] ?? '#6366f1';
    $icon = $input['icon'] ?? 'Folder';
    $memberIds = is_array($input['memberIds'] ?? null) ? $input['memberIds'] : [];

    if (empty($name)) {
        jsonResponse(['error' => 'نام پروژه تیمی الزامی است.'], 400);
    }

    $project = $db->createTeamProject($name, $description, $color, $icon, $currentUser, $memberIds);
    jsonResponse(['message' => 'پروژه تیمی با موفقیت ایجاد شد.', 'project' => $project], 201);
}

// PUT /api/projects.php -> Update team project
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? '';
    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    $color = $input['color'] ?? null;
    $icon = $input['icon'] ?? null;
    $memberIds = $input['memberIds'] ?? null;

    if (empty($id)) {
        jsonResponse(['error' => 'شناسه پروژه الزامی است.'], 400);
    }

    $existing = $db->getTeamProject($id);
    if (!$existing) {
        jsonResponse(['error' => 'پروژه یافت نشد.'], 404);
    }

    if ($existing['creatorId'] !== $currentUser['id'] && $currentUser['role'] !== 'admin') {
        jsonResponse(['error' => 'فقط ایجادکننده پروژه یا مدیر مجاز به ویرایش هستند.'], 403);
    }

    $ok = $db->updateTeamProject($id, $name, $description, $color, $icon, $memberIds);
    if ($ok) {
        jsonResponse(['message' => 'پروژه به‌روزرسانی شد.']);
    } else {
        jsonResponse(['error' => 'خطا در ویرایش پروژه.'], 400);
    }
}

// DELETE /api/projects.php?id=... (also handles POST with action=delete for IIS compatibility)
$isDeleteAction = ($method === 'DELETE') ||
    ($method === 'POST' && (
        $action === 'delete' ||
        ($input['action'] ?? '') === 'delete' ||
        ($_GET['_method'] ?? '') === 'DELETE' ||
        ($_POST['_method'] ?? '') === 'DELETE'
    ));

if ($isDeleteAction) {
    $id = $_GET['id'] ?? $input['id'] ?? $_POST['id'] ?? '';
    if (empty($id) && !empty($_SERVER['PATH_INFO'])) {
        $id = trim($_SERVER['PATH_INFO'], '/');
    }
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه پروژه الزامی است.'], 400);
    }

    $existing = $db->getTeamProject($id);
    if (!$existing) {
        jsonResponse(['error' => 'پروژه یافت نشد.'], 404);
    }

    $isAdmin = ($currentUser['role'] === 'admin' || strtolower($currentUser['username'] ?? '') === 'mohusyn' || ($currentUser['id'] ?? '') === 'usr_admin_mohusyn');

    if ($existing['creatorId'] !== $currentUser['id'] && !$isAdmin) {
        jsonResponse(['error' => 'فقط ایجادکننده پروژه یا مدیر مجاز به حذف پروژه هستند.'], 403);
    }

    $db->deleteTeamProject($id);
    jsonResponse(['message' => 'پروژه با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 405);
