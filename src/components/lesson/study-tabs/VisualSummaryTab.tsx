import React, { useMemo, useState } from 'react';
import { 
  Atom, Beaker, FlaskConical, Lightbulb, 
  ArrowRight, Target, TestTube, Scale, Layers,
  AlertTriangle, Sparkles, ImageIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface VisualSummaryTabProps {
  summaryText: string | null;
  infographicText: string | null;
  revisionNotes: string | null;
  infographicImages: any[] | null;
  isTrackArabic?: boolean;
}

interface ParsedConcept {
  name: string;
  definition: string;
}

interface ParsedComparison {
  left: string;
  right: string;
}

const CONCEPT_ICONS = [Atom, Beaker, FlaskConical, Lightbulb, TestTube, Layers];
const ICON_COLORS = [
  'text-primary bg-primary/10',
  'text-emerald-600 bg-emerald-500/10',
  'text-amber-600 bg-amber-500/10',
  'text-rose-600 bg-rose-500/10',
  'text-violet-600 bg-violet-500/10',
  'text-cyan-600 bg-cyan-500/10',
];

const TYPE_LABELS: Record<string, { ar: string; micro: string }> = {
  concept: { ar: 'المفاهيم', micro: 'افهم بسرعة' },
  structure: { ar: 'التركيب', micro: 'شوف بعينك' },
  relationship: { ar: 'العلاقات', micro: 'اربط المعلومة' },
  rule: { ar: 'القواعد', micro: 'احفظ القاعدة' },
  exam_hint: { ar: 'للامتحان', micro: 'النقطة دي بتيجي كتير' },
  concepts: { ar: 'المفاهيم', micro: 'افهم بسرعة' },
  relationships: { ar: 'العلاقات', micro: 'اربط المعلومة' },
  exam_tips: { ar: 'للامتحان', micro: 'النقطة دي بتيجي كتير' },
  summary: { ar: 'ملخص', micro: 'راجع قبل الامتحان' },
};

function parseConcepts(text: string | null): ParsedConcept[] {
  if (!text) return [];
  const concepts: ParsedConcept[] = [];
  const lines = text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
  
  for (const line of lines) {
    const clean = line.replace(/^[\s\-•]+/, '').trim();
    if (!clean || clean.length < 5) continue;
    const sep = clean.match(/^(.+?)\s*[:\-–—]\s*(.+)$/);
    if (sep) {
      concepts.push({ name: sep[1].trim(), definition: sep[2].trim() });
    } else if (clean.length < 80) {
      concepts.push({ name: clean, definition: '' });
    }
  }
  return concepts.slice(0, 6);
}

function parseComparisons(text: string | null): ParsedComparison[] {
  if (!text) return [];
  const comparisons: ParsedComparison[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const clean = line.replace(/^[\s\-•]+/, '').trim();
    const vsMatch = clean.match(/(.+?)\s+(?:vs\.?|مقابل|مقارنة)\s+(.+)/i);
    if (vsMatch) {
      comparisons.push({ left: vsMatch[1].trim(), right: vsMatch[2].trim() });
    }
  }
  return comparisons.slice(0, 3);
}

function parseExamTips(text: string | null): string[] {
  if (!text) return [];
  const tips: string[] = [];
  const examPatterns = [/امتحان/, /🎯/, /🔄/, /⚠️/, /بتتكرر/, /مهم/];
  let inExamSection = false;
  
  for (const line of text.split('\n')) {
    if (examPatterns.some(p => p.test(line)) && !line.trim().startsWith('-')) {
      inExamSection = true;
      continue;
    }
    if (inExamSection && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) tips.push(clean);
    }
    if (inExamSection && line.trim() === '') inExamSection = false;
  }
  return tips.slice(0, 4);
}

function parseDescriptionBullets(description: string): string[] {
  if (!description) return [];
  // Split by newlines or bullet markers
  return description
    .split(/[\n\r]+|(?:^|\s)[•\-]\s/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

function InfographicImagesGrid({ images, isTrackArabic }: { images: any[]; isTrackArabic: boolean }) {
  const isArabic = isTrackArabic;
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  if (!images || images.length === 0) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-primary" />
        </div>
        {isArabic ? 'ملخصات بصرية' : 'Visual Summaries'}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {images.map((img, i) => {
          const typeInfo = TYPE_LABELS[img.type] || TYPE_LABELS['concept'];
          const descriptionBullets = parseDescriptionBullets(img.description_ar || '');
          const displayTitle = img.title_en || img.title_ar || img.title;
          const isOldFormat = !img.description_ar && !img.title_en;
          
          return (
            <div
              key={i}
              className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Image area */}
              <div className="relative aspect-[3/4] bg-muted/5">
                {!loadedImages.has(i) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-full h-full rounded-none" />
                  </div>
                )}
                <img
                  src={img.url}
                  alt={displayTitle}
                  loading="lazy"
                  className={cn(
                    'w-full h-full object-contain transition-opacity duration-300',
                    loadedImages.has(i) ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => setLoadedImages(prev => new Set(prev).add(i))}
                />
                {isOldFormat && (
                  <div className="absolute top-2 end-2 bg-amber-500/90 text-white text-[9px] px-1.5 py-0.5 rounded-md">
                    {isArabic ? 'جاري التحديث...' : 'Updating...'}
                  </div>
                )}
              </div>
              
              {/* Text area below image */}
              <div className="px-4 py-3.5 border-t border-border/40 space-y-2">
                <h5 className="text-sm font-bold text-foreground">{displayTitle}</h5>
                
                <span className="inline-block text-[10px] text-primary/70 font-medium bg-primary/5 px-2 py-0.5 rounded-full">
                  {isArabic ? typeInfo.micro : typeInfo.ar}
                </span>
                
                {descriptionBullets.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {descriptionBullets.map((bullet, bi) => (
                      <li key={bi} className="flex items-start gap-2 text-[13px] text-muted-foreground leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                
                {isOldFormat && (
                  <p className="text-[12px] text-muted-foreground italic">
                    {isArabic ? typeInfo.ar : displayTitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VisualSummaryTab({ summaryText, infographicText, revisionNotes, infographicImages, isTrackArabic = true }: VisualSummaryTabProps) {
  const { language } = useLanguage();
  const isArabic = isTrackArabic;
  
  const parsed = useMemo(() => {
    const allText = [summaryText, infographicText, revisionNotes].filter(Boolean).join('\n\n');
    return {
      concepts: parseConcepts(summaryText),
      comparisons: parseComparisons(infographicText),
      examTips: parseExamTips(allText),
    };
  }, [summaryText, infographicText, revisionNotes]);
  
  const hasContent = parsed.concepts.length > 0 || parsed.comparisons.length > 0 || 
                     parsed.examTips.length > 0 || (infographicImages && infographicImages.length > 0);
  
  if (!hasContent) {
    return (
      <div className="bg-muted/30 rounded-xl p-5 text-center">
        <div className="flex flex-col items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            {isArabic ? 'جاري تحضير الملخص البصري...' : 'Preparing visual summary...'}
          </p>
        </div>
      </div>
    );
  }
  
  const sections: React.ReactNode[] = [];

  // AI Generated Infographic Images (priority placement)
  if (infographicImages && infographicImages.length > 0) {
    sections.push(<InfographicImagesGrid key="images" images={infographicImages} isTrackArabic={isTrackArabic} />);
  }

  // Concept Cards
  if (parsed.concepts.length > 0) {
    sections.push(
      <div key="concepts">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Atom className="w-3.5 h-3.5 text-primary" />
          </div>
          {isArabic ? 'المفاهيم الأساسية' : 'Key Concepts'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {parsed.concepts.map((concept, i) => {
            const Icon = CONCEPT_ICONS[i % CONCEPT_ICONS.length];
            return (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2.5', ICON_COLORS[i % ICON_COLORS.length])}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-semibold text-foreground leading-snug mb-1">{concept.name}</p>
                {concept.definition && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{concept.definition}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Comparison Cards
  if (parsed.comparisons.length > 0) {
    sections.push(
      <div key="comparisons">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Scale className="w-3.5 h-3.5 text-primary" />
          </div>
          {isArabic ? 'مقارنات' : 'Comparisons'}
        </h4>
        <div className="space-y-2.5">
          {parsed.comparisons.map((comp, i) => (
            <div key={i} className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-primary/8 text-primary text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/15">
                {comp.left}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="bg-amber-500/8 text-amber-600 dark:text-amber-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-500/15">
                {comp.right}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Exam Focus
  if (parsed.examTips.length > 0) {
    sections.push(
      <div key="exam" className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          {isArabic ? 'مهم للامتحان' : 'Exam Focus'}
          {isArabic && <span className="text-[10px] text-amber-600/60 dark:text-amber-400/60 font-normal ms-1">النقطة دي بتيجي كتير</span>}
        </h4>
        <ul className="space-y-2.5">
          {parsed.examTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <span className="text-[13px] text-foreground leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', isTrackArabic ? 'text-right' : 'text-left')}>
      {sections.map((section, i) => (
        <React.Fragment key={i}>
          {section}
          {i < sections.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  );
}
