<?php
/**
 * TaskRooz - Main Entry Point for IIS / Apache / PHP Built-in Server
 */
header('Content-Type: text/html; charset=utf-8');

$indexPath = file_exists(__DIR__ . '/index.html') 
    ? __DIR__ . '/index.html' 
    : (file_exists(__DIR__ . '/dist/index.html') ? __DIR__ . '/dist/index.html' : null);

if ($indexPath && file_exists($indexPath)) {
    echo file_get_contents($indexPath);
    exit;
}

echo "TaskRooz - Application Ready. Please check index.html.";
