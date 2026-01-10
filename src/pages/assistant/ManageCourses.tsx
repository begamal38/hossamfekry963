import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Clock, Video, ImagePlus, X, ChevronDown, ChevronUp, Loader2, EyeOff } from 'lucide-react';
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

  const fetchCourses = async () => {
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
  };

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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

  // Toggle inline edit for a specific course
  const toggleEdit = (courseId: string) => {
    setEditingCourseId(editingCourseId === courseId ? null : courseId);
  };

  // Handle new course creation only (editing is now inline)
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
        // Auto-translate Arabic to English
        const textsToTranslate: Record<string, string> = {};
        if (formData.title_ar) textsToTranslate.title = formData.title_ar;
        if (formData.description_ar) textsToTranslate.description = formData.description_ar;
        
        const translations = await translateMultiple(textsToTranslate, 'en');
        
        // Create new course with translated English fields
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
            slug: '', // Auto-generated by database trigger
          })
          .select('id, slug')
          .single();

        if (insertError) throw insertError;

        // Upload thumbnail if there's a file
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

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isArabic ? 'إدارة الكورسات' : 'Manage Courses'}</h1>
              <p className="text-muted-foreground text-sm">{isArabic ? 'إضافة وتعديل وحذف الكورسات' : 'Add, edit, and delete courses'}</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isArabic ? 'كورس جديد' : 'New Course'}
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-lg mb-6">
              {isArabic ? 'كورس جديد' : 'New Course'}
            </h3>
            
            <div className="space-y-6">
              {/* Arabic Title - Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  عنوان الكورس <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="مثال: كورس كيمياء تانية ثانوي"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  className="text-lg"
                />
              </div>

              {/* Arabic Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  وصف الكورس
                </label>
                <Input
                  placeholder="وصف مختصر للكورس..."
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  الصف الدراسي
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                >
                  {GRADE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.labelAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  المدة (ساعات)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Is Free */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_free" className="text-sm font-medium">
                  كورس مجاني
                </label>
              </div>

              {/* Price */}
              {!formData.is_free && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    السعر (جنيه)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}

              {/* Course Cover Image */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  صورة غلاف الكورس
                </label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  {thumbnailPreview ? (
                    <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-border">
                      <img 
                        src={thumbnailPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-40 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/50"
                    >
                      <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">
                        اختر صورة
                      </span>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="text-sm text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg border">
                    <p className="font-medium text-foreground">📐 إرشادات رفع صورة الغلاف:</p>
                    <p>• <strong>المقاس المثالي:</strong> 1280×720 بكسل (نسبة 16:9)</p>
                    <p>• <strong>الحجم الأقصى:</strong> 5 ميجابايت</p>
                    <p>• <strong>الصيغ المدعومة:</strong> JPG, PNG, WEBP</p>
                    <p className="text-xs opacity-75">💡 تأكد أن العناصر المهمة في منتصف الصورة</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSubmit} disabled={uploadingImage || isTranslating}>
                {uploadingImage || isTranslating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isTranslating 
                      ? (isArabic ? 'جاري الترجمة...' : 'Translating...') 
                      : (isArabic ? 'جاري الرفع...' : 'Uploading...')}
                  </span>
                ) : (isArabic ? 'إضافة' : 'Add')
                }
              </Button>
              <Button variant="outline" onClick={resetForm}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isArabic ? 'لا توجد كورسات بعد' : 'No courses yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isArabic ? 'ابدأ بإضافة أول كورس' : 'Start by adding your first course'}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'إضافة كورس' : 'Add Course'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                {/* Course Cover Image - Always show cover or fallback */}
                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
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
                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between">
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {getGradeLabel(course.grade)}
                      </Badge>
                      {course.is_hidden && (
                        <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-700 border-amber-500/30">
                          <EyeOff className="w-3 h-3 me-1" />
                          {isArabic ? 'مخفي' : 'Hidden'}
                        </Badge>
                      )}
                    </div>
                    {course.is_free ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        {isArabic ? 'مجاني' : 'Free'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-background/80">
                        {course.price} {isArabic ? 'ج.م' : 'EGP'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg line-clamp-1 mb-2">
                    {isArabic ? course.title_ar : course.title}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
                    {isArabic ? (course.description_ar || 'لا يوجد وصف') : (course.description || 'No description')}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.lessons_count || 0} {isArabic ? 'درس' : 'lessons'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration_hours || 0} {isArabic ? 'ساعة' : 'hours'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => navigate(`/assistant/lessons?course=${course.id}`)}
                    >
                      <Video className="w-4 h-4" />
                      {isArabic ? 'إدارة الحصص' : 'Manage Lessons'}
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => toggleEdit(course.id)}
                      >
                        {editingCourseId === course.id ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            {isArabic ? 'إغلاق' : 'Close'}
                          </>
                        ) : (
                          <>
                            <Pencil className="w-4 h-4" />
                            {isArabic ? 'تعديل' : 'Edit'}
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Inline Editor - expands within the card */}
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
      </main>
    </div>
  );
}