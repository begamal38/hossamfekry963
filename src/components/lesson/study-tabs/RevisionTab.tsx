import React, { useMemo, useState } from 'react';
import { FileText, BookOpen, Hash, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface RevisionTabProps {
  revisionNotes: string | null;
}

interface RevisionSection {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  items: string[];
}

function parseRevisionSections(text: string | null): RevisionSection[] {
  if (!text) return [];
  
  const sections: RevisionSection[] = [];
  const lines = text.split('\n');
  
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

  const summaryItems = extractSection([/📋|ملخص سريع/], [/📐|📚|🔄/]);
  if (summaryItems.length > 0) {
    sections.push({
      id: 'summary',
      titleAr: 'ملخص سريع',
      titleEn: 'Quick Summary',
      subtitleAr: 'راجع قبل الامتحان',
      icon: <FileText className="w-4 h-4" />,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      items: summaryItems.slice(0, 4),
    });
  }

  const lawItems = extractSection([/📐|أهم القوانين/], [/📋|📚|🔄/]);
  if (lawItems.length > 0) {
    sections.push({
      id: 'laws',
      titleAr: 'أهم القوانين',
      titleEn: 'Key Formulas',
      subtitleAr: '',
      icon: <BookOpen className="w-4 h-4" />,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      items: lawItems.slice(0, 5),
    });
  }

  const termItems = extractSection([/📚|أهم المصطلحات/], [/📋|📐|🔄/]);
  if (termItems.length > 0) {
    sections.push({
      id: 'terms',
      titleAr: 'أهم المصطلحات',
      titleEn: 'Key Terms',
      subtitleAr: '',
      icon: <Hash className="w-4 h-4" />,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-500/10',
      items: termItems.slice(0, 6),
    });
  }

  const recurringItems = extractSection([/🔄|بتتكرر/], [/📋|📐|📚/]);
  if (recurringItems.length > 0) {
    sections.push({
      id: 'recurring',
      titleAr: 'أفكار بتتكرر في الامتحانات',
      titleEn: 'Recurring Exam Topics',
      subtitleAr: 'النقطة دي بتيجي كتير',
      icon: <RotateCcw className="w-4 h-4" />,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10',
      items: recurringItems.slice(0, 5),
    });
  }

  // Fallback
  if (sections.length === 0 && text) {
    const fallbackItems: string[] = [];
    for (const line of lines) {
      const clean = line.replace(/^[\s\-•📌📝⚗️🎯📋📐📚🔄🔑⚖️🔗⚠️\d.]+/, '').trim();
      if (clean.length >= 10 && clean.length <= 200) {
        fallbackItems.push(clean);
      }
    }
    if (fallbackItems.length > 0) {
      sections.push({
        id: 'notes',
        titleAr: 'مراجعة سريعة',
        titleEn: 'Quick Review',
        subtitleAr: '',
        icon: <FileText className="w-4 h-4" />,
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        items: fallbackItems.slice(0, 8),
      });
    }
  }
  
  return sections;
}

function RevisionSectionCard({ section }: { section: RevisionSection }) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [open, setOpen] = useState(true);
  
  return (
    <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', section.iconBg)}>
            <span className={section.iconColor}>{section.icon}</span>
          </div>
          <div className="flex flex-col items-start">
            <h4 className="text-sm font-semibold text-foreground leading-tight">
              {isArabic ? section.titleAr : section.titleEn}
            </h4>
            {section.subtitleAr && isArabic && (
              <span className="text-[10px] text-muted-foreground mt-0.5">{section.subtitleAr}</span>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2.5">
          <Separator className="mb-2" />
          {section.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-[13px] text-foreground/80 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RevisionTab({ revisionNotes }: RevisionTabProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const sections = useMemo(
    () => parseRevisionSections(revisionNotes),
    [revisionNotes]
  );
  
  if (sections.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-5 text-center">
        <p className="text-muted-foreground text-sm">
          {isArabic ? 'لا يوجد محتوى لهذا القسم' : 'No content available'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {sections.map(section => (
        <RevisionSectionCard key={section.id} section={section} />
      ))}
    </div>
  );
}
