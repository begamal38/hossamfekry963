import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ExamImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  isArabic?: boolean;
  /** Optional: ref to an external textarea to listen for paste events */
  pasteTargetRef?: React.RefObject<HTMLTextAreaElement>;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Controlled image upload component for exam questions.
 * Supports direct file upload + clipboard paste.
 * 
 * Features:
 * - File type validation (jpg, png, webp)
 * - File size validation (max 5MB)
 * - Upload preview
 * - Clipboard paste support (Ctrl+V / Cmd+V)
 * - Remove/replace capability
 * - Backward compatible (displays existing URLs)
 */
export function ExamImageUpload({ 
  value, 
  onChange, 
  disabled = false, 
  isArabic = false,
  pasteTargetRef 
}: ExamImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const isExternalUrl = value && !value.includes('exam-images');

  const uploadFile = useCallback(async (file: File) => {
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(isArabic 
        ? 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP' 
        : 'File type not supported. Use JPG, PNG, or WebP');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(isArabic 
        ? 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' 
        : 'File too large. Maximum size is 5MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename with timestamp
      const fileExt = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `question-${timestamp}-${randomId}.${fileExt}`;

      // Upload to exam-images bucket
      const { data, error: uploadError } = await supabase.storage
        .from('exam-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('exam-images')
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError(isArabic 
        ? 'فشل رفع الصورة. حاول مرة أخرى' 
        : 'Failed to upload image. Please try again');
    } finally {
      setUploading(false);
    }
  }, [isArabic, onChange]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await uploadFile(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste events (Ctrl+V / Cmd+V)
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (disabled || uploading) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file);
        }
        return;
      }
    }
  }, [disabled, uploading, uploadFile]);

  // Listen for paste events on the drop zone
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handler = (e: Event) => handlePaste(e as ClipboardEvent);
    dropZone.addEventListener('paste', handler);
    
    return () => {
      dropZone.removeEventListener('paste', handler);
    };
  }, [handlePaste]);

  // Listen for paste events on external textarea (question text field)
  useEffect(() => {
    const textarea = pasteTargetRef?.current;
    if (!textarea) return;

    const handler = (e: Event) => handlePaste(e as ClipboardEvent);
    textarea.addEventListener('paste', handler);
    
    return () => {
      textarea.removeEventListener('paste', handler);
    };
  }, [pasteTargetRef, handlePaste]);

  const handleRemove = async () => {
    // If it's a platform-hosted image, delete from storage
    if (value && value.includes('exam-images')) {
      try {
        // Extract file path from URL
        const urlParts = value.split('/exam-images/');
        if (urlParts[1]) {
          await supabase.storage
            .from('exam-images')
            .remove([urlParts[1]]);
        }
      } catch (err) {
        console.warn('Failed to delete image from storage:', err);
        // Continue anyway - clearing the reference is more important
      }
    }
    onChange('');
    setError(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2" ref={dropZoneRef} tabIndex={0}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload area / Preview */}
      {value ? (
        <div className="relative">
          {/* Image preview */}
          <div className="relative rounded-lg overflow-hidden border bg-muted/50">
            <img
              src={value}
              alt={isArabic ? 'صورة السؤال' : 'Question image'}
              className="w-full max-h-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            
            {/* External URL warning */}
            {isExternalUrl && (
              <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-xs px-2 py-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {isArabic ? 'رابط خارجي - قد لا يعمل' : 'External URL - may not work'}
              </div>
            )}
          </div>

          {/* Remove button */}
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 end-2 h-8 w-8 rounded-full shadow-lg"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* Replace button */}
          {!disabled && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={triggerFileSelect}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 me-1 animate-spin" />
                  {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 me-1" />
                  {isArabic ? 'استبدال الصورة' : 'Replace Image'}
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={disabled || uploading}
          className={cn(
            "w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors",
            "hover:border-primary hover:bg-primary/5",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-destructive bg-destructive/5"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">{isArabic ? 'جاري الرفع...' : 'Uploading...'}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <Clipboard className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">
                {isArabic ? 'اضغط للرفع أو الصق صورة' : 'Click or paste image'}
              </span>
              <span className="text-xs opacity-70">
                Ctrl+V / ⌘+V
              </span>
            </div>
          )}
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
