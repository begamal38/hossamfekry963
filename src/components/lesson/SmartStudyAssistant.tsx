import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, FileText, Sparkles, ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ExplanationTab } from '@/components/lesson/study-tabs/ExplanationTab';
import { RevisionTab } from '@/components/lesson/study-tabs/RevisionTab';
import { VisualSummaryTab } from '@/components/lesson/study-tabs/VisualSummaryTab';

interface SmartStudyAssistantProps {
  lessonId: string;
  videoUrl: string | null;
  lessonTitle?: string;
  courseId?: string;
  chapterId?: string | null;
  /** Course grade string e.g. "third_arabic" or "second_languages" */
  courseGrade?: string;
  className?: string;
}

interface AiContent {
  summary_text: string | null;
  infographic_text: string | null;
  revision_notes: string | null;
  infographic_images: any[] | null;
  status: string;
  key_points?: any;
  video_url_hash?: string | null;
}

type TabId = 'explanation' | 'revision' | 'visual';

/**
 * Determine the content language from the course grade.
 * Courses with "languages" track → English content.
 * Everything else (arabic track or unknown) → Arabic content.
 */
function getTrackLanguage(courseGrade?: string): 'ar' | 'en' {
  if (!courseGrade) return 'ar';
  return courseGrade.includes('languages') ? 'en' : 'ar';
}

export function SmartStudyAssistant({
  lessonId,
  videoUrl,
  lessonTitle,
  courseId,
  chapterId,
  courseGrade,
  className,
}: SmartStudyAssistantProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Track-based content language — NOT the UI language
  const trackLang = getTrackLanguage(courseGrade);
  const isTrackArabic = trackLang === 'ar';

  const [content, setContent] = useState<AiContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('explanation');
  const [expanded, setExpanded] = useState(true);

  const fetchContent = useCallback(async () => {
    if (!lessonId) return;

    const { data, error } = await supabase
      .from('lesson_ai_content')
      .select('summary_text, infographic_text, revision_notes, infographic_images, status, key_points, video_url_hash')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('[SmartStudyAssistant] Fetch error:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setContent(data as AiContent);
      if (data.status === 'generating') {
        setTimeout(fetchContent, 5000);
      }
    }

    setLoading(false);
  }, [lessonId]);

  const triggerGeneration = useCallback(async () => {
    if (!lessonId || !videoUrl) return;

    try {
      const response = await supabase.functions.invoke('generate-lesson-content', {
        body: {
          lesson_id: lessonId,
          lesson_title: lessonTitle,
          youtube_url: videoUrl,
          course_id: courseId,
          chapter_id: chapterId,
          course_grade: courseGrade,
        },
      });

      if (response.error) {
        console.error('[SmartStudyAssistant] Generation trigger error:', response.error);
        return;
      }

      if (response.data?.status === 'generated' || response.data?.status === 'already_generated') {
        fetchContent();
      }
    } catch (err) {
      console.error('[SmartStudyAssistant] Generation error:', err);
    }
  }, [lessonId, videoUrl, lessonTitle, courseId, chapterId, courseGrade, fetchContent]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Trigger generation if no content exists
  useEffect(() => {
    if (!loading && !content && videoUrl) {
      triggerGeneration();
    }
  }, [loading, content, videoUrl, triggerGeneration]);

  // Detect legacy content: generated without video_url_hash or with old-format infographics
  const isLegacyContent = content && content.status === 'ready' && !(content as any).video_url_hash;

  // Detect old-format infographics
  const needsRegeneration = content?.infographic_images && 
    (content.infographic_images as any[]).length > 0 &&
    (content.infographic_images as any[]).some((img: any) => !img.description_ar || !img.title_en);

  // Trigger infographic generation
  useEffect(() => {
    const shouldGenerate = content?.status === 'ready' && content.summary_text && 
      (!content.infographic_images || needsRegeneration);
    
    if (!shouldGenerate) return;

    supabase.functions.invoke('generate-lesson-infographics', {
      body: {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        summary_text: content.summary_text,
        force_regenerate: !!needsRegeneration,
        course_grade: courseGrade,
      },
    }).then((res) => {
      if (res.data?.images) {
        setContent(prev => prev ? { ...prev, infographic_images: res.data.images } : prev);
      }
    }).catch(err => {
      console.error('[SmartStudyAssistant] Infographic generation error:', err);
    });
  }, [content?.status, content?.summary_text, needsRegeneration, lessonId, lessonTitle, courseGrade]);

  if (!videoUrl) return null;
  if (content?.status === 'failed') return null;

  const tabs: { id: TabId; labelAr: string; label: string; icon: React.ReactNode }[] = [
    { id: 'explanation', label: 'Explanation', labelAr: 'الشرح', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'revision', label: 'Revision', labelAr: 'مراجعة', icon: <FileText className="w-4 h-4" /> },
    { id: 'visual', label: 'Visual Summary', labelAr: 'ملخص بصري', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  const isGenerating = !content || content.status === 'generating' || isLegacyContent;

  // Content is always from the track-determined columns (main columns for Arabic, key_points.en for Languages)
  let displaySummary: string | null = null;
  let displayInfographic: string | null = null;
  let displayRevision: string | null = null;

  if (isTrackArabic) {
    // Arabic track: use main columns
    displaySummary = content?.summary_text || null;
    displayInfographic = content?.infographic_text || null;
    displayRevision = content?.revision_notes || null;
  } else {
    // Languages track: use key_points.en if available, fallback to main columns
    const kp = content?.key_points as any;
    displaySummary = kp?.en?.summary_text || content?.summary_text || null;
    displayInfographic = kp?.en?.infographic_text || content?.infographic_text || null;
    displayRevision = kp?.en?.revision_notes || content?.revision_notes || null;
  }

  // Text direction is determined by track, not UI language
  const contentDir = isTrackArabic ? 'rtl' : 'ltr';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className={cn('bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm w-full', className)}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col items-start">
            <h3 className="font-semibold text-foreground text-sm">
              {isArabic ? 'مساعد المذاكرة الذكي' : 'Smart Study Assistant'}
            </h3>
            {isArabic && !isGenerating && (
              <span className="text-[10px] text-muted-foreground">افهم · راجع · اتأكد</span>
            )}
          </div>
          {isGenerating && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full animate-pulse">
              {isArabic ? 'جاري التحضير...' : 'Preparing...'}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {/* Tab Selector */}
              <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 border-b border-border/40 -mx-5 px-5 scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative',
                      activeTab === tab.id
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab.icon}
                    {isArabic ? tab.labelAr : tab.label}
                    {activeTab === tab.id && (
                      <motion.span
                        layoutId="study-tab-indicator"
                        className="absolute bottom-0 inset-x-1 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Content Area — direction from track */}
              <div className="min-h-[120px]" dir={contentDir}>
                {isGenerating ? (
                  <div className="bg-muted/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isArabic ? 'بنحضر المحتوى...' : 'Generating content...'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {isArabic ? 'كمان ثواني وهيكون جاهز' : 'Almost ready'}
                        </p>
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[75%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {activeTab === 'explanation' && (
                        <ExplanationTab
                          summaryText={displaySummary}
                          infographicText={displayInfographic}
                          isTrackArabic={isTrackArabic}
                        />
                      )}
                      {activeTab === 'revision' && (
                        <RevisionTab revisionNotes={displayRevision} isTrackArabic={isTrackArabic} />
                      )}
                      {activeTab === 'visual' && (
                        <VisualSummaryTab
                          summaryText={displaySummary}
                          infographicText={displayInfographic}
                          revisionNotes={displayRevision}
                          infographicImages={content?.infographic_images || null}
                          isTrackArabic={isTrackArabic}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
