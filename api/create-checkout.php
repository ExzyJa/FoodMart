<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

// Debug: Check if API keys are loaded
if (!$PAYMONGO_SECRET_KEY || !$PAYMONGO_WEBHOOK_SECRET) {
    error_log("ERROR: PayMongo keys not loaded. SECRET_KEY: " . ($PAYMONGO_SECRET_KEY ? "OK" : "MISSING") . ", WEBHOOK_SECRET: " . ($PAYMONGO_WEBHOOK_SECRET ? "OK" : "MISSING"));
    jsonResponse(['message' => 'Server configuration error. Contact support.'], 500);
}

requirePost();

$data = requestData();
$items = is_array($data['items'] ?? null) ? $data['items'] : [];
$catalog = productCatalog();
$lineItems = [];
$total = 0;

foreach ($items as $item) {
    $id = (string) ($item['id'] ?? '');
    $quantity = filter_var($item['quantity'] ?? 0, FILTER_VALIDATE_INT);
    if (!isset($catalog[$id]) || $quantity < 1 || $quantity > 99) {
        jsonResponse(['message' => 'The order contains an invalid product or quantity.'], 422);
    }
    $product = $catalog[$id];
    $lineItems[] = [
        'currency' => 'PHP',
        'amount' => $product['amount'],
        'name' => $product['name'],
        'quantity' => $quantity
    ];
    $total += $product['amount'] * $quantity;
}

if (!$lineItems) jsonResponse(['message' => 'Your cart is empty.'], 422);
$email = filter_var((string) ($data['customer_email'] ?? ''), FILTER_VALIDATE_EMAIL);
if (!$email) jsonResponse(['message' => 'Enter a valid email address.'], 422);

$payload = json_encode(['data' => ['attributes' => [
    'line_items' => $lineItems,
    'payment_method_types' => ['card', 'gcash', 'paymaya'],
    'description' => 'FoodMart order ' . substr((string) ($data['order_number'] ?? 'FoodMart'), 0, 40),
    'send_email_receipt' => true,
    'success_url' => $SITE_URL . '/shop.html?payment=success',
    'cancel_url' => $SITE_URL . '/shop.html?payment=cancelled'
]]]]);

$curl = curl_init('https://api.paymongo.com/v1/checkout_sessions');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Basic ' . base64_encode($PAYMONGO_SECRET_KEY . ':'),
        'Content-Type: application/json',
        'Accept: application/json'
    ],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 20
]);
$response = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);
$result = json_decode((string) $response, true);
$checkoutUrl = $result['data']['attributes']['checkout_url'] ?? null;
if ($status < 200 || $status >= 300 || !$checkoutUrl) {
    jsonResponse(['message' => 'PayMongo could not create the checkout session.'], 502);
}

jsonResponse(['checkout_url' => $checkoutUrl, 'amount' => $total]);