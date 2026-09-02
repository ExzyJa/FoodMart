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
$expected = hash_hmac('sha256', $timestamp . '.' . $payload, $PAYMONGO_WEBHOOK_SECRET);
if (!$timestamp || !$provided || !hash_equals($expected, $provided) || abs(time() - (int) $timestamp) > 300) {
    jsonResponse(['message' => 'Invalid webhook signature.'], 401);
}

$event = json_decode($payload, true);
$type = $event['data']['attributes']['type'] ?? '';

if ($type === 'checkout_session.payment.paid') {
    $checkoutData = $event['data']['attributes']['data'] ?? [];
    $sessionId = $checkoutData['id'] ?? '';
    $paidAmount = $checkoutData['attributes']['line_items'] ?? [];
    $customerEmail = $checkoutData['attributes']['billing']['email']
        ?? $checkoutData['attributes']['customer_email']
        ?? '';

    // Minimal file-based log so you have a record of paid orders.
    // Replace this with a real database insert/update once you have one.
    $logLine = sprintf(
        "[%s] PAID session=%s email=%s\n",
        date('c'),
        $sessionId,
        $customerEmail
    );
    file_put_contents(__DIR__ . '/paid-orders.log', $logLine, FILE_APPEND | LOCK_EX);

    // TODO: once you have a database/order table, look up the order by
    // $sessionId (store it when you create the checkout session) and
    // mark it as paid here instead of / in addition to the log file.
}

http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['received' => true]);