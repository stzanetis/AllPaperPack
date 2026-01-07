import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    url: string;
    size: number;
    type: string;
  };
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string | null> => {
    // Validate file on client side first
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Σφάλμα',
        description: 'Επιτρέπονται μόνο εικόνες JPEG, PNG, WebP και GIF',
        variant: 'destructive',
      });
      return null;
    }

    if (file.size > maxSize) {
      toast({
        title: 'Σφάλμα',
        description: 'Το αρχείο πρέπει να είναι μικρότερο από 5MB',
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Update this URL to your actual server upload endpoint
      const uploadUrl = 'https://yourdomain.com/upload.php';

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      });

      const response = await new Promise<UploadResponse>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || 'Upload failed'));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

      if (response.success && response.data) {
        toast({
          title: 'Επιτυχία',
          description: 'Η εικόνα ανέβηκε επιτυχώς',
        });
        return response.data.url;
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Σφάλμα κατά την ανέβασμα';
      toast({
        title: 'Σφάλμα',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadImage,
    uploading,
    progress,
  };
}
