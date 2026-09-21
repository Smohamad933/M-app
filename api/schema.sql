-- ==============================================================================
-- SQL Schema for TaskRooz (تسک‌روز)
-- Fully compatible with MySQL 5.7+ / 8.0+ and SQLite 3+
-- Author: Mohusyn (Seyyed Mohammad Hossein Sheikholeslami)
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NULL,
    gmail VARCHAR(150) NULL,
    province VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    birth_date VARCHAR(30) NULL,
    job_title VARCHAR(150) NULL,
    skills_json TEXT NULL,
    daily_timeline_json TEXT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(30) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    is_default INT DEFAULT 0
);

-- 3. Tasks Table (with Daily Planner & AI Habit Obstacle Tracking)
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    date VARCHAR(20) NOT NULL, -- YYYY-MM-DD
    time VARCHAR(10) NULL,     -- HH:MM (24-hour)
    duration_minutes INT DEFAULT 0,
    completed INT DEFAULT 0,
    completed_at DATETIME NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    category_id VARCHAR(64) NOT NULL,
    is_pinned INT DEFAULT 0,
    focus_minutes_spent INT DEFAULT 0,
    reason_uncompleted TEXT NULL,
    uncompleted_category VARCHAR(50) NULL, -- procrastination, others_priority, time_shortage, low_energy, distraction, external
    subtasks_json TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Career Goals Table (Week, Month, Q1, H1/H2, Year)
CREATE TABLE IF NOT EXISTS career_goals (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    period VARCHAR(30) NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly'
    progress INT DEFAULT 0,
    target_date VARCHAR(20) NULL,
    completed INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Daily Notes & Habits Table
CREATE TABLE IF NOT EXISTS daily_notes (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    date VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    habits_completed_json TEXT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Personality & Productivity Test Results
CREATE TABLE IF NOT EXISTS personality_results (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    primary_type VARCHAR(100) NOT NULL,
    scores_json TEXT NOT NULL,
    recommendations_json TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Default Categories
INSERT INTO categories (id, name, color, icon, is_default) VALUES
('cat-work', 'کاری و شغلی', '#6366f1', 'Briefcase', 1),
('cat-personal', 'کارهای شخصی', '#10b981', 'User', 1),
('cat-study', 'مطالعه و یادگیری', '#f59e0b', 'BookOpen', 1),
('cat-health', 'ورزش و سلامتی', '#f43f5e', 'Activity', 1),
('cat-shopping', 'خرید و منزل', '#0ea5e9', 'ShoppingCart', 1),
('cat-finance', 'امور مالی', '#8b5cf6', 'CreditCard', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Default Admin User: Mohusyn / Smosh1387
-- Pass hash generated with password_hash('Smosh1387', PASSWORD_DEFAULT)
INSERT INTO users (id, username, password_hash, name, role, created_at)
VALUES (
    'usr_mohusyn_admin',
    'Mohusyn',
    '$2y$10$QxRj1wF/GzB9kLz1uNweqe7N1.rO9m3bLwF2U9i1uNweqe7N1rO9m',
    'سید محمدحسین شیخ‌الاسلامی (Mohusyn)',
    'admin',
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE username=VALUES(username);
