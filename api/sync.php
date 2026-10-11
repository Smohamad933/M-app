<?php
/**
 * TaskRooz / Bag Time - 12-Hour Offline-First Data Synchronization API
 */
require_once __DIR__ . '/config.php';

$currentUser = getCurrentUser();
if (!$currentUser) {
    jsonResponse(['error' => 'ابتدا وارد حساب کاربری خود شوید.'], 401);
}

$myId = $currentUser['id'];
$isAdmin = ($currentUser['role'] === 'admin');
$method = $_SERVER['REQUEST_METHOD'];
$input = in_array($method, ['POST', 'PUT']) ? getJsonInput() : [];

$dbObj = TaskRoozDB::getInstance();
if (!isset($dbObj->data['tasks'])) $dbObj->data['tasks'] = [];
if (!isset($dbObj->data['categories'])) $dbObj->data['categories'] = [];
if (!isset($dbObj->data['projects'])) $dbObj->data['projects'] = [];

if ($method === 'POST') {
    $actionsList = is_array($input['actions'] ?? null) ? $input['actions'] : (is_array($input['pendingActions'] ?? null) ? $input['pendingActions'] : []);

    foreach ($actionsList as $act) {
        $type = $act['type'] ?? '';
        $data = $act['payload'] ?? $act['data'] ?? [];

        if ($type === 'create_task') {
            $title = trim($data['title'] ?? '');
            if (!empty($title)) {
                $newId = $data['id'] ?? ('task_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 4));
                // Check if already exists
                $exists = false;
                foreach ($dbObj->data['tasks'] as $t) {
                    if ($t['id'] === $newId) { $exists = true; break; }
                }
                if (!$exists) {
                    $newTask = [
                        'id' => $newId,
                        'title' => $title,
                        'description' => $data['description'] ?? '',
                        'completed' => !empty($data['completed']),
                        'date' => $data['date'] ?? date('Y-m-d'),
                        'time' => $data['time'] ?? null,
                        'priority' => $data['priority'] ?? 'medium',
                        'categoryId' => $data['categoryId'] ?? null,
                        'userId' => $myId,
                        'createdAt' => $data['createdAt'] ?? date('Y-m-d H:i:s'),
                    ];
                    $dbObj->data['tasks'][] = $newTask;
                }
            }
        } elseif ($type === 'toggle_task') {
            $taskId = $data['id'] ?? '';
            foreach ($dbObj->data['tasks'] as &$t) {
                if ($t['id'] === $taskId && ($t['userId'] === $myId || $isAdmin)) {
                    $t['completed'] = isset($data['completed']) ? !empty($data['completed']) : empty($t['completed']);
                    if (!empty($t['completed'])) {
                        $t['completedAt'] = date('Y-m-d H:i:s');
                    }
                    break;
                }
            }
        } elseif ($type === 'update_task') {
            $taskId = $data['id'] ?? '';
            foreach ($dbObj->data['tasks'] as &$t) {
                if ($t['id'] === $taskId && ($t['userId'] === $myId || $isAdmin)) {
                    foreach ($data as $k => $v) {
                        if ($k !== 'id' && $k !== 'userId') {
                            $t[$k] = $v;
                        }
                    }
                    break;
                }
            }
        } elseif ($type === 'delete_task') {
            $taskId = $data['id'] ?? '';
            $dbObj->data['tasks'] = array_values(array_filter($dbObj->data['tasks'], function($t) use ($taskId, $myId, $isAdmin) {
                if ($t['id'] === $taskId) {
                    return !($t['userId'] === $myId || $isAdmin);
                }
                return true;
            }));
        }
    }

    $dbObj->saveJson();

    $myTasks = array_values(array_filter($dbObj->data['tasks'], function($t) use ($myId, $isAdmin) {
        return $isAdmin || ($t['userId'] ?? '') === $myId;
    }));

    jsonResponse([
        'status' => 'synced',
        'syncedAt' => date('Y-m-d H:i:s'),
        'serverTimestamp' => time() * 1000,
        'nextMandatorySyncInHours' => 12,
        'syncedActionsCount' => count($actionsList),
        'tasks' => $myTasks,
        'projects' => $dbObj->data['projects'] ?? [],
        'categories' => $dbObj->data['categories'] ?? [],
    ]);
}

// Return current fresh data for user
$myTasks = array_values(array_filter($dbObj->data['tasks'], function($t) use ($myId, $isAdmin) {
    return $isAdmin || ($t['userId'] ?? '') === $myId;
}));

jsonResponse([
    'status' => 'synced',
    'syncedAt' => date('Y-m-d H:i:s'),
    'serverTimestamp' => time() * 1000,
    'nextMandatorySyncInHours' => 12,
    'tasks' => $myTasks,
    'projects' => $dbObj->data['projects'] ?? [],
    'categories' => $dbObj->data['categories'] ?? [],
]);
