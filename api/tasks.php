<?php
/**
 * TaskRooz - Tasks Endpoint
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
if (!empty($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
} elseif (!empty($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
} elseif (!empty($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

// Preflight CORS
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: *');
    http_response_code(200);
    exit;
}

function isUserAllowedTaskAccess($currentUser, $task, $db) {
    if (!$task) return false;
    if ($currentUser['role'] === 'admin') return true;
    $tUid = $task['userId'] ?? $task['user_id'] ?? '';
    if ($tUid === $currentUser['id'] || $tUid === ($currentUser['username'] ?? '')) return true;
    $tPid = $task['projectId'] ?? $task['project_id'] ?? '';
    if (!empty($tPid)) {
        $proj = $db->getTeamProject($tPid);
        if ($proj) {
            $mIds = $proj['memberIds'] ?? [];
            if (($proj['creatorId'] ?? '') === $currentUser['id'] || (is_array($mIds) && in_array($currentUser['id'], $mIds))) {
                return true;
            }
        }
    }
    return false;
}

// GET /api/tasks
if ($method === 'GET') {
    $targetUserId = $currentUser['id'];

    if (!empty($_GET['user_id'])) {
        $requestedUserId = trim((string)$_GET['user_id']);
        $isAdmin = ($currentUser['role'] === 'admin');
        $isSelf = ($requestedUserId === $currentUser['id'] || $requestedUserId === ($currentUser['username'] ?? ''));

        if ($isAdmin || $isSelf) {
            $targetUserId = $requestedUserId;
        } else {
            // Strict isolation: non-admins can NEVER view active/private tasks of other users!
            // Only completed tasks can be viewed for public profile stats.
            $isExplicitCompleted = (isset($_GET['completed']) && ((int)$_GET['completed'] === 1 || $_GET['completed'] === 'true' || $_GET['completed'] === '1'));
            if ($isExplicitCompleted) {
                $targetUserId = $requestedUserId;
            } else {
                jsonResponse(['tasks' => []]);
            }
        }
    }

    $date = !empty($_GET['date']) ? $_GET['date'] : null;
    $categoryId = !empty($_GET['category_id']) ? $_GET['category_id'] : null;
    $completed = isset($_GET['completed']) ? (bool)$_GET['completed'] : null;
    $projectId = !empty($_GET['project_id']) ? $_GET['project_id'] : null;

    $tasks = $db->getTasks($targetUserId, $date, $categoryId, $completed, $projectId);
    jsonResponse(['tasks' => $tasks]);
}

// POST /api/tasks -> Create task or quick toggle/delete/update
if ($method === 'POST') {
    $input = getJsonInput();
    $action = $input['action'] ?? $_GET['action'] ?? '';

    // 1. Quick Task Completion Toggle (Dedicated MySQL & database save - NEVER BLOCKED BY VERIFICATION)
    if ($action === 'toggle') {
        $id = $input['id'] ?? $_GET['id'] ?? '';
        if (empty($id)) jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);

        $existing = $db->getTaskById($id);
        if (!isUserAllowedTaskAccess($currentUser, $existing, $db)) {
            jsonResponse(['error' => 'شما مجاز به تغییر وضعیت تسک کاربران دیگر نیستید.'], 403);
        }

        $explicitStatus = array_key_exists('completed', $input) ? (bool)$input['completed'] : (isset($_GET['completed']) ? (bool)$_GET['completed'] : null);
        $res = $db->toggleTask($id, $currentUser['id'], $explicitStatus);
        if ($res) jsonResponse($res);
        jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
    }

    // 2. Task Update (NEVER BLOCKED BY VERIFICATION)
    if ($action === 'update' || $action === 'edit' || ($input['_method'] ?? '') === 'PUT') {
        $id = $input['id'] ?? '';
        if (empty($id)) jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);

        $existing = $db->getTaskById($id);
        if (!isUserAllowedTaskAccess($currentUser, $existing, $db)) {
            jsonResponse(['error' => 'شما مجاز به ویرایش تسک کاربران دیگر نیستید.'], 403);
        }

        $updateData = ['id' => $id];
        $effectiveProjectId = $input['projectId'] ?? $existing['projectId'] ?? $existing['project_id'] ?? null;
        if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
            $updateData['userId'] = $input['userId'];
        } elseif (!empty($input['userId']) && !empty($effectiveProjectId)) {
            $proj = $db->getTeamProject($effectiveProjectId);
            if ($proj) {
                $mIds = $proj['memberIds'] ?? [];
                $allMembers = array_merge([$proj['creatorId'] ?? ''], is_array($mIds) ? $mIds : []);
                if (in_array($currentUser['id'], $allMembers) && in_array($input['userId'], $allMembers)) {
                    $updateData['userId'] = $input['userId'];
                }
            }
        }
        if (array_key_exists('title', $input) && $input['title'] !== null) {
            $updateData['title'] = trim((string)$input['title']);
        }
        if (array_key_exists('description', $input)) {
            $updateData['description'] = (string)$input['description'];
        }
        if (array_key_exists('date', $input) && !empty($input['date'])) {
            $updateData['date'] = $input['date'];
        }
        if (array_key_exists('time', $input)) {
            $updateData['time'] = $input['time'];
        }
        if (array_key_exists('durationMinutes', $input)) {
            $updateData['durationMinutes'] = (int)$input['durationMinutes'];
        }
        if (array_key_exists('priority', $input)) {
            $updateData['priority'] = $input['priority'];
        }
        if (array_key_exists('categoryId', $input)) {
            $updateData['categoryId'] = $input['categoryId'];
        }
        if (array_key_exists('projectId', $input)) {
            $updateData['projectId'] = $input['projectId'];
        }
        if (array_key_exists('isPinned', $input)) {
            $updateData['isPinned'] = !empty($input['isPinned']);
        }
        if (array_key_exists('subtasks', $input)) {
            $updateData['subtasks'] = $input['subtasks'];
        }
        if (array_key_exists('completed', $input)) {
            $updateData['completed'] = !empty($input['completed']);
        }
        if (array_key_exists('completedAt', $input)) {
            $updateData['completedAt'] = $input['completedAt'];
        } elseif (array_key_exists('completed_at', $input)) {
            $updateData['completedAt'] = $input['completed_at'];
        }
        if (array_key_exists('focusMinutesSpent', $input)) {
            $updateData['focusMinutesSpent'] = (int)$input['focusMinutesSpent'];
        }
        if (array_key_exists('reasonUncompleted', $input)) {
            $updateData['reasonUncompleted'] = $input['reasonUncompleted'];
        } elseif (array_key_exists('reason_uncompleted', $input)) {
            $updateData['reasonUncompleted'] = $input['reason_uncompleted'];
        }
        if (array_key_exists('uncompletedCategory', $input)) {
            $updateData['uncompletedCategory'] = $input['uncompletedCategory'];
        } elseif (array_key_exists('uncompleted_category', $input)) {
            $updateData['uncompletedCategory'] = $input['uncompleted_category'];
        }

        $db->updateTask($updateData);
        jsonResponse(['message' => 'تسک به‌روزرسانی شد.']);
    }

    if ($action === 'delete' || $action === 'remove' || ($input['_method'] ?? '') === 'DELETE' || ($_GET['_method'] ?? '') === 'DELETE') {
        $id = $input['id'] ?? $_GET['id'] ?? '';
        if (empty($id)) jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);

        $existing = $db->getTaskById($id);
        if (!isUserAllowedTaskAccess($currentUser, $existing, $db)) {
            jsonResponse(['error' => 'شما مجاز به حذف تسک کاربران دیگر نیستید.'], 403);
        }

        $db->deleteTask($id);
        jsonResponse(['message' => 'تسک با موفقیت حذف شد.']);
    }

    // Creating NEW tasks requires verified user
    requireVerifiedUser();

    $title = trim($input['title'] ?? '');
    $date = trim($input['date'] ?? date('Y-m-d'));

    if (empty($title)) {
        jsonResponse(['error' => 'عنوان تسک الزامی است.'], 400);
    }

    $targetUserId = $currentUser['id'];
    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $targetUserId = $input['userId'];
    } elseif (!empty($input['userId']) && !empty($input['projectId'])) {
        $proj = $db->getTeamProject($input['projectId']);
        if ($proj) {
            $mIds = $proj['memberIds'] ?? [];
            $allMembers = array_merge([$proj['creatorId'] ?? ''], is_array($mIds) ? $mIds : []);
            if (in_array($currentUser['id'], $allMembers) && in_array($input['userId'], $allMembers)) {
                $targetUserId = $input['userId'];
            }
        }
    }
    if (strtolower((string)$targetUserId) === 'mohusyn' || $targetUserId === 'usr_admin_1' || $targetUserId === 'usr_mohusyn_admin') {
        $targetUserId = 'usr_admin_mohusyn';
    }

    $taskData = [
        'id' => !empty($input['id']) ? trim($input['id']) : null,
        'userId' => $targetUserId,
        'title' => $title,
        'description' => $input['description'] ?? '',
        'date' => $date,
        'time' => $input['time'] ?? '',
        'durationMinutes' => (int)($input['durationMinutes'] ?? 0),
        'priority' => in_array($input['priority'] ?? '', ['high', 'medium', 'low']) ? $input['priority'] : 'medium',
        'categoryId' => $input['categoryId'] ?? 'cat-work',
        'projectId' => $input['projectId'] ?? null,
        'isPinned' => !empty($input['isPinned']) ? 1 : 0,
        'subtasks' => !empty($input['subtasks']) ? $input['subtasks'] : [],
    ];

    $created = $db->createTask($taskData);

    // Notify assigned member if assigned to another user
    if (!empty($targetUserId) && $targetUserId !== $currentUser['id']) {
        $projName = '';
        if (!empty($taskData['projectId'])) {
            $p = $db->getTeamProject($taskData['projectId']);
            if ($p) $projName = $p['name'];
        }
        $msg = "تسک «{$title}» " . (!empty($projName) ? "در پروژه «{$projName}» " : '') . "توسط {$currentUser['name']} به شما واگذار شد.";
        $db->addNotification(
            $targetUserId,
            'تخصیص تسک جدید 📋',
            $msg,
            'task',
            ['taskId' => $created['id'], 'projectId' => $created['projectId'] ?? null]
        );
    }

    jsonResponse(['message' => 'تسک با موفقیت اضافه شد.', 'task' => $created], 201);
}

// PUT /api/tasks -> Update task
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $input['id'] ?? '';

    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    $existing = $db->getTaskById($id);
    if (!isUserAllowedTaskAccess($currentUser, $existing, $db)) {
        jsonResponse(['error' => 'شما مجاز به ویرایش تسک کاربران دیگر نیستید.'], 403);
    }

    $updateData = ['id' => $id];
    $effectiveProjectId = $input['projectId'] ?? $existing['projectId'] ?? $existing['project_id'] ?? null;
    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $updateData['userId'] = $input['userId'];
    } elseif (!empty($input['userId']) && !empty($effectiveProjectId)) {
        $proj = $db->getTeamProject($effectiveProjectId);
        if ($proj) {
            $mIds = $proj['memberIds'] ?? [];
            $allMembers = array_merge([$proj['creatorId'] ?? ''], is_array($mIds) ? $mIds : []);
            if (in_array($currentUser['id'], $allMembers) && in_array($input['userId'], $allMembers)) {
                $updateData['userId'] = $input['userId'];
            }
        }
    }
    if (array_key_exists('title', $input) && $input['title'] !== null) {
        $updateData['title'] = trim((string)$input['title']);
    }
    if (array_key_exists('description', $input)) {
        $updateData['description'] = (string)$input['description'];
    }
    if (array_key_exists('date', $input) && !empty($input['date'])) {
        $updateData['date'] = $input['date'];
    }
    if (array_key_exists('time', $input)) {
        $updateData['time'] = $input['time'];
    }
    if (array_key_exists('durationMinutes', $input)) {
        $updateData['durationMinutes'] = (int)$input['durationMinutes'];
    }
    if (array_key_exists('priority', $input)) {
        $updateData['priority'] = $input['priority'];
    }
    if (array_key_exists('categoryId', $input)) {
        $updateData['categoryId'] = $input['categoryId'];
    }
    if (array_key_exists('projectId', $input)) {
        $updateData['projectId'] = $input['projectId'];
    }
    if (array_key_exists('isPinned', $input)) {
        $updateData['isPinned'] = !empty($input['isPinned']);
    }
    if (array_key_exists('subtasks', $input)) {
        $updateData['subtasks'] = $input['subtasks'];
    }
    if (array_key_exists('completed', $input)) {
        $updateData['completed'] = !empty($input['completed']);
    }
    if (array_key_exists('completedAt', $input)) {
        $updateData['completedAt'] = $input['completedAt'];
    } elseif (array_key_exists('completed_at', $input)) {
        $updateData['completedAt'] = $input['completed_at'];
    }
    if (array_key_exists('focusMinutesSpent', $input)) {
        $updateData['focusMinutesSpent'] = (int)$input['focusMinutesSpent'];
    }
    if (array_key_exists('reasonUncompleted', $input)) {
        $updateData['reasonUncompleted'] = $input['reasonUncompleted'];
    } elseif (array_key_exists('reason_uncompleted', $input)) {
        $updateData['reasonUncompleted'] = $input['reason_uncompleted'];
    }
    if (array_key_exists('uncompletedCategory', $input)) {
        $updateData['uncompletedCategory'] = $input['uncompletedCategory'];
    } elseif (array_key_exists('uncompleted_category', $input)) {
        $updateData['uncompletedCategory'] = $input['uncompleted_category'];
    }

    $db->updateTask($updateData);

    if (!empty($updateData['userId']) && $updateData['userId'] !== ($existing['userId'] ?? '') && $updateData['userId'] !== $currentUser['id']) {
        $taskTitle = $updateData['title'] ?? $existing['title'] ?? 'تسک';
        $pId = $updateData['projectId'] ?? $existing['projectId'] ?? null;
        $projName = '';
        if ($pId) {
            $p = $db->getTeamProject($pId);
            if ($p) $projName = $p['name'];
        }
        $msg = "تسک «{$taskTitle}» " . (!empty($projName) ? "در پروژه «{$projName}» " : '') . "توسط {$currentUser['name']} به شما واگذار شد.";
        $db->addNotification(
            $updateData['userId'],
            'تخصیص تسک جدید 📋',
            $msg,
            'task',
            ['taskId' => $id, 'projectId' => $pId]
        );
    }

    jsonResponse(['message' => 'تسک به‌روزرسانی شد.']);
}

// PATCH /api/tasks -> Quick actions (toggle, focus)
if ($method === 'PATCH') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    $action = $_GET['action'] ?? $input['action'] ?? 'toggle';

    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    $existing = $db->getTaskById($id);
    if (!isUserAllowedTaskAccess($currentUser, $existing, $db)) {
        jsonResponse(['error' => 'شما مجاز به عملیات روی تسک کاربران دیگر نیستید.'], 403);
    }

    if ($action === 'toggle') {
        $res = $db->toggleTask($id, $currentUser['id']);
        if ($res) {
            jsonResponse($res);
        } else {
            jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
        }
    }

    if ($action === 'addFocus') {
        $mins = (int)($input['minutes'] ?? 25);
        $db->addFocusMinutes($id, $mins);
        jsonResponse(['message' => 'دقایق تمرکز با موفقیت افزوده شد.']);
    }
}

// DELETE /api/tasks
if ($method === 'DELETE') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    $existing = $db->getTaskById($id);
    if (!isUserAllowedTaskAccess($currentUser, $existing, $db)) {
        jsonResponse(['error' => 'شما مجاز به حذف تسک کاربران دیگر نیستید.'], 403);
    }

    $db->deleteTask($id);
    jsonResponse(['message' => 'تسک با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
