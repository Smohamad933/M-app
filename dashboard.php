<?php
/**
 * TaskRooz - Main PHP Dashboard (Hourly Daily Planner, Jalali Date & AI Habits Analyzer)
 * Built by Mohusyn
 */
require_once __DIR__ . '/config.php';

$user = requireLogin();
$userId = $user['id'];
$today = date('Y-m-d');
$selectedDate = $_GET['date'] ?? $today;

// Handle Actions (Add Task, Toggle, Set Reason, Save Notes)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add_task') {
        $title = trim($_POST['title'] ?? '');
        $time = trim($_POST['time'] ?? '');
        $priority = in_array($_POST['priority'] ?? '', ['high', 'medium', 'low']) ? $_POST['priority'] : 'medium';
        if (!empty($title)) {
            $db->createTask([
                'title' => $title,
                'date' => $selectedDate,
                'time' => $time ?: null,
                'priority' => $priority,
                'categoryId' => 'cat-work',
            ], $user);
        }
        header("Location: dashboard.php?date={$selectedDate}");
        exit;
    }

    if ($action === 'toggle_task') {
        $taskId = $_POST['task_id'] ?? '';
        $tasks = $db->getTasks(['userId' => $userId]);
        foreach ($tasks as $t) {
            if ($t['id'] === $taskId) {
                $db->updateTask($taskId, ['completed' => empty($t['completed']) ? 1 : 0]);
                break;
            }
        }
        header("Location: dashboard.php?date={$selectedDate}");
        exit;
    }

    if ($action === 'set_reason') {
        $taskId = $_POST['task_id'] ?? '';
        $reason = trim($_POST['reason'] ?? '');
        $category = trim($_POST['category'] ?? 'procrastination');
        if (!empty($taskId)) {
            $db->updateTask($taskId, [
                'completed' => 0,
                'reason_uncompleted' => $reason,
                'uncompleted_category' => $category,
            ]);
        }
        header("Location: dashboard.php?date={$selectedDate}");
        exit;
    }
}

// Fetch Tasks for Date
$dayTasks = $db->getTasks(['userId' => $userId, 'date' => $selectedDate]);
$completedCount = 0;
foreach ($dayTasks as $t) {
    if (!empty($t['completed'])) $completedCount++;
}
$totalCount = count($dayTasks);
$progressPercent = $totalCount > 0 ? round(($completedCount / $totalCount) * 100) : 0;

// Group tasks by hour
$hours = range(6, 23);
$tasksByHour = [];
foreach ($hours as $h) {
    $tasksByHour[$h] = [];
}
$unassigned = [];
foreach ($dayTasks as $t) {
    if (!empty($t['time'])) {
        $parts = explode(':', $t['time']);
        $h = (int)$parts[0];
        if (isset($tasksByHour[$h])) {
            $tasksByHour[$h][] = $t;
            continue;
        }
    }
    $unassigned[] = $t;
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>داشبورد دیلی پلنر | تسک‌روز</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', sans-serif; }
        body { background: #09090b; color: #f4f4f5; min-height: 100vh; padding: 20px; }
        .container { max-width: 1080px; margin: 0 auto; }
        .header { background: rgba(24, 24, 27, 0.8); border: 1px solid #27272a; border-radius: 24px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; backdrop-filter: blur(12px); }
        .user-info { display: flex; align-items: center; gap: 14px; }
        .avatar { width: 44px; height: 44px; background: #fff; color: #09090b; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; }
        h1 { font-size: 16px; font-weight: 900; color: #fff; }
        p.sub { font-size: 12px; color: #a1a1aa; }
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .btn-sm { padding: 8px 14px; background: #27272a; color: #e4e4e7; font-size: 12px; font-weight: 700; border-radius: 12px; text-decoration: none; border: 1px solid #3f3f46; cursor: pointer; transition: all .2s; }
        .btn-sm:hover { background: #3f3f46; color: #fff; }
        .btn-primary { background: #fff; color: #09090b; border: none; }
        .btn-primary:hover { background: #e4e4e7; }
        .grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media(max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
        .card { background: rgba(24, 24, 27, 0.6); border: 1px solid #27272a; border-radius: 24px; padding: 20px; backdrop-filter: blur(8px); }
        .card-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #27272a; padding-bottom: 12px; margin-bottom: 16px; font-size: 13px; font-weight: 800; color: #fff; }
        .progress-bar-bg { width: 100%; height: 8px; background: #27272a; border-radius: 9999px; overflow: hidden; margin-top: 8px; }
        .progress-bar-fill { height: 100%; background: #10b981; border-radius: 9999px; transition: width .4s; }
        .hour-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(39, 39, 42, 0.4); }
        .hour-badge { width: 60px; font-family: monospace; font-size: 12px; font-weight: 800; background: #18181b; border: 1px solid #27272a; padding: 3px 6px; border-radius: 8px; color: #a1a1aa; text-align: center; }
        .hour-tasks { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .task-item { display: flex; align-items: center; justify-content: space-between; background: rgba(39, 39, 42, 0.7); border: 1px solid #3f3f46; border-radius: 12px; padding: 8px 12px; font-size: 12px; }
        .task-title { flex: 1; text-align: right; }
        .task-title.done { text-decoration: line-through; color: #71717a; }
        .reason-tag { font-size: 10px; color: #fbbf24; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; padding: 2px 6px; margin-top: 3px; display: inline-block; }
        .form-input { padding: 8px 12px; background: #18181b; border: 1px solid #3f3f46; border-radius: 10px; color: #fff; font-size: 12px; outline: none; }
        .add-task-form { display: flex; gap: 8px; margin-bottom: 16px; }
        .add-task-form input[type="text"] { flex: 1; }
        .badge { padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; }
        .badge-admin { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
        .footer-note { text-align: center; font-size: 11px; color: #71717a; margin-top: 32px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="user-info">
                <div class="avatar">✓</div>
                <div>
                    <h1>سلام، <?= htmlspecialchars($user['name']) ?></h1>
                    <p class="sub">
                        تاریخ: <?= htmlspecialchars($selectedDate) ?> • شغل: <?= htmlspecialchars($user['job_title'] ?? 'کاربر تسک‌روز') ?>
                        <?php if ($user['role'] === 'admin'): ?>
                            <span class="badge badge-admin">مدیر سیستم</span>
                        <?php endif; ?>
                    </p>
                </div>
            </div>

            <div class="header-actions">
                <a href="index.html" class="btn-sm">ورود به وب‌اپلیکیشن اصلی</a>
                <?php if ($user['role'] === 'admin'): ?>
                    <a href="admin.php" class="btn-sm" style="background:rgba(168,85,247,0.2); color:#c084fc; border-color:rgba(168,85,247,0.4);">پنل مانیتورینگ ادمین</a>
                <?php endif; ?>
                <a href="login.php?action=logout" class="btn-sm" style="color:#fb7185;">خروج</a>
            </div>
        </div>

        <!-- Progress Overview -->
        <div class="card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                <span style="font-weight: 800;">نرخ پیشرفت کارهای روز:</span>
                <span style="font-weight: 900; color: #34d399; font-size: 16px;"><?= $progressPercent ?>٪ (<?= $completedCount ?> از <?= $totalCount ?>)</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: <?= $progressPercent ?>%;"></div>
            </div>
        </div>

        <div class="grid-layout">
            <!-- Left: Hourly Daily Planner -->
            <div class="card">
                <div class="card-header">
                    <span>دیلی پلنر ساعتی (ساعت ۶ تا ۲۳)</span>
                    <span style="font-size: 11px; color:#a1a1aa;">تاریخ: <?= htmlspecialchars($selectedDate) ?></span>
                </div>

                <!-- Quick Add Task -->
                <form method="POST" class="add-task-form">
                    <input type="hidden" name="action" value="add_task">
                    <input type="text" name="title" class="form-input" placeholder="عنوان کار جدید..." required>
                    <input type="text" name="time" class="form-input" style="width: 80px;" placeholder="۰۸:۰۰">
                    <select name="priority" class="form-input" style="width: 90px;">
                        <option value="high">فوری 🔥</option>
                        <option value="medium" selected>مهم ⚡</option>
                        <option value="low">معمولی</option>
                    </select>
                    <button type="submit" class="btn-sm btn-primary">ثبت</button>
                </form>

                <!-- Hourly Slots -->
                <div style="max-height: 580px; overflow-y: auto; padding-left: 6px;">
                    <?php foreach ($hours as $h): ?>
                        <?php 
                            $hourLabel = str_pad($h, 2, '0', STR_PAD_LEFT) . ':۰۰'; 
                            $slotTasks = $tasksByHour[$h] ?? [];
                        ?>
                        <div class="hour-row">
                            <span class="hour-badge"><?= $hourLabel ?></span>
                            <div class="hour-tasks">
                                <?php if (empty($slotTasks)): ?>
                                    <span style="font-size: 11px; color: #52525b;">— خالی —</span>
                                <?php else: ?>
                                    <?php foreach ($slotTasks as $t): ?>
                                        <div class="task-item">
                                            <div class="task-title <?= !empty($t['completed']) ? 'done' : '' ?>">
                                                <?= htmlspecialchars($t['title']) ?>
                                                <?php if (!empty($t['reason_uncompleted'])): ?>
                                                    <br><span class="reason-tag">علت تعویق: <?= htmlspecialchars($t['reason_uncompleted']) ?></span>
                                                <?php endif; ?>
                                            </div>

                                            <div style="display:flex; align-items:center; gap:6px;">
                                                <form method="POST" style="display:inline;">
                                                    <input type="hidden" name="action" value="toggle_task">
                                                    <input type="hidden" name="task_id" value="<?= $t['id'] ?>">
                                                    <button type="submit" class="btn-sm" style="padding:4px 8px; font-size:10px;">
                                                        <?= !empty($t['completed']) ? 'بازگردانی' : 'انجام شد ✓' ?>
                                                    </button>
                                                </form>

                                                <?php if (empty($t['completed'])): ?>
                                                    <!-- Reason Button -->
                                                    <button type="button" class="btn-sm" style="padding:4px 8px; font-size:10px; color:#fbbf24;" onclick="openReasonModal('<?= $t['id'] ?>', '<?= htmlspecialchars(addslashes($t['title'])) ?>')">
                                                        علت عدم انجام؟
                                                    </button>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Right: Timeline & Notes -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <!-- Daily Timeline Card -->
                <div class="card">
                    <div class="card-header">
                        <span>تایم‌لاین روتین شما</span>
                    </div>
                    <div style="font-size: 12px; line-height: 2; color:#d4d4d8;">
                        <div>☀️ بیداری: <strong><?= htmlspecialchars($user['dailyTimeline']['wakeUp'] ?? '۰۶:۳۰') ?></strong></div>
                        <div>💻 شروع کار: <strong><?= htmlspecialchars($user['dailyTimeline']['workStart'] ?? '۰۸:۳۰') ?></strong></div>
                        <div>🥗 ناهار: <strong><?= htmlspecialchars($user['dailyTimeline']['lunch'] ?? '۱۳:۳۰') ?></strong></div>
                        <div>🏃‍♂️ باشگاه: <strong><?= htmlspecialchars($user['dailyTimeline']['gym'] ?? '۱۸:۰۰') ?></strong></div>
                        <div>🌙 خواب: <strong><?= htmlspecialchars($user['dailyTimeline']['sleep'] ?? '۲۳:۳۰') ?></strong></div>
                    </div>
                </div>

                <!-- AI Habits Box -->
                <div class="card" style="background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25);">
                    <div class="card-header" style="color: #c7d2fe;">
                        <span>تحلیلگر هوشمند عادات (AI)</span>
                    </div>
                    <p style="font-size: 12px; color: #e0e7ff; line-height: 1.8;">
                        تسک‌های انجام‌نشده شما در دیتابیس پردازش می‌شوند تا در پایان ماه، گزارش درصدی از اهمال‌کاری، حواس‌پرتی و پیشنهادهای جبرانی هوشمند تولید شود.
                    </p>
                </div>
            </div>
        </div>

        <div class="footer-note">mohusyn.ir • ۲۰۲۶</div>
    </div>

    <!-- Modal for Reason of Incomplete Task -->
    <div id="reasonModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:99; align-items:center; justify-content:center;">
        <div class="card" style="max-width:460px; width:100%; margin:20px;">
            <div class="card-header">
                <span>ثبت دلیل عدم انجام تسک</span>
                <button type="button" onclick="closeReasonModal()" style="background:none; border:none; color:#a1a1aa; font-size:16px; cursor:pointer;">✕</button>
            </div>
            <form method="POST">
                <input type="hidden" name="action" value="set_reason">
                <input type="hidden" id="modalTaskId" name="task_id" value="">
                
                <p id="modalTaskTitle" style="font-size:12px; color:#e4e4e7; font-weight:800; margin-bottom:12px;"></p>

                <div style="margin-bottom:12px;">
                    <label style="display:block; font-size:11px; margin-bottom:4px; color:#a1a1aa;">دسته‌بندی مانع:</label>
                    <select name="category" class="form-input" style="width:100%;">
                        <option value="procrastination">اهمال‌کاری و مقاومت ذهنی</option>
                        <option value="others_priority">اولویت دادن به کارهای دیگران</option>
                        <option value="time_shortage">کمبود زمان و خطای تخمین</option>
                        <option value="low_energy">خستگی و افت انرژی</option>
                        <option value="distraction">حواس‌پرتی با موبایل و فضای مجازی</option>
                        <option value="external">موانع خارجی و رخداد غیرمنتظره</option>
                    </select>
                </div>

                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; margin-bottom:4px; color:#a1a1aa;">توضیحات تکمیلی:</label>
                    <input type="text" name="reason" class="form-input" style="width:100%;" placeholder="علت تعویق..." required>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button type="button" class="btn-sm" onclick="closeReasonModal()">انصراف</button>
                    <button type="submit" class="btn-sm btn-primary">ثبت در تحلیلگر عادت‌ها</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function openReasonModal(taskId, taskTitle) {
            document.getElementById('modalTaskId').value = taskId;
            document.getElementById('modalTaskTitle').innerText = 'تسک: ' + taskTitle;
            document.getElementById('reasonModal').style.display = 'flex';
        }
        function closeReasonModal() {
            document.getElementById('reasonModal').style.display = 'none';
        }
    </script>
</body>
</html>
