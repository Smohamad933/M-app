<?php
/**
 * TaskRooz - Live Zero-Downtime System Updater (ZIP Upload)
 * Compatible with Windows Server IIS / Apache / Nginx / Linux
 */

require_once __DIR__ . '/config.php';

// Allow longer execution time & larger uploads for full zip packages
@ini_set('max_execution_time', '300');
@ini_set('memory_limit', '512M');
@ini_set('post_max_size', '64M');
@ini_set('upload_max_filesize', '64M');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'تنها متد POST برای به‌روزرسانی مجاز است.'], 405);
}

// 1. Verify Authentication (Admin Only)
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_POST['token'] ?? '';
$currentUser = null;

if (!empty($authHeader)) {
    $token = str_replace('Bearer ', '', $authHeader);
    // Find user by token or check admin
    $allUsers = $db->getAllUsers();
    foreach ($allUsers as $u) {
        if (!empty($u['token']) && $u['token'] === $token || !empty($u['id']) && $u['id'] === $token) {
            $currentUser = $u;
            break;
        }
    }
}

// Admin username check fallback
$adminUsername = trim($_POST['username'] ?? '');
$adminPassword = (string)($_POST['password'] ?? '');

if (!$currentUser && !empty($adminUsername) && !empty($adminPassword)) {
    $user = $db->getUserByUsername($adminUsername);
    if ($user && ($user['role'] === 'admin' || strtolower($user['username']) === 'mohusyn')) {
        if (!empty($user['password']) && (password_verify($adminPassword, $user['password']) || $user['password'] === $adminPassword)) {
            $currentUser = $user;
        }
    }
}

// Ensure caller is admin
$isAdmin = $currentUser && (
    ($currentUser['role'] ?? '') === 'admin' ||
    strtolower($currentUser['username'] ?? '') === 'mohusyn'
);

if (!$isAdmin) {
    jsonResponse(['error' => 'دسترسی غیرمجاز. فقط مدیر کل سامانه مجاز به اعمال به‌روزرسانی است.'], 403);
}

// 2. Validate Uploaded File
if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorCode = $_FILES['file']['error'] ?? 'no_file';
    jsonResponse(['error' => "خطا در دریافت فایل زیپ به‌روزرسانی (کد خطا: {$errorCode}). لطفاً مطمئن شوید حجم فایل از حد مجاز سرور بیشتر نباشد."], 400);
}

$tempZipPath = $_FILES['file']['tmp_name'];
$fileName = $_FILES['file']['name'];

if (!class_exists('ZipArchive')) {
    jsonResponse(['error' => 'ماژول ZipArchive در PHP سرور فعال نیست. لطفاً extension=zip را در php.ini سرور ویندوز فعال کنید.'], 500);
}

$zip = new ZipArchive();
if ($zip->open($tempZipPath) !== true) {
    jsonResponse(['error' => 'فایل ارسالی یک فایل زیپ معتبر نیست یا آسیب دیده است.'], 400);
}

// 3. Extract to Temporary Directory
$appRoot = dirname(__DIR__);
$tempExtractDir = $appRoot . DIRECTORY_SEPARATOR . 'temp_sys_update_' . time();

if (!@mkdir($tempExtractDir, 0777, true)) {
    $zip->close();
    jsonResponse(['error' => 'عدم دسترسی نوشتن در دایرکتوری ریشه جهت ایجاد پوشه موقت.'], 500);
}

$extractResult = $zip->extractTo($tempExtractDir);
$zip->close();

if (!$extractResult) {
    @rrmdir($tempExtractDir);
    jsonResponse(['error' => 'خطا در استخراج فایل‌های درون بسته زیپ.'], 500);
}

// 4. Overwrite files safely while PROTECTING critical data
// Files to NEVER overwrite (preserving user database & server credentials):
$protectedFiles = [
    'config.php',
    'data' . DIRECTORY_SEPARATOR . 'db.json',
];

$filesUpdatedCount = 0;

function copyRecursive($src, $dst, &$count, $protectedFiles, $baseDst) {
    $dir = opendir($src);
    if (!file_exists($dst)) {
        @mkdir($dst, 0777, true);
    }
    while (false !== ($file = readdir($dir))) {
        if ($file === '.' || $file === '..') continue;
        
        $srcPath = $src . DIRECTORY_SEPARATOR . $file;
        $dstPath = $dst . DIRECTORY_SEPARATOR . $file;
        
        // Relative path for protection check
        $relPath = str_replace($baseDst . DIRECTORY_SEPARATOR, '', $dstPath);
        $relPathNormalized = str_replace('/', DIRECTORY_SEPARATOR, $relPath);
        
        if (in_array($relPathNormalized, $protectedFiles, true) && file_exists($dstPath)) {
            // Skip overwriting protected file (preserves existing config and data/db.json!)
            continue;
        }

        if (is_dir($srcPath)) {
            copyRecursive($srcPath, $dstPath, $count, $protectedFiles, $baseDst);
        } else {
            if (@copy($srcPath, $dstPath)) {
                $count++;
            }
        }
    }
    closedir($dir);
}

function rrmdir($dir) {
    if (!file_exists($dir)) return;
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        is_dir($path) ? rrmdir($path) : @unlink($path);
    }
    @rmdir($dir);
}

try {
    copyRecursive($tempExtractDir, $appRoot, $filesUpdatedCount, $protectedFiles, $appRoot);
} catch (Exception $e) {
    @rrmdir($tempExtractDir);
    jsonResponse(['error' => 'خطا در کپی و جایگزینی فایل‌ها: ' . $e->getMessage()], 500);
}

// Clean up temporary extraction directory
@rrmdir($tempExtractDir);

// 5. Successful Zero-Downtime Update Response
jsonResponse([
    'success' => true,
    'message' => 'سامانه با موفقیت به آخرین نسخه به‌روزرسانی شد! دیتابیس و تنظیمات سرور دست‌نخورده باقی ماندند.',
    'files_updated' => $filesUpdatedCount,
    'timestamp' => date('Y-m-d H:i:s'),
]);
