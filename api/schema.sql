-- ==============================================================================
-- پایگاه داده جامع تسک‌روز (TaskRooz Database Schema)
-- طراحی و توسعه: سید محمدحسین شیخ الاسلامی (Mohusyn)
-- سازگار با MySQL 5.7+ / 8.0+ / MariaDB 10+
-- پشتیبانی کامل از زبان فارسی و کاراکترهای یونیکد (utf8mb4_unicode_ci)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- 1. جدول کاربران (users)
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
  `subscription_json` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skills_json` text COLLATE utf8mb4_unicode_ci,
  `timeline_json` text COLLATE utf8mb4_unicode_ci,
  `avatar` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول دسته‌بندی‌ها (categories)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول تسک‌ها و فعالیت‌های روزانه (tasks)
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

-- 4. جدول اتاق‌های تمرکز زنده (focus_rooms)
CREATE TABLE IF NOT EXISTS `focus_rooms` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `host_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `host_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `focus_duration` int(11) NOT NULL DEFAULT '1500',
  `break_duration` int(11) NOT NULL DEFAULT '300',
  `mode` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'focus',
  `is_running` tinyint(1) NOT NULL DEFAULT '0',
  `time_left` int(11) NOT NULL DEFAULT '1500',
  `last_updated` bigint(20) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` int(11) NOT NULL DEFAULT '0',
  `participants_json` longtext COLLATE utf8mb4_unicode_ci,
  `messages_json` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول پروژه‌های تیمی (projects)
CREATE TABLE IF NOT EXISTS `projects` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#6366f1',
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Folder',
  `creator_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `creator_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_ids_json` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. جدول اهداف و رشد شغلی (career_goals)
CREATE TABLE IF NOT EXISTS `career_goals` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'career',
  `period` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `progress` int(11) NOT NULL DEFAULT '0',
  `target_date` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goal_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. جدول یادداشت‌های روزانه و عادات (daily_notes)
CREATE TABLE IF NOT EXISTS `daily_notes` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_date` (`user_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. جدول تست تیپ شخصیتی (personality_results)
CREATE TABLE IF NOT EXISTS `personality_results` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `primary_type` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scores_json` text COLLATE utf8mb4_unicode_ci,
  `recommendations_json` text COLLATE utf8mb4_unicode_ci,
  `completed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_personality` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. جدول تنظیمات سراسری سیستم (global_settings)
CREATE TABLE IF NOT EXISTS `global_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `settings_json` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. جدول فونت‌های سفارشی آپلود شده (custom_fonts)
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

-- ==============================================================================
-- درج اطلاعات پایه و ادمین کل سیستم: Mohusyn / Smosh1387
-- ==============================================================================

-- ثبت ادمین کل Mohusyn / Smosh1387
INSERT INTO `users` (`id`, `username`, `password_hash`, `name`, `role`, `created_at`)
VALUES (
  'usr_admin_mohusyn',
  'Mohusyn',
  '$2y$10$w82p41K8L57LhD75vjXF5.67wM0790F8e3d8m2o7i9.7424vJ8h16',
  'سید محمدحسین شیخ الاسلامی (Mohusyn)',
  'admin',
  NOW()
)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `role` = 'admin';

-- دسته‌بندی‌های پیش‌فرض
INSERT INTO `categories` (`id`, `name`, `color`, `icon`, `is_default`) VALUES
('cat-work', 'کاری و شغلی', '#6366f1', 'Briefcase', 1),
('cat-personal', 'کارهای شخصی', '#10b981', 'User', 1),
('cat-study', 'مطالعه و یادگیری', '#f59e0b', 'BookOpen', 1),
('cat-health', 'ورزش و سلامتی', '#f43f5e', 'Activity', 1),
('cat-shopping', 'خرید و منزل', '#0ea5e9', 'ShoppingCart', 1),
('cat-finance', 'امور مالی', '#8b5cf6', 'CreditCard', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- تنظیمات اولیه سراسری
INSERT INTO `global_settings` (`id`, `settings_json`, `updated_at`)
VALUES (
  1,
  '{\"broadcastNotice\":{\"enabled\":true,\"title\":\"خوش‌آمدید به سامانه تسک‌روز\",\"message\":\"سامانه متمرکز برنامه‌ریزی روزانه، پومودورو تیمی و پایش بهره‌وری آماده استفاده است.\",\"type\":\"info\"},\"enforcedFont\":\"vazirmatn\",\"defaultDailyFocusMinutes\":90,\"workHoursPolicy\":{\"start\":\"08:30\",\"end\":\"17:00\"},\"roomPolicy\":{\"allowUserRoomCreation\":true,\"allowPublicChat\":true},\"dailyMantra\":\"تمرکز پیوسته بر کارهای با اولویت بالا و پرهیز از چندوظیفگی\"}',
  NOW()
)
ON DUPLICATE KEY UPDATE `settings_json` = VALUES(`settings_json`);

SET FOREIGN_KEY_CHECKS=1;
