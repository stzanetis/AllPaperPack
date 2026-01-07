<?php
/**
 * Secure Image Upload Script with Rate Limiting
 * Place this file in your server's public directory
 */

// ============================================
// CONFIGURATION
// ============================================
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'gif']);
define('RATE_LIMIT_FILE', __DIR__ . '/rate_limit.json');
define('MAX_UPLOADS_PER_IP', 20); // Max uploads per hour per IP
define('RATE_LIMIT_WINDOW', 3600); // 1 hour in seconds

// CORS Configuration - Update with your actual domain
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://yourdomain.com', // Replace with your actual domain
];

// ============================================
// SECURITY HEADERS & CORS
// ============================================
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================
// RATE LIMITING
// ============================================
function checkRateLimit($ip) {
    $rateLimitData = [];
    
    if (file_exists(RATE_LIMIT_FILE)) {
        $content = file_get_contents(RATE_LIMIT_FILE);
        $rateLimitData = json_decode($content, true) ?? [];
    }
    
    // Clean old entries
    $currentTime = time();
    $rateLimitData = array_filter($rateLimitData, function($data) use ($currentTime) {
        return ($currentTime - $data['time']) < RATE_LIMIT_WINDOW;
    });
    
    // Check IP limit
    $ipUploads = array_filter($rateLimitData, function($data) use ($ip) {
        return $data['ip'] === $ip;
    });
    
    if (count($ipUploads) >= MAX_UPLOADS_PER_IP) {
        return false;
    }
    
    // Add new entry
    $rateLimitData[] = [
        'ip' => $ip,
        'time' => $currentTime
    ];
    
    // Save updated data
    file_put_contents(RATE_LIMIT_FILE, json_encode($rateLimitData));
    
    return true;
}

// ============================================
// SANITIZATION & VALIDATION
// ============================================
function sanitizeFilename($filename) {
    $filename = basename($filename);
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
    $filename = preg_replace('/\.+/', '.', $filename);
    return $filename;
}

function validateImage($file) {
    $errors = [];
    
    // Check if file was uploaded
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        $errors[] = 'No file uploaded or invalid upload';
        return $errors;
    }
    
    // Check file size
    if ($file['size'] > MAX_FILE_SIZE) {
        $errors[] = 'File size exceeds maximum allowed size (5MB)';
    }
    
    // Check MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, ALLOWED_TYPES)) {
        $errors[] = 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed';
    }
    
    // Check file extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        $errors[] = 'Invalid file extension';
    }
    
    // Verify it's actually an image
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        $errors[] = 'File is not a valid image';
    }
    
    // Additional security check: ensure no PHP code in image
    $content = file_get_contents($file['tmp_name']);
    if (preg_match('/<\?php/i', $content) || preg_match('/<script/i', $content)) {
        $errors[] = 'File contains prohibited content';
    }
    
    return $errors;
}

// ============================================
// RESPONSE HELPER
// ============================================
function sendResponse($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// ============================================
// MAIN UPLOAD LOGIC
// ============================================

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Method not allowed', null, 405);
}

// Get client IP
$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
$clientIp = filter_var($clientIp, FILTER_VALIDATE_IP);

if (!$clientIp) {
    sendResponse(false, 'Invalid client IP', null, 400);
}

// Check rate limit
if (!checkRateLimit($clientIp)) {
    sendResponse(false, 'Rate limit exceeded. Please try again later', null, 429);
}

// Create upload directory if it doesn't exist
if (!file_exists(UPLOAD_DIR)) {
    if (!mkdir(UPLOAD_DIR, 0755, true)) {
        sendResponse(false, 'Failed to create upload directory', null, 500);
    }
}

// Protect upload directory with .htaccess
$htaccessPath = UPLOAD_DIR . '.htaccess';
if (!file_exists($htaccessPath)) {
    $htaccessContent = "php_flag engine off\n";
    $htaccessContent .= "AddType application/octet-stream .php .php3 .php4 .php5 .phtml\n";
    file_put_contents($htaccessPath, $htaccessContent);
}

// Check if file was uploaded
if (!isset($_FILES['image'])) {
    sendResponse(false, 'No file uploaded', null, 400);
}

$file = $_FILES['image'];

// Validate the image
$validationErrors = validateImage($file);
if (!empty($validationErrors)) {
    sendResponse(false, implode(', ', $validationErrors), null, 400);
}

// Generate unique filename
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$sanitizedName = sanitizeFilename($originalName);
$uniqueId = uniqid('img_', true);
$newFilename = $uniqueId . '_' . substr($sanitizedName, 0, 50) . '.' . $extension;
$uploadPath = UPLOAD_DIR . $newFilename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    sendResponse(false, 'Failed to save uploaded file', null, 500);
}

// Set proper permissions
chmod($uploadPath, 0644);

// Generate URL (adjust this based on your domain structure)
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$imageUrl = $protocol . '://' . $host . '/uploads/' . $newFilename;

// Success response
sendResponse(true, 'File uploaded successfully', [
    'filename' => $newFilename,
    'url' => $imageUrl,
    'size' => filesize($uploadPath),
    'type' => mime_content_type($uploadPath)
], 201);
