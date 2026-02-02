import React, { useState, useRef, useCallback } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface QuestionContentInputProps {
  text: string;
  imageUrl: string;
  onTextChange: (text: string) => void;
  onImageChange: (url: string) => void;
  disabled?: boolean;
  isArabic?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Unified input for exam questions.
 * Single field that accepts BOTH text input AND pasted images.
 * - Type text normally
 * - Paste image (Ctrl+V) to upload
 * - Shows image preview inline with text area
 */
export function QuestionContentInput({ 
  text, 
  imageUrl, 
  onTextChange, 
  onImageChange, 
  disabled = false, 
  isArabic = false 
}: QuestionContentInputProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(isArabic 
        ? 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP' 
        : 'File type not supported. Use JPG, PNG, or WebP');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(isArabic 
        ? 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' 
        : 'File too large. Maximum size is 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `question-${timestamp}-${randomId}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('exam-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('exam-images')
        .getPublicUrl(data.path);

      onImageChange(urlData.publicUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError(isArabic 
        ? 'فشل رفع الصورة. حاول مرة أخرى' 
        : 'Failed to upload image. Please try again');
    } finally {
      setUploading(false);
    }
  }, [isArabic, onImageChange]);

  // Handle paste - detect image vs text
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    if (disabled || uploading) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    // Check for image first
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault(); // Prevent default paste behavior
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file);
        }
        return;
      }
    }
    // If no image, let default text paste happen
  }, [disabled, uploading, uploadFile]);

  const handleRemoveImage = async () => {
    if (imageUrl && imageUrl.includes('exam-images')) {
      try {
        const urlParts = imageUrl.split('/exam-images/');
        if (urlParts[1]) {
          await supabase.storage
            .from('exam-images')
            .remove([urlParts[1]]);
        }
      } catch (err) {
        console.warn('Failed to delete image from storage:', err);
      }
    }
    onImageChange('');
    setError(null);
    // Focus back to textarea
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {isArabic ? 'السؤال (نص أو صورة)' : 'Question (text or image)'}
      </label>
      
      <div 
        className={cn(
          "border rounded-lg overflow-hidden transition-colors",
          "focus-within:ring-2 focus-within:ring-primary focus-within:border-primary",
          error && "border-destructive"
        )}
      >
        {/* Image preview - shown above textarea if exists */}
        {imageUrl && (
          <div className="relative bg-muted/30 border-b">
            <img
              src={imageUrl}
              alt={isArabic ? 'صورة السؤال' : 'Question image'}
              className="w-full max-h-40 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 end-2 h-7 w-7 rounded-full shadow-lg"
                onClick={handleRemoveImage}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Uploading indicator */}
        {uploading && (
          <div className="flex items-center justify-center gap-2 py-3 bg-muted/50 border-b">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {isArabic ? 'جاري رفع الصورة...' : 'Uploading image...'}
            </span>
          </div>
        )}

        {/* Unified textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={isArabic 
            ? 'اكتب السؤال هنا أو الصق صورة (Ctrl+V)...' 
            : 'Type question or paste image (Ctrl+V)...'}
          disabled={disabled || uploading}
          rows={3}
          className={cn(
            "w-full px-3 py-2 text-sm resize-none",
            "bg-transparent border-0 outline-none",
            "placeholder:text-muted-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        
        {/* Hint strip */}
        {!imageUrl && !uploading && (
          <div className="flex items-center justify-center gap-2 py-1.5 bg-muted/30 border-t text-xs text-muted-foreground">
            <ImageIcon className="w-3 h-3" />
            <span>{isArabic ? 'الصق صورة مباشرة' : 'Paste image directly'}</span>
            <span className="opacity-60">Ctrl+V</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}