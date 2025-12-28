import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Video, Building, Trash2, Youtube, Pencil, GripVertical, Layers, Lock, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

interface Exam {
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
  chapter_id: string | null;
  order_index: number;
  video_url: string | null;
  duration_minutes: number | null;
  summary: string | null;
  summary_ar: string | null;
  key_points: unknown;
  assistant_notes: string | null;
  assistant_notes_ar: string | null;
  requires_previous_completion: boolean;
  requires_exam_pass: boolean;
  linked_exam_id: string | null;
}

const ManageLessons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    lesson_type: 'online' as 'online' | 'center',
    video_url: '',
    duration_minutes: 60,
    chapter_id: '',
    summary: '',
    summary_ar: '',
    assistant_notes: '',
    assistant_notes_ar: '',
    requires_previous_completion: false,
    requires_exam_pass: false,
    linked_exam_id: '',
  });

  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      const redirect = `${location.pathname}${location.search}`;
      navigate(`/auth?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    if (!canAccessDashboard()) {
      navigate('/');
      return;
    }

    fetchCourses();
  }, [authLoading, roleLoading, user, canAccessDashboard, navigate, location.pathname, location.search]);

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
      fetchChaptersAndExams();
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

  const fetchChaptersAndExams = async () => {
    try {
      const [{ data: chaptersData }, { data: examsData }] = await Promise.all([
        supabase.from('chapters').select('id, title, title_ar, order_index').eq('course_id', selectedCourse).order('order_index'),
        supabase.from('exams').select('id, title, title_ar').eq('course_id', selectedCourse)
      ]);
      
      setChapters(chaptersData || []);
      setExams(examsData || []);
    } catch (error) {
      console.error('Error fetching chapters/exams:', error);
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
      setLessons((data || []) as Lesson[]);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      title_ar: '',
      lesson_type: 'online',
      video_url: '',
      duration_minutes: 60,
      chapter_id: '',
      summary: '',
      summary_ar: '',
      assistant_notes: '',
      assistant_notes_ar: '',
      requires_previous_completion: false,
      requires_exam_pass: false,
      linked_exam_id: '',
    });
    setEditingLesson(null);
    setShowForm(false);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      title_ar: lesson.title_ar,
      lesson_type: lesson.lesson_type as 'online' | 'center',
      video_url: lesson.video_url || '',
      duration_minutes: lesson.duration_minutes || 60,
      chapter_id: lesson.chapter_id || '',
      summary: lesson.summary || '',
      summary_ar: lesson.summary_ar || '',
      assistant_notes: lesson.assistant_notes || '',
      assistant_notes_ar: lesson.assistant_notes_ar || '',
      requires_previous_completion: lesson.requires_previous_completion || false,
      requires_exam_pass: lesson.requires_exam_pass || false,
      linked_exam_id: lesson.linked_exam_id || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.title_ar) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء العنوان بالعربي والإنجليزي' : 'Please fill both titles',
        variant: 'destructive'
      });
      return;
    }

    try {
      const lessonData = {
        title: formData.title,
        title_ar: formData.title_ar,
        lesson_type: formData.lesson_type,
        video_url: formData.video_url || null,
        duration_minutes: formData.duration_minutes,
        chapter_id: formData.chapter_id || null,
        summary: formData.summary || null,
        summary_ar: formData.summary_ar || null,
        assistant_notes: formData.assistant_notes || null,
        assistant_notes_ar: formData.assistant_notes_ar || null,
        requires_previous_completion: formData.requires_previous_completion,
        requires_exam_pass: formData.requires_exam_pass,
        linked_exam_id: formData.linked_exam_id || null,
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
    return chapter ? (isArabic ? chapter.title_ar : chapter.title) : null;
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
                <p className="text-muted-foreground text-sm">
                  {isArabic ? selectedCourseName.title_ar : selectedCourseName.title}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to={`/assistant/chapters?course_id=${selectedCourse}`}>
                <Layers className="h-4 w-4" />
                {isArabic ? 'الفصول' : 'Chapters'}
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
                    {isArabic ? course.title_ar : course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{isArabic ? 'تصفية حسب الفصل' : 'Filter by Chapter'}</label>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'كل الدروس' : 'All Lessons'}</SelectItem>
                {chapters.map(chapter => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {isArabic ? chapter.title_ar : chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add/Edit Lesson Form */}
        {showForm && (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">
              {editingLesson 
                ? (isArabic ? 'تعديل الحصة' : 'Edit Lesson')
                : (isArabic ? 'حصة جديدة' : 'New Lesson')
              }
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}
                </label>
                <Input
                  placeholder="Lesson Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}
                </label>
                <Input
                  placeholder="عنوان الحصة"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Chapter Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                <Layers className="h-4 w-4 inline mr-1" />
                {isArabic ? 'الفصل' : 'Chapter'}
              </label>
              <Select value={formData.chapter_id || '__none__'} onValueChange={(val) => setFormData({ ...formData, chapter_id: val === '__none__' ? '' : val })}>
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'اختر فصل (اختياري)' : 'Select Chapter (Optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{isArabic ? 'بدون فصل' : 'No Chapter'}</SelectItem>
                  {chapters.map(chapter => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {isArabic ? chapter.title_ar : chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lesson Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'نوع الحصة' : 'Lesson Type'}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="lesson_type"
                    checked={formData.lesson_type === 'online'}
                    onChange={() => setFormData({ ...formData, lesson_type: 'online' })}
                  />
                  <Video className="h-4 w-4" />
                  {isArabic ? 'أونلاين' : 'Online'}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="lesson_type"
                    checked={formData.lesson_type === 'center'}
                    onChange={() => setFormData({ ...formData, lesson_type: 'center' })}
                  />
                  <Building className="h-4 w-4" />
                  {isArabic ? 'سنتر' : 'Center'}
                </label>
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'مدة الحصة (دقيقة)' : 'Duration (minutes)'}
              </label>
              <Input
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                className="max-w-[200px]"
              />
            </div>

            {/* Video URL */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="h-4 w-4 text-red-500" />
                <label className="text-sm font-medium">{isArabic ? 'رابط الفيديو (يوتيوب)' : 'Video URL (YouTube)'}</label>
              </div>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  {isArabic ? 'ملخص الدرس (إنجليزي)' : 'Lesson Summary (English)'}
                </label>
                <Textarea
                  placeholder="Brief summary of the lesson..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  {isArabic ? 'ملخص الدرس (عربي)' : 'Lesson Summary (Arabic)'}
                </label>
                <Textarea
                  placeholder="ملخص مختصر للدرس..."
                  value={formData.summary_ar}
                  onChange={(e) => setFormData({ ...formData, summary_ar: e.target.value })}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Assistant Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'ملاحظات المدرس (إنجليزي)' : 'Teacher Notes (English)'}
                </label>
                <Textarea
                  placeholder="Additional notes for students..."
                  value={formData.assistant_notes}
                  onChange={(e) => setFormData({ ...formData, assistant_notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'ملاحظات المدرس (عربي)' : 'Teacher Notes (Arabic)'}
                </label>
                <Textarea
                  placeholder="ملاحظات إضافية للطلاب..."
                  value={formData.assistant_notes_ar}
                  onChange={(e) => setFormData({ ...formData, assistant_notes_ar: e.target.value })}
                  rows={2}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Progression Settings */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {isArabic ? 'إعدادات التقدم' : 'Progression Settings'}
              </h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_previous_completion}
                    onChange={(e) => setFormData({ ...formData, requires_previous_completion: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {isArabic ? 'يتطلب إكمال الدرس السابق' : 'Requires previous lesson completion'}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_exam_pass}
                    onChange={(e) => setFormData({ ...formData, requires_exam_pass: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {isArabic ? 'يتطلب اجتياز امتحان' : 'Requires passing linked exam'}
                  </span>
                </label>
                {formData.requires_exam_pass && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium mb-2">
                      <FileText className="h-4 w-4 inline mr-1" />
                      {isArabic ? 'الامتحان المرتبط' : 'Linked Exam'}
                    </label>
                    <Select value={formData.linked_exam_id} onValueChange={(val) => setFormData({ ...formData, linked_exam_id: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder={isArabic ? 'اختر امتحان' : 'Select Exam'} />
                      </SelectTrigger>
                      <SelectContent>
                        {exams.map(exam => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {isArabic ? exam.title_ar : exam.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingLesson 
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

        {/* Lessons List */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {filteredLessons.length === 0 ? (
            <div className="p-12 text-center">
              <Video className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{isArabic ? 'لا توجد حصص بعد' : 'No lessons yet'}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {isArabic ? 'ابدأ بإضافة أول حصة' : 'Start by adding your first lesson'}
              </p>
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
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
                    {lesson.lesson_type === 'online' ? (
                      <Video className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Building className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{isArabic ? lesson.title_ar : lesson.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{lesson.duration_minutes || 60} {isArabic ? 'دقيقة' : 'min'}</span>
                        {lesson.video_url && (
                          <span className="flex items-center gap-1 text-red-500">
                            <Youtube className="h-3 w-3" />
                            {isArabic ? 'فيديو' : 'Video'}
                          </span>
                        )}
                        {getChapterName(lesson.chapter_id) && (
                          <Badge variant="outline" className="text-xs">
                            <Layers className="h-3 w-3 mr-1" />
                            {getChapterName(lesson.chapter_id)}
                          </Badge>
                        )}
                        {lesson.requires_previous_completion && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            {isArabic ? 'مقفل' : 'Locked'}
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
