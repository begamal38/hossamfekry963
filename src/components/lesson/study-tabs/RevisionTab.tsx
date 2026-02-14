import React, { useMemo, useState } from 'react';
import { FileText, BookOpen, Hash, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface RevisionTabProps {
  revisionNotes: string | null;
}

interface RevisionSection {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: React.ReactNode;
  iconColor: string;
  items: string[];
}

function parseRevisionSections(text: string | null): RevisionSection[] {
  if (!text) return [];
  
  const sections: RevisionSection[] = [];
  const lines = text.split('\n');
  
  // Quick summary
  const summaryItems: string[] = [];
  let inSummary = false;
  
  for (const line of lines) {
    if (/📋|ملخص سريع/.test(line) && !line.trim().startsWith('-')) {
      inSummary = true;
      continue;
    }
    if (inSummary) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5 && !(/📐|📚|🔄/.test(clean) && !clean.startsWith('-'))) {
        summaryItems.push(clean);
      }
      if (/📐|📚|🔄/.test(line) && !line.trim().startsWith('-')) {
        inSummary = false;
      }
    }
  }
  
  if (summaryItems.length > 0) {
    sections.push({
      id: 'summary',
      titleAr: 'ملخص سريع',
      titleEn: 'Quick Summary',
      icon: <FileText className="w-4 h-4" />,
      iconColor: 'text-primary',
      items: summaryItems.slice(0, 4),
    });
  }
  
  // Key formulas/laws
  const lawItems: string[] = [];
  let inLaws = false;
  
  for (const line of lines) {
    if (/📐|أهم القوانين/.test(line) && !line.trim().startsWith('-')) {
      inLaws = true;
      continue;
    }
    if (inLaws && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) lawItems.push(clean);
    }
    if (inLaws && (/📋|📚|🔄/.test(line) && !line.trim().startsWith('-'))) {
      inLaws = false;
    }
  }
  
  if (lawItems.length > 0) {
    sections.push({
      id: 'laws',
      titleAr: 'أهم القوانين',
      titleEn: 'Key Formulas',
      icon: <BookOpen className="w-4 h-4" />,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      items: lawItems.slice(0, 5),
    });
  }
  
  // Key terms
  const termItems: string[] = [];
  let inTerms = false;
  
  for (const line of lines) {
    if (/📚|أهم المصطلحات/.test(line) && !line.trim().startsWith('-')) {
      inTerms = true;
      continue;
    }
    if (inTerms && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) termItems.push(clean);
    }
    if (inTerms && (/📋|📐|🔄/.test(line) && !line.trim().startsWith('-'))) {
      inTerms = false;
    }
  }
  
  if (termItems.length > 0) {
    sections.push({
      id: 'terms',
      titleAr: 'أهم المصطلحات',
      titleEn: 'Key Terms',
      icon: <Hash className="w-4 h-4" />,
      iconColor: 'text-violet-600 dark:text-violet-400',
      items: termItems.slice(0, 6),
    });
  }
  
  // Recurring exam ideas
  const recurringItems: string[] = [];
  let inRecurring = false;
  
  for (const line of lines) {
    if (/🔄|بتتكرر/.test(line) && !line.trim().startsWith('-')) {
      inRecurring = true;
      continue;
    }
    if (inRecurring && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) recurringItems.push(clean);
    }
    if (inRecurring && (/📋|📐|📚/.test(line) && !line.trim().startsWith('-'))) {
      inRecurring = false;
    }
  }
  
  if (recurringItems.length > 0) {
    sections.push({
      id: 'recurring',
      titleAr: 'أفكار بتتكرر في الامتحانات',
      titleEn: 'Recurring Exam Topics',
      icon: <RotateCcw className="w-4 h-4" />,
      iconColor: 'text-amber-600 dark:text-amber-400',
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
        icon: <FileText className="w-4 h-4" />,
        iconColor: 'text-primary',
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
    <div className="bg-muted/30 border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={section.iconColor}>{section.icon}</span>
          <h4 className="text-sm font-semibold text-foreground">
            {isArabic ? section.titleAr : section.titleEn}
          </h4>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {section.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
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
      <div className="bg-muted/30 rounded-xl p-4 text-center">
        <p className="text-muted-foreground text-sm">
          {isArabic ? 'لا يوجد محتوى لهذا القسم' : 'No content available'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {sections.map(section => (
        <RevisionSectionCard key={section.id} section={section} />
      ))}
    </div>
  );
}
