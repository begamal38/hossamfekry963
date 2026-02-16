import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type SyncMode = 'all' | 'missing_content' | 'visuals_only';

interface SyncRequest {
  mode: SyncMode;
  batch_size?: number;
  offset?: number;
}

function hashVideoUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getTrackLanguage(courseGrade?: string): 'ar' | 'en' {
  if (!courseGrade) return 'ar';
  return courseGrade.includes('languages') ? 'en' : 'ar';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = 'all', batch_size = 15, offset = 0 }: SyncRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Fetch lessons with video URLs + course grade
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, title_ar, video_url, course_id, chapter_id, courses:course_id(grade)')
      .not('video_url', 'is', null)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .range(offset, offset + batch_size - 1);

    if (lessonsError) throw lessonsError;
    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({ status: 'complete', processed: 0, skipped: 0, failed: 0, total_lessons: 0, has_more: false, next_offset: offset, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing AI content
    const lessonIds = lessons.map(l => l.id);
    const { data: existingContent } = await supabase
      .from('lesson_ai_content')
      .select('lesson_id, summary_text, infographic_text, revision_notes, status, infographic_images')
      .in('lesson_id', lessonIds);

    const contentMap = new Map(
      (existingContent || []).map(c => [c.lesson_id, c])
    );

    // Count total
    const { count: totalCount } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .not('video_url', 'is', null)
      .eq('is_active', true);

    const results: Array<{ lesson_id: string; action: string; success: boolean; error?: string }> = [];

    for (const lesson of lessons) {
      const existing = contentMap.get(lesson.id);
      const hasContent = existing && existing.status === 'ready' && !!existing.summary_text;
      const hasVisuals = existing?.infographic_images && (existing.infographic_images as any[]).length > 0;
      const courseGrade = (lesson as any).courses?.grade;
      const trackLang = getTrackLanguage(courseGrade);

      try {
        // ── MODE: visuals_only ──
        // Only generate visuals for lessons that have text content but no visuals
        if (mode === 'visuals_only') {
          if (hasVisuals) {
            results.push({ lesson_id: lesson.id, action: 'skip_visuals', success: true });
            continue;
          }
          if (!hasContent) {
            // Can't generate visuals without text content
            results.push({ lesson_id: lesson.id, action: 'skip_no_text', success: true });
            continue;
          }
          const { error } = await supabase.functions.invoke('generate-lesson-infographics', {
            body: { lesson_id: lesson.id, lesson_title: trackLang === 'ar' ? lesson.title_ar : lesson.title, summary_text: existing!.summary_text, course_grade: courseGrade }
          });
          results.push({ lesson_id: lesson.id, action: 'generate_visuals', success: !error, error: error?.message });
          await delay(3000);
          continue;
        }

        // ── MODE: missing_content ──
        // Only generate text content where missing. Never touch visuals.
        if (mode === 'missing_content') {
          if (hasContent) {
            results.push({ lesson_id: lesson.id, action: 'skip', success: true });
            continue;
          }
          const genResult = await generateContent(supabase, LOVABLE_API_KEY, lesson, trackLang, courseGrade);
          results.push({ lesson_id: lesson.id, action: `generate_text_${trackLang}`, success: genResult.success, error: genResult.error });
          await delay(2000);
          continue;
        }

        // ── MODE: all ──
        // Full recovery: generate text if missing, then visuals if missing
        if (!hasContent) {
          const genResult = await generateContent(supabase, LOVABLE_API_KEY, lesson, trackLang, courseGrade);
          results.push({ lesson_id: lesson.id, action: `generate_text_${trackLang}`, success: genResult.success, error: genResult.error });
          if (!genResult.success) continue;
          await delay(2000);

          // After generating text, also generate visuals
          // Re-fetch the newly created content for the summary_text
          const { data: freshContent } = await supabase
            .from('lesson_ai_content')
            .select('summary_text')
            .eq('lesson_id', lesson.id)
            .maybeSingle();

          if (freshContent?.summary_text) {
            const { error: visErr } = await supabase.functions.invoke('generate-lesson-infographics', {
              body: { lesson_id: lesson.id, lesson_title: trackLang === 'ar' ? lesson.title_ar : lesson.title, summary_text: freshContent.summary_text, course_grade: courseGrade }
            });
            if (visErr) {
              results.push({ lesson_id: lesson.id, action: 'generate_visuals_failed', success: false, error: visErr.message });
            }
            await delay(3000);
          }
        } else if (!hasVisuals) {
          // Text exists but visuals missing
          const { error: visErr } = await supabase.functions.invoke('generate-lesson-infographics', {
            body: { lesson_id: lesson.id, lesson_title: trackLang === 'ar' ? lesson.title_ar : lesson.title, summary_text: existing!.summary_text, course_grade: courseGrade }
          });
          results.push({ lesson_id: lesson.id, action: 'generate_visuals', success: !visErr, error: visErr?.message });
          await delay(3000);
        } else {
          // Both text and visuals exist
          results.push({ lesson_id: lesson.id, action: 'skip', success: true });
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.push({ lesson_id: lesson.id, action: 'error', success: false, error: msg });
      }
    }

    const processed = results.filter(r => !r.action.startsWith('skip')).length;
    const skipped = results.filter(r => r.action.startsWith('skip')).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        status: 'batch_complete',
        batch_offset: offset,
        batch_size: lessons.length,
        total_lessons: totalCount || 0,
        processed,
        skipped,
        failed,
        has_more: (offset + batch_size) < (totalCount || 0),
        next_offset: offset + batch_size,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-lesson-content] Error:', errMsg);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateContent(
  supabase: any,
  apiKey: string,
  lesson: { id: string; title: string; title_ar: string; video_url: string | null; course_id: string; chapter_id: string | null },
  lang: 'ar' | 'en',
  courseGrade?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!lesson.video_url) return { success: false, error: 'No video URL' };

  try {
    const videoHash = hashVideoUrl(lesson.video_url);
    const lessonTitle = lang === 'ar' ? lesson.title_ar : lesson.title;

    const { data: existing } = await supabase
      .from('lesson_ai_content')
      .select('id, status')
      .eq('lesson_id', lesson.id)
      .maybeSingle();

    if (existing?.status === 'generating') return { success: true, error: 'already generating' };

    if (existing) {
      await supabase.from('lesson_ai_content')
        .update({ status: 'generating', video_url_hash: videoHash, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('lesson_ai_content')
        .insert({ lesson_id: lesson.id, status: 'generating', video_url_hash: videoHash });
    }

    const systemPrompt = lang === 'en'
      ? 'You are an expert chemistry teacher. Write clear English study content. Always respond with valid JSON only.'
      : 'You are an expert Egyptian chemistry teacher for Thanaweya Amma. Write in simple Arabic with English scientific terms in brackets. Always respond with valid JSON only.';

    const userPrompt = lang === 'en'
      ? `Generate study content in clear English for: "${lessonTitle}". YouTube: ${lesson.video_url}. Respond ONLY with valid JSON: {"slides_content":"...","infographic_content":"...","revision_notes":"..."}`
      : `Generate study content in simple Arabic (scientific terms in English brackets) for: "${lessonTitle}". YouTube: ${lesson.video_url}. Respond ONLY with valid JSON: {"slides_content":"...","infographic_content":"...","revision_notes":"..."}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      await aiResponse.text();
      await supabase.from('lesson_ai_content')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('lesson_id', lesson.id);
      return { success: false, error: `AI error: ${status}` };
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    let parsed: { slides_content?: string; infographic_content?: string; revision_notes?: string };
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      parsed = { slides_content: rawContent, infographic_content: '', revision_notes: '' };
    }

    await supabase.from('lesson_ai_content').update({
      summary_text: parsed.slides_content || null,
      infographic_text: parsed.infographic_content || null,
      revision_notes: parsed.revision_notes || null,
      status: 'ready',
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('lesson_id', lesson.id);

    console.log(`[sync-lesson-content] Generated ${lang} (track: ${courseGrade}) for lesson ${lesson.id}`);
    return { success: true };

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    await supabase.from('lesson_ai_content')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('lesson_id', lesson.id);
    return { success: false, error: msg };
  }
}
