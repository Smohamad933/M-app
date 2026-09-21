<?php
/**
 * TaskRooz - Full Registration Page (PHP Standalone & Integrated)
 * Built by Mohusyn
 */
require_once __DIR__ . '/config.php';

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $username = strtolower(trim($_POST['username'] ?? ''));
    $password = $_POST['password'] ?? '';
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $province = trim($_POST['province'] ?? 'تهران');
    $city = trim($_POST['city'] ?? 'تهران');
    $birthDate = trim($_POST['birth_date'] ?? '');
    $jobTitle = trim($_POST['job_title'] ?? '');
    $skills = array_filter(array_map('trim', explode(',', $_POST['skills'] ?? '')));
    $wakeUp = trim($_POST['wake_up'] ?? '۰۶:۳۰');
    $workStart = trim($_POST['work_start'] ?? '۰۸:۳۰');
    $lunch = trim($_POST['lunch'] ?? '۱۳:۳۰');
    $gym = trim($_POST['gym'] ?? '۱۸:۰۰');
    $sleep = trim($_POST['sleep'] ?? '۲۳:۳۰');

    if (empty($name) || empty($username) || empty($password)) {
        $error = 'لطفاً نام، نام کاربری و کلمه عبور را تکمیل کنید.';
    } elseif (strlen($username) < 3) {
        $error = 'نام کاربری باید حداقل ۳ کاراکتر باشد.';
    } elseif (strlen($password) < 4) {
        $error = 'کلمه عبور باید حداقل ۴ کاراکتر باشد.';
    } else {
        $existing = $db->getUserByUsername($username);
        if ($existing) {
            $error = 'این نام کاربری قبلاً در سامانه ثبت شده است.';
        } else {
            $extra = [
                'phone' => $phone,
                'email' => $email,
                'province' => $province,
                'city' => $city,
                'birthDate' => $birthDate,
                'jobTitle' => $jobTitle,
                'skills' => $skills,
                'dailyTimeline' => [
                    'wakeUp' => $wakeUp,
                    'workStart' => $workStart,
                    'lunch' => $lunch,
                    'gym' => $gym,
                    'sleep' => $sleep,
                ],
            ];

            // Role is strictly user
            $user = $db->createUser($username, $password, $name, 'user', $extra);
            $_SESSION['user_id'] = $user['id'];
            header('Location: dashboard.php');
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ثبت‌نام در تسک‌روز | TaskRooz Register</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', sans-serif; }
        body { background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { width: 100%; max-width: 580px; background: rgba(24, 24, 27, 0.85); border: 1px solid #27272a; border-radius: 24px; padding: 32px; backdrop-filter: blur(12px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .logo { width: 52px; height: 52px; background: #fff; color: #09090b; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; margin: 0 auto 16px; }
        h1 { font-size: 20px; font-weight: 900; text-align: center; margin-bottom: 6px; }
        p.sub { font-size: 12px; color: #a1a1aa; text-align: center; margin-bottom: 24px; font-family: monospace; }
        .section-title { font-size: 13px; font-weight: 800; color: #c7d2fe; border-bottom: 1px solid #27272a; padding-bottom: 6px; margin: 18px 0 12px; }
        .form-group { margin-bottom: 14px; text-align: right; }
        label { display: block; font-size: 12px; font-weight: 700; color: #d4d4d8; margin-bottom: 6px; }
        input, select, textarea { width: 100%; padding: 11px 14px; background: rgba(9, 9, 11, 0.8); border: 1px solid #3f3f46; border-radius: 14px; color: #fff; font-size: 13px; outline: none; transition: border-color .2s; }
        input:focus, select:focus, textarea:focus { border-color: #a1a1aa; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        @media(max-width: 640px) { .grid-2, .grid-5 { grid-template-columns: 1fr; } }
        .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 13px; background: #fff; color: #09090b; font-weight: 900; font-size: 13px; border-radius: 14px; border: none; cursor: pointer; transition: all .2s; text-decoration: none; margin-top: 14px; }
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
        <h1>ایجاد حساب کاربری با اطلاعات کامل</h1>
        <p class="sub">BUILT BY MOHUSYN • TASKROOZ PLANNER</p>

        <?php if ($error): ?>
            <div class="alert-err"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="section-title">۱. اطلاعات شناسایی و ورود</div>
            
            <div class="form-group">
                <label>نام و نام خانوادگی *</label>
                <input type="text" name="name" placeholder="مثال: سید محمدحسین شیخ الاسلامی" required autofocus>
            </div>

            <div class="grid-2">
                <div class="form-group">
                    <label>نام کاربری (حداقل ۳ حرف انگلیسی) *</label>
                    <input type="text" name="username" placeholder="ali_m" required>
                </div>
                <div class="form-group">
                    <label>کلمه عبور (حداقل ۴ کاراکتر) *</label>
                    <input type="password" name="password" placeholder="••••••••" required>
                </div>
            </div>

            <div class="grid-2">
                <div class="form-group">
                    <label>شماره تماس (موبایل)</label>
                    <input type="tel" name="phone" placeholder="۰۹۱۲۳۴۵۶۷۸۹">
                </div>
                <div class="form-group">
                    <label>ایمیل معتبر (Gmail)</label>
                    <input type="email" name="email" placeholder="name@gmail.com">
                </div>
            </div>

            <div class="section-title">۲. تخصص، محل سکونت و مهارت‌ها</div>

            <div class="grid-2">
                <div class="form-group">
                    <label>استان محل سکونت</label>
                    <select name="province">
                        <option value="تهران">تهران</option>
                        <option value="اصفهان">اصفهان</option>
                        <option value="خراسان رضوی">خراسان رضوی</option>
                        <option value="فارس">فارس</option>
                        <option value="آذربایجان شرقی">آذربایجان شرقی</option>
                        <option value="البرز">البرز</option>
                        <option value="خوزستان">خوزستان</option>
                        <option value="مازندران">مازندران</option>
                        <option value="گیلان">گیلان</option>
                        <option value="قم">قم</option>
                        <option value="یزد">یزد</option>
                        <option value="سایر استان‌ها">سایر استان‌ها</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>شهر محل سکونت</label>
                    <input type="text" name="city" placeholder="نام شهر شما" value="تهران">
                </div>
            </div>

            <div class="grid-2">
                <div class="form-group">
                    <label>تاریخ تولد (شمسی)</label>
                    <input type="text" name="birth_date" placeholder="۱۳۸۰/۰۱/۱۵">
                </div>
                <div class="form-group">
                    <label>شغل و تخصص</label>
                    <input type="text" name="job_title" placeholder="مثلاً: برنامه نویس، فیلمبردار، طراح UI">
                </div>
            </div>

            <div class="form-group">
                <label>مهارت‌ها (با کاما جدا کنید)</label>
                <input type="text" name="skills" placeholder="React, Node.js, تدوین ویدیو, مدیریت زمان">
            </div>

            <div class="section-title">۳. تایم‌لاین روتین شبانه‌روز (ساعات روزانه)</div>

            <div class="grid-5">
                <div class="form-group">
                    <label style="font-size:11px;">بیداری ☀️</label>
                    <input type="text" name="wake_up" value="۰۶:۳۰">
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">شروع کار 💻</label>
                    <input type="text" name="work_start" value="۰۸:۳۰">
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">ناهار 🥗</label>
                    <input type="text" name="lunch" value="۱۳:۳۰">
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">باشگاه 🏃‍♂️</label>
                    <input type="text" name="gym" value="۱۸:۰۰">
                </div>
                <div class="form-group">
                    <label style="font-size:11px;">خواب 🌙</label>
                    <input type="text" name="sleep" value="۲۳:۳۰">
                </div>
            </div>

            <button type="submit" class="btn">تکمیل ثبت‌نام و ورود به پنل</button>
        </form>

        <div class="footer-links">
            قبلاً ثبت‌نام کرده‌اید؟ <a href="login.php">ورود به حساب کاربری</a>
        </div>

        <div class="footer-note">mohusyn.ir • ۲۰۲۶</div>
    </div>
</body>
</html>
