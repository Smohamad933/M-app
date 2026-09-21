<?php
/**
 * TaskRooz - Automatic Database Installer for MySQL / SQLite & IIS
 * Built by Mohusyn (Seyyed Mohammad Hossein Sheikholeslami)
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$step = $_GET['step'] ?? 'check';
$error = null;
$success = null;

// Environment checks
$phpVersion = phpversion();
$isPhpOk = version_compare($phpVersion, '7.4.0', '>=');
$hasPdo = class_exists('PDO');
$hasPdoMysql = extension_loaded('pdo_mysql');
$hasPdoSqlite = extension_loaded('pdo_sqlite');
$dataDir = __DIR__ . '/data';
$isWritable = is_writable(__DIR__) || (is_dir($dataDir) && is_writable($dataDir));

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install_mysql'])) {
    $host = trim($_POST['db_host'] ?? '127.0.0.1');
    $port = trim($_POST['db_port'] ?? '3306');
    $dbname = trim($_POST['db_name'] ?? 'taskrooz_db');
    $user = trim($_POST['db_user'] ?? 'root');
    $pass = $_POST['db_pass'] ?? '';

    try {
        // Connect to MySQL server
        $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        // Create database if not exists
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$dbname}`");

        // Create Tables
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(150) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                phone VARCHAR(30) DEFAULT NULL,
                email VARCHAR(150) DEFAULT NULL,
                province VARCHAR(100) DEFAULT NULL,
                city VARCHAR(100) DEFAULT NULL,
                birth_date VARCHAR(30) DEFAULT NULL,
                job_title VARCHAR(150) DEFAULT NULL,
                skills_json TEXT DEFAULT NULL,
                timeline_json TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS categories (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                color VARCHAR(30) NOT NULL,
                icon VARCHAR(50) NOT NULL,
                is_default INT DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS tasks (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                project_id VARCHAR(50) DEFAULT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT DEFAULT NULL,
                date VARCHAR(20) NOT NULL,
                time VARCHAR(10) DEFAULT NULL,
                duration_minutes INT DEFAULT 0,
                completed INT DEFAULT 0,
                completed_at DATETIME DEFAULT NULL,
                reason_uncompleted TEXT DEFAULT NULL,
                uncompleted_category VARCHAR(50) DEFAULT NULL,
                priority VARCHAR(20) DEFAULT 'medium',
                category_id VARCHAR(50) DEFAULT NULL,
                is_pinned INT DEFAULT 0,
                focus_minutes_spent INT DEFAULT 0,
                subtasks_json TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user (user_id),
                INDEX idx_date (date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT DEFAULT NULL,
                color VARCHAR(30) DEFAULT '#6366f1',
                icon VARCHAR(50) DEFAULT 'Folder',
                creator_id VARCHAR(50) NOT NULL,
                creator_name VARCHAR(150) DEFAULT '',
                member_ids_json TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS career_goals (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(50) DEFAULT 'career',
                period VARCHAR(50) DEFAULT 'quarter1',
                progress INT DEFAULT 0,
                target_date VARCHAR(50) DEFAULT NULL,
                description TEXT DEFAULT NULL,
                completed INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // Seed Default Admin: Mohusyn / Smosh1387
        $adminHash = password_hash('Smosh1387', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (id, username, password_hash, name, role, phone, email, job_title) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE role='admin', name=VALUES(name)");
        $stmt->execute([
            'usr_admin_mohusyn',
            'Mohusyn',
            $adminHash,
            'سید محمدحسین شیخ الاسلامی (Mohusyn)',
            'admin',
            '۰۹۱۲۰۰۰۰۰۰۰',
            'mohusyn@gmail.com',
            'مدیر ارشد و توسعه‌دهنده محصول'
        ]);

        // Seed Default Categories
        $categories = [
            ['cat-work', 'کاری و شغلی', '#6366f1', 'Briefcase', 1],
            ['cat-personal', 'کارهای شخصی', '#10b981', 'User', 1],
            ['cat-study', 'مطالعه و یادگیری', '#f59e0b', 'BookOpen', 1],
            ['cat-health', 'ورزش و سلامتی', '#f43f5e', 'Activity', 1],
            ['cat-shopping', 'خرید و منزل', '#0ea5e9', 'ShoppingCart', 1],
            ['cat-finance', 'امور مالی', '#8b5cf6', 'CreditCard', 1],
        ];
        $catStmt = $pdo->prepare("INSERT IGNORE INTO categories (id, name, color, icon, is_default) VALUES (?, ?, ?, ?, ?)");
        foreach ($categories as $cat) {
            $catStmt->execute($cat);
        }

        // Save config.php
        $configContent = "<?php\n"
            . "/**\n * TaskRooz - Generated MySQL Configuration\n */\n"
            . "if (session_status() === PHP_SESSION_NONE) { session_start(); }\n"
            . "define('DB_HOST', '{$host}');\n"
            . "define('DB_PORT', '{$port}');\n"
            . "define('DB_NAME', '{$dbname}');\n"
            . "define('DB_USER', '{$user}');\n"
            . "define('DB_PASS', '{$pass}');\n\n"
            . "require_once __DIR__ . '/api/db.php';\n"
            . "\$db = TaskRoozDB::getInstance();\n\n"
            . "function getActiveUser() {\n"
            . "    global \$db;\n"
            . "    if (!empty(\$_SESSION['user_id'])) {\n"
            . "        \$u = \$db->getUserById(\$_SESSION['user_id']);\n"
            . "        if (\$u) { unset(\$u['password_hash']); return \$u; }\n"
            . "    }\n"
            . "    return null;\n"
            . "}\n\n"
            . "function requireLogin() {\n"
            . "    \$u = getActiveUser();\n"
            . "    if (!\$u) { header('Location: login.php'); exit; }\n"
            . "    return \$u;\n"
            . "}\n\n"
            . "function requireAdminLogin() {\n"
            . "    \$u = requireLogin();\n"
            . "    if (\$u['role'] !== 'admin') { header('Location: dashboard.php?error=access_denied'); exit; }\n"
            . "    return \$u;\n"
            . "}\n";

        file_put_contents(__DIR__ . '/config.php', $configContent);

        $success = "پایگاه داده MySQL با موفقیت راه‌اندازی و جداول ایجاد شدند. اکانت مدیر کل (Mohusyn) فعال است.";
        $step = 'done';
    } catch (Exception $e) {
        $error = "خطا در اتصال به MySQL: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نصب خودکار سامانه تسک‌روز | TaskRooz Installer</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', sans-serif; }
        body { background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { width: 100%; max-width: 580px; background: rgba(24, 24, 27, 0.85); border: 1px solid #27272a; border-radius: 24px; padding: 32px; backdrop-filter: blur(12px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .logo { width: 52px; height: 52px; background: #fff; color: #09090b; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; margin: 0 auto 16px; }
        h1 { font-size: 20px; font-weight: 900; text-align: center; margin-bottom: 6px; }
        p.sub { font-size: 12px; color: #a1a1aa; text-align: center; margin-bottom: 24px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
        .badge-ok { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-err { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
        .check-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(9, 9, 11, 0.6); border: 1px solid #27272a; border-radius: 14px; margin-bottom: 8px; font-size: 12px; }
        .form-group { margin-bottom: 14px; text-align: right; }
        label { display: block; font-size: 12px; font-weight: 700; color: #d4d4d8; margin-bottom: 6px; }
        input { width: 100%; padding: 11px 14px; background: rgba(9, 9, 11, 0.8); border: 1px solid #3f3f46; border-radius: 14px; color: #fff; font-size: 13px; outline: none; transition: border-color .2s; }
        input:focus { border-color: #a1a1aa; }
        .grid-2 { display: grid; grid-cols: 2; gap: 12px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 13px; background: #fff; color: #09090b; font-weight: 900; font-size: 13px; border-radius: 14px; border: none; cursor: pointer; transition: all .2s; text-decoration: none; margin-top: 10px; }
        .btn:hover { background: #e4e4e7; transform: translateY(-1px); }
        .alert { padding: 12px; border-radius: 14px; font-size: 12px; font-weight: 700; margin-bottom: 16px; text-align: center; }
        .alert-err { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
        .alert-ok { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .admin-box { background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 16px; padding: 14px; margin: 16px 0; font-size: 12px; color: #c7d2fe; line-height: 1.8; }
        .footer-note { text-align: center; font-size: 11px; color: #71717a; margin-top: 20px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">✓</div>
        <h1>نصب خودکار سامانه تسک‌روز</h1>
        <p class="sub">BUILT BY MOHUSYN • MySQL & IIS Environment</p>

        <?php if ($error): ?>
            <div class="alert alert-err"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="alert alert-ok"><?= htmlspecialchars($success) ?></div>
        <?php endif; ?>

        <?php if ($step === 'done'): ?>
            <div class="admin-box">
                <strong>اطلاعات ورود ادمین کل (پیش‌فرض سیستم):</strong><br>
                👤 نام کاربری: <code>Mohusyn</code><br>
                🔑 کلمه عبور: <code>Smosh1387</code><br>
                ✨ دسترسی کامل به داشبورد، مدیریت کاربران، خروجی اکسل و سیستم تحلیل عادات.
            </div>
            <a href="login.php" class="btn">ورود به پنل کاربری</a>
            <a href="index.html" class="btn" style="background:#27272a; color:#fff; margin-top:8px;">ورود به وب‌اپلیکیشن (SPA)</a>
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
                    <span>پوشه داده و مجوز ذخیره‌سازی</span>
                    <span class="badge <?= $isWritable ? 'badge-ok' : 'badge-err' ?>"><?= $isWritable ? 'دارد' : 'بررسی مجوز' ?></span>
                </div>
            </div>

            <div class="admin-box">
                <strong>اکانت ادمین کل پیش‌فرض سیستم:</strong><br>
                نام کاربری: <code>Mohusyn</code> | رمز عبور: <code>Smosh1387</code><br>
                این حساب به صورت خودکار با دسترسی کامل ساخته می‌شود.
            </div>

            <form method="POST">
                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label>آدرس سرور MySQL (Host)</label>
                        <input type="text" name="db_host" value="127.0.0.1" required>
                    </div>
                    <div class="form-group">
                        <label>پورت</label>
                        <input type="text" name="db_port" value="3306" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>نام پایگاه داده (Database Name)</label>
                    <input type="text" name="db_name" value="taskrooz_db" required>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label>نام کاربری دیتابیس</label>
                        <input type="text" name="db_user" value="root" required>
                    </div>
                    <div class="form-group">
                        <label>کلمه عبور دیتابیس</label>
                        <input type="password" name="db_pass" placeholder="رمز عبور دیتابیس">
                    </div>
                </div>

                <button type="submit" name="install_mysql" class="btn">تست اتصال و نصب خودکار دیتابیس</button>
            </form>
        <?php endif; ?>

        <div class="footer-note">mohusyn.ir • ۲۰۲۶</div>
    </div>
</body>
</html>
