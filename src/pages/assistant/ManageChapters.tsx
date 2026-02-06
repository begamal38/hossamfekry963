import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, BookOpen, ChevronRight, Layers, Loader2, ArrowUpDown } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';
import { MobileDataCard } from '@/components/assistant/MobileDataCard';
import { FloatingActionButton } from '@/components/assistant/FloatingActionButton';
import { EmptyState } from '@/components/assistant/EmptyState';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { ChapterReorderList } from '@/components/assistant/ChapterReorderList';
import { cn } from '@/lib/utils';
import { useHierarchicalSelection } from '@/hooks/useHierarchicalSelection';

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
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hierarchical selection with anti-reset guard (chapters page doesn't need lesson level)
  const { 
    selection, 
    setCourse, 
    applyDefaultCourseIfEmpty 
  } = useHierarchicalSelection({ includeLesson: false });
  
  const selectedCourse = selection.courseId || '';
  
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  
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
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        setLoading(false);
        return;
      }
      setCourses(data || []);

      // ANTI-RESET GUARD: Only apply default if no selection exists (one-time boot)
      if (data && data.length > 0) {
        applyDefaultCourseIfEmpty(data[0].id);
      }
      setLoading(false);
    };

    if (!authLoading && !roleLoading && hasAccess) {
      fetchCourses();
    }
  }, [authLoading, roleLoading, hasAccess, applyDefaultCourseIfEmpty]);

  const fetchChapters = useCallback(async () => {
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
  }, [selectedCourse]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

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
      const translatedTitle = await translateText(formData.title_ar, 'en');
      
      const chapterData = {
        title: translatedTitle || formData.title_ar,
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

      resetForm();
      fetchChapters();
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

  const selectedCourseName = courses.find(c => c.id === selectedCourse);
  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons_count || 0), 0);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 py-4 pt-20 content-appear">
        {/* Mobile-First Header */}
        <AssistantPageHeader
          title={isArabic ? 'إدارة الأبواب' : 'Manage Chapters'}
          subtitle={isArabic ? 'تنظيم الحصص في أبواب' : 'Organize lessons into chapters'}
          backHref="/assistant/courses"
          isRTL={isRTL}
          icon={Layers}
          actions={
            chapters.length > 1 ? (
              <Button 
                variant={isReorderMode ? "default" : "outline"} 
                size="sm" 
                className={cn("gap-1.5 text-xs", isReorderMode && "bg-primary")}
                onClick={() => setIsReorderMode(!isReorderMode)}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {isArabic ? 'ترتيب' : 'Reorder'}
              </Button>
            ) : undefined
          }
        />

        {/* Status Summary */}
        <StatusSummaryCard
          primaryText={`${chapters.length} ${isArabic ? 'باب' : 'chapters'}`}
          secondaryText={totalLessons > 0 ? `${totalLessons} ${isArabic ? 'حصة' : 'lessons'}` : undefined}
          badge={selectedCourseName?.title_ar}
          badgeVariant="accent"
          isRTL={isRTL}
          className="mb-4"
        />

        {/* Course Selector */}
        <div className="mb-4">
          <Select 
            value={selectedCourse} 
            onValueChange={(val) => {
              if (val && val !== selectedCourse) {
                setCourse(val);
              }
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={isArabic ? "اختر الكورس" : "Select Course"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-lg z-[200]">
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {isArabic ? course.title_ar : course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chapters List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : chapters.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={isArabic ? 'لا توجد أبواب' : 'No chapters'}
            description={isArabic ? 'أضف أبواباً لتنظيم الحصص' : 'Add chapters to organize lessons'}
          />
        ) : isReorderMode ? (
          /* Reorder Mode View */
          <div className="mb-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-start gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {isArabic 
                  ? 'أنت الآن في وضع الترتيب. استخدم الأسهم لتغيير ترتيب الأبواب.'
                  : 'You are in reorder mode. Use arrows to change chapter order.'}
              </p>
            </div>
            <ChapterReorderList
              chapters={chapters}
              onReorderComplete={fetchChapters}
              isRTL={isRTL}
              isArabic={isArabic}
            />
          </div>
        ) : (
          /* Normal View */
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <MobileDataCard
                key={chapter.id}
                title={isArabic ? chapter.title_ar : chapter.title}
                badge={`${chapter.lessons_count || 0} ${isArabic ? 'حصة' : 'lessons'}`}
                badgeVariant="default"
                icon={BookOpen}
                iconColor="text-primary"
                actions={[
                  { 
                    icon: ChevronRight, 
                    onClick: () => navigate(`/assistant/lessons?chapter_id=${chapter.id}&course=${selectedCourse}`), 
                    variant: 'outline' as const,
                    className: isRTL ? 'rotate-180' : ''
                  },
                  { icon: Edit2, onClick: () => handleEdit(chapter), variant: 'ghost' as const },
                  { icon: Trash2, onClick: () => handleDelete(chapter.id), variant: 'ghost' as const, className: 'text-destructive' }
                ]}
                isRTL={isRTL}
              />
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={Plus}
          onClick={() => { resetForm(); setShowForm(true); }}
          label={isArabic ? 'إضافة باب' : 'Add Chapter'}
        />

        {/* Add/Edit Chapter Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingChapter ? (isArabic ? 'تعديل الباب' : 'Edit Chapter') : (isArabic ? 'إضافة باب جديد' : 'Add New Chapter')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {isArabic ? 'عنوان الباب' : 'Chapter Title'} <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder={isArabic ? "مثال: الباب الأول - الكيمياء العضوية" : "e.g., Chapter 1 - Organic Chemistry"}
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isTranslating} className="flex-1">
                  {isTranslating && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {isTranslating 
                    ? (isArabic ? 'ترجمة...' : 'Translating...') 
                    : (editingChapter ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إضافة' : 'Add'))}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
