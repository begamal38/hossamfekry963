import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CourseActivitySummary } from '@/hooks/useCourseActivitySummary';
import { supabase } from '@/integrations/supabase/client';

interface AISuggestionCardProps {
  summary: CourseActivitySummary;
  examAttempts?: number;
  avgExamScore?: number;
  className?: string;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({
  summary,
  examAttempts,
  avgExamScore,
  className,
}) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('student-advisor', {
        body: {
          activityData: {
            engagementScore: summary.engagementScore,
            coveragePercentage: summary.coveragePercentage,
            coverageLabel: summary.coverageLabel,
            consistencyScore: summary.consistencyScore,
            totalFocusSessions: summary.totalFocusSessions,
            totalActiveMinutes: summary.totalActiveMinutes,
            lessonsCompleted: summary.lessonsCompleted,
            totalLessons: summary.totalLessons,
            learningDays: summary.learningDays,
            examAttempts,
            avgExamScore,
          },
        },
      });

      if (fnError) {
        console.error('AI suggestion error:', fnError);
        setError('فشل في تحميل الاقتراح');
        return;
      }

      if (data?.error) {
        if (data.error === 'rate_limited') {
          setError('تم تجاوز الحد المسموح، حاول لاحقًا');
        } else if (data.error === 'payment_required') {
          setError('يرجى إضافة رصيد للمنصة');
        } else {
          setError('فشل في تحميل الاقتراح');
        }
        return;
      }

      setSuggestion(data?.suggestion || null);
    } catch (err) {
      console.error('AI suggestion fetch error:', err);
      setError('فشل في تحميل الاقتراح');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dismissed) {
      fetchSuggestion();
    }
  }, [summary, dismissed]);

  if (dismissed) {
    return null;
  }

  return (
    <Card className={cn(
      "overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">🔍 اقتراح ذكي</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => fetchSuggestion()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 text-sm leading-relaxed text-foreground/90" dir="rtl">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>جاري التحليل...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : suggestion ? (
            <p className="whitespace-pre-wrap">{suggestion}</p>
          ) : (
            <p className="text-muted-foreground">لا يوجد اقتراح متاح حاليًا</p>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
          هذا اقتراح إرشادي فقط • القرار النهائي للمعلم
        </p>
      </CardContent>
    </Card>
  );
};
