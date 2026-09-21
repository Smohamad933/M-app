<?php
/**
 * TaskRooz - Dedicated Admin Monitoring & Management Panel
 * Reserved for Mohusyn
 */
require_once __DIR__ . '/config.php';

$user = requireLogin();
if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo '<!DOCTYPE html><html lang="fa" dir="rtl"><body style="background:#09090b;color:#f43f5e;font-family:sans-serif;padding:50px;text-align:center;"><h2>دسترسی غیرمجاز (۴۰۳)</h2><p>این بخش منحصراً در اختیار مدیر سیستم (Mohusyn) قرار دارد.</p><p><a href="dashboard.php" style="color:#fff;">بازگشت به داشبورد</a></p></body></html>';
    exit;
}

// Handle Export to CSV
if (isset($_GET['action']) && $_GET['action'] === 'export_csv') {
    $allUsers = $db->getUsers();
    $allTasks = $db->getTasks();

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="taskrooz_users_report_' . date('Ymd_His') . '.csv"');
    
    // Add UTF-8 BOM for Microsoft Excel Persian text support
    echo "\xEF\xBB\xBF";

    $out = fopen('php://output', 'w');
    fputcsv($out, [
        'شناسه کاربر',
        'نام و نام خانوادگی',
        'نام کاربری',
        'شماره موبایل',
        'ایمیل',
        'استان',
        'شهر',
        'عنوان شغلی',
        'مهارت‌ها',
        'نقش کاربری',
        'تعداد کل تسک‌ها',
        'تسک‌های انجام شده',
        'درصد موفقیت',
        'تاریخ عضویت'
    ]);

    foreach ($allUsers as $u) {
        $uTasks = array_filter($allTasks, fn($t) => ($t['userId'] ?? '') === $u['id']);
        $total = count($uTasks);
        $done = count(array_filter($uTasks, fn($t) => !empty($t['completed'])));
        $rate = $total > 0 ? round(($done / $total) * 100) . '%' : '۰٪';
        $skillsStr = is_array($u['skills'] ?? null) ? implode(', ', $u['skills']) : ($u['skills'] ?? '');

        fputcsv($out, [
            $u['id'],
            $u['name'],
            $u['username'],
            $u['phone'] ?? '',
            $u['gmail'] ?? '',
            $u['province'] ?? '',
            $u['city'] ?? '',
            $u['job_title'] ?? '',
            $skillsStr,
            $u['role'] === 'admin' ? 'مدیر ارشد' : 'کاربر عادی',
            $total,
            $done,
            $rate,
            $u['created_at'] ?? ''
        ]);
    }
    fclose($out);
    exit;
}

// Handle Admin Task Assignment
$successMessage = '';
$errorMessage = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'assign_task') {
        $targetUserId = $_POST['target_user_id'] ?? '';
        $title = trim($_POST['title'] ?? '');
        $date = trim($_POST['date'] ?? date('Y-m-d'));
        $time = trim($_POST['time'] ?? '۰۹:۰۰');
        $priority = in_array($_POST['priority'] ?? '', ['high', 'medium', 'low']) ? $_POST['priority'] : 'medium';

        if (!empty($targetUserId) && !empty($title)) {
            $targetUser = $db->getUserById($targetUserId);
            if ($targetUser) {
                $db->createTask([
                    'title' => $title,
                    'date' => $date,
                    'time' => $time,
                    'priority' => $priority,
                    'userId' => $targetUserId,
                    'assignedBy' => $user['name'] . ' (مدیر)'
                ], $targetUser);
                $successMessage = "تسک «{$title}» با موفقیت به کاربر «{$targetUser['name']}» محول شد.";
            } else {
                $errorMessage = "کاربر مورد نظر یافت نشد.";
            }
        } else {
            $errorMessage = "لطفاً کاربر و عنوان تسک را مشخص کنید.";
        }
    }
}

$users = $db->getUsers();
$tasks = $db->getTasks();

// Calculate Stats
$totalUsers = count($users);
$totalTasks = count($tasks);
$completedTasks = count(array_filter($tasks, fn($t) => !empty($t['completed'])));
$overallRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>پنل مانیتورینگ ادمین | تسک‌روز</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', sans-serif; }
        body { background: #09090b; color: #f4f4f5; min-height: 100vh; padding: 24px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: rgba(24, 24, 27, 0.85); border: 1px solid #27272a; border-radius: 24px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; backdrop-filter: blur(12px); }
        .header-title { display: flex; align-items: center; gap: 12px; }
        .badge-purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 800; }
        .btn-sm { padding: 8px 16px; background: #27272a; color: #e4e4e7; font-size: 12px; font-weight: 700; border-radius: 12px; text-decoration: none; border: 1px solid #3f3f46; cursor: pointer; transition: all .2s; }
        .btn-sm:hover { background: #3f3f46; color: #fff; }
        .btn-primary { background: #fff; color: #09090b; border: none; font-weight: 800; }
        .btn-primary:hover { background: #e4e4e7; }
        .btn-excel { background: #059669; color: #fff; border: 1px solid #10b981; }
        .btn-excel:hover { background: #10b981; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: rgba(24, 24, 27, 0.6); border: 1px solid #27272a; border-radius: 20px; padding: 18px; backdrop-filter: blur(8px); }
        .stat-val { font-size: 26px; font-weight: 900; margin-top: 6px; }
        .stat-lbl { font-size: 11px; color: #a1a1aa; font-weight: 700; }
        .card { background: rgba(24, 24, 27, 0.6); border: 1px solid #27272a; border-radius: 24px; padding: 22px; backdrop-filter: blur(8px); margin-bottom: 24px; }
        .card-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #27272a; padding-bottom: 14px; margin-bottom: 18px; font-size: 14px; font-weight: 800; color: #fff; }
        .form-input { padding: 9px 12px; background: #18181b; border: 1px solid #3f3f46; border-radius: 10px; color: #fff; font-size: 12px; outline: none; }
        table { width: 100%; border-collapse: collapse; text-align: right; font-size: 12px; }
        th { background: #18181b; padding: 12px; font-weight: 800; color: #a1a1aa; border-bottom: 1px solid #27272a; }
        td { padding: 12px; border-bottom: 1px solid rgba(39, 39, 42, 0.5); vertical-align: middle; }
        tr:hover { background: rgba(39, 39, 42, 0.3); }
        .badge-role { padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
        .badge-admin-role { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
        .badge-user-role { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .footer-note { text-align: center; font-size: 11px; color: #71717a; margin-top: 32px; font-family: monospace; }
        .alert-box { padding: 12px 16px; border-radius: 12px; font-size: 12px; margin-bottom: 18px; font-weight: 700; }
        .alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; }
        .alert-danger { background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Top Header -->
        <div class="header">
            <div class="header-title">
                <span style="font-size: 22px;">🛡️</span>
                <div>
                    <h1 style="font-size: 16px; font-weight: 900;">پنل مانیتورینگ و مدیریت اختصاصی Mohusyn</h1>
                    <p style="font-size: 11px; color: #a1a1aa;">تسک‌روز • مدیریت بلادرنگ کاربران، انتصاب وظایف و خروجی اکسل</p>
                </div>
            </div>

            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <a href="admin.php?action=export_csv" class="btn-sm btn-excel">📥 خروجی کامل اکسل / CSV</a>
                <a href="dashboard.php" class="btn-sm">داشبورد شخصی</a>
                <a href="index.html" class="btn-sm btn-primary">وب‌اپلیکیشن اصلی</a>
                <a href="login.php?action=logout" class="btn-sm" style="color: #fb7185;">خروج</a>
            </div>
        </div>

        <?php if (!empty($successMessage)): ?>
            <div class="alert-box alert-success"><?= htmlspecialchars($successMessage) ?></div>
        <?php endif; ?>
        <?php if (!empty($errorMessage)): ?>
            <div class="alert-box alert-danger"><?= htmlspecialchars($errorMessage) ?></div>
        <?php endif; ?>

        <!-- Key Metrics -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-lbl">کل کاربران ثبت‌نامی</div>
                <div class="stat-val" style="color: #60a5fa;"><?= $totalUsers ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-lbl">تعداد کل تسک‌های ثبت‌شده</div>
                <div class="stat-val" style="color: #fbbf24;"><?= $totalTasks ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-lbl">تسک‌های انجام‌شده</div>
                <div class="stat-val" style="color: #34d399;"><?= $completedTasks ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-lbl">نرخ موفقیت تیمی</div>
                <div class="stat-val" style="color: #c084fc;"><?= $overallRate ?>٪</div>
            </div>
        </div>

        <!-- Task Assignment Card -->
        <div class="card">
            <div class="card-header">
                <span>انتصاب تسک سازمانی به کاربران</span>
                <span class="badge-purple">فرماندهی وظایف</span>
            </div>
            <form method="POST" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) 120px; gap: 12px; align-items: flex-end;">
                <input type="hidden" name="action" value="assign_task">
                <div>
                    <label style="display:block; font-size:11px; margin-bottom:4px; color:#a1a1aa;">انتخاب کاربر:</label>
                    <select name="target_user_id" class="form-input" style="width: 100%;" required>
                        <option value="">-- انتخاب کاربر --</option>
                        <?php foreach ($users as $u): ?>
                            <option value="<?= htmlspecialchars($u['id']) ?>">
                                <?= htmlspecialchars($u['name']) ?> (<?= htmlspecialchars($u['username']) ?> - <?= htmlspecialchars($u['job_title'] ?? 'کاربر') ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label style="display:block; font-size:11px; margin-bottom:4px; color:#a1a1aa;">عنوان تسک / مأموریت:</label>
                    <input type="text" name="title" class="form-input" style="width:100%;" placeholder="مثال: تکمیل گزارش مالی فصلی" required>
                </div>
                <div>
                    <label style="display:block; font-size:11px; margin-bottom:4px; color:#a1a1aa;">تاریخ سررسید:</label>
                    <input type="date" name="date" class="form-input" style="width:100%;" value="<?= date('Y-m-d') ?>">
                </div>
                <div>
                    <label style="display:block; font-size:11px; margin-bottom:4px; color:#a1a1aa;">ساعت (۲۴ ساعته):</label>
                    <input type="text" name="time" class="form-input" style="width:100%;" value="۱۰:۰۰">
                </div>
                <div>
                    <label style="display:block; font-size:11px; margin-bottom:4px; color:#a1a1aa;">اولویت:</label>
                    <select name="priority" class="form-input" style="width:100%;">
                        <option value="high">فوری 🔥</option>
                        <option value="medium" selected>مهم ⚡</option>
                        <option value="low">معمولی</option>
                    </select>
                </div>
                <div>
                    <button type="submit" class="btn-sm btn-primary" style="width: 100%; height: 38px;">محول کردن</button>
                </div>
            </form>
        </div>

        <!-- Users Table -->
        <div class="card">
            <div class="card-header">
                <span>فهرست کامل اعضا و عملکرد</span>
                <span style="font-size: 11px; color: #a1a1aa;">به‌روزرسانی لحظه‌ای</span>
            </div>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>نام و اطلاعات تماس</th>
                            <th>موقعیت و شغل</th>
                            <th>مهارت‌ها</th>
                            <th>نقش</th>
                            <th>پیشرفت تسک‌ها</th>
                            <th>درصد موفقیت</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $u): ?>
                            <?php 
                                $uTasks = array_filter($tasks, fn($t) => ($t['userId'] ?? '') === $u['id']);
                                $uTotal = count($uTasks);
                                $uDone = count(array_filter($uTasks, fn($t) => !empty($t['completed'])));
                                $uRate = $uTotal > 0 ? round(($uDone / $uTotal) * 100) : 0;
                                $skills = is_array($u['skills'] ?? null) ? $u['skills'] : [];
                            ?>
                            <tr>
                                <td>
                                    <div style="font-weight: 800; color: #fff;"><?= htmlspecialchars($u['name']) ?></div>
                                    <div style="font-size: 10px; color: #a1a1aa; font-family: monospace;">
                                        <?= htmlspecialchars($u['username']) ?> • <?= htmlspecialchars($u['phone'] ?? '—') ?>
                                    </div>
                                    <div style="font-size: 10px; color: #71717a; font-family: monospace;">
                                        <?= htmlspecialchars($u['gmail'] ?? '—') ?>
                                    </div>
                                </td>
                                <td>
                                    <div style="color: #e4e4e7; font-weight: 700;"><?= htmlspecialchars($u['job_title'] ?? 'ثبت نشده') ?></div>
                                    <div style="font-size: 10px; color: #a1a1aa;">
                                        <?= htmlspecialchars($u['province'] ?? 'ایران') ?> - <?= htmlspecialchars($u['city'] ?? '') ?>
                                    </div>
                                </td>
                                <td>
                                    <?php if (!empty($skills)): ?>
                                        <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 220px;">
                                            <?php foreach (array_slice($skills, 0, 3) as $sk): ?>
                                                <span style="background: #27272a; padding: 2px 6px; border-radius: 4px; font-size: 9px;"><?= htmlspecialchars($sk) ?></span>
                                            <?php endforeach; ?>
                                            <?php if (count($skills) > 3): ?>
                                                <span style="font-size: 9px; color: #71717a;">+<?= count($skills) - 3 ?></span>
                                            <?php endif; ?>
                                        </div>
                                    <?php else: ?>
                                        <span style="color: #52525b; font-size: 11px;">—</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if ($u['role'] === 'admin'): ?>
                                        <span class="badge-role badge-admin-role">مدیر کل</span>
                                    <?php else: ?>
                                        <span class="badge-role badge-user-role">کاربر عادی</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div style="font-weight: 700;"><?= $uDone ?> از <?= $uTotal ?></div>
                                </td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 60px; height: 6px; background: #27272a; border-radius: 9999px; overflow: hidden;">
                                            <div style="width: <?= $uRate ?>%; height: 100%; background: #10b981;"></div>
                                        </div>
                                        <span style="font-weight: 800; font-family: monospace;"><?= $uRate ?>٪</span>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="footer-note">BUILT BY MOHUSYN • TASKROOZ SYSTEM • ۲۰۲۶</div>
    </div>
</body>
</html>
