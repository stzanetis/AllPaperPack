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

  const uploadFile = async (
    file: File,
    allowedTypes: string[],
    maxSize: number,
    typeErrorMsg: string,
    sizeErrorMsg: string,
  ): Promise<string | null> => {
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Σφάλμα', description: typeErrorMsg, variant: 'destructive' });
      return null;
    }
    if (file.size > maxSize) {
      toast({ title: 'Σφάλμα', description: sizeErrorMsg, variant: 'destructive' });
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadUrl = 'https://allpaperpack.gr/upload.php';

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const response = await new Promise<UploadResponse>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error('Invalid response format')); }
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).message || 'Upload failed')); }
            catch { reject(new Error(`Upload failed with status ${xhr.status}`)); }
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error occurred')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

      if (response.success && response.data) {
        toast({ title: 'Επιτυχία', description: 'Το αρχείο ανέβηκε επιτυχώς' });
        return response.data.url;
      }
      throw new Error(response.message || 'Upload failed');
    } catch (error) {
      toast({
        title: 'Σφάλμα',
        description: error instanceof Error ? error.message : 'Σφάλμα κατά την ανέβασμα',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadPdf = (file: File): Promise<string | null> =>
    uploadFile(
      file,
      ['application/pdf'],
      100 * 1024 * 1024,
      'Επιτρέπονται μόνο αρχεία PDF',
      'Το αρχείο πρέπει να είναι μικρότερο από 100MB',
    );

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

    return uploadFile(
      file,
      allowedTypes,
      maxSize,
      'Επιτρέπονται μόνο εικόνες JPEG, PNG, WebP και GIF',
      'Το αρχείο πρέπει να είναι μικρότερο από 5MB',
    );
  };

  return {
    uploadImage,
    uploadPdf,
    uploading,
    progress,
  };
}
