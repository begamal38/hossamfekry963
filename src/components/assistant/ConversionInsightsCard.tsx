import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Eye, Clock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ConversionInsight {
  type: 'conversion_ready' | 'high_engagement' | 'drop_off';
  title: string;
  count: number;
  details?: string;
}

interface ConversionInsightsCardProps {
  className?: string;
}

/**
 * Read-only insights panel for assistant teachers.
 * Shows: students close to conversion, most engaging content, drop-off points.
 */
export const ConversionInsightsCard: React.FC<ConversionInsightsCardProps> = ({ className }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [insights, setInsights] = useState<ConversionInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Fetch insights in parallel
        const [
          { data: freeViewers },
          { data: highEngagers },
          { data: dropOffs },
        ] = await Promise.all([
          // Students who watched free content but haven't enrolled
          supabase
            .from('free_lesson_analytics')
            .select('user_id, preview_seconds')
            .not('user_id', 'is', null)
            .is('enrolled_at', null)
            .gte('preview_seconds', 120) // Watched at least 2 minutes
            .order('preview_seconds', { ascending: false })
            .limit(50),
          
          // High engagement focus sessions (completed with good focus)
          supabase
            .from('focus_sessions')
            .select('user_id, course_id, total_active_seconds')
            .eq('is_completed', true)
            .gte('completed_segments', 3)
            .order('total_active_seconds', { ascending: false })
            .limit(20),
          
          // Recent sessions with high interruptions (potential drop-offs)
          supabase
            .from('focus_sessions')
            .select('lesson_id, interruptions')
            .gte('interruptions', 5)
            .order('created_at', { ascending: false })
            .limit(30),
        ]);

        const newInsights: ConversionInsight[] = [];

        // Unique users close to conversion
        const uniqueFreeViewers = new Set(freeViewers?.map(v => v.user_id) || []);
        if (uniqueFreeViewers.size > 0) {
          newInsights.push({
            type: 'conversion_ready',
            title: isArabic ? 'طلاب قريبين من التسجيل' : 'Students Close to Enrollment',
            count: uniqueFreeViewers.size,
            details: isArabic 
              ? 'شاهدوا محتوى مجاني لأكثر من دقيقتين'
              : 'Watched free content for 2+ minutes',
          });
        }

        // High engagers
        const uniqueEngagers = new Set(highEngagers?.map(e => e.user_id) || []);
        if (uniqueEngagers.size > 0) {
          newInsights.push({
            type: 'high_engagement',
            title: isArabic ? 'طلاب بتركيز عالي' : 'High Focus Students',
            count: uniqueEngagers.size,
            details: isArabic 
              ? 'أكملوا جلسات بتركيز ممتاز'
              : 'Completed sessions with excellent focus',
          });
        }

        // Drop-off points
        const dropOffLessons = new Set(dropOffs?.map(d => d.lesson_id) || []);
        if (dropOffLessons.size > 0) {
          newInsights.push({
            type: 'drop_off',
            title: isArabic ? 'حصص فيها انقطاعات' : 'Lessons with Interruptions',
            count: dropOffLessons.size,
            details: isArabic 
              ? 'تحتاج مراجعة المحتوى'
              : 'Content may need review',
          });
        }

        setInsights(newInsights);
      } catch (error) {
        console.error('Error fetching conversion insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [isArabic]);

  const getIcon = (type: ConversionInsight['type']) => {
    switch (type) {
      case 'conversion_ready':
        return <TrendingUp className="w-5 h-5" />;
      case 'high_engagement':
        return <Zap className="w-5 h-5" />;
      case 'drop_off':
        return <Eye className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getColor = (type: ConversionInsight['type']) => {
    switch (type) {
      case 'conversion_ready':
        return 'text-green-600 bg-green-500/10 border-green-500/30';
      case 'high_engagement':
        return 'text-primary bg-primary/10 border-primary/30';
      case 'drop_off':
        return 'text-amber-600 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-muted animate-pulse" />
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">
          {isArabic ? 'رؤى التحويل' : 'Conversion Insights'}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {isArabic ? 'للقراءة فقط' : 'Read-only'}
        </Badge>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {isArabic ? 'لا توجد رؤى حالياً' : 'No insights available'}
        </p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                getColor(insight.type)
              )}
            >
              <div className="p-1.5 rounded-full bg-current/10 flex-shrink-0">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{insight.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {insight.count}
                  </Badge>
                </div>
                {insight.details && (
                  <p className="text-xs text-muted-foreground">
                    {insight.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick summary */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {isArabic 
            ? 'هذه البيانات للمراجعة فقط — لا تتطلب إجراء'
            : 'This data is for review only — no action required'}
        </p>
      </div>
    </Card>
  );
};
