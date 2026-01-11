import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useImageUpload } from '@/hooks/use-image-upload';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImage?: string | null;
  onRemove?: () => void;
  label?: string;
  className?: string;
}

export function ImageUpload({
  onUploadComplete,
  currentImage,
  onRemove,
  label = 'Ανέβασμα Εικόνας',
  className = '',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading, progress } = useImageUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    const url = await uploadImage(file);
    if (url) {
      onUploadComplete(url);
    } else {
      // Reset preview if upload failed
      setPreview(currentImage || null);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-sm font-medium ml-2">{label}</label>
      
      <div className="flex flex-col gap-3">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-3xl border"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Αλλαγή
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Αφαίρεση
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Κλικ για ανέβασμα εικόνας
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP ή GIF (μέγιστο 5MB)
            </p>
          </div>
        )}

        <Input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              Ανέβασμα... {progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
