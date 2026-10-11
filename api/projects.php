<?php
/**
 * TaskRooz - Team Projects Endpoint
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
if (!empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
} elseif (!empty($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
} elseif (!empty($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

$action = $_GET['action'] ?? '';
$input = in_array($method, ['POST', 'PUT']) ? getJsonInput() : [];
if (!empty($input['action']) && empty($action)) {
    $action = $input['action'];
}

// Project Team Chat Messages (GET /api/projects.php?action=messages&project_id=...)
if ($method === 'GET' && ($action === 'messages' || isset($_GET['messages']))) {
    $projectId = $_GET['project_id'] ?? $_GET['id'] ?? '';
    $dbObj = TaskRoozDB::getInstance();
    $list = $dbObj->getProjectMessages($projectId);
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
    $newMsg = $dbObj->sendProjectMessage($projectId, $currentUser, $text);
    jsonResponse(['message' => 'پیام با موفقیت ارسال شد.', 'data' => $newMsg], 201);
}

// GET /api/projects.php -> List user's team projects
if ($method === 'GET') {
    $projects = $db->getAllTeamProjects($currentUser['id'], false);
    jsonResponse(['projects' => $projects]);
}

// DELETE /api/projects.php?id=... (also handles POST with action=delete for IIS/Cloudflare compatibility)
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
    $isCreator = ($existing['creatorId'] === $currentUser['id'] || $existing['creatorId'] === ($currentUser['username'] ?? ''));

    if (!$isCreator && !$isAdmin) {
        jsonResponse(['error' => 'فقط ایجادکننده پروژه یا مدیر مجاز به حذف پروژه هستند.'], 403);
    }

    $db->deleteTeamProject($id);
    jsonResponse(['message' => 'پروژه با موفقیت حذف شد.']);
}

// UPDATE /api/projects.php (PUT or POST with action=update or POST with existing id)
$isUpdateAction = ($method === 'PUT') ||
    ($method === 'POST' && (
        $action === 'update' ||
        $action === 'edit' ||
        ($input['action'] ?? '') === 'update' ||
        ($input['action'] ?? '') === 'edit' ||
        (!empty($input['id']) && $action !== 'create' && ($input['action'] ?? '') !== 'create')
    ));

if ($isUpdateAction) {
    $id = $input['id'] ?? $_GET['id'] ?? '';
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

    $isAdmin = ($currentUser['role'] === 'admin' || strtolower($currentUser['username'] ?? '') === 'mohusyn' || ($currentUser['id'] ?? '') === 'usr_admin_mohusyn');
    $isCreator = ($existing['creatorId'] === $currentUser['id'] || $existing['creatorId'] === ($currentUser['username'] ?? ''));

    if (!$isCreator && !$isAdmin) {
        jsonResponse(['error' => 'فقط ایجادکننده پروژه یا مدیر مجاز به ویرایش هستند.'], 403);
    }

    $ok = $db->updateTeamProject($id, $name, $description, $color, $icon, $memberIds);
    if ($ok) {
        $updated = $db->getTeamProject($id);
        jsonResponse(['message' => 'پروژه به‌روزرسانی شد.', 'project' => $updated]);
    } else {
        jsonResponse(['error' => 'خطا در ویرایش پروژه.'], 400);
    }
}

// POST /api/projects.php -> Create new team project
if ($method === 'POST') {
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

jsonResponse(['error' => 'درخواست نامعتبر است.'], 405);
