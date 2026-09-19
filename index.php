<?php
/**
 * TaskRooz - Main Entry Point for IIS / Apache
 */
if (file_exists(__DIR__ . '/dist/index.html')) {
    include __DIR__ . '/dist/index.html';
} elseif (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
} else {
    echo "<h1>TaskRooz - Application Building...</h1>";
}
