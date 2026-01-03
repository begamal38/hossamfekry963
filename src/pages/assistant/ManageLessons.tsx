import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Video, Trash2, Youtube, Pencil, GripVertical, Layers, Clock, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
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
  const [searchParams] = useSearchParams();
  const { language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const { translateText, isTranslating } = useAutoTranslate();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Simplified form - only essential fields
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
    const courseParam = searchParams.get('course');
    const chapterParam = searchParams.get('chapter_id');
    
    if (courseParam && courses.length > 0) {
      const courseExists = courses.find(c => c.id === courseParam);
      if (courseExists) {
        setSelectedCourse(courseParam);
      }
    }
    
    if (chapterParam) {
      setSelectedChapter(chapterParam);
    }
  }, [searchParams, courses]);

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
        .order('created_at');

      if (error) throw error;
      setCourses(data || []);
      
      const courseParam = searchParams.get('course');
      if (courseParam && data?.find(c => c.id === courseParam)) {
        setSelectedCourse(courseParam);
      } else if (data && data.length > 0) {
        setSelectedCourse(data[0].id);
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
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, title_ar, lesson_type, course_id, chapter_id, order_index, video_url, duration_minutes, is_free_lesson')
        .eq('course_id', selectedCourse)
        .order('order_index');

      if (error) throw error;
      setLessons((data || []) as Lesson[]);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

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

    // Validate YouTube URL if provided
    if (formData.video_url && !isValidYouTubeInput(formData.video_url)) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'رابط اليوتيوب غير صحيح' : 'Invalid YouTube URL',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Auto-translate Arabic title to English
      const translatedTitle = await translateText(formData.title_ar, 'en');
      const embedUrl = formData.video_url ? generateYouTubeEmbedUrl(formData.video_url) : null;
      
      // Auto-fetch YouTube metadata for duration
      let durationMinutes = formData.duration_minutes;
      
      if (formData.video_url) {
        setIsFetchingMetadata(true);
        try {
          console.log('[ManageLessons] Fetching YouTube metadata...');
          const { data: metadataResult, error: metadataError } = await supabase.functions.invoke('youtube-metadata', {
            body: { videoUrl: formData.video_url }
          });
          
          if (!metadataError && metadataResult?.duration_minutes) {
            durationMinutes = metadataResult.duration_minutes;
            console.log('[ManageLessons] Auto-extracted duration:', durationMinutes, 'minutes');
          } else {
            console.log('[ManageLessons] Could not extract duration, using form value');
          }
        } catch (metaError) {
          console.log('[ManageLessons] Metadata fetch failed, using form duration:', metaError);
        } finally {
          setIsFetchingMetadata(false);
        }
      }
      
      const lessonData = {
        title: translatedTitle || formData.title_ar, // Use translated or fallback to Arabic
        title_ar: formData.title_ar,
        lesson_type: 'online', // All lessons are video-based
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
  const filteredLessons = selectedChapter === 'all' 
    ? lessons 
    : lessons.filter(l => l.chapter_id === selectedChapter);

  const getChapterName = (chapterId: string | null) => {
    if (!chapterId) return null;
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter ? chapter.title_ar : null;
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/assistant/courses')}>
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isArabic ? 'إدارة الحصص' : 'Manage Lessons'}</h1>
              {selectedCourseName && (
                <p className="text-muted-foreground text-sm">{isArabic ? selectedCourseName.title_ar : selectedCourseName.title}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to={`/assistant/chapters?course_id=${selectedCourse}`}>
                <Layers className="h-4 w-4" />
                {isArabic ? 'الأبواب' : 'Chapters'}
              </Link>
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {isArabic ? 'حصة جديدة' : 'New Lesson'}
            </Button>
          </div>
        </div>

        {/* Course & Chapter Selectors */}
        <div className="bg-card border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{isArabic ? 'اختر الكورس' : 'Select Course'}</label>
            <Select value={selectedCourse} onValueChange={(val) => {
              setSelectedCourse(val);
              setSelectedChapter('all');
              navigate(`/assistant/lessons?course=${val}`, { replace: true });
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{isArabic ? 'تصفية حسب الباب' : 'Filter by Chapter'}</label>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'كل الحصص' : 'All Lessons'}</SelectItem>
                {chapters.map(chapter => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.title_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Simplified Add/Edit Lesson Form */}
        {showForm && (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              {editingLesson ? (isArabic ? 'تعديل الحصة' : 'Edit Lesson') : (isArabic ? 'حصة جديدة' : 'New Lesson')}
            </h3>
            
            {/* Guidance Message for Assistant Teacher */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-start gap-2">
              <span className="text-lg">✨</span>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'أضف عنوان الحصة ورابط اليوتيوب فقط - المدة تُستخرج تلقائياً من الفيديو!'
                  : 'Just add title and YouTube URL - duration is auto-extracted from the video!'
                }
              </p>
            </div>
            
            {/* Arabic Title - Required */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'عنوان الحصة' : 'Lesson Title'} <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder={isArabic ? "مثال: الباب الأول - الدرس الأول" : "e.g., Chapter 1 - Lesson 1"}
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                className="text-lg"
              />
            </div>

            {/* YouTube URL - Required */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="h-4 w-4 text-red-500" />
                <label className="text-sm font-medium">{isArabic ? 'رابط اليوتيوب' : 'YouTube URL'}</label>
              </div>
              <Input
                placeholder={isArabic ? "الصق رابط اليوتيوب هنا (أي صيغة)" : "Paste YouTube URL here (any format)"}
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isArabic 
                  ? '✨ يدعم جميع صيغ اليوتيوب - المدة تُستخرج تلقائياً' 
                  : '✨ Supports all YouTube formats - Duration auto-extracted'}
              </p>
            </div>

            {/* Duration - Only show when NO valid YouTube URL (manual fallback) */}
            {(!formData.video_url || !isValidYouTubeInput(formData.video_url)) && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <label className="text-sm font-medium">{isArabic ? 'مدة الحصة (دقيقة)' : 'Duration (minutes)'}</label>
                </div>
                <Input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  className="max-w-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isArabic ? 'أضف رابط يوتيوب لاستخراج المدة تلقائياً' : 'Add YouTube URL to auto-extract duration'}
                </p>
              </div>
            )}

            {/* Chapter Selection - Optional */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                <Layers className={`h-4 w-4 inline ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {isArabic ? 'الباب (اختياري)' : 'Chapter (optional)'}
              </label>
              <Select 
                value={formData.chapter_id || '__none__'} 
                onValueChange={(val) => setFormData({ ...formData, chapter_id: val === '__none__' ? '' : val })}
              >
                <SelectTrigger className="max-w-sm">
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

            {/* Free Lesson Checkbox */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_free_lesson}
                  onChange={(e) => setFormData({ ...formData, is_free_lesson: e.target.checked })}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-green-500" />
                  <span className="font-medium">{isArabic ? 'حصة مجانية' : 'Free Lesson'}</span>
                </div>
              </label>
              <p className={`text-xs text-muted-foreground mt-1 ${isRTL ? 'mr-8' : 'ml-8'}`}>
                {isArabic ? 'ستظهر هذه الحصة في قسم الحصص المجانية للجميع' : 'This lesson will appear in the free lessons section for everyone'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="lg" disabled={isTranslating || isFetchingMetadata}>
                {(isTranslating || isFetchingMetadata) && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {isFetchingMetadata 
                  ? (isArabic ? 'جاري استخراج المدة...' : 'Extracting duration...')
                  : isTranslating 
                    ? (isArabic ? 'جاري الترجمة...' : 'Translating...') 
                    : (editingLesson ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إضافة الحصة' : 'Add Lesson'))}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        {/* Lessons List */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {filteredLessons.length === 0 ? (
            <div className="p-12 text-center">
              <Video className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{isArabic ? 'لا توجد حصص بعد' : 'No lessons yet'}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {isArabic ? 'ابدأ بإضافة أول حصة' : 'Start by adding the first lesson'}
              </p>
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isArabic ? 'إضافة حصة' : 'Add Lesson'}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredLessons.map((lesson, index) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="w-6 text-center font-medium">{index + 1}</span>
                    </div>
                    <Video className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{isArabic ? lesson.title_ar : lesson.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration_minutes || 60} {isArabic ? 'دقيقة' : 'min'}
                        </span>
                        {lesson.video_url && (
                          <span className="flex items-center gap-1 text-red-500">
                            <Youtube className="h-3 w-3" />
                            {isArabic ? 'فيديو' : 'Video'}
                          </span>
                        )}
                        {lesson.is_free_lesson && (
                          <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            <Gift className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {isArabic ? 'مجانية' : 'Free'}
                          </Badge>
                        )}
                        {getChapterName(lesson.chapter_id) && (
                          <Badge variant="outline" className="text-xs">
                            <Layers className="h-3 w-3 ml-1" />
                            {getChapterName(lesson.chapter_id)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(lesson)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLesson(lesson.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageLessons;
