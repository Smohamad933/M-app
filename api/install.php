<?php
/**
 * TaskRooz - One-Click Database Installer
 * GET  -> { installed: bool }
 * POST -> seeds data/db.json with the default database (admin one-click install)
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    jsonResponse(['installed' => $db->isInstalled(), 'app' => 'TaskRooz (تسک‌روز)']);
}

if ($method === 'POST') {
    if ($db->isInstalled()) {
        jsonResponse(['installed' => true, 'message' => 'پایگاه داده قبلاً نصب است.']);
    }
    $db->forceInstall();
    jsonResponse(['installed' => true, 'message' => 'پایگاه داده با موفقیت نصب شد.']);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
