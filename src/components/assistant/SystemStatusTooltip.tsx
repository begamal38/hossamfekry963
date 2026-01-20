import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SystemStatusData } from '@/hooks/useSystemStatus';
import { cn } from '@/lib/utils';
import { 
  Users, 
  BookOpen, 
  Target, 
  CheckCircle, 
  XCircle,
  TrendingUp 
} from 'lucide-react';

interface SystemStatusTooltipProps {
  status: SystemStatusData;
  isRTL: boolean;
  children: React.ReactNode;
}

const statusColors = {
  critical: 'bg-black text-white',
  danger: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  success: 'bg-green-600 text-white',
};

export const SystemStatusTooltip = ({ status, isRTL, children }: SystemStatusTooltipProps) => {
  const metrics = status.metrics;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="start"
          className={cn(
            "w-72 p-0 overflow-hidden",
            isRTL && "text-right"
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className={cn(
            "px-4 py-3",
            statusColors[status.level]
          )}>
            <h4 className="font-bold text-sm mb-1">
              {isRTL ? 'حالة النظام' : 'System Status'}
            </h4>
            <p className="text-xs opacity-90">
              {status.description || (isRTL ? status.labelAr : status.labelEn)}
            </p>
          </div>
          
          {/* Metrics Grid */}
          {metrics && (
            <div className="p-3 bg-popover space-y-2">
              {/* Row 1: Students & Enrollments */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">
                    {isRTL ? 'طلاب:' : 'Students:'}
                  </span>
                  <span className="font-semibold">{metrics.totalStudents}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-muted-foreground">
                    {isRTL ? 'اشتراكات:' : 'Active:'}
                  </span>
                  <span className="font-semibold">{metrics.activeEnrollments}</span>
                </div>
              </div>
              
              {/* Row 2: Interactions */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Target className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-muted-foreground">
                    {isRTL ? 'تركيز:' : 'Focus:'}
                  </span>
                  <span className="font-semibold">{metrics.meaningfulFocusSessions}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-muted-foreground">
                    {isRTL ? 'حضور:' : 'Attendance:'}
                  </span>
                  <span className="font-semibold">{metrics.lessonAttendance}</span>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-border my-2" />
              
              {/* Row 3: Exam Performance */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {isRTL ? 'محاولات الامتحانات' : 'Exam Attempts'}
                  </span>
                  <span className="font-semibold">{metrics.totalExamAttempts}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">{metrics.passedExams}</span>
                    <span className="text-muted-foreground">
                      {isRTL ? 'نجاح' : 'pass'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span className="text-red-600 font-medium">{metrics.failedExams}</span>
                    <span className="text-muted-foreground">
                      {isRTL ? 'رسوب' : 'fail'}
                    </span>
                  </div>
                </div>
                
                {/* Pass Rate Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {isRTL ? 'نسبة النجاح' : 'Pass Rate'}
                    </span>
                    <span className={cn(
                      "font-bold",
                      metrics.passRate >= 60 ? 'text-green-600' :
                      metrics.passRate >= 40 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {metrics.passRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        metrics.passRate >= 60 ? 'bg-green-600' :
                        metrics.passRate >= 40 ? 'bg-amber-500' : 'bg-red-600'
                      )}
                      style={{ width: `${metrics.passRate}%` }}
                    />
                  </div>
                </div>
                
                {/* Average Score */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground">
                    {isRTL ? 'متوسط الدرجات' : 'Avg Score'}
                  </span>
                  <span className={cn(
                    "font-semibold",
                    metrics.avgExamScore >= 65 ? 'text-green-600' :
                    metrics.avgExamScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {metrics.avgExamScore}%
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* No data message */}
          {!metrics && !status.loading && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {isRTL ? 'لا توجد بيانات متاحة' : 'No data available'}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
