import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  Clock,
  AlertCircle,
  Trophy,
  RotateCcw
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ExamQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  order_index: number;
}

interface Exam {
  id: string;
  title: string;
  title_ar: string;
  max_score: number;
  course_id: string;
  chapter_id: string | null;
  course?: {
    title: string;
    title_ar: string;
  };
  chapter?: {
    title: string;
    title_ar: string;
  };
}

interface ExamAttempt {
  id: string;
  score: number;
  total_questions: number;
  is_completed: boolean;
}

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingAttempt, setExistingAttempt] = useState<ExamAttempt | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    if (examId && user) {
      fetchExamData();
    }
  }, [examId, user]);

  const fetchExamData = async () => {
    try {
      // Fetch exam with course and chapter info
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          course:courses (title, title_ar),
          chapter:chapters (title, title_ar)
        `)
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Check for existing completed attempt
      const { data: attemptData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('user_id', user!.id)
        .eq('is_completed', true)
        .maybeSingle();

      if (attemptData) {
        setExistingAttempt(attemptData);
        setShowResult(true);
        setResult({ score: attemptData.score, total: attemptData.total_questions });
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحميل الاختبار' : 'Failed to load exam',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'انتبه!' : 'Warning!',
        description: isArabic ? 'يرجى الإجابة على جميع الأسئلة' : 'Please answer all questions',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Calculate score
      let correctCount = 0;
      const answersArray = questions.map(q => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correct_option;
        if (isCorrect) correctCount++;
        return {
          question_id: q.id,
          selected: userAnswer,
          correct: q.correct_option,
          is_correct: isCorrect,
        };
      });

      // Save attempt
      const { error } = await supabase
        .from('exam_attempts')
        .insert({
          exam_id: examId,
          user_id: user!.id,
          score: correctCount,
          total_questions: questions.length,
          answers: answersArray,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Also save to exam_results for backward compatibility
      await supabase
        .from('exam_results')
        .insert({
          exam_id: examId,
          user_id: user!.id,
          score: Math.round((correctCount / questions.length) * (exam?.max_score || 100)),
        });

      setResult({ score: correctCount, total: questions.length });
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ النتيجة' : 'Failed to save result',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">
              {isArabic ? 'الاختبار غير متاح' : 'Exam not available'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isArabic ? 'لا توجد أسئلة في هذا الاختبار بعد' : 'No questions in this exam yet'}
            </p>
            <Button onClick={() => navigate(-1)}>
              {isArabic ? 'العودة' : 'Go Back'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show result screen
  if (showResult && result) {
    const percentage = Math.round((result.score / result.total) * 100);
    const passed = percentage >= 60;

    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-lg">
            <Card className="text-center">
              <CardContent className="py-12">
                <div className={cn(
                  "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
                  passed ? "bg-green-500/10" : "bg-amber-500/10"
                )}>
                  {passed ? (
                    <Trophy className="w-12 h-12 text-green-500" />
                  ) : (
                    <RotateCcw className="w-12 h-12 text-amber-500" />
                  )}
                </div>

                <h1 className="text-3xl font-bold mb-2">
                  {passed 
                    ? (isArabic ? 'أحسنت! 🎉' : 'Well Done! 🎉')
                    : (isArabic ? 'حاول مرة تانية' : 'Try Again')
                  }
                </h1>

                <div className="text-5xl font-bold text-primary my-6">
                  {result.score}/{result.total}
                </div>

                <p className="text-xl mb-2">
                  {percentage}%
                </p>

                <p className="text-muted-foreground mb-8">
                  {passed
                    ? (isArabic ? 'فاهم الباب كويس، استمر!' : 'You understand this chapter well!')
                    : (isArabic ? 'راجع الحصص تاني وحاول من جديد' : 'Review the lessons and try again')
                  }
                </p>

                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate(`/course/${exam.course_id}`)}
                    className="w-full"
                  >
                    {isArabic ? 'العودة للكورس' : 'Back to Course'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/platform')}
                    className="w-full"
                  >
                    {isArabic ? 'للمنصة' : 'To Platform'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Guidance */}
            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardContent className="py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {isArabic 
                    ? 'خلّص حصص الباب وبعدين ادخل على الاختبار عشان تثبّت الفهم عندك.'
                    : 'Complete chapter lessons, then take the exam to reinforce your understanding.'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mb-4 gap-2"
            >
              <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
              {isArabic ? 'العودة' : 'Back'}
            </Button>

            <h1 className="text-2xl font-bold mb-2">
              {isArabic ? exam.title_ar : exam.title}
            </h1>
            {exam.chapter && (
              <p className="text-muted-foreground">
                {isArabic ? exam.chapter.title_ar : exam.chapter.title}
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {isArabic ? 'السؤال' : 'Question'} {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Guidance */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground text-center">
                {isArabic 
                  ? 'الاختبار ده عشان تتأكد إنك فاهم الباب كويس 👌'
                  : 'This exam is to make sure you understand the chapter well 👌'
                }
              </p>
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                <span className="text-primary">{currentQuestionIndex + 1}.</span> {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { key: 'a', label: 'أ', value: currentQuestion.option_a },
                  { key: 'b', label: 'ب', value: currentQuestion.option_b },
                  { key: 'c', label: 'ج', value: currentQuestion.option_c },
                  { key: 'd', label: 'د', value: currentQuestion.option_d },
                ].map(option => (
                  <button
                    key={option.key}
                    onClick={() => handleSelectAnswer(currentQuestion.id, option.key)}
                    className={cn(
                      "w-full text-start p-4 rounded-lg border-2 transition-all",
                      answers[currentQuestion.id] === option.key
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        answers[currentQuestion.id] === option.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}>
                        {option.label}
                      </span>
                      <span>{option.value}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="gap-2"
            >
              <ArrowRight className={cn("w-4 h-4", !isRTL && "rotate-180")} />
              {isArabic ? 'السابق' : 'Previous'}
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting 
                  ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                  : (isArabic ? 'إنهاء الاختبار' : 'Submit Exam')
                }
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="gap-2"
              >
                {isArabic ? 'التالي' : 'Next'}
                <ArrowLeft className={cn("w-4 h-4", !isRTL && "rotate-180")} />
              </Button>
            )}
          </div>

          {/* Question indicators */}
          <div className="flex flex-wrap gap-2 mt-8 justify-center">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={cn(
                  "w-10 h-10 rounded-full text-sm font-medium transition-all",
                  currentQuestionIndex === idx
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id]
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-muted hover:bg-muted/80"
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
