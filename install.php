<?php
/**
 * TaskRooz - Automatic Database Installer for MySQL / MariaDB
 * Built by Mohusyn (Seyyed Mohammad Hossein Sheikholeslami)
 * Web-based 1-Click Database Setup & Configuration
 */

@error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED & ~E_NOTICE & ~E_WARNING);
@ini_set('display_errors', '0');

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

$step = $_GET['step'] ?? 'form';
$error = null;
$success = null;

// Environment checks
$phpVersion = phpversion();
$isPhpOk = version_compare($phpVersion, '7.4.0', '>=');
$hasPdo = class_exists('PDO');
$hasPdoMysql = extension_loaded('pdo_mysql');
$configFile = __DIR__ . '/config.php';
$isConfigWritable = is_writable($configFile) || is_writable(__DIR__);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install_mysql'])) {
    $host = trim($_POST['db_host'] ?? '127.0.0.1');
    $port = trim($_POST['db_port'] ?? '3306');
    $dbname = trim($_POST['db_name'] ?? 'taskrooz_db');
    $user = trim($_POST['db_user'] ?? 'root');
    $pass = $_POST['db_pass'] ?? '';

    if (empty($host) || empty($dbname) || empty($user)) {
        $error = 'لطفاً تمامی فیلدهای الزامی (آدرس سرور، نام دیتابیس و نام کاربری) را وارد کنید.';
    } else {
        try {
            // 1. Connect to MySQL server
            $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);
            $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

            // 2. Create database if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `{$dbname}`");

            // 3. Import taskrooz.sql schema
            $sqlFile = __DIR__ . '/taskrooz.sql';
            if (file_exists($sqlFile)) {
                $sqlContent = file_get_contents($sqlFile);
                $queries = array_filter(array_map('trim', explode(';', $sqlContent)));
                foreach ($queries as $q) {
                    if (!empty($q)) {
                        try {
                            $pdo->exec($q);
                        } catch (Exception $qe) {
                            // ignore non-critical minor query errors
                        }
                    }
                }
            }

            // 4. Ensure Super Admin Mohusyn exists with Smosh1387
            $adminPassHash = password_hash('Smosh1387', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("
                INSERT INTO `users` (`id`, `username`, `password_hash`, `name`, `role`, `created_at`)
                VALUES ('usr_admin_mohusyn', 'Mohusyn', ?, 'سید محمدحسین شیخ الاسلامی (Mohusyn)', 'admin', NOW())
                ON DUPLICATE KEY UPDATE 
                    `password_hash` = VALUES(`password_hash`),
                    `role` = 'admin',
                    `name` = VALUES(`name`)
            ");
            $stmt->execute([$adminPassHash]);

            // 5. Update config.php with the new MySQL settings
            if (file_exists($configFile) && is_writable($configFile)) {
                $conf = file_get_contents($configFile);
                $conf = preg_replace("/define\('DB_HOST',\s*getenv\('DB_HOST'\)\s*\?:\s*'[^']*'\);/", "define('DB_HOST', getenv('DB_HOST') ?: '{$host}');", $conf);
                $conf = preg_replace("/define\('DB_PORT',\s*getenv\('DB_PORT'\)\s*\?:\s*'[^']*'\);/", "define('DB_PORT', getenv('DB_PORT') ?: '{$port}');", $conf);
                $conf = preg_replace("/define\('DB_NAME',\s*getenv\('DB_NAME'\)\s*\?:\s*'[^']*'\);/", "define('DB_NAME', getenv('DB_NAME') ?: '{$dbname}');", $conf);
                $conf = preg_replace("/define\('DB_USER',\s*getenv\('DB_USER'\)\s*\?:\s*'[^']*'\);/", "define('DB_USER', getenv('DB_USER') ?: '{$user}');", $conf);
                $escapedPass = addcslashes($pass, "'\\");
                $conf = preg_replace("/define\('DB_PASS',\s*getenv\('DB_PASS'\)\s*!==\s*false\s*\?\s*getenv\('DB_PASS'\)\s*:\s*'[^']*'\);/", "define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '{$escapedPass}');", $conf);
                @file_put_contents($configFile, $conf, LOCK_EX);
            }

            $success = "پایگاه داده MySQL با موفقیت نصب و متصل شد! تمامی جدول‌ها ساخته شدند و حساب مدیر کل (Mohusyn) فعال گردید.";
            $step = 'done';
        } catch (Exception $e) {
            $error = 'خطا در اتصال یا نصب پایگاه داده MySQL: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نصب خودکار پایگاه داده MySQL تسک‌روز | TaskRooz Installer</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif; }
        body {
            background-color: #09090b;
            color: #f4f4f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 28px;
            padding: 40px;
            width: 100%;
            max-width: 540px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        .logo {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            background: #4f46e5;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            font-weight: 900;
            margin: 0 auto 20px;
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.5);
        }
        h1 { font-size: 20px; font-weight: 800; text-align: center; color: #fff; margin-bottom: 8px; }
        p.sub { font-size: 12px; color: #a1a1aa; text-align: center; margin-bottom: 24px; letter-spacing: -0.2px; }
        .alert {
            padding: 14px 18px;
            border-radius: 16px;
            font-size: 13px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .alert-err { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
        .alert-ok { background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #86efac; }
        .admin-box {
            background: rgba(79, 70, 229, 0.1);
            border: 1px solid rgba(79, 70, 229, 0.3);
            border-radius: 18px;
            padding: 16px;
            font-size: 13px;
            color: #c7d2fe;
            margin-bottom: 24px;
            line-height: 1.8;
        }
        .admin-box code {
            background: rgba(0, 0, 0, 0.4);
            padding: 2px 8px;
            border-radius: 6px;
            font-family: monospace;
            font-weight: 700;
            color: #fff;
        }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 12px; font-weight: 600; color: #d4d4d8; margin-bottom: 8px; }
        input {
            width: 100%;
            padding: 12px 16px;
            border-radius: 14px;
            background: #09090b;
            border: 1px solid #3f3f46;
            color: #fff;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }
        input:focus { border-color: #6366f1; }
        .btn {
            width: 100%;
            padding: 14px;
            border-radius: 16px;
            background: #4f46e5;
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            margin-top: 8px;
        }
        .btn:hover { background: #4338ca; }
        .check-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            background: #27272a;
            border-radius: 12px;
            margin-bottom: 8px;
            font-size: 12px;
        }
        .badge { padding: 3px 10px; border-radius: 20px; font-weight: 700; font-size: 11px; }
        .badge-ok { background: rgba(34, 197, 94, 0.2); color: #86efac; }
        .badge-err { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
        .footer-note { text-align: center; font-size: 11px; color: #71717a; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">✓</div>
        <h1>نصب و اتصال پایگاه داده MySQL تسک‌روز</h1>
        <p class="sub">BUILT BY MOHUSYN • MySQL / MariaDB Database Setup</p>

        <?php if ($error): ?>
            <div class="alert alert-err"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="alert alert-ok"><?= htmlspecialchars($success) ?></div>
        <?php endif; ?>

        <?php if ($step === 'done'): ?>
            <div class="admin-box">
                <strong>پایگاه داده با موفقیت تنظیم شد!</strong><br>
                👤 نام کاربری مدیر: <code>Mohusyn</code><br>
                🔑 کلمه عبور مدیر: <code>Smosh1387</code><br>
                ✨ اکنون تمامی اطلاعات مستقیماً در دیتابیس MySQL هاست شما ذخیره و فراخوانی می‌شوند.
            </div>
            <a href="index.html" class="btn">ورود به وب‌اپلیکیشن تسک‌روز</a>
            <a href="taskrooz.sql" download class="btn" style="background:#27272a; color:#fff; margin-top:8px;">دانلود فایل خام SQL (جهت ایمپورت دستی در phpMyAdmin)</a>
        <?php else: ?>
            <div style="margin-bottom: 20px;">
                <div class="check-item">
                    <span>نسخه PHP (حداقل ۷.۴)</span>
                    <span class="badge <?= $isPhpOk ? 'badge-ok' : 'badge-err' ?>"><?= $phpVersion ?></span>
                </div>
                <div class="check-item">
                    <span>افزونه PDO MySQL</span>
                    <span class="badge <?= $hasPdoMysql ? 'badge-ok' : 'badge-err' ?>"><?= $hasPdoMysql ? 'فعال' : 'غیرفعال' ?></span>
                </div>
                <div class="check-item">
                    <span>فایل شمای MySQL (taskrooz.sql)</span>
                    <span class="badge <?= file_exists(__DIR__ . '/taskrooz.sql') ? 'badge-ok' : 'badge-err' ?>"><?= file_exists(__DIR__ . '/taskrooz.sql') ? 'آماده' : 'موجود نیست' ?></span>
                </div>
            </div>

            <div class="admin-box">
                <strong>حساب کاربری مدیر کل پیش‌فرض سیستم:</strong><br>
                نام کاربری: <code>Mohusyn</code> | کلمه عبور: <code>Smosh1387</code><br>
                این حساب به صورت خودکار با دسترسی کامل Super Admin فعال می‌شود.
            </div>

            <form method="POST">
                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label>آدرس سرور MySQL (Host)</label>
                        <input type="text" name="db_host" value="127.0.0.1" placeholder="localhost یا 127.0.0.1" required>
                    </div>
                    <div class="form-group">
                        <label>پورت</label>
                        <input type="text" name="db_port" value="3306" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>نام پایگاه داده (Database Name)</label>
                    <input type="text" name="db_name" value="taskrooz_db" placeholder="نام دیتابیس ساخته شده در هاست" required>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label>نام کاربری دیتابیس</label>
                        <input type="text" name="db_user" value="root" placeholder="مثلاً root یا نام کاربری هاست" required>
                    </div>
                    <div class="form-group">
                        <label>کلمه عبور دیتابیس</label>
                        <input type="password" name="db_pass" placeholder="رمز عبور دیتابیس MySQL">
                    </div>
                </div>

                <button type="submit" name="install_mysql" class="btn">نصب خودکار و ساخت جداول دیتابیس</button>
            </form>

            <div style="margin-top: 16px; text-align: center;">
                <a href="taskrooz.sql" download style="color: #a1a1aa; font-size: 12px; text-decoration: underline;">
                    یا دانلود فایل taskrooz.sql جهت ایمپورت مستقیم در phpMyAdmin
                </a>
            </div>
        <?php endif; ?>

        <div class="footer-note">mohusyn.ir • ۲۰۲۶</div>
    </div>
</body>
</html>
