-- SQL Schema for TaskRooz (Compatible with SQLite and MySQL)

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(30) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    is_default INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date VARCHAR(20) NOT NULL, -- YYYY-MM-DD
    time VARCHAR(10), -- HH:MM
    duration_minutes INT DEFAULT 0,
    completed INT DEFAULT 0,
    completed_at DATETIME,
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    category_id VARCHAR(50) NOT NULL,
    is_pinned INT DEFAULT 0,
    focus_minutes_spent INT DEFAULT 0,
    subtasks_json TEXT, -- JSON array of subtasks
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Default Admin User (username: admin / password: admin123)
-- Password hash generated with password_hash('admin123', PASSWORD_DEFAULT)
INSERT OR IGNORE INTO users (id, username, password_hash, name, role, created_at)
VALUES (
    'usr_admin_1',
    'admin',
    '$2y$10$wK1Wb7n2cQ8jZ.aK9WfCde0oIge0N4U3z1b3dJ3oXbKjWqZ/hT2K6', -- admin123
    'مدیر سیستم',
    'admin',
    CURRENT_TIMESTAMP
);

-- Default Categories
INSERT OR IGNORE INTO categories (id, name, color, icon, is_default) VALUES
('cat-work', 'کاری و شغلی', '#6366f1', 'Briefcase', 1),
('cat-personal', 'کارهای شخصی', '#10b981', 'User', 1),
('cat-study', 'مطالعه و یادگیری', '#f59e0b', 'BookOpen', 1),
('cat-health', 'ورزش و سلامتی', '#f43f5e', 'Activity', 1),
('cat-shopping', 'خرید و منزل', '#0ea5e9', 'ShoppingCart', 1),
('cat-finance', 'امور مالی', '#8b5cf6', 'CreditCard', 1);
