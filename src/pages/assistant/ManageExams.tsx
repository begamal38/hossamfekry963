import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  FileText,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Eye,
  Play,
  Lock,
  Archive,
  BarChart3,
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  Loader2
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { cn } from '@/lib/utils';

type ExamStatus = 'draft' | 'published' | 'closed' | 'archived';

interface Course {
  id: string;
  title: string;
  title_ar: string;
}

interface Chapter {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
  order_index: number;
}

interface Exam {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
  chapter_id: string | null;
  max_score: number;
  status: ExamStatus;
  pass_mark: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  show_results: boolean;
  questions_count?: number;
  attempts_count?: number;
}

interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_image_url: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  order_index: number;
  question_type: 'mcq' | 'essay';
}

const statusConfig: Record<ExamStatus, { label: string; labelAr: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', labelAr: 'مسودة', color: 'bg-muted text-muted-foreground', icon: <Edit2 className="w-3 h-3" /> },
  published: { label: 'Published', labelAr: 'منشور', color: 'bg-green-500/10 text-green-600', icon: <Play className="w-3 h-3" /> },
  closed: { label: 'Closed', labelAr: 'مغلق', color: 'bg-amber-500/10 text-amber-600', icon: <Lock className="w-3 h-3" /> },
  archived: { label: 'Archived', labelAr: 'مؤرشف', color: 'bg-gray-500/10 text-gray-500', icon: <Archive className="w-3 h-3" /> },
};

export default function ManageExams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: rolesLoading } = useUserRole();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { translateText, isTranslating } = useAutoTranslate();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Exam form state - Arabic only
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({
    title_ar: '',
    chapter_id: '',
    pass_mark: 60,
    time_limit_minutes: '',
    max_attempts: 1,
    show_results: true,
  });

  // Question form state
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_image_url: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'a'
  });

  // Confirm dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'publish' | 'close' | 'archive';
    exam: Exam | null;
  }>({ open: false, type: 'delete', exam: null });

  useEffect(() => {
    if (!rolesLoading && user) {
      fetchCourses();
    }
  }, [user, rolesLoading]);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters();
      fetchExams();
    }
  }, [selectedCourse, selectedChapter]);

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions();
    }
  }, [selectedExamId]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, title_ar')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
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
        .select('id, title, title_ar, course_id, order_index')
        .eq('course_id', selectedCourse)
        .order('order_index');

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const fetchExams = async () => {
    try {
      let query = supabase
        .from('exams')
        .select('*')
        .eq('course_id', selectedCourse);

      if (selectedChapter && selectedChapter !== 'all') {
        query = query.eq('chapter_id', selectedChapter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Get question counts and attempt counts
      const examsWithCounts = await Promise.all((data || []).map(async (exam) => {
        const [questionsRes, attemptsRes] = await Promise.all([
          supabase
            .from('exam_questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id),
          supabase
            .from('exam_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
            .eq('is_completed', true)
        ]);
        
        return { 
          ...exam, 
          questions_count: questionsRes.count || 0,
          attempts_count: attemptsRes.count || 0
        };
      }));

      setExams(examsWithCounts as Exam[]);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', selectedExamId)
        .order('order_index');

      if (error) throw error;
      setQuestions(data as ExamQuestion[] || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleSaveExam = async () => {
    if (!examForm.title_ar.trim() || !selectedCourse) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول',
      });
      return;
    }

    try {
      // Auto-translate Arabic title to English
      const translatedTitle = await translateText(examForm.title_ar, 'en');
      
      const examData = {
        title_ar: examForm.title_ar,
        title: translatedTitle || examForm.title_ar, // Use translated or fallback to Arabic
        course_id: selectedCourse,
        chapter_id: examForm.chapter_id || null,
        pass_mark: examForm.pass_mark,
        time_limit_minutes: examForm.time_limit_minutes ? parseInt(examForm.time_limit_minutes) : null,
        max_attempts: examForm.max_attempts,
        show_results: examForm.show_results,
      };

      if (editingExam) {
        const { error } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', editingExam.id);

        if (error) throw error;
        toast({ title: isArabic ? 'تم التحديث' : 'Updated' });
      } else {
        const { error } = await supabase
          .from('exams')
          .insert({
            ...examData,
            max_score: 100,
            status: 'draft' as ExamStatus,
          });

        if (error) throw error;
        toast({ title: isArabic ? 'تم الإنشاء' : 'Created' });
      }

      resetExamForm();
      fetchExams();
    } catch (error) {
      console.error('Error saving exam:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الاختبار' : 'Failed to save exam',
      });
    }
  };

  const handleStatusChange = async (exam: Exam, newStatus: ExamStatus) => {
    // Validation checks
    if (newStatus === 'published' && (exam.questions_count || 0) === 0) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'لا يمكن النشر' : 'Cannot Publish',
        description: isArabic ? 'أضف أسئلة أولاً قبل النشر' : 'Add questions before publishing',
      });
      return;
    }

    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
      } else if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('exams')
        .update(updateData)
        .eq('id', exam.id);

      if (error) throw error;

      toast({ 
        title: isArabic ? 'تم التحديث' : 'Updated',
        description: isArabic 
          ? `تم تغيير الحالة إلى ${statusConfig[newStatus].labelAr}` 
          : `Status changed to ${statusConfig[newStatus].label}`
      });
      
      fetchExams();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحديث الحالة' : 'Failed to update status',
      });
    }
    
    setConfirmDialog({ open: false, type: 'delete', exam: null });
  };

  const handleDeleteExam = async (exam: Exam) => {
    // Check if exam has attempts
    if ((exam.attempts_count || 0) > 0) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'لا يمكن الحذف' : 'Cannot Delete',
        description: isArabic 
          ? 'يوجد طلاب أجروا هذا الاختبار. أرشفه بدلاً من الحذف.' 
          : 'Students have taken this exam. Archive it instead.',
      });
      return;
    }

    try {
      // Delete questions first
      await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', exam.id);

      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', exam.id);

      if (error) throw error;
      toast({ title: isArabic ? 'تم الحذف' : 'Deleted' });
      fetchExams();
      if (selectedExamId === exam.id) {
        setSelectedExamId('');
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
    
    setConfirmDialog({ open: false, type: 'delete', exam: null });
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim() && !questionForm.question_image_url.trim()) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'أدخل نص السؤال أو صورة' : 'Enter question text or image',
      });
      return;
    }

    if (!questionForm.option_a.trim() || !questionForm.option_b.trim() || 
        !questionForm.option_c.trim() || !questionForm.option_d.trim()) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء جميع الاختيارات' : 'Please fill all options',
      });
      return;
    }

    try {
      const questionData = {
        question_text: questionForm.question_text,
        question_image_url: questionForm.question_image_url || null,
        option_a: questionForm.option_a,
        option_b: questionForm.option_b,
        option_c: questionForm.option_c,
        option_d: questionForm.option_d,
        correct_option: questionForm.correct_option,
        question_type: 'mcq' as const,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('exam_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast({ title: isArabic ? 'تم التحديث' : 'Updated' });
      } else {
        const { error } = await supabase
          .from('exam_questions')
          .insert({
            ...questionData,
            exam_id: selectedExamId,
            order_index: questions.length,
          });

        if (error) throw error;
        toast({ title: isArabic ? 'تمت الإضافة' : 'Added' });
      }

      resetQuestionForm();
      fetchQuestions();
      fetchExams();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ السؤال' : 'Failed to save question',
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا السؤال؟' : 'Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      toast({ title: isArabic ? 'تم الحذف' : 'Deleted' });
      fetchQuestions();
      fetchExams();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const resetExamForm = () => {
    setShowExamForm(false);
    setEditingExam(null);
    setExamForm({
      title_ar: '',
      chapter_id: '',
      pass_mark: 60,
      time_limit_minutes: '',
      max_attempts: 1,
      show_results: true,
    });
  };

  const resetQuestionForm = () => {
    setShowQuestionForm(false);
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      question_image_url: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'a'
    });
  };

  const startEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamForm({
      title_ar: exam.title_ar,
      chapter_id: exam.chapter_id || '',
      pass_mark: exam.pass_mark,
      time_limit_minutes: exam.time_limit_minutes?.toString() || '',
      max_attempts: exam.max_attempts,
      show_results: exam.show_results,
    });
    setShowExamForm(true);
  };

  const startEditQuestion = (question: ExamQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_image_url: question.question_image_url || '',
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
    });
    setShowQuestionForm(true);
  };

  const getChapterName = (chapterId: string | null) => {
    if (!chapterId) return isArabic ? 'بدون باب' : 'No Chapter';
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter ? (isArabic ? chapter.title_ar : chapter.title) : '';
  };

  const getSelectedExam = () => exams.find(e => e.id === selectedExamId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isArabic ? 'إدارة الامتحانات' : 'Manage Exams'}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? 'أنشئ امتحانات وتحكم في دورة حياتها بالكامل' : 'Create exams and manage their full lifecycle'}
            </p>
          </div>

          {/* Guidance */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusConfig.draft.color}>
                    {statusConfig.draft.icon}
                    {isArabic ? statusConfig.draft.labelAr : statusConfig.draft.label}
                  </Badge>
                  <span>{isArabic ? 'قابل للتعديل والحذف' : 'Editable & Deletable'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusConfig.published.color}>
                    {statusConfig.published.icon}
                    {isArabic ? statusConfig.published.labelAr : statusConfig.published.label}
                  </Badge>
                  <span>{isArabic ? 'ظاهر للطلاب' : 'Visible to students'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusConfig.closed.color}>
                    {statusConfig.closed.icon}
                    {isArabic ? statusConfig.closed.labelAr : statusConfig.closed.label}
                  </Badge>
                  <span>{isArabic ? 'لا يقبل محاولات جديدة' : 'No new attempts'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'الكورس' : 'Course'} *
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'اختر الكورس' : 'Select Course'} />
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
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'تصفية بالباب' : 'Filter by Chapter'}
              </label>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'كل الأبواب' : 'All Chapters'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? 'كل الأبواب' : 'All Chapters'}</SelectItem>
                  {chapters.map(chapter => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {isArabic ? chapter.title_ar : chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCourse && (
            <>
              {/* Add Exam Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {isArabic ? 'الامتحانات' : 'Exams'}
                  <Badge variant="secondary">{exams.length}</Badge>
                </h2>
                <Button onClick={() => setShowExamForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {isArabic ? 'إضافة امتحان' : 'Add Exam'}
                </Button>
              </div>

              {/* Exam Form */}
              {showExamForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>
                      {editingExam 
                        ? (isArabic ? 'تعديل الامتحان' : 'Edit Exam')
                        : (isArabic ? 'إضافة امتحان جديد' : 'Add New Exam')
                      }
                    </CardTitle>
                    <CardDescription>
                      {isArabic ? 'املأ البيانات الأساسية للامتحان' : 'Fill in the basic exam details'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isArabic ? 'عنوان الامتحان' : 'Exam Title'} *
                        </label>
                        <Input
                          value={examForm.title_ar}
                          onChange={(e) => setExamForm(prev => ({ ...prev, title_ar: e.target.value }))}
                          placeholder={isArabic ? "مثال: اختبار الباب الأول" : "e.g., Chapter 1 Test"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isArabic ? 'الباب' : 'Chapter'}
                        </label>
                        <Select 
                          value={examForm.chapter_id} 
                          onValueChange={(value) => setExamForm(prev => ({ ...prev, chapter_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isArabic ? "اختر الباب (اختياري)" : "Select chapter (optional)"} />
                          </SelectTrigger>
                          <SelectContent>
                            {chapters.map(chapter => (
                              <SelectItem key={chapter.id} value={chapter.id}>
                                {isArabic ? chapter.title_ar : chapter.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isArabic ? 'درجة النجاح (%)' : 'Pass Mark (%)'}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={examForm.pass_mark}
                          onChange={(e) => setExamForm(prev => ({ ...prev, pass_mark: parseInt(e.target.value) || 60 }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isArabic ? 'المدة (دقائق)' : 'Time Limit (min)'}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={examForm.time_limit_minutes}
                          onChange={(e) => setExamForm(prev => ({ ...prev, time_limit_minutes: e.target.value }))}
                          placeholder={isArabic ? 'اختياري' : 'Optional'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isArabic ? 'عدد المحاولات' : 'Max Attempts'}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={examForm.max_attempts}
                          onChange={(e) => setExamForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showResults"
                        checked={examForm.show_results}
                        onChange={(e) => setExamForm(prev => ({ ...prev, show_results: e.target.checked }))}
                        className="rounded border-border"
                      />
                      <label htmlFor="showResults" className="text-sm">
                        {isArabic ? 'إظهار النتيجة للطالب بعد الانتهاء' : 'Show result to student after completion'}
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={resetExamForm}>
                        <X className="w-4 h-4 me-2" />
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button onClick={handleSaveExam} disabled={isTranslating}>
                        {isTranslating ? (
                          <Loader2 className="w-4 h-4 me-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 me-2" />
                        )}
                        {isTranslating 
                          ? (isArabic ? 'جاري الترجمة...' : 'Translating...') 
                          : (isArabic ? 'حفظ' : 'Save')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Exams List */}
              {exams.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {isArabic ? 'لا توجد امتحانات بعد. أضف أول امتحان!' : 'No exams yet. Add your first exam!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {exams.map(exam => (
                    <Card 
                      key={exam.id} 
                      className={cn(
                        "transition-all",
                        selectedExamId === exam.id && "ring-2 ring-primary"
                      )}
                    >
                      <CardContent className="py-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          {/* Exam Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={statusConfig[exam.status].color}>
                                {statusConfig[exam.status].icon}
                                <span className="ms-1">
                                  {isArabic ? statusConfig[exam.status].labelAr : statusConfig[exam.status].label}
                                </span>
                              </Badge>
                              <Badge variant="secondary">
                                <HelpCircle className="w-3 h-3 me-1" />
                                {exam.questions_count} {isArabic ? 'سؤال' : 'Q'}
                              </Badge>
                              {(exam.attempts_count || 0) > 0 && (
                                <Badge variant="outline">
                                  {exam.attempts_count} {isArabic ? 'محاولة' : 'attempts'}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1">
                              {isArabic ? exam.title_ar : exam.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {getChapterName(exam.chapter_id)} • {isArabic ? 'النجاح:' : 'Pass:'} {exam.pass_mark}%
                              {exam.time_limit_minutes && ` • ${exam.time_limit_minutes} ${isArabic ? 'دقيقة' : 'min'}`}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            {/* Edit - only for draft */}
                            {exam.status === 'draft' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => startEditExam(exam)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Questions */}
                            <Button 
                              variant={selectedExamId === exam.id ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => setSelectedExamId(selectedExamId === exam.id ? '' : exam.id)}
                            >
                              <HelpCircle className="w-4 h-4 me-1" />
                              {isArabic ? 'الأسئلة' : 'Questions'}
                            </Button>

                            {/* Results */}
                            {(exam.attempts_count || 0) > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/assistant/exam-results/${exam.id}`)}
                              >
                                <BarChart3 className="w-4 h-4 me-1" />
                                {isArabic ? 'النتائج' : 'Results'}
                              </Button>
                            )}

                            {/* Preview */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/exam/${exam.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Publish - only for draft with questions */}
                            {exam.status === 'draft' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => setConfirmDialog({ open: true, type: 'publish', exam })}
                                disabled={(exam.questions_count || 0) === 0}
                              >
                                <Play className="w-4 h-4 me-1" />
                                {isArabic ? 'نشر' : 'Publish'}
                              </Button>
                            )}

                            {/* Close - only for published */}
                            {exam.status === 'published' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setConfirmDialog({ open: true, type: 'close', exam })}
                              >
                                <Lock className="w-4 h-4 me-1" />
                                {isArabic ? 'إغلاق' : 'Close'}
                              </Button>
                            )}

                            {/* Archive - for closed exams */}
                            {exam.status === 'closed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setConfirmDialog({ open: true, type: 'archive', exam })}
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Delete - only for draft with no attempts */}
                            {exam.status === 'draft' && (exam.attempts_count || 0) === 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setConfirmDialog({ open: true, type: 'delete', exam })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Questions Panel */}
              {selectedExamId && (
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {isArabic ? 'أسئلة الامتحان' : 'Exam Questions'}
                      </CardTitle>
                      <CardDescription>
                        {isArabic ? getSelectedExam()?.title_ar : getSelectedExam()?.title}
                      </CardDescription>
                    </div>
                    {getSelectedExam()?.status === 'draft' && (
                      <Button onClick={() => setShowQuestionForm(true)} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        {isArabic ? 'إضافة سؤال' : 'Add Question'}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {/* Question Form */}
                    {showQuestionForm && (
                      <Card className="mb-6 border-dashed">
                        <CardContent className="pt-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {isArabic ? 'نص السؤال' : 'Question Text'}
                            </label>
                            <Textarea
                              value={questionForm.question_text}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                              placeholder={isArabic ? 'اكتب السؤال هنا...' : 'Write the question here...'}
                              rows={3}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              <ImageIcon className="w-4 h-4 inline me-1" />
                              {isArabic ? 'رابط صورة السؤال (اختياري)' : 'Question Image URL (Optional)'}
                            </label>
                            <Input
                              value={questionForm.question_image_url}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, question_image_url: e.target.value }))}
                              placeholder="https://..."
                              dir="ltr"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {isArabic ? 'أضف رابط صورة للمعادلات أو الرسومات' : 'Add image URL for equations or diagrams'}
                            </p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            {['a', 'b', 'c', 'd'].map((opt, idx) => (
                              <div key={opt}>
                                <label className="block text-sm font-medium mb-2">
                                  {isArabic ? `الاختيار ${['أ', 'ب', 'ج', 'د'][idx]}` : `Option ${opt.toUpperCase()}`}
                                  {questionForm.correct_option === opt && (
                                    <Badge variant="default" className="ms-2 bg-green-500">
                                      <CheckCircle2 className="w-3 h-3 me-1" />
                                      {isArabic ? 'صحيح' : 'Correct'}
                                    </Badge>
                                  )}
                                </label>
                                <div className="flex gap-2">
                                  <Input
                                    value={questionForm[`option_${opt}` as keyof typeof questionForm]}
                                    onChange={(e) => setQuestionForm(prev => ({ ...prev, [`option_${opt}`]: e.target.value }))}
                                    placeholder={isArabic ? 'الإجابة...' : 'Answer...'}
                                  />
                                  <Button
                                    type="button"
                                    variant={questionForm.correct_option === opt ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => setQuestionForm(prev => ({ ...prev, correct_option: opt }))}
                                    className={questionForm.correct_option === opt ? "bg-green-500 hover:bg-green-600" : ""}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 justify-end pt-4">
                            <Button variant="outline" onClick={resetQuestionForm}>
                              <X className="w-4 h-4 me-2" />
                              {isArabic ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button onClick={handleSaveQuestion}>
                              <Save className="w-4 h-4 me-2" />
                              {isArabic ? 'حفظ السؤال' : 'Save Question'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Questions List */}
                    {questions.length === 0 ? (
                      <div className="text-center py-8">
                        <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          {isArabic ? 'لا توجد أسئلة بعد. أضف أول سؤال!' : 'No questions yet. Add your first question!'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {questions.map((question, idx) => (
                          <div 
                            key={question.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                  </span>
                                  {question.question_image_url && (
                                    <Badge variant="outline">
                                      <ImageIcon className="w-3 h-3 me-1" />
                                      {isArabic ? 'صورة' : 'Image'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-medium mb-2">{question.question_text || (isArabic ? '(سؤال صورة)' : '(Image question)')}</p>
                                {question.question_image_url && (
                                  <img 
                                    src={question.question_image_url} 
                                    alt="Question" 
                                    className="max-w-xs max-h-32 rounded-lg border mb-2"
                                  />
                                )}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {['a', 'b', 'c', 'd'].map((opt, optIdx) => (
                                    <div 
                                      key={opt}
                                      className={cn(
                                        "px-3 py-2 rounded-lg",
                                        question.correct_option === opt 
                                          ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30"
                                          : "bg-muted"
                                      )}
                                    >
                                      <span className="font-medium">
                                        {['أ', 'ب', 'ج', 'د'][optIdx]}:
                                      </span>{' '}
                                      {question[`option_${opt}` as keyof typeof question]}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {getSelectedExam()?.status === 'draft' && (
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => startEditQuestion(question)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteQuestion(question.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!selectedCourse && courses.length > 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isArabic ? 'اختر كورس لإدارة امتحاناته' : 'Select a course to manage its exams'}
                </p>
              </CardContent>
            </Card>
          )}

          {courses.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {isArabic ? 'لا توجد كورسات. أنشئ كورس أولاً.' : 'No courses found. Create a course first.'}
                </p>
                <Button onClick={() => navigate('/assistant/manage-courses')}>
                  {isArabic ? 'إنشاء كورس' : 'Create Course'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: 'delete', exam: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'delete' && (isArabic ? 'حذف الامتحان' : 'Delete Exam')}
              {confirmDialog.type === 'publish' && (isArabic ? 'نشر الامتحان' : 'Publish Exam')}
              {confirmDialog.type === 'close' && (isArabic ? 'إغلاق الامتحان' : 'Close Exam')}
              {confirmDialog.type === 'archive' && (isArabic ? 'أرشفة الامتحان' : 'Archive Exam')}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'delete' && (
                isArabic 
                  ? 'هل أنت متأكد من حذف هذا الامتحان وجميع أسئلته؟ لا يمكن التراجع.' 
                  : 'Are you sure you want to delete this exam and all its questions? This cannot be undone.'
              )}
              {confirmDialog.type === 'publish' && (
                isArabic 
                  ? 'بعد النشر سيظهر الامتحان للطلاب ولن تستطيع تعديل الأسئلة.' 
                  : 'After publishing, the exam will be visible to students and you cannot edit questions.'
              )}
              {confirmDialog.type === 'close' && (
                isArabic 
                  ? 'بعد الإغلاق لن يستطيع الطلاب تقديم محاولات جديدة.' 
                  : 'After closing, students cannot submit new attempts.'
              )}
              {confirmDialog.type === 'archive' && (
                isArabic 
                  ? 'الأرشفة تخفي الامتحان من الطلاب مع الاحتفاظ بالنتائج.' 
                  : 'Archiving hides the exam from students while preserving results.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, type: 'delete', exam: null })}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
              onClick={() => {
                if (confirmDialog.exam) {
                  if (confirmDialog.type === 'delete') {
                    handleDeleteExam(confirmDialog.exam);
                  } else if (confirmDialog.type === 'publish') {
                    handleStatusChange(confirmDialog.exam, 'published');
                  } else if (confirmDialog.type === 'close') {
                    handleStatusChange(confirmDialog.exam, 'closed');
                  } else if (confirmDialog.type === 'archive') {
                    handleStatusChange(confirmDialog.exam, 'archived');
                  }
                }
              }}
            >
              {confirmDialog.type === 'delete' && (isArabic ? 'حذف' : 'Delete')}
              {confirmDialog.type === 'publish' && (isArabic ? 'نشر' : 'Publish')}
              {confirmDialog.type === 'close' && (isArabic ? 'إغلاق' : 'Close')}
              {confirmDialog.type === 'archive' && (isArabic ? 'أرشفة' : 'Archive')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}