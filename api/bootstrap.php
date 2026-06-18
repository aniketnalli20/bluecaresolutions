<?php

declare(strict_types=1);

function loadEnv(string $filePath): void
{
    if (!is_file($filePath)) {
        return;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
            continue;
        }

        [$key, $value] = array_map('trim', explode('=', $trimmed, 2));
        $value = trim($value, "\"'");

        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
        putenv($key . '=' . $value);
    }
}

function env(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return (string) $value;
}

function sendCorsHeaders(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

function jsonResponse(array $payload, int $statusCode = 200): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function readJsonBody(): array
{
    $body = file_get_contents('php://input');

    if (!$body) {
        return [];
    }

    $decoded = json_decode($body, true);

    if (!is_array($decoded)) {
        jsonResponse([
            'status' => 'error',
            'message' => 'Invalid JSON payload.',
        ], 400);
    }

    return $decoded;
}

function getPdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env('DB_HOST', '127.0.0.1');
    $port = env('DB_PORT', '3306');
    $dbName = env('DB_NAME', 'bluecare_emr');
    $user = env('DB_USER', 'root');
    $pass = env('DB_PASS', '');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbName);

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $exception) {
        error_log($exception->getMessage());

        jsonResponse([
            'status' => 'error',
            'message' => 'Database connection failed. Check api/.env and import database/schema.sql.',
        ], 500);
    }

    return $pdo;
}

function requireFields(array $payload, array $fields): void
{
    foreach ($fields as $field) {
        if (!array_key_exists($field, $payload) || $payload[$field] === '') {
            jsonResponse([
                'status' => 'error',
                'message' => sprintf('Field "%s" is required.', $field),
            ], 422);
        }
    }
}

function fetchAllAssoc(PDOStatement $statement): array
{
    $rows = $statement->fetchAll();

    return is_array($rows) ? $rows : [];
}

function fetchOneAssoc(PDOStatement $statement): array
{
    $row = $statement->fetch();

    return is_array($row) ? $row : [];
}

function getRouteSegments(): array
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $position = strpos($uri, '/api');

    if ($position === false) {
        return [];
    }

    $resourcePath = substr($uri, $position + 4) ?: '';

    return array_values(array_filter(explode('/', trim($resourcePath, '/'))));
}

function currentDate(): string
{
    return date('Y-m-d');
}

function currentMonthStart(): string
{
    return date('Y-m-01');
}
