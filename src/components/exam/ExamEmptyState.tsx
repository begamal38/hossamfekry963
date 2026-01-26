import React from 'react';
import { ClipboardList, Bell, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamEmptyStateProps {
  variant: 'student' | 'assistant';
  className?: string;
}

/**
 * ExamEmptyState - Calm placeholder when no exams are available
 * 
 * Student variant:
 * - Friendly, reassuring tone
 * - Notification promise
 * 
 * Assistant variant:
 * - Instructional guidance
 * - System behavior explanation
 */
export const ExamEmptyState: React.FC<ExamEmptyStateProps> = ({
  variant,
  className,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const content = {
    student: {
      icon: ClipboardList,
      title: isArabic ? 'لا يوجد امتحانات متاحة حاليًا' : 'No exams available right now',
      subtitle: isArabic 
        ? 'سيتم إشعارك فور نشر أي امتحان جديد' 
        : 'You\'ll be notified when new exams are published',
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    assistant: {
      icon: FileText,
      title: isArabic ? 'لم يتم نشر امتحانات بعد' : 'No exams published yet',
      subtitle: isArabic 
        ? 'عند إنشاء امتحان، سيظهر هنا تلقائيًا للطلاب حسب مسارهم الدراسي' 
        : 'When you create an exam, it will automatically appear to students based on their enrolled courses',
      iconBg: 'bg-secondary',
      iconColor: 'text-secondary-foreground',
    },
  };

  const { icon: Icon, title, subtitle, iconBg, iconColor } = content[variant];

  return (
    <Card className={cn(
      "border-dashed border-2 bg-card/50",
      className
    )}>
      <CardContent className="py-12 text-center">
        {/* Icon container */}
        <div className={cn(
          "w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center",
          iconBg
        )}>
          <Icon className={cn("w-8 h-8", iconColor)} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>

        {/* Subtitle with notification hint for students */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground max-w-sm mx-auto">
          {variant === 'student' && (
            <Bell className="w-4 h-4 shrink-0 text-muted-foreground/60" />
          )}
          <p>{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
};
