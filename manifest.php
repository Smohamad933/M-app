<?php
/**
 * TaskRooz - Dynamic PWA Manifest
 * Served at: https://your-domain/manifest.php
 * The app name + icon shown in the phone's installed-apps list are
 * controlled from the admin panel (هویت و عکس‌های اپ).
 * Works even before the database is installed (falls back to defaults).
 */
$settings = [];
$dbFile = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json';
if (file_exists($dbFile)) {
    $raw = @file_get_contents($dbFile);
    $parsed = @json_decode($raw, true);
    if (is_array($parsed)) {
        $settings = $parsed['globalSettings'] ?? [];
    }
}

$branding = is_array($settings['appBranding'] ?? null) ? $settings['appBranding'] : [];
$name = trim($branding['appName'] ?? '');
if ($name === '') {
    $name = 'تسک‌روز';
}

header('Content-Type: application/manifest+json; charset=utf-8');
header('Cache-Control: no-cache');

echo json_encode([
    'name' => $name,
    'short_name' => $name,
    'start_url' => './',
    'scope' => './',
    'display' => 'standalone',
    'dir' => 'rtl',
    'lang' => 'fa',
    'background_color' => '#09090b',
    'theme_color' => '#4f46e5',
    'description' => 'سامانه برنامه‌ریزی روزانه و بهره‌وری تیمی',
    'icons' => [
        ['src' => 'app-icon.php?size=192', 'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any'],
        ['src' => 'app-icon.php?size=512', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any'],
        ['src' => 'app-icon.php?size=512', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable'],
    ],
], JSON_UNESCAPED_UNICODE);
