<?php
/**
 * TaskRooz - Universal Unified Storage Layer
 * Unified Single Source of Truth: data/db.json
 * Compatible with Windows IIS / Apache / Nginx / Linux on PHP 7.4+ to 8.4+
 * Author: Mohusyn (mohusyn.ir)
 */

class TaskRoozDB {
    private static $instance = null;
    public $mode = 'json';
    private $pdo = null;
    private $jsonFile = null;
    public $data = [];

    private function __construct() {
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

    // --- User Operations ---
    public function getUserByUsername($username) {
        $this->loadJson();
        $target = strtolower(trim($username));
        foreach ($this->data['users'] as $u) {
            if (isset($u['username']) && strtolower($u['username']) === $target) {
                return $u;
            }
        }
        return null;
    }

    public function getUserById($id) {
        $this->loadJson();
        if (empty($id)) return null;
        if (strtolower($id) === 'mohusyn' || $id === 'usr_admin_mohusyn' || $id === 'usr_mohusyn_admin') {
            return $this->getUserByUsername('Mohusyn');
        }
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
        $this->loadJson();
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

        // Check if existing to update
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
        $this->loadJson();
        foreach ($this->data['users'] as &$u) {
            if ($u['id'] === $id) {
                $u['name'] = trim($name);
                // Mohusyn must remain admin
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

    public function deleteUser($id) {
        $this->loadJson();
        $this->data['users'] = array_values(array_filter($this->data['users'], function($u) use ($id) {
            if (strtolower($u['username'] ?? '') === 'mohusyn' || $u['id'] === 'usr_admin_mohusyn') {
                return true; // Never delete admin
            }
            return $u['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Task Operations ---
    public function getTasks($userId = null, $date = null, $categoryId = null, $completed = null, $projectId = null) {
        $this->loadJson();
        $res = $this->data['tasks'] ?? [];

        if (!empty($userId)) {
            $res = array_filter($res, function($t) use ($userId) {
                $u = $t['userId'] ?? $t['user_id'] ?? '';
                return $u === $userId;
            });
        }
        if (!empty($date)) {
            $res = array_filter($res, function($t) use ($date) {
                return ($t['date'] ?? '') === $date;
            });
        }
        if (!empty($categoryId)) {
            $res = array_filter($res, function($t) use ($categoryId) {
                $c = $t['categoryId'] ?? $t['category_id'] ?? '';
                return $c === $categoryId;
            });
        }
        if ($completed !== null) {
            $res = array_filter($res, function($t) use ($completed) {
                return !empty($t['completed']) === !empty($completed);
            });
        }
        if (!empty($projectId)) {
            $res = array_filter($res, function($t) use ($projectId) {
                $p = $t['projectId'] ?? $t['project_id'] ?? '';
                return $p === $projectId;
            });
        }

        return array_values($res);
    }

    public function createTask($data) {
        $this->loadJson();
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

        $this->data['tasks'][] = $task;
        $this->saveJson();
        return $task;
    }

    public function updateTask($data) {
        $this->loadJson();
        $id = $data['id'] ?? '';
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
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function deleteTask($id) {
        $this->loadJson();
        $this->data['tasks'] = array_values(array_filter($this->data['tasks'], function($t) use ($id) {
            return $t['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Category Operations ---
    public function getCategories() {
        $this->loadJson();
        return $this->data['categories'] ?? [];
    }

    public function createCategory($name, $color, $icon) {
        $this->loadJson();
        $cat = [
            'id' => 'cat_' . time() . '_' . rand(10, 99),
            'name' => trim($name),
            'color' => $color ?: '#6366f1',
            'icon' => $icon ?: 'Folder',
            'isDefault' => false,
        ];
        $this->data['categories'][] = $cat;
        $this->saveJson();
        return $cat;
    }

    // --- Stats Operations ---
    public function getStats($userId = null, $isAdmin = false) {
        $this->loadJson();
        $tasks = $this->data['tasks'] ?? [];
        if (!$isAdmin && $userId) {
            $tasks = array_filter($tasks, function($t) use ($userId) {
                $u = $t['userId'] ?? $t['user_id'] ?? '';
                return $u === $userId;
            });
        }

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

        return [
            'totalTasks' => $totalTasks,
            'totalCompleted' => $totalCompleted,
            'overallRate' => $totalTasks > 0 ? round(($totalCompleted / $totalTasks) * 100) : 0,
            'todayTotal' => $todayTasks,
            'todayCompleted' => $todayCompleted,
            'todayRate' => $todayTasks > 0 ? round(($todayCompleted / $todayTasks) * 100) : 0,
            'focusMinutes' => $focusMinutes,
            'totalUsers' => count($this->data['users'] ?? []),
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

        $this->data['focus_rooms'][] = $room;
        $this->saveJson();
        return $room;
    }

    public function getFocusRoom($roomId) {
        $this->loadJson();
        $this->purgeExpiredDeletedRooms();
        $cleanId = trim(str_replace(["'", '"'], '', $roomId));
        if (empty($cleanId)) return null;

        if (!isset($this->data['focus_rooms'])) return null;
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $cleanId) {
                // If room running, compute real-time elapsed
                if (!empty($r['isRunning']) && !empty($r['lastUpdated']) && empty($r['isDeleted']) && empty($r['is_deleted'])) {
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
        $this->loadJson();
        $this->purgeExpiredDeletedRooms();
        $cleanId = trim(str_replace(["'", '"'], '', $roomId));
        if (empty($cleanId)) return null;

        if (!isset($this->data['focus_rooms'])) {
            $this->data['focus_rooms'] = [];
        }

        $room = null;
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $cleanId) {
                $room = &$r;
                break;
            }
        }

        // Auto-provision if room not found so direct join never fails
        if (!$room) {
            $cleanName = (strpos($cleanId, 'room_') === 0) ? 'اتاق تمرکز و مطالعه مشترک' : $cleanId;
            $newRoom = [
                'id' => $cleanId,
                'name' => $cleanName,
                'hostId' => $user['id'],
                'hostName' => $user['name'],
                'focusDuration' => 1500,
                'breakDuration' => 300,
                'timeLeft' => 1500,
                'isRunning' => false,
                'mode' => 'focus',
                'lastUpdated' => round(microtime(true) * 1000),
                'isDeleted' => false,
                'is_deleted' => 0,
                'deletedAt' => 0,
                'deleted_at' => 0,
                'participants' => [
                    [
                        'userId' => $user['id'],
                        'name' => $user['name'],
                        'username' => $user['username'] ?? '',
                        'role' => $user['role'] ?? 'user',
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
                        'text' => 'اتاق «' . $cleanName . '» ایجاد شد. به تمرکز تیمی خوش آمدید! 🎯',
                        'timestamp' => date('H:i'),
                    ]
                ],
                'createdAt' => date('Y-m-d H:i:s'),
            ];
            $this->data['focus_rooms'][] = $newRoom;
            $this->saveJson();
            return $newRoom;
        }

        // Room exists! Add participant if not already joined
        if (!isset($room['participants']) || !is_array($room['participants'])) {
            $room['participants'] = [];
        }

        $found = false;
        foreach ($room['participants'] as &$p) {
            if ($p['userId'] === $user['id']) {
                $p['lastPing'] = round(microtime(true) * 1000);
                $p['name'] = $user['name'];
                $found = true;
                break;
            }
        }

        if (!$found) {
            $isHost = ($user['id'] === ($room['hostId'] ?? ''));
            $room['participants'][] = [
                'userId' => $user['id'],
                'name' => $user['name'],
                'username' => $user['username'] ?? '',
                'role' => $user['role'] ?? 'user',
                'isHost' => $isHost,
                'status' => 'focusing',
                'joinedAt' => date('H:i'),
                'lastPing' => round(microtime(true) * 1000),
            ];
            if (!isset($room['messages'])) $room['messages'] = [];
            $room['messages'][] = [
                'id' => 'msg_' . time() . '_' . rand(10, 99),
                'userId' => 'system',
                'userName' => 'سیستم',
                'text' => $user['name'] . ' به اتاق پیوست 👋',
                'timestamp' => date('H:i'),
            ];
        }

        $this->saveJson();
        return $room;
    }

    public function syncFocusRoomTimer($roomId, $user, $action, $timeLeft = null, $mode = null) {
        $this->loadJson();
        $cleanId = trim(str_replace(["'", '"'], '', $roomId));
        if (!isset($this->data['focus_rooms'])) return null;
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $cleanId) {
                if ($action === 'start') {
                    $r['isRunning'] = true;
                    $r['lastUpdated'] = round(microtime(true) * 1000);
                    if ($timeLeft !== null) $r['timeLeft'] = (int)$timeLeft;
                    if ($mode) $r['mode'] = $mode;
                } elseif ($action === 'pause') {
                    $r['isRunning'] = false;
                    $r['lastUpdated'] = round(microtime(true) * 1000);
                    if ($timeLeft !== null) $r['timeLeft'] = (int)$timeLeft;
                } elseif ($action === 'reset') {
                    $r['isRunning'] = false;
                    $r['lastUpdated'] = round(microtime(true) * 1000);
                    $r['timeLeft'] = ($r['mode'] === 'focus') ? $r['focusDuration'] : $r['breakDuration'];
                } elseif ($action === 'setMode') {
                    $r['mode'] = $mode ?: 'focus';
                    $r['isRunning'] = false;
                    $r['timeLeft'] = ($r['mode'] === 'focus') ? $r['focusDuration'] : $r['breakDuration'];
                    $r['lastUpdated'] = round(microtime(true) * 1000);
                }
                $this->saveJson();
                return $r;
            }
        }
        return null;
    }

    public function addFocusRoomMessage($roomId, $user, $text) {
        $this->loadJson();
        $cleanId = trim(str_replace(["'", '"'], '', $roomId));
        if (!isset($this->data['focus_rooms'])) return null;
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $cleanId) {
                if (!isset($r['messages'])) $r['messages'] = [];
                $msg = [
                    'id' => 'msg_' . time() . '_' . rand(10, 99),
                    'userId' => $user['id'],
                    'userName' => $user['name'],
                    'text' => trim($text),
                    'timestamp' => date('H:i'),
                ];
                $r['messages'][] = $msg;
                if (count($r['messages']) > 100) {
                    $r['messages'] = array_slice($r['messages'], -100);
                }
                $this->saveJson();
                return $r;
            }
        }
        return null;
    }

    public function leaveFocusRoom($roomId, $userId) {
        $this->loadJson();
        $cleanId = trim(str_replace(["'", '"'], '', $roomId));
        if (!isset($this->data['focus_rooms'])) return;
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $cleanId && isset($r['participants'])) {
                $r['participants'] = array_values(array_filter($r['participants'], function($p) use ($userId) {
                    return $p['userId'] !== $userId;
                }));
                $this->saveJson();
                return;
            }
        }
    }

    public function deleteFocusRoom($roomId, $userId, $isAdmin = false) {
        $this->loadJson();
        $cleanId = trim(str_replace(["'", '"'], '', $roomId));
        if (!isset($this->data['focus_rooms'])) return false;
        foreach ($this->data['focus_rooms'] as &$r) {
            if ($r['id'] === $cleanId) {
                if ($r['hostId'] !== $userId && !$isAdmin) {
                    return false;
                }
                $r['isDeleted'] = true;
                $r['is_deleted'] = 1;
                $r['deletedAt'] = time();
                $r['deleted_at'] = time();
                $r['isRunning'] = false;
                $r['messages'][] = [
                    'id' => 'msg_' . time(),
                    'userId' => 'system',
                    'userName' => 'سیستم',
                    'text' => 'این اتاق توسط میزبان بسته شد. پیام‌ها طبق سیاست سیستم تا ۱۰ دقیقه نگه‌داری می‌شوند.',
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
        $this->loadJson();
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

        $this->data['projects'][] = $project;
        $this->saveJson();
        return $project;
    }

    public function getAllTeamProjects($userId = null, $isAdmin = false) {
        $this->loadJson();
        $projects = $this->data['projects'] ?? [];
        if ($isAdmin || empty($userId)) return $projects;

        return array_values(array_filter($projects, function($p) use ($userId) {
            return ($p['creatorId'] ?? '') === $userId || in_array($userId, $p['memberIds'] ?? []);
        }));
    }

    public function getTeamProject($id) {
        $this->loadJson();
        foreach ($this->data['projects'] as $p) {
            if ($p['id'] === $id) return $p;
        }
        return null;
    }

    public function updateTeamProject($id, $name, $description, $color, $icon, $memberIds) {
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
        $this->loadJson();
        $this->data['projects'] = array_values(array_filter($this->data['projects'], function($p) use ($id) {
            return $p['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Career Goals ---
    public function getGoals($userId = null) {
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
        $this->loadJson();
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
        $this->data['goals'][] = $goal;
        $this->saveJson();
        return $goal;
    }

    public function updateGoal($id, $data) {
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
        $this->loadJson();
        $this->data['goals'] = array_values(array_filter($this->data['goals'], function($g) use ($id) {
            return $g['id'] !== $id;
        }));
        $this->saveJson();
        return true;
    }

    // --- Daily Notes ---
    public function getDailyNotes($userId) {
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
        $this->loadJson();
        foreach ($this->data['personalityResults'] ?? [] as $p) {
            if (($p['userId'] ?? '') === $userId) {
                return $p;
            }
        }
        return null;
    }

    public function savePersonalityResult($userId, $result) {
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
        $this->loadJson();
        return $this->data['globalSettings'] ?? [];
    }

    public function updateGlobalSettings($settings) {
        $this->loadJson();
        $this->data['globalSettings'] = array_merge($this->data['globalSettings'] ?? [], $settings, [
            'updatedAt' => date('Y-m-d H:i:s'),
        ]);
        $this->saveJson();
        return $this->data['globalSettings'];
    }

    // --- Custom Fonts ---
    public function getCustomFonts() {
        $this->loadJson();
        return $this->data['custom_fonts'] ?? [];
    }

    public function addCustomFont($fontData) {
        $this->loadJson();
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
        $this->data['custom_fonts'][] = $font;
        $this->saveJson();
        return $font;
    }
}
