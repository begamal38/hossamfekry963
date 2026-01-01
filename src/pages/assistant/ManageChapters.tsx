import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, BookOpen, ChevronRight, GripVertical, Layers, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  title_ar: string;
}

interface Chapter {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  order_index: number;
  course_id: string;
  lessons_count?: number;
}

export default function ManageChapters() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL, language } = useLanguage();
  const { translateText, isTranslating } = useAutoTranslate();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  
  // Simplified form - Arabic only
  const [formData, setFormData] = useState({
    title_ar: '',
    order_index: 0,
  });

  const hasAccess = canAccessDashboard();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!authLoading && !roleLoading && user && !hasAccess) {
      navigate('/');
    }
  }, [user, authLoading, roleLoading, hasAccess, navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, title_ar')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }
      setCourses(data || []);

      const courseId = searchParams.get('course_id');
      if (courseId && data?.some(c => c.id === courseId)) {
        setSelectedCourse(courseId);
      } else if (data && data.length > 0) {
        setSelectedCourse(data[0].id);
      }
      setLoading(false);
    };

    if (!authLoading && !roleLoading && hasAccess) {
      fetchCourses();
    }
  }, [authLoading, roleLoading, hasAccess, searchParams]);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedCourse) return;

      setLoading(true);
      
      const { data: chaptersData, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching chapters:', error);
        setLoading(false);
        return;
      }

      const { data: lessons } = await supabase
        .from('lessons')
        .select('chapter_id')
        .eq('course_id', selectedCourse);

      const lessonCounts = (lessons || []).reduce((acc, l) => {
        if (l.chapter_id) {
          acc[l.chapter_id] = (acc[l.chapter_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const chaptersWithCounts = (chaptersData || []).map(ch => ({
        ...ch,
        lessons_count: lessonCounts[ch.id] || 0,
      }));

      setChapters(chaptersWithCounts);
      setLoading(false);
    };

    fetchChapters();
  }, [selectedCourse]);

  const resetForm = () => {
    setFormData({
      title_ar: '',
      order_index: chapters.length,
    });
    setEditingChapter(null);
    setShowForm(false);
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      title_ar: chapter.title_ar,
      order_index: chapter.order_index,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !formData.title_ar.trim()) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى إدخال عنوان الباب' : 'Please enter chapter title',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Auto-translate Arabic title to English
      const translatedTitle = await translateText(formData.title_ar, 'en');
      
      const chapterData = {
        title: translatedTitle || formData.title_ar, // Use translated or fallback
        title_ar: formData.title_ar,
        order_index: formData.order_index,
      };

      if (editingChapter) {
        const { error } = await supabase
          .from('chapters')
          .update(chapterData)
          .eq('id', editingChapter.id);

        if (error) throw error;

        toast({
          title: isArabic ? 'تم التحديث' : 'Updated',
          description: isArabic ? 'تم تحديث الباب بنجاح' : 'Chapter updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('chapters')
          .insert({
            course_id: selectedCourse,
            ...chapterData,
          });

        if (error) throw error;

        toast({
          title: isArabic ? 'تمت الإضافة' : 'Added',
          description: isArabic ? 'تمت إضافة الباب بنجاح' : 'Chapter added successfully',
        });
      }

      // Refresh chapters
      const { data } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('order_index', { ascending: true });

      setChapters(data || []);
      resetForm();
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving chapter',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الباب؟' : 'Are you sure you want to delete this chapter?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;

      setChapters(chapters.filter(ch => ch.id !== chapterId));
      toast({
        title: isArabic ? 'تم الحذف' : 'Deleted',
        description: isArabic ? 'تم حذف الباب بنجاح' : 'Chapter deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ أثناء الحذف' : 'Error deleting chapter',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              {isArabic ? 'إدارة الأبواب' : 'Manage Chapters'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isArabic ? 'تنظيم الحصص في أبواب' : 'Organize lessons into chapters'}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {isArabic ? 'إضافة باب' : 'Add Chapter'}
          </Button>
        </div>

        {/* Course Selector */}
        <div className="mb-6">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder={isArabic ? "اختر الكورس" : "Select Course"} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {isArabic ? course.title_ar : course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Simplified Add/Edit Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingChapter ? (isArabic ? 'تعديل الباب' : 'Edit Chapter') : (isArabic ? 'إضافة باب جديد' : 'Add New Chapter')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {isArabic ? 'عنوان الباب' : 'Chapter Title'} <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder={isArabic ? "مثال: الباب الأول - الكيمياء العضوية" : "e.g., Chapter 1 - Organic Chemistry"}
                  required
                  className="text-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isTranslating}>
                  {isTranslating && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {isTranslating 
                    ? (isArabic ? 'جاري الترجمة...' : 'Translating...') 
                    : (editingChapter ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إضافة' : 'Add'))}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Chapters List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : chapters.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Layers className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isArabic ? 'لا توجد أبواب' : 'No chapters'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isArabic ? 'أضف أبواباً لتنظيم الحصص' : 'Add chapters to organize lessons'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="text-muted-foreground cursor-move">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {isArabic ? chapter.title_ar : chapter.title}
                  </h3>
                </div>
                <Badge variant="secondary">
                  <BookOpen className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  {chapter.lessons_count || 0} {isArabic ? 'حصة' : 'lessons'}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/assistant/lessons?chapter_id=${chapter.id}&course=${selectedCourse}`}>
                      {isArabic ? 'الحصص' : 'Lessons'}
                      <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(chapter)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(chapter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
