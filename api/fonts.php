<?php
/**
 * TaskRooz - Custom Fonts Hub API
 * Supports:
 * - Direct font file streaming (GET ?file=...) with full CORS & caching (bypasses IIS MIME blocks)
 * - Multipart/form-data file uploads ($_FILES['file'])
 * - JSON dataUrl uploads
 * - Full database persistence (MySQL custom_fonts table + JSON fallback)
 * - Safe CSS family identifiers
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Preflight CORS
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: *');
    http_response_code(200);
    exit;
}

// 1. Direct Font File Streaming (bypasses IIS static file MIME type blocks & Windows disk permission blocks)
if ($method === 'GET' && (!empty($_GET['file']) || !empty($_GET['id']))) {
    $file = !empty($_GET['file']) ? basename(urldecode($_GET['file'])) : '';
    $id = trim($_GET['id'] ?? '');

    $targetPath = null;
    if ($file) {
        $searchPaths = [
            dirname(__DIR__) . '/fonts/' . $file,
            dirname(__DIR__) . '/public/fonts/' . $file,
            dirname(__DIR__) . '/uploads/fonts/' . $file,
            dirname(__DIR__) . '/data/fonts/' . $file,
        ];
        foreach ($searchPaths as $sp) {
            if (file_exists($sp) && is_file($sp)) {
                $targetPath = $sp;
                break;
            }
        }
    }

    if ($targetPath) {
        $ext = strtolower(pathinfo($targetPath, PATHINFO_EXTENSION));
        $mimes = [
            'woff2' => 'font/woff2',
            'woff' => 'font/woff',
            'ttf' => 'font/ttf',
            'otf' => 'font/otf',
            'eot' => 'application/vnd.ms-fontobject',
        ];
        $contentType = $mimes[$ext] ?? 'application/octet-stream';
        while (ob_get_level()) {
            @ob_end_clean();
        }
        header('Content-Type: ' . $contentType);
        header('Content-Length: ' . filesize($targetPath));
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: *');
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($targetPath);
        exit;
    }

    // FALLBACK: If disk file is missing (e.g. Windows IIS write permission block), stream directly from Database!
    $fontRow = null;
    if ($id && method_exists($db, 'getCustomFontById')) {
        $fontRow = $db->getCustomFontById($id);
    }
    if (!$fontRow && $file && method_exists($db, 'getCustomFontByFile')) {
        $fontRow = $db->getCustomFontByFile($file);
    }

    if ($fontRow && !empty($fontRow['dataUrl']) && strpos($fontRow['dataUrl'], 'base64,') !== false) {
        $parts = explode('base64,', $fontRow['dataUrl']);
        $binary = base64_decode($parts[1]);
        if ($binary !== false) {
            // Attempt to heal disk file
            if ($file) {
                @file_put_contents(dirname(__DIR__) . '/fonts/' . $file, $binary);
                @file_put_contents(dirname(__DIR__) . '/public/fonts/' . $file, $binary);
            }
            $ext = strtolower(pathinfo($file ?: 'font.ttf', PATHINFO_EXTENSION)) ?: 'ttf';
            $mimes = [
                'woff2' => 'font/woff2',
                'woff' => 'font/woff',
                'ttf' => 'font/ttf',
                'otf' => 'font/otf',
                'eot' => 'application/vnd.ms-fontobject',
            ];
            $contentType = $mimes[$ext] ?? 'font/ttf';
            while (ob_get_level()) {
                @ob_end_clean();
            }
            header('Content-Type: ' . $contentType);
            header('Content-Length: ' . strlen($binary));
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Access-Control-Allow-Headers: *');
            header('Cache-Control: public, max-age=31536000, immutable');
            echo $binary;
            exit;
        }
    }

    jsonResponse(['error' => 'فایل فونت در سرور یافت نشد.'], 404);
}

// 2. Get All Custom Fonts
if ($method === 'GET') {
    $fonts = $db->getCustomFonts();
    jsonResponse(['fonts' => $fonts]);
}

// 3. Delete Custom Font
if ($method === 'DELETE' || ($method === 'POST' && ($action === 'delete' || (isset($_POST['action']) && $_POST['action'] === 'delete')))) {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? $_POST['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه فونت الزامی است.'], 400);
    }
    $db->deleteCustomFont($id);
    try {
        $cur = $db->getGlobalSettings();
        if (($cur['enforcedFont'] ?? '') === $id) {
            $db->updateGlobalSettings([
                'enforcedFont' => 'vazirmatn',
                'enforcedFontOption' => null,
            ]);
        }
    } catch (Exception $e) {}
    jsonResponse(['message' => 'فونت سفارشی با موفقیت حذف شد.']);
}

// 4. Upload & Register Custom Font (Supports both Multipart/form-data and JSON dataUrl)
if ($method === 'POST' && ($action === 'upload' || empty($action))) {
    $input = getJsonInput();

    $hasUploadedFile = !empty($_FILES['file']['tmp_name']) && is_uploaded_file($_FILES['file']['tmp_name']);

    $name = trim($_POST['name'] ?? $input['name'] ?? '');
    $family = trim($_POST['family'] ?? $input['family'] ?? '');
    $description = trim($_POST['description'] ?? $input['description'] ?? 'فونت سفارشی آپلود شده در سامانه');
    $dataUrl = $input['dataUrl'] ?? $_POST['dataUrl'] ?? null;
    $clientFileName = $_FILES['file']['name'] ?? $input['filename'] ?? $_POST['filename'] ?? ('font_' . time() . '.woff2');

    $id = 'font_' . time() . '_' . substr(bin2hex(random_bytes(2)), 0, 4);

    if (empty($name)) {
        $name = pathinfo($clientFileName, PATHINFO_FILENAME);
    }
    if (empty($name)) {
        $name = 'فونت سفارشی ' . date('Y-m-d');
    }

    $ext = strtolower(pathinfo($clientFileName, PATHINFO_EXTENSION));
    if (!in_array($ext, ['woff2', 'woff', 'ttf', 'otf', 'eot'])) {
        $ext = 'woff2';
    }

    // Generate guaranteed valid and clean CSS font-family name
    $safeSlug = preg_replace('/[^a-zA-Z0-9_-]/', '', $family);
    if (empty($safeSlug) || strlen($safeSlug) < 2) {
        $nameSlug = preg_replace('/[^a-zA-Z0-9_-]/', '', $name);
        $safeSlug = (!empty($nameSlug) && strlen($nameSlug) >= 2) ? $nameSlug : ('CustomFont_' . substr($id, 5));
    }
    $family = $safeSlug;

    $diskFileName = $id . '_' . $safeSlug . '.' . $ext;
    $fontsDir = dirname(__DIR__) . '/fonts';
    if (!is_dir($fontsDir)) {
        @mkdir($fontsDir, 0777, true);
    }
    $publicFontsDir = dirname(__DIR__) . '/public/fonts';
    if (!is_dir($publicFontsDir)) {
        @mkdir($publicFontsDir, 0777, true);
    }

    $savedToDisk = false;

    // 1. If uploaded via FormData / $_FILES
    if ($hasUploadedFile) {
        $fileBytes = @file_get_contents($_FILES['file']['tmp_name']);
        if (empty($dataUrl) && $fileBytes !== false) {
            $dataUrl = 'data:font/' . $ext . ';base64,' . base64_encode($fileBytes);
        }
        $targetFile = $fontsDir . '/' . $diskFileName;
        if (@move_uploaded_file($_FILES['file']['tmp_name'], $targetFile)) {
            @copy($targetFile, $publicFontsDir . '/' . $diskFileName);
            $savedToDisk = true;
        } else if ($fileBytes !== false) {
            if (@file_put_contents($targetFile, $fileBytes) !== false) {
                @copy($targetFile, $publicFontsDir . '/' . $diskFileName);
                $savedToDisk = true;
            }
        }
    }

    // 2. If provided as base64 dataUrl
    if (!$savedToDisk && !empty($dataUrl) && strpos($dataUrl, 'base64,') !== false) {
        $parts = explode('base64,', $dataUrl);
        $binary = base64_decode($parts[1]);
        if ($binary !== false) {
            $targetFile = $fontsDir . '/' . $diskFileName;
            if (@file_put_contents($targetFile, $binary) !== false) {
                @copy($targetFile, $publicFontsDir . '/' . $diskFileName);
                $savedToDisk = true;
            }
        }
    }

    // Determine fontUrl (relative path streamable via api/fonts.php?file=...)
    $fontUrl = 'api/fonts.php?file=' . $diskFileName;
    if (!$savedToDisk && !empty($dataUrl)) {
        $fontUrl = $dataUrl;
    }

    $fontRecord = [
        'id' => $id,
        'name' => $name,
        'family' => $family,
        'fontUrl' => $fontUrl,
        'dataUrl' => $dataUrl,
        'description' => $description,
    ];

    $createdFont = $db->addCustomFont($fontRecord);

    // Also automatically enforce this uploaded font as the system default for ALL users
    try {
        $db->updateGlobalSettings([
            'enforcedFont' => $id,
            'enforcedFontOption' => $createdFont,
        ]);
    } catch (Exception $e) {}

    // If client supplied dataUrl, keep it in response for instant local preview
    if (empty($createdFont['dataUrl']) && !empty($dataUrl)) {
        $createdFont['dataUrl'] = $dataUrl;
    }

    jsonResponse(['message' => 'فونت با موفقیت بارگذاری و برای همه کاربران فعال شد.', 'font' => $createdFont], 201);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
