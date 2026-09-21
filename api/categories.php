<?php
/**
 * TaskRooz - Categories Endpoint
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $cats = $db->getCategories();
    jsonResponse(['categories' => $cats]);
}

if ($method === 'POST') {
    requireAuth();
    $input = getJsonInput();
    $name = trim($input['name'] ?? '');
    $color = $input['color'] ?? '#6366f1';
    $icon = $input['icon'] ?? 'Folder';

    if (empty($name)) {
        jsonResponse(['error' => 'نام دسته‌بندی الزامی است.'], 400);
    }

    $created = $db->createCategory($name, $color, $icon);
    jsonResponse(['message' => 'دسته‌بندی ایجاد شد.', 'category' => $created], 201);
}

if ($method === 'DELETE') {
    requireAuth();
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه دسته‌بندی الزامی است.'], 400);
    }

    $db->deleteCategory($id);
    jsonResponse(['message' => 'دسته‌بندی حذف شد.']);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 405);
