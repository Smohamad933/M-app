<?php
/**
 * TaskRooz - Global System Settings API
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Preflight CORS
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: *');
    http_response_code(200);
    exit;
}

if ($method === 'GET' || $method === 'HEAD') {
    $settings = $db->getGlobalSettings();
    jsonResponse(['settings' => $settings]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $settings = $db->updateGlobalSettings($input);
    jsonResponse(['message' => 'تنظیمات سراسری ذخیره شد.', 'settings' => $settings]);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
