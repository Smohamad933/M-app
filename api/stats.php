<?php
/**
 * TaskRooz - Stats Endpoint
 */
require_once __DIR__ . '/config.php';

$currentUser = requireAuth();
$isAdmin = ($currentUser['role'] === 'admin');
$targetUserId = $isAdmin && !empty($_GET['user_id']) ? $_GET['user_id'] : ($isAdmin ? null : $currentUser['id']);

$stats = $db->getStats($targetUserId, $isAdmin);
jsonResponse($stats);
