import React from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Clock, BookOpen, Award, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InsightData {
  lessonDropoffs: { lessonId: string; title: string; dropoffRate: number }[];
  examFailures: { examId: string; title: string; failRate: number }[];
  lowProgressStudents: number;
  avgCompletionTime: number;
  activeStudentsToday: number;
  totalStudents: number;
  chapterProgress: { chapterId: string; title: string; avgProgress: number }[];
}

interface ActionableInsightsProps {
  data: InsightData;
  isArabic: boolean;
}

export const ActionableInsights: React.FC<ActionableInsightsProps> = ({ data, isArabic }) => {
  const insights: { type: 'warning' | 'info' | 'success'; icon: React.ReactNode; message: string; priority: number }[] = [];

  // Analyze drop-off points
  const highDropoff = data.lessonDropoffs.filter(l => l.dropoffRate > 30);
  if (highDropoff.length > 0) {
    insights.push({
      type: 'warning',
      icon: <TrendingDown className="h-4 w-4" />,
      message: isArabic 
        ? `⚠️ ${highDropoff.length} حصص فيها نسبة توقف عالية — راجع المحتوى`
        : `⚠️ ${highDropoff.length} lessons have high drop-off rates — review content`,
      priority: 1,
    });
  }

  // Analyze exam failures
  const highFailExams = data.examFailures.filter(e => e.failRate > 40);
  if (highFailExams.length > 0) {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle className="h-4 w-4" />,
      message: isArabic 
        ? `📉 نسبة الرسوب عالية في ${highFailExams.length} امتحان — الأسئلة محتاجة مراجعة`
        : `📉 High failure rate in ${highFailExams.length} exams — review questions`,
      priority: 1,
    });
  }

  // Low progress students
  if (data.lowProgressStudents > 0) {
    const percentage = Math.round((data.lowProgressStudents / data.totalStudents) * 100);
    if (percentage > 20) {
      insights.push({
        type: 'warning',
        icon: <Users className="h-4 w-4" />,
        message: isArabic 
          ? `👥 ${data.lowProgressStudents} طالب (${percentage}%) تقدمهم أقل من 25% — تواصل معهم`
          : `👥 ${data.lowProgressStudents} students (${percentage}%) have <25% progress — reach out`,
        priority: 2,
      });
    }
  }

  // Chapter bottlenecks
  const weakChapters = data.chapterProgress.filter(c => c.avgProgress < 30);
  if (weakChapters.length > 0) {
    insights.push({
      type: 'info',
      icon: <BookOpen className="h-4 w-4" />,
      message: isArabic 
        ? `📚 ${weakChapters.length} باب متوسط التقدم فيهم ضعيف`
        : `📚 ${weakChapters.length} chapters have low average progress`,
      priority: 2,
    });
  }

  // Positive insights
  const strongChapters = data.chapterProgress.filter(c => c.avgProgress > 70);
  if (strongChapters.length > 0) {
    insights.push({
      type: 'success',
      icon: <TrendingUp className="h-4 w-4" />,
      message: isArabic 
        ? `✅ ${strongChapters.length} باب نسبة التقدم فيهم ممتازة`
        : `✅ ${strongChapters.length} chapters have excellent progress rates`,
      priority: 3,
    });
  }

  // Active students
  if (data.activeStudentsToday > 0) {
    insights.push({
      type: 'success',
      icon: <Clock className="h-4 w-4" />,
      message: isArabic 
        ? `🟢 ${data.activeStudentsToday} طالب نشط اليوم`
        : `🟢 ${data.activeStudentsToday} students active today`,
      priority: 3,
    });
  }

  // Sort by priority
  insights.sort((a, b) => a.priority - b.priority);

  if (insights.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          {isArabic ? 'رؤى قابلة للتنفيذ' : 'Actionable Insights'}
        </h3>
        <p className="text-muted-foreground text-center py-4">
          {isArabic ? 'لا توجد رؤى حالياً — البيانات تبدو جيدة!' : 'No insights yet — data looks good!'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        {isArabic ? 'رؤى قابلة للتنفيذ' : 'Actionable Insights'}
        <Badge variant="secondary" className="text-xs">
          {insights.length}
        </Badge>
      </h3>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              insight.type === 'warning' && "bg-amber-500/10 border-amber-500/30",
              insight.type === 'info' && "bg-blue-500/10 border-blue-500/30",
              insight.type === 'success' && "bg-green-500/10 border-green-500/30"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-full shrink-0",
              insight.type === 'warning' && "bg-amber-500/20 text-amber-600",
              insight.type === 'info' && "bg-blue-500/20 text-blue-600",
              insight.type === 'success' && "bg-green-500/20 text-green-600"
            )}>
              {insight.icon}
            </div>
            <p className="text-sm font-medium">{insight.message}</p>
          </div>
        ))}
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{data.totalStudents}</p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'إجمالي الطلاب' : 'Total Students'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{data.activeStudentsToday}</p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'نشط اليوم' : 'Active Today'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">{data.lowProgressStudents}</p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'تقدم ضعيف' : 'Low Progress'}</p>
        </div>
      </div>
    </div>
  );
};
