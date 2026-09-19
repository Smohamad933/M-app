<?php
/**
 * TaskRooz - Team Projects Endpoint
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/projects.php -> List user's team projects
if ($method === 'GET') {
    $isAdmin = ($currentUser['role'] === 'admin');
    $projects = $db->getAllTeamProjects($currentUser['id'], $isAdmin);
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

// DELETE /api/projects.php?id=...
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه پروژه الزامی است.'], 400);
    }

    $existing = $db->getTeamProject($id);
    if (!$existing) {
        jsonResponse(['error' => 'پروژه یافت نشد.'], 404);
    }

    if ($existing['creatorId'] !== $currentUser['id'] && $currentUser['role'] !== 'admin') {
        jsonResponse(['error' => 'فقط ایجادکننده پروژه یا مدیر مجاز به حذف پروژه هستند.'], 403);
    }

    $db->deleteTeamProject($id);
    jsonResponse(['message' => 'پروژه با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 405);
