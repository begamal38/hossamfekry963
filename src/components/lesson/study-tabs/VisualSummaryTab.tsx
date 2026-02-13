import React, { useMemo, useState } from 'react';
import { 
  Atom, Beaker, FlaskConical, Lightbulb, 
  ArrowRight, Target, TestTube, Scale, Layers,
  AlertTriangle, BookOpen, Sparkles, ImageIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface VisualSummaryTabProps {
  summaryText: string | null;
  infographicText: string | null;
  revisionNotes: string | null;
  infographicImages: any[] | null;
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
const CARD_COLORS = [
  'bg-primary/8 border-primary/20',
  'bg-emerald-500/8 border-emerald-500/20',
  'bg-amber-500/8 border-amber-500/20',
  'bg-rose-500/8 border-rose-500/20',
  'bg-violet-500/8 border-violet-500/20',
  'bg-cyan-500/8 border-cyan-500/20',
];
const ICON_COLORS = [
  'text-primary bg-primary/15',
  'text-emerald-600 bg-emerald-500/15',
  'text-amber-600 bg-amber-500/15',
  'text-rose-600 bg-rose-500/15',
  'text-violet-600 bg-violet-500/15',
  'text-cyan-600 bg-cyan-500/15',
];

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

// AI-generated infographic images section
function InfographicImagesGrid({ images }: { images: any[] }) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  if (!images || images.length === 0) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-primary" />
        {isArabic ? 'ملخصات بصرية' : 'Visual Summaries'}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="rounded-xl border border-border overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="px-3 py-2 bg-muted/30 border-b border-border">
              <p className="text-xs font-medium text-foreground">{img.title_ar || img.title}</p>
            </div>
            <div className="relative aspect-[4/3] bg-muted/20">
              {!loadedImages.has(i) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              )}
              <img
                src={img.url}
                alt={img.title_ar || img.title}
                loading="lazy"
                className={cn(
                  'w-full h-full object-contain transition-opacity duration-300',
                  loadedImages.has(i) ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setLoadedImages(prev => new Set(prev).add(i))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisualSummaryTab({ summaryText, infographicText, revisionNotes, infographicImages }: VisualSummaryTabProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
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
      <div className="bg-muted/30 rounded-xl p-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            {isArabic ? 'جاري تحضير الملخص البصري...' : 'Preparing visual summary...'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-5">
      {/* AI Generated Infographic Images */}
      {infographicImages && infographicImages.length > 0 && (
        <InfographicImagesGrid images={infographicImages} />
      )}
      
      {/* Concept Cards */}
      {parsed.concepts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Atom className="w-4 h-4 text-primary" />
            {isArabic ? 'المفاهيم الأساسية' : 'Key Concepts'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {parsed.concepts.map((concept, i) => {
              const Icon = CONCEPT_ICONS[i % CONCEPT_ICONS.length];
              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl border p-3 transition-all duration-200 hover:scale-[1.02]',
                    CARD_COLORS[i % CARD_COLORS.length]
                  )}
                >
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', ICON_COLORS[i % ICON_COLORS.length])}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug mb-0.5">{concept.name}</p>
                  {concept.definition && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{concept.definition}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Comparison Cards */}
      {parsed.comparisons.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            {isArabic ? 'مقارنات' : 'Comparisons'}
          </h4>
          <div className="space-y-2">
            {parsed.comparisons.map((comp, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/20">
                  {comp.left}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-500/20">
                  {comp.right}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Exam Focus */}
      {parsed.examTips.length > 0 && (
        <div className="bg-amber-500/5 border-2 border-amber-500/25 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {isArabic ? 'مهم للامتحان' : 'Exam Focus'}
          </h4>
          <ul className="space-y-2">
            {parsed.examTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <span className="text-xs text-foreground leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
