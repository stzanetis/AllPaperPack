# Image Upload Setup Guide

## Server Setup (cPanel)

### 1. Upload PHP Script
1. Log into your cPanel file manager
2. Navigate to `public_html` (or your site's root directory)
3. Upload the `upload.php` file
4. Set file permissions to `644` (read/write for owner, read for others)

### 2. Create Uploads Directory
1. Create a new folder named `uploads` in the same directory as `upload.php`
2. Set folder permissions to `755` (read/write/execute for owner, read/execute for others)
3. The PHP script will automatically create a `.htaccess` file in this folder for security

### 3. Configure Allowed Origins
Edit `upload.php` and update the allowed origins array (around line 17):
```php
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://yourdomain.com', // Replace with your actual domain
];
```

### 4. Test the Upload
You can test the upload with curl:
```bash
curl -X POST -F "image=@test.jpg" https://yourdomain.com/upload.php
```

## Frontend Integration

### 1. Update Upload URL
Edit `src/hooks/use-image-upload.ts` and update the upload URL (line 41):
```typescript
const uploadUrl = 'https://yourdomain.com/upload.php';
```

### 2. Using the ImageUpload Component

In your admin components (ProductManagement, SiteSettingsManagement), replace the image input field with:

```tsx
import { ImageUpload } from '@/components/ImageUpload';

// In your form:
<ImageUpload
  label="Product Image"
  currentImage={editingProduct?.image_path || null}
  onUploadComplete={(url) => {
    // Update your form state with the URL
    // For example, if using FormData:
    setImageUrl(url);
  }}
  onRemove={() => {
    setImageUrl(null);
  }}
/>
```

### Example Integration in ProductManagement:

```tsx
// Add state for image URL
const [imageUrl, setImageUrl] = useState<string | null>(null);

// In your form, replace the image_path input with:
<ImageUpload
  label="Εικόνα Προϊόντος"
  currentImage={editingProduct?.image_path || imageUrl}
  onUploadComplete={(url) => setImageUrl(url)}
  onRemove={() => setImageUrl(null)}
/>

// Add hidden input to include in form submission:
<input type="hidden" name="image_path" value={imageUrl || editingProduct?.image_path || ''} />
```

## Security Features

### Rate Limiting
- Maximum 20 uploads per hour per IP address
- Configurable in `upload.php` (MAX_UPLOADS_PER_IP constant)

### File Validation
- Maximum file size: 5MB
- Allowed types: JPEG, PNG, WebP, GIF
- MIME type verification
- Extension validation
- Image content verification
- Malicious code detection

### Additional Security
- CORS protection
- Unique filename generation
- Sanitized filenames
- Protected uploads directory
- No PHP execution in uploads folder

## Troubleshooting

### Upload fails with "Failed to create upload directory"
- Check folder permissions on server
- Ensure PHP has write permissions

### CORS errors
- Verify your domain is in the `$allowedOrigins` array
- Check that your server supports `.htaccess` files

### Rate limit reached
- Wait 1 hour or increase MAX_UPLOADS_PER_IP
- Delete `rate_limit.json` to reset (not recommended in production)

### File too large
- Increase MAX_FILE_SIZE in `upload.php`
- Check PHP settings: `upload_max_filesize` and `post_max_size` in php.ini

## File Structure

```
public_html/
├── upload.php          # Upload handler script
├── uploads/            # Upload directory (auto-created)
│   └── .htaccess      # Security config (auto-created)
└── rate_limit.json    # Rate limiting data (auto-created)
```

## Important Notes

1. **Backup**: Always backup your files before deployment
2. **Testing**: Test uploads in a staging environment first
3. **Monitoring**: Regularly check the uploads folder size
4. **Cleanup**: Implement a cleanup script for unused images
5. **SSL**: Always use HTTPS in production for security
