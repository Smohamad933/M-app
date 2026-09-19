<?php
/**
 * TaskRooz - Main Entry Point for IIS / Apache
 */
header('Content-Type: text/html; charset=utf-8');

// Determine base URL path for subfolder support on IIS
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$baseDir = rtrim(dirname($scriptName), '/\\');
$baseUrl = ($baseDir === '' || $baseDir === '/') ? './' : $baseDir . '/';

// 1. Check if dist/index.html exists
$distHtmlPath = __DIR__ . '/dist/index.html';
if (file_exists($distHtmlPath)) {
    $html = file_get_contents($distHtmlPath);
    if (strpos($html, '<base ') === false) {
        $html = str_replace('<head>', "<head>\n    <base href=\"{$baseUrl}\">", $html);
    }
    echo $html;
    exit;
}

// 2. Fallback to index.html
if (file_exists(__DIR__ . '/index.html')) {
    $html = file_get_contents(__DIR__ . '/index.html');
    echo $html;
    exit;
}

echo "TaskRooz - Application Ready";
