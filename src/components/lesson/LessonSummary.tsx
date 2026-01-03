import { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LessonSummaryProps {
  lessonId: string;
  videoUrl: string | null;
  lessonTitle: string;
  isStaff?: boolean;
  className?: string;
}

export function LessonSummary({ 
  lessonId, 
  videoUrl, 
  lessonTitle, 
  isStaff = false,
  className 
}: LessonSummaryProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing summary on mount
  useEffect(() => {
    fetchExistingSummary();
  }, [lessonId]);

  const fetchExistingSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('lessons')
        .select('summary_ar')
        .eq('id', lessonId)
        .single();

      if (fetchError) {
        console.error('Error fetching summary:', fetchError);
        setError('فشل تحميل الملخص');
        return;
      }

      if (data?.summary_ar) {
        setSummary(data.summary_ar);
      } else {
        // No summary exists, try to generate one
        await generateSummary(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = async (forceRegenerate: boolean) => {
    try {
      if (forceRegenerate) {
        setIsRegenerating(true);
      }
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke('generate-lesson-summary', {
        body: { 
          lessonId, 
          videoUrl, 
          lessonTitle,
          forceRegenerate 
        }
      });

      if (invokeError) {
        console.error('Error generating summary:', invokeError);
        if (!summary) {
          setError('فشل إنشاء الملخص');
        }
        return;
      }

      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error:', err);
      if (!summary) {
        setError('حدث خطأ');
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = () => {
    generateSummary(true);
  };

  const toggleVisibility = () => {
    setIsHidden(!isHidden);
  };

  // Parse bullet points from summary
  const parseSummaryPoints = (text: string): string[] => {
    if (!text) return [];
    
    // Split by bullet points or newlines
    const lines = text.split(/\n|(?=•)|(?=-)/).filter(line => line.trim());
    
    return lines.map(line => 
      line.replace(/^[•\-\*]\s*/, '').trim()
    ).filter(line => line.length > 0);
  };

  const summaryPoints = summary ? parseSummaryPoints(summary) : [];

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "bg-card border rounded-2xl p-6 animate-pulse",
        className
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted" />
          <div className="h-6 w-32 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/5" />
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          جاري تجهيز ملخص الحصة...
        </p>
      </div>
    );
  }

  // Error state with no summary
  if (error && !summary) {
    return (
      <div className={cn(
        "bg-card border rounded-2xl p-6",
        className
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">ملخص الحصة</h3>
        </div>
        <p className="text-muted-foreground text-center py-4">
          جاري تجهيز ملخص الحصة...
        </p>
        {isStaff && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              إعادة المحاولة
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card border rounded-2xl p-6 transition-all duration-300",
      isHidden && "opacity-60",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">ملخص الحصة</h3>
        </div>
        
        {/* Staff Controls */}
        {isStaff && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVisibility}
              className="h-8 w-8"
              title={isHidden ? 'إظهار الملخص' : 'إخفاء الملخص'}
            >
              {isHidden ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="h-8 w-8"
              title="إعادة إنشاء الملخص"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Summary Content */}
      {!isHidden && (
        <div className="space-y-3">
          {summaryPoints.length > 0 ? (
            <ul className="space-y-2.5" dir="rtl">
              {summaryPoints.map((point, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-3 text-foreground/90 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : summary ? (
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line" dir="rtl">
              {summary}
            </p>
          ) : null}
        </div>
      )}

      {/* Hidden state message */}
      {isHidden && isStaff && (
        <p className="text-muted-foreground text-sm text-center py-2">
          الملخص مخفي عن الطلاب حاليًا
        </p>
      )}

      {/* Regenerating indicator */}
      {isRegenerating && (
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>جاري إعادة إنشاء الملخص...</span>
        </div>
      )}
    </div>
  );
}
