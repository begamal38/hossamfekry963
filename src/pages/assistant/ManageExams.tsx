import React, { useState, useEffect, useCallback } from 'react';
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
  Image as ImageIcon,
  Loader2,
  Calendar
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
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';
import { SearchFilterBar } from '@/components/assistant/SearchFilterBar';
import { MobileDataCard } from '@/components/assistant/MobileDataCard';
import { EmptyState } from '@/components/assistant/EmptyState';
import { FloatingActionButton } from '@/components/assistant/FloatingActionButton';
import { useHierarchicalSelection } from '@/hooks/useHierarchicalSelection';

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

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
  chapter_id: string | null;
  order_index: number;
}

interface Exam {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
  chapter_id: string | null;
  lesson_id?: string | null;
  max_score: number;
  status: ExamStatus;
  pass_mark: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  show_results: boolean;
  questions_count?: number;
  attempts_count?: number;
  created_at?: string;
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

const statusConfig: Record<ExamStatus, { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', labelAr: 'مسودة', variant: 'secondary', icon: <Edit2 className="w-3 h-3" /> },
  published: { label: 'Published', labelAr: 'منشور', variant: 'default', icon: <Play className="w-3 h-3" /> },
  closed: { label: 'Closed', labelAr: 'مغلق', variant: 'outline', icon: <Lock className="w-3 h-3" /> },
  archived: { label: 'Archived', labelAr: 'مؤرشف', variant: 'outline', icon: <Archive className="w-3 h-3" /> },
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
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  
  // Hierarchical selection with anti-reset guard
  const { 
    selection, 
    setCourse, 
    setChapter,
    applyDefaultCourseIfEmpty 
  } = useHierarchicalSelection({ 
    includeLesson: false, 
    defaultChapter: 'all' 
  });
  
  const selectedCourse = selection.courseId || '';
  const selectedChapter = selection.chapterId || 'all';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Exam form state
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({
    title_ar: '',
    chapter_id: '',
    lesson_id: '',
    exam_scope: 'chapter' as 'chapter' | 'lesson',
    pass_mark: 60,
    time_limit_minutes: '',
    max_attempts: 1,
    show_results: true,
  });

  // Question form state
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
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

  const fetchCourses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, title_ar')
        .order('created_at', { ascending: false });

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
  }, [applyDefaultCourseIfEmpty]);

  const fetchChapters = useCallback(async () => {
    if (!selectedCourse) return;
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
  }, [selectedCourse]);

  const fetchLessons = useCallback(async () => {
    if (!selectedCourse) return;
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, title_ar, course_id, chapter_id, order_index')
        .eq('course_id', selectedCourse)
        .order('order_index');

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  }, [selectedCourse]);

  const fetchExams = useCallback(async () => {
    if (!selectedCourse) return;
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
          lesson_id: null,
          questions_count: questionsRes.count || 0,
          attempts_count: attemptsRes.count || 0
        } as Exam;
      }));

      setExams(examsWithCounts);
      setFilteredExams(examsWithCounts);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  }, [selectedCourse, selectedChapter]);

  const fetchQuestions = useCallback(async () => {
    if (!selectedExamId) return;
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
  }, [selectedExamId]);

  useEffect(() => {
    if (!rolesLoading && user) {
      fetchCourses();
    }
  }, [user, rolesLoading, fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters();
      fetchLessons();
      fetchExams();
    }
  }, [selectedCourse, selectedChapter, fetchChapters, fetchLessons, fetchExams]);

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions();
    }
  }, [selectedExamId, fetchQuestions]);

  // Filter exams
  useEffect(() => {
    let filtered = exams;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title?.toLowerCase().includes(term) ||
          e.title_ar?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    setFilteredExams(filtered);
  }, [searchTerm, statusFilter, exams]);

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
      const translatedTitle = await translateText(examForm.title_ar, 'en');
      
      const examData: Record<string, unknown> = {
        title_ar: examForm.title_ar,
        title: translatedTitle || examForm.title_ar,
        course_id: selectedCourse,
        chapter_id: examForm.exam_scope === 'chapter' && examForm.chapter_id ? examForm.chapter_id : null,
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
        
        // If scope is lesson, link exam to lesson
        if (examForm.exam_scope === 'lesson' && examForm.lesson_id) {
          await supabase
            .from('lessons')
            .update({ linked_exam_id: editingExam.id })
            .eq('id', examForm.lesson_id);
        }
        
        toast({ title: isArabic ? 'تم التحديث' : 'Updated' });
      } else {
        const insertData = {
          title_ar: examForm.title_ar,
          title: (examData.title as string) || examForm.title_ar,
          course_id: selectedCourse,
          chapter_id: examForm.exam_scope === 'chapter' && examForm.chapter_id ? examForm.chapter_id : null,
          pass_mark: examForm.pass_mark,
          time_limit_minutes: examForm.time_limit_minutes ? parseInt(examForm.time_limit_minutes) : null,
          max_attempts: examForm.max_attempts,
          show_results: examForm.show_results,
          max_score: 100,
          status: 'draft' as ExamStatus,
        };
        
        const { data: newExam, error } = await supabase
          .from('exams')
          .insert(insertData)
          .select('id')
          .single();

        if (error) throw error;
        
        // If scope is lesson, link exam to lesson
        if (examForm.exam_scope === 'lesson' && examForm.lesson_id && newExam) {
          await supabase
            .from('lessons')
            .update({ linked_exam_id: newExam.id })
            .eq('id', examForm.lesson_id);
        }
        
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
      await supabase.from('exam_questions').delete().eq('exam_id', exam.id);
      const { error } = await supabase.from('exams').delete().eq('id', exam.id);

      if (error) throw error;
      toast({ title: isArabic ? 'تم الحذف' : 'Deleted' });
      fetchExams();
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
      const { error } = await supabase.from('exam_questions').delete().eq('id', questionId);
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
      lesson_id: '',
      exam_scope: 'chapter',
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

  const startEditExam = async (exam: Exam) => {
    setEditingExam(exam);
    
    // Check if this exam is linked to a lesson
    const linkedLesson = lessons.find(l => l.id === exam.lesson_id);
    const hasLinkedLesson = !!linkedLesson;
    
    setExamForm({
      title_ar: exam.title_ar,
      chapter_id: exam.chapter_id || '',
      lesson_id: linkedLesson?.id || '',
      exam_scope: hasLinkedLesson ? 'lesson' : 'chapter',
      pass_mark: exam.pass_mark,
      time_limit_minutes: exam.time_limit_minutes?.toString() || '',
      max_attempts: exam.max_attempts,
      show_results: exam.show_results,
    });
    setShowExamForm(true);
  };

  const openQuestionsDialog = (exam: Exam) => {
    setSelectedExamId(exam.id);
    setShowQuestionsDialog(true);
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

  const getLessonName = (lessonId: string | null) => {
    if (!lessonId) return '';
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson ? (isArabic ? lesson.title_ar : lesson.title) : '';
  };

  const getSelectedExam = () => exams.find(e => e.id === selectedExamId);

  // Stats
  const stats = {
    total: exams.length,
    published: exams.filter(e => e.status === 'published').length,
    draft: exams.filter(e => e.status === 'draft').length,
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderExamActions = (exam: Exam) => (
    <div className="flex flex-wrap gap-2 mt-3 w-full">
      {/* Questions */}
      <Button 
        variant="outline"
        size="sm"
        onClick={() => openQuestionsDialog(exam)}
        className="flex-1"
      >
        <HelpCircle className="w-4 h-4 me-1" />
        {exam.questions_count} {isArabic ? 'سؤال' : 'Q'}
      </Button>

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

      {/* Publish - only for draft */}
      {exam.status === 'draft' && (
        <Button 
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setConfirmDialog({ open: true, type: 'publish', exam })}
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

      {/* Results */}
      {(exam.attempts_count || 0) > 0 && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/assistant/exam-results/${exam.id}`)}
        >
          <BarChart3 className="w-4 h-4 me-1" />
          {exam.attempts_count}
        </Button>
      )}

      {/* Delete - available for any exam with no attempts */}
      {(exam.attempts_count || 0) === 0 && (
        <Button 
          variant="ghost" 
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmDialog({ open: true, type: 'delete', exam })}
        >
          <Trash2 className="w-4 h-4 me-1" />
          {isArabic ? 'حذف' : 'Delete'}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />

      <PullToRefresh onRefresh={fetchExams} className="h-[calc(100vh-4rem)] md:h-auto md:overflow-visible">
        <main className="pt-20 sm:pt-24 pb-8">
          <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
            {/* Header */}
            <AssistantPageHeader
              title={isArabic ? 'إدارة الامتحانات' : 'Manage Exams'}
              subtitle={`${filteredExams.length} ${isArabic ? 'امتحان' : 'exams'}`}
              icon={FileText}
              isRTL={isArabic}
            />

            {/* Status Summary */}
            <StatusSummaryCard
              primaryText={loading ? '...' : `${stats.published} ${isArabic ? 'امتحان منشور' : 'Published'}`}
              secondaryText={stats.draft > 0 
                ? `${stats.draft} ${isArabic ? 'مسودة' : 'drafts'}`
                : (isArabic ? 'كل الامتحانات اتنشرت' : 'All exams published')
              }
              badge={stats.draft > 3 
                ? (isArabic ? 'محتاج متابعة' : 'Needs Attention')
                : stats.draft > 0 
                ? (isArabic ? 'كله مستقر' : 'Stable')
                : (isArabic ? 'كله تمام' : 'All Good')
              }
              badgeVariant={stats.draft > 3 ? 'warning' : stats.draft > 0 ? 'stable' : 'success'}
              isRTL={isArabic}
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
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={isArabic ? 'اختر الكورس' : 'Select Course'} />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg z-[200]">
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {isArabic ? course.title_ar : course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse && (
              <>
                {/* Search & Filters */}
                <SearchFilterBar
                  searchValue={searchTerm}
                  onSearchChange={setSearchTerm}
                  searchPlaceholder={isArabic ? 'بحث بالعنوان...' : 'Search by title...'}
                  filters={[
                    {
                      value: statusFilter,
                      onChange: setStatusFilter,
                      options: [
                        { value: 'all', label: isArabic ? 'الكل' : 'All' },
                        { value: 'draft', label: isArabic ? 'مسودة' : 'Draft' },
                        { value: 'published', label: isArabic ? 'منشور' : 'Published' },
                        { value: 'closed', label: isArabic ? 'مغلق' : 'Closed' },
                        { value: 'archived', label: isArabic ? 'مؤرشف' : 'Archived' },
                      ],
                    },
                    {
                      value: selectedChapter,
                      onChange: (val) => setChapter(val),
                      options: [
                        { value: 'all', label: isArabic ? 'كل الأبواب' : 'All Chapters' },
                        ...chapters.map(ch => ({
                          value: ch.id,
                          label: isArabic ? ch.title_ar : ch.title
                        }))
                      ],
                    },
                  ]}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={clearFilters}
                  isRTL={isArabic}
                />

                {/* Exams List */}
                {filteredExams.length === 0 ? (
                  <div className="border-dashed border-2 rounded-xl bg-card/50 py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-secondary">
                      <FileText className="w-7 h-7 text-secondary-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {hasActiveFilters 
                        ? (isArabic ? 'لا توجد امتحانات مطابقة' : 'No matching exams')
                        : (isArabic ? 'لم يتم نشر امتحانات بعد' : 'No exams published yet')
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      {hasActiveFilters 
                        ? (isArabic ? 'جرب تغيير الفلاتر' : 'Try adjusting filters')
                        : (isArabic ? 'عند إنشاء امتحان، سيظهر هنا تلقائيًا للطلاب حسب مسارهم الدراسي' : 'When you create an exam, it will appear to students based on their enrolled courses')
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredExams.map((exam) => {
                      const config = statusConfig[exam.status];
                      return (
                        <MobileDataCard
                          key={exam.id}
                          title={isArabic ? exam.title_ar : exam.title}
                          subtitle={getChapterName(exam.chapter_id)}
                          icon={FileText}
                          iconColor="text-primary"
                          iconBgColor="bg-primary/10"
                          badge={isArabic ? config.labelAr : config.label}
                          badgeVariant={config.variant}
                          isRTL={isArabic}
                          metadata={[
                            {
                              label: `${exam.pass_mark}%`,
                              icon: CheckCircle2,
                            },
                            ...(exam.time_limit_minutes ? [{
                              label: `${exam.time_limit_minutes} ${isArabic ? 'د' : 'min'}`,
                            }] : []),
                          ]}
                          actions={renderExamActions(exam)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {!selectedCourse && courses.length > 0 && (
              <EmptyState
                icon={BookOpen}
                title={isArabic ? 'اختر كورس' : 'Select a course'}
                description={isArabic ? 'اختر كورس لإدارة امتحاناته' : 'Select a course to manage its exams'}
              />
            )}
          </div>
        </main>
      </PullToRefresh>

      {/* Floating Action Button */}
      {selectedCourse && (
        <FloatingActionButton
          onClick={() => setShowExamForm(true)}
          label={isArabic ? 'امتحان جديد' : 'New Exam'}
        />
      )}

      {/* Exam Form Dialog */}
      <Dialog open={showExamForm} onOpenChange={(open) => !open && resetExamForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExam 
                ? (isArabic ? 'تعديل الامتحان' : 'Edit Exam')
                : (isArabic ? 'إضافة امتحان جديد' : 'Add New Exam')
              }
            </DialogTitle>
            <DialogDescription>
              {isArabic ? 'املأ البيانات الأساسية للامتحان' : 'Fill in the basic exam details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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

            {/* Exam Scope Selection - Chapter or Lesson */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'نوع الامتحان' : 'Exam Scope'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExamForm(prev => ({ ...prev, exam_scope: 'chapter', lesson_id: '' }))}
                  className={cn(
                    "h-11 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2",
                    examForm.exam_scope === 'chapter'
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  {isArabic ? 'على باب' : 'Per Chapter'}
                </button>
                <button
                  type="button"
                  onClick={() => setExamForm(prev => ({ ...prev, exam_scope: 'lesson', chapter_id: '' }))}
                  className={cn(
                    "h-11 rounded-lg border-2 font-medium transition-all flex items-center justify-center gap-2",
                    examForm.exam_scope === 'lesson'
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Play className="w-4 h-4" />
                  {isArabic ? 'على حصة' : 'Per Lesson'}
                </button>
              </div>
            </div>

            {/* Chapter Selection - shown when scope is chapter */}
            {examForm.exam_scope === 'chapter' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'الباب' : 'Chapter'}
                </label>
                <Select 
                  value={examForm.chapter_id} 
                  onValueChange={(value) => setExamForm(prev => ({ ...prev, chapter_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? "اختر الباب" : "Select chapter"} />
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
            )}

            {/* Lesson Selection - shown when scope is lesson */}
            {examForm.exam_scope === 'lesson' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'الحصة' : 'Lesson'}
                </label>
                <Select 
                  value={examForm.lesson_id} 
                  onValueChange={(value) => setExamForm(prev => ({ ...prev, lesson_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? "اختر الحصة" : "Select lesson"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {lessons.map(lesson => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {isArabic ? lesson.title_ar : lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetExamForm}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveExam} disabled={isTranslating}>
              {isTranslating ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 me-2" />
              )}
              {isArabic ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Questions Dialog */}
      <Dialog open={showQuestionsDialog} onOpenChange={(open) => {
        if (!open) {
          setShowQuestionsDialog(false);
          setSelectedExamId('');
          setQuestions([]);
          resetQuestionForm();
        }
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {isArabic ? 'أسئلة الامتحان' : 'Exam Questions'}
            </DialogTitle>
            <DialogDescription>
              {isArabic ? getSelectedExam()?.title_ar : getSelectedExam()?.title}
            </DialogDescription>
          </DialogHeader>

          {/* Add Question Button */}
          {getSelectedExam()?.status === 'draft' && !showQuestionForm && (
            <Button onClick={() => setShowQuestionForm(true)} size="sm" className="gap-2 w-full">
              <Plus className="w-4 h-4" />
              {isArabic ? 'إضافة سؤال' : 'Add Question'}
            </Button>
          )}

          {/* Question Form */}
          {showQuestionForm && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isArabic ? 'نص السؤال' : 'Question Text'}
                </label>
                <Textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                  placeholder={isArabic ? 'اكتب السؤال هنا...' : 'Write the question here...'}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <ImageIcon className="w-4 h-4 inline me-1" />
                  {isArabic ? 'رابط صورة (اختياري)' : 'Image URL (Optional)'}
                </label>
                <Input
                  value={questionForm.question_image_url}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question_image_url: e.target.value }))}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['a', 'b', 'c', 'd'].map((opt, idx) => (
                  <div key={opt}>
                    <label className="block text-sm font-medium mb-1">
                      {isArabic ? `${['أ', 'ب', 'ج', 'د'][idx]}` : opt.toUpperCase()}
                      {questionForm.correct_option === opt && (
                        <Badge variant="default" className="ms-2 bg-green-500 text-xs">
                          ✓
                        </Badge>
                      )}
                    </label>
                    <div className="flex gap-1">
                      <Input
                        value={questionForm[`option_${opt}` as keyof typeof questionForm]}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, [`option_${opt}`]: e.target.value }))}
                        placeholder={isArabic ? 'الإجابة' : 'Answer'}
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant={questionForm.correct_option === opt ? "default" : "outline"}
                        size="icon"
                        onClick={() => setQuestionForm(prev => ({ ...prev, correct_option: opt }))}
                        className={cn("shrink-0", questionForm.correct_option === opt ? "bg-green-500 hover:bg-green-600" : "")}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={resetQuestionForm}>
                  <X className="w-4 h-4 me-1" />
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button size="sm" onClick={handleSaveQuestion}>
                  <Save className="w-4 h-4 me-1" />
                  {isArabic ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {/* Questions List */}
          {questions.length === 0 && !showQuestionForm ? (
            <div className="text-center py-8">
              <HelpCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'لا توجد أسئلة بعد' : 'No questions yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question, idx) => (
                <div 
                  key={question.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        {question.question_image_url && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="w-3 h-3 me-1" />
                            {isArabic ? 'صورة' : 'Img'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-2 line-clamp-2">
                        {question.question_text || (isArabic ? '(سؤال صورة)' : '(Image question)')}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {['a', 'b', 'c', 'd'].map((opt) => (
                          <Badge 
                            key={opt}
                            variant={question.correct_option === opt ? "default" : "outline"}
                            className={cn(
                              "text-xs",
                              question.correct_option === opt && "bg-green-500"
                            )}
                          >
                            {opt.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {getSelectedExam()?.status === 'draft' && (
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditQuestion(question)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  ? 'هل أنت متأكد من حذف هذا الامتحان وجميع أسئلته؟' 
                  : 'Are you sure you want to delete this exam and all its questions?'
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
