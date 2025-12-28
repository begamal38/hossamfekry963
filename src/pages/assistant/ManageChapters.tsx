import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, BookOpen, ChevronRight, GripVertical, Layers } from 'lucide-react';
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
  const { isRTL } = useLanguage();
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
        title: 'خطأ',
        description: 'يرجى إدخال عنوان الباب',
        variant: 'destructive',
      });
      return;
    }

    try {
      const chapterData = {
        title: formData.title_ar, // Use Arabic as fallback
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
          title: 'تم التحديث',
          description: 'تم تحديث الباب بنجاح',
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
          title: 'تمت الإضافة',
          description: 'تمت إضافة الباب بنجاح',
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
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحفظ',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الباب؟')) {
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
        title: 'تم الحذف',
        description: 'تم حذف الباب بنجاح',
      });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
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
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              إدارة الأبواب
            </h1>
            <p className="text-muted-foreground mt-1">
              تنظيم الحصص في أبواب
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة باب
          </Button>
        </div>

        {/* Course Selector */}
        <div className="mb-6">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="اختر الكورس" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Simplified Add/Edit Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingChapter ? 'تعديل الباب' : 'إضافة باب جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  عنوان الباب <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder="مثال: الباب الأول - الكيمياء العضوية"
                  required
                  className="text-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingChapter ? 'تحديث' : 'إضافة'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  إلغاء
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
              لا توجد أبواب
            </h3>
            <p className="text-muted-foreground mb-4">
              أضف أبواباً لتنظيم الحصص
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
                    {chapter.title_ar}
                  </h3>
                </div>
                <Badge variant="secondary">
                  <BookOpen className="h-3 w-3 ml-1" />
                  {chapter.lessons_count || 0} حصة
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/assistant/lessons?chapter_id=${chapter.id}&course=${selectedCourse}`}>
                      الحصص
                      <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
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
