import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  FileText,
  ChevronDown,
  BookOpen,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

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
  questions_count?: number;
}

interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  order_index: number;
}

export default function ManageExams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: rolesLoading, canAccessDashboard } = useUserRole();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Exam form state
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examTitle, setExamTitle] = useState('');

  // Question form state
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'a'
  });

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
  }, [selectedCourse]);

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

      if (selectedChapter) {
        query = query.eq('chapter_id', selectedChapter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Get question counts
      const examsWithCounts = await Promise.all((data || []).map(async (exam) => {
        const { count } = await supabase
          .from('exam_questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', exam.id);
        return { ...exam, questions_count: count || 0 };
      }));

      setExams(examsWithCounts);
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
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleSaveExam = async () => {
    if (!examTitle.trim() || !selectedCourse) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
      });
      return;
    }

    try {
      if (editingExam) {
        const { error } = await supabase
          .from('exams')
          .update({
            title_ar: examTitle,
            title: examTitle,
            chapter_id: selectedChapter || null,
          })
          .eq('id', editingExam.id);

        if (error) throw error;
        toast({ title: isArabic ? 'تم التحديث' : 'Updated' });
      } else {
        const { error } = await supabase
          .from('exams')
          .insert({
            title_ar: examTitle,
            title: examTitle,
            course_id: selectedCourse,
            chapter_id: selectedChapter || null,
            max_score: 100,
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

  const handleDeleteExam = async (examId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الاختبار؟' : 'Are you sure you want to delete this exam?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
      toast({ title: isArabic ? 'تم الحذف' : 'Deleted' });
      fetchExams();
      if (selectedExamId === examId) {
        setSelectedExamId('');
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim() || !questionForm.option_a.trim() || 
        !questionForm.option_b.trim() || !questionForm.option_c.trim() || 
        !questionForm.option_d.trim()) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
      });
      return;
    }

    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from('exam_questions')
          .update({
            question_text: questionForm.question_text,
            option_a: questionForm.option_a,
            option_b: questionForm.option_b,
            option_c: questionForm.option_c,
            option_d: questionForm.option_d,
            correct_option: questionForm.correct_option,
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast({ title: isArabic ? 'تم التحديث' : 'Updated' });
      } else {
        const { error } = await supabase
          .from('exam_questions')
          .insert({
            exam_id: selectedExamId,
            question_text: questionForm.question_text,
            option_a: questionForm.option_a,
            option_b: questionForm.option_b,
            option_c: questionForm.option_c,
            option_d: questionForm.option_d,
            correct_option: questionForm.correct_option,
            order_index: questions.length,
          });

        if (error) throw error;
        toast({ title: isArabic ? 'تمت الإضافة' : 'Added' });
      }

      resetQuestionForm();
      fetchQuestions();
      fetchExams(); // Update question count
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
    setExamTitle('');
  };

  const resetQuestionForm = () => {
    setShowQuestionForm(false);
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'a'
    });
  };

  const startEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamTitle(exam.title_ar);
    setShowExamForm(true);
  };

  const startEditQuestion = (question: ExamQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
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
              {isArabic ? 'أنشئ امتحانات وأضف أسئلة اختيار من متعدد لكل باب' : 'Create exams and add MCQ questions for each chapter'}
            </p>
          </div>

          {/* Guidance */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'ترتيب الشغل الصح: أنشئ الكورس ← أضف الأبواب ← ارفع الحصص ← أضف اختبار لكل باب'
                  : 'Correct workflow: Create Course → Add Chapters → Upload Sessions → Add Exam for each Chapter'
                }
              </p>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'الكورس' : 'Course'}
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
                {isArabic ? 'الباب (اختياري)' : 'Chapter (Optional)'}
              </label>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'كل الأبواب' : 'All Chapters'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{isArabic ? 'كل الأبواب' : 'All Chapters'}</SelectItem>
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'اسم الامتحان' : 'Exam Name'}
                      </label>
                      <Input
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder={isArabic ? 'مثال: اختبار الباب الأول' : 'e.g., Chapter 1 Exam'}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveExam} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isArabic ? 'حفظ' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={resetExamForm}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Exams List */}
              <div className="grid gap-4 mb-8">
                {exams.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {isArabic ? 'لا توجد امتحانات بعد' : 'No exams yet'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  exams.map(exam => (
                    <Card 
                      key={exam.id} 
                      className={`cursor-pointer transition-colors ${selectedExamId === exam.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedExamId(exam.id)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{exam.title_ar}</h3>
                              <p className="text-sm text-muted-foreground">
                                {getChapterName(exam.chapter_id)} • {exam.questions_count || 0} {isArabic ? 'سؤال' : 'questions'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); startEditExam(exam); }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Questions Section */}
              {selectedExamId && (
                <div className="border-t pt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-primary" />
                      {isArabic ? 'الأسئلة' : 'Questions'}
                    </h2>
                    <Button onClick={() => setShowQuestionForm(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      {isArabic ? 'إضافة سؤال' : 'Add Question'}
                    </Button>
                  </div>

                  {/* Question Form */}
                  {showQuestionForm && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>
                          {editingQuestion 
                            ? (isArabic ? 'تعديل السؤال' : 'Edit Question')
                            : (isArabic ? 'إضافة سؤال جديد' : 'Add New Question')
                          }
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {isArabic ? 'نص السؤال' : 'Question Text'}
                          </label>
                          <Input
                            value={questionForm.question_text}
                            onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                            placeholder={isArabic ? 'اكتب السؤال هنا...' : 'Write the question here...'}
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">أ</label>
                            <Input
                              value={questionForm.option_a}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, option_a: e.target.value }))}
                              placeholder={isArabic ? 'الاختيار أ' : 'Option A'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">ب</label>
                            <Input
                              value={questionForm.option_b}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, option_b: e.target.value }))}
                              placeholder={isArabic ? 'الاختيار ب' : 'Option B'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">ج</label>
                            <Input
                              value={questionForm.option_c}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, option_c: e.target.value }))}
                              placeholder={isArabic ? 'الاختيار ج' : 'Option C'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">د</label>
                            <Input
                              value={questionForm.option_d}
                              onChange={(e) => setQuestionForm(prev => ({ ...prev, option_d: e.target.value }))}
                              placeholder={isArabic ? 'الاختيار د' : 'Option D'}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {isArabic ? 'الإجابة الصحيحة' : 'Correct Answer'}
                          </label>
                          <Select 
                            value={questionForm.correct_option} 
                            onValueChange={(v) => setQuestionForm(prev => ({ ...prev, correct_option: v }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="a">أ</SelectItem>
                              <SelectItem value="b">ب</SelectItem>
                              <SelectItem value="c">ج</SelectItem>
                              <SelectItem value="d">د</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveQuestion} className="gap-2">
                            <Save className="w-4 h-4" />
                            {isArabic ? 'حفظ' : 'Save'}
                          </Button>
                          <Button variant="outline" onClick={resetQuestionForm}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Questions List */}
                  <div className="space-y-4">
                    {questions.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <HelpCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            {isArabic ? 'لا توجد أسئلة بعد' : 'No questions yet'}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      questions.map((q, index) => (
                        <Card key={q.id}>
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium mb-3">
                                  <span className="text-primary">{index + 1}.</span> {q.question_text}
                                </p>
                                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                  {['a', 'b', 'c', 'd'].map((opt) => (
                                    <div 
                                      key={opt}
                                      className={`flex items-center gap-2 p-2 rounded ${
                                        q.correct_option === opt 
                                          ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                                          : 'bg-muted'
                                      }`}
                                    >
                                      {q.correct_option === opt && <CheckCircle2 className="w-4 h-4" />}
                                      <span className="font-medium">{opt.toUpperCase()}:</span>
                                      <span>{(q as any)[`option_${opt}`]}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => startEditQuestion(q)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedCourse && (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isArabic ? 'اختر كورس للبدء' : 'Select a course to start'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
