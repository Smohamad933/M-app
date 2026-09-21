<?php
/**
 * TaskRooz - Global System Settings API
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $settings = $db->getGlobalSettings();
    jsonResponse(['settings' => $settings]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $settings = $db->updateGlobalSettings($input);
    jsonResponse(['message' => 'تنظیمات سراسری ذخیره شد.', 'settings' => $settings]);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
