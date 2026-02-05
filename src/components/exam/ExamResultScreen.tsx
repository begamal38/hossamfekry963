import React from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamResultScreenProps {
  score: number;
  total: number;
  courseId: string;
  onBackToCourse: () => void;
  onToPlatform: () => void;
}

/**
 * ExamResultScreen - Results display after exam completion
 * 
 * Features:
 * - Clear pass/fail indication
 * - Score display
 * - Navigation options
 */
export const ExamResultScreen: React.FC<ExamResultScreenProps> = ({
  score,
  total,
  onBackToCourse,
  onToPlatform,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 60;

  return (
    <div className="container mx-auto px-4 max-w-lg py-8 content-appear">
      <Card className="text-center border-0 shadow-lg">
        <CardContent className="py-12 px-6">
          {/* Result Icon */}
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

          {/* Result Title */}
          <h1 className="text-3xl font-bold mb-2">
            {passed 
              ? (isArabic ? 'أحسنت! 🎉' : 'Well Done! 🎉')
              : (isArabic ? 'حاول مرة تانية' : 'Try Again')
            }
          </h1>

          {/* Score Display */}
          <div className="text-5xl font-bold text-primary my-6 tabular-nums">
            {score}/{total}
          </div>

          {/* Percentage */}
          <p className="text-xl mb-2 tabular-nums">
            {percentage}%
          </p>

          {/* Status Message */}
          <div className="mb-8 space-y-2">
            <p className={cn(
              "text-lg font-semibold",
              passed ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
            )}>
              {passed
                ? (isArabic ? '✅ اجتزت الاختبار بنجاح!' : '✅ You passed the exam!')
                : (isArabic ? '⚠️ لم تجتز — حاول مرة تانية' : '⚠️ Did not pass — try again')
              }
            </p>
            <p className="text-muted-foreground">
              {passed
                ? (isArabic ? 'ممتاز 👏 كمّل للباب التالي' : 'Excellent! Continue to the next chapter')
                : (isArabic ? 'راجع الحصص وحاول من جديد' : 'Review the lessons and try again')
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onBackToCourse}
              className="w-full h-12"
            >
              {isArabic ? 'العودة للكورس' : 'Back to Course'}
            </Button>
            <Button 
              variant="outline"
              onClick={onToPlatform}
              className="w-full h-12"
            >
              {isArabic ? 'للمنصة' : 'To Platform'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guidance Card */}
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
  );
};
