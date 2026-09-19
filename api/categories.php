<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM categories ORDER BY is_default DESC, name ASC");
    $cats = $stmt->fetchAll();
    $result = array_map(function($c) {
        return [
            'id' => $c['id'],
            'name' => $c['name'],
            'color' => $c['color'],
            'icon' => $c['icon'],
            'isDefault' => (bool)$c['is_default'],
        ];
    }, $cats);
    jsonResponse(['categories' => $result]);
}

if ($method === 'POST') {
    requireAuth($pdo);
    $input = getJsonInput();
    $name = trim($input['name'] ?? '');
    $color = $input['color'] ?? '#6366f1';
    $icon = $input['icon'] ?? 'Folder';

    if (empty($name)) {
        jsonResponse(['error' => 'نام دسته‌بندی الزامی است.'], 400);
    }

    $id = 'cat_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
    $stmt = $pdo->prepare("INSERT INTO categories (id, name, color, icon, is_default) VALUES (?, ?, ?, ?, 0)");
    $stmt->execute([$id, $name, $color, $icon]);

    jsonResponse([
        'message' => 'دسته‌بندی ایجاد شد.',
        'category' => [
            'id' => $id,
            'name' => $name,
            'color' => $color,
            'icon' => $icon,
            'isDefault' => false,
        ]
    ], 201);
}

if ($method === 'DELETE') {
    requireAuth($pdo);
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه دسته‌بندی الزامی است.'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ? AND is_default = 0");
    $stmt->execute([$id]);

    jsonResponse(['message' => 'دسته‌بندی حذف شد.']);
}

jsonResponse(['error' => 'درخواست نامعتبر است.'], 405);
