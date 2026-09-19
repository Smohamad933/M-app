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
                return;
            } catch (Exception $e) {
                $this->pdo = null;
            }
        }

        // 2. Fallback to robust JSON file storage
        $this->mode = 'json';
        $jsonPath = $dbDir . '/taskrooz_data.json';
        
        // If data dir not writable, use system temp
        if (!is_writable($dbDir) && !file_exists($jsonPath)) {
            $jsonPath = sys_get_temp_dir() . '/taskrooz_data.json';
        }
        
        $this->jsonFile = $jsonPath;
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
    private function loadJson() {
        if ($this->jsonFile && file_exists($this->jsonFile)) {
            $content = @file_get_contents($this->jsonFile);
            $parsed = json_decode($content, true);
            if (is_array($parsed) && isset($parsed['users'])) {
                $this->data = $parsed;
                return;
            }
        }

        // Initialize default JSON structure
        $this->data = [
            'users' => [
                [
                    'id' => 'usr_admin_1',
                    'username' => 'admin',
                    'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
                    'name' => 'مدیر سیستم',
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
            'tasks' => []
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
            $stmt = $this->pdo->prepare("SELECT * FROM users WHERE LOWER(username) = ?");
            $stmt->execute([$username]);
            return $stmt->fetch() ?: null;
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
            $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->fetch() ?: null;
        }

        foreach ($this->data['users'] as $u) {
            if ($u['id'] === $id) {
                return $u;
            }
        }
        return null;
    }

    public function createUser($username, $password, $name, $role = 'user') {
        $username = strtolower(trim($username));
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $id = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
        $now = date('Y-m-d H:i:s');

        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->prepare("INSERT INTO users (id, username, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $username, $hash, $name, $role, $now]);
        } else {
            $this->data['users'][] = [
                'id' => $id,
                'username' => $username,
                'password_hash' => $hash,
                'name' => $name,
                'role' => $role,
                'created_at' => $now,
            ];
            $this->saveJson();
        }

        return [
            'id' => $id,
            'username' => $username,
            'name' => $name,
            'role' => $role,
            'createdAt' => $now,
        ];
    }

    public function getAllUsers() {
        if ($this->mode === 'sqlite') {
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
            if ($hash) {
                $stmt = $this->pdo->prepare("UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?");
                $stmt->execute([$name, $role, $hash, $id]);
            } else {
                $stmt = $this->pdo->prepare("UPDATE users SET name = ?, role = ? WHERE id = ?");
                $stmt->execute([$name, $role, $id]);
            }
            return true;
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
            $stmt = $this->pdo->prepare("DELETE FROM tasks WHERE user_id = ?");
            $stmt->execute([$id]);
            $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            return true;
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
    public function getTasks($userId = null, $date = null, $categoryId = null, $completed = null) {
        if ($this->mode === 'sqlite') {
            $where = [];
            $params = [];
            if ($userId) {
                $where[] = "t.user_id = ?";
                $params[] = $userId;
            }
            if ($date) {
                $where[] = "t.date = ?";
                $params[] = $date;
            }
            if ($categoryId) {
                $where[] = "t.category_id = ?";
                $params[] = $categoryId;
            }
            if ($completed !== null) {
                $where[] = "t.completed = ?";
                $params[] = $completed ? 1 : 0;
            }
            $sql = "SELECT t.*, u.name as user_name FROM tasks t LEFT JOIN users u ON t.user_id = u.id";
            if (count($where) > 0) {
                $sql .= " WHERE " . implode(" AND ", $where);
            }
            $sql .= " ORDER BY t.is_pinned DESC, t.time ASC, t.created_at DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            return array_map([$this, 'formatTaskRow'], $rows);
        }

        $filtered = [];
        $userMap = [];
        foreach ($this->data['users'] as $u) {
            $userMap[$u['id']] = $u['name'];
        }

        foreach ($this->data['tasks'] as $t) {
            if ($userId && $t['user_id'] !== $userId) continue;
            if ($date && $t['date'] !== $date) continue;
            if ($categoryId && $t['category_id'] !== $categoryId) continue;
            if ($completed !== null && (bool)$t['completed'] !== (bool)$completed) continue;

            $row = $t;
            $row['user_name'] = $userMap[$t['user_id']] ?? '';
            $filtered[] = $this->formatTaskRow($row);
        }

        // Sort by isPinned DESC, time ASC
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

        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->prepare("
                INSERT INTO tasks (
                    id, user_id, title, description, date, time, duration_minutes,
                    completed, priority, category_id, is_pinned, focus_minutes_spent,
                    subtasks_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, ?)
            ");
            $stmt->execute([
                $id, $data['userId'], $data['title'], $data['description'] ?? null,
                $data['date'], $data['time'] ?? null, (int)($data['durationMinutes'] ?? 0),
                $data['priority'] ?? 'medium', $data['categoryId'] ?? 'cat-work',
                $isPinned, $subtasksJson, $now
            ]);

            $uStmt = $this->pdo->prepare("SELECT name FROM users WHERE id = ?");
            $uStmt->execute([$data['userId']]);
            $userName = $uStmt->fetchColumn() ?: '';
        } else {
            $userName = '';
            foreach ($this->data['users'] as $u) {
                if ($u['id'] === $data['userId']) {
                    $userName = $u['name'];
                    break;
                }
            }

            $this->data['tasks'][] = [
                'id' => $id,
                'user_id' => $data['userId'],
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
        }

        return [
            'id' => $id,
            'userId' => $data['userId'],
            'userName' => $userName,
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

        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->prepare("
                UPDATE tasks SET
                    user_id = COALESCE(?, user_id),
                    title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    date = COALESCE(?, date),
                    time = COALESCE(?, time),
                    duration_minutes = COALESCE(?, duration_minutes),
                    priority = COALESCE(?, priority),
                    category_id = COALESCE(?, category_id),
                    is_pinned = COALESCE(?, is_pinned),
                    completed = COALESCE(?, completed),
                    completed_at = COALESCE(?, completed_at)
                WHERE id = ?
            ");
            $stmt->execute([
                $data['userId'] ?? null, $data['title'] ?? null, $data['description'] ?? null,
                $data['date'] ?? null, $data['time'] ?? null, $data['durationMinutes'] ?? null,
                $data['priority'] ?? null, $data['categoryId'] ?? null,
                isset($data['isPinned']) ? $isPinned : null,
                $completed, $completedAt, $id
            ]);
            return true;
        }

        foreach ($this->data['tasks'] as &$t) {
            if ($t['id'] === $id) {
                if (isset($data['userId'])) $t['user_id'] = $data['userId'];
                if (isset($data['title'])) $t['title'] = $data['title'];
                if (isset($data['description'])) $t['description'] = $data['description'];
                if (isset($data['date'])) $t['date'] = $data['date'];
                if (isset($data['time'])) $t['time'] = $data['time'];
                if (isset($data['durationMinutes'])) $t['duration_minutes'] = $data['durationMinutes'];
                if (isset($data['priority'])) $t['priority'] = $data['priority'];
                if (isset($data['categoryId'])) $t['category_id'] = $data['categoryId'];
                if (isset($data['isPinned'])) $t['is_pinned'] = $isPinned;
                if ($subtasksJson !== null) $t['subtasks_json'] = $subtasksJson;
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
        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->prepare("SELECT completed FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            $curr = (int)$stmt->fetchColumn();
            $new = $curr ? 0 : 1;
            $completedAt = $new ? date('Y-m-d H:i:s') : null;
            $up = $this->pdo->prepare("UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?");
            $up->execute([$new, $completedAt, $id]);
            return ['completed' => (bool)$new, 'completedAt' => $completedAt];
        }

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
        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->prepare("UPDATE tasks SET focus_minutes_spent = focus_minutes_spent + ? WHERE id = ?");
            $stmt->execute([$minutes, $id]);
            return true;
        }

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
        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            return true;
        }

        $this->data['tasks'] = array_values(array_filter($this->data['tasks'], function($t) use ($id) {
            return $t['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    public function getCategories() {
        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->query("SELECT * FROM categories ORDER BY is_default DESC, name ASC");
            $rows = $stmt->fetchAll();
            return array_map(function($c) {
                return [
                    'id' => $c['id'],
                    'name' => $c['name'],
                    'color' => $c['color'],
                    'icon' => $c['icon'],
                    'isDefault' => (bool)$c['is_default'],
                ];
            }, $rows);
        }

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
        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->prepare("INSERT INTO categories (id, name, color, icon, is_default) VALUES (?, ?, ?, ?, 0)");
            $stmt->execute([$id, $name, $color, $icon]);
        } else {
            $this->data['categories'][] = [
                'id' => $id,
                'name' => $name,
                'color' => $color,
                'icon' => $icon,
                'is_default' => 0,
            ];
            $this->saveJson();
        }

        return [
            'id' => $id,
            'name' => $name,
            'color' => $color,
            'icon' => $icon,
            'isDefault' => false,
        ];
    }

    public function deleteCategory($id) {
        if ($this->mode === 'sqlite') {
            $stmt = $this->pdo->prepare("DELETE FROM categories WHERE id = ? AND is_default = 0");
            $stmt->execute([$id]);
            return true;
        }

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
            'subtasks' => $subtasks,
            'createdAt' => $row['created_at'] ?? date('Y-m-d H:i:s'),
        ];
    }
}
