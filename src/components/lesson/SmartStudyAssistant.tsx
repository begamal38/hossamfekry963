import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, FileText, Sparkles, ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';
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
  className?: string;
}

interface AiContent {
  summary_text: string | null;
  infographic_text: string | null;
  revision_notes: string | null;
  infographic_images: any[] | null;
  status: string;
  key_points?: any;
}

/** English content cached inside key_points JSON */
interface EnContent {
  summary_text: string | null;
  infographic_text: string | null;
  revision_notes: string | null;
}

type TabId = 'explanation' | 'revision' | 'visual';

export function SmartStudyAssistant({
  lessonId,
  videoUrl,
  lessonTitle,
  courseId,
  chapterId,
  className,
}: SmartStudyAssistantProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [content, setContent] = useState<AiContent | null>(null);
  const [enContent, setEnContent] = useState<EnContent | null>(null);
  const [enGenerating, setEnGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('explanation');
  const [expanded, setExpanded] = useState(true);

  const fetchContent = useCallback(async () => {
    if (!lessonId) return;

    const { data, error } = await supabase
      .from('lesson_ai_content')
      .select('summary_text, infographic_text, revision_notes, infographic_images, status, key_points')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('[SmartStudyAssistant] Fetch error:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setContent(data as AiContent);
      // Extract cached English content from key_points
      const kp = data.key_points as any;
      if (kp?.en?.summary_text) {
        setEnContent(kp.en as EnContent);
      }
      if (data.status === 'generating') {
        setTimeout(fetchContent, 5000);
      }
    }

    setLoading(false);
  }, [lessonId]);

  const triggerGeneration = useCallback(async (lang: string = 'ar') => {
    if (!lessonId || !videoUrl) return;

    try {
      const response = await supabase.functions.invoke('generate-lesson-content', {
        body: {
          lesson_id: lessonId,
          lesson_title: lessonTitle,
          youtube_url: videoUrl,
          course_id: courseId,
          chapter_id: chapterId,
          language: lang,
        },
      });

      if (response.error) {
        console.error('[SmartStudyAssistant] Generation trigger error:', response.error);
        return;
      }

      if (lang === 'en' && response.data?.en_content) {
        setEnContent(response.data.en_content as EnContent);
        setEnGenerating(false);
      } else if (response.data?.status === 'generated' || response.data?.status === 'already_generated') {
        if (lang === 'en' && response.data?.en_content) {
          setEnContent(response.data.en_content as EnContent);
          setEnGenerating(false);
        } else {
          fetchContent();
        }
      }
    } catch (err) {
      console.error('[SmartStudyAssistant] Generation error:', err);
      if (lang === 'en') setEnGenerating(false);
    }
  }, [lessonId, videoUrl, lessonTitle, courseId, chapterId, fetchContent]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Trigger Arabic generation if no content exists
  useEffect(() => {
    if (!loading && !content && videoUrl) {
      triggerGeneration('ar');
    }
  }, [loading, content, videoUrl, triggerGeneration]);

  // When language switches to English and no cached English content, generate it
  useEffect(() => {
    if (language === 'en' && content?.status === 'ready' && !enContent && !enGenerating && videoUrl) {
      console.log('[SmartStudyAssistant] Generating English content');
      setEnGenerating(true);
      triggerGeneration('en');
    }
  }, [language, content?.status, enContent, enGenerating, videoUrl, triggerGeneration]);

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
      },
    }).then((res) => {
      if (res.data?.images) {
        setContent(prev => prev ? { ...prev, infographic_images: res.data.images } : prev);
      }
    }).catch(err => {
      console.error('[SmartStudyAssistant] Infographic generation error:', err);
    });
  }, [content?.status, content?.summary_text, needsRegeneration, lessonId, lessonTitle]);

  if (!videoUrl) return null;
  if (content?.status === 'failed') return null;

  const tabs: { id: TabId; labelAr: string; label: string; icon: React.ReactNode }[] = [
    { id: 'explanation', label: 'Explanation', labelAr: 'الشرح', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'revision', label: 'Revision', labelAr: 'مراجعة', icon: <FileText className="w-4 h-4" /> },
    { id: 'visual', label: 'Visual Summary', labelAr: 'ملخص بصري', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  const isGenerating = !content || content.status === 'generating';
  const isEnPending = language === 'en' && enGenerating;

  // Select content based on current language
  const displaySummary = language === 'en' && enContent?.summary_text 
    ? enContent.summary_text 
    : content?.summary_text || null;
  const displayInfographic = language === 'en' && enContent?.infographic_text 
    ? enContent.infographic_text 
    : content?.infographic_text || null;
  const displayRevision = language === 'en' && enContent?.revision_notes 
    ? enContent.revision_notes 
    : content?.revision_notes || null;

  return (
    <section className={cn('bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm', className)}>
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
          {(isGenerating || isEnPending) && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full animate-pulse">
              {isArabic ? 'جاري التحضير...' : 'Preparing...'}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {/* Tab Selector */}
          <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 border-b border-border/40 -mx-5 px-5">
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
                  <span className="absolute bottom-0 inset-x-1 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="min-h-[120px]">
            {(isGenerating || isEnPending) ? (
              <div className="bg-muted/20 rounded-xl p-5 space-y-3.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[75%]" />
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
            ) : (
              <>
                {activeTab === 'explanation' && (
                  <ExplanationTab
                    summaryText={displaySummary}
                    infographicText={displayInfographic}
                  />
                )}
                {activeTab === 'revision' && (
                  <RevisionTab revisionNotes={displayRevision} />
                )}
                {activeTab === 'visual' && (
                  <VisualSummaryTab
                    summaryText={displaySummary}
                    infographicText={displayInfographic}
                    revisionNotes={displayRevision}
                    infographicImages={content?.infographic_images || null}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
