<?php
/**
 * TaskRooz / Bag Time - Windows Executable (.exe) Download API
 */
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? 'download';
$exeFile = dirname(__DIR__) . '/public/TaskRooz.exe';
if (!file_exists($exeFile)) {
    $exeFile = dirname(__DIR__) . '/TaskRooz.exe';
}

if ($action === 'status') {
    $exists = file_exists($exeFile);
    $size = $exists ? filesize($exeFile) : 0;
    jsonResponse([
        'status' => 'ready',
        'appName' => 'بگ تایم ویندوز (Bag Time Windows Desktop)',
        'platform' => 'Windows (x64 / x86)',
        'version' => '1.1.0',
        'exeExists' => $exists,
        'sizeBytes' => $size,
        'sizeFormatted' => $exists ? round($size / 1024, 1) . ' KB' : '0 KB',
        'downloadUrl' => 'api/exe.php?action=download',
    ]);
}

if ($action === 'download') {
    if (file_exists($exeFile)) {
        header('Content-Type: application/vnd.microsoft.portable-executable');
        header('Content-Disposition: attachment; filename="TaskRooz.exe"');
        header('Content-Length: ' . filesize($exeFile));
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        readfile($exeFile);
        exit;
    }

    jsonResponse(['error' => 'فایل اجرایی ویندوز یافت نشد.'], 404);
}

jsonResponse(['error' => 'اکشن نامعتبر است.'], 400);
