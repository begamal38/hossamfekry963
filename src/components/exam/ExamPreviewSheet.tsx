import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Eye,
  ImageOff
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn, wrapChemicalEquations } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamQuestion {
  id: string;
  question_text: string;
  question_image_url: string | null;
  order_index: number;
}

interface ExamPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  examTitle: string;
  examTitleAr: string;
}

/**
 * ExamPreviewSheet - Assistant-only preview of exam as students see it
 * 
 * STRICT RULES (per SSOT):
 * - READ-ONLY: No answers, no submission, no timing
 * - Reuses EXACT student rendering logic (image-first questions, A/B/C/D buttons)
 * - Clearly labeled as preview mode
 * - Proper image error handling with Arabic fallback
 */
export const ExamPreviewSheet: React.FC<ExamPreviewSheetProps> = ({
  open,
  onOpenChange,
  examId,
  examTitle,
  examTitleAr,
}) => {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Fetch questions when opened
  useEffect(() => {
    if (open && examId) {
      fetchQuestions();
    }
    return () => {
      // Reset on close
      setCurrentQuestionIndex(0);
      setImageErrors(new Set());
    };
  }, [open, examId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('id, question_text, question_image_url, order_index')
        .eq('exam_id', examId)
        .order('order_index');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions for preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (questionId: string) => {
    setImageErrors(prev => new Set(prev).add(questionId));
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] max-h-[90vh] overflow-y-auto rounded-t-2xl pt-10"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-primary" />
            <Badge variant="secondary" className="text-xs">
              {isArabic ? 'معاينة فقط' : 'Preview Only'}
            </Badge>
          </div>
          <SheetTitle className="text-start">
            {isArabic ? 'معاينة الامتحان كما يراه الطالب' : 'Preview Exam as Student Sees It'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground text-start">
            {isArabic ? examTitleAr : examTitle}
          </p>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'لا توجد أسئلة في هذا الامتحان' : 'No questions in this exam'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {isArabic ? 'السؤال' : 'Question'} {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card - EXACT same rendering as TakeExam.tsx */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {isArabic ? `من ${questions.length}` : `of ${questions.length}`}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Question Image - Primary content */}
                {currentQuestion?.question_image_url && !imageErrors.has(currentQuestion.id) ? (
                  <div className="relative rounded-xl overflow-hidden bg-muted/30 border">
                    <img 
                      src={currentQuestion.question_image_url} 
                      alt={isArabic ? `السؤال ${currentQuestionIndex + 1}` : `Question ${currentQuestionIndex + 1}`}
                      className="w-full h-auto max-h-[50vh] object-contain mx-auto"
                      loading="eager"
                      onError={() => handleImageError(currentQuestion.id)}
                    />
                  </div>
                ) : currentQuestion?.question_image_url && imageErrors.has(currentQuestion.id) ? (
                  /* Image Error Fallback */
                  <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
                    <ImageOff className="w-10 h-10 text-destructive/60 mx-auto mb-2" />
                    <p className="text-sm text-destructive font-medium">
                      {isArabic ? 'تعذر تحميل صورة السؤال' : 'Failed to load question image'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentQuestion.question_image_url}
                    </p>
                  </div>
                ) : currentQuestion?.question_text ? (
                  /* Fallback: Text question if no image */
                  <div className="p-4 rounded-xl bg-muted/30 border">
                    <p className="text-base leading-relaxed" dir="auto">
                      {wrapChemicalEquations(currentQuestion.question_text)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-amber-500/60 mx-auto mb-2" />
                    <p className="text-sm text-amber-600 font-medium">
                      {isArabic ? 'سؤال بدون محتوى' : 'Question has no content'}
                    </p>
                  </div>
                )}
                
                {/* Answer Buttons - EXACT same as TakeExam.tsx (read-only) */}
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {isArabic ? 'خيارات الإجابة:' : 'Answer options:'}
                  </p>
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    {[
                      { key: 'a', label: 'A' },
                      { key: 'b', label: 'B' },
                      { key: 'c', label: 'C' },
                      { key: 'd', label: 'D' },
                    ].map(option => (
                      <div
                        key={option.key}
                        className={cn(
                          "w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2",
                          "flex items-center justify-center text-lg sm:text-xl font-bold",
                          "border-border bg-card text-foreground opacity-70"
                        )}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {isArabic ? '(معاينة فقط — لا يمكن اختيار إجابة)' : '(Preview only — selection disabled)'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="gap-2"
              >
                <ChevronRight className={cn("w-4 h-4", !isRTL && "rotate-180")} />
                {isArabic ? 'السابق' : 'Previous'}
              </Button>

              <Button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="gap-2"
              >
                {isArabic ? 'التالي' : 'Next'}
                <ChevronLeft className={cn("w-4 h-4", !isRTL && "rotate-180")} />
              </Button>
            </div>

            {/* Question indicators */}
            <div className="flex flex-wrap gap-2 pt-4 justify-center pb-8">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={cn(
                    "w-9 h-9 rounded-full text-sm font-medium transition-all",
                    currentQuestionIndex === idx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
