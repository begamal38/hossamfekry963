import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
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
  lessons_count: number | null;
  duration_hours: number | null;
  created_at: string;
}

const GRADE_OPTIONS = [
  { value: 'second_arabic', labelAr: 'ثانية ثانوي - عربي', labelEn: 'Second Secondary - Arabic' },
  { value: 'second_languages', labelAr: 'ثانية ثانوي - لغات', labelEn: 'Second Secondary - Languages' },
  { value: 'third_arabic', labelAr: 'ثالثة ثانوي - عربي', labelEn: 'Third Secondary - Arabic' },
  { value: 'third_languages', labelAr: 'ثالثة ثانوي - لغات', labelEn: 'Third Secondary - Languages' },
];

export default function ManageCourses() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    grade: 'second_arabic',
    price: 0,
    is_free: false,
    duration_hours: 0,
  });

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
      title: '',
      title_ar: '',
      description: '',
      description_ar: '',
      grade: 'second_arabic',
      price: 0,
      is_free: false,
      duration_hours: 0,
    });
    setEditingCourse(null);
    setShowForm(false);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      title_ar: course.title_ar,
      description: course.description || '',
      description_ar: course.description_ar || '',
      grade: course.grade,
      price: course.price || 0,
      is_free: course.is_free || false,
      duration_hours: course.duration_hours || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.title_ar) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء العنوان بالعربي والإنجليزي' : 'Please fill in both Arabic and English titles',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update({
            title: formData.title,
            title_ar: formData.title_ar,
            description: formData.description || null,
            description_ar: formData.description_ar || null,
            grade: formData.grade,
            price: formData.is_free ? 0 : formData.price,
            is_free: formData.is_free,
            duration_hours: formData.duration_hours,
          })
          .eq('id', editingCourse.id);

        if (error) throw error;

        toast({
          title: isArabic ? 'تم بنجاح' : 'Success',
          description: isArabic ? 'تم تحديث الكورس' : 'Course updated successfully'
        });
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert({
            title: formData.title,
            title_ar: formData.title_ar,
            description: formData.description || null,
            description_ar: formData.description_ar || null,
            grade: formData.grade,
            price: formData.is_free ? 0 : formData.price,
            is_free: formData.is_free,
            duration_hours: formData.duration_hours,
            lessons_count: 0,
          });

        if (error) throw error;

        toast({
          title: isArabic ? 'تم بنجاح' : 'Success',
          description: isArabic ? 'تم إضافة الكورس' : 'Course added successfully'
        });
      }

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
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
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
              {editingCourse 
                ? (isArabic ? 'تعديل الكورس' : 'Edit Course')
                : (isArabic ? 'كورس جديد' : 'New Course')
              }
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}
                </label>
                <Input
                  placeholder="Chemistry Course"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Arabic Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}
                </label>
                <Input
                  placeholder="كورس الكيمياء"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                />
              </div>

              {/* English Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'الوصف (إنجليزي)' : 'Description (English)'}
                </label>
                <Input
                  placeholder="Course description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Arabic Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <Input
                  placeholder="وصف الكورس..."
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                />
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'الصف الدراسي' : 'Grade'}
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                >
                  {GRADE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {isArabic ? option.labelAr : option.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
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
                  {isArabic ? 'كورس مجاني' : 'Free Course'}
                </label>
              </div>

              {/* Price */}
              {!formData.is_free && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isArabic ? 'السعر (جنيه)' : 'Price (EGP)'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSubmit}>
                {editingCourse 
                  ? (isArabic ? 'تحديث' : 'Update')
                  : (isArabic ? 'إضافة' : 'Add')
                }
              </Button>
              <Button variant="outline" onClick={resetForm}>
                {isArabic ? 'إلغاء' : 'Cancel'}
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
                {/* Course Header */}
                <div className="bg-primary/5 p-4 border-b border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">
                        {isArabic ? course.title_ar : course.title}
                      </h3>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {getGradeLabel(course.grade)}
                      </Badge>
                    </div>
                    {course.is_free ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        {isArabic ? 'مجاني' : 'Free'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {course.price} {isArabic ? 'ج.م' : 'EGP'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-4">
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 min-h-[2.5rem]">
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
                        onClick={() => handleEdit(course)}
                      >
                        <Pencil className="w-4 h-4" />
                        {isArabic ? 'تعديل' : 'Edit'}
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
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}