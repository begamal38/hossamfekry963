import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Video, Trash2, Youtube, Pencil, Layers, Clock, Gift, Loader2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { generateYouTubeEmbedUrl, isValidYouTubeInput } from '@/lib/youtubeUtils';
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';
import { MobileDataCard } from '@/components/assistant/MobileDataCard';
import { FloatingActionButton } from '@/components/assistant/FloatingActionButton';
import { EmptyState } from '@/components/assistant/EmptyState';
import { SearchFilterBar } from '@/components/assistant/SearchFilterBar';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { LessonReorderList } from '@/components/assistant/LessonReorderList';
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
  order_index: number;
}

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  lesson_type: string;
  course_id: string;
  chapter_id: string | null;
  order_index: number;
  video_url: string | null;
  duration_minutes: number | null;
  is_free_lesson: boolean;
}

const ManageLessons = () => {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const { translateText, isTranslating } = useAutoTranslate();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReorderMode, setIsReorderMode] = useState(false);
  
  // Hierarchical selection with anti-reset guard
  // defaultChapter = 'all' means show all lessons when no chapter selected
  const { 
    selection, 
    setCourse, 
    setChapter,
    applyDefaultCourseIfEmpty 
  } = useHierarchicalSelection({ 
    includeLesson: true, 
    defaultChapter: 'all' 
  });
  
  const selectedCourse = selection.courseId || '';
  const selectedChapter = selection.chapterId || 'all';
  
  const [formData, setFormData] = useState({
    title_ar: '',
    video_url: '',
    duration_minutes: 60,
    chapter_id: '',
    is_free_lesson: false,
  });
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) return;
    if (!canAccessDashboard()) return;
    fetchCourses();
  }, [authLoading, roleLoading, user, canAccessDashboard]);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters();
      fetchLessons();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, title_ar')
        .eq('is_hidden', false)
        .order('created_at');

      if (error) throw error;
      setCourses(data || []);
      
      // ANTI-RESET GUARD: Only apply default if no selection exists (one-time boot)
      if (data && data.length > 0) {
        applyDefaultCourseIfEmpty(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, title, title_ar, order_index')
        .eq('course_id', selectedCourse)
        .order('order_index');
      
      if (error) throw error;
      // FETCH ISOLATION: Only update option list, never mutate selection
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const fetchLessons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, title_ar, lesson_type, course_id, chapter_id, order_index, video_url, duration_minutes, is_free_lesson')
        .eq('course_id', selectedCourse)
        .order('order_index');

      if (error) throw error;
      // FETCH ISOLATION: Only update option list, never mutate selection
      setLessons((data || []) as Lesson[]);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  }, [selectedCourse]);


  const resetForm = () => {
    setFormData({
      title_ar: '',
      video_url: '',
      duration_minutes: 60,
      chapter_id: '',
      is_free_lesson: false,
    });
    setEditingLesson(null);
    setShowForm(false);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title_ar: lesson.title_ar,
      video_url: lesson.video_url || '',
      duration_minutes: lesson.duration_minutes || 60,
      chapter_id: lesson.chapter_id || '',
      is_free_lesson: lesson.is_free_lesson || false,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_ar.trim()) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى إدخال عنوان الحصة' : 'Please enter lesson title',
        variant: 'destructive'
      });
      return;
    }

    if (formData.video_url && !isValidYouTubeInput(formData.video_url)) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'رابط اليوتيوب غير صحيح' : 'Invalid YouTube URL',
        variant: 'destructive'
      });
      return;
    }

    try {
      const translatedTitle = await translateText(formData.title_ar, 'en');
      const embedUrl = formData.video_url ? generateYouTubeEmbedUrl(formData.video_url) : null;
      
      let durationMinutes = formData.duration_minutes;
      
      if (formData.video_url) {
        setIsFetchingMetadata(true);
        try {
          const { data: metadataResult, error: metadataError } = await supabase.functions.invoke('youtube-metadata', {
            body: { videoUrl: formData.video_url }
          });
          
          if (!metadataError && metadataResult?.duration_minutes) {
            durationMinutes = metadataResult.duration_minutes;
          }
        } catch (metaError) {
          console.log('[ManageLessons] Metadata fetch failed:', metaError);
        } finally {
          setIsFetchingMetadata(false);
        }
      }
      
      const lessonData = {
        title: translatedTitle || formData.title_ar,
        title_ar: formData.title_ar,
        lesson_type: 'online',
        video_url: embedUrl,
        duration_minutes: durationMinutes,
        chapter_id: formData.chapter_id || null,
        is_free_lesson: formData.is_free_lesson,
      };

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);

        if (error) throw error;

        toast({
          title: isArabic ? 'تم بنجاح' : 'Success',
          description: isArabic ? 'تم تحديث الحصة' : 'Lesson updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert({
            ...lessonData,
            course_id: selectedCourse,
            order_index: lessons.length,
          });

        if (error) throw error;

        toast({
          title: isArabic ? 'تم بنجاح' : 'Success',
          description: isArabic ? 'تم إضافة الحصة' : 'Lesson added successfully'
        });
      }

      resetForm();
      fetchLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الحصة' : 'Failed to save lesson',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الحصة؟' : 'Are you sure you want to delete this lesson?')) {
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
        description: isArabic ? 'تم حذف الحصة' : 'Lesson deleted successfully'
      });

      fetchLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const selectedCourseName = courses.find(c => c.id === selectedCourse);
  
  const filteredLessons = lessons.filter(l => {
    const matchesChapter = selectedChapter === 'all' || l.chapter_id === selectedChapter;
    const matchesSearch = !searchTerm || 
      l.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChapter && matchesSearch;
  });

  const getChapterName = (chapterId: string | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter ? chapter.title_ar : null;
  };

  const freeLessonsCount = lessons.filter(l => l.is_free_lesson).length;

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
      
      <main className="container mx-auto px-3 sm:px-4 py-4 pt-20 content-appear">
        {/* Mobile-First Header */}
        <AssistantPageHeader
          title={isArabic ? 'إدارة الحصص' : 'Manage Lessons'}
          subtitle={selectedCourseName ? (isArabic ? selectedCourseName.title_ar : selectedCourseName.title) : undefined}
          backHref="/assistant/courses"
          isRTL={isRTL}
          icon={Video}
          actions={
            <div className="flex items-center gap-2">
              <Button 
                variant={isReorderMode ? "default" : "outline"} 
                size="sm" 
                className={cn("gap-1.5 text-xs", isReorderMode && "bg-primary")}
                onClick={() => setIsReorderMode(!isReorderMode)}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {isArabic ? 'ترتيب' : 'Reorder'}
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                <Link to={`/assistant/chapters?course_id=${selectedCourse}`}>
                  <Layers className="h-3.5 w-3.5" />
                  {isArabic ? 'الأبواب' : 'Chapters'}
                </Link>
              </Button>
            </div>
          }
        />

        {/* Status Summary */}
        <StatusSummaryCard
          primaryText={`${lessons.length} ${isArabic ? 'حصة' : 'lessons'}`}
          secondaryText={freeLessonsCount > 0 ? `${freeLessonsCount} ${isArabic ? 'مجانية' : 'free'}` : undefined}
          badge={selectedCourseName?.title_ar}
          badgeVariant="accent"
          isRTL={isRTL}
          className="mb-4"
        />

        {/* Course & Chapter Selectors - Compact */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Select 
            value={selectedCourse} 
            onValueChange={(val) => {
              if (val && val !== selectedCourse) {
                setCourse(val);
              }
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder={isArabic ? "الكورس" : "Course"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-lg z-[200]">
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedChapter} 
            onValueChange={(val) => {
              if (val) {
                setChapter(val);
              }
            }}
          >
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder={isArabic ? "الباب" : "Chapter"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-lg z-[200]">
              <SelectItem value="all">{isArabic ? 'كل الحصص' : 'All'}</SelectItem>
              {chapters.map(chapter => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {chapter.title_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Bar - Hide in reorder mode */}
        {!isReorderMode && (
          <SearchFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={isArabic ? 'ابحث في الحصص...' : 'Search lessons...'}
            isRTL={isRTL}
          />
        )}

        {/* Reorder Mode */}
        {isReorderMode ? (
          <div className="mb-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-start gap-2">
              <ArrowUpDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {isArabic 
                  ? 'أنت الآن في وضع الترتيب. استخدم الأسهم لتغيير ترتيب الحصص.'
                  : 'You are in reorder mode. Use arrows to change lesson order.'}
              </p>
            </div>
            <LessonReorderList
              lessons={filteredLessons}
              onReorderComplete={fetchLessons}
              isRTL={isRTL}
              isArabic={isArabic}
              getChapterName={getChapterName}
            />
          </div>
        ) : (
          /* Normal Mode - Lessons List */
          filteredLessons.length === 0 ? (
            <EmptyState
              icon={Video}
              title={isArabic ? 'لا توجد حصص بعد' : 'No lessons yet'}
              description={isArabic ? 'ابدأ بإضافة أول حصة' : 'Start by adding the first lesson'}
            />
          ) : (
            <div className="space-y-2">
              {filteredLessons.map((lesson, index) => (
                <MobileDataCard
                  key={lesson.id}
                  title={isArabic ? lesson.title_ar : lesson.title}
                  subtitle={getChapterName(lesson.chapter_id) || undefined}
                  badge={lesson.is_free_lesson ? (isArabic ? 'مجانية' : 'Free') : undefined}
                  badgeVariant={lesson.is_free_lesson ? 'success' : undefined}
                  icon={Video}
                  iconColor="text-blue-500"
                  metadata={[
                    { 
                      icon: Clock, 
                      label: `${lesson.duration_minutes || 60} ${isArabic ? 'د' : 'min'}` 
                    },
                    ...(lesson.video_url ? [{ icon: Youtube, label: isArabic ? 'فيديو' : 'Video' }] : [])
                  ]}
                  actions={[
                    { icon: Pencil, onClick: () => handleEdit(lesson), variant: 'ghost' as const },
                    { icon: Trash2, onClick: () => handleDeleteLesson(lesson.id), variant: 'ghost' as const, className: 'text-destructive' }
                  ]}
                  isRTL={isRTL}
                />
              ))}
            </div>
          )
        )}

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={Plus}
          onClick={() => setShowForm(true)}
          label={isArabic ? 'حصة جديدة' : 'New Lesson'}
        />

        {/* Add/Edit Lesson Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? (isArabic ? 'تعديل الحصة' : 'Edit Lesson') : (isArabic ? 'حصة جديدة' : 'New Lesson')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              {/* Guidance */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <span className="text-lg">✨</span>
                <p className="text-xs text-muted-foreground">
                  {isArabic 
                    ? 'أضف عنوان الحصة ورابط اليوتيوب فقط - المدة تُستخرج تلقائياً!'
                    : 'Just add title and YouTube URL - duration is auto-extracted!'
                  }
                </p>
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {isArabic ? 'عنوان الحصة' : 'Lesson Title'} <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder={isArabic ? "مثال: الباب الأول - الدرس الأول" : "e.g., Chapter 1 - Lesson 1"}
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                />
              </div>

              {/* YouTube URL */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Youtube className="h-4 w-4 text-red-500" />
                  <label className="text-sm font-medium">{isArabic ? 'رابط اليوتيوب' : 'YouTube URL'}</label>
                </div>
                <Input
                  placeholder={isArabic ? "الصق رابط اليوتيوب هنا" : "Paste YouTube URL here"}
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  dir="ltr"
                />
              </div>

              {/* Duration - Only if no video */}
              {(!formData.video_url || !isValidYouTubeInput(formData.video_url)) && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className="h-4 w-4" />
                    <label className="text-sm font-medium">{isArabic ? 'المدة (دقيقة)' : 'Duration (min)'}</label>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="max-w-[120px]"
                  />
                </div>
              )}

              {/* Chapter Selection */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {isArabic ? 'الباب (اختياري)' : 'Chapter (optional)'}
                </label>
                <Select 
                  value={formData.chapter_id || '__none__'} 
                  onValueChange={(val) => setFormData({ ...formData, chapter_id: val === '__none__' ? '' : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? "اختر باب" : "Select chapter"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{isArabic ? 'بدون باب' : 'No chapter'}</SelectItem>
                    {chapters.map(chapter => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {chapter.title_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Free Lesson */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_free_lesson}
                  onChange={(e) => setFormData({ ...formData, is_free_lesson: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">{isArabic ? 'حصة مجانية' : 'Free Lesson'}</span>
                </div>
              </label>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSubmit} className="flex-1" disabled={isTranslating || isFetchingMetadata}>
                  {(isTranslating || isFetchingMetadata) && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {isFetchingMetadata 
                    ? (isArabic ? 'استخراج المدة...' : 'Extracting...')
                    : isTranslating 
                      ? (isArabic ? 'ترجمة...' : 'Translating...') 
                      : (editingLesson ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إضافة' : 'Add'))}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ManageLessons;
