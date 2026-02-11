import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamSubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  answeredCount: number;
  totalQuestions: number;
  submitting: boolean;
}

export const ExamSubmitConfirmDialog: React.FC<ExamSubmitConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  answeredCount,
  totalQuestions,
  submitting,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;
  const allAnswered = answeredCount === totalQuestions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <div className="flex justify-center mb-2">
            {allAnswered ? (
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            )}
          </div>
          <DialogTitle className="text-center">
            {isArabic ? 'تأكيد تسليم الامتحان' : 'Confirm Submission'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {!allAnswered && (
              <span className="block text-amber-600 dark:text-amber-400 font-medium mb-1">
                {isArabic
                  ? `أجبت على ${answeredCount} من ${totalQuestions} أسئلة فقط`
                  : `You answered ${answeredCount} of ${totalQuestions} questions`}
              </span>
            )}
            {isArabic
              ? 'لن تتمكن من تغيير إجاباتك بعد التسليم.'
              : "You won't be able to change your answers after submission."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={submitting}
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting}
            loading={submitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isArabic ? 'تسليم الآن' : 'Submit Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
