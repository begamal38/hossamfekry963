import React from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Clock, BookOpen, Users, Zap, Target, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InsightData {
  lessonDropoffs: { lessonId: string; title: string; dropoffRate: number }[];
  examFailures: { examId: string; title: string; failRate: number }[];
  lowProgressStudents: number;
  totalStudents: number;
  activeStudentsToday: number;
  chapterProgress: { chapterId: string; title: string; avgProgress: number }[];
  // Smart metrics
  avgScoreExcludingZero?: number;
  meaningfulFocusSessions?: number; // sessions > 2 min
  studentsWatchingNotTesting?: number;
}

interface SmartInsightItem {
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action: string;
  priority: number;
}

interface SmartInsightsProps {
  data: InsightData;
  isArabic: boolean;
}

/**
 * Smart Insights Engine - Rule-based actionable insights
 * Shows "What should I fix today?" with clear WHY and WHAT TO DO
 */
export const SmartInsights: React.FC<SmartInsightsProps> = ({ data, isArabic }) => {
  const insights: SmartInsightItem[] = [];

  // CRITICAL: High drop-off lessons
  const highDropoff = data.lessonDropoffs.filter(l => l.dropoffRate > 40);
  if (highDropoff.length > 0) {
    const topDropoff = highDropoff[0];
    insights.push({
      type: 'critical',
      title: isArabic ? 'توقف عالي جداً' : 'Critical Drop-off',
      description: isArabic 
        ? `${topDropoff.dropoffRate}% من الطلاب لم يحضروا "${topDropoff.title}"`
        : `${topDropoff.dropoffRate}% students missed "${topDropoff.title}"`,
      action: isArabic 
        ? 'أرسل تذكير فوري للطلاب المتغيبين'
        : 'Send reminder to absent students now',
      priority: 1,
    });
  }

  // CRITICAL: High exam failure rate
  const criticalExams = data.examFailures.filter(e => e.failRate > 50);
  if (criticalExams.length > 0) {
    insights.push({
      type: 'critical',
      title: isArabic ? 'نسبة رسوب خطيرة' : 'Critical Failure Rate',
      description: isArabic 
        ? `${criticalExams.length} امتحان نسبة الرسوب فيه أكثر من 50%`
        : `${criticalExams.length} exams have >50% failure rate`,
      action: isArabic 
        ? 'راجع صعوبة الأسئلة أو أضف شرح إضافي'
        : 'Review question difficulty or add explanations',
      priority: 1,
    });
  }

  // WARNING: Students watching but not testing
  if (data.studentsWatchingNotTesting && data.studentsWatchingNotTesting > 3) {
    insights.push({
      type: 'warning',
      title: isArabic ? 'مشاهدة بدون تفاعل' : 'Watching Without Testing',
      description: isArabic 
        ? `${data.studentsWatchingNotTesting} طالب يشاهدون الفيديو لكن لا يحلون الامتحانات`
        : `${data.studentsWatchingNotTesting} students watch videos but skip exams`,
      action: isArabic 
        ? 'تواصل معهم واسألهم عن السبب'
        : 'Reach out and ask why they skip exams',
      priority: 2,
    });
  }

  // WARNING: Low progress students
  const lowProgressPct = data.totalStudents > 0 
    ? Math.round((data.lowProgressStudents / data.totalStudents) * 100)
    : 0;
  if (lowProgressPct > 25) {
    insights.push({
      type: 'warning',
      title: isArabic ? 'تقدم ضعيف' : 'Low Progress Alert',
      description: isArabic 
        ? `${data.lowProgressStudents} طالب (${lowProgressPct}%) تقدمهم أقل من 25%`
        : `${data.lowProgressStudents} students (${lowProgressPct}%) have <25% progress`,
      action: isArabic 
        ? 'حدد الطلاب الأقل تقدماً وتواصل معهم'
        : 'Identify lowest progress students and reach out',
      priority: 2,
    });
  }

  // INFO: Moderate exam failures
  const moderateExams = data.examFailures.filter(e => e.failRate > 30 && e.failRate <= 50);
  if (moderateExams.length > 0) {
    insights.push({
      type: 'info',
      title: isArabic ? 'امتحانات تحتاج مراجعة' : 'Exams Need Review',
      description: isArabic 
        ? `${moderateExams.length} امتحان نسبة الرسوب فيه بين 30-50%`
        : `${moderateExams.length} exams have 30-50% failure rate`,
      action: isArabic 
        ? 'راجع إذا كانت الأسئلة واضحة'
        : 'Check if questions are clear',
      priority: 3,
    });
  }

  // INFO: Weak chapters
  const weakChapters = data.chapterProgress.filter(c => c.avgProgress < 30);
  if (weakChapters.length > 0) {
    insights.push({
      type: 'info',
      title: isArabic ? 'أبواب متأخرة' : 'Lagging Chapters',
      description: isArabic 
        ? `${weakChapters.length} باب متوسط التقدم فيهم أقل من 30%`
        : `${weakChapters.length} chapters have <30% avg progress`,
      action: isArabic 
        ? 'فعّل تذكيرات للطلاب في هذه الأبواب'
        : 'Enable reminders for students in these chapters',
      priority: 3,
    });
  }

  // SUCCESS: Active students
  if (data.activeStudentsToday > 0) {
    const activePct = data.totalStudents > 0 
      ? Math.round((data.activeStudentsToday / data.totalStudents) * 100)
      : 0;
    insights.push({
      type: 'success',
      title: isArabic ? 'نشاط جيد اليوم' : 'Good Activity Today',
      description: isArabic 
        ? `${data.activeStudentsToday} طالب (${activePct}%) نشط اليوم`
        : `${data.activeStudentsToday} students (${activePct}%) active today`,
      action: isArabic 
        ? 'استمر في نفس المستوى'
        : 'Keep up the momentum',
      priority: 4,
    });
  }

  // SUCCESS: Strong chapters
  const strongChapters = data.chapterProgress.filter(c => c.avgProgress > 70);
  if (strongChapters.length > 0) {
    insights.push({
      type: 'success',
      title: isArabic ? 'أبواب ممتازة' : 'Excellent Chapters',
      description: isArabic 
        ? `${strongChapters.length} باب نسبة التقدم فيهم أكثر من 70%`
        : `${strongChapters.length} chapters have >70% progress`,
      action: isArabic 
        ? 'كرر نفس الأسلوب في باقي الأبواب'
        : 'Replicate this approach in other chapters',
      priority: 5,
    });
  }

  // Sort by priority
  insights.sort((a, b) => a.priority - b.priority);

  const getTypeStyles = (type: SmartInsightItem['type']) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-500/10 border-red-500/30',
          icon: 'bg-red-500/20 text-red-600',
          badge: 'bg-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          icon: 'bg-amber-500/20 text-amber-600',
          badge: 'bg-amber-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30',
          icon: 'bg-blue-500/20 text-blue-600',
          badge: 'bg-blue-600'
        };
      case 'success':
        return {
          bg: 'bg-green-500/10 border-green-500/30',
          icon: 'bg-green-500/20 text-green-600',
          badge: 'bg-green-600'
        };
    }
  };

  const getTypeIcon = (type: SmartInsightItem['type']) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return TrendingDown;
      case 'info': return BookOpen;
      case 'success': return TrendingUp;
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-4">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {isArabic ? 'ماذا أصلح اليوم؟' : 'What should I fix today?'}
        </h3>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
          <p className="text-sm text-green-700 dark:text-green-400">
            {isArabic ? '✅ كله تمام — كمّل كده!' : '✅ All good — keep going!'}
          </p>
        </div>
      </div>
    );
  }

  // Take top 4 insights for mobile
  const displayInsights = insights.slice(0, 4);
  const criticalCount = displayInsights.filter(i => i.type === 'critical').length;
  const warningCount = displayInsights.filter(i => i.type === 'warning').length;

  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {isArabic ? 'ماذا أصلح اليوم؟' : 'What should I fix today?'}
        </h3>
        <div className="flex gap-1">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              {criticalCount}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge className="bg-amber-600 text-xs px-1.5 py-0.5">
              {warningCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {displayInsights.map((insight, index) => {
          const styles = getTypeStyles(insight.type);
          const Icon = getTypeIcon(insight.type);
          
          return (
            <div
              key={index}
              className={cn("rounded-lg border p-3", styles.bg)}
            >
              <div className="flex items-start gap-2">
                <div className={cn("p-1 rounded shrink-0", styles.icon)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Zap className="h-3 w-3 text-primary" />
                    <p className="text-xs font-medium text-primary">{insight.action}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {insights.length > 4 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          {isArabic 
            ? `+ ${insights.length - 4} رؤى أخرى`
            : `+ ${insights.length - 4} more insights`
          }
        </p>
      )}
    </div>
  );
};

export default SmartInsights;
