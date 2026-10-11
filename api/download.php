<?php
/**
 * TaskRooz / Bag Time - Safe File Downloader
 * Ensures .zip files are downloadable on IIS without MIME-type mapping issues.
 */
header('X-Content-Type-Options: nosniff');

$fileType = $_GET['file'] ?? 'extension';
$rootDir = dirname(__DIR__);

if ($fileType === 'source' || $fileType === 'taskrooz-source.zip') {
    $fileName = 'taskrooz-source.zip';
    $paths = [
        $rootDir . DIRECTORY_SEPARATOR . 'taskrooz-source.zip',
        $rootDir . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'taskrooz-source.zip',
    ];
    $fallbackUrl = 'https://raw.githubusercontent.com/Smohamad933/M-app/arena/01a0c425-m-app/taskrooz-source.zip';
} else {
    $fileName = 'bagtime-extension.zip';
    $paths = [
        $rootDir . DIRECTORY_SEPARATOR . 'bagtime-extension.zip',
        $rootDir . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'bagtime-extension.zip',
    ];
    $fallbackUrl = 'https://raw.githubusercontent.com/Smohamad933/M-app/arena/01a0c425-m-app/bagtime-extension.zip';
}

$foundPath = null;
foreach ($paths as $p) {
    if (file_exists($p) && filesize($p) > 1000) {
        $foundPath = $p;
        break;
    }
}

if ($foundPath) {
    // Clear output buffer
    if (ob_get_level()) {
        @ob_end_clean();
    }
    header('Content-Description: File Transfer');
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . filesize($foundPath));
    readfile($foundPath);
    exit;
}

// If local file is missing on host, seamlessly redirect to GitHub direct raw download
header('Location: ' . $fallbackUrl);
exit;
