import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Eye, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Users,
  BarChart3,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type UserRole = 'student' | 'assistant_teacher';

interface GuidanceItem {
  icon: React.ElementType;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
}

const studentGuidance: GuidanceItem[] = [
  {
    icon: Monitor,
    title: { ar: 'شاهد من داخل المنصة', en: 'Watch Inside the Platform' },
    description: {
      ar: 'عشان نسجل تركيزك بشكل صحيح، لازم تشاهد الحصص من داخل الموقع مش من اليوتيوب مباشرة. الموقع بيتتبع وقت مشاهدتك الفعلي.',
      en: 'To track your focus correctly, watch lessons inside the website, not directly on YouTube. The platform tracks your actual viewing time.',
    },
  },
  {
    icon: Eye,
    title: { ar: 'نظام التركيز (Focus Mode)', en: 'Focus Mode System' },
    description: {
      ar: 'لما بتشغل الفيديو، بيبدأ نظام التركيز يحسب وقت مشاهدتك الفعلي. لو وقفت الفيديو أو خرجت من الصفحة، الوقت بيتوقف.',
      en: 'When you play the video, the Focus Mode starts counting your actual viewing time. If you pause or leave the page, the timer stops.',
    },
  },
  {
    icon: Clock,
    title: { ar: 'فترات الـ 20 دقيقة', en: '20-Minute Segments' },
    description: {
      ar: 'كل 20 دقيقة تركيز متواصل بتتحسب كـ "فترة تركيز كاملة". المدرس بيشوف كام فترة أنت كملت.',
      en: 'Every 20 minutes of continuous focus counts as a "complete focus segment". Your teacher can see how many segments you completed.',
    },
  },
  {
    icon: AlertTriangle,
    title: { ar: 'الانقطاعات', en: 'Interruptions' },
    description: {
      ar: 'لو وقفت الفيديو كتير أو خرجت من الصفحة، بيتم تسجيلها كـ "انقطاعات". حاول تقلل الانقطاعات عشان تركيزك يبان أحسن.',
      en: 'If you pause often or leave the page, these are recorded as "interruptions". Try to minimize them for better focus scores.',
    },
  },
  {
    icon: CheckCircle2,
    title: { ar: 'إكمال الحصة', en: 'Completing a Lesson' },
    description: {
      ar: 'بعد ما تخلص الفيديو، اضغط "خلصت الحصة" عشان تتسجل. المدرس بيشوف مين كمل ومين لأ.',
      en: 'After finishing the video, click "Mark Complete" to record it. Your teacher can see who completed and who didn\'t.',
    },
  },
  {
    icon: Target,
    title: { ar: 'إحصائياتك', en: 'Your Statistics' },
    description: {
      ar: 'تقدر تشوف إحصائيات تركيزك في صفحة "المنصة" (Dashboard). دي بتوريك وقت تركيزك الفعلي وعدد الانقطاعات.',
      en: 'You can view your focus stats on the Dashboard. It shows your actual focus time and interruption count.',
    },
  },
];

const assistantGuidance: GuidanceItem[] = [
  {
    icon: Eye,
    title: { ar: 'بيانات التركيز الفعلي', en: 'Real Focus Data' },
    description: {
      ar: 'المنصة بتسجل وقت مشاهدة الطالب الفعلي من داخل الموقع. دا مختلف عن "إكمال الحصة" اللي ممكن يكون الطالب ضغط عليه بس.',
      en: 'The platform records actual student viewing time from inside the website. This is different from "lesson completion" which students can click without watching.',
    },
  },
  {
    icon: BarChart3,
    title: { ar: 'تحليل الأبواب', en: 'Chapter Analytics' },
    description: {
      ar: 'في صفحة التقارير، كل باب بيوريك: إجمالي دقائق التركيز، عدد الطلاب اللي شاهدوا فعلياً، متوسط المشاهدة لكل طالب، ونسبة تغطية المشاهدة.',
      en: 'In Reports, each chapter shows: total focus minutes, students who actually watched, average viewing per student, and viewing coverage percentage.',
    },
  },
  {
    icon: Users,
    title: { ar: 'مقارنة الإكمال vs التركيز', en: 'Completion vs Focus' },
    description: {
      ar: 'لو طالب سجل إكمال بس وقت تركيزه ضعيف، دا معناه إنه ممكن يكون ضغط "خلصت" بدون ما يتفرج فعلياً.',
      en: 'If a student logged completion but has low focus time, it might mean they clicked "Complete" without actually watching.',
    },
  },
  {
    icon: Clock,
    title: { ar: 'فترات التركيز (Segments)', en: 'Focus Segments' },
    description: {
      ar: 'كل 20 دقيقة تركيز متواصل بتتحسب كفترة. الطالب اللي عنده فترات كتير يعني ركز فعلياً مش بس شغل الفيديو وسابه.',
      en: 'Every 20 minutes of continuous focus counts as a segment. Students with many segments actually focused, not just left the video running.',
    },
  },
  {
    icon: AlertTriangle,
    title: { ar: 'الانقطاعات', en: 'Interruptions' },
    description: {
      ar: 'الانقطاعات بتتسجل لما الطالب يوقف الفيديو أو يخرج من الصفحة. كتير انقطاعات = تركيز ضعيف.',
      en: 'Interruptions are recorded when students pause or leave the page. Many interruptions = weak focus.',
    },
  },
  {
    icon: BookOpen,
    title: { ar: 'تفاصيل الطالب', en: 'Student Details' },
    description: {
      ar: 'في صفحة تفاصيل الطالب، تقدر تشوف إحصائيات تركيزه الكاملة: إجمالي الدقائق، الفترات المكتملة، والانقطاعات.',
      en: 'In Student Details page, you can see their complete focus stats: total minutes, completed segments, and interruptions.',
    },
  },
  {
    icon: Lightbulb,
    title: { ar: 'نصيحة', en: 'Tip' },
    description: {
      ar: 'ركز على "تغطية المشاهدة" و"متوسط الدقائق لكل طالب" كمؤشرات حقيقية للتفاعل، مش بس أرقام الإكمال.',
      en: 'Focus on "Viewing Coverage" and "Average Minutes per Student" as real engagement indicators, not just completion numbers.',
    },
  },
];

interface PlatformGuidanceProps {
  role: UserRole;
  isArabic: boolean;
  triggerClassName?: string;
}

export const PlatformGuidance: React.FC<PlatformGuidanceProps> = ({
  role,
  isArabic,
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false);
  const [hasSeenGuidance, setHasSeenGuidance] = useState(true);

  const storageKey = `platform_guidance_seen_${role}`;
  const guidance = role === 'student' ? studentGuidance : assistantGuidance;

  useEffect(() => {
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen) {
        setHasSeenGuidance(false);
      }
    } catch {
      // Storage not available
    }
  }, [storageKey]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !hasSeenGuidance) {
      try {
        localStorage.setItem(storageKey, 'true');
        setHasSeenGuidance(true);
      } catch {
        // Storage not available
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("gap-1.5 relative text-xs sm:text-sm px-2 sm:px-3", triggerClassName)}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden xs:inline">
            {isArabic ? 'كيف يعمل النظام؟' : 'How it works?'}
          </span>
          <span className="xs:hidden">
            {isArabic ? 'دليل' : 'Guide'}
          </span>
          {!hasSeenGuidance && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side={isArabic ? 'right' : 'left'} 
        className="w-[90vw] max-w-md sm:max-w-lg overflow-y-auto p-4 sm:p-6"
      >
        <SheetHeader className="mb-4 sm:mb-6">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {isArabic 
              ? (role === 'student' ? 'دليل الطالب' : 'دليل المدرس المساعد')
              : (role === 'student' ? 'Student Guide' : 'Assistant Teacher Guide')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          {guidance.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className="p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground text-sm mb-0.5">
                      {isArabic ? item.title.ar : item.title.en}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isArabic ? item.description.ar : item.description.en}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            💡 {isArabic 
              ? 'لو عندك أي سؤال، تواصل معانا!'
              : 'If you have any questions, contact us!'}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
