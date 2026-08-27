<?php
declare(strict_types=1);

const PAYMONGO_SECRET_KEY = 'sk_test_replace_this_value';
const PAYMONGO_WEBHOOK_SECRET = 'replace_this_webhook_secret';
const SITE_URL = 'https://intern7zsa.com';

function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function requestData(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function requirePost(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['message' => 'POST requests only.'], 405);
    }
}

function productCatalog(): array
{
    return [
        'bananas' => ['name' => 'Fresh Bananas', 'amount' => 10000],
        'biscuits' => ['name' => 'Butter Biscuits', 'amount' => 10000],
        'cucumber' => ['name' => 'Fresh Cucumber', 'amount' => 10000],
        'milk' => ['name' => 'Pure Fresh Milk', 'amount' => 10000],
        'tomatoes' => ['name' => 'Garden Tomatoes', 'amount' => 10000],
        'ketchup' => ['name' => 'Tomato Ketchup', 'amount' => 10000]
    ];
}