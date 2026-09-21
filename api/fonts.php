<?php
/**
 * TaskRooz - Custom Fonts Hub API
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    $fonts = $db->getCustomFonts();
    jsonResponse(['fonts' => $fonts]);
}

if ($method === 'POST' && ($action === 'upload' || empty($action))) {
    $input = getJsonInput();
    $name = trim($input['name'] ?? 'فونت جدید');
    $family = trim($input['family'] ?? $name);
    $dataUrl = $input['dataUrl'] ?? null;
    $description = trim($input['description'] ?? '');

    $font = $db->addCustomFont([
        'name' => $name,
        'family' => $family,
        'dataUrl' => $dataUrl,
        'fontUrl' => $dataUrl ?: '',
        'description' => $description,
    ]);

    jsonResponse(['message' => 'فونت با موفقیت بارگذاری و ذخیره شد.', 'font' => $font], 201);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
