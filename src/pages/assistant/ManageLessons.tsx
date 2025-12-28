import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Video, Trash2, Youtube, Pencil, GripVertical, Layers, Clock, Gift } from 'lucide-react';
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
        title: 'خطأ',
        description: 'يرجى إدخال عنوان الحصة',
        variant: 'destructive'
      });
      return;
    }

    // Validate YouTube URL if provided
    if (formData.video_url && !isValidYouTubeInput(formData.video_url)) {
      toast({
        title: 'خطأ',
        description: 'رابط اليوتيوب غير صحيح',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Auto-generate English title from Arabic (can be edited later if needed)
      const embedUrl = formData.video_url ? generateYouTubeEmbedUrl(formData.video_url) : null;
      
      const lessonData = {
        title: formData.title_ar, // Use Arabic as fallback for English
        title_ar: formData.title_ar,
        lesson_type: 'online', // All lessons are video-based
        video_url: embedUrl,
        duration_minutes: formData.duration_minutes,
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
          title: 'تم بنجاح',
          description: 'تم تحديث الحصة'
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
          title: 'تم بنجاح',
          description: 'تم إضافة الحصة'
        });
      }

      resetForm();
      fetchLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الحصة',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الحصة'
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
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assistant/courses')}>
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">إدارة الحصص</h1>
              {selectedCourseName && (
                <p className="text-muted-foreground text-sm">{selectedCourseName.title_ar}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to={`/assistant/chapters?course_id=${selectedCourse}`}>
                <Layers className="h-4 w-4" />
                الأبواب
              </Link>
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              حصة جديدة
            </Button>
          </div>
        </div>

        {/* Course & Chapter Selectors */}
        <div className="bg-card border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">اختر الكورس</label>
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
            <label className="block text-sm font-medium mb-2">تصفية حسب الباب</label>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحصص</SelectItem>
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
              {editingLesson ? 'تعديل الحصة' : 'حصة جديدة'}
            </h3>
            
            {/* Arabic Title - Required */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                عنوان الحصة <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="مثال: الباب الأول - الدرس الأول"
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                className="text-lg"
              />
            </div>

            {/* YouTube URL - Required */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="h-4 w-4 text-red-500" />
                <label className="text-sm font-medium">رابط اليوتيوب</label>
              </div>
              <Input
                placeholder="الصق رابط اليوتيوب هنا (أي صيغة)"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-muted-foreground mt-1">
                يدعم: روابط المشاهدة، الروابط القصيرة، روابط التضمين
              </p>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <label className="text-sm font-medium">مدة الحصة (دقيقة)</label>
              </div>
              <Input
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                className="max-w-[150px]"
              />
            </div>

            {/* Chapter Selection - Optional */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                <Layers className="h-4 w-4 inline ml-1" />
                الباب (اختياري)
              </label>
              <Select 
                value={formData.chapter_id || '__none__'} 
                onValueChange={(val) => setFormData({ ...formData, chapter_id: val === '__none__' ? '' : val })}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="اختر باب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">بدون باب</SelectItem>
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
                  <span className="font-medium">حصة مجانية</span>
                </div>
              </label>
              <p className="text-xs text-muted-foreground mt-1 mr-8">
                ستظهر هذه الحصة في قسم الحصص المجانية للجميع
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="lg">
                {editingLesson ? 'تحديث' : 'إضافة الحصة'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* Lessons List */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {filteredLessons.length === 0 ? (
            <div className="p-12 text-center">
              <Video className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">لا توجد حصص بعد</h3>
              <p className="text-muted-foreground text-sm mb-4">
                ابدأ بإضافة أول حصة
              </p>
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="h-4 w-4 ml-2" />
                إضافة حصة
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
                      <p className="font-medium">{lesson.title_ar}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration_minutes || 60} دقيقة
                        </span>
                        {lesson.video_url && (
                          <span className="flex items-center gap-1 text-red-500">
                            <Youtube className="h-3 w-3" />
                            فيديو
                          </span>
                        )}
                        {lesson.is_free_lesson && (
                          <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            <Gift className="h-3 w-3 ml-1" />
                            مجانية
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
