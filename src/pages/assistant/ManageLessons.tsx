import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Video, Building, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  title_ar: string;
}

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  lesson_type: string;
  course_id: string;
  order_index: number;
}

export default function ManageLessons() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    title_ar: '',
    lesson_type: 'online' as 'online' | 'center'
  });

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }
    fetchCourses();
  }, [roleLoading]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, title_ar')
        .order('created_at');

      if (error) throw error;
      setCourses(data || []);
      if (data && data.length > 0) {
        setSelectedCourse(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('order_index');

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleAddLesson = async () => {
    if (!newLesson.title || !newLesson.title_ar) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .insert({
          course_id: selectedCourse,
          title: newLesson.title,
          title_ar: newLesson.title_ar,
          lesson_type: newLesson.lesson_type,
          order_index: lessons.length
        });

      if (error) throw error;

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم إضافة الدرس' : 'Lesson added successfully'
      });

      setNewLesson({ title: '', title_ar: '', lesson_type: 'online' });
      setShowAddForm(false);
      fetchLessons();
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إضافة الدرس' : 'Failed to add lesson',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الدرس؟' : 'Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم حذف الدرس' : 'Lesson deleted successfully'
      });

      fetchLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <h1 className="text-2xl font-bold">{isArabic ? 'إدارة الدروس' : 'Manage Lessons'}</h1>
        </div>

        {/* Course Selector */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <label className="block text-sm font-medium mb-2">{isArabic ? 'اختر الكورس' : 'Select Course'}</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-lg"
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {isArabic ? course.title_ar : course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Add Lesson Button */}
        <Button onClick={() => setShowAddForm(true)} className="mb-6 gap-2">
          <Plus className="h-4 w-4" />
          {isArabic ? 'إضافة درس جديد' : 'Add New Lesson'}
        </Button>

        {/* Add Lesson Form */}
        {showAddForm && (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4">{isArabic ? 'درس جديد' : 'New Lesson'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder={isArabic ? 'عنوان الدرس (إنجليزي)' : 'Lesson Title (English)'}
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
              />
              <Input
                placeholder={isArabic ? 'عنوان الدرس (عربي)' : 'Lesson Title (Arabic)'}
                value={newLesson.title_ar}
                onChange={(e) => setNewLesson({ ...newLesson, title_ar: e.target.value })}
              />
            </div>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lesson_type"
                  checked={newLesson.lesson_type === 'online'}
                  onChange={() => setNewLesson({ ...newLesson, lesson_type: 'online' })}
                />
                <Video className="h-4 w-4" />
                {isArabic ? 'أونلاين' : 'Online'}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lesson_type"
                  checked={newLesson.lesson_type === 'center'}
                  onChange={() => setNewLesson({ ...newLesson, lesson_type: 'center' })}
                />
                <Building className="h-4 w-4" />
                {isArabic ? 'سنتر' : 'Center'}
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddLesson}>{isArabic ? 'إضافة' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
            </div>
          </div>
        )}

        {/* Lessons List */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {lessons.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isArabic ? 'لا توجد دروس بعد' : 'No lessons yet'}
            </div>
          ) : (
            <div className="divide-y">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{index + 1}</span>
                    {lesson.lesson_type === 'online' ? (
                      <Video className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Building className="h-5 w-5 text-green-500" />
                    )}
                    <span className="font-medium">{isArabic ? lesson.title_ar : lesson.title}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLesson(lesson.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}