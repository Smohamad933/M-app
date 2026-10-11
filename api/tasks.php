<?php
/**
 * TaskRooz - Tasks Endpoint
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

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

    if ($projectId) {
        $proj = $db->getProjectById($projectId);
        $isMember = $proj && ($proj['creatorId'] === $currentUser['id'] || in_array($currentUser['id'], $proj['memberIds'] ?? []));
        if ($isMember || $currentUser['role'] === 'admin') {
            $targetUserId = null;
        } else {
            jsonResponse(['tasks' => []]);
        }
    }

    $tasks = $db->getTasks($targetUserId, $date, $categoryId, $completed, $projectId);

    // Attach assignedToName
    $allUsers = $db->getAllUsers();
    $userMap = [];
    foreach ($allUsers as $u) {
        $userMap[$u['id']] = $u['name'] ?? $u['username'];
        if (!empty($u['username'])) {
            $userMap[$u['username']] = $u['name'] ?? $u['username'];
        }
    }
    foreach ($tasks as &$t) {
        $assignedId = $t['assignedTo'] ?? $t['assigned_to'] ?? $t['userId'] ?? $t['user_id'] ?? null;
        if ($assignedId && isset($userMap[$assignedId])) {
            $t['assignedToName'] = $userMap[$assignedId];
        }
    }
    unset($t);

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
        $explicitStatus = array_key_exists('completed', $input) ? (bool)$input['completed'] : (isset($_GET['completed']) ? (bool)$_GET['completed'] : null);
        $res = $db->toggleTask($id, $currentUser['id'], $explicitStatus);
        if ($res) jsonResponse($res);
        jsonResponse(['error' => 'تسک پیدا نشد.'], 404);
    }

    // 2. Task Update (NEVER BLOCKED BY VERIFICATION)
    if ($action === 'update' || $action === 'edit' || ($input['_method'] ?? '') === 'PUT') {
        $id = $input['id'] ?? '';
        if (empty($id)) jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);

        if ($currentUser['role'] !== 'admin') {
            $existing = $db->getTaskById($id);
            $proj = !empty($existing['projectId']) ? $db->getProjectById($existing['projectId']) : null;
            $isProjMember = $proj && ($proj['creatorId'] === $currentUser['id'] || in_array($currentUser['id'], $proj['memberIds'] ?? []));
            $isOwner = $existing && (
                ($existing['userId'] ?? $existing['user_id'] ?? '') === $currentUser['id'] ||
                ($existing['assignedTo'] ?? $existing['assigned_to'] ?? '') === $currentUser['id'] ||
                ($existing['createdBy'] ?? $existing['created_by'] ?? '') === $currentUser['id'] ||
                ($existing['userId'] ?? $existing['user_id'] ?? '') === ($currentUser['username'] ?? '')
            );
            if (!$isProjMember && !$isOwner) {
                jsonResponse(['error' => 'شما مجاز به ویرایش تسک کاربران دیگر نیستید.'], 403);
            }
        }

        $updateData = ['id' => $id];
        if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
            $updateData['userId'] = $input['userId'];
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

        if ($currentUser['role'] !== 'admin') {
            $existing = $db->getTaskById($id);
            $proj = !empty($existing['projectId']) ? $db->getProjectById($existing['projectId']) : null;
            $isProjCreator = $proj && ($proj['creatorId'] === $currentUser['id']);
            $isOwner = $existing && (
                ($existing['userId'] ?? $existing['user_id'] ?? '') === $currentUser['id'] ||
                ($existing['createdBy'] ?? $existing['created_by'] ?? '') === $currentUser['id'] ||
                ($existing['userId'] ?? $existing['user_id'] ?? '') === ($currentUser['username'] ?? '')
            );
            if (!$isProjCreator && !$isOwner) {
                jsonResponse(['error' => 'شما مجاز به حذف تسک کاربران دیگر نیستید.'], 403);
            }
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
    $projectId = !empty($input['projectId']) ? trim((string)$input['projectId']) : null;
    $assignedTo = $targetUserId;

    if ($projectId) {
        $proj = $db->getProjectById($projectId);
        $isProjMember = $proj && ($proj['creatorId'] === $currentUser['id'] || in_array($currentUser['id'], $proj['memberIds'] ?? []));
        if ($isProjMember && (!empty($input['userId']) || !empty($input['assignedTo']))) {
            $candidate = trim((string)(!empty($input['assignedTo']) ? $input['assignedTo'] : $input['userId']));
            $targetUserId = $candidate;
            $assignedTo = $candidate;
        }
    }

    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $targetUserId = $input['userId'];
        $assignedTo = !empty($input['assignedTo']) ? $input['assignedTo'] : $targetUserId;
    }

    $taskData = [
        'id' => !empty($input['id']) ? trim($input['id']) : null,
        'userId' => $targetUserId,
        'assignedTo' => $assignedTo,
        'createdBy' => $currentUser['id'],
        'title' => $title,
        'description' => $input['description'] ?? '',
        'date' => $date,
        'time' => $input['time'] ?? '',
        'durationMinutes' => (int)($input['durationMinutes'] ?? 0),
        'priority' => in_array($input['priority'] ?? '', ['high', 'medium', 'low']) ? $input['priority'] : 'medium',
        'categoryId' => $input['categoryId'] ?? 'cat-work',
        'projectId' => $projectId,
        'isPinned' => !empty($input['isPinned']) ? 1 : 0,
        'subtasks' => !empty($input['subtasks']) ? $input['subtasks'] : [],
    ];

    $created = $db->createTask($taskData);

    // Send notification if assigned to a teammate
    if ($targetUserId !== $currentUser['id']) {
        $assignerName = $currentUser['name'] ?? $currentUser['username'] ?? 'هم‌تیمی';
        $db->addNotification(
            $targetUserId,
            'تخصیص تسک تیمی جدید 📋',
            "{$assignerName} تسک «{$title}» را به شما محول کرد."
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

    if ($currentUser['role'] !== 'admin') {
        $existing = $db->getTaskById($id);
        $proj = !empty($existing['projectId']) ? $db->getProjectById($existing['projectId']) : null;
        $isProjMember = $proj && ($proj['creatorId'] === $currentUser['id'] || in_array($currentUser['id'], $proj['memberIds'] ?? []));
        $isOwner = $existing && (
            ($existing['userId'] ?? $existing['user_id'] ?? '') === $currentUser['id'] ||
            ($existing['assignedTo'] ?? $existing['assigned_to'] ?? '') === $currentUser['id'] ||
            ($existing['createdBy'] ?? $existing['created_by'] ?? '') === $currentUser['id'] ||
            ($existing['userId'] ?? $existing['user_id'] ?? '') === ($currentUser['username'] ?? '')
        );
        if (!$isProjMember && !$isOwner) {
            jsonResponse(['error' => 'شما مجاز به ویرایش تسک کاربران دیگر نیستید.'], 403);
        }
    }

    $updateData = ['id' => $id];
    if ($currentUser['role'] === 'admin' && !empty($input['userId'])) {
        $updateData['userId'] = $input['userId'];
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

// PATCH /api/tasks -> Quick actions (toggle, focus)
if ($method === 'PATCH') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? $input['id'] ?? '';
    $action = $_GET['action'] ?? $input['action'] ?? 'toggle';

    if (empty($id)) {
        jsonResponse(['error' => 'شناسه تسک الزامی است.'], 400);
    }

    if ($currentUser['role'] !== 'admin') {
        $existing = $db->getTaskById($id);
        $proj = !empty($existing['projectId']) ? $db->getProjectById($existing['projectId']) : null;
        $isProjMember = $proj && ($proj['creatorId'] === $currentUser['id'] || in_array($currentUser['id'], $proj['memberIds'] ?? []));
        $isOwner = $existing && (
            ($existing['userId'] ?? $existing['user_id'] ?? '') === $currentUser['id'] ||
            ($existing['assignedTo'] ?? $existing['assigned_to'] ?? '') === $currentUser['id'] ||
            ($existing['createdBy'] ?? $existing['created_by'] ?? '') === $currentUser['id'] ||
            ($existing['userId'] ?? $existing['user_id'] ?? '') === ($currentUser['username'] ?? '')
        );
        if (!$isProjMember && !$isOwner) {
            jsonResponse(['error' => 'شما مجاز به تغییر این تسک نیستید.'], 403);
        }
    }

    if ($action === 'toggle') {
        $res = $db->toggleTask($id);
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

    if ($currentUser['role'] !== 'admin') {
        $existing = $db->getTaskById($id);
        $proj = !empty($existing['projectId']) ? $db->getProjectById($existing['projectId']) : null;
        $isProjCreator = $proj && ($proj['creatorId'] === $currentUser['id']);
        $isOwner = $existing && (
            ($existing['userId'] ?? $existing['user_id'] ?? '') === $currentUser['id'] ||
            ($existing['createdBy'] ?? $existing['created_by'] ?? '') === $currentUser['id'] ||
            ($existing['userId'] ?? $existing['user_id'] ?? '') === ($currentUser['username'] ?? '')
        );
        if (!$isProjCreator && !$isOwner) {
            jsonResponse(['error' => 'شما مجاز به حذف تسک کاربران دیگر نیستید.'], 403);
        }
    }

    $db->deleteTask($id);
    jsonResponse(['message' => 'تسک با موفقیت حذف شد.']);
}

jsonResponse(['error' => 'متد درخواست نامعتبر است.'], 405);
