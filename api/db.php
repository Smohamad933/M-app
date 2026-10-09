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
    public $installed = false; // true only when a real db.json file was found on disk

    private function __construct() {
        // Attempt MySQL connection if available
        if (function_exists('getMySQLPDO')) {
            $this->pdo = getMySQLPDO();
            if ($this->pdo !== null) {
                $this->mode = 'mysql';
                $this->ensureMySQLSchema();
                return;
            }
        }
        $this->loadJson();
    }

    private function ensureMySQLSchema() {
        if (!$this->pdo) return;
        $marker = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . '.mysql_schema_ready_v5';
        if (file_exists($marker)) {
            return;
        }
        try {
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `users` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `numeric_id` int(11) DEFAULT 1000,
                  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
                  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
                  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
                  `verification_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `bale_chat_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `bale_username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `birth_date` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `job_title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `skills_json` text COLLATE utf8mb4_unicode_ci,
                  `timeline_json` text COLLATE utf8mb4_unicode_ci,
                  `subscription_json` text DEFAULT NULL,
                  `avatar` longtext COLLATE utf8mb4_unicode_ci,
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  UNIQUE KEY `idx_username` (`username`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $columns = [];
            $colStmt = $this->pdo->query("SHOW COLUMNS FROM `users`");
            while ($c = $colStmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[strtolower($c['Field'])] = true;
            }
            if (!isset($columns['numeric_id'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `numeric_id` int(11) DEFAULT 1000");
            }
            if (!isset($columns['phone'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `phone` varchar(30) DEFAULT NULL");
            }
            if (!isset($columns['email'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `email` varchar(150) DEFAULT NULL");
            }
            if (!isset($columns['province'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `province` varchar(100) DEFAULT NULL");
            }
            if (!isset($columns['city'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `city` varchar(100) DEFAULT NULL");
            }
            if (!isset($columns['birth_date'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `birth_date` varchar(30) DEFAULT NULL");
            }
            if (!isset($columns['job_title'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `job_title` varchar(150) DEFAULT NULL");
            }
            if (!isset($columns['skills_json'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `skills_json` text DEFAULT NULL");
            }
            if (!isset($columns['timeline_json'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `timeline_json` text DEFAULT NULL");
            }
            if (!isset($columns['avatar'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `avatar` longtext DEFAULT NULL");
            }
            if (!isset($columns['status'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `status` varchar(50) DEFAULT 'active'");
            }
            if (!isset($columns['is_verified'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `is_verified` tinyint(1) DEFAULT 0");
            }
            if (!isset($columns['verification_code'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `verification_code` varchar(50) DEFAULT NULL");
            }
            if (!isset($columns['bale_chat_id'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `bale_chat_id` varchar(100) DEFAULT NULL");
            }
            if (!isset($columns['bale_username'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `bale_username` varchar(100) DEFAULT NULL");
            }
            if (!isset($columns['bale_notif_token'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `bale_notif_token` varchar(50) DEFAULT NULL");
            }
            if (!isset($columns['bale_notif_enabled'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `bale_notif_enabled` tinyint(1) DEFAULT 0");
            }
            if (!isset($columns['subscription_json'])) {
                @$this->pdo->exec("ALTER TABLE `users` ADD COLUMN `subscription_json` text DEFAULT NULL");
            }

            // Drop any accidental UNIQUE constraint on phone, email, numeric_id, bale_chat_id
            try {
                $idxStmt = $this->pdo->query("SHOW INDEX FROM `users`");
                if ($idxStmt) {
                    while ($idx = $idxStmt->fetch(PDO::FETCH_ASSOC)) {
                        $keyName = $idx['Key_name'] ?? '';
                        $colName = strtolower($idx['Column_name'] ?? '');
                        if ($keyName !== 'PRIMARY' && $keyName !== 'idx_username' && $colName !== 'username') {
                            if (in_array($colName, ['numeric_id', 'phone', 'email', 'role', 'status', 'bale_chat_id'])) {
                                if (isset($idx['Non_unique']) && (int)$idx['Non_unique'] === 0) {
                                    @$this->pdo->exec("ALTER TABLE `users` DROP INDEX `{$keyName}`");
                                }
                            }
                        }
                    }
                }
            } catch (Exception $eIdx) {}

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `tasks` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `project_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `description` text COLLATE utf8mb4_unicode_ci,
                  `date` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `time` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '09:00',
                  `duration_minutes` int(11) NOT NULL DEFAULT '30',
                  `completed` tinyint(1) NOT NULL DEFAULT '0',
                  `completed_at` datetime DEFAULT NULL,
                  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
                  `category_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cat-work',
                  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
                  `focus_minutes_spent` int(11) NOT NULL DEFAULT '0',
                  `reason_uncompleted` text COLLATE utf8mb4_unicode_ci,
                  `uncompleted_category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `subtasks_json` text COLLATE utf8mb4_unicode_ci,
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `idx_task_user` (`user_id`),
                  KEY `idx_task_date` (`date`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
            $taskCols = [];
            $tColStmt = $this->pdo->query("SHOW COLUMNS FROM `tasks`");
            if ($tColStmt) {
                while ($tc = $tColStmt->fetch(PDO::FETCH_ASSOC)) {
                    $taskCols[strtolower($tc['Field'])] = true;
                }
                if (!isset($taskCols['reason_uncompleted'])) {
                    @$this->pdo->exec("ALTER TABLE `tasks` ADD COLUMN `reason_uncompleted` text DEFAULT NULL");
                }
                if (!isset($taskCols['uncompleted_category'])) {
                    @$this->pdo->exec("ALTER TABLE `tasks` ADD COLUMN `uncompleted_category` varchar(50) DEFAULT NULL");
                }
                if (!isset($taskCols['subtasks_json'])) {
                    @$this->pdo->exec("ALTER TABLE `tasks` ADD COLUMN `subtasks_json` text DEFAULT NULL");
                }
            }

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `deleted_users` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `deleted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `friend_requests` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `from_user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `from_user_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `from_user_username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `from_user_avatar` longtext COLLATE utf8mb4_unicode_ci,
                  `to_user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `project_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `project_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `idx_freq_to` (`to_user_id`),
                  KEY `idx_freq_from` (`from_user_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `friendships` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `user1_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `user2_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `idx_fs_u1` (`user1_id`),
                  KEY `idx_fs_u2` (`user2_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `notifications` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `message` text COLLATE utf8mb4_unicode_ci,
                  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
                  `extra_json` text COLLATE utf8mb4_unicode_ci,
                  `is_read` tinyint(1) NOT NULL DEFAULT 0,
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `idx_notif_user` (`user_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `messages` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `sender_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `sender_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `sender_avatar` longtext COLLATE utf8mb4_unicode_ci,
                  `receiver_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
                  `is_read` tinyint(1) NOT NULL DEFAULT 0,
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `idx_msg_sender` (`sender_id`),
                  KEY `idx_msg_receiver` (`receiver_id`),
                  KEY `idx_msg_created` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `project_messages` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `project_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `sender_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `sender_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `sender_avatar` longtext COLLATE utf8mb4_unicode_ci,
                  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `idx_pmsg_proj` (`project_id`),
                  KEY `idx_pmsg_created` (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS `custom_fonts` (
                  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `family` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
                  `font_url` text COLLATE utf8mb4_unicode_ci,
                  `data_url` longtext COLLATE utf8mb4_unicode_ci,
                  `description` text COLLATE utf8mb4_unicode_ci,
                  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            @touch($marker);
        } catch (Exception $e) {}
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
    /** Default seed data (used by forceInstall) */
    public function defaultSeed() {
        return [
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
                        'title' => 'خوش‌آمدید به سامانه بگ تایم (Bag Time)',
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
    }

    /** True when a valid database exists */
    public function isInstalled() {
        if ($this->mode === 'mysql' && $this->pdo !== null) {
            return true;
        }
        return $this->installed;
    }

    /** One-click install: write the default database file to disk */
    public function forceInstall() {
        $this->data = $this->defaultSeed();
        if (empty($this->jsonFile)) {
            $this->jsonFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json';
        }
        $this->saveJson();
        $this->installed = true;
        return true;
    }

    public function loadJson() {
        $candidatePaths = [
            dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json',
            __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json',
            __DIR__ . DIRECTORY_SEPARATOR . 'db.json',
            sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'taskrooz_db.json'
        ];

        $content = null;
        $foundPath = null;
        $modularDataDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';

        // Check if modular databases exist (data/users.json, data/tasks.json, etc.)
        if (file_exists($modularDataDir . DIRECTORY_SEPARATOR . 'users.json')) {
            $uRaw = @file_get_contents($modularDataDir . DIRECTORY_SEPARATOR . 'users.json');
            $uParsed = $uRaw ? @json_decode($uRaw, true) : null;
            if (is_array($uParsed) && isset($uParsed['users'])) {
                $content = $this->defaultSeed();
                $content['users'] = $uParsed['users'] ?? [];
                $content['friendships'] = $uParsed['friendships'] ?? [];
                $content['friend_requests'] = $uParsed['friend_requests'] ?? [];

                if (file_exists($modularDataDir . DIRECTORY_SEPARATOR . 'tasks.json')) {
                    $tRaw = @file_get_contents($modularDataDir . DIRECTORY_SEPARATOR . 'tasks.json');
                    $tParsed = $tRaw ? @json_decode($tRaw, true) : null;
                    if (is_array($tParsed)) {
                        $content['tasks'] = $tParsed['tasks'] ?? [];
                        if (!empty($tParsed['categories'])) $content['categories'] = $tParsed['categories'];
                        if (!empty($tParsed['projects'])) $content['projects'] = $tParsed['projects'];
                        if (!empty($tParsed['goals'])) $content['goals'] = $tParsed['goals'];
                        if (!empty($tParsed['dailyNotes'])) $content['dailyNotes'] = $tParsed['dailyNotes'];
                        if (!empty($tParsed['personalityResults'])) $content['personalityResults'] = $tParsed['personalityResults'];
                    }
                }

                if (file_exists($modularDataDir . DIRECTORY_SEPARATOR . 'messages.json')) {
                    $mRaw = @file_get_contents($modularDataDir . DIRECTORY_SEPARATOR . 'messages.json');
                    $mParsed = $mRaw ? @json_decode($mRaw, true) : null;
                    if (is_array($mParsed)) {
                        $content['messages'] = $mParsed['messages'] ?? [];
                        $content['project_messages'] = $mParsed['project_messages'] ?? [];
                        $content['focus_rooms'] = $mParsed['focus_rooms'] ?? [];
                    }
                }

                if (file_exists($modularDataDir . DIRECTORY_SEPARATOR . 'notifications.json')) {
                    $nRaw = @file_get_contents($modularDataDir . DIRECTORY_SEPARATOR . 'notifications.json');
                    $nParsed = $nRaw ? @json_decode($nRaw, true) : null;
                    if (is_array($nParsed)) {
                        $content['notifications'] = $nParsed['notifications'] ?? [];
                        $content['payments'] = $nParsed['payments'] ?? [];
                    }
                }

                if (file_exists($modularDataDir . DIRECTORY_SEPARATOR . 'settings.json')) {
                    $sRaw = @file_get_contents($modularDataDir . DIRECTORY_SEPARATOR . 'settings.json');
                    $sParsed = $sRaw ? @json_decode($sRaw, true) : null;
                    if (is_array($sParsed)) {
                        if (!empty($sParsed['globalSettings'])) $content['globalSettings'] = $sParsed['globalSettings'];
                        if (!empty($sParsed['custom_fonts'])) $content['custom_fonts'] = $sParsed['custom_fonts'];
                    }
                }

                $foundPath = $modularDataDir . DIRECTORY_SEPARATOR . 'users.json';
            }
        }

        if (!$content) {
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
        }

        if ($content) {
            $this->data = $content;
            $this->jsonFile = $foundPath;
            $this->installed = true;
        } else {
            // In-memory default seed ONLY. The file is NOT created silently:
            // the app shows a clear "database not installed" panel and the
            // admin can trigger api/install.php (one-click install) instead.
            $this->data = $this->defaultSeed();
            $this->jsonFile = $candidatePaths[0];
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

    public function saveUsers() {
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        $payload = [
            'users' => $this->data['users'] ?? [],
            'friendships' => $this->data['friendships'] ?? [],
            'friend_requests' => $this->data['friend_requests'] ?? [],
        ];
        @file_put_contents($dir . DIRECTORY_SEPARATOR . 'users.json', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    }

    public function saveTasks() {
        if ($this->mode === 'mysql' && $this->pdo !== null) return;
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        $payload = [
            'tasks' => $this->data['tasks'] ?? [],
            'categories' => $this->data['categories'] ?? [],
            'projects' => $this->data['projects'] ?? [],
            'goals' => $this->data['goals'] ?? [],
            'dailyNotes' => $this->data['dailyNotes'] ?? [],
            'personalityResults' => $this->data['personalityResults'] ?? [],
        ];
        @file_put_contents($dir . DIRECTORY_SEPARATOR . 'tasks.json', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    }

    public function saveMessages() {
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        $payload = [
            'messages' => $this->data['messages'] ?? [],
            'project_messages' => $this->data['project_messages'] ?? [],
            'focus_rooms' => $this->data['focus_rooms'] ?? [],
        ];
        @file_put_contents($dir . DIRECTORY_SEPARATOR . 'messages.json', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    }

    public function saveNotifications() {
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        $payload = [
            'notifications' => $this->data['notifications'] ?? [],
            'payments' => $this->data['payments'] ?? [],
        ];
        @file_put_contents($dir . DIRECTORY_SEPARATOR . 'notifications.json', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    }

    public function saveSettings() {
        if ($this->mode === 'mysql' && $this->pdo !== null) return;
        $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        $payload = [
            'globalSettings' => $this->data['globalSettings'] ?? [],
            'custom_fonts' => $this->data['custom_fonts'] ?? [],
        ];
        @file_put_contents($dir . DIRECTORY_SEPARATOR . 'settings.json', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    }

    public function saveJson() {
        if ($this->mode === 'mysql' && $this->pdo !== null) return;
        if (!is_array($this->data)) return;
        $this->saveUsers();
        $this->saveTasks();
        $this->saveMessages();
        $this->saveNotifications();
        $this->saveSettings();

        $encoded = json_encode($this->data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        if (!$encoded) return;

        $primaryPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'db.json';
        $dir = dirname($primaryPath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        @file_put_contents($primaryPath, $encoded, LOCK_EX);
        @chmod($primaryPath, 0666);
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
                    if (isset($u['birth_date']) && !isset($u['birthDate'])) $u['birthDate'] = $u['birth_date'];
                    if (isset($u['job_title']) && !isset($u['jobTitle'])) $u['jobTitle'] = $u['job_title'];
                    if (isset($u['verification_code']) && !isset($u['verificationCode'])) $u['verificationCode'] = $u['verification_code'];
                    if (isset($u['is_verified']) && !isset($u['isVerified'])) $u['isVerified'] = !empty($u['is_verified']);
                    if (isset($u['bale_chat_id']) && !isset($u['baleChatId'])) $u['baleChatId'] = $u['bale_chat_id'];
                    if (isset($u['bale_username']) && !isset($u['baleUsername'])) $u['baleUsername'] = $u['bale_username'];
                    if (isset($u['bale_notif_token']) && !isset($u['baleNotifToken'])) $u['baleNotifToken'] = $u['bale_notif_token'];
                    if (isset($u['bale_notif_enabled']) && !isset($u['baleNotificationsEnabled'])) $u['baleNotificationsEnabled'] = !empty($u['bale_notif_enabled']);
                    if (isset($u['numeric_id']) && !isset($u['numericId'])) $u['numericId'] = (int)$u['numeric_id'];
                    $u['isProfileCompleted'] = !empty($u['is_profile_completed']) || ($u['role'] === 'admin') || (!empty($u['birthDate']) && !empty($u['city']));
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

        // 3. Fallback: check all harvested users
        foreach ($this->getAllUsers() as $u) {
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
                    if (isset($u['birth_date']) && !isset($u['birthDate'])) $u['birthDate'] = $u['birth_date'];
                    if (isset($u['job_title']) && !isset($u['jobTitle'])) $u['jobTitle'] = $u['job_title'];
                    if (isset($u['verification_code']) && !isset($u['verificationCode'])) $u['verificationCode'] = $u['verification_code'];
                    if (isset($u['is_verified']) && !isset($u['isVerified'])) $u['isVerified'] = !empty($u['is_verified']);
                    if (isset($u['bale_chat_id']) && !isset($u['baleChatId'])) $u['baleChatId'] = $u['bale_chat_id'];
                    if (isset($u['bale_username']) && !isset($u['baleUsername'])) $u['baleUsername'] = $u['bale_username'];
                    if (isset($u['bale_notif_token']) && !isset($u['baleNotifToken'])) $u['baleNotifToken'] = $u['bale_notif_token'];
                    if (isset($u['bale_notif_enabled']) && !isset($u['baleNotificationsEnabled'])) $u['baleNotificationsEnabled'] = !empty($u['bale_notif_enabled']);
                    if (isset($u['numeric_id']) && !isset($u['numericId'])) $u['numericId'] = (int)$u['numeric_id'];
                    if (!empty($u['subscription_json']) && !isset($u['subscription'])) $u['subscription'] = json_decode($u['subscription_json'], true);
                    $u['isProfileCompleted'] = !empty($u['is_profile_completed']) || ($u['role'] === 'admin') || (!empty($u['birthDate']) && !empty($u['city']));
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

        // 3. Fallback: check all harvested users
        foreach ($this->getAllUsers() as $u) {
            if (isset($u['id']) && $u['id'] === $id) {
                return $u;
            }
            if (isset($u['username']) && strtolower($u['username']) === strtolower($id)) {
                return $u;
            }
            if (!empty($u['baleChatId']) && strval($u['baleChatId']) === strval($id)) {
                return $u;
            }
        }
        return null;
    }

    public function getUserByBaleChatId($chatId) {
        if (empty($chatId)) return null;
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM users WHERE bale_chat_id = ? LIMIT 1");
                $stmt->execute([strval($chatId)]);
                $u = $stmt->fetch();
                if ($u) return $this->normalizeUserRow($u);
            } catch (Exception $e) {}
        }
        foreach ($this->getAllUsers() as $u) {
            if (!empty($u['baleChatId']) && strval($u['baleChatId']) === strval($chatId)) {
                return $u;
            }
        }
        return null;
    }

    public function getUserByVerificationCode($code) {
        if (empty($code)) return null;
        $clean = trim(strval($code));
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM users WHERE verification_code = ? LIMIT 1");
                $stmt->execute([$clean]);
                $u = $stmt->fetch();
                if ($u) return $this->normalizeUserRow($u);
            } catch (Exception $e) {}
        }
        foreach ($this->getAllUsers() as $u) {
            if (!empty($u['verificationCode']) && trim(strval($u['verificationCode'])) === $clean) {
                return $u;
            }
        }
        return null;
    }

    private function normalizeUserRow($u) {
        if (!$u) return null;
        if (!empty($u['skills_json']) && is_string($u['skills_json'])) $u['skills'] = json_decode($u['skills_json'], true);
        if (!empty($u['timeline_json']) && is_string($u['timeline_json'])) $u['dailyTimeline'] = json_decode($u['timeline_json'], true);
        if (isset($u['birth_date']) && !isset($u['birthDate'])) $u['birthDate'] = $u['birth_date'];
        if (isset($u['job_title']) && !isset($u['jobTitle'])) $u['jobTitle'] = $u['job_title'];
        if (isset($u['verification_code']) && !isset($u['verificationCode'])) $u['verificationCode'] = $u['verification_code'];
        if (isset($u['is_verified']) && !isset($u['isVerified'])) $u['isVerified'] = !empty($u['is_verified']);
        if (isset($u['bale_chat_id']) && !isset($u['baleChatId'])) $u['baleChatId'] = $u['bale_chat_id'];
        if (isset($u['bale_username']) && !isset($u['baleUsername'])) $u['baleUsername'] = $u['bale_username'];
        if (isset($u['numeric_id']) && !isset($u['numericId'])) $u['numericId'] = (int)$u['numeric_id'];
        $u['isProfileCompleted'] = !empty($u['is_profile_completed']) || ($u['role'] === 'admin') || (!empty($u['birthDate']) && !empty($u['city']));
        return $u;
    }

    public function createUser($username, $password, $name, $role = 'user', $extra = []) {
        $usernameClean = trim($username);
        $usernameLower = strtolower($usernameClean);
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $id = (!empty($extra['id']) && is_string($extra['id'])) ? $extra['id'] : ('usr_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4));
        $now = date('Y-m-d H:i:s');
        $phone = !empty($extra['phone']) ? trim((string)$extra['phone']) : null;
        $email = !empty($extra['email']) ? trim((string)$extra['email']) : (!empty($extra['gmail']) ? trim((string)$extra['gmail']) : null);
        $province = !empty($extra['province']) ? trim((string)$extra['province']) : null;
        $city = !empty($extra['city']) ? trim((string)$extra['city']) : null;
        $birthDate = !empty($extra['birthDate']) ? trim((string)$extra['birthDate']) : (!empty($extra['birth_date']) ? trim((string)$extra['birth_date']) : null);
        $jobTitle = !empty($extra['jobTitle']) ? trim((string)$extra['jobTitle']) : (!empty($extra['job_title']) ? trim((string)$extra['job_title']) : null);
        $skills = is_array($extra['skills'] ?? null) ? $extra['skills'] : [];
        $timeline = is_array($extra['dailyTimeline'] ?? null) ? $extra['dailyTimeline'] : [];

        // Role strictly user unless Mohusyn
        if ($usernameLower === 'mohusyn') {
            $role = 'admin';
            $id = 'usr_admin_mohusyn';
        } else {
            $role = 'user';
        }

        $maxNum = 1000;
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $mStmt = $this->pdo->query("SELECT MAX(numeric_id) as max_id FROM users");
                $mRow = $mStmt ? $mStmt->fetch() : null;
                if ($mRow && !empty($mRow['max_id']) && is_numeric($mRow['max_id'])) {
                    $maxNum = max($maxNum, (int)$mRow['max_id']);
                }
            } catch (Exception $eM) {}
        }
        foreach ($this->getAllUsers() as $existingU) {
            $nVal = $existingU['numericId'] ?? ($existingU['numeric_id'] ?? 0);
            if (!empty($nVal) && is_numeric($nVal)) {
                $maxNum = max($maxNum, (int)$nVal);
            }
        }
        $numericId = (!empty($extra['numericId']) && is_numeric($extra['numericId']))
            ? (int)$extra['numericId']
            : (($role === 'admin' && $usernameLower === 'mohusyn') ? 1000 : ($maxNum + 1));
        $isCompleted = !empty($birthDate) && !empty($jobTitle) && !empty($city);

        $status = $extra['status'] ?? 'active';
        $isDemo = !empty($extra['isDemo']);

        $defaultSub = ['plan' => $role === 'admin' ? 'pro' : 'free'];
        $subscription = (!empty($extra['subscription']) && is_array($extra['subscription']))
            ? $extra['subscription']
            : $defaultSub;

        $userObj = [
            'id' => $id,
            'numericId' => $numericId,
            'username' => $usernameClean,
            'password' => $password,
            'password_hash' => $hash,
            'name' => trim($name),
            'role' => $role,
            'status' => $status,
            'isDemo' => $isDemo,
            'phone' => $phone ?? '',
            'email' => $email ?? '',
            'province' => $province ?? '',
            'city' => $city ?? '',
            'birthDate' => $birthDate ?? '',
            'jobTitle' => $jobTitle ?? '',
            'skills' => is_array($skills) ? $skills : [],
            'dailyTimeline' => is_array($timeline) ? $timeline : [],
            'subscription' => $subscription,
            'isProfileCompleted' => $role === 'admin' || $isCompleted,
            'verificationCode' => $extra['verificationCode'] ?? null,
            'isVerified' => !empty($extra['isVerified']),
            'baleChatId' => $extra['baleChatId'] ?? null,
            'baleUsername' => $extra['baleUsername'] ?? null,
            'createdAt' => $now,
            'totalTasks' => 0,
            'completedTasks' => 0,
            'progressPercent' => 0,
        ];

        // 1. Save to MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $isVer = !empty($extra['isVerified']) ? 1 : 0;
                $verCode = $extra['verificationCode'] ?? null;
                $baleChatId = !empty($extra['baleChatId']) ? strval($extra['baleChatId']) : null;
                $baleUsername = !empty($extra['baleUsername']) ? strval($extra['baleUsername']) : null;
                $subJson = json_encode($subscription, JSON_UNESCAPED_UNICODE);

                if ($usernameLower === 'mohusyn') {
                    $stmt = $this->pdo->prepare("
                        INSERT INTO users (id, numeric_id, username, password_hash, name, role, status, is_verified, verification_code, bale_chat_id, bale_username, subscription_json, phone, email, province, city, birth_date, job_title, skills_json, timeline_json, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            name = VALUES(name),
                            password_hash = VALUES(password_hash),
                            role = VALUES(role),
                            status = VALUES(status),
                            is_verified = VALUES(is_verified),
                            subscription_json = COALESCE(users.subscription_json, VALUES(subscription_json))
                    ");
                } else {
                    // Clean INSERT for regular users: never overwrite existing accounts!
                    $stmt = $this->pdo->prepare("
                        INSERT INTO users (id, numeric_id, username, password_hash, name, role, status, is_verified, verification_code, bale_chat_id, bale_username, subscription_json, phone, email, province, city, birth_date, job_title, skills_json, timeline_json, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                }
                $stmt->execute([
                    $id, $numericId, $usernameClean, $hash, $name, $role, $status, $isVer, $verCode, $baleChatId, $baleUsername,
                    $subJson, $phone, $email, $province, $city, $birthDate, $jobTitle,
                    json_encode($skills), json_encode($timeline), $now
                ]);
            } catch (Exception $e) {
                try {
                    $stmtFallback = $this->pdo->prepare("
                        INSERT INTO users (id, numeric_id, username, password_hash, name, role, status, is_verified, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmtFallback->execute([$id, $numericId, $usernameClean, $hash, $name, $role, $status, !empty($extra['isVerified']) ? 1 : 0, $now]);
                } catch (Exception $e2) {}
            }
        }

        // 2. Save to JSON backup
        $this->loadJson();
        $existingIdx = -1;
        foreach ($this->data['users'] as $idx => $u) {
            if (
                (isset($u['username']) && strtolower($u['username']) === $usernameLower) ||
                ($u['id'] === $id) ||
                (!empty($u['baleChatId']) && !empty($extra['baleChatId']) && strval($u['baleChatId']) === strval($extra['baleChatId']))
            ) {
                $existingIdx = $idx;
                break;
            }
        }
        if ($existingIdx >= 0) {
            if (!empty($this->data['users'][$existingIdx]['subscription'])) {
                $userObj['subscription'] = $this->data['users'][$existingIdx]['subscription'];
            }
            if (!empty($this->data['users'][$existingIdx]['status'])) {
                $userObj['status'] = $this->data['users'][$existingIdx]['status'];
            }
            $userObj['id'] = $this->data['users'][$existingIdx]['id'];
            $this->data['users'][$existingIdx] = array_merge($this->data['users'][$existingIdx], $userObj);
            $userObj = $this->data['users'][$existingIdx];
        } else {
            $this->data['users'][] = $userObj;
        }
        $this->saveJson();

        return $userObj;
    }

    public function getAllUsers() {
        $userMap = [];

        // 1. Try MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $users = null;
                try {
                    $stmt = $this->pdo->query("
                        SELECT 
                            u.*,
                            COALESCE(t.totalTasks, 0) as totalTasks,
                            COALESCE(t.completedTasks, 0) as completedTasks
                        FROM users u
                        LEFT JOIN (
                            SELECT user_id, COUNT(*) as totalTasks, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completedTasks
                            FROM tasks
                            GROUP BY user_id
                        ) t ON u.id = t.user_id
                        ORDER BY u.created_at ASC
                    ");
                    $users = $stmt ? $stmt->fetchAll() : null;
                } catch (Exception $eSub) {
                    $stmt = $this->pdo->query("SELECT * FROM users ORDER BY created_at ASC");
                    $users = $stmt ? $stmt->fetchAll() : null;
                }

                if ($users && count($users) > 0) {
                    foreach ($users as $u) {
                        $total = (int)($u['totalTasks'] ?? 0);
                        $done = (int)($u['completedTasks'] ?? 0);
                        $u['totalTasks'] = $total;
                        $u['completedTasks'] = $done;
                        $u['progressPercent'] = $total > 0 ? round(($done / $total) * 100) : 0;
                        $u['skills'] = !empty($u['skills_json']) ? (is_array($u['skills_json']) ? $u['skills_json'] : json_decode($u['skills_json'], true)) : [];
                        $u['dailyTimeline'] = !empty($u['timeline_json']) ? (is_array($u['timeline_json']) ? $u['timeline_json'] : json_decode($u['timeline_json'], true)) : [];
                        $u['isVerified'] = !empty($u['is_verified'] ?? $u['isVerified']);
                        $u['verificationCode'] = $u['verification_code'] ?? $u['verificationCode'] ?? null;
                        $u['numericId'] = (int)($u['numeric_id'] ?? $u['numericId'] ?? 1000);
                        $u['birthDate'] = $u['birth_date'] ?? $u['birthDate'] ?? '';
                        $u['jobTitle'] = $u['job_title'] ?? $u['jobTitle'] ?? '';
                        $u['baleChatId'] = $u['bale_chat_id'] ?? $u['baleChatId'] ?? null;
                        $u['baleUsername'] = $u['bale_username'] ?? $u['baleUsername'] ?? null;
                        $u['baleNotifToken'] = $u['bale_notif_token'] ?? $u['baleNotifToken'] ?? null;
                        $u['baleNotificationsEnabled'] = !empty($u['bale_notif_enabled'] ?? $u['baleNotificationsEnabled']);
                        $u['subscription'] = !empty($u['subscription_json'])
                            ? (is_array($u['subscription_json']) ? $u['subscription_json'] : json_decode($u['subscription_json'], true))
                            : (!empty($u['subscriptionJson']) ? json_decode($u['subscriptionJson'], true) : ['plan' => (($u['role'] ?? '') === 'admin' ? 'pro' : 'free')]);

                        $key = strtolower(trim((string)($u['username'] ?? $u['id'])));
                        $userMap[$key] = $u;
                    }
                    return array_values($userMap);
                }
            } catch (Exception $e) {}
        }

        // 2. JSON Storage: merge any user stored in JSON to guarantee nothing is ever missed
        $this->loadJson();
        $tasks = $this->data['tasks'] ?? [];

        foreach ($this->data['users'] as $u) {
            $key = strtolower(trim((string)($u['username'] ?? $u['id'])));
            if (isset($userMap[$key])) {
                // Enrich missing Bale chat info if available in JSON
                if (empty($userMap[$key]['baleChatId']) && !empty($u['baleChatId'])) {
                    $userMap[$key]['baleChatId'] = $u['baleChatId'];
                }
                if (empty($userMap[$key]['baleUsername']) && !empty($u['baleUsername'])) {
                    $userMap[$key]['baleUsername'] = $u['baleUsername'];
                }
                continue;
            }

            $total = 0;
            $done = 0;
            foreach ($tasks as $t) {
                $tUserId = $t['userId'] ?? $t['user_id'] ?? '';
                if ($tUserId === $u['id'] || (isset($u['username']) && $tUserId === $u['username'])) {
                    $total++;
                    if (!empty($t['completed'])) $done++;
                }
            }

            $uObj = [
                'id' => $u['id'],
                'numericId' => (int)($u['numericId'] ?? 1000),
                'username' => $u['username'],
                'name' => $u['name'],
                'role' => $u['role'] ?? 'user',
                'phone' => $u['phone'] ?? '',
                'email' => $u['email'] ?? $u['gmail'] ?? '',
                'province' => $u['province'] ?? '',
                'city' => $u['city'] ?? '',
                'birthDate' => $u['birthDate'] ?? $u['birth_date'] ?? '',
                'jobTitle' => $u['jobTitle'] ?? $u['job_title'] ?? '',
                'avatar' => $u['avatar'] ?? null,
                'skills' => $u['skills'] ?? [],
                'dailyTimeline' => $u['dailyTimeline'] ?? [],
                'status' => $u['status'] ?? 'active',
                'isDemo' => !empty($u['isDemo']),
                'isVerified' => !empty($u['isVerified']),
                'baleChatId' => $u['baleChatId'] ?? null,
                'baleUsername' => $u['baleUsername'] ?? null,
                'baleNotifToken' => $u['baleNotifToken'] ?? ($u['bale_notif_token'] ?? null),
                'baleNotificationsEnabled' => !empty($u['baleNotificationsEnabled']) || !empty($u['bale_notif_enabled']),
                'subscription' => $u['subscription'] ?? ['plan' => (($u['role'] ?? '') === 'admin' ? 'pro' : 'free')],
                'createdAt' => $u['createdAt'] ?? $u['created_at'] ?? date('Y-m-d H:i:s'),
                'totalTasks' => $total,
                'completedTasks' => $done,
                'progressPercent' => $total > 0 ? round(($done / $total) * 100) : 0,
            ];
            $userMap[$key] = $uObj;

            // Self-healing: if MySQL is active, automatically push this missing JSON user to MySQL
            if ($this->mode === 'mysql' && $this->pdo) {
                try {
                    $isVer = !empty($uObj['isVerified']) ? 1 : 0;
                    $subJson = json_encode($uObj['subscription'] ?? ['plan' => (($uObj['role'] ?? '') === 'admin' ? 'pro' : 'free')], JSON_UNESCAPED_UNICODE);
                    $stmt = $this->pdo->prepare("
                        INSERT INTO users (id, numeric_id, username, password_hash, name, role, status, is_verified, bale_chat_id, bale_username, subscription_json, phone, email, province, city, birth_date, job_title, skills_json, timeline_json, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            name = VALUES(name), 
                            role = VALUES(role), 
                            status = VALUES(status), 
                            bale_chat_id = VALUES(bale_chat_id),
                            subscription_json = COALESCE(users.subscription_json, VALUES(subscription_json))
                    ");
                    $stmt->execute([
                        $uObj['id'], $uObj['numericId'], $uObj['username'], $u['password_hash'] ?? password_hash('123456', PASSWORD_DEFAULT),
                        $uObj['name'], $uObj['role'], $uObj['status'], $isVer, $uObj['baleChatId'], $uObj['baleUsername'],
                        $subJson, $uObj['phone'], $uObj['email'], $uObj['province'], $uObj['city'], $uObj['birthDate'], $uObj['jobTitle'],
                        json_encode($uObj['skills']), json_encode($uObj['dailyTimeline']), $uObj['createdAt']
                    ]);
                } catch (Exception $e) {}
            }
        }

        // 3. Bale Tickets Storage: merge any user approved in Bale login tickets
        try {
            $btFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'bale_tickets.json';
            if (file_exists($btFile)) {
                $rawBt = @file_get_contents($btFile);
                if ($rawBt) {
                    $tickets = @json_decode($rawBt, true);
                    if (is_array($tickets)) {
                        foreach ($tickets as $t) {
                            if (($t['status'] ?? '') === 'approved' && !empty($t['user']) && is_array($t['user'])) {
                                $bu = $t['user'];
                                $key = strtolower(trim((string)($bu['username'] ?? $bu['id'] ?? '')));
                                if ($key !== '' && !isset($userMap[$key])) {
                                    $uObj = [
                                        'id' => $bu['id'] ?? ('usr_' . substr(bin2hex(random_bytes(4)), 0, 8)),
                                        'numericId' => (int)($bu['numericId'] ?? 1000),
                                        'username' => $bu['username'] ?? $key,
                                        'name' => $bu['name'] ?? $bu['username'] ?? 'کاربر بله',
                                        'role' => $bu['role'] ?? 'user',
                                        'phone' => $bu['phone'] ?? '',
                                        'email' => $bu['email'] ?? '',
                                        'province' => $bu['province'] ?? '',
                                        'city' => $bu['city'] ?? '',
                                        'birthDate' => $bu['birthDate'] ?? '',
                                        'jobTitle' => $bu['jobTitle'] ?? '',
                                        'avatar' => $bu['avatar'] ?? null,
                                        'skills' => $bu['skills'] ?? [],
                                        'dailyTimeline' => $bu['dailyTimeline'] ?? [],
                                        'status' => $bu['status'] ?? 'active',
                                        'isDemo' => !empty($bu['isDemo']),
                                        'isVerified' => true,
                                        'baleChatId' => $bu['baleChatId'] ?? null,
                                        'baleUsername' => $bu['baleUsername'] ?? null,
                                        'subscription' => $bu['subscription'] ?? ['plan' => (($bu['role'] ?? '') === 'admin' ? 'pro' : 'free')],
                                        'createdAt' => $bu['createdAt'] ?? date('Y-m-d H:i:s'),
                                        'totalTasks' => 0,
                                        'completedTasks' => 0,
                                        'progressPercent' => 0,
                                    ];
                                    $userMap[$key] = $uObj;

                                    if ($this->mode === 'mysql' && $this->pdo) {
                                        try {
                                            $isVer = 1;
                                            $subJson = json_encode($uObj['subscription'] ?? ['plan' => (($uObj['role'] ?? '') === 'admin' ? 'pro' : 'free')], JSON_UNESCAPED_UNICODE);
                                            $stmt = $this->pdo->prepare("
                                                INSERT INTO users (id, numeric_id, username, password_hash, name, role, status, is_verified, bale_chat_id, bale_username, subscription_json, phone, email, province, city, birth_date, job_title, skills_json, timeline_json, created_at)
                                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                ON DUPLICATE KEY UPDATE 
                                                    name = VALUES(name), 
                                                    role = VALUES(role), 
                                                    status = VALUES(status), 
                                                    bale_chat_id = VALUES(bale_chat_id),
                                                    subscription_json = COALESCE(users.subscription_json, VALUES(subscription_json))
                                            ");
                                            $stmt->execute([
                                                $uObj['id'], $uObj['numericId'], $uObj['username'], password_hash('123456', PASSWORD_DEFAULT),
                                                $uObj['name'], $uObj['role'], $uObj['status'], $isVer, $uObj['baleChatId'], $uObj['baleUsername'],
                                                $subJson, $uObj['phone'], $uObj['email'], $uObj['province'], $uObj['city'], $uObj['birthDate'], $uObj['jobTitle'],
                                                json_encode($uObj['skills']), json_encode($uObj['dailyTimeline']), $uObj['createdAt']
                                            ]);
                                        } catch (Exception $e) {}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception $e) {}

        return array_values($userMap);
    }

    public function setUserSubscription($userId, $plan, $planType = null, $expiresAt = null) {
        $cleanPlan = in_array($plan, ['plus', 'pro', 'ultra']) ? $plan : ($plan === 'free' ? 'free' : 'pro');
        $subData = [
            'plan' => $cleanPlan,
            'planType' => $planType,
            'activatedAt' => date('Y-m-d H:i:s'),
            'expiresAt' => $expiresAt,
        ];
        $updated = false;

        // 1. MySQL UPDATE
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $subJson = json_encode($subData, JSON_UNESCAPED_UNICODE);
                $stmt = $this->pdo->prepare("
                    UPDATE users 
                    SET subscription_json = ?, status = 'active' 
                    WHERE id = ? OR username = ? OR bale_chat_id = ? OR bale_username = ?
                ");
                $stmt->execute([$subJson, $userId, $userId, $userId, $userId]);
                if ($stmt->rowCount() > 0) {
                    $updated = true;
                } else {
                    $chk = $this->pdo->prepare("SELECT id FROM users WHERE id = ? OR username = ? OR bale_chat_id = ? OR bale_username = ? LIMIT 1");
                    $chk->execute([$userId, $userId, $userId, $userId]);
                    if ($chk->fetch()) {
                        $updated = true;
                    }
                }
            } catch (Exception $e) {}
        }

        // 2. JSON Storage UPDATE
        $this->loadJson();
        if (isset($this->data['users'])) {
            foreach ($this->data['users'] as &$u) {
                if (
                    $u['id'] === $userId || 
                    (isset($u['username']) && strtolower($u['username']) === strtolower($userId)) ||
                    (!empty($u['baleChatId']) && strval($u['baleChatId']) === strval($userId)) ||
                    (!empty($u['baleUsername']) && strtolower($u['baleUsername']) === strtolower($userId))
                ) {
                    $u['subscription'] = $subData;
                    if ($cleanPlan !== 'free') {
                        $u['status'] = 'active';
                    }
                    $updated = true;
                    break;
                }
            }
        }
        if ($updated) {
            $this->saveJson();
        }

        // 3. Bale Tickets UPDATE & Auto-Persist into MySQL and JSON
        try {
            $btFile = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'bale_tickets.json';
            if (file_exists($btFile)) {
                $rawBt = @file_get_contents($btFile);
                if ($rawBt) {
                    $tickets = @json_decode($rawBt, true);
                    if (is_array($tickets)) {
                        $btUpdated = false;
                        foreach ($tickets as &$t) {
                            if (!empty($t['user']) && is_array($t['user'])) {
                                $bu = &$t['user'];
                                if (
                                    ($bu['id'] ?? '') === $userId || 
                                    (isset($bu['username']) && strtolower($bu['username']) === strtolower($userId)) ||
                                    (!empty($bu['baleChatId']) && strval($bu['baleChatId']) === strval($userId)) ||
                                    (!empty($bu['baleUsername']) && strtolower($bu['baleUsername']) === strtolower($userId))
                                ) {
                                    $bu['subscription'] = $subData;
                                    $bu['status'] = 'active';
                                    $updated = true;
                                    $btUpdated = true;

                                    // Persist this user immediately into MySQL & JSON database
                                    if ($this->mode === 'mysql' && $this->pdo) {
                                        try {
                                            $isVer = 1;
                                            $stmt = $this->pdo->prepare("
                                                INSERT INTO users (id, numeric_id, username, password_hash, name, role, status, is_verified, bale_chat_id, bale_username, subscription_json, created_at)
                                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                                                ON DUPLICATE KEY UPDATE 
                                                    subscription_json = VALUES(subscription_json),
                                                    status = 'active',
                                                    bale_chat_id = VALUES(bale_chat_id),
                                                    bale_username = VALUES(bale_username)
                                            ");
                                            $stmt->execute([
                                                $bu['id'], (int)($bu['numericId'] ?? 1000), $bu['username'], password_hash('123456', PASSWORD_DEFAULT),
                                                $bu['name'] ?? $bu['username'], $bu['role'] ?? 'user', 'active', $isVer,
                                                $bu['baleChatId'] ?? null, $bu['baleUsername'] ?? null,
                                                json_encode($subData, JSON_UNESCAPED_UNICODE)
                                            ]);
                                        } catch (Exception $e2) {}
                                    }
                                }
                            }
                        }
                        if ($btUpdated) {
                            @file_put_contents($btFile, json_encode($tickets, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
                        }
                    }
                }
            }
        } catch (Exception $e) {}

        return $updated;
    }

    public function addNotification($userId, $title, $message, $type = 'info', $extra = []) {
        $notifId = 'notif_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        $now = date('Y-m-d H:i:s');
        $extraJson = !empty($extra) ? json_encode($extra, JSON_UNESCAPED_UNICODE) : null;

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO notifications (id, user_id, title, message, type, extra_json, is_read, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
                ");
                $stmt->execute([$notifId, $userId, $title, $message, $type, $extraJson, $now]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (!isset($this->data['notifications'])) {
            $this->data['notifications'] = [];
        }
        $newNotif = array_merge([
            'id' => $notifId,
            'userId' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'timestamp' => $now,
            'read' => false,
        ], $extra);
        $this->data['notifications'][] = $newNotif;
        $this->saveNotifications();

        // Automatically dispatch to Bale Messenger if user or admin has Bale enabled!
        $this->dispatchBaleNotification($userId, $title, $message);

        return $newNotif;
    }

    /**
     * Dispatch notification to user's Bale Messenger chat without executing external scripts
     */
    public function dispatchBaleNotification($userId, $title, $message) {
        try {
            $settings = $this->getGlobalSettings();
            $baleConfig = $settings['baleBot'] ?? [];
            if (empty($baleConfig['enabled']) || empty($baleConfig['sendNotifications'])) {
                return;
            }
            $rawToken = trim($baleConfig['token'] ?? '');
            if (empty($rawToken)) return;

            $tokenClean = trim($rawToken, " \t\n\r\0\x0B/");
            if (preg_match('/(?:tapi\.bale\.ai\/)?(?:bot)?([0-9]+:[A-Za-z0-9_-]+)/i', $tokenClean, $m)) {
                $tokenClean = $m[1];
            } elseif (stripos($tokenClean, 'bot') === 0) {
                $tokenClean = substr($tokenClean, 3);
            }
            if (empty($tokenClean)) return;

            $chatId = null;
            $user = $this->getUserById($userId);
            if ($user && !empty($user['baleChatId']) && !empty($user['baleNotificationActive'])) {
                $chatId = $user['baleChatId'];
            } elseif (strtolower($userId) === 'mohusyn' || $userId === 'usr_admin_mohusyn') {
                $admin = $this->getUserByUsername('Mohusyn');
                if ($admin && !empty($admin['baleChatId'])) {
                    $chatId = $admin['baleChatId'];
                }
            }

            if (!$chatId) return;

            $fullText = "📢 **{$title}**\n\n{$message}";
            $url = 'https://tapi.bale.ai/bot' . $tokenClean . '/sendMessage';
            $payload = json_encode(['chat_id' => $chatId, 'text' => $fullText], JSON_UNESCAPED_UNICODE);

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json; charset=utf-8']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            @curl_exec($ch);
            @curl_close($ch);
        } catch (Exception $e) {}
    }

    public function parseUserAgentInfo($ua = '') {
        if (empty($ua)) $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $device = 'رایانه شخصی (PC)';
        $browser = 'مرورگر وب';
        $isMobile = false;

        if (stripos($ua, 'BagTimeExtension') !== false || stripos($ua, 'BagTime-Assistant') !== false) {
            $browser = 'افزونه دستیار نیوتَب بگ تایم';
        } elseif (stripos($ua, 'Edg/') !== false || stripos($ua, 'Edge/') !== false) {
            $browser = 'مایکروسافت اج (Microsoft Edge)';
        } elseif (stripos($ua, 'Chrome/') !== false) {
            $browser = 'گوگل کروم (Google Chrome)';
        } elseif (stripos($ua, 'Firefox/') !== false) {
            $browser = 'موزیلا فایرفاکس (Mozilla Firefox)';
        } elseif (stripos($ua, 'Safari/') !== false && stripos($ua, 'Chrome/') === false) {
            $browser = 'اپل سافاری (Safari)';
        } elseif (stripos($ua, 'Opera') !== false || stripos($ua, 'OPR/') !== false) {
            $browser = 'مرورگر اپرا (Opera)';
        }

        if (stripos($ua, 'Android') !== false) {
            $device = 'گوشی هوشمند (اندروید)';
            $isMobile = true;
        } elseif (stripos($ua, 'iPhone') !== false) {
            $device = 'گوشی اپل آیفون (iOS)';
            $isMobile = true;
        } elseif (stripos($ua, 'iPad') !== false) {
            $device = 'تبلت آیپد (iPadOS)';
            $isMobile = true;
        } elseif (stripos($ua, 'Windows NT 10.0') !== false) {
            $device = 'ویندوز ۱۰ / ۱۱';
        } elseif (stripos($ua, 'Windows NT 6.3') !== false || stripos($ua, 'Windows NT 6.2') !== false || stripos($ua, 'Windows NT 6.1') !== false) {
            $device = 'ویندوز ۷ / ۸';
        } elseif (stripos($ua, 'Macintosh') !== false || stripos($ua, 'Mac OS X') !== false) {
            $device = 'رایانه اپل (macOS)';
        } elseif (stripos($ua, 'Linux') !== false) {
            $device = 'سیستم لینوکس (Linux)';
        }

        return [
            'device' => $device,
            'browser' => $browser,
            'isMobile' => $isMobile
        ];
    }

    public function getSessionsForUser($userId, $currentToken = '') {
        $this->loadJson();
        if (!isset($this->data['sessions']) || !is_array($this->data['sessions'])) {
            $this->data['sessions'] = [];
        }
        $res = [];
        foreach ($this->data['sessions'] as $s) {
            if ($s['userId'] === $userId) {
                $isCurrent = (!empty($currentToken) && !empty($s['token']) && $s['token'] === $currentToken);
                $sCopy = $s;
                $sCopy['isCurrent'] = $isCurrent;
                unset($sCopy['token']); // Hide secret token from payload
                $res[] = $sCopy;
            }
        }
        return $res;
    }

    public function recordSession($userId, $token, $ua = '', $ip = '', $location = '') {
        $this->loadJson();
        if (!isset($this->data['sessions']) || !is_array($this->data['sessions'])) {
            $this->data['sessions'] = [];
        }
        $parsed = $this->parseUserAgentInfo($ua);
        $sessionId = 'sess_' . substr(md5($userId . ':' . $token), 0, 12);
        
        $found = false;
        foreach ($this->data['sessions'] as &$s) {
            if ($s['token'] === $token || $s['id'] === $sessionId) {
                $s['lastActive'] = date('Y-m-d H:i:s');
                if (!empty($ip)) $s['ip'] = $ip;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $this->data['sessions'][] = [
                'id' => $sessionId,
                'userId' => $userId,
                'token' => $token,
                'device' => $parsed['device'],
                'browser' => $parsed['browser'],
                'isMobile' => $parsed['isMobile'],
                'ip' => !empty($ip) ? $ip : '127.0.0.1',
                'location' => !empty($location) ? $location : 'ایران',
                'createdAt' => date('Y-m-d H:i:s'),
                'lastActive' => date('Y-m-d H:i:s')
            ];
            $this->saveJson();
        }
        return $sessionId;
    }

    public function terminateSession($userId, $sessionId) {
        $this->loadJson();
        if (!isset($this->data['sessions']) || !is_array($this->data['sessions'])) return false;
        if (!isset($this->data['revoked_tokens']) || !is_array($this->data['revoked_tokens'])) {
            $this->data['revoked_tokens'] = [];
        }
        $newSessions = [];
        $terminated = false;
        foreach ($this->data['sessions'] as $s) {
            if ($s['userId'] === $userId && $s['id'] === $sessionId) {
                if (!empty($s['token'])) {
                    $this->data['revoked_tokens'][] = $s['token'];
                }
                $terminated = true;
            } else {
                $newSessions[] = $s;
            }
        }
        $this->data['sessions'] = $newSessions;
        $this->saveJson();
        return $terminated;
    }

    public function terminateAllOtherSessions($userId, $currentToken = '') {
        $this->loadJson();
        if (!isset($this->data['sessions']) || !is_array($this->data['sessions'])) return false;
        if (!isset($this->data['revoked_tokens']) || !is_array($this->data['revoked_tokens'])) {
            $this->data['revoked_tokens'] = [];
        }
        $newSessions = [];
        foreach ($this->data['sessions'] as $s) {
            if ($s['userId'] === $userId) {
                if (!empty($currentToken) && $s['token'] === $currentToken) {
                    $newSessions[] = $s;
                } else {
                    if (!empty($s['token'])) {
                        $this->data['revoked_tokens'][] = $s['token'];
                    }
                }
            } else {
                $newSessions[] = $s;
            }
        }
        $this->data['sessions'] = $newSessions;
        $this->saveJson();
        return true;
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

    /**
     * Update a user's own profile fields (name, contact info, avatar, routine...).
     * $fields contains only whitelisted camelCase keys; optional $password rotates the credential.
     * Mirrors updateUser() but for self-service profile editing (incl. avatar data URL).
     */
    public function updateUserProfile($id, $fields, $password = null) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $existing = null;
                $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
                $stmt->execute([$id]);
                $existing = $stmt->fetch() ?: [];

                $name = $fields['name'] ?? ($existing['name'] ?? '');
                $phone = $fields['phone'] ?? ($existing['phone'] ?? null);
                $email = $fields['email'] ?? ($existing['email'] ?? null);
                $province = $fields['province'] ?? ($existing['province'] ?? null);
                $city = $fields['city'] ?? ($existing['city'] ?? null);
                $birthDate = $fields['birthDate'] ?? ($existing['birth_date'] ?? null);
                $jobTitle = $fields['jobTitle'] ?? ($existing['job_title'] ?? null);
                $skills = json_encode($fields['skills'] ?? (empty($existing['skills_json']) ? [] : json_decode($existing['skills_json'], true)), JSON_UNESCAPED_UNICODE);
                $timeline = json_encode($fields['dailyTimeline'] ?? (empty($existing['timeline_json']) ? [] : json_decode($existing['timeline_json'], true)), JSON_UNESCAPED_UNICODE);
                $avatar = $fields['avatar'] ?? ($existing['avatar'] ?? null);

                if (!empty($fields['username'])) {
                    $newUname = strtolower(trim((string)$fields['username']));
                    if ($newUname !== '' && $newUname !== 'mohusyn' && strtolower($existing['username'] ?? '') !== 'mohusyn') {
                        try {
                            $stmt = $this->pdo->prepare("UPDATE users SET username = ? WHERE id = ?");
                            $stmt->execute([$newUname, $id]);
                        } catch (Exception $eU) {}
                    }
                }

                try {
                    $stmt = $this->pdo->prepare("UPDATE users SET name = ?, phone = ?, email = ?, province = ?, city = ?, birth_date = ?, job_title = ?, skills_json = ?, timeline_json = ?, avatar = ? WHERE id = ?");
                    $stmt->execute([trim((string)$name), $phone, $email, $province, $city, $birthDate, $jobTitle, $skills, $timeline, $avatar, $id]);
                } catch (Exception $eCol) {
                    // Older schema without the avatar column — retry without it
                    $stmt = $this->pdo->prepare("UPDATE users SET name = ?, phone = ?, email = ?, province = ?, city = ?, birth_date = ?, job_title = ?, skills_json = ?, timeline_json = ? WHERE id = ?");
                    $stmt->execute([trim((string)$name), $phone, $email, $province, $city, $birthDate, $jobTitle, $skills, $timeline, $id]);
                }
                if (isset($fields['status'])) {
                    @$this->pdo->prepare("UPDATE users SET status = ? WHERE id = ?")->execute([$fields['status'], $id]);
                }
                if (isset($fields['isVerified'])) {
                    @$this->pdo->prepare("UPDATE users SET is_verified = ? WHERE id = ?")->execute([$fields['isVerified'] ? 1 : 0, $id]);
                }
                if (isset($fields['verificationCode'])) {
                    @$this->pdo->prepare("UPDATE users SET verification_code = ? WHERE id = ?")->execute([strval($fields['verificationCode']), $id]);
                }
                if (isset($fields['baleChatId'])) {
                    @$this->pdo->prepare("UPDATE users SET bale_chat_id = ? WHERE id = ?")->execute([strval($fields['baleChatId']), $id]);
                }
                if (isset($fields['baleUsername'])) {
                    @$this->pdo->prepare("UPDATE users SET bale_username = ? WHERE id = ?")->execute([$fields['baleUsername'], $id]);
                }
                if (isset($fields['baleNotifToken'])) {
                    @$this->pdo->prepare("UPDATE users SET bale_notif_token = ? WHERE id = ?")->execute([strval($fields['baleNotifToken']), $id]);
                }
                if (isset($fields['baleNotificationsEnabled'])) {
                    @$this->pdo->prepare("UPDATE users SET bale_notif_enabled = ? WHERE id = ?")->execute([$fields['baleNotificationsEnabled'] ? 1 : 0, $id]);
                }
                if (!empty($password)) {
                    $hash = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $this->pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
                    $stmt->execute([$hash, $id]);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['users'] as &$u) {
            if ($u['id'] === $id) {
                if (isset($fields['name'])) $u['name'] = trim($fields['name']);
                if (!empty($fields['username']) && strtolower($u['username'] ?? '') !== 'mohusyn' && strtolower($fields['username']) !== 'mohusyn') {
                    $u['username'] = strtolower(trim($fields['username']));
                }
                foreach (['phone', 'email', 'province', 'city', 'birthDate', 'jobTitle', 'avatar', 'baleChatId', 'baleUsername', 'baleNotifToken', 'baleNotificationsEnabled', 'verificationCode', 'isVerified', 'status'] as $k) {
                    if (array_key_exists($k, $fields)) $u[$k] = $fields[$k];
                }
                if (array_key_exists('skills', $fields)) $u['skills'] = is_array($fields['skills']) ? $fields['skills'] : [];
                if (array_key_exists('dailyTimeline', $fields)) $u['dailyTimeline'] = is_array($fields['dailyTimeline']) ? $fields['dailyTimeline'] : [];
                $u['isProfileCompleted'] = true;
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

    public function fixAllUserNumericIds() {
        // Fix in MySQL
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("SELECT id, username, numeric_id, created_at FROM users ORDER BY created_at ASC, id ASC");
                $users = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

                $usedIds = [1000 => true];
                $needsUpdate = [];
                $nextId = 1001;

                // Ensure Mohusyn has 1000
                foreach ($users as $u) {
                    $uname = strtolower(trim((string)($u['username'] ?? '')));
                    $uid = $u['id'];
                    $currNum = isset($u['numeric_id']) ? (int)$u['numeric_id'] : 0;
                    if ($uname === 'mohusyn' || $uid === 'usr_admin_mohusyn') {
                        if ($currNum !== 1000) {
                            $needsUpdate[$uid] = 1000;
                        }
                    }
                }

                // Check other users
                foreach ($users as $u) {
                    $uname = strtolower(trim((string)($u['username'] ?? '')));
                    $uid = $u['id'];
                    if ($uname === 'mohusyn' || $uid === 'usr_admin_mohusyn') continue;

                    $currNum = isset($u['numeric_id']) ? (int)$u['numeric_id'] : 0;
                    if ($currNum <= 1000 || isset($usedIds[$currNum])) {
                        while (isset($usedIds[$nextId])) {
                            $nextId++;
                        }
                        $needsUpdate[$uid] = $nextId;
                        $usedIds[$nextId] = true;
                        $nextId++;
                    } else {
                        $usedIds[$currNum] = true;
                        if ($currNum >= $nextId) {
                            $nextId = $currNum + 1;
                        }
                    }
                }

                if (!empty($needsUpdate)) {
                    $up = $this->pdo->prepare("UPDATE users SET numeric_id = ? WHERE id = ?");
                    foreach ($needsUpdate as $uid => $newNum) {
                        $up->execute([$newNum, $uid]);
                    }
                }
            } catch (Exception $e) {}
        }

        // Fix in JSON
        $this->loadJson();
        if (!empty($this->data['users']) && is_array($this->data['users'])) {
            $usedIds = [1000 => true];
            $nextId = 1001;
            foreach ($this->data['users'] as &$u) {
                $uname = strtolower(trim((string)($u['username'] ?? '')));
                $uid = $u['id'] ?? '';
                if ($uname === 'mohusyn' || $uid === 'usr_admin_mohusyn') {
                    $u['numericId'] = 1000;
                }
            }
            unset($u);

            foreach ($this->data['users'] as &$u) {
                $uname = strtolower(trim((string)($u['username'] ?? '')));
                $uid = $u['id'] ?? '';
                if ($uname === 'mohusyn' || $uid === 'usr_admin_mohusyn') continue;

                $currNum = isset($u['numericId']) ? (int)$u['numericId'] : (isset($u['numeric_id']) ? (int)$u['numeric_id'] : 0);
                if ($currNum <= 1000 || isset($usedIds[$currNum])) {
                    while (isset($usedIds[$nextId])) {
                        $nextId++;
                    }
                    $u['numericId'] = $nextId;
                    $usedIds[$nextId] = true;
                    $nextId++;
                } else {
                    $usedIds[$currNum] = true;
                    $u['numericId'] = $currNum;
                    if ($currNum >= $nextId) {
                        $nextId = $currNum + 1;
                    }
                }
            }
            unset($u);
            $this->saveJson();
        }
    }

    public function getDeletedUserKeys() {
        $keys = [];
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("SELECT id, username FROM deleted_users");
                if ($stmt) {
                    while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        if (!empty($r['id'])) $keys[strtolower(trim($r['id']))] = true;
                        if (!empty($r['username'])) $keys[strtolower(trim($r['username']))] = true;
                    }
                }
            } catch (Exception $e) {}
        }
        $this->loadJson();
        if (!empty($this->data['deleted_users']) && is_array($this->data['deleted_users'])) {
            foreach ($this->data['deleted_users'] as $du) {
                $keys[strtolower(trim((string)$du))] = true;
            }
        }
        return $keys;
    }

    public function deleteUser($id) {
        $id = trim((string)$id);
        if ($id === '') return false;

        // 1. Resolve user first by ID or username or numeric ID
        $user = $this->getUserById($id);
        if (!$user) {
            $user = $this->getUserByUsername($id);
        }
        if (!$user) {
            foreach ($this->getAllUsers() as $u) {
                if ((string)($u['id'] ?? '') === $id ||
                    (string)($u['username'] ?? '') === $id ||
                    (string)($u['numericId'] ?? '') === $id ||
                    (string)($u['numeric_id'] ?? '') === $id) {
                    $user = $u;
                    break;
                }
            }
        }

        $realId = $user ? ($user['id'] ?? $id) : $id;
        $realUsername = $user ? ($user['username'] ?? '') : '';

        // NEVER delete the super-admin!
        if (strtolower($realUsername) === 'mohusyn' || $realId === 'usr_admin_mohusyn') {
            return false;
        }

        $idList = array_values(array_unique(array_filter([$realId, $id, $realUsername])));

        // 2. MySQL cleanup
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                foreach (['tasks', 'career_goals', 'daily_notes', 'personality_results'] as $table) {
                    foreach ($idList as $tid) {
                        $stmt = $this->pdo->prepare("DELETE FROM {$table} WHERE user_id = ?");
                        $stmt->execute([$tid]);
                    }
                }
                foreach (['messages', 'notifications'] as $tbl) {
                    try {
                        foreach ($idList as $tid) {
                            $stmt = $this->pdo->prepare("DELETE FROM {$tbl} WHERE user_id = ? OR sender_id = ? OR receiver_id = ?");
                            $stmt->execute([$tid, $tid, $tid]);
                        }
                    } catch (Exception $eT) {}
                }
                foreach ($idList as $tid) {
                    $stmt = $this->pdo->prepare("DELETE FROM users WHERE (id = ? OR LOWER(username) = LOWER(?)) AND LOWER(username) != 'mohusyn'");
                    $stmt->execute([$tid, $tid]);
                }
                // Record tombstone so peer sync NEVER recreates this user!
                $stmtTomb = $this->pdo->prepare("INSERT INTO deleted_users (id, username, deleted_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE deleted_at = NOW()");
                $stmtTomb->execute([$realId, $realUsername]);
            } catch (Exception $e) {}
        }

        // 3. JSON Storage cleanup
        $this->loadJson();
        $this->data['users'] = array_values(array_filter($this->data['users'] ?? [], function($u) use ($idList) {
            if (strtolower($u['username'] ?? '') === 'mohusyn' || ($u['id'] ?? '') === 'usr_admin_mohusyn') {
                return true;
            }
            $uid = $u['id'] ?? '';
            $uName = strtolower(trim((string)($u['username'] ?? '')));
            foreach ($idList as $delId) {
                if ($uid === $delId || $uName === strtolower($delId)) return false;
            }
            return true;
        }));

        if (!isset($this->data['deleted_users']) || !is_array($this->data['deleted_users'])) {
            $this->data['deleted_users'] = [];
        }
        $this->data['deleted_users'][] = $realId;
        if (!empty($realUsername)) {
            $this->data['deleted_users'][] = strtolower($realUsername);
        }
        $this->data['deleted_users'] = array_values(array_unique($this->data['deleted_users']));

        // Prune related records from JSON
        $this->data['tasks'] = array_values(array_filter($this->data['tasks'] ?? [], function($t) use ($idList) {
            $tUserId = $t['userId'] ?? $t['user_id'] ?? '';
            return !in_array($tUserId, $idList, true);
        }));
        $this->data['goals'] = array_values(array_filter($this->data['goals'] ?? [], function($g) use ($idList) {
            return !in_array($g['userId'] ?? '', $idList, true);
        }));
        $this->data['dailyNotes'] = array_values(array_filter($this->data['dailyNotes'] ?? [], function($n) use ($idList) {
            return !in_array($n['userId'] ?? '', $idList, true);
        }));
        $this->data['personalityResults'] = array_values(array_filter($this->data['personalityResults'] ?? [], function($p) use ($idList) {
            return !in_array($p['userId'] ?? '', $idList, true);
        }));
        $this->data['friendships'] = array_values(array_filter($this->data['friendships'] ?? [], function($f) use ($idList) {
            return !in_array($f['user1Id'] ?? '', $idList, true) && !in_array($f['user2Id'] ?? '', $idList, true);
        }));
        $this->data['friend_requests'] = array_values(array_filter($this->data['friend_requests'] ?? [], function($r) use ($idList) {
            return !in_array($r['fromUserId'] ?? '', $idList, true) && !in_array($r['toUserId'] ?? '', $idList, true);
        }));
        $this->data['messages'] = array_values(array_filter($this->data['messages'] ?? [], function($m) use ($idList) {
            return !in_array($m['senderId'] ?? '', $idList, true) && !in_array($m['receiverId'] ?? '', $idList, true);
        }));
        $this->data['notifications'] = array_values(array_filter($this->data['notifications'] ?? [], function($n) use ($idList) {
            return !in_array($n['userId'] ?? '', $idList, true);
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
                if ($rows !== false) {
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

    public function formatTaskRow($r) {
        if (!$r) return null;
        return [
            'id' => $r['id'],
            'userId' => $r['user_id'] ?? $r['userId'] ?? '',
            'projectId' => $r['project_id'] ?? $r['projectId'] ?? null,
            'title' => $r['title'],
            'description' => $r['description'] ?? '',
            'date' => $r['date'],
            'time' => $r['time'],
            'durationMinutes' => (int)($r['duration_minutes'] ?? $r['durationMinutes'] ?? 0),
            'completed' => !empty($r['completed']),
            'completedAt' => $r['completed_at'] ?? $r['completedAt'] ?? null,
            'priority' => $r['priority'] ?? 'medium',
            'categoryId' => $r['category_id'] ?? $r['categoryId'] ?? 'cat-work',
            'isPinned' => !empty($r['is_pinned'] ?? $r['isPinned']),
            'focusMinutesSpent' => (int)($r['focus_minutes_spent'] ?? $r['focusMinutesSpent'] ?? 0),
            'reasonUncompleted' => $r['reason_uncompleted'] ?? $r['reasonUncompleted'] ?? null,
            'uncompletedCategory' => $r['uncompleted_category'] ?? $r['uncompletedCategory'] ?? null,
            'subtasks' => !empty($r['subtasks_json']) ? (is_array($r['subtasks_json']) ? $r['subtasks_json'] : json_decode($r['subtasks_json'], true)) : ($r['subtasks'] ?? []),
            'createdAt' => $r['created_at'] ?? $r['createdAt'] ?? date('Y-m-d H:i:s'),
        ];
    }

    public function createTask($data) {
        $userId = $data['userId'] ?? $data['user_id'] ?? 'usr_admin_mohusyn';
        $title = trim($data['title']);
        $date = $data['date'] ?? date('Y-m-d');
        $id = !empty($data['id']) ? trim($data['id']) : ('task_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4));

        // 1. MySQL Idempotency and Anti-duplication check:
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                // If task with this ID already exists, return existing
                $checkStmt = $this->pdo->prepare("SELECT * FROM tasks WHERE id = ? LIMIT 1");
                $checkStmt->execute([$id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
                if ($existing) {
                    return $this->formatTaskRow($existing);
                }

                // If identical task for this user with same title & date was created in the last 15 seconds (e.g. multi-server failover retry)
                $dupStmt = $this->pdo->prepare("
                    SELECT * FROM tasks 
                    WHERE user_id = ? AND title = ? AND date = ? 
                      AND created_at >= (NOW() - INTERVAL 15 SECOND)
                    ORDER BY created_at DESC LIMIT 1
                ");
                $dupStmt->execute([$userId, $title, $date]);
                $dup = $dupStmt->fetch(PDO::FETCH_ASSOC);
                if ($dup) {
                    return $this->formatTaskRow($dup);
                }
            } catch (Exception $e) {}
        }

        // 2. JSON check for idempotency & duplicates:
        $this->loadJson();
        if (isset($this->data['tasks']) && is_array($this->data['tasks'])) {
            foreach ($this->data['tasks'] as $t) {
                if (($t['id'] ?? '') === $id) {
                    return $t;
                }
                if (($t['userId'] ?? '') === $userId && ($t['title'] ?? '') === $title && ($t['date'] ?? '') === $date) {
                    $ts = strtotime($t['createdAt'] ?? '');
                    if ($ts && (time() - $ts) < 15) {
                        return $t;
                    }
                }
            }
        }

        $task = [
            'id' => $id,
            'userId' => $userId,
            'projectId' => $data['projectId'] ?? $data['project_id'] ?? null,
            'title' => $title,
            'description' => trim($data['description'] ?? ''),
            'date' => $date,
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
        if (empty($id)) return false;

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $fields = [];
                $params = [];

                if (array_key_exists('title', $data)) {
                    $fields[] = "`title` = ?";
                    $params[] = trim((string)$data['title']);
                }
                if (array_key_exists('description', $data)) {
                    $fields[] = "`description` = ?";
                    $params[] = trim((string)$data['description']);
                }
                if (array_key_exists('completed', $data)) {
                    $fields[] = "`completed` = ?";
                    $val = $data['completed'];
                    $isComp = (!empty($val) && $val !== '0' && $val !== 0 && $val !== 'false');
                    $params[] = $isComp ? 1 : 0;
                    if ($isComp) {
                        $fields[] = "`reason_uncompleted` = NULL";
                        $fields[] = "`uncompleted_category` = NULL";
                    } else {
                        $fields[] = "`completed_at` = NULL";
                    }
                }
                if (array_key_exists('completedAt', $data) || array_key_exists('completed_at', $data)) {
                    $rawDate = $data['completedAt'] ?? ($data['completed_at'] ?? null);
                    if ($rawDate) {
                        $ts = strtotime((string)$rawDate);
                        $formattedDate = $ts ? date('Y-m-d H:i:s', $ts) : date('Y-m-d H:i:s');
                    } else {
                        $formattedDate = null;
                    }
                    $fields[] = "`completed_at` = ?";
                    $params[] = $formattedDate;
                }
                if (array_key_exists('isPinned', $data) || array_key_exists('is_pinned', $data)) {
                    $fields[] = "`is_pinned` = ?";
                    $params[] = !empty($data['isPinned'] ?? $data['is_pinned']) ? 1 : 0;
                }
                if (array_key_exists('priority', $data)) {
                    $fields[] = "`priority` = ?";
                    $params[] = $data['priority'];
                }
                if (array_key_exists('categoryId', $data) || array_key_exists('category_id', $data)) {
                    $fields[] = "`category_id` = ?";
                    $params[] = $data['categoryId'] ?? $data['category_id'];
                }
                if (array_key_exists('projectId', $data) || array_key_exists('project_id', $data)) {
                    $fields[] = "`project_id` = ?";
                    $params[] = $data['projectId'] ?? $data['project_id'];
                }
                if (array_key_exists('date', $data)) {
                    $fields[] = "`date` = ?";
                    $params[] = $data['date'];
                }
                if (array_key_exists('time', $data)) {
                    $fields[] = "`time` = ?";
                    $params[] = $data['time'];
                }
                if (array_key_exists('durationMinutes', $data) || array_key_exists('duration_minutes', $data)) {
                    $fields[] = "`duration_minutes` = ?";
                    $params[] = (int)($data['durationMinutes'] ?? $data['duration_minutes']);
                }
                if (array_key_exists('focusMinutesSpent', $data) || array_key_exists('focus_minutes_spent', $data)) {
                    $fields[] = "`focus_minutes_spent` = ?";
                    $params[] = (int)($data['focusMinutesSpent'] ?? $data['focus_minutes_spent']);
                }
                if (array_key_exists('reasonUncompleted', $data) || array_key_exists('reason_uncompleted', $data)) {
                    $fields[] = "`reason_uncompleted` = ?";
                    $params[] = $data['reasonUncompleted'] ?? $data['reason_uncompleted'];
                }
                if (array_key_exists('uncompletedCategory', $data) || array_key_exists('uncompleted_category', $data)) {
                    $fields[] = "`uncompleted_category` = ?";
                    $params[] = $data['uncompletedCategory'] ?? $data['uncompleted_category'];
                }
                if (array_key_exists('subtasks', $data)) {
                    $fields[] = "`subtasks_json` = ?";
                    $params[] = json_encode($data['subtasks'], JSON_UNESCAPED_UNICODE);
                }

                if (!empty($fields)) {
                    $params[] = $id;
                    $sql = "UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = ?";
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute($params);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        foreach ($this->data['tasks'] as &$t) {
            if ($t['id'] === $id) {
                foreach ($data as $k => $v) {
                    if ($v !== null || in_array($k, ['reasonUncompleted', 'uncompletedCategory', 'projectId', 'completedAt', 'description'])) {
                        $t[$k] = $v;
                    }
                }
                $this->saveJson();
                return true;
            }
        }
        return false;
    }

    public function toggleTask($id, $desiredCompleted = null) {
        $result = null;

        // 1. MySQL direct toggle
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT completed FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if ($row) {
                    if ($desiredCompleted !== null) {
                        $newCompleted = $desiredCompleted ? 1 : 0;
                    } else {
                        $newCompleted = empty($row['completed']) ? 1 : 0;
                    }
                    $completedAt = $newCompleted ? date('Y-m-d H:i:s') : null;
                    $up = $this->pdo->prepare("UPDATE tasks SET completed = ?, completed_at = ?, reason_uncompleted = NULL, uncompleted_category = NULL WHERE id = ?");
                    $up->execute([$newCompleted, $completedAt, $id]);
                    $result = ['completed' => (bool)$newCompleted, 'completedAt' => $completedAt];
                }
            } catch (Exception $e) {}
        }

        // 2. JSON update / fallback
        $this->loadJson();
        foreach ($this->data['tasks'] as &$t) {
            if (strval($t['id']) === strval($id)) {
                if ($result !== null) {
                    $t['completed'] = $result['completed'];
                    $t['completedAt'] = $result['completedAt'];
                } else {
                    if ($desiredCompleted !== null) {
                        $t['completed'] = (bool)$desiredCompleted;
                    } else {
                        $t['completed'] = !empty($t['completed']) ? false : true;
                    }
                    $t['completedAt'] = $t['completed'] ? date('Y-m-d H:i:s') : null;
                    $result = ['completed' => $t['completed'], 'completedAt' => $t['completedAt']];
                }
                if ($t['completed']) {
                    unset($t['reasonUncompleted']);
                    unset($t['uncompletedCategory']);
                }
                $this->saveJson();
                return $result;
            }
        }

        if ($result !== null) {
            return $result;
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

            // 30-minute inactivity rule: If host is alone/empty and offline > 30 minutes (1800s), auto-delete
            $parts = $r['participants'] ?? [];
            $isSingleHostOrEmpty = count($parts) <= 1;
            $createdSec = !empty($r['createdAt']) ? strtotime($r['createdAt']) : 0;
            $lastUpdatedMs = isset($r['lastUpdated']) ? (float)$r['lastUpdated'] : (isset($r['last_updated']) ? (float)$r['last_updated'] : 0);
            $lastActiveSec = $lastUpdatedMs > 0 ? (int)floor($lastUpdatedMs / 1000) : $createdSec;
            $inactiveSec = $now - $lastActiveSec;

            if ($isSingleHostOrEmpty && $inactiveSec > 1800) {
                $modified = true;
                return false;
            }

            // Cap maximum room age (no 24h rooms allowed)
            if ($createdSec > 0 && ($now - $createdSec > 43200)) {
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

    public function deleteAllFocusRooms() {
        // Admin emergency purge: soft-delete EVERY active room (messages kept 10 min
        // per system retention policy, then purged automatically by purgeExpiredDeletedRooms)
        $this->loadJson();
        if (!isset($this->data['focus_rooms'])) return 0;

        $now = time();
        $count = 0;
        foreach ($this->data['focus_rooms'] as &$r) {
            if (!empty($r['isDeleted']) || !empty($r['is_deleted'])) continue;
            $r['isDeleted'] = true;
            $r['is_deleted'] = 1;
            $r['deletedAt'] = $now;
            $r['deleted_at'] = $now;
            $r['isRunning'] = false;
            $r['messages'][] = [
                'id' => 'msg_' . $now . '_' . rand(10, 999),
                'userId' => 'system',
                'userName' => 'سیستم',
                'text' => 'این اتاق توسط مدیر سیستم بسته شد. پیام‌ها طبق سیاست سیستم تا ۱۰ دقیقه نگه‌داری می‌شوند.',
                'timestamp' => date('H:i'),
            ];
            $count++;
        }
        unset($r);

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE focus_rooms SET is_deleted = 1, deleted_at = ?, is_running = 0 WHERE is_deleted = 0");
                $stmt->execute([$now]);
            } catch (Exception $e) {}
        }

        $this->saveJson();
        return $count;
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
        $filterProjects = function($list) use ($userId) {
            if (empty($userId)) return $list;
            return array_values(array_filter($list, function($p) use ($userId) {
                if (($p['creatorId'] ?? '') === $userId) return true;
                $mIds = $p['memberIds'] ?? [];
                if (is_array($mIds) && in_array($userId, $mIds)) return true;
                return false;
            }));
        };

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->query("SELECT id, name, description, color, icon, creator_id as creatorId, creator_name as creatorName, member_ids_json, created_at as createdAt FROM projects ORDER BY created_at DESC");
                $rows = $stmt->fetchAll();
                if ($rows) {
                    $all = array_map(function($p) {
                        $p['memberIds'] = !empty($p['member_ids_json']) ? json_decode($p['member_ids_json'], true) : [];
                        return $p;
                    }, $rows);
                    return $filterProjects($all);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $projects = $this->data['projects'] ?? [];
        return $filterProjects($projects);
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
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
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
        $id = !empty($fontData['id']) ? $fontData['id'] : ('font_' . time() . '_' . substr(bin2hex(random_bytes(2)), 0, 4));
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
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        family = VALUES(family),
                        font_url = VALUES(font_url),
                        data_url = VALUES(data_url),
                        description = VALUES(description)
                ");
                $stmt->execute([$id, $font['name'], $font['family'], $font['fontUrl'], $font['dataUrl'], $font['description']]);
            } catch (Exception $e) {
                // If data_url was too large for MySQL packet, insert with NULL data_url
                try {
                    $stmt = $this->pdo->prepare("
                        INSERT INTO custom_fonts (id, name, family, font_url, data_url, description, created_at)
                        VALUES (?, ?, ?, ?, NULL, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            name = VALUES(name),
                            family = VALUES(family),
                            font_url = VALUES(font_url),
                            description = VALUES(description)
                    ");
                    $stmt->execute([$id, $font['name'], $font['family'], $font['fontUrl'], $font['description']]);
                } catch (Exception $e2) {}
            }
        }

        $this->loadJson();
        if (!isset($this->data['custom_fonts']) || !is_array($this->data['custom_fonts'])) {
            $this->data['custom_fonts'] = [];
        }
        $existingIdx = -1;
        foreach ($this->data['custom_fonts'] as $idx => $cf) {
            if (($cf['id'] ?? '') === $id) {
                $existingIdx = $idx;
                break;
            }
        }
        if ($existingIdx >= 0) {
            $this->data['custom_fonts'][$existingIdx] = $font;
        } else {
            $this->data['custom_fonts'][] = $font;
        }
        $this->saveJson();
        return $font;
    }

    public function deleteCustomFont($id) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("DELETE FROM custom_fonts WHERE id = ?");
                $stmt->execute([$id]);
            } catch (Exception $e) {}
        }
        $this->loadJson();
        if (isset($this->data['custom_fonts']) && is_array($this->data['custom_fonts'])) {
            $this->data['custom_fonts'] = array_values(array_filter($this->data['custom_fonts'], function($f) use ($id) {
                return ($f['id'] ?? '') !== $id;
            }));
            $this->saveJson();
        }
        return true;
    }

    // --- Friend Requests & Network Operations ---
    public function getFriendRequests($userId) {
        $incoming = [];
        $outgoing = [];

        $userObj = $this->getUserById($userId);
        $idList = [$userId];
        if ($userObj) {
            $idList[] = $userObj['id'];
            if (!empty($userObj['username'])) $idList[] = $userObj['username'];
            if (!empty($userObj['numericId'])) $idList[] = (string)$userObj['numericId'];
        }
        $idList = array_values(array_unique(array_filter($idList)));

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $placeholders = implode(',', array_fill(0, count($idList), '?'));
                $stmt = $this->pdo->prepare("
                    SELECT * FROM friend_requests 
                    WHERE to_user_id IN ($placeholders) OR from_user_id IN ($placeholders)
                    ORDER BY created_at DESC
                ");
                $params = array_merge($idList, $idList);
                $stmt->execute($params);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if ($rows !== false) {
                    foreach ($rows as $r) {
                        $item = [
                            'id' => $r['id'],
                            'fromUserId' => $r['from_user_id'],
                            'fromUserName' => $r['from_user_name'],
                            'fromUserUsername' => $r['from_user_username'],
                            'fromUserAvatar' => $r['from_user_avatar'],
                            'toUserId' => $r['to_user_id'],
                            'projectId' => $r['project_id'],
                            'projectName' => $r['project_name'],
                            'status' => $r['status'],
                            'createdAt' => $r['created_at'],
                        ];
                        if (in_array($r['to_user_id'], $idList) && $r['status'] === 'pending') {
                            $incoming[] = $item;
                        }
                        if (in_array($r['from_user_id'], $idList)) {
                            $outgoing[] = $item;
                        }
                    }
                    return ['incoming' => $incoming, 'outgoing' => $outgoing];
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $all = $this->data['friend_requests'] ?? [];
        foreach ($all as $r) {
            $toU = $r['toUserId'] ?? '';
            $fromU = $r['fromUserId'] ?? '';
            if (in_array($toU, $idList) && ($r['status'] ?? '') === 'pending') {
                $incoming[] = $r;
            }
            if (in_array($fromU, $idList)) {
                $outgoing[] = $r;
            }
        }
        return ['incoming' => $incoming, 'outgoing' => $outgoing];
    }

    public function createFriendRequest($data) {
        $id = $data['id'] ?? ('freq_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4));
        $now = date('Y-m-d H:i:s');
        $item = [
            'id' => $id,
            'fromUserId' => $data['fromUserId'],
            'fromUserName' => $data['fromUserName'] ?? '',
            'fromUserUsername' => $data['fromUserUsername'] ?? '',
            'fromUserAvatar' => $data['fromUserAvatar'] ?? null,
            'toUserId' => $data['toUserId'],
            'projectId' => $data['projectId'] ?? null,
            'projectName' => $data['projectName'] ?? null,
            'status' => 'pending',
            'createdAt' => $now,
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO friend_requests 
                    (id, from_user_id, from_user_name, from_user_username, from_user_avatar, to_user_id, project_id, project_name, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $item['id'],
                    $item['fromUserId'],
                    $item['fromUserName'],
                    $item['fromUserUsername'],
                    $item['fromUserAvatar'],
                    $item['toUserId'],
                    $item['projectId'],
                    $item['projectName'],
                    $item['status'],
                    $item['createdAt']
                ]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (!isset($this->data['friend_requests']) || !is_array($this->data['friend_requests'])) {
            $this->data['friend_requests'] = [];
        }
        $this->data['friend_requests'][] = $item;
        $this->saveUsers();

        return $item;
    }

    public function acceptFriendRequest($reqId, $currentUserId) {
        $found = null;
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM friend_requests WHERE id = ? LIMIT 1");
                $stmt->execute([$reqId]);
                $r = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($r) {
                    $found = [
                        'id' => $r['id'],
                        'fromUserId' => $r['from_user_id'],
                        'toUserId' => $r['to_user_id'],
                        'projectId' => $r['project_id'],
                        'projectName' => $r['project_name'],
                    ];
                    $up = $this->pdo->prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?");
                    $up->execute([$reqId]);

                    $this->createFriendship($r['from_user_id'], $currentUserId);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (isset($this->data['friend_requests'])) {
            foreach ($this->data['friend_requests'] as &$fr) {
                if ($fr['id'] === $reqId) {
                    $fr['status'] = 'accepted';
                    if (!$found) $found = $fr;
                    break;
                }
            }
            $this->saveUsers();
        }

        if ($found) {
            $this->createFriendship($found['fromUserId'], $currentUserId);
        }

        return $found;
    }

    public function rejectFriendRequest($reqId, $currentUserId) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("UPDATE friend_requests SET status = 'rejected' WHERE id = ?");
                $stmt->execute([$reqId]);
            } catch (Exception $e) {}
        }
        $this->loadJson();
        if (isset($this->data['friend_requests'])) {
            foreach ($this->data['friend_requests'] as &$fr) {
                if ($fr['id'] === $reqId) {
                    $fr['status'] = 'rejected';
                    break;
                }
            }
            $this->saveUsers();
        }
        return true;
    }

    public function getFriendships($userId) {
        $userObj = $this->getUserById($userId);
        $idList = [$userId];
        if ($userObj) {
            $idList[] = $userObj['id'];
            if (!empty($userObj['username'])) $idList[] = $userObj['username'];
        }
        $idList = array_values(array_unique(array_filter($idList)));

        $friendIds = [];
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $placeholders = implode(',', array_fill(0, count($idList), '?'));
                $stmt = $this->pdo->prepare("
                    SELECT user1_id, user2_id FROM friendships
                    WHERE user1_id IN ($placeholders) OR user2_id IN ($placeholders)
                ");
                $stmt->execute(array_merge($idList, $idList));
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if ($rows !== false) {
                    foreach ($rows as $r) {
                        if (in_array($r['user1_id'], $idList)) $friendIds[] = $r['user2_id'];
                        if (in_array($r['user2_id'], $idList)) $friendIds[] = $r['user1_id'];
                    }
                    return array_values(array_unique($friendIds));
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $list = $this->data['friendships'] ?? [];
        foreach ($list as $f) {
            if (in_array($f['user1Id'] ?? '', $idList)) $friendIds[] = $f['user2Id'];
            if (in_array($f['user2Id'] ?? '', $idList)) $friendIds[] = $f['user1Id'];
        }
        return array_values(array_unique($friendIds));
    }

    public function createFriendship($user1Id, $user2Id) {
        $id = 'fs_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        $now = date('Y-m-d H:i:s');
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    SELECT id FROM friendships 
                    WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
                    LIMIT 1
                ");
                $stmt->execute([$user1Id, $user2Id, $user2Id, $user1Id]);
                if (!$stmt->fetch()) {
                    $ins = $this->pdo->prepare("INSERT INTO friendships (id, user1_id, user2_id, created_at) VALUES (?, ?, ?, ?)");
                    $ins->execute([$id, $user1Id, $user2Id, $now]);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (!isset($this->data['friendships']) || !is_array($this->data['friendships'])) {
            $this->data['friendships'] = [];
        }
        $exists = false;
        foreach ($this->data['friendships'] as $f) {
            if (($f['user1Id'] === $user1Id && $f['user2Id'] === $user2Id) || ($f['user1Id'] === $user2Id && $f['user2Id'] === $user1Id)) {
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $this->data['friendships'][] = [
                'id' => $id,
                'user1Id' => $user1Id,
                'user2Id' => $user2Id,
                'createdAt' => $now,
            ];
            $this->saveUsers();
        }
    }

    public function deleteFriendship($user1Id, $user2Id, $isAdmin = false) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                if ($isAdmin) {
                    $stmt = $this->pdo->prepare("
                        DELETE FROM friendships 
                        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
                           OR user1_id = ? OR user2_id = ?
                    ");
                    $stmt->execute([$user1Id, $user2Id, $user2Id, $user1Id, $user2Id, $user2Id]);
                } else {
                    $stmt = $this->pdo->prepare("
                        DELETE FROM friendships 
                        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
                    ");
                    $stmt->execute([$user1Id, $user2Id, $user2Id, $user1Id]);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (isset($this->data['friendships']) && is_array($this->data['friendships'])) {
            $this->data['friendships'] = array_values(array_filter($this->data['friendships'], function($f) use ($user1Id, $user2Id, $isAdmin) {
                if ($isAdmin) {
                    return !(($f['user1Id'] === $user1Id && $f['user2Id'] === $user2Id) ||
                             ($f['user2Id'] === $user1Id && $f['user1Id'] === $user2Id) ||
                             ($f['user1Id'] === $user2Id) ||
                             ($f['user2Id'] === $user2Id));
                }
                return !(($f['user1Id'] === $user1Id && $f['user2Id'] === $user2Id) ||
                         ($f['user2Id'] === $user1Id && $f['user1Id'] === $user2Id));
            }));
            $this->saveUsers();
        }
    }

    public function addProjectMember($projectId, $memberId) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT member_ids_json FROM projects WHERE id = ? LIMIT 1");
                $stmt->execute([$projectId]);
                $r = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($r) {
                    $mList = !empty($r['member_ids_json']) ? json_decode($r['member_ids_json'], true) : [];
                    if (!is_array($mList)) $mList = [];
                    if (!in_array($memberId, $mList)) {
                        $mList[] = $memberId;
                        $up = $this->pdo->prepare("UPDATE projects SET member_ids_json = ? WHERE id = ?");
                        $up->execute([json_encode($mList, JSON_UNESCAPED_UNICODE), $projectId]);
                    }
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (isset($this->data['projects'])) {
            foreach ($this->data['projects'] as &$p) {
                if ($p['id'] === $projectId) {
                    if (!isset($p['memberIds'])) $p['memberIds'] = [];
                    if (!in_array($memberId, $p['memberIds'])) {
                        $p['memberIds'][] = $memberId;
                    }
                    $this->saveTasks();
                    break;
                }
            }
        }
    }

    public function getNotifications($userId) {
        $userObj = $this->getUserById($userId);
        $idList = [$userId];
        if ($userObj) {
            $idList[] = $userObj['id'];
            if (!empty($userObj['username'])) $idList[] = $userObj['username'];
        }
        $idList = array_values(array_unique(array_filter($idList)));

        $userNotifs = [];
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $placeholders = implode(',', array_fill(0, count($idList), '?'));
                $stmt = $this->pdo->prepare("
                    SELECT * FROM notifications 
                    WHERE user_id IN ($placeholders)
                    ORDER BY created_at DESC
                ");
                $stmt->execute($idList);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if ($rows !== false) {
                    foreach ($rows as $r) {
                        $item = [
                            'id' => $r['id'],
                            'userId' => $r['user_id'],
                            'title' => $r['title'],
                            'message' => $r['message'],
                            'type' => $r['type'],
                            'timestamp' => $r['created_at'],
                            'read' => !empty($r['is_read']),
                        ];
                        if (!empty($r['extra_json'])) {
                            $parsedExtra = json_decode($r['extra_json'], true);
                            if (is_array($parsedExtra)) {
                                $item = array_merge($item, $parsedExtra);
                            }
                        }
                        $userNotifs[] = $item;
                    }
                    return $userNotifs;
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $all = $this->data['notifications'] ?? [];
        foreach ($all as $n) {
            if (in_array($n['userId'] ?? '', $idList)) {
                $userNotifs[] = $n;
            }
        }
        return $userNotifs;
    }

    public function markNotificationRead($userId, $notifId = null) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                if (!empty($notifId)) {
                    $stmt = $this->pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?");
                    $stmt->execute([$userId, $notifId]);
                } else {
                    $stmt = $this->pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
                    $stmt->execute([$userId]);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (isset($this->data['notifications'])) {
            $changed = false;
            foreach ($this->data['notifications'] as &$n) {
                if (($n['userId'] ?? '') === $userId) {
                    if (empty($notifId) || $n['id'] === $notifId) {
                        $n['read'] = true;
                        $changed = true;
                    }
                }
            }
            if ($changed) {
                $this->saveNotifications();
            }
        }
    }

    public function clearNotifications($userId) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
                $stmt->execute([$userId]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (isset($this->data['notifications'])) {
            $this->data['notifications'] = array_values(array_filter($this->data['notifications'], function($n) use ($userId) {
                return ($n['userId'] ?? '') !== $userId;
            }));
            $this->saveNotifications();
        }
    }

    // --- Messaging & Chat Operations (Direct & Project) ---
    public function getDirectMessages($user1Id, $user2Id) {
        $u1 = $this->getUserById($user1Id);
        $u2 = $this->getUserById($user2Id);
        $u1List = [$user1Id];
        $u2List = [$user2Id];
        if ($u1) {
            $u1List[] = $u1['id'];
            if (!empty($u1['username'])) $u1List[] = $u1['username'];
        }
        if ($u2) {
            $u2List[] = $u2['id'];
            if (!empty($u2['username'])) $u2List[] = $u2['username'];
        }
        $u1List = array_values(array_unique(array_filter($u1List)));
        $u2List = array_values(array_unique(array_filter($u2List)));

        $list = [];
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $p1 = implode(',', array_fill(0, count($u1List), '?'));
                $p2 = implode(',', array_fill(0, count($u2List), '?'));
                $sql = "
                    SELECT * FROM messages 
                    WHERE (sender_id IN ($p1) AND receiver_id IN ($p2))
                       OR (sender_id IN ($p2) AND receiver_id IN ($p1))
                    ORDER BY created_at ASC
                ";
                $params = array_merge($u1List, $u2List, $u2List, $u1List);
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if ($rows !== false) {
                    foreach ($rows as $r) {
                        $list[] = [
                            'id' => $r['id'],
                            'senderId' => $r['sender_id'],
                            'senderName' => $r['sender_name'],
                            'senderAvatar' => $r['sender_avatar'],
                            'receiverId' => $r['receiver_id'],
                            'text' => $r['text'],
                            'read' => !empty($r['is_read']),
                            'createdAt' => $r['created_at'],
                        ];
                    }
                    // Mark unread incoming messages as read
                    try {
                        $upSql = "UPDATE messages SET is_read = 1 WHERE receiver_id IN ($p1) AND sender_id IN ($p2) AND is_read = 0";
                        $upStmt = $this->pdo->prepare($upSql);
                        $upStmt->execute(array_merge($u1List, $u2List));
                    } catch (Exception $eUp) {}

                    return $list;
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $all = $this->data['messages'] ?? [];
        $changed = false;
        foreach ($all as &$m) {
            $s = $m['senderId'] ?? '';
            $r = $m['receiverId'] ?? '';
            if ((in_array($s, $u1List) && in_array($r, $u2List)) || (in_array($s, $u2List) && in_array($r, $u1List))) {
                if (in_array($r, $u1List) && empty($m['read'])) {
                    $m['read'] = true;
                    $changed = true;
                }
                $list[] = $m;
            }
        }
        if ($changed) {
            $this->saveMessages();
        }
        return $list;
    }

    public function getAllMessagesAdmin() {
        $this->loadJson();
        $msgs = $this->data['messages'] ?? [];
        $usersMap = [];
        foreach (($this->data['users'] ?? []) as $u) {
            $usersMap[$u['id']] = $u;
        }
        foreach ($msgs as &$m) {
            $sId = $m['senderId'] ?? '';
            $rId = $m['receiverId'] ?? '';
            if (isset($usersMap[$sId])) {
                $m['senderName'] = $usersMap[$sId]['name'] ?? ($m['senderName'] ?? 'کاربر');
                $m['senderUsername'] = $usersMap[$sId]['username'] ?? '';
            }
            if (isset($usersMap[$rId])) {
                $m['receiverName'] = $usersMap[$rId]['name'] ?? 'کاربر';
                $m['receiverUsername'] = $usersMap[$rId]['username'] ?? '';
            }
        }
        return $msgs;
    }

    public function sendDirectMessage($senderUser, $receiverId, $text) {
        $cleanText = trim((string)$text);
        $canonicalReceiver = $this->getUserById($receiverId);
        if (!$canonicalReceiver) {
            $canonicalReceiver = $this->getUserByUsername($receiverId);
        }
        $realReceiverId = $canonicalReceiver ? $canonicalReceiver['id'] : $receiverId;

        $msgId = 'msg_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        $now = date('Y-m-d H:i:s');
        $newMsg = [
            'id' => $msgId,
            'senderId' => $senderUser['id'],
            'senderName' => $senderUser['name'],
            'senderAvatar' => $senderUser['avatar'] ?? null,
            'receiverId' => $realReceiverId,
            'text' => $cleanText,
            'read' => false,
            'createdAt' => $now,
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO messages (id, sender_id, sender_name, sender_avatar, receiver_id, text, is_read, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
                ");
                $stmt->execute([
                    $newMsg['id'],
                    $newMsg['senderId'],
                    $newMsg['senderName'],
                    $newMsg['senderAvatar'],
                    $newMsg['receiverId'],
                    $newMsg['text'],
                    $newMsg['createdAt']
                ]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (!isset($this->data['messages']) || !is_array($this->data['messages'])) {
            $this->data['messages'] = [];
        }
        $this->data['messages'][] = $newMsg;
        $this->saveMessages();

        // In-app notification & Bale alert
        $preview = mb_substr($cleanText, 0, 70) . (mb_strlen($cleanText) > 70 ? '...' : '');
        $this->addNotification(
            $realReceiverId,
            "پیام جدید از {$senderUser['name']} 💬",
            $preview,
            'message',
            [
                'senderId' => $senderUser['id'],
                'senderName' => $senderUser['name'],
            ]
        );

        return $newMsg;
    }

    public function getConversations($userId) {
        $u = $this->getUserById($userId);
        $idList = [$userId];
        if ($u) {
            $idList[] = $u['id'];
            if (!empty($u['username'])) $idList[] = $u['username'];
        }
        $idList = array_values(array_unique(array_filter($idList)));

        $partners = [];
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $p = implode(',', array_fill(0, count($idList), '?'));
                $stmt = $this->pdo->prepare("
                    SELECT * FROM messages 
                    WHERE sender_id IN ($p) OR receiver_id IN ($p)
                    ORDER BY created_at ASC
                ");
                $stmt->execute(array_merge($idList, $idList));
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if ($rows !== false) {
                    foreach ($rows as $r) {
                        $s = $r['sender_id'];
                        $rec = $r['receiver_id'];
                        $pId = in_array($s, $idList) ? $rec : $s;
                        $mItem = [
                            'id' => $r['id'],
                            'senderId' => $s,
                            'senderName' => $r['sender_name'],
                            'senderAvatar' => $r['sender_avatar'],
                            'receiverId' => $rec,
                            'text' => $r['text'],
                            'read' => !empty($r['is_read']),
                            'createdAt' => $r['created_at'],
                        ];
                        if (!isset($partners[$pId])) {
                            $partners[$pId] = ['lastMessage' => $mItem, 'unreadCount' => 0];
                        }
                        $partners[$pId]['lastMessage'] = $mItem;
                        if (in_array($rec, $idList) && empty($r['is_read'])) {
                            $partners[$pId]['unreadCount']++;
                        }
                    }
                }
            } catch (Exception $e) {}
        } else {
            $this->loadJson();
            $all = $this->data['messages'] ?? [];
            foreach ($all as $m) {
                $s = $m['senderId'] ?? '';
                $rec = $m['receiverId'] ?? '';
                if (in_array($s, $idList) || in_array($rec, $idList)) {
                    $pId = in_array($s, $idList) ? $rec : $s;
                    if (!isset($partners[$pId])) {
                        $partners[$pId] = ['lastMessage' => $m, 'unreadCount' => 0];
                    }
                    $partners[$pId]['lastMessage'] = $m;
                    if (in_array($rec, $idList) && empty($m['read'])) {
                        $partners[$pId]['unreadCount']++;
                    }
                }
            }
        }

        $allUsers = $this->getAllUsers();
        $userMap = [];
        foreach ($allUsers as $usr) {
            $userMap[$usr['id']] = $usr;
            if (!empty($usr['username'])) $userMap[$usr['username']] = $usr;
        }

        $res = [];
        foreach ($partners as $pId => $data) {
            $partner = $userMap[$pId] ?? null;
            $res[] = [
                'partnerId' => $partner ? $partner['id'] : $pId,
                'partnerName' => $partner ? $partner['name'] : 'کاربر',
                'partnerUsername' => $partner ? $partner['username'] : '',
                'partnerAvatar' => $partner ? ($partner['avatar'] ?? null) : null,
                'lastMessage' => $data['lastMessage'],
                'unreadCount' => $data['unreadCount'],
            ];
        }
        return $res;
    }

    public function getProjectMessages($projectId) {
        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("SELECT * FROM project_messages WHERE project_id = ? ORDER BY created_at ASC");
                $stmt->execute([$projectId]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if ($rows !== false) {
                    return array_map(function($r) {
                        return [
                            'id' => $r['id'],
                            'projectId' => $r['project_id'],
                            'senderId' => $r['sender_id'],
                            'senderName' => $r['sender_name'],
                            'senderAvatar' => $r['sender_avatar'],
                            'text' => $r['text'],
                            'createdAt' => $r['created_at'],
                        ];
                    }, $rows);
                }
            } catch (Exception $e) {}
        }

        $this->loadJson();
        $all = $this->data['project_messages'] ?? [];
        $list = [];
        foreach ($all as $m) {
            if (($m['projectId'] ?? '') === $projectId) {
                $list[] = $m;
            }
        }
        return $list;
    }

    public function sendProjectMessage($projectId, $senderUser, $text) {
        $msgId = 'pmsg_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4);
        $now = date('Y-m-d H:i:s');
        $cleanText = trim((string)$text);
        $newMsg = [
            'id' => $msgId,
            'projectId' => $projectId,
            'senderId' => $senderUser['id'],
            'senderName' => $senderUser['name'],
            'senderAvatar' => $senderUser['avatar'] ?? null,
            'text' => $cleanText,
            'createdAt' => $now,
        ];

        if ($this->mode === 'mysql' && $this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    INSERT INTO project_messages (id, project_id, sender_id, sender_name, sender_avatar, text, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $newMsg['id'],
                    $newMsg['projectId'],
                    $newMsg['senderId'],
                    $newMsg['senderName'],
                    $newMsg['senderAvatar'],
                    $newMsg['text'],
                    $newMsg['createdAt']
                ]);
            } catch (Exception $e) {}
        }

        $this->loadJson();
        if (!isset($this->data['project_messages']) || !is_array($this->data['project_messages'])) {
            $this->data['project_messages'] = [];
        }
        $this->data['project_messages'][] = $newMsg;
        $this->saveMessages();

        return $newMsg;
    }
}
