import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { ExamStatusBar } from '@/components/exam/ExamStatusBar';
import { ExamQuestionCard } from '@/components/exam/ExamQuestionCard';
import { ExamNavigation } from '@/components/exam/ExamNavigation';
import { ExamResultScreen } from '@/components/exam/ExamResultScreen';
import { ExamReviewScreen } from '@/components/exam/ExamReviewScreen';
import { ExamSubmitConfirmDialog } from '@/components/exam/ExamSubmitConfirmDialog';

interface ExamQuestion {
  id: string;
  question_text: string;
  question_image_url: string | null;
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
  const { isAdmin, isAssistantTeacher, loading: rolesLoading } = useUserRole();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const isArabic = language === 'ar';
  
  // Role guard: Staff cannot take exams
  const isStaff = !rolesLoading && (isAdmin() || isAssistantTeacher());

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingAttempt, setExistingAttempt] = useState<ExamAttempt | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Beforeunload warning when exam is in progress
  useEffect(() => {
    if (questions.length === 0 || showResult) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [questions.length, showResult]);

  useEffect(() => {
    if (examId && user) {
      fetchExamData();
    }
  }, [examId, user]);

  const fetchExamData = async () => {
    try {
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

      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

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
        // Restore answers from attempt for review
        const savedAnswers = attemptData.answers as any[];
        if (Array.isArray(savedAnswers)) {
          const restored: Record<string, string> = {};
          savedAnswers.forEach((a: any) => { if (a.question_id && a.selected) restored[a.question_id] = a.selected; });
          setAnswers(restored);
        }
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

  const handleRequestSubmit = () => {
    if (isStaff) {
      toast({
        title: isArabic ? 'وضع المراقبة' : 'Observer Mode',
        description: isArabic ? 'لا يتم تسجيل نتائج الامتحانات للمسؤولين' : 'Exam results are not recorded for staff',
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);

    try {
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

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
  };

  const handleJumpTo = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty/Error State
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

  // Review Screen
  if (showReview && result) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <main className="pt-24 pb-16">
          <ExamReviewScreen
            questions={questions}
            answers={answers}
            score={result.score}
            total={result.total}
            onBack={() => setShowReview(false)}
          />
        </main>
      </div>
    );
  }

  // Result Screen
  if (showResult && result) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <main className="pt-24 pb-16">
          <ExamResultScreen
            score={result.score}
            total={result.total}
            courseId={exam.course_id}
            chapterTitle={exam.chapter?.title}
            chapterTitleAr={exam.chapter?.title_ar}
            onBackToCourse={() => navigate(`/course/${exam.course_id}`)}
            onToPlatform={() => navigate('/platform')}
            onReviewAnswers={() => setShowReview(true)}
          />
        </main>
      </div>
    );
  }

  // Main Exam View - 3-Zone Layout
  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* ZONE 1: Fixed Top Status Bar */}
      <ExamStatusBar
        title={isArabic ? exam.title_ar : exam.title}
        chapterTitle={exam.chapter ? (isArabic ? exam.chapter.title_ar : exam.chapter.title) : undefined}
        currentQuestion={currentQuestionIndex}
        totalQuestions={questions.length}
        onBack={() => navigate(-1)}
      />

      {/* ZONE 2: Main Question Area - Scrollable */}
      {/* pb accounts for: exam nav (~120px) + mobile bottom nav (~88px) + breathing room */}
      <main className="pt-40 pb-[220px] md:pb-36 content-appear">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Exam Instructions - Only on first question */}
          {currentQuestionIndex === 0 && (
            <Card className="mb-4 border-primary/20 bg-primary/5">
              <CardContent className="py-3">
                <p className="text-sm text-muted-foreground text-center">
                  {isArabic 
                    ? `📋 ${questions.length} سؤال — اختر إجابة واحدة لكل سؤال`
                    : `📋 ${questions.length} questions — Select one answer per question`
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* All answered indicator */}
          {allAnswered && !isLastQuestion && (
            <Card className="mb-4 border-green-500/30 bg-green-500/10">
              <CardContent className="py-3 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {isArabic ? 'تم الإجابة على جميع الأسئلة ✔' : 'All questions answered ✔'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Question Card */}
          <ExamQuestionCard
            questionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            questionText={currentQuestion.question_text}
            questionImageUrl={currentQuestion.question_image_url}
            selectedAnswer={answers[currentQuestion.id]}
            onSelectAnswer={(option) => handleSelectAnswer(currentQuestion.id, option)}
          />
        </div>
      </main>

      {/* ZONE 3: Fixed Bottom Navigation */}
      <ExamNavigation
        currentIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        answers={answers}
        questionIds={questions.map(q => q.id)}
        submitting={submitting}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleRequestSubmit}
        onJumpTo={handleJumpTo}
      />

      {/* Submit Confirmation Dialog */}
      <ExamSubmitConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmSubmit}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        submitting={submitting}
      />
    </div>
  );
}
