import React, { useMemo, useState } from 'react';
import { Lightbulb, BookOpen, Layers, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface ExplanationTabProps {
  summaryText: string | null;
  infographicText: string | null;
  /** Whether the course track is Arabic (determines content labels, not UI language) */
  isTrackArabic?: boolean;
}

interface ContentBlock {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  items: string[];
}

function parseIntoBlocks(summaryText: string | null, infographicText: string | null): ContentBlock[] {
  if (!summaryText && !infographicText) return [];
  
  const blocks: ContentBlock[] = [];
  const allText = [summaryText, infographicText].filter(Boolean).join('\n\n');
  const lines = allText.split('\n');
  
  const extractSection = (patterns: RegExp[], stopPatterns: RegExp[]): string[] => {
    const items: string[] = [];
    let active = false;
    for (const line of lines) {
      if (patterns.some(p => p.test(line)) && !line.trim().startsWith('-')) {
        active = true;
        continue;
      }
      if (active && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
        const clean = line.replace(/^[\s\-•]+/, '').trim();
        if (clean.length >= 5) items.push(clean);
      }
      if (active && stopPatterns.some(p => p.test(line)) && !line.trim().startsWith('-')) {
        active = false;
      }
    }
    return items;
  };

  const mainIdeaItems = extractSection(
    [/📌|أهم فكرة|أهم الفكرة/],
    [/📝|📐|⚗️|🎯|🔑|⚖️|🔗|⚠️|🔄/]
  );
  if (mainIdeaItems.length > 0) {
    blocks.push({
      id: 'main-idea',
      titleAr: 'أهم فكرة في الحصة',
      titleEn: 'Main Lesson Idea',
      subtitleAr: 'افهم بسرعة',
      icon: <Lightbulb className="w-4 h-4" />,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10',
      items: mainIdeaItems.slice(0, 4),
    });
  }

  const conceptItems = extractSection(
    [/📝|المفاهيم الأساسية|شرح المفاهيم/],
    [/📌|📐|⚗️|🎯|🔑|⚖️|🔗|⚠️|🔄/]
  );
  if (conceptItems.length > 0) {
    blocks.push({
      id: 'concepts',
      titleAr: 'المفاهيم الأساسية',
      titleEn: 'Key Concepts',
      subtitleAr: '',
      icon: <BookOpen className="w-4 h-4" />,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      items: conceptItems.slice(0, 6),
    });
  }

  const relationItems = extractSection(
    [/🔗|علاقات|العلاقات/],
    [/📌|📝|📐|⚗️|🎯|🔑|⚖️|⚠️|🔄/]
  );
  if (relationItems.length > 0) {
    blocks.push({
      id: 'relationships',
      titleAr: 'العلاقات بين المفاهيم',
      titleEn: 'Concept Relationships',
      subtitleAr: '',
      icon: <Layers className="w-4 h-4" />,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-500/10',
      items: relationItems.slice(0, 5),
    });
  }

  const examItems = extractSection(
    [/🎯|⚠️|🔄|مهم للامتحان|ربط.*بالامتحان|بتتكرر|ملاحظات مهمة/],
    [/📌|📝|📐|🔑|🔗/]
  );
  if (examItems.length > 0) {
    blocks.push({
      id: 'exam-focus',
      titleAr: 'مهم للامتحان',
      titleEn: 'Exam Focus',
      subtitleAr: 'النقطة دي بتيجي كتير',
      icon: <Target className="w-4 h-4" />,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-500/10',
      items: examItems.slice(0, 5),
    });
  }

  // Fallback
  if (blocks.length === 0 && allText) {
    const fallbackItems: string[] = [];
    for (const line of lines) {
      const clean = line.replace(/^[\s\-•📌📝⚗️🎯📋📐📚🔄🔑⚖️🔗⚠️\d.]+/, '').trim();
      if (clean.length >= 10 && clean.length <= 200) {
        fallbackItems.push(clean);
      }
    }
    if (fallbackItems.length > 0) {
      blocks.push({
        id: 'overview',
        titleAr: 'ملخص الشرح',
        titleEn: 'Explanation Summary',
        subtitleAr: '',
        icon: <BookOpen className="w-4 h-4" />,
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        items: fallbackItems.slice(0, 8),
      });
    }
  }
  
  return blocks;
}

function ContentBlockCard({ block, isLast, isTrackArabic }: { block: ContentBlock; isLast: boolean; isTrackArabic: boolean }) {
  const [open, setOpen] = useState(true);
  const isArabic = isTrackArabic;
  
  return (
    <div className="space-y-0">
      <div className="rounded-xl overflow-hidden transition-all bg-card border border-border/60 shadow-sm">
        <button
          onClick={() => setOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', block.iconBg)}>
              <span className={block.iconColor}>{block.icon}</span>
            </div>
            <div className="flex flex-col items-start">
              <h4 className="text-sm font-semibold text-foreground leading-tight">
                {isArabic ? block.titleAr : block.titleEn}
              </h4>
              {block.subtitleAr && isArabic && (
                <span className="text-[10px] text-muted-foreground mt-0.5">{block.subtitleAr}</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full ms-1">
              {block.items.length}
            </span>
          </div>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
        
        {open && (
          <div className="px-4 pb-4 pt-1 space-y-2.5">
            <Separator className="mb-2" />
            {block.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/25 mt-2 shrink-0" />
                <p className="text-[13px] text-foreground/80 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ExplanationTab({ summaryText, infographicText, isTrackArabic = true }: ExplanationTabProps) {
  const { language } = useLanguage();
  const isUIArabic = language === 'ar';
  
  const blocks = useMemo(
    () => parseIntoBlocks(summaryText, infographicText),
    [summaryText, infographicText]
  );
  
  if (blocks.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-5 text-center">
        <p className="text-muted-foreground text-sm">
          {isUIArabic ? 'لا يوجد محتوى لهذا القسم' : 'No content available'}
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', isTrackArabic ? 'text-right' : 'text-left')}>
      {blocks.map((block, i) => (
        <ContentBlockCard key={block.id} block={block} isLast={i === blocks.length - 1} isTrackArabic={isTrackArabic} />
      ))}
    </div>
  );
}
