<?php
/**
 * TaskRooz / Bag Time - Bulk Offline/Online Synchronization Endpoint
 * Handles 12-hour mandatory sync: transmits only lightweight JSON data,
 * saving changes into data/db.json without reloading the application bundle.
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
if (!$currentUser) {
    jsonResponse(['error' => 'ابتدا وارد حساب کاربری خود شوید.'], 401);
}

$myId = $currentUser['id'];
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = getJsonInput();

$dbObj = TaskRoozDB::getInstance();
if (!isset($dbObj->data['tasks'])) $dbObj->data['tasks'] = [];
if (!isset($dbObj->data['projects'])) $dbObj->data['projects'] = [];
if (!isset($dbObj->data['categories'])) $dbObj->data['categories'] = [];

// POST /api/sync.php -> Sync offline changes to server & return latest server state
if ($method === 'POST') {
    $offlineTasks = is_array($input['tasks'] ?? null) ? $input['tasks'] : [];
    $syncedCount = 0;

    if (!empty($offlineTasks)) {
        // Build map of existing tasks by ID
        $existingMap = [];
        foreach ($dbObj->data['tasks'] as $idx => $t) {
            $existingMap[$t['id']] = $idx;
        }

        foreach ($offlineTasks as $task) {
            if (empty($task['id'])) continue;
            // Ensure task belongs to current user
            $task['userId'] = $myId;

            if (isset($existingMap[$task['id']])) {
                // Update existing task
                $idx = $existingMap[$task['id']];
                $dbObj->data['tasks'][$idx] = array_merge($dbObj->data['tasks'][$idx], $task);
            } else {
                // Insert new task created while offline
                $dbObj->data['tasks'][] = $task;
            }
            $syncedCount++;
        }

        $dbObj->saveJson();
    }

    // Return the latest user data
    $myTasks = array_values(array_filter($dbObj->data['tasks'], function($t) use ($myId) {
        return ($t['userId'] ?? '') === $myId;
    }));

    jsonResponse([
        'success' => true,
        'message' => "همگام‌سازی با موفقیت انجام شد ({$syncedCount} مورد به‌روز شد).",
        'syncedAt' => date('Y-m-d H:i:s'),
        'serverTimestamp' => round(microtime(true) * 1000),
        'tasks' => $myTasks,
        'projects' => $db->getAllTeamProjects($myId, false),
    ]);
}

// GET /api/sync.php -> Get current server time and latest snapshot
if ($method === 'GET') {
    $myTasks = array_values(array_filter($dbObj->data['tasks'], function($t) use ($myId) {
        return ($t['userId'] ?? '') === $myId;
    }));

    jsonResponse([
        'serverTimestamp' => round(microtime(true) * 1000),
        'serverTime' => date('Y-m-d H:i:s'),
        'tasks' => $myTasks,
    ]);
}

jsonResponse(['error' => 'متد نامعتبر است.'], 405);
