import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AiContent {
  summary_text: string | null;
  infographic_text: string | null;
  revision_notes: string | null;
  status: string;
}

export function useLessonAiContent(lessonId: string | undefined) {
  const [content, setContent] = useState<AiContent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    if (!lessonId) return;

    const { data, error } = await supabase
      .from('lesson_ai_content')
      .select('summary_text, infographic_text, revision_notes, status')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('[useLessonAiContent] Fetch error:', error);
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

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, loading, isReady: content?.status === 'ready' };
}
