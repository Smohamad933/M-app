<?php
/**
 * TaskRooz - Dynamic PWA / app icon
 * Served at: https://your-domain/app-icon.php?size=512
 * Streams the admin-configured icon (from the admin panel), falling back
 * to the static icon-192/512 PNGs.
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
$dataUrl = $branding['pwaIconDataUrl'] ?? null;

if (is_string($dataUrl) && strpos($dataUrl, 'data:image/') === 0) {
    if (preg_match('/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i', $dataUrl, $m)) {
        header('Content-Type: ' . $m[1]);
        header('Cache-Control: no-cache');
        echo base64_decode($m[2]);
        exit;
    }
}

$size = (int)($_GET['size'] ?? 512);
$file = ($size >= 384) ? __DIR__ . '/icon-512.png' : __DIR__ . '/icon-192.png';
if (file_exists($file)) {
    header('Content-Type: image/png');
    readfile($file);
} else {
    http_response_code(404);
}
