import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReviewQuestion {
  id: string;
  question_text: string;
  question_image_url: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

interface ExamReviewScreenProps {
  questions: ReviewQuestion[];
  answers: Record<string, string>;
  onBack: () => void;
}

const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const;

const getOptionText = (q: ReviewQuestion, key: string) => {
  const map: Record<string, string> = {
    a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d,
  };
  return map[key] || '';
};

export const ExamReviewScreen: React.FC<ExamReviewScreenProps> = ({
  questions, answers, onBack,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="container mx-auto px-4 max-w-2xl py-6 pb-[220px] md:pb-20 content-appear">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <BackIcon className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">
          {isArabic ? 'مراجعة الإجابات' : 'Review Answers'}
        </h1>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const selected = answers[q.id];
          const isCorrect = selected === q.correct_option;

          return (
            <Card key={q.id} className={cn(
              "border transition-colors",
              isCorrect ? "border-green-500/30" : "border-red-500/30"
            )}>
              <CardContent className="py-4 px-4 space-y-3">
                {/* Question header */}
                <div className="flex items-start gap-2">
                  <span className={cn(
                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isCorrect ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                  )}>
                    {idx + 1}
                  </span>
                  <p className="text-sm font-medium text-foreground leading-relaxed pt-1">
                    {q.question_text}
                  </p>
                </div>

                {/* Question image */}
                {q.question_image_url && (
                  <img
                    src={q.question_image_url}
                    alt=""
                    className="w-full max-h-48 object-contain rounded-lg bg-muted/50"
                    loading="lazy"
                  />
                )}

                {/* Options */}
                <div className="space-y-2">
                  {OPTION_KEYS.map(key => {
                    const text = getOptionText(q, key);
                    const isSelected = selected === key;
                    const isCorrectOption = q.correct_option === key;

                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors",
                          isCorrectOption && "bg-green-500/10 border-green-500/40",
                          isSelected && !isCorrectOption && "bg-red-500/10 border-red-500/40",
                          !isSelected && !isCorrectOption && "border-border/50 opacity-60"
                        )}
                      >
                        {/* Status icon */}
                        {isCorrectOption && (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        )}
                        {isSelected && !isCorrectOption && (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                        {!isSelected && !isCorrectOption && (
                          <span className="w-4 h-4 shrink-0" />
                        )}
                        <span className={cn(
                          "uppercase font-bold w-5",
                          isCorrectOption ? "text-green-600" : isSelected ? "text-red-600" : "text-muted-foreground"
                        )}>
                          {key}
                        </span>
                        <span className="flex-1">{text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Result badge */}
                <div className={cn(
                  "text-xs font-medium px-3 py-1 rounded-full w-fit",
                  isCorrect ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                  {isCorrect
                    ? (isArabic ? '✔ إجابة صحيحة' : '✔ Correct')
                    : (isArabic ? '✖ إجابة خاطئة' : '✖ Wrong')
                  }
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Back button at bottom */}
      <div className="mt-6">
        <Button variant="outline" onClick={onBack} className="w-full h-11">
          <BackIcon className={cn("w-4 h-4", isArabic ? "ml-2" : "mr-2")} />
          {isArabic ? 'العودة للنتيجة' : 'Back to Result'}
        </Button>
      </div>
    </div>
  );
};
