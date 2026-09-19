<?php
require_once __DIR__ . '/config.php';

$currentUser = requireAuth($pdo);
$today = date('Y-m-d');

$userId = $currentUser['role'] === 'admin' && !empty($_GET['user_id']) ? $_GET['user_id'] : ($currentUser['role'] === 'admin' ? null : $currentUser['id']);

$whereUser = $userId ? "WHERE user_id = " . $pdo->quote($userId) : "";
$whereUserAnd = $userId ? "AND user_id = " . $pdo->quote($userId) : "";

// Total tasks
$stmt = $pdo->query("SELECT COUNT(*) FROM tasks $whereUser");
$totalTasks = (int)$stmt->fetchColumn();

// Total completed
$stmt = $pdo->query("SELECT COUNT(*) FROM tasks WHERE completed = 1 $whereUserAnd");
$totalCompleted = (int)$stmt->fetchColumn();

// Today tasks
$stmt = $pdo->query("SELECT COUNT(*) FROM tasks WHERE date = '$today' $whereUserAnd");
$todayTotal = (int)$stmt->fetchColumn();

// Today completed
$stmt = $pdo->query("SELECT COUNT(*) FROM tasks WHERE date = '$today' AND completed = 1 $whereUserAnd");
$todayCompleted = (int)$stmt->fetchColumn();

// Focus minutes
$stmt = $pdo->query("SELECT SUM(focus_minutes_spent) FROM tasks $whereUser");
$focusMinutes = (int)($stmt->fetchColumn() ?: 0);

// Total users (for admin)
$totalUsers = 1;
if ($currentUser['role'] === 'admin') {
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $totalUsers = (int)$stmt->fetchColumn();
}

jsonResponse([
    'totalTasks' => $totalTasks,
    'totalCompleted' => $totalCompleted,
    'overallRate' => $totalTasks > 0 ? round(($totalCompleted / $totalTasks) * 100) : 0,
    'todayTotal' => $todayTotal,
    'todayCompleted' => $todayCompleted,
    'todayRate' => $todayTotal > 0 ? round(($todayCompleted / $todayTotal) * 100) : 0,
    'focusMinutes' => $focusMinutes,
    'totalUsers' => $totalUsers,
]);
