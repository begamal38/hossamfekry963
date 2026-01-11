import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, BookOpen, Clock, Video, ImagePlus, X, ChevronDown, ChevronUp, Loader2, EyeOff, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { InlineCourseEditor } from '@/components/assistant/InlineCourseEditor';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';
import { EmptyState } from '@/components/assistant/EmptyState';
import { FloatingActionButton } from '@/components/assistant/FloatingActionButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Course {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  grade: string;
  price: number | null;
  is_free: boolean | null;
  lessons_count: number | null;
  duration_hours: number | null;
  created_at: string;
  thumbnail_url: string | null;
  slug: string;
  is_hidden?: boolean;
}

const GRADE_OPTIONS = [
  { value: 'second_arabic', labelAr: 'تانية ثانوي - عربي', labelEn: '2nd Secondary - Arabic' },
  { value: 'second_languages', labelAr: 'تانية ثانوي - لغات', labelEn: '2nd Secondary - Languages' },
  { value: 'third_arabic', labelAr: 'تالته ثانوي - عربي', labelEn: '3rd Secondary - Arabic' },
  { value: 'third_languages', labelAr: 'تالته ثانوي - لغات', labelEn: '3rd Secondary - Languages' },
];

export default function ManageCourses() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const { translateMultiple, isTranslating } = useAutoTranslate();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title_ar: '',
    description_ar: '',
    grade: 'second_arabic',
    price: 0,
    is_free: false,
    duration_hours: 0,
    thumbnail_url: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }
    fetchCourses();
  }, [roleLoading]);

  const fetchCourses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحميل الكورسات' : 'Failed to load courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [isArabic, toast]);

  const resetForm = () => {
    setFormData({
      title_ar: '',
      description_ar: '',
      grade: 'second_arabic',
      price: 0,
      is_free: false,
      duration_hours: 0,
      thumbnail_url: '',
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setShowForm(false);
  };

  const handleInlineEditSave = () => {
    setEditingCourseId(null);
    fetchCourses();
  };

  const handleInlineEditCancel = () => {
    setEditingCourseId(null);
  };

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

  const uploadThumbnail = async (courseId: string): Promise<string | null> => {
    if (!thumbnailFile) return formData.thumbnail_url || null;
    
    setUploadingImage(true);
    try {
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${courseId}-${Date.now()}.${fileExt}`;
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
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في رفع الصورة' : 'Failed to upload image',
        variant: 'destructive'
      });
      return formData.thumbnail_url || null;
    } finally {
      setUploadingImage(false);
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

  const toggleEdit = (courseId: string) => {
    setEditingCourseId(editingCourseId === courseId ? null : courseId);
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

    try {
      const textsToTranslate: Record<string, string> = {};
      if (formData.title_ar) textsToTranslate.title = formData.title_ar;
      if (formData.description_ar) textsToTranslate.description = formData.description_ar;
      
      const translations = await translateMultiple(textsToTranslate, 'en');
      
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert({
          title: translations.title || formData.title_ar,
          title_ar: formData.title_ar,
          description: translations.description || formData.description_ar || null,
          description_ar: formData.description_ar || null,
          grade: formData.grade,
          price: formData.is_free ? 0 : formData.price,
          is_free: formData.is_free,
          duration_hours: formData.duration_hours,
          lessons_count: 0,
          slug: '',
        })
        .select('id, slug')
        .single();

      if (insertError) throw insertError;

      if (thumbnailFile && newCourse) {
        const thumbnailUrl = await uploadThumbnail(newCourse.id);
        if (thumbnailUrl) {
          await supabase
            .from('courses')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('id', newCourse.id);
        }
      }

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم إضافة الكورس' : 'Course added'
      });

      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الكورس' : 'Failed to save course',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الكورس؟ سيتم حذف جميع الحصص المرتبطة به.' : 'Are you sure you want to delete this course? All related lessons will be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم حذف الكورس' : 'Course deleted successfully'
      });

      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حذف الكورس' : 'Failed to delete course',
        variant: 'destructive'
      });
    }
  };

  const getGradeLabel = (grade: string) => {
    const option = GRADE_OPTIONS.find(o => o.value === grade);
    return option ? (isArabic ? option.labelAr : option.labelEn) : grade;
  };

  const stats = {
    total: courses.length,
    totalLessons: courses.reduce((sum, c) => sum + (c.lessons_count || 0), 0),
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <PullToRefresh onRefresh={fetchCourses} className="h-[calc(100vh-4rem)] md:h-auto md:overflow-visible">
        <main className="pt-20 sm:pt-24 pb-8">
          <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
            {/* Header */}
            <AssistantPageHeader
              title={isArabic ? 'إدارة الكورسات' : 'Manage Courses'}
              subtitle={`${courses.length} ${isArabic ? 'كورس' : 'courses'}`}
              icon={GraduationCap}
              isRTL={isRTL}
            />

            {/* Status Summary */}
            <StatusSummaryCard
              primaryText={loading ? '...' : `${stats.total} ${isArabic ? 'كورس' : 'Courses'}`}
              secondaryText={`${stats.totalLessons} ${isArabic ? 'حصة في المجموع' : 'total lessons'}`}
              isRTL={isRTL}
              className="mb-4"
            />

            {/* Courses List */}
            {courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={isArabic ? 'لا توجد كورسات بعد' : 'No courses yet'}
                description={isArabic ? 'ابدأ بإضافة أول كورس' : 'Start by adding your first course'}
                actionLabel={isArabic ? 'إضافة كورس' : 'Add Course'}
                onAction={() => setShowForm(true)}
              />
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div 
                    key={course.id} 
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    {/* Course Card Header */}
                    <div className="flex gap-3 p-3 sm:p-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex-shrink-0">
                        <img 
                          src={course.thumbnail_url || '/images/default-course-cover.svg'} 
                          alt={isArabic ? course.title_ar : course.title}
                          className={cn(
                            "w-full h-full object-cover",
                            !course.thumbnail_url && "opacity-60"
                          )}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/default-course-cover.svg';
                          }}
                        />
                      </div>
                      
                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2">
                            {isArabic ? course.title_ar : course.title}
                          </h3>
                          {course.is_hidden && (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-700 border-amber-500/30 flex-shrink-0">
                              <EyeOff className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {getGradeLabel(course.grade)}
                          </Badge>
                          {course.is_free ? (
                            <Badge className="text-[10px] sm:text-xs bg-green-500/10 text-green-600 border-green-500/20">
                              {isArabic ? 'مجاني' : 'Free'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              {course.price} {isArabic ? 'ج.م' : 'EGP'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {course.lessons_count || 0} {isArabic ? 'حصة' : 'lessons'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.duration_hours || 0} {isArabic ? 'ساعة' : 'hrs'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 px-3 sm:px-4 pb-3 sm:pb-4">
                      <Button 
                        size="sm" 
                        className="flex-1 h-9 text-xs sm:text-sm"
                        onClick={() => navigate(`/assistant/lessons?course=${course.id}`)}
                      >
                        <Video className="w-4 h-4 me-1" />
                        {isArabic ? 'الحصص' : 'Lessons'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9"
                        onClick={() => toggleEdit(course.id)}
                      >
                        {editingCourseId === course.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <Pencil className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Inline Editor */}
                    {editingCourseId === course.id && (
                      <InlineCourseEditor
                        course={course}
                        onSave={handleInlineEditSave}
                        onCancel={handleInlineEditCancel}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setShowForm(true)}
        label={isArabic ? 'كورس جديد' : 'New Course'}
      />

      {/* Add Course Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'كورس جديد' : 'New Course'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Arabic Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'عنوان الكورس' : 'Course Title'} <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder={isArabic ? 'مثال: كورس كيمياء تانية ثانوي' : 'e.g., Chemistry Course'}
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'وصف الكورس' : 'Description'}
              </label>
              <Input
                placeholder={isArabic ? 'وصف مختصر للكورس...' : 'Brief description...'}
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              />
            </div>

            {/* Grade & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'الصف الدراسي' : 'Grade'}
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
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'المدة (ساعات)' : 'Duration (hours)'}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Free & Price */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                  className="w-4 h-4"
                />
                {isArabic ? 'كورس مجاني' : 'Free Course'}
              </label>
              {!formData.is_free && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{isArabic ? 'ج.م' : 'EGP'}</span>
                </div>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'صورة الغلاف' : 'Cover Image'}
              </label>
              <div className="flex items-start gap-3">
                {thumbnailPreview ? (
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/50"
                  >
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSubmit} disabled={uploadingImage || isTranslating} className="flex-1">
              {(uploadingImage || isTranslating) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isTranslating ? (isArabic ? 'جاري الترجمة...' : 'Translating...') : (isArabic ? 'جاري الرفع...' : 'Uploading...')}
                </span>
              ) : (isArabic ? 'إضافة' : 'Add')}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
