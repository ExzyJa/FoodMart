<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
requirePost();

$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_PAYMONGO_SIGNATURE'] ?? '';
$parts = [];
foreach (explode(',', $signature) as $part) {
    $pair = explode('=', $part, 2);
    if (count($pair) === 2) $parts[$pair[0]] = $pair[1];
}
$timestamp = $parts['t'] ?? '';
$provided = $parts['li'] ?? ($parts['te'] ?? '');
$expected = hash_hmac('sha256', $timestamp . '.' . $payload, PAYMONGO_WEBHOOK_SECRET);
if (!$timestamp || !$provided || !hash_equals($expected, $provided) || abs(time() - (int) $timestamp) > 300) {
    jsonResponse(['message' => 'Invalid webhook signature.'], 401);
}

// Save the verified event to a database or order service here.
http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['received' => true]);