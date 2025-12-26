import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PracticeQuestion {
  id: string;
  question: string;
  question_ar: string;
  question_type: 'mcq' | 'true_false';
  options: { text: string; text_ar: string; is_correct: boolean }[] | null;
  correct_answer: boolean | null;
  explanation: string | null;
  explanation_ar: string | null;
}

interface PracticeSectionProps {
  lessonId: string;
}

export const PracticeSection: React.FC<PracticeSectionProps> = ({ lessonId }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('practice_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (!error && data) {
        setQuestions(data as unknown as PracticeQuestion[]);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [lessonId]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async () => {
    if (!currentQuestion) return;

    let correct = false;
    if (currentQuestion.question_type === 'mcq' && selectedOption !== null) {
      const options = currentQuestion.options || [];
      correct = options[selectedOption]?.is_correct || false;
    } else if (currentQuestion.question_type === 'true_false' && selectedAnswer !== null) {
      correct = selectedAnswer === currentQuestion.correct_answer;
    }

    setIsCorrect(correct);
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));

    // Save attempt
    if (user) {
      await supabase.from('practice_attempts').insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        selected_option: selectedOption,
        selected_answer: selectedAnswer,
        is_correct: correct
      });
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setSelectedAnswer(null);
    setShowResult(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return null; // No practice questions - don't show section
  }

  const progressPercent = questions.length > 0 ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100 : 0;
  const isComplete = currentIndex === questions.length - 1 && showResult;

  return (
    <div className="mt-8 border-t border-border pt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {isArabic ? 'تدريب على الدرس' : 'Practice Questions'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'اختبر فهمك للدرس' : 'Test your understanding'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {isArabic ? `سؤال ${currentIndex + 1} من ${questions.length}` : `Question ${currentIndex + 1} of ${questions.length}`}
          </span>
          <span className="text-primary font-medium">
            {score.correct}/{score.total} {isArabic ? 'صح' : 'correct'}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {isComplete ? (
        // Results
        <Card className="p-6 text-center">
          <div className={cn(
            "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
            score.correct >= questions.length * 0.7 ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
          )}>
            {score.correct >= questions.length * 0.7 ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <HelpCircle className="w-8 h-8" />
            )}
          </div>
          <h4 className="text-2xl font-bold mb-2">
            {score.correct}/{questions.length}
          </h4>
          <p className="text-muted-foreground mb-6">
            {score.correct >= questions.length * 0.7 
              ? (isArabic ? 'أحسنت! فهمك ممتاز 🎉' : 'Great job! Excellent understanding 🎉')
              : (isArabic ? 'راجع الدرس وحاول تاني 💪' : 'Review the lesson and try again 💪')
            }
          </p>
          <Button onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {isArabic ? 'حاول تاني' : 'Try Again'}
          </Button>
        </Card>
      ) : currentQuestion && (
        <Card className="p-6">
          {/* Question */}
          <p className="text-lg font-medium text-foreground mb-6">
            {isArabic ? currentQuestion.question_ar : currentQuestion.question}
          </p>

          {/* Options */}
          {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => !showResult && setSelectedOption(idx)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-lg border text-start transition-all",
                    showResult && option.is_correct && "border-green-500 bg-green-50",
                    showResult && !option.is_correct && selectedOption === idx && "border-red-500 bg-red-50",
                    !showResult && selectedOption === idx && "border-primary bg-primary/5",
                    !showResult && selectedOption !== idx && "border-border hover:border-primary/50"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                      selectedOption === idx ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{isArabic ? option.text_ar : option.text}</span>
                    {showResult && option.is_correct && <CheckCircle2 className="w-5 h-5 text-green-600 ms-auto" />}
                    {showResult && !option.is_correct && selectedOption === idx && <XCircle className="w-5 h-5 text-red-600 ms-auto" />}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.question_type === 'true_false' && (
            <div className="flex gap-4 mb-6">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  onClick={() => !showResult && setSelectedAnswer(value)}
                  disabled={showResult}
                  className={cn(
                    "flex-1 p-4 rounded-lg border text-center font-medium transition-all",
                    showResult && value === currentQuestion.correct_answer && "border-green-500 bg-green-50 text-green-700",
                    showResult && value !== currentQuestion.correct_answer && selectedAnswer === value && "border-red-500 bg-red-50 text-red-700",
                    !showResult && selectedAnswer === value && "border-primary bg-primary/5 text-primary",
                    !showResult && selectedAnswer !== value && "border-border hover:border-primary/50"
                  )}
                >
                  {value ? (isArabic ? 'صح ✓' : 'True ✓') : (isArabic ? 'خطأ ✗' : 'False ✗')}
                </button>
              ))}
            </div>
          )}

          {/* Explanation */}
          {showResult && (currentQuestion.explanation || currentQuestion.explanation_ar) && (
            <div className={cn(
              "p-4 rounded-lg mb-6",
              isCorrect ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
            )}>
              <p className="text-sm">
                {isArabic ? currentQuestion.explanation_ar : currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {!showResult ? (
              <Button 
                onClick={handleAnswer} 
                disabled={selectedOption === null && selectedAnswer === null}
              >
                {isArabic ? 'تحقق من الإجابة' : 'Check Answer'}
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                {currentIndex < questions.length - 1 
                  ? (isArabic ? 'السؤال التالي' : 'Next Question')
                  : (isArabic ? 'عرض النتيجة' : 'View Results')
                }
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
