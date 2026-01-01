import React, { useState, useRef } from 'react';
import { X, ImagePlus, Loader2, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  grade: string;
  price: number | null;
  is_free: boolean | null;
  duration_hours: number | null;
  thumbnail_url: string | null;
}

interface InlineCourseEditorProps {
  course: Course;
  onSave: () => void;
  onCancel: () => void;
}

const GRADE_OPTIONS = [
  { value: 'second_arabic', labelAr: 'تانية ثانوي - عربي', labelEn: '2nd Secondary - Arabic' },
  { value: 'second_languages', labelAr: 'تانية ثانوي - لغات', labelEn: '2nd Secondary - Languages' },
  { value: 'third_arabic', labelAr: 'تالته ثانوي - عربي', labelEn: '3rd Secondary - Arabic' },
  { value: 'third_languages', labelAr: 'تالته ثانوي - لغات', labelEn: '3rd Secondary - Languages' },
];

export function InlineCourseEditor({ course, onSave, onCancel }: InlineCourseEditorProps) {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const isArabic = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title_ar: course.title_ar,
    description_ar: course.description_ar || '',
    grade: course.grade,
    price: course.price || 0,
    is_free: course.is_free || false,
    duration_hours: course.duration_hours || 0,
    thumbnail_url: course.thumbnail_url || '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course.thumbnail_url || null);
  const [saving, setSaving] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: isArabic ? 'خطأ' : 'Error',
          description: isArabic ? 'حجم الصورة يجب أن يكون أقل من 5 ميجا' : 'Image size must be less than 5MB',
          variant: 'destructive'
        });
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return formData.thumbnail_url || null;
    
    try {
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${course.id}-${Date.now()}.${fileExt}`;
      const filePath = `course-covers/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, thumbnailFile, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return formData.thumbnail_url || null;
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setFormData({ ...formData, thumbnail_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formData.title_ar) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى إدخال عنوان الكورس' : 'Please enter course title',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const thumbnailUrl = await uploadThumbnail();
      
      const { error } = await supabase
        .from('courses')
        .update({
          title: formData.title_ar,
          title_ar: formData.title_ar,
          description: formData.description_ar || null,
          description_ar: formData.description_ar || null,
          grade: formData.grade,
          price: formData.is_free ? 0 : formData.price,
          is_free: formData.is_free,
          duration_hours: formData.duration_hours,
          thumbnail_url: thumbnailUrl,
        })
        .eq('id', course.id);

      if (error) throw error;

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم تحديث الكورس' : 'Course updated'
      });

      onSave();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الكورس' : 'Failed to save course',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-border bg-muted/30 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="gap-1">
          {isArabic ? 'تعديل الكورس' : 'Edit Course'}
        </Badge>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium mb-1 text-muted-foreground">
          {isArabic ? 'عنوان الكورس' : 'Course Title'} *
        </label>
        <Input
          placeholder={isArabic ? 'مثال: كورس كيمياء' : 'e.g. Chemistry Course'}
          value={formData.title_ar}
          onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
          className="text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium mb-1 text-muted-foreground">
          {isArabic ? 'الوصف' : 'Description'}
        </label>
        <Input
          placeholder={isArabic ? 'وصف مختصر...' : 'Short description...'}
          value={formData.description_ar}
          onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
          className="text-sm"
        />
      </div>

      {/* Grade & Duration row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-muted-foreground">
            {isArabic ? 'الصف' : 'Grade'}
          </label>
          <select
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
          >
            {GRADE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {isArabic ? option.labelAr : option.labelEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-muted-foreground">
            {isArabic ? 'المدة (ساعات)' : 'Duration (hours)'}
          </label>
          <Input
            type="number"
            min="0"
            value={formData.duration_hours}
            onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
            className="text-sm"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.is_free}
            onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
            className="w-4 h-4"
          />
          {isArabic ? 'مجاني' : 'Free'}
        </label>
        {!formData.is_free && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              className="w-24 text-sm"
            />
            <span className="text-sm text-muted-foreground">{isArabic ? 'ج.م' : 'EGP'}</span>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      <div className="flex items-center gap-3">
        {thumbnailPreview ? (
          <div className="relative w-20 h-12 rounded overflow-hidden border border-border">
            <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeThumbnail}
              className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-12 rounded border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-muted/50"
          >
            <ImagePlus className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <span className="text-xs text-muted-foreground">
          {isArabic ? 'صورة الغلاف (اختياري)' : 'Cover image (optional)'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={saving} size="sm" className="flex-1">
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {isArabic ? 'جاري الحفظ...' : 'Saving...'}
            </span>
          ) : (
            isArabic ? 'حفظ التغييرات' : 'Save Changes'
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          {isArabic ? 'إلغاء' : 'Cancel'}
        </Button>
      </div>
    </div>
  );
}
