import React, { useState } from 'react';
import { ImageOff, ZoomIn, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn, wrapChemicalEquations } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamQuestionCardProps {
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
  questionImageUrl: string | null;
  selectedAnswer: string | undefined;
  onSelectAnswer: (option: string) => void;
}

/**
 * ExamQuestionCard - Main question display with image zoom support
 * 
 * Features:
 * - Image-first design
 * - Tap-to-zoom on mobile
 * - Graceful error handling for failed images
 * - A/B/C/D selection buttons
 */
export const ExamQuestionCard: React.FC<ExamQuestionCardProps> = ({
  questionIndex,
  totalQuestions,
  questionText,
  questionImageUrl,
  selectedAnswer,
  onSelectAnswer,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageClick = () => {
    if (questionImageUrl && !imageError) {
      setIsZoomed(true);
    }
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  return (
    <>
      <Card className="overflow-hidden border-0 shadow-sm bg-card">
        {/* Question Number Header */}
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              {questionIndex + 1}
            </span>
            <span className="text-sm text-muted-foreground">
              {isArabic ? `من ${totalQuestions}` : `of ${totalQuestions}`}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-6">
          {/* Question Content - Image or Text */}
          {questionImageUrl && !imageError ? (
            <div 
              className="relative rounded-xl overflow-hidden bg-muted/30 border cursor-pointer group"
              onClick={handleImageClick}
            >
              <img 
                src={questionImageUrl} 
                alt={isArabic ? `السؤال ${questionIndex + 1}` : `Question ${questionIndex + 1}`}
                className="w-full h-auto max-h-[50vh] object-contain mx-auto"
                loading="eager"
                onError={handleImageError}
              />
              {/* Zoom hint */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
                <ZoomIn className="w-3.5 h-3.5" />
                {isArabic ? 'اضغط للتكبير' : 'Tap to zoom'}
              </div>
            </div>
          ) : questionImageUrl && imageError ? (
            /* Image Load Error State */
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-muted/30 border text-center">
              <ImageOff className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'تعذر تحميل صورة السؤال' : 'Failed to load question image'}
              </p>
            </div>
          ) : questionText ? (
            /* Text Question Fallback */
            <div className="p-4 rounded-xl bg-muted/30 border">
              <p className="text-base leading-relaxed" dir="auto">
                {wrapChemicalEquations(questionText)}
              </p>
            </div>
          ) : null}
          
          {/* Answer Selection - A/B/C/D Buttons */}
          <div className="pt-2">
            <p className="text-sm text-muted-foreground text-center mb-4">
              {isArabic ? 'اختر الإجابة الصحيحة:' : 'Select the correct answer:'}
            </p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
              {[
                { key: 'a', label: 'A' },
                { key: 'b', label: 'B' },
                { key: 'c', label: 'C' },
                { key: 'd', label: 'D' },
              ].map(option => (
                <button
                  key={option.key}
                  onClick={() => onSelectAnswer(option.key)}
                  className={cn(
                    "w-[3.25rem] h-[3.25rem] sm:w-16 sm:h-16 rounded-xl border-2 transition-all duration-200",
                    "flex items-center justify-center text-base sm:text-xl font-bold",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "active:scale-[0.98]",
                    selectedAnswer === option.key
                      ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                      : "border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Zoom Modal */}
      {isZoomed && questionImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={handleCloseZoom}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={handleCloseZoom}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={questionImageUrl}
            alt={isArabic ? `السؤال ${questionIndex + 1}` : `Question ${questionIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
