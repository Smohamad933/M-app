<?php
/**
 * TaskRooz - Universal Hybrid Storage Layer (MySQL PDO + JSON Storage Engine)
 * Dual-Engine Architecture:
 * 1. MySQL 5.7+ / 8.0+ / MariaDB when configured in config.php
 * 2. Unified JSON storage (data/db.json) as fail-safe fallback
 * Compatible with Windows IIS / Apache / Nginx / Linux on PHP 7.4+ to 8.4+
 * Author: Mohusyn (mohusyn.ir)
 */

class TaskRoozDB {
    private static $instance = null;
    public $mode = 'json'; // 'mysql' or 'json'
    private $pdo = null;
    private $jsonFile = null;
    public $data = [];

    private function __construct() {
        // Attempt MySQL connection if available
        if (function_exists('getMySQLPDO')) {
            $this->pdo = getMySQLPDO();
            if ($this->pdo !== null) {
                $this->mode = 'mysql';
            }
        }
        $this->loadJson();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new TaskRoozDB();
        }
        return self::$instance;
    }

    public function getPdo() {
        return $this->pdo;
    }

    // --- JSON Storage Helpers ---
    public function loadJson() {
        $candidatePaths = [
            dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json',
            __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json',
            __DIR__ . DIRECTORY_SEPARATOR . 'db.json',
            sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'taskrooz_db.json'
        ];

        $content = null;
        $foundPath = null;
        foreach ($candidatePaths as $p) {
            if (file_exists($p) && filesize($p) > 10) {
                $raw = @file_get_contents($p);
                if (!empty($raw)) {
                    $parsed = @json_decode($raw, true);
                    if (is_array($parsed) && isset($parsed['users'])) {
                        $content = $parsed;
                        $foundPath = $p;
                        break;
                    }
                }
            }
        }

        if ($content) {
            $this->data = $content;
            $this->jsonFile = $foundPath;
        } else {
            // Default seed
            $this->data = [
                'users' => [
                    [
                        'id' => 'usr_admin_mohusyn',
                        'username' => 'Mohusyn',
                        'name' => 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
                        'password' => 'Smosh1387',
                        'password_hash' => password_hash('Smosh1387', PASSWORD_DEFAULT),
                        'role' => 'admin',
                        'createdAt' => date('Y-m-d H:i:s'),
                    ]
                ],
                'categories' => [
                    ['id' => 'cat-work', 'name' => 'کاری و شغلی', 'color' => '#6366f1', 'icon' => 'Briefcase', 'is_default' => 1],
                    ['id' => 'cat-personal', 'name' => 'کارهای شخصی', 'color' => '#10b981', 'icon' => 'User', 'is_default' => 1],
                    ['id' => 'cat-study', 'name' => 'مطالعه و یادگیری', 'color' => '#f59e0b', 'icon' => 'BookOpen', 'is_default' => 1],
                    ['id' => 'cat-health', 'name' => 'ورزش و سلامتی', 'color' => '#f43f5e', 'icon' => 'Activity', 'is_default' => 1],
                    ['id' => 'cat-shopping', 'name' => 'خرید و منزل', 'color' => '#0ea5e9', 'icon' => 'ShoppingCart', 'is_default' => 1],
                    ['id' => 'cat-finance', 'name' => 'امور مالی', 'color' => '#8b5cf6', 'icon' => 'CreditCard', 'is_default' => 1],
                ],
                'tasks' => [],
                'focus_rooms' => [],
                'projects' => [],
                'goals' => [],
                'dailyNotes' => [],
                'personalityResults' => [],
                'globalSettings' => [
                    'broadcastNotice' => [
                        'enabled' => true,
                        'title' => 'خوش‌آمدید به سامانه تسک‌روز',
                        'message' => 'سامانه متمرکز برنامه‌ریزی روزانه، پومودورو تیمی و پایش بهره‌وری آماده استفاده است.',
                        'type' => 'info',
                    ],
                    'enforcedFont' => 'vazirmatn',
                    'defaultDailyFocusMinutes' => 90,
                    'workHoursPolicy' => ['start' => '08:30', 'end' => '17:00'],
                    'roomPolicy' => ['allowUserRoomCreation' => true, 'allowPublicChat' => true],
                    'dailyMantra' => 'تمرکز پیوسته بر کارهای با اولویت بالا و پرهیز از چندوظیفگی',
                ],
                'custom_fonts' => [],
            ];
            $this->jsonFile = $candidatePaths[0];
            $this->saveJson();
        }

        // Ensure all top-level keys exist
        if (!isset($this->data['users']) || !is_array($this->data['users'])) $this->data['users'] = [];
        if (!isset($this->data['tasks']) || !is_array($this->data['tasks'])) $this->data['tasks'] = [];
        if (!isset($this->data['categories']) || !is_array($this->data['categories'])) $this->data['categories'] = [];
        if (!isset($this->data['projects']) || !is_array($this->data['projects'])) $this->data['projects'] = [];
        if (!isset($this->data['goals']) || !is_array($this->data['goals'])) $this->data['goals'] = [];
        if (!isset($this->data['dailyNotes']) || !is_array($this->data['dailyNotes'])) $this->data['dailyNotes'] = [];
        if (!isset($this->data['personalityResults']) || !is_array($this->data['personalityResults'])) $this->data['personalityResults'] = [];
        if (!isset($this->data['globalSettings']) || !is_array($this->data['globalSettings'])) $this->data['globalSettings'] = [];
        if (!isset($this->data['custom_fonts']) || !is_array($this->data['custom_fonts'])) $this->data['custom_fonts'] = [];

        // Support both focus_rooms and rooms
        if (!isset($this->data['focus_rooms'])) {
            $this->data['focus_rooms'] = $this->data['rooms'] ?? [];
        }
        $this->data['rooms'] = &$this->data['focus_rooms'];

        // Ensure Mohusyn exists as admin
        $hasAdmin = false;
        foreach ($this->data['users'] as $u) {
            if (isset($u['username']) && strtolower($u['username']) === 'mohusyn') {
                $hasAdmin = true;
                break;
            }
        }
        if (!$hasAdmin) {
            array_unshift($this->data['users'], [
                'id' => 'usr_admin_mohusyn',
                'username' => 'Mohusyn',
                'name' => 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
                'password' => 'Smosh1387',
                'password_hash' => password_hash('Smosh1387', PASSWORD_DEFAULT),
                'role' => 'admin',
                'createdAt' => date('Y-m-d H:i:s'),
            ]);
            $this->saveJson();
        }
    }

    public function saveJson() {
        if (!is_array($this->data)) return;
        $encoded = json_encode($this->data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        if (!$encoded) return;

        $pathsToSave = array_unique([
            dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json',
            __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json',
            __DIR__ . DIRECTORY_SEPARATOR . 'db.json',
        ]);

        foreach ($pathsToSave as $p) {
            $dir = dirname($p);
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
            @file_put_contents($p, $encoded, LOCK_EX);
            @chmod($p, 0666);
        }
    }

    // --- User Operations (MySQL + JSON Dual Sync) ---
    public function getUserByUsername($username) {
        $target = strtolower(trim($username));

        // 1. Try MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1");
                $stmt->execute([$target]);
                $u = $stmt->fetch();
                if ($u) {
                    if (!empty($u['skills_json'])) $u['skills'] = json_decode($u['skills_json'], true);
                    if (!empty($u['timeline_json'])) $u['dailyTimeline'] = json_decode($u['timeline_json'], true);
                    return $u;
                }
            } catch (Exception $e) {}
        }

        // 2. JSON Storage
        $this->loadJson();
        foreach ($this->data['users'] as $u) {
            if (isset($u['username']) && strtolower($u['username']) === $target) {
                return $u;
            }
        }
        return null;
    }

    public function getUserById($id) {
        if (empty($id)) return null;
        if (strtolower($id) === 'mohusyn' || $id === 'usr_admin_mohusyn' || $id === 'usr_mohusyn_admin') {
            return $this->getUserByUsername('Mohusyn');
        }

        // 1. Try MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ? OR LOWER(username) = LOWER(?) LIMIT 1");
                $stmt->execute([$id, $id]);
                $u = $stmt->fetch();
                if ($u) {
                    if (!empty($u['skills_json'])) $u['skills'] = json_decode($u['skills_json'], true);
                    if (!empty($u['timeline_json'])) $u['dailyTimeline'] = json_decode($u['timeline_json'], true);
                    return $u;
                }
            } catch (Exception $e) {}
        }

        // 2. JSON Storage
        $this->loadJson();
        foreach ($this->data['users'] as $u) {
            if (isset($u['id']) && $u['id'] === $id) {
                return $u;
            }
            if (isset($u['username']) && strtolower($u['username']) === strtolower($id)) {
                return $u;
            }
        }
        return null;
    }

    public function createUser($username, $password, $name, $role = 'user', $extra = []) {
        $usernameClean = trim($username);
        $usernameLower = strtolower($usernameClean);
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $id = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        $now = date('Y-m-d H:i:s');
        $phone = $extra['phone'] ?? '';
        $email = $extra['email'] ?? $extra['gmail'] ?? '';
        $province = $extra['province'] ?? '';
        $city = $extra['city'] ?? '';
        $birthDate = $extra['birthDate'] ?? $extra['birth_date'] ?? '';
        $jobTitle = $extra['jobTitle'] ?? $extra['job_title'] ?? '';
        $skills = $extra['skills'] ?? [];
        $timeline = $extra['dailyTimeline'] ?? [];

        // Role strictly user unless Mohusyn
        if ($usernameLower === 'mohusyn') {
            $role = 'admin';
            $id = 'usr_admin_mohusyn';
        } else {
            $role = 'user';
        }

        $userObj = [
            'id' => $id,
            'username' => $usernameClean,
            'password' => $password,
            'password_hash' => $hash,
            'name' => trim($name),
            'role' => $role,
            'phone' => $phone,
            'email' => $email,
            'province' => $province,
            'city' => $city,
            'birthDate' => $birthDate,
            'jobTitle' => $jobTitle,
            'skills' => is_array($skills) ? $skills : [],
            'dailyTimeline' => is_array($timeline) ? $timeline : [],
            'createdAt' => $now,
            'totalTasks' => 0,
            'completedTasks' => 0,
            'progressPercent' => 0,
        ];

        // 1. Save to MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO users (id, username, password_hash, name, role, phone, email, province, city, birth_date, job_title, skills_json, timeline_json, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        name = VALUES(name),
                        password_hash = VALUES(password_hash),
                        role = VALUES(role),
                        phone = VALUES(phone),
                        email = VALUES(email),
                        province = VALUES(province),
                        city = VALUES(city),
                        job_title = VALUES(job_title)
                ");
                $stmt->execute([
                    $id, $usernameClean, $hash, $name, $role,
                    $phone, $email, $province, $city, $birthDate, $jobTitle,
                    json_encode($skills), json_encode($timeline), $now
                ]);
            } catch (Exception $e) {}
        }

        // 2. Save to JSON backup
        $this->loadJson();
        $existingIdx = -1;
        foreach ($this->data['users'] as $idx => $u) {
            if (isset($u['username']) && strtolower($u['username']) === $usernameLower) {
                $existingIdx = $idx;
                break;
            }
        }
        if ($existingIdx >= 0) {
            $this->data['users'][$existingIdx] = array_merge($this->data['users'][$existingIdx], $userObj);
            $userObj = $this->data['users'][$existingIdx];
        } else {
            $this->data['users'][] = $userObj;
        }
        $this->saveJson();

        return $userObj;
    }

    public function getAllUsers() {
        // 1. Try MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("
                    SELECT 
                        u.id, u.username, u.name, u.role, u.phone, u.email, u.province, u.city,
                        u.birth_date as birthDate, u.job_title as jobTitle, u.skills_json, u.timeline_json,
                        u.created_at as createdAt,
                        COUNT(t.id) as totalTasks,
                        SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completedTasks
                    FROM users u
                    LEFT JOIN tasks t ON u.id = t.user_id
                    GROUP BY u.id
                    ORDER BY u.created_at ASC
                ");
                $users = $stmt->fetchAll();
                if ($users && count($users) > 0) {
                    return array_map(function($u) {
                        $total = (int)($u['totalTasks'] ?? 0);
                        $done = (int)($u['completedTasks'] ?? 0);
                        $u['totalTasks'] = $total;
                        $u['completedTasks'] = $done;
                        $u['progressPercent'] = $total > 0 ? round(($done / $total) * 100) : 0;
                        $u['skills'] = !empty($u['skills_json']) ? json_decode($u['skills_json'], true) : [];
                        $u['dailyTimeline'] = !empty($u['timeline_json']) ? json_decode($u['timeline_json'], true) : [];
                        return $u;
                    }, $users);
                }
            } catch (Exception $e) {}
        }

        // 2. JSON Storage
        $this->loadJson();
        $res = [];
        $tasks = $this->data['tasks'] ?? [];

        foreach ($this->data['users'] as $u) {
            $total = 0;
            $done = 0;
            foreach ($tasks as $t) {
                $tUserId = $t['userId'] ?? $t['user_id'] ?? '';
                if ($tUserId === $u['id'] || (isset($u['username']) && $tUserId === $u['username'])) {
                    $total++;
                    if (!empty($t['completed'])) $done++;
                }
            }

            $res[] = [
                'id' => $u['id'],
                'username' => $u['username'],
                'name' => $u['name'],
                'role' => $u['role'] ?? 'user',
                'phone' => $u['phone'] ?? '',
                'email' => $u['email'] ?? $u['gmail'] ?? '',
                'province' => $u['province'] ?? '',
                'city' => $u['city'] ?? '',
                'birthDate' => $u['birthDate'] ?? $u['birth_date'] ?? '',
                'jobTitle' => $u['jobTitle'] ?? $u['job_title'] ?? '',
                'skills' => $u['skills'] ?? [],
                'dailyTimeline' => $u['dailyTimeline'] ?? [],
                'createdAt' => $u['createdAt'] ?? $u['created_at'] ?? date('Y-m-d H:i:s'),
                'totalTasks' => $total,
                'completedTasks' => $done,
                'progressPercent' => $total > 0 ? round(($done / $total) * 100) : 0,
            ];
        }
        return $res;
    }

    public function updateUser($id, $name, $role, $password = null) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                if (!empty($password)) {
                    $hash = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $this->pdo->prepare("UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?");
                    $stmt->execute([trim($name), $role, $hash, $id]);
                } else {
                    $stmt = $this->pdo->prepare("UPDATE users SET name = ?, role = ? WHERE id = ?");
                    $stmt->execute([trim($name), $role, $id]);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['users'] as &$u) {
            if ($u['id'] === $id) {
                $u['name'] = trim($name);
                if (strtolower($u['username']) === 'mohusyn') {
                    $u['role'] = 'admin';
                } else {
                    $u['role'] = in_array($role, ['admin', 'user']) ? $role : 'user';
                }
                if (!empty($password)) {
                    $u['password'] = $password;
                    $u['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
                }
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function updateUserProfile($id, $data) {
        $user = $this->getUserById($id);
        if (!$user) return null;

        $name = trim($data['name'] ?? $user['name']);
        $phone = trim($data['phone'] ?? ($user['phone'] ?? ''));
        $email = trim($data['email'] ?? ($user['email'] ?? ''));
        $province = trim($data['province'] ?? ($user['province'] ?? ''));
        $city = trim($data['city'] ?? ($user['city'] ?? ''));
        $birthDate = trim($data['birthDate'] ?? ($user['birthDate'] ?? ''));
        $jobTitle = trim($data['jobTitle'] ?? ($user['jobTitle'] ?? ''));
        $avatar = array_key_exists('avatar', $data) ? $data['avatar'] : ($user['avatar'] ?? null);
        $skills = is_array($data['skills'] ?? null) ? $data['skills'] : ($user['skills'] ?? []);
        $timeline = is_array($data['dailyTimeline'] ?? null) ? $data['dailyTimeline'] : ($user['dailyTimeline'] ?? []);
        $newPassword = !empty($data['newPassword']) ? trim($data['newPassword']) : null;

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                // Ensure avatar column exists
                try {
                    $this->pdo->exec("ALTER TABLE users ADD COLUMN avatar mediumtext NULL");
                } catch (Exception $e) {}

                if ($newPassword) {
                    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
                    $stmt = $this->pdo->prepare("UPDATE users SET name = ?, phone = ?, email = ?, province = ?, city = ?, birth_date = ?, job_title = ?, skills_json = ?, timeline_json = ?, avatar = ?, password_hash = ? WHERE id = ?");
                    $stmt->execute([$name, $phone, $email, $province, $city, $birthDate, $jobTitle, json_encode($skills), json_encode($timeline), $avatar, $hash, $id]);
                } else {
                    $stmt = $this->pdo->prepare("UPDATE users SET name = ?, phone = ?, email = ?, province = ?, city = ?, birth_date = ?, job_title = ?, skills_json = ?, timeline_json = ?, avatar = ? WHERE id = ?");
                    $stmt->execute([$name, $phone, $email, $province, $city, $birthDate, $jobTitle, json_encode($skills), json_encode($timeline), $avatar, $id]);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['users'] as &$u) {
            if ($u['id'] === $id) {
                $u['name'] = $name;
                $u['phone'] = $phone;
                $u['email'] = $email;
                $u['province'] = $province;
                $u['city'] = $city;
                $u['birthDate'] = $birthDate;
                $u['jobTitle'] = $jobTitle;
                $u['skills'] = $skills;
                $u['dailyTimeline'] = $timeline;
                if (array_key_exists('avatar', $data)) $u['avatar'] = $avatar;
                if ($newPassword) {
                    $u['password'] = $newPassword;
                    $u['password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
                }
                break;
            }
        }
        $this->saveJson();
        return $this->getUserById($id);
    }

    public function deleteUser($id) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ? AND LOWER(username) != 'mohusyn'");
                $stmt->execute([$id]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->data['users'] = array_values(array_filter($this->data['users'], function($u) use ($id) {
            if (strtolower($u['username'] ?? '') === 'mohusyn' || $u['id'] === 'usr_admin_mohusyn') {
                return true;
            }
            return $u['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Task Operations ---
    public function getTasks($userId = null, $date = null, $categoryId = null, $completed = null, $projectId = null) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $sql = "SELECT * FROM tasks WHERE 1=1";
                $params = [];
                if (!empty($userId)) { $sql .= " AND user_id = ?"; $params[] = $userId; }
                if (!empty($date)) { $sql .= " AND date = ?"; $params[] = $date; }
                if (!empty($categoryId)) { $sql .= " AND category_id = ?"; $params[] = $categoryId; }
                if ($completed !== null) { $sql .= " AND completed = ?"; $params[] = $completed ? 1 : 0; }
                if (!empty($projectId)) { $sql .= " AND project_id = ?"; $params[] = $projectId; }
                $sql .= " ORDER BY is_pinned DESC, time ASC";

                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
                $rows = $stmt->fetchAll();
                if ($rows) {
                    return array_map(function($r) {
                        $r['userId'] = $r['user_id'];
                        $r['projectId'] = $r['project_id'];
                        $r['categoryId'] = $r['category_id'];
                        $r['durationMinutes'] = (int)$r['duration_minutes'];
                        $r['completed'] = !empty($r['completed']);
                        $r['completedAt'] = $r['completed_at'];
                        $r['isPinned'] = !empty($r['is_pinned']);
                        $r['focusMinutesSpent'] = (int)$r['focus_minutes_spent'];
                        $r['reasonUncompleted'] = $r['reason_uncompleted'];
                        $r['uncompletedCategory'] = $r['uncompleted_category'];
                        $r['subtasks'] = !empty($r['subtasks_json']) ? json_decode($r['subtasks_json'], true) : [];
                        return $r;
                    }, $rows);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $res = $this->data['tasks'] ?? [];
        if (!empty($userId)) {
            $res = array_filter($res, function($t) use ($userId) {
                return ($t['userId'] ?? $t['user_id'] ?? '') === $userId;
            });
        }
        if (!empty($date)) {
            $res = array_filter($res, function($t) use ($date) {
                return ($t['date'] ?? '') === $date;
            });
        }
        if (!empty($categoryId)) {
            $res = array_filter($res, function($t) use ($categoryId) {
                return ($t['categoryId'] ?? $t['category_id'] ?? '') === $categoryId;
            });
        }
        if ($completed !== null) {
            $res = array_filter($res, function($t) use ($completed) {
                return !empty($t['completed']) === !empty($completed);
            });
        }
        if (!empty($projectId)) {
            $res = array_filter($res, function($t) use ($projectId) {
                return ($t['projectId'] ?? $t['project_id'] ?? '') === $projectId;
            });
        }
        return array_values($res);
    }

    public function createTask($data) {
        $id = 'task_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        $task = [
            'id' => $id,
            'userId' => $data['userId'] ?? $data['user_id'] ?? 'usr_admin_mohusyn',
            'projectId' => $data['projectId'] ?? $data['project_id'] ?? null,
            'title' => trim($data['title']),
            'description' => trim($data['description'] ?? ''),
            'date' => $data['date'] ?? date('Y-m-d'),
            'time' => $data['time'] ?? '09:00',
            'durationMinutes' => (int)($data['durationMinutes'] ?? $data['duration_minutes'] ?? 30),
            'completed' => !empty($data['completed']),
            'completedAt' => !empty($data['completed']) ? date('Y-m-d H:i:s') : null,
            'priority' => in_array($data['priority'] ?? '', ['high', 'medium', 'low']) ? $data['priority'] : 'medium',
            'categoryId' => $data['categoryId'] ?? $data['category_id'] ?? 'cat-work',
            'isPinned' => !empty($data['isPinned'] ?? $data['is_pinned']),
            'focusMinutesSpent' => (int)($data['focusMinutesSpent'] ?? $data['focus_minutes_spent'] ?? 0),
            'reasonUncompleted' => $data['reasonUncompleted'] ?? $data['reason_uncompleted'] ?? null,
            'uncompletedCategory' => $data['uncompletedCategory'] ?? $data['uncompleted_category'] ?? null,
            'subtasks' => is_array($data['subtasks'] ?? null) ? $data['subtasks'] : [],
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO tasks (id, user_id, project_id, title, description, date, time, duration_minutes, completed, completed_at, priority, category_id, is_pinned, focus_minutes_spent, reason_uncompleted, uncompleted_category, subtasks_json, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id, $task['userId'], $task['projectId'], $task['title'], $task['description'],
                    $task['date'], $task['time'], $task['durationMinutes'], $task['completed'] ? 1 : 0, $task['completedAt'],
                    $task['priority'], $task['categoryId'], $task['isPinned'] ? 1 : 0, $task['focusMinutesSpent'],
                    $task['reasonUncompleted'], $task['uncompletedCategory'], json_encode($task['subtasks']), $task['createdAt']
                ]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->data['tasks'][] = $task;
        $this->saveJson();
        return $task;
    }

    public function updateTask($data) {
        $id = $data['id'] ?? '';
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE tasks SET title = ?, description = ?, completed = ?, is_pinned = ? WHERE id = ?");
                $stmt->execute([$data['title'] ?? '', $data['description'] ?? '', !empty($data['completed']) ? 1 : 0, !empty($data['isPinned']) ? 1 : 0, $id]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['tasks'] as &$t) {
            if ($t['id'] === $id) {
                $t = array_merge($t, $data);
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function toggleTask($id) {
        $this->loadJson();
        foreach ($this->data['tasks'] as &$t) {
            if ($t['id'] === $id) {
                $t['completed'] = !empty($t['completed']) ? false : true;
                $t['completedAt'] = $t['completed'] ? date('Y-m-d H:i:s') : null;
                if ($this->mode === 'mysql' && $this->pdo) {
                    try {
                        $stmt = $this->pdo->prepare("UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?");
                        $stmt->execute([$t['completed'] ? 1 : 0, $t['completedAt'], $id]);
                    } catch (Exception $e) {}
                }
                $this->saveJson();
                return ['completed' => $t['completed'], 'completedAt' => $t['completedAt']];
            }
        }
        return null;
    }

    public function addFocusMinutes($id, $minutes) {
        $this->loadJson();
        foreach ($this->data['tasks'] as &$t) {
            if ($t['id'] === $id) {
                $t['focusMinutesSpent'] = ($t['focusMinutesSpent'] ?? 0) + (int)$minutes;
                if ($this->mode === 'mysql' && $this->pdo) {
                    try {
                        $stmt = $this->pdo->prepare("UPDATE tasks SET focus_minutes_spent = focus_minutes_spent + ? WHERE id = ?");
                        $stmt->execute([(int)$minutes, $id]);
                    } catch (Exception $e) {}
                }
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function deleteTask($id) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("DELETE FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
            } catch (Exception $e) {}
        }
        $this->loadJson();
        $this->data['tasks'] = array_values(array_filter($this->data['tasks'], function($t) use ($id) {
            return $t['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Category Operations ---
    public function getCategories() {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("SELECT id, name, color, icon, is_default as isDefault FROM categories ORDER BY is_default DESC, name ASC");
                $rows = $stmt->fetchAll();
                if ($rows && count($rows) > 0) return $rows;
            } catch (Exception $e) {}
        }
        $this->loadJson();
        return $this->data['categories'] ?? [];
    }

    public function createCategory($name, $color, $icon) {
        $cat = [
            'id' => 'cat_' . time() . '_' . rand(10, 99),
            'name' => trim($name),
            'color' => $color ?: '#6366f1',
            'icon' => $icon ?: 'Folder',
            'isDefault' => false,
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("INSERT INTO categories (id, name, color, icon, is_default) VALUES (?, ?, ?, ?, 0)");
                $stmt->execute([$cat['id'], $cat['name'], $cat['color'], $cat['icon']]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->data['categories'][] = $cat;
        $this->saveJson();
        return $cat;
    }

    // --- Stats Operations ---
    public function getStats($userId = null, $isAdmin = false) {
        $tasks = $this->getTasks($isAdmin ? null : $userId);
        $totalTasks = count($tasks);
        $totalCompleted = 0;
        $todayTasks = 0;
        $todayCompleted = 0;
        $focusMinutes = 0;
        $todayDate = date('Y-m-d');

        foreach ($tasks as $t) {
            if (!empty($t['completed'])) $totalCompleted++;
            $focusMinutes += (int)($t['focusMinutesSpent'] ?? 0);
            if (($t['date'] ?? '') === $todayDate) {
                $todayTasks++;
                if (!empty($t['completed'])) $todayCompleted++;
            }
        }

        $allUsers = $this->getAllUsers();

        return [
            'totalTasks' => $totalTasks,
            'totalCompleted' => $totalCompleted,
            'overallRate' => $totalTasks > 0 ? round(($totalCompleted / $totalTasks) * 100) : 0,
            'todayTotal' => $todayTasks,
            'todayCompleted' => $todayCompleted,
            'todayRate' => $todayTasks > 0 ? round(($todayCompleted / $todayTasks) * 100) : 0,
            'focusMinutes' => $focusMinutes,
            'totalUsers' => count($allUsers),
        ];
    }

    // --- Focus Rooms (Unified Group Pomodoro) ---
    private function purgeExpiredDeletedRooms() {
        if (!isset($this->data['focus_rooms'])) return;
        $now = time();
        $modified = false;
        $this->data['focus_rooms'] = array_values(array_filter($this->data['focus_rooms'], function($r) use ($now, &$modified) {
            $isDeleted = !empty($r['isDeleted']) || !empty($r['is_deleted']);
            $deletedAt = $r['deletedAt'] ?? $r['deleted_at'] ?? 0;
            if ($isDeleted && $deletedAt > 0 && ($now - $deletedAt > 600)) {
                $modified = true;
                return false;
            }
            return true;
        }));
        if ($modified) {
            $this->saveJson();
        }
    }

    public function createFocusRoom($name, $host, $focusDuration = 1500, $breakDuration = 300) {
        $this->loadJson();
        $this->purgeExpiredDeletedRooms();
        $roomId = 'room_' . substr(bin2hex(random_bytes(3)), 0, 6);
        $cleanName = trim($name) ?: 'اتاق تمرکز و مطالعه مشترک';

        $room = [
            'id' => $roomId,
            'name' => $cleanName,
            'hostId' => $host['id'],
            'hostName' => $host['name'],
            'focusDuration' => (int)$focusDuration,
            'breakDuration' => (int)$breakDuration,
            'mode' => 'focus',
            'isRunning' => false,
            'timeLeft' => (int)$focusDuration,
            'lastUpdated' => round(microtime(true) * 1000),
            'isDeleted' => false,
            'is_deleted' => 0,
            'deletedAt' => 0,
            'deleted_at' => 0,
            'participants' => [
                [
                    'userId' => $host['id'],
                    'name' => $host['name'],
                    'username' => $host['username'] ?? '',
                    'role' => $host['role'] ?? 'user',
                    'isHost' => true,
                    'status' => 'focusing',
                    'joinedAt' => date('H:i'),
                    'lastPing' => round(microtime(true) * 1000),
                ]
            ],
            'messages' => [
                [
                    'id' => 'msg_' . time(),
                    'userId' => 'system',
                    'userName' => 'سیستم',
                    'text' => 'اتاق «' . $cleanName . '» توسط ' . $host['name'] . ' ایجاد شد. به تمرکز خوش آمدید! 🎯',
                    'timestamp' => date('H:i'),
                ]
            ],
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        // Save to MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO focus_rooms (id, name, host_id, host_name, focus_duration, break_duration, mode, is_running, time_left, last_updated, is_deleted, deleted_at, participants_json, messages_json, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, NOW())
                ");
                $stmt->execute([
                    $roomId, $cleanName, $host['id'], $host['name'],
                    $room['focusDuration'], $room['breakDuration'], $room['mode'],
                    0, $room['timeLeft'], $room['lastUpdated'],
                    json_encode($room['participants']), json_encode($room['messages'])
                ]);
            } catch (Exception $e) {}
        }

        $this->data['focus_rooms'][] = $room;
        $this->saveJson();
        return $room;
    }

    public function getFocusRoom($roomId) {
        $cleanId = trim(str_replace(["'", '"'], '', $roomId));
        if (empty($cleanId)) return null;

        // Try MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM focus_rooms WHERE id = ? LIMIT 1");
                $stmt->execute([$cleanId]);
                $r = $stmt->fetch();
                if ($r) {
                    $isRunning = !empty($r['is_running']);
                    $timeLeft = (int)$r['time_left'];
                    $lastUpdated = isset($r['last_updated']) ? (float)$r['last_updated'] : 0;

                    // If timer is actively running, compute dynamic remaining seconds from elapsed time
                    if ($isRunning && $lastUpdated > 0) {
                        $nowMs = microtime(true) * 1000;
                        $elapsedSec = max(0, (int)floor(($nowMs - $lastUpdated) / 1000));
                        $timeLeft = max(0, $timeLeft - $elapsedSec);
                        if ($timeLeft === 0) {
                            $isRunning = false;
                        }
                    }

                    return [
                        'id' => $r['id'],
                        'name' => $r['name'],
                        'hostId' => $r['host_id'],
                        'hostName' => $r['host_name'],
                        'focusDuration' => (int)$r['focus_duration'],
                        'breakDuration' => (int)$r['break_duration'],
                        'mode' => $r['mode'],
                        'isRunning' => $isRunning,
                        'timeLeft' => $timeLeft,
                        'lastUpdated' => $lastUpdated,
                        'isDeleted' => !empty($r['is_deleted']),
                        'deletedAt' => (int)$r['deleted_at'],
                        'participants' => !empty($r['participants_json']) ? json_decode($r['participants_json'], true) : [],
                        'messages' => !empty($r['messages_json']) ? json_decode($r['messages_json'], true) : [],
                        'createdAt' => $r['created_at'],
                    ];
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->purgeExpiredDeletedRooms();
        if (!isset($this->data['focus_rooms'])) return null;
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $cleanId) {
                $copy = $r;
                $isRunning = !empty($copy['isRunning']);
                $timeLeft = (int)($copy['timeLeft'] ?? 1500);
                $lastUpdated = isset($copy['lastUpdated']) ? (float)$copy['lastUpdated'] : 0;
                if ($isRunning && $lastUpdated > 0) {
                    $nowMs = microtime(true) * 1000;
                    $elapsedSec = max(0, (int)floor(($nowMs - $lastUpdated) / 1000));
                    $timeLeft = max(0, $timeLeft - $elapsedSec);
                    if ($timeLeft === 0) {
                        $isRunning = false;
                    }
                }
                $copy['isRunning'] = $isRunning;
                $copy['timeLeft'] = $timeLeft;
                return $copy;
            }
        }
        return null;
    }

    public function listFocusRooms() {
        // Try MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("SELECT id, name, host_name as hostName, is_running as isRunning, mode, created_at as createdAt, participants_json FROM focus_rooms WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 20");
                $rows = $stmt->fetchAll();
                if ($rows && count($rows) > 0) {
                    return array_map(function($r) {
                        $parts = !empty($r['participants_json']) ? json_decode($r['participants_json'], true) : [];
                        return [
                            'id' => $r['id'],
                            'name' => $r['name'],
                            'hostName' => $r['hostName'],
                            'participantCount' => count($parts),
                            'isRunning' => !empty($r['isRunning']),
                            'mode' => $r['mode'],
                            'createdAt' => $r['createdAt'],
                        ];
                    }, $rows);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->purgeExpiredDeletedRooms();
        if (!isset($this->data['focus_rooms'])) return [];
        $activeOnly = array_filter($this->data['focus_rooms'], function($r) {
            return empty($r['isDeleted']) && empty($r['is_deleted']);
        });

        return array_map(function($r) {
            return [
                'id' => $r['id'],
                'name' => $r['name'],
                'hostName' => $r['hostName'],
                'participantCount' => count($r['participants'] ?? []),
                'isRunning' => !empty($r['isRunning']),
                'mode' => $r['mode'] ?? 'focus',
                'createdAt' => $r['createdAt'] ?? '',
            ];
        }, array_slice(array_reverse(array_values($activeOnly)), 0, 20));
    }

    public function joinFocusRoom($roomId, $user) {
        $cleanId = trim(str_replace(["'", '"'], '', $roomId));
        if (empty($cleanId)) return null;

        $room = $this->getFocusRoom($cleanId);

        // Auto-provision if room not found
        if (!$room) {
            $cleanName = (strpos($cleanId, 'room_') === 0) ? 'اتاق تمرکز و مطالعه مشترک' : $cleanId;
            return $this->createFocusRoom($cleanName, $user);
        }

        // Add participant if not in room
        $parts = $room['participants'] ?? [];
        $found = false;
        foreach ($parts as &$p) {
            if ($p['userId'] === $user['id']) {
                $p['lastPing'] = round(microtime(true) * 1000);
                $p['name'] = $user['name'];
                $found = true;
                break;
            }
        }
        if (!$found) {
            $isHost = ($user['id'] === ($room['hostId'] ?? ''));
            $parts[] = [
                'userId' => $user['id'],
                'name' => $user['name'],
                'username' => $user['username'] ?? '',
                'role' => $user['role'] ?? 'user',
                'isHost' => $isHost,
                'status' => 'focusing',
                'joinedAt' => date('H:i'),
                'lastPing' => round(microtime(true) * 1000),
            ];
            $room['messages'][] = [
                'id' => 'msg_' . time() . '_' . rand(10, 99),
                'userId' => 'system',
                'userName' => 'سیستم',
                'text' => $user['name'] . ' به اتاق پیوست 👋',
                'timestamp' => date('H:i'),
            ];
        }
        $room['participants'] = $parts;

        // Save to MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE focus_rooms SET participants_json = ?, messages_json = ? WHERE id = ?");
                $stmt->execute([json_encode($room['participants']), json_encode($room['messages']), $cleanId]);
            } catch (Exception $e) {}
        }

        // Save to JSON
        $this->loadJson();
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $cleanId) {
                $r = $room;
                break;
            }
        }
        $this->saveJson();
        return $room;
    }

    public function syncFocusRoomTimer($roomId, $user, $action, $timeLeft = null, $mode = null) {
        $room = $this->getFocusRoom($roomId);
        if (!$room) return null;

        if ($action === 'start') {
            $room['isRunning'] = true;
            $room['lastUpdated'] = round(microtime(true) * 1000);
            if ($timeLeft !== null) $room['timeLeft'] = (int)$timeLeft;
            if ($mode) $room['mode'] = $mode;
        } elseif ($action === 'pause') {
            $room['isRunning'] = false;
            $room['lastUpdated'] = round(microtime(true) * 1000);
            if ($timeLeft !== null) $room['timeLeft'] = (int)$timeLeft;
        } elseif ($action === 'reset') {
            $room['isRunning'] = false;
            $room['lastUpdated'] = round(microtime(true) * 1000);
            $room['timeLeft'] = ($room['mode'] === 'focus') ? $room['focusDuration'] : $room['breakDuration'];
        } elseif ($action === 'setMode') {
            $room['mode'] = $mode ?: 'focus';
            $room['isRunning'] = false;
            $room['timeLeft'] = ($room['mode'] === 'focus') ? $room['focusDuration'] : $room['breakDuration'];
            $room['lastUpdated'] = round(microtime(true) * 1000);
        }

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE focus_rooms SET is_running = ?, time_left = ?, last_updated = ?, mode = ? WHERE id = ?");
                $stmt->execute([$room['isRunning'] ? 1 : 0, $room['timeLeft'], $room['lastUpdated'], $room['mode'], $roomId]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                $r = $room;
                break;
            }
        }
        $this->saveJson();
        return $room;
    }

    public function addFocusRoomMessage($roomId, $user, $text) {
        $room = $this->getFocusRoom($roomId);
        if (!$room) return null;

        $msg = [
            'id' => 'msg_' . time() . '_' . rand(10, 99),
            'userId' => $user['id'],
            'userName' => $user['name'],
            'text' => trim($text),
            'timestamp' => date('H:i'),
        ];
        $room['messages'][] = $msg;
        if (count($room['messages']) > 100) {
            $room['messages'] = array_slice($room['messages'], -100);
        }

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE focus_rooms SET messages_json = ? WHERE id = ?");
                $stmt->execute([json_encode($room['messages']), $roomId]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                $r = $room;
                break;
            }
        }
        $this->saveJson();
        return $room;
    }

    public function leaveFocusRoom($roomId, $userId) {
        $room = $this->getFocusRoom($roomId);
        if (!$room) return;
        $room['participants'] = array_values(array_filter($room['participants'], function($p) use ($userId) {
            return $p['userId'] !== $userId;
        }));

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE focus_rooms SET participants_json = ? WHERE id = ?");
                $stmt->execute([json_encode($room['participants']), $roomId]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                $r['participants'] = $room['participants'];
                break;
            }
        }
        $this->saveJson();
    }

    public function deleteFocusRoom($roomId, $userId, $isAdmin = false) {
        $room = $this->getFocusRoom($roomId);
        if (!$room) return false;
        if ($room['hostId'] !== $userId && !$isAdmin) return false;

        $now = time();
        $room['isDeleted'] = true;
        $room['deletedAt'] = $now;
        $room['isRunning'] = false;
        $room['messages'][] = [
            'id' => 'msg_' . time(),
            'userId' => 'system',
            'userName' => 'سیستم',
            'text' => 'این اتاق توسط میزبان بسته شد. پیام‌ها طبق سیاست سیستم تا ۱۰ دقیقه نگه‌داری می‌شوند.',
            'timestamp' => date('H:i'),
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE focus_rooms SET is_deleted = 1, deleted_at = ?, is_running = 0, messages_json = ? WHERE id = ?");
                $stmt->execute([$now, json_encode($room['messages']), $roomId]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                $r = $room;
                break;
            }
        }
        $this->saveJson();
        return true;
    }

    // --- Team Projects ---
    public function createTeamProject($name, $description, $color, $icon, $creator, $memberIds = []) {
        $id = 'proj_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        if (!is_array($memberIds)) $memberIds = [];
        if (!in_array($creator['id'], $memberIds)) {
            $memberIds[] = $creator['id'];
        }

        $project = [
            'id' => $id,
            'name' => trim($name),
            'description' => trim($description ?? ''),
            'color' => $color ?: '#6366f1',
            'icon' => $icon ?: 'Folder',
            'creatorId' => $creator['id'],
            'creatorName' => $creator['name'],
            'memberIds' => $memberIds,
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO projects (id, name, description, color, icon, creator_id, creator_name, member_ids_json, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $id, $project['name'], $project['description'], $project['color'], $project['icon'],
                    $project['creatorId'], $project['creatorName'], json_encode($memberIds)
                ]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->data['projects'][] = $project;
        $this->saveJson();
        return $project;
    }

    public function getAllTeamProjects($userId = null, $isAdmin = false) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("SELECT id, name, description, color, icon, creator_id as creatorId, creator_name as creatorName, member_ids_json, created_at as createdAt FROM projects ORDER BY created_at DESC");
                $rows = $stmt->fetchAll();
                if ($rows) {
                    return array_map(function($p) {
                        $p['memberIds'] = !empty($p['member_ids_json']) ? json_decode($p['member_ids_json'], true) : [];
                        return $p;
                    }, $rows);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $projects = $this->data['projects'] ?? [];
        if ($isAdmin || empty($userId)) return $projects;

        return array_values(array_filter($projects, function($p) use ($userId) {
            return ($p['creatorId'] ?? '') === $userId || in_array($userId, $p['memberIds'] ?? []);
        }));
    }

    public function getTeamProject($id) {
        $all = $this->getAllTeamProjects(null, true);
        foreach ($all as $p) {
            if ($p['id'] === $id) return $p;
        }
        return null;
    }

    public function updateTeamProject($id, $name, $description, $color, $icon, $memberIds) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE projects SET name = ?, description = ?, color = ?, icon = ?, member_ids_json = ? WHERE id = ?");
                $stmt->execute([$name, $description, $color, $icon, json_encode($memberIds), $id]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['projects'] as &$p) {
            if ($p['id'] === $id) {
                if ($name !== null) $p['name'] = trim($name);
                if ($description !== null) $p['description'] = trim($description);
                if ($color !== null) $p['color'] = $color;
                if ($icon !== null) $p['icon'] = $icon;
                if (is_array($memberIds)) $p['memberIds'] = $memberIds;
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function deleteTeamProject($id) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("DELETE FROM projects WHERE id = ?");
                $stmt->execute([$id]);
            } catch (Exception $e) {}
        }
        $this->loadJson();
        $this->data['projects'] = array_values(array_filter($this->data['projects'], function($p) use ($id) {
            return $p['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Career Goals ---
    public function getGoals($userId = null) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $sql = "SELECT id, user_id as userId, title, category, period, progress, target_date as targetDate, description, completed, created_at as createdAt FROM career_goals WHERE 1=1";
                $params = [];
                if ($userId) { $sql .= " AND user_id = ?"; $params[] = $userId; }
                $sql .= " ORDER BY created_at DESC";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
                $rows = $stmt->fetchAll();
                if ($rows) {
                    return array_map(function($g) {
                        $g['progress'] = (int)$g['progress'];
                        $g['completed'] = !empty($g['completed']);
                        return $g;
                    }, $rows);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $goals = $this->data['goals'] ?? [];
        if (!empty($userId)) {
            $goals = array_filter($goals, function($g) use ($userId) {
                return ($g['userId'] ?? '') === $userId;
            });
        }
        return array_values($goals);
    }

    public function createGoal($data, $userId) {
        $goal = [
            'id' => 'goal_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4),
            'userId' => $userId,
            'title' => trim($data['title']),
            'category' => $data['category'] ?? 'career',
            'period' => $data['period'] ?? 'monthly',
            'progress' => (int)($data['progress'] ?? 0),
            'targetDate' => $data['targetDate'] ?? null,
            'description' => trim($data['description'] ?? ''),
            'completed' => !empty($data['completed']),
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO career_goals (id, user_id, title, category, period, progress, target_date, description, completed, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $goal['id'], $userId, $goal['title'], $goal['category'], $goal['period'],
                    $goal['progress'], $goal['targetDate'], $goal['description'], $goal['completed'] ? 1 : 0
                ]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->data['goals'][] = $goal;
        $this->saveJson();
        return $goal;
    }

    public function updateGoal($id, $data) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE career_goals SET progress = ?, completed = ? WHERE id = ?");
                $stmt->execute([(int)($data['progress'] ?? 0), !empty($data['completed']) ? 1 : 0, $id]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['goals'] as &$g) {
            if ($g['id'] === $id) {
                $g = array_merge($g, $data);
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function deleteGoal($id) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("DELETE FROM career_goals WHERE id = ?");
                $stmt->execute([$id]);
            } catch (Exception $e) {}
        }
        $this->loadJson();
        $this->data['goals'] = array_values(array_filter($this->data['goals'], function($g) use ($id) {
            return $g['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Daily Notes ---
    public function getDailyNotes($userId) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT date, content FROM daily_notes WHERE user_id = ?");
                $stmt->execute([$userId]);
                $rows = $stmt->fetchAll();
                if ($rows) {
                    $map = [];
                    foreach ($rows as $r) $map[$r['date']] = $r['content'];
                    return $map;
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $res = [];
        foreach ($this->data['dailyNotes'] ?? [] as $n) {
            if (($n['userId'] ?? '') === $userId) {
                $res[$n['date']] = $n['content'];
            }
        }
        return $res;
    }

    public function saveDailyNote($userId, $date, $content) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $id = 'note_' . time() . '_' . rand(10, 99);
                $stmt = $this->pdo->prepare("
                    INSERT INTO daily_notes (id, user_id, date, content, updated_at)
                    VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()
                ");
                $stmt->execute([$id, $userId, $date, $content]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $found = false;
        foreach ($this->data['dailyNotes'] as &$n) {
            if (($n['userId'] ?? '') === $userId && ($n['date'] ?? '') === $date) {
                $n['content'] = $content;
                $n['updatedAt'] = date('Y-m-d H:i:s');
                $found = true;
                break;
            }
        }
        if (!$found) {
            $this->data['dailyNotes'][] = [
                'id' => 'note_' . time() . '_' . rand(10, 99),
                'userId' => $userId,
                'date' => $date,
                'content' => $content,
                'updatedAt' => date('Y-m-d H:i:s'),
            ];
        }
        $this->saveJson();
        return true;
    }

    // --- Personality Results ---
    public function getPersonalityResult($userId) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT primary_type as primaryType, scores_json, recommendations_json, completed_at as completedAt FROM personality_results WHERE user_id = ? LIMIT 1");
                $stmt->execute([$userId]);
                $r = $stmt->fetch();
                if ($r) {
                    return [
                        'primaryType' => $r['primaryType'],
                        'scores' => !empty($r['scores_json']) ? json_decode($r['scores_json'], true) : [],
                        'recommendations' => !empty($r['recommendations_json']) ? json_decode($r['recommendations_json'], true) : [],
                        'completedAt' => $r['completedAt'],
                    ];
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['personalityResults'] ?? [] as $p) {
            if (($p['userId'] ?? '') === $userId) {
                return $p;
            }
        }
        return null;
    }

    public function savePersonalityResult($userId, $result) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $id = 'pers_' . time() . '_' . rand(10, 99);
                $stmt = $this->pdo->prepare("
                    INSERT INTO personality_results (id, user_id, primary_type, scores_json, recommendations_json, completed_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE primary_type = VALUES(primary_type), scores_json = VALUES(scores_json), recommendations_json = VALUES(recommendations_json), completed_at = NOW()
                ");
                $stmt->execute([
                    $id, $userId, $result['primaryType'] ?? 'Architect',
                    json_encode($result['scores'] ?? []), json_encode($result['recommendations'] ?? [])
                ]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $found = false;
        foreach ($this->data['personalityResults'] as &$p) {
            if (($p['userId'] ?? '') === $userId) {
                $p = array_merge($p, $result, ['userId' => $userId, 'completedAt' => date('Y-m-d H:i:s')]);
                $found = true;
                break;
            }
        }
        if (!$found) {
            $this->data['personalityResults'][] = array_merge($result, [
                'id' => 'pers_' . time() . '_' . rand(10, 99),
                'userId' => $userId,
                'completedAt' => date('Y-m-d H:i:s'),
            ]);
        }
        $this->saveJson();
        return true;
    }

    // --- Global Settings ---
    public function getGlobalSettings() {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("SELECT settings_json FROM global_settings ORDER BY id DESC LIMIT 1");
                $r = $stmt->fetch();
                if ($r && !empty($r['settings_json'])) {
                    return json_decode($r['settings_json'], true);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        return $this->data['globalSettings'] ?? [];
    }

    public function updateGlobalSettings($settings) {
        $merged = array_merge($this->data['globalSettings'] ?? [], $settings, [
            'updatedAt' => date('Y-m-d H:i:s'),
        ]);

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO global_settings (id, settings_json, updated_at)
                    VALUES (1, ?, NOW())
                    ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json), updated_at = NOW()
                ");
                $stmt->execute([json_encode($merged, JSON_UNESCAPED_UNICODE)]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->data['globalSettings'] = $merged;
        $this->saveJson();
        return $this->data['globalSettings'];
    }

    // --- Custom Fonts ---
    public function getCustomFonts() {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("SELECT id, name, family, font_url as fontUrl, data_url as dataUrl, description, created_at as createdAt FROM custom_fonts ORDER BY created_at DESC");
                $rows = $stmt->fetchAll();
                if ($rows) {
                    return array_map(function($f) {
                        $f['isCustom'] = true;
                        return $f;
                    }, $rows);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        return $this->data['custom_fonts'] ?? [];
    }

    public function addCustomFont($fontData) {
        $id = 'font_' . time() . '_' . substr(bin2hex(random_bytes(2)), 0, 4);
        $font = [
            'id' => $id,
            'name' => trim($fontData['name'] ?? 'فونت جدید'),
            'family' => trim($fontData['family'] ?? 'CustomFont'),
            'fontUrl' => $fontData['fontUrl'] ?? '',
            'dataUrl' => $fontData['dataUrl'] ?? null,
            'description' => trim($fontData['description'] ?? 'فونت بارگذاری‌شده'),
            'isCustom' => true,
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO custom_fonts (id, name, family, font_url, data_url, description, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$id, $font['name'], $font['family'], $font['fontUrl'], $font['dataUrl'], $font['description']]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $this->data['custom_fonts'][] = $font;
        $this->saveJson();
        return $font;
    }
}
