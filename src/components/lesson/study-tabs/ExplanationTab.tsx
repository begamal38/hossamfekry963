import React, { useMemo, useState } from 'react';
import { Lightbulb, BookOpen, Layers, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ExplanationTabProps {
  summaryText: string | null;
  infographicText: string | null;
}

interface ContentBlock {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  items: string[];
}

function parseIntoBlocks(summaryText: string | null, infographicText: string | null): ContentBlock[] {
  if (!summaryText && !infographicText) return [];
  
  const blocks: ContentBlock[] = [];
  const allText = [summaryText, infographicText].filter(Boolean).join('\n\n');
  const lines = allText.split('\n');
  
  // Block 1: أهم فكرة في الحصة (Main Idea)
  const mainIdeaItems: string[] = [];
  let inMainIdea = false;
  
  for (const line of lines) {
    if (/📌|أهم فكرة|أهم الفكرة/.test(line)) {
      inMainIdea = true;
      continue;
    }
    if (inMainIdea && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) mainIdeaItems.push(clean);
    }
    if (inMainIdea && (/📝|📐|⚗️|🎯|🔑|⚖️|🔗|⚠️|🔄/.test(line) && !line.trim().startsWith('-'))) {
      inMainIdea = false;
    }
  }
  
  if (mainIdeaItems.length > 0) {
    blocks.push({
      id: 'main-idea',
      titleAr: 'أهم فكرة في الحصة',
      titleEn: 'Main Lesson Idea',
      icon: <Lightbulb className="w-4 h-4" />,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/5 border-amber-500/15',
      items: mainIdeaItems.slice(0, 4),
    });
  }
  
  // Block 2: المفاهيم الأساسية (Key Concepts)
  const conceptItems: string[] = [];
  let inConcepts = false;
  
  for (const line of lines) {
    if (/📝|المفاهيم الأساسية|شرح المفاهيم/.test(line) && !line.trim().startsWith('-')) {
      inConcepts = true;
      continue;
    }
    if (inConcepts && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) conceptItems.push(clean);
    }
    if (inConcepts && (/📌|📐|⚗️|🎯|🔑|⚖️|🔗|⚠️|🔄/.test(line) && !line.trim().startsWith('-'))) {
      inConcepts = false;
    }
  }
  
  if (conceptItems.length > 0) {
    blocks.push({
      id: 'concepts',
      titleAr: 'المفاهيم الأساسية',
      titleEn: 'Key Concepts',
      icon: <BookOpen className="w-4 h-4" />,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/5 border-primary/15',
      items: conceptItems.slice(0, 6),
    });
  }
  
  // Block 3: العلاقات بين المفاهيم (Relationships)
  const relationItems: string[] = [];
  let inRelations = false;
  
  for (const line of lines) {
    if (/🔗|علاقات|العلاقات/.test(line) && !line.trim().startsWith('-')) {
      inRelations = true;
      continue;
    }
    if (inRelations && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) relationItems.push(clean);
    }
    if (inRelations && (/📌|📝|📐|⚗️|🎯|🔑|⚖️|⚠️|🔄/.test(line) && !line.trim().startsWith('-'))) {
      inRelations = false;
    }
  }
  
  if (relationItems.length > 0) {
    blocks.push({
      id: 'relationships',
      titleAr: 'العلاقات بين المفاهيم',
      titleEn: 'Concept Relationships',
      icon: <Layers className="w-4 h-4" />,
      iconColor: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-500/5 border-violet-500/15',
      items: relationItems.slice(0, 5),
    });
  }
  
  // Block 4: مهم للامتحان (Exam Focus)
  const examItems: string[] = [];
  let inExam = false;
  
  for (const line of lines) {
    if (/🎯|⚠️|🔄|مهم للامتحان|ربط.*بالامتحان|بتتكرر|ملاحظات مهمة/.test(line) && !line.trim().startsWith('-')) {
      inExam = true;
      continue;
    }
    if (inExam && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) examItems.push(clean);
    }
    if (inExam && (/📌|📝|📐|🔑|🔗/.test(line) && !line.trim().startsWith('-'))) {
      inExam = false;
    }
  }
  
  if (examItems.length > 0) {
    blocks.push({
      id: 'exam-focus',
      titleAr: 'مهم للامتحان',
      titleEn: 'Exam Focus',
      icon: <Target className="w-4 h-4" />,
      iconColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/5 border-rose-500/15',
      items: examItems.slice(0, 5),
    });
  }
  
  // Fallback: if no structured blocks were parsed, create a single block from all bullet points
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
        icon: <BookOpen className="w-4 h-4" />,
        iconColor: 'text-primary',
        bgColor: 'bg-primary/5 border-primary/15',
        items: fallbackItems.slice(0, 8),
      });
    }
  }
  
  return blocks;
}

function ContentBlockCard({ block }: { block: ContentBlock }) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [open, setOpen] = useState(true);
  
  return (
    <div className={cn('border rounded-xl overflow-hidden transition-all', block.bgColor)}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={block.iconColor}>{block.icon}</span>
          <h4 className="text-sm font-semibold text-foreground">
            {isArabic ? block.titleAr : block.titleEn}
          </h4>
          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
            {block.items.length}
          </span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-2 shrink-0" />
              <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExplanationTab({ summaryText, infographicText }: ExplanationTabProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const blocks = useMemo(
    () => parseIntoBlocks(summaryText, infographicText),
    [summaryText, infographicText]
  );
  
  if (blocks.length === 0) {
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
      {blocks.map(block => (
        <ContentBlockCard key={block.id} block={block} />
      ))}
    </div>
  );
}
