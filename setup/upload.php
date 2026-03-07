<?php
/**
 * Secure Image Upload Script with Rate Limiting
 * Place this file in your server's public directory
 */

// ============================================
// CONFIGURATION
// ============================================
define('UPLOAD_DIR',        __DIR__ . '/uploads/');
define('UPLOAD_DIR_IMAGES', __DIR__ . '/uploads/images/');
define('UPLOAD_DIR_PDFS',   __DIR__ . '/uploads/pdfs/');
define('MAX_FILE_SIZE', 100 * 1024 * 1024); // 100MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']);
define('RATE_LIMIT_FILE', __DIR__ . '/rate_limit.json');
define('MAX_UPLOADS_PER_IP', 20); // Max uploads per hour per IP
define('RATE_LIMIT_WINDOW', 3600); // 1 hour in seconds

// CORS Configuration
$allowedOrigins = [
    'https://allpaperpack.gr',
    'https://www.allpaperpack.gr'
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

function validateFile($file) {
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
    
    // Check file extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        $errors[] = 'Invalid file extension';
    }
    
    // Read file content once for all checks
    $content = file_get_contents($file['tmp_name']);
    
    if ($extension === 'pdf') {
        // Validate PDF magic bytes (%PDF-)
        if (substr($content, 0, 5) !== '%PDF-') {
            $errors[] = 'File is not a valid PDF';
        }
        // Block embedded JavaScript in PDFs (common malicious vector)
        if (preg_match('/\/JS\s*(\(|<<)|\/JavaScript\s*(\(|<<)/i', $content)) {
            $errors[] = 'PDF contains prohibited embedded scripts';
        }
    } else {
        // Verify it's actually an image via magic bytes + structure
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            $errors[] = 'File is not a valid image';
        }
    }
    
    // Block PHP/HTML injection in any file type
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

// Create upload subdirectories if they don't exist
foreach ([UPLOAD_DIR, UPLOAD_DIR_IMAGES, UPLOAD_DIR_PDFS] as $dir) {
    if (!file_exists($dir) && !mkdir($dir, 0755, true)) {
        sendResponse(false, 'Failed to create upload directory', null, 500);
    }
}

// Protect uploads/ root — no execution, no listing
$htaccessPath = UPLOAD_DIR . '.htaccess';
if (!file_exists($htaccessPath)) {
    $htaccessContent = "php_flag engine off\n";
    $htaccessContent .= "Options -ExecCGI -Indexes\n";
    $htaccessContent .= "AddType application/octet-stream .php .php3 .php4 .php5 .phtml .pl .py .sh\n";
    file_put_contents($htaccessPath, $htaccessContent);
}

// Protect uploads/pdfs/ — force download, block scripts
$pdfHtaccessPath = UPLOAD_DIR_PDFS . '.htaccess';
if (!file_exists($pdfHtaccessPath)) {
    $pdfHtaccessContent = "php_flag engine off\n";
    $pdfHtaccessContent .= "Options -ExecCGI -Indexes\n";
    $pdfHtaccessContent .= "AddType application/octet-stream .php .php3 .php4 .php5 .phtml .pl .py .sh\n";
    $pdfHtaccessContent .= "AddType application/pdf .pdf\n";
    $pdfHtaccessContent .= "<FilesMatch \"\.pdf$\">\n";
    $pdfHtaccessContent .= "    Header set X-Content-Type-Options \"nosniff\"\n";
    $pdfHtaccessContent .= "</FilesMatch>\n";
    file_put_contents($pdfHtaccessPath, $pdfHtaccessContent);
}

// Protect uploads/images/ — no execution, no listing
$imgHtaccessPath = UPLOAD_DIR_IMAGES . '.htaccess';
if (!file_exists($imgHtaccessPath)) {
    $imgHtaccessContent = "php_flag engine off\n";
    $imgHtaccessContent .= "Options -ExecCGI -Indexes\n";
    $imgHtaccessContent .= "AddType application/octet-stream .php .php3 .php4 .php5 .phtml .pl .py .sh\n";
    file_put_contents($imgHtaccessPath, $imgHtaccessContent);
}

// Check if file was uploaded
if (!isset($_FILES['image'])) {
    sendResponse(false, 'No file uploaded', null, 400);
}

$file = $_FILES['image'];

// Validate the file
$validationErrors = validateFile($file);
if (!empty($validationErrors)) {
    sendResponse(false, implode(', ', $validationErrors), null, 400);
}

// Determine subdirectory and filename prefix based on type
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$isPdf = ($extension === 'pdf');
$prefix = $isPdf ? 'pdf_' : 'img_';
$subDir = $isPdf ? UPLOAD_DIR_PDFS : UPLOAD_DIR_IMAGES;
$subPath = $isPdf ? 'pdfs' : 'images';

$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$sanitizedName = sanitizeFilename($originalName);
$uniqueId = uniqid($prefix, true);
$newFilename = $uniqueId . '_' . substr($sanitizedName, 0, 50) . '.' . $extension;
$uploadPath = $subDir . $newFilename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    sendResponse(false, 'Failed to save uploaded file', null, 500);
}

// Set proper permissions
chmod($uploadPath, 0644);

// Generate URL
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$imageUrl = $protocol . '://' . $host . '/uploads/' . $subPath . '/' . $newFilename;

// Success response
sendResponse(true, 'File uploaded successfully', [
    'filename' => $newFilename,
    'url' => $imageUrl,
    'size' => filesize($uploadPath),
    'type' => mime_content_type($uploadPath)
], 201);
