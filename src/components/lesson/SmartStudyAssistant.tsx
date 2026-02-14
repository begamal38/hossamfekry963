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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('explanation');
  const [expanded, setExpanded] = useState(true);

  const fetchContent = useCallback(async () => {
    if (!lessonId) return;

    const { data, error } = await supabase
      .from('lesson_ai_content')
      .select('summary_text, infographic_text, revision_notes, infographic_images, status')
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
        },
      });

      if (response.error) {
        console.error('[SmartStudyAssistant] Generation trigger error:', response.error);
        return;
      }

      if (response.data?.status === 'generated') {
        fetchContent();
      }
    } catch (err) {
      console.error('[SmartStudyAssistant] Generation error:', err);
    }
  }, [lessonId, videoUrl, lessonTitle, courseId, chapterId, fetchContent]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!loading && !content && videoUrl) {
      triggerGeneration();
    }
  }, [loading, content, videoUrl, triggerGeneration]);

  // Trigger infographic image generation once text content is ready
  useEffect(() => {
    if (content?.status === 'ready' && content.summary_text && !content.infographic_images) {
      supabase.functions.invoke('generate-lesson-infographics', {
        body: {
          lesson_id: lessonId,
          lesson_title: lessonTitle,
          summary_text: content.summary_text,
        },
      }).then((res) => {
        if (res.data?.images) {
          setContent(prev => prev ? { ...prev, infographic_images: res.data.images } : prev);
        }
      }).catch(err => {
        console.error('[SmartStudyAssistant] Infographic generation error:', err);
      });
    }
  }, [content?.status, content?.summary_text, content?.infographic_images, lessonId, lessonTitle]);

  if (!videoUrl) return null;
  if (content?.status === 'failed') return null;

  const tabs: { id: TabId; labelAr: string; label: string; icon: React.ReactNode }[] = [
    { id: 'explanation', label: 'Explanation', labelAr: 'الشرح', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'revision', label: 'Revision', labelAr: 'مراجعة', icon: <FileText className="w-4 h-4" /> },
    { id: 'visual', label: 'Visual Summary', labelAr: 'ملخص بصري', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  const isGenerating = !content || content.status === 'generating';

  return (
    <section className={cn('bg-card border border-border rounded-2xl overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">
            {isArabic ? 'مساعد المذاكرة الذكي' : 'Smart Study Assistant'}
          </h3>
          {isGenerating && (
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
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.icon}
                {isArabic ? tab.labelAr : tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="min-h-[120px]">
            {isGenerating ? (
              <div className="bg-muted/30 rounded-xl p-4 md:p-5 space-y-3">
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
                    summaryText={content?.summary_text || null}
                    infographicText={content?.infographic_text || null}
                  />
                )}
                {activeTab === 'revision' && (
                  <RevisionTab revisionNotes={content?.revision_notes || null} />
                )}
                {activeTab === 'visual' && (
                  <VisualSummaryTab
                    summaryText={content?.summary_text || null}
                    infographicText={content?.infographic_text || null}
                    revisionNotes={content?.revision_notes || null}
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
