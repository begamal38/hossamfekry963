import React, { useMemo, useState } from 'react';
import { 
  Atom, Beaker, FlaskConical, Lightbulb, BookOpen, 
  AlertTriangle, ArrowRight, ChevronDown, ChevronUp,
  Sparkles, Target, Zap, TestTube, Scale, Layers
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface VisualInfographicProps {
  summaryText: string | null;
  infographicText: string | null;
  revisionNotes: string | null;
  className?: string;
}

// ─── Parsing utilities ────────────────────────────────────────────

interface ParsedConcept {
  name: string;
  definition: string;
}

interface ParsedComparison {
  left: string;
  right: string;
  leftPoints: string[];
  rightPoints: string[];
}

interface ParsedTimelinePoint {
  text: string;
}

interface ParsedExamTip {
  text: string;
}

interface ParsedRelation {
  from: string;
  to: string;
  description: string;
}

const CONCEPT_ICONS = [Atom, Beaker, FlaskConical, Lightbulb, TestTube, Zap, Layers, Target];

function getConceptIcon(index: number) {
  const Icon = CONCEPT_ICONS[index % CONCEPT_ICONS.length];
  return Icon;
}

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
  
  // Extract bullet points that look like concept definitions
  const lines = text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
  
  for (const line of lines) {
    const clean = line.replace(/^[\s\-•]+/, '').trim();
    if (!clean || clean.length < 5) continue;
    
    // Try to split on colon or dash separator
    const separatorMatch = clean.match(/^(.+?)\s*[:\-–—]\s*(.+)$/);
    if (separatorMatch) {
      concepts.push({ name: separatorMatch[1].trim(), definition: separatorMatch[2].trim() });
    } else if (clean.length < 80) {
      concepts.push({ name: clean, definition: '' });
    }
  }
  
  return concepts.slice(0, 8); // Max 8 concepts
}

function parseComparisons(text: string | null): ParsedComparison[] {
  if (!text) return [];
  const comparisons: ParsedComparison[] = [];
  
  // Look for "vs" or "مقابل" or "مقارنة" patterns
  const sections = text.split('\n\n');
  
  for (const section of sections) {
    const vsMatch = section.match(/(.+?)\s+(?:vs\.?|مقابل|مقارنة بين)\s+(.+)/i);
    if (vsMatch) {
      const lines = section.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
      const midpoint = Math.ceil(lines.length / 2);
      comparisons.push({
        left: vsMatch[1].trim(),
        right: vsMatch[2].trim(),
        leftPoints: lines.slice(0, midpoint).map(l => l.replace(/^[\s\-•]+/, '').trim()),
        rightPoints: lines.slice(midpoint).map(l => l.replace(/^[\s\-•]+/, '').trim()),
      });
    }
  }
  
  // Also look for comparison sections by header
  const comparisonHeaderPattern = /⚖️|مقارن/;
  let inComparison = false;
  let compBlock: string[] = [];
  
  for (const line of text.split('\n')) {
    if (comparisonHeaderPattern.test(line)) {
      inComparison = true;
      compBlock = [];
      continue;
    }
    if (inComparison && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      compBlock.push(line.replace(/^[\s\-•]+/, '').trim());
    }
    if (inComparison && line.trim() === '' && compBlock.length > 0) {
      inComparison = false;
    }
  }
  
  if (compBlock.length >= 2 && comparisons.length === 0) {
    // Try to create comparison from paired bullets
    for (let i = 0; i < compBlock.length - 1; i += 2) {
      const parts = compBlock[i].split(/\s+(?:vs\.?|مقابل|←→|↔)\s+/);
      if (parts.length === 2) {
        comparisons.push({
          left: parts[0],
          right: parts[1],
          leftPoints: [],
          rightPoints: [],
        });
      }
    }
  }
  
  return comparisons.slice(0, 4);
}

function parseKeyPoints(text: string | null): ParsedTimelinePoint[] {
  if (!text) return [];
  const points: ParsedTimelinePoint[] = [];
  
  const lines = text.split('\n');
  for (const line of lines) {
    const clean = line.replace(/^[\s\-•📌📝⚗️🎯📋📐📚🔄🔑⚖️🔗⚠️\d.]+/, '').trim();
    if (clean.length >= 10 && clean.length <= 200) {
      points.push({ text: clean });
    }
  }
  
  return points.slice(0, 8);
}

function parseExamTips(text: string | null): ParsedExamTip[] {
  if (!text) return [];
  const tips: ParsedExamTip[] = [];
  
  // Look for exam-related sections
  const examPatterns = [/امتحان/, /🎯/, /🔄/, /⚠️/, /بتتكرر/, /مهم/];
  let inExamSection = false;
  
  for (const line of text.split('\n')) {
    if (examPatterns.some(p => p.test(line)) && !line.trim().startsWith('-')) {
      inExamSection = true;
      continue;
    }
    if (inExamSection && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      if (clean.length >= 5) {
        tips.push({ text: clean });
      }
    }
    if (inExamSection && line.trim() === '') {
      inExamSection = false;
    }
  }
  
  return tips.slice(0, 6);
}

function parseRelations(text: string | null): ParsedRelation[] {
  if (!text) return [];
  const relations: ParsedRelation[] = [];
  
  // Look for relationship section (🔗)
  let inRelSection = false;
  
  for (const line of text.split('\n')) {
    if (/🔗|علاقات/.test(line) && !line.trim().startsWith('-')) {
      inRelSection = true;
      continue;
    }
    if (inRelSection && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
      const clean = line.replace(/^[\s\-•]+/, '').trim();
      // Try to extract "A → B" or "A ← B" or "A leads to B"
      const arrowMatch = clean.match(/(.+?)\s*[→←↔➜]\s*(.+)/);
      if (arrowMatch) {
        relations.push({
          from: arrowMatch[1].trim(),
          to: arrowMatch[2].trim(),
          description: '',
        });
      } else if (clean.length >= 5) {
        // Just store as a relation description
        relations.push({
          from: clean,
          to: '',
          description: clean,
        });
      }
    }
    if (inRelSection && line.trim() === '' && relations.length > 0) {
      inRelSection = false;
    }
  }
  
  return relations.slice(0, 6);
}

// ─── Sub-components ────────────────────────────────────────────

function ConceptCards({ concepts }: { concepts: ParsedConcept[] }) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  if (concepts.length === 0) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Atom className="w-4 h-4 text-primary" />
        {isArabic ? 'المفاهيم الأساسية' : 'Key Concepts'}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {concepts.map((concept, i) => {
          const Icon = getConceptIcon(i);
          return (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-3 transition-all duration-200 hover:scale-[1.02]',
                CARD_COLORS[i % CARD_COLORS.length]
              )}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', ICON_COLORS[i % ICON_COLORS.length])}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug mb-1">{concept.name}</p>
              {concept.definition && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">{concept.definition}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RelationshipsMap({ relations }: { relations: ParsedRelation[] }) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  if (relations.length === 0) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        {isArabic ? 'العلاقات بين المفاهيم' : 'Concept Relationships'}
      </h4>
      <div className="space-y-2">
        {relations.map((rel, i) => (
          <div key={i} className="flex items-center gap-2 flex-wrap">
            <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/20">
              {rel.from}
            </span>
            {rel.to && (
              <>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-lg border border-border">
                  {rel.to}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonBlocks({ comparisons }: { comparisons: ParsedComparison[] }) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  if (comparisons.length === 0) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Scale className="w-4 h-4 text-primary" />
        {isArabic ? 'مقارنات' : 'Comparisons'}
      </h4>
      <div className="space-y-3">
        {comparisons.map((comp, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-xs font-bold text-primary mb-2">{comp.left}</p>
              {comp.leftPoints.map((p, j) => (
                <p key={j} className="text-[11px] text-muted-foreground mb-1">• {p}</p>
              ))}
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">{comp.right}</p>
              {comp.rightPoints.map((p, j) => (
                <p key={j} className="text-[11px] text-muted-foreground mb-1">• {p}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyPointsTimeline({ points }: { points: ParsedTimelinePoint[] }) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  if (points.length === 0) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        {isArabic ? 'النقاط الرئيسية' : 'Key Points'}
      </h4>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-0 bottom-0 start-[11px] w-0.5 bg-border" />
        
        <div className="space-y-3">
          {points.map((point, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              {/* Node */}
              <div className="w-6 h-6 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center shrink-0 z-10">
                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
              </div>
              {/* Text */}
              <p className="text-xs text-foreground leading-relaxed pt-0.5">{point.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamFocusBox({ tips }: { tips: ParsedExamTip[] }) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  if (tips.length === 0) return null;
  
  return (
    <div className="bg-amber-500/5 border-2 border-amber-500/30 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {isArabic ? 'مهم للامتحان' : 'Exam Focus'}
      </h4>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <span className="text-xs text-foreground leading-relaxed">{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export function VisualInfographic({ summaryText, infographicText, revisionNotes, className }: VisualInfographicProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [expanded, setExpanded] = useState(true);
  
  const parsed = useMemo(() => {
    // Combine all text sources for richer extraction
    const allText = [summaryText, infographicText, revisionNotes].filter(Boolean).join('\n\n');
    
    return {
      concepts: parseConcepts(summaryText),
      relations: parseRelations(infographicText),
      comparisons: parseComparisons(infographicText),
      keyPoints: parseKeyPoints(revisionNotes),
      examTips: parseExamTips(allText),
    };
  }, [summaryText, infographicText, revisionNotes]);
  
  // Don't render if no meaningful parsed data
  const hasContent = parsed.concepts.length > 0 || parsed.keyPoints.length > 0 || 
                     parsed.examTips.length > 0 || parsed.comparisons.length > 0 || 
                     parsed.relations.length > 0;
  
  if (!hasContent) return null;
  
  return (
    <section className={cn('bg-card border border-border rounded-2xl overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-foreground">
            {isArabic ? 'ملخص بصري' : 'Visual Summary'}
          </h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          <ConceptCards concepts={parsed.concepts} />
          <RelationshipsMap relations={parsed.relations} />
          <ComparisonBlocks comparisons={parsed.comparisons} />
          <KeyPointsTimeline points={parsed.keyPoints} />
          <ExamFocusBox tips={parsed.examTips} />
        </div>
      )}
    </section>
  );
}
