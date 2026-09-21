<?php
/**
 * TaskRooz - Universal Storage Layer (SQLite PDO with automatic JSON Fallback)
 * Works flawlessly on Windows IIS / Linux Apache / Nginx / cPanel
 * Requires NO special PHP extensions: works with or without pdo_sqlite!
 */

class TaskRoozDB {
    private static $instance = null;
    public $mode = 'json'; // 'sqlite' or 'json'
    private $pdo = null;
    private $jsonFile = null;
    private $data = null;

    private function __construct() {
        $dbDir = __DIR__ . '/../data';
        if (!is_dir($dbDir)) {
            @mkdir($dbDir, 0777, true);
        }

        // Always initialize JSON file path and data so fallback is ALWAYS functional
        $jsonPath = $dbDir . '/taskrooz_data.json';
        if (!is_writable($dbDir) && !file_exists($jsonPath)) {
            $jsonPath = sys_get_temp_dir() . '/taskrooz_data.json';
        }
        $this->jsonFile = $jsonPath;
        $this->loadJson();

        // 1. Attempt SQLite if extension loaded
        if (extension_loaded('pdo_sqlite') && class_exists('PDO')) {
            try {
                $sqlitePath = $dbDir . '/taskrooz.sqlite';
                $isNew = !file_exists($sqlitePath) || filesize($sqlitePath) === 0;
                $this->pdo = new PDO('sqlite:' . $sqlitePath);
                $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

                if ($isNew) {
                    $schemaFile = __DIR__ . '/schema.sql';
                    if (file_exists($schemaFile)) {
                        $this->pdo->exec(file_get_contents($schemaFile));
                    }
                }
                $this->mode = 'sqlite';
            } catch (Exception $e) {
                $this->pdo = null;
                $this->mode = 'json';
            }
        }
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
    private function loadJson() {
        if ($this->jsonFile && file_exists($this->jsonFile)) {
            $content = @file_get_contents($this->jsonFile);
            $parsed = json_decode($content, true);
            if (is_array($parsed) && isset($parsed['users'])) {
                $this->data = $parsed;
                if (!isset($this->data['rooms'])) $this->data['rooms'] = [];
                if (!isset($this->data['projects'])) $this->data['projects'] = [];
                return;
            }
        }

        // Initialize default structure
        $this->data = [
            'users' => [
                [
                    'id' => 'usr_admin_mohusyn',
                    'username' => 'Mohusyn',
                    'password_hash' => password_hash('Smosh1387', PASSWORD_DEFAULT),
                    'name' => 'سید محمدحسین شیخ الاسلامی (Mohusyn)',
                    'role' => 'admin',
                    'created_at' => date('Y-m-d H:i:s'),
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
            'rooms' => [],
            'projects' => []
        ];
        $this->saveJson();
    }

    private function saveJson() {
        if (!$this->jsonFile || !$this->data) return;
        @file_put_contents($this->jsonFile, json_encode($this->data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    }

    // --- User Operations ---
    public function getUserByUsername($username) {
        $username = strtolower(trim($username));
        if ($this->mode === 'sqlite') {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM users WHERE LOWER(username) = ?");
                $stmt->execute([$username]);
                $u = $stmt->fetch();
                if ($u) return $u;
            } catch (Exception $e) {}
        }

        foreach ($this->data['users'] as $u) {
            if (strtolower($u['username']) === $username) {
                return $u;
            }
        }
        return null;
    }

    public function getUserById($id) {
        if ($this->mode === 'sqlite') {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$id]);
                $u = $stmt->fetch();
                if ($u) return $u;
            } catch (Exception $e) {}
        }

        foreach ($this->data['users'] as $u) {
            if ($u['id'] === $id) {
                return $u;
            }
        }
        return null;
    }

    public function createUser($username, $password, $name, $role = 'user', $extra = []) {
        $username = strtolower(trim($username));
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $id = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
        $now = date('Y-m-d H:i:s');
        $phone = $extra['phone'] ?? '';
        $email = $extra['email'] ?? '';
        $province = $extra['province'] ?? '';
        $city = $extra['city'] ?? '';
        $birthDate = $extra['birthDate'] ?? '';
        $jobTitle = $extra['jobTitle'] ?? '';
        $skills = $extra['skills'] ?? [];
        $timeline = $extra['dailyTimeline'] ?? [];

        if ($this->mode === 'sqlite') {
            try {
                $stmt = $this->pdo->prepare("INSERT INTO users (id, username, password_hash, name, role, created_at, phone, email, province, city, birth_date, job_title, skills_json, timeline_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$id, $username, $hash, $name, $role, $now, $phone, $email, $province, $city, $birthDate, $jobTitle, json_encode($skills), json_encode($timeline)]);
            } catch (Exception $e) {}
        }

        $this->data['users'][] = [
            'id' => $id,
            'username' => $username,
            'password_hash' => $hash,
            'name' => $name,
            'role' => $role,
            'phone' => $phone,
            'email' => $email,
            'province' => $province,
            'city' => $city,
            'birthDate' => $birthDate,
            'jobTitle' => $jobTitle,
            'skills' => $skills,
            'dailyTimeline' => $timeline,
            'created_at' => $now,
        ];
        $this->saveJson();

        return [
            'id' => $id,
            'username' => $username,
            'name' => $name,
            'role' => $role,
            'phone' => $phone,
            'email' => $email,
            'province' => $province,
            'city' => $city,
            'birthDate' => $birthDate,
            'jobTitle' => $jobTitle,
            'skills' => $skills,
            'dailyTimeline' => $timeline,
            'createdAt' => $now,
        ];
    }

    public function getAllUsers() {
        if ($this->mode === 'sqlite') {
            try {
                $stmt = $this->pdo->query("
                    SELECT 
                        u.id, u.username, u.name, u.role, u.created_at,
                        COUNT(t.id) as total_tasks,
                        SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed_tasks
                    FROM users u
                    LEFT JOIN tasks t ON u.id = t.user_id
                    GROUP BY u.id
                    ORDER BY u.created_at ASC
                ");
                $users = $stmt->fetchAll();
                if ($users && count($users) > 0) {
                    return array_map(function($u) {
                        $total = (int)$u['total_tasks'];
                        $done = (int)($u['completed_tasks'] ?? 0);
                        return [
                            'id' => $u['id'],
                            'username' => $u['username'],
                            'name' => $u['name'],
                            'role' => $u['role'],
                            'createdAt' => $u['created_at'],
                            'totalTasks' => $total,
                            'completedTasks' => $done,
                            'progressPercent' => $total > 0 ? round(($done / $total) * 100) : 0,
                        ];
                    }, $users);
                }
            } catch (Exception $e) {}
        }

        $res = [];
        foreach ($this->data['users'] as $u) {
            $total = 0;
            $done = 0;
            foreach ($this->data['tasks'] as $t) {
                if ($t['user_id'] === $u['id']) {
                    $total++;
                    if (!empty($t['completed'])) $done++;
                }
            }
            $res[] = [
                'id' => $u['id'],
                'username' => $u['username'],
                'name' => $u['name'],
                'role' => $u['role'],
                'phone' => $u['phone'] ?? '',
                'email' => $u['email'] ?? '',
                'province' => $u['province'] ?? '',
                'city' => $u['city'] ?? '',
                'birthDate' => $u['birthDate'] ?? '',
                'jobTitle' => $u['jobTitle'] ?? '',
                'skills' => $u['skills'] ?? [],
                'dailyTimeline' => $u['dailyTimeline'] ?? [],
                'createdAt' => $u['created_at'] ?? date('Y-m-d H:i:s'),
                'totalTasks' => $total,
                'completedTasks' => $done,
                'progressPercent' => $total > 0 ? round(($done / $total) * 100) : 0,
            ];
        }
        return $res;
    }

    public function updateUser($id, $name, $role, $password = null) {
        $hash = !empty($password) ? password_hash($password, PASSWORD_DEFAULT) : null;
        if ($this->mode === 'sqlite') {
            try {
                if ($hash) {
                    $stmt = $this->pdo->prepare("UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?");
                    $stmt->execute([$name, $role, $hash, $id]);
                } else {
                    $stmt = $this->pdo->prepare("UPDATE users SET name = ?, role = ? WHERE id = ?");
                    $stmt->execute([$name, $role, $id]);
                }
            } catch (Exception $e) {}
        }

        foreach ($this->data['users'] as &$u) {
            if ($u['id'] === $id) {
                $u['name'] = $name;
                $u['role'] = $role;
                if ($hash) {
                    $u['password_hash'] = $hash;
                }
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function deleteUser($id) {
        if ($this->mode === 'sqlite') {
            try {
                $stmt = $this->pdo->prepare("DELETE FROM tasks WHERE user_id = ?");
                $stmt->execute([$id]);
                $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$id]);
            } catch (Exception $e) {}
        }

        $this->data['users'] = array_values(array_filter($this->data['users'], function($u) use ($id) {
            return $u['id'] !== $id;
        }));
        $this->data['tasks'] = array_values(array_filter($this->data['tasks'], function($t) use ($id) {
            return $t['user_id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Task Operations ---
    public function getTasks($userId = null, $date = null, $categoryId = null, $completed = null, $projectId = null) {
        $filtered = [];
        $userMap = [];
        foreach ($this->data['users'] as $u) {
            $userMap[$u['id']] = $u['name'];
        }

        $projectMap = [];
        if (!empty($this->data['projects'])) {
            foreach ($this->data['projects'] as $p) {
                $projectMap[$p['id']] = $p['name'];
            }
        }

        foreach ($this->data['tasks'] as $t) {
            if ($userId && $t['user_id'] !== $userId) continue;
            if ($date && $t['date'] !== $date) continue;
            if ($categoryId && $t['category_id'] !== $categoryId) continue;
            if ($projectId && ($t['project_id'] ?? '') !== $projectId) continue;
            if ($completed !== null && (bool)$t['completed'] !== (bool)$completed) continue;

            $row = $t;
            $row['user_name'] = $userMap[$t['user_id']] ?? '';
            $row['project_name'] = $projectMap[$t['project_id'] ?? ''] ?? '';
            $filtered[] = $this->formatTaskRow($row);
        }

        usort($filtered, function($a, $b) {
            if ($a['isPinned'] !== $b['isPinned']) {
                return $a['isPinned'] ? -1 : 1;
            }
            return strcmp($a['time'] ?: '99:99', $b['time'] ?: '99:99');
        });

        return $filtered;
    }

    public function createTask($data) {
        $id = 'task_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
        $now = date('Y-m-d H:i:s');
        $isPinned = !empty($data['isPinned']) ? 1 : 0;
        $subtasksJson = !empty($data['subtasks']) ? json_encode($data['subtasks'], JSON_UNESCAPED_UNICODE) : '[]';

        $userName = '';
        foreach ($this->data['users'] as $u) {
            if ($u['id'] === $data['userId']) {
                $userName = $u['name'];
                break;
            }
        }

        $projectName = '';
        if (!empty($data['projectId']) && !empty($this->data['projects'])) {
            foreach ($this->data['projects'] as $p) {
                if ($p['id'] === $data['projectId']) {
                    $projectName = $p['name'];
                    break;
                }
            }
        }

        $this->data['tasks'][] = [
            'id' => $id,
            'user_id' => $data['userId'],
            'project_id' => $data['projectId'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'date' => $data['date'],
            'time' => $data['time'] ?? '',
            'duration_minutes' => (int)($data['durationMinutes'] ?? 0),
            'completed' => 0,
            'completed_at' => null,
            'priority' => $data['priority'] ?? 'medium',
            'category_id' => $data['categoryId'] ?? 'cat-work',
            'is_pinned' => $isPinned,
            'focus_minutes_spent' => 0,
            'subtasks_json' => $subtasksJson,
            'created_at' => $now,
        ];
        $this->saveJson();

        return [
            'id' => $id,
            'userId' => $data['userId'],
            'userName' => $userName,
            'projectId' => $data['projectId'] ?? null,
            'projectName' => $projectName,
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'date' => $data['date'],
            'time' => $data['time'] ?? '',
            'durationMinutes' => (int)($data['durationMinutes'] ?? 0),
            'completed' => false,
            'completedAt' => null,
            'priority' => $data['priority'] ?? 'medium',
            'categoryId' => $data['categoryId'] ?? 'cat-work',
            'isPinned' => (bool)$isPinned,
            'focusMinutesSpent' => 0,
            'subtasks' => !empty($data['subtasks']) ? $data['subtasks'] : [],
            'createdAt' => $now,
        ];
    }

    public function updateTask($data) {
        $id = $data['id'];
        $isPinned = !empty($data['isPinned']) ? 1 : 0;
        $subtasksJson = isset($data['subtasks']) ? json_encode($data['subtasks'], JSON_UNESCAPED_UNICODE) : null;
        $completed = isset($data['completed']) ? ($data['completed'] ? 1 : 0) : null;
        $completedAt = $completed ? date('Y-m-d H:i:s') : null;

        foreach ($this->data['tasks'] as &$t) {
            if ($t['id'] === $id) {
                if (isset($data['userId'])) $t['user_id'] = $data['userId'];
                if (array_key_exists('projectId', $data)) $t['project_id'] = $data['projectId'];
                if (isset($data['title'])) $t['title'] = $data['title'];
                if (isset($data['description'])) $t['description'] = $data['description'];
                if (isset($data['date'])) $t['date'] = $data['date'];
                if (isset($data['time'])) $t['time'] = $data['time'];
                if (isset($data['durationMinutes'])) $t['duration_minutes'] = $data['durationMinutes'];
                if (isset($data['priority'])) $t['priority'] = $data['priority'];
                if (isset($data['categoryId'])) $t['category_id'] = $data['categoryId'];
                if (isset($data['isPinned'])) $t['is_pinned'] = $isPinned;
                if ($subtasksJson !== null) $t['subtasks_json'] = $subtasksJson;
                if (array_key_exists('reasonUncompleted', $data)) $t['reason_uncompleted'] = $data['reasonUncompleted'];
                if (array_key_exists('uncompletedCategory', $data)) $t['uncompleted_category'] = $data['uncompletedCategory'];
                if ($completed !== null) {
                    $t['completed'] = $completed;
                    $t['completed_at'] = $completedAt;
                }
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function toggleTask($id) {
        foreach ($this->data['tasks'] as &$t) {
            if ($t['id'] === $id) {
                $new = !empty($t['completed']) ? 0 : 1;
                $t['completed'] = $new;
                $t['completed_at'] = $new ? date('Y-m-d H:i:s') : null;
                $this->saveJson();
                return ['completed' => (bool)$new, 'completedAt' => $t['completed_at']];
            }
        }
        return null;
    }

    public function addFocusMinutes($id, $minutes) {
        $minutes = (int)$minutes;
        foreach ($this->data['tasks'] as &$t) {
            if ($t['id'] === $id) {
                $t['focus_minutes_spent'] = (int)($t['focus_minutes_spent'] ?? 0) + $minutes;
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function deleteTask($id) {
        $this->data['tasks'] = array_values(array_filter($this->data['tasks'], function($t) use ($id) {
            return $t['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    public function getCategories() {
        return array_map(function($c) {
            return [
                'id' => $c['id'],
                'name' => $c['name'],
                'color' => $c['color'],
                'icon' => $c['icon'],
                'isDefault' => !empty($c['is_default']),
            ];
        }, $this->data['categories']);
    }

    public function createCategory($name, $color, $icon) {
        $id = 'cat_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        $this->data['categories'][] = [
            'id' => $id,
            'name' => $name,
            'color' => $color,
            'icon' => $icon,
            'is_default' => 0,
        ];
        $this->saveJson();

        return [
            'id' => $id,
            'name' => $name,
            'color' => $color,
            'icon' => $icon,
            'isDefault' => false,
        ];
    }

    public function deleteCategory($id) {
        $this->data['categories'] = array_values(array_filter($this->data['categories'], function($c) use ($id) {
            return $c['id'] !== $id || !empty($c['is_default']);
        }));
        $this->saveJson();
        return true;
    }

    public function getStats($userId = null, $isAdmin = false) {
        $today = date('Y-m-d');
        $tasks = $this->getTasks($userId);
        
        $total = count($tasks);
        $done = 0;
        $todayTotal = 0;
        $todayDone = 0;
        $focus = 0;

        foreach ($tasks as $t) {
            if ($t['completed']) $done++;
            if ($t['date'] === $today) {
                $todayTotal++;
                if ($t['completed']) $todayDone++;
            }
            $focus += (int)($t['focusMinutesSpent'] ?? 0);
        }

        $totalUsers = 1;
        if ($isAdmin) {
            $users = $this->getAllUsers();
            $totalUsers = count($users);
        }

        return [
            'totalTasks' => $total,
            'totalCompleted' => $done,
            'overallRate' => $total > 0 ? round(($done / $total) * 100) : 0,
            'todayTotal' => $todayTotal,
            'todayCompleted' => $todayDone,
            'todayRate' => $todayTotal > 0 ? round(($todayDone / $todayTotal) * 100) : 0,
            'focusMinutes' => $focus,
            'totalUsers' => $totalUsers,
        ];
    }

    private function formatTaskRow($row) {
        $subtasks = [];
        if (!empty($row['subtasks_json'])) {
            $subtasks = is_array($row['subtasks_json']) ? $row['subtasks_json'] : (json_decode($row['subtasks_json'], true) ?: []);
        }

        return [
            'id' => $row['id'],
            'userId' => $row['user_id'],
            'userName' => $row['user_name'] ?? '',
            'projectId' => $row['project_id'] ?? null,
            'projectName' => $row['project_name'] ?? '',
            'title' => $row['title'],
            'description' => $row['description'] ?? '',
            'date' => $row['date'],
            'time' => $row['time'] ?? '',
            'durationMinutes' => (int)($row['duration_minutes'] ?? 0),
            'completed' => (bool)$row['completed'],
            'completedAt' => $row['completed_at'] ?? null,
            'priority' => $row['priority'] ?? 'medium',
            'categoryId' => $row['category_id'] ?? 'cat-work',
            'isPinned' => (bool)($row['is_pinned'] ?? 0),
            'focusMinutesSpent' => (int)($row['focus_minutes_spent'] ?? 0),
            'reasonUncompleted' => $row['reason_uncompleted'] ?? null,
            'uncompletedCategory' => $row['uncompleted_category'] ?? null,
            'subtasks' => $subtasks,
            'createdAt' => $row['created_at'] ?? date('Y-m-d H:i:s'),
        ];
    }

    // --- Focus Rooms (Pomodoro Group Focus with 10-min message retention upon deletion) ---
    private function purgeExpiredDeletedRooms() {
        if (!isset($this->data['rooms'])) return;
        $now = time();
        $initialCount = count($this->data['rooms']);
        // Retain deleted rooms and their messages for 10 minutes (600 seconds)
        $this->data['rooms'] = array_values(array_filter($this->data['rooms'], function($r) use ($now) {
            if (!empty($r['is_deleted'])) {
                $deletedAt = (int)($r['deleted_at'] ?? 0);
                if (($now - $deletedAt) > 600) {
                    return false; // Permanently purge after 10 minutes
                }
            }
            return true;
        }));

        if (count($this->data['rooms']) !== $initialCount) {
            $this->saveJson();
        }
    }

    public function createFocusRoom($name, $host, $focusDuration = 1500, $breakDuration = 300) {
        $this->purgeExpiredDeletedRooms();
        $roomId = 'room_' . substr(bin2hex(random_bytes(3)), 0, 6);
        $room = [
            'id' => $roomId,
            'name' => trim($name) ?: 'اتاق تمرکز گروهی',
            'hostId' => $host['id'],
            'hostName' => $host['name'],
            'focusDuration' => (int)$focusDuration,
            'breakDuration' => (int)$breakDuration,
            'mode' => 'focus',
            'isRunning' => false,
            'timeLeft' => (int)$focusDuration,
            'lastUpdated' => round(microtime(true) * 1000),
            'is_deleted' => 0,
            'deleted_at' => 0,
            'participants' => [
                [
                    'userId' => $host['id'],
                    'name' => $host['name'],
                    'username' => $host['username'],
                    'role' => $host['role'],
                    'status' => 'focusing',
                    'joinedAt' => date('Y-m-d H:i:s'),
                    'lastPing' => time(),
                ]
            ],
            'messages' => [
                [
                    'id' => 'msg_' . time(),
                    'userId' => 'system',
                    'userName' => 'سیستم',
                    'text' => 'اتاق تمرکز گروهی توسط ' . $host['name'] . ' ایجاد شد. به تمرکز خوش آمدید! 🎯',
                    'timestamp' => date('H:i'),
                ]
            ],
            'createdAt' => date('Y-m-d H:i:s'),
        ];

        if (!isset($this->data['rooms'])) {
            $this->data['rooms'] = [];
        }
        $this->data['rooms'][] = $room;
        $this->saveJson();
        return $room;
    }

    public function getFocusRoom($roomId) {
        $this->purgeExpiredDeletedRooms();
        if (!isset($this->data['rooms'])) return null;
        foreach ($this->data['rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                // If room running, compute real-time elapsed
                if (!empty($r['isRunning']) && !empty($r['lastUpdated']) && empty($r['is_deleted'])) {
                    $nowMs = round(microtime(true) * 1000);
                    $elapsedSeconds = floor(($nowMs - $r['lastUpdated']) / 1000);
                    if ($elapsedSeconds > 0) {
                        $newTimeLeft = max(0, $r['timeLeft'] - $elapsedSeconds);
                        $r['timeLeft'] = $newTimeLeft;
                        $r['lastUpdated'] = $nowMs;
                        if ($newTimeLeft === 0) {
                            $r['isRunning'] = false;
                            if ($r['mode'] === 'focus') {
                                $r['mode'] = 'shortBreak';
                                $r['timeLeft'] = $r['breakDuration'];
                            } else {
                                $r['mode'] = 'focus';
                                $r['timeLeft'] = $r['focusDuration'];
                            }
                        }
                        $this->saveJson();
                    }
                }
                return $r;
            }
        }
        return null;
    }

    public function listFocusRooms() {
        $this->purgeExpiredDeletedRooms();
        if (!isset($this->data['rooms'])) return [];
        $activeOnly = array_filter($this->data['rooms'], function($r) {
            return empty($r['is_deleted']);
        });

        return array_map(function($r) {
            return [
                'id' => $r['id'],
                'name' => $r['name'],
                'hostName' => $r['hostName'],
                'participantCount' => count($r['participants'] ?? []),
                'isRunning' => !empty($r['isRunning']),
                'mode' => $r['mode'],
                'createdAt' => $r['createdAt'],
            ];
        }, array_slice(array_reverse(array_values($activeOnly)), 0, 15));
    }

    public function joinFocusRoom($roomId, $user) {
        $this->purgeExpiredDeletedRooms();
        if (!isset($this->data['rooms'])) return null;
        foreach ($this->data['rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                if (!empty($r['is_deleted'])) {
                    return $r; // allow viewing closed room during retention period
                }

                $found = false;
                foreach ($r['participants'] as &$p) {
                    if ($p['userId'] === $user['id']) {
                        $p['lastPing'] = time();
                        $p['status'] = $r['isRunning'] ? ($r['mode'] === 'focus' ? 'focusing' : 'break') : 'idle';
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $r['participants'][] = [
                        'userId' => $user['id'],
                        'name' => $user['name'],
                        'username' => $user['username'],
                        'role' => $user['role'],
                        'status' => 'focusing',
                        'joinedAt' => date('Y-m-d H:i:s'),
                        'lastPing' => time(),
                    ];
                    $r['messages'][] = [
                        'id' => 'msg_' . time() . '_' . rand(10, 99),
                        'userId' => 'system',
                        'userName' => 'سیستم',
                        'text' => $user['name'] . ' به اتاق تمرکز پیوست 👋',
                        'timestamp' => date('H:i'),
                    ];
                }
                $this->saveJson();
                return $r;
            }
        }
        return null;
    }

    public function syncFocusRoomTimer($roomId, $user, $action, $timeLeft = null, $mode = null) {
        if (!isset($this->data['rooms'])) return null;
        foreach ($this->data['rooms'] as &$r) {
            if ($r['id'] === $roomId && empty($r['is_deleted'])) {
                $nowMs = round(microtime(true) * 1000);
                if ($action === 'start') {
                    $r['isRunning'] = true;
                    $r['lastUpdated'] = $nowMs;
                    if ($timeLeft !== null) $r['timeLeft'] = (int)$timeLeft;
                    if ($mode) $r['mode'] = $mode;
                } elseif ($action === 'pause') {
                    $r['isRunning'] = false;
                    $r['lastUpdated'] = $nowMs;
                    if ($timeLeft !== null) $r['timeLeft'] = (int)$timeLeft;
                } elseif ($action === 'reset') {
                    $r['isRunning'] = false;
                    $r['lastUpdated'] = $nowMs;
                    $r['timeLeft'] = $r['mode'] === 'focus' ? $r['focusDuration'] : $r['breakDuration'];
                } elseif ($action === 'setMode') {
                    $r['mode'] = $mode ?: 'focus';
                    $r['isRunning'] = false;
                    $r['timeLeft'] = $r['mode'] === 'focus' ? $r['focusDuration'] : $r['breakDuration'];
                    $r['lastUpdated'] = $nowMs;
                }

                foreach ($r['participants'] as &$p) {
                    if ($p['userId'] === $user['id']) {
                        $p['lastPing'] = time();
                        $p['status'] = $r['isRunning'] ? ($r['mode'] === 'focus' ? 'focusing' : 'break') : 'idle';
                    }
                }

                $this->saveJson();
                return $r;
            }
        }
        return null;
    }

    public function addFocusRoomMessage($roomId, $user, $text) {
        if (!isset($this->data['rooms'])) return null;
        foreach ($this->data['rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                $r['messages'][] = [
                    'id' => 'msg_' . time() . '_' . rand(10, 99),
                    'userId' => $user['id'],
                    'userName' => $user['name'],
                    'text' => trim($text),
                    'timestamp' => date('H:i'),
                ];
                if (count($r['messages']) > 50) {
                    $r['messages'] = array_slice($r['messages'], -50);
                }
                $this->saveJson();
                return $r;
            }
        }
        return null;
    }

    public function leaveFocusRoom($roomId, $userId) {
        if (!isset($this->data['rooms'])) return true;
        foreach ($this->data['rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                $r['participants'] = array_values(array_filter($r['participants'], function($p) use ($userId) {
                    return $p['userId'] !== $userId;
                }));
                $this->saveJson();
                return true;
            }
        }
        return true;
    }

    public function deleteFocusRoom($roomId, $userId, $isAdmin = false) {
        if (!isset($this->data['rooms'])) return false;
        foreach ($this->data['rooms'] as &$r) {
            if ($r['id'] === $roomId) {
                if ($r['hostId'] !== $userId && !$isAdmin) {
                    return false;
                }

                // Mark soft deleted with timestamp. Messages kept for 10 minutes.
                $r['is_deleted'] = 1;
                $r['deleted_at'] = time();
                $r['isRunning'] = false;
                $r['messages'][] = [
                    'id' => 'msg_' . time(),
                    'userId' => 'system',
                    'userName' => 'سیستم',
                    'text' => 'این اتاق توسط میزبان بسته شد. پیام‌ها تا ۱۰ دقیقه نگه‌داری شده و سپس حذف خواهند شد. 🔒',
                    'timestamp' => date('H:i'),
                ];
                $this->saveJson();
                return true;
            }
        }
        return false;
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

        if (!isset($this->data['projects'])) {
            $this->data['projects'] = [];
        }
        $this->data['projects'][] = $project;
        $this->saveJson();
        return $project;
    }

    public function getAllTeamProjects($userId = null, $isAdmin = false) {
        if (!isset($this->data['projects'])) return [];

        $projects = [];
        foreach ($this->data['projects'] as $p) {
            // Admin sees all, regular users see projects they created or belong to
            if (!$isAdmin && $userId) {
                $isMember = in_array($userId, $p['memberIds'] ?? []) || ($p['creatorId'] === $userId);
                if (!$isMember) continue;
            }

            // Calculate task progress for this project
            $total = 0;
            $done = 0;
            foreach ($this->data['tasks'] as $t) {
                if (($t['project_id'] ?? '') === $p['id']) {
                    $total++;
                    if (!empty($t['completed'])) $done++;
                }
            }

            $item = $p;
            $item['totalTasks'] = $total;
            $item['completedTasks'] = $done;
            $item['progressPercent'] = $total > 0 ? round(($done / $total) * 100) : 0;
            $projects[] = $item;
        }

        return array_reverse($projects);
    }

    public function getTeamProject($id) {
        if (!isset($this->data['projects'])) return null;
        foreach ($this->data['projects'] as $p) {
            if ($p['id'] === $id) return $p;
        }
        return null;
    }

    public function updateTeamProject($id, $name, $description, $color, $icon, $memberIds) {
        if (!isset($this->data['projects'])) return false;
        foreach ($this->data['projects'] as &$p) {
            if ($p['id'] === $id) {
                if (isset($name)) $p['name'] = trim($name);
                if (isset($description)) $p['description'] = trim($description);
                if (isset($color)) $p['color'] = $color;
                if (isset($icon)) $p['icon'] = $icon;
                if (is_array($memberIds)) $p['memberIds'] = $memberIds;
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function deleteTeamProject($id) {
        if (!isset($this->data['projects'])) return false;
        $this->data['projects'] = array_values(array_filter($this->data['projects'], function($p) use ($id) {
            return $p['id'] !== $id;
        }));
        // Unlink tasks
        foreach ($this->data['tasks'] as &$t) {
            if (($t['project_id'] ?? '') === $id) {
                $t['project_id'] = null;
            }
        }
        $this->saveJson();
        return true;
    }
}
