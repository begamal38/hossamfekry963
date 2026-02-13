import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Simple hash for video URL to detect changes
 */
function hashVideoUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lesson_id, lesson_title, youtube_url, course_id, chapter_id } = await req.json();

    if (!lesson_id || !youtube_url) {
      return new Response(
        JSON.stringify({ error: 'lesson_id and youtube_url are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const videoHash = hashVideoUrl(youtube_url);

    // Check if content already exists and is up-to-date
    const { data: existing } = await supabase
      .from('lesson_ai_content')
      .select('id, video_url_hash, status')
      .eq('lesson_id', lesson_id)
      .maybeSingle();

    // Skip if already generated with same video URL
    if (existing && existing.video_url_hash === videoHash && existing.status === 'ready') {
      return new Response(
        JSON.stringify({ status: 'already_generated', id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if currently generating
    if (existing && existing.status === 'generating') {
      return new Response(
        JSON.stringify({ status: 'already_generating', id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark as generating
    if (existing) {
      await supabase
        .from('lesson_ai_content')
        .update({ status: 'generating', video_url_hash: videoHash, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('lesson_ai_content')
        .insert({
          lesson_id,
          status: 'generating',
          video_url_hash: videoHash,
        });
    }

    // Call Lovable AI Gateway (Gemini)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are a professional chemistry teacher for Egyptian Thanaweya Amma students. The lesson explanation is mainly Arabic with English scientific terms.

Lesson Title: ${lesson_title || 'Chemistry Lesson'}
YouTube Video URL: ${youtube_url}

Generate comprehensive study content for this lesson in the following format. Write in Arabic with English chemical/scientific terms where appropriate.

IMPORTANT: Respond ONLY with valid JSON, no markdown formatting, no code blocks. The JSON must have exactly these three keys:

{
  "slides_content": "شرح تفصيلي للحصة على شكل شرائح:\\n\\n📌 المفاهيم الأساسية:\\n- [مفهوم 1]\\n- [مفهوم 2]\\n\\n📝 الشرح خطوة بخطوة:\\n1. [خطوة 1]\\n2. [خطوة 2]\\n\\n⚗️ شرح التفاعلات:\\n- [تفاعل 1 مع المعادلة]\\n- [تفاعل 2 مع المعادلة]",
  
  "infographic_content": "ملخص مرئي للحصة:\\n\\n🔑 نقاط التعلم البصري:\\n- [نقطة 1]\\n- [نقطة 2]\\n\\n💡 حقائق للتذكر السريع:\\n- [حقيقة 1]\\n- [حقيقة 2]\\n\\n📊 ملخص نقطي:\\n- [ملخص 1]\\n- [ملخص 2]",
  
  "revision_notes": "ملاحظات مراجعة مركزة للامتحان:\\n\\n📋 ملخص قصير وبسيط:\\n[ملخص الحصة في فقرة]\\n\\n⭐ أهم النقاط للامتحان:\\n- [نقطة 1]\\n- [نقطة 2]\\n\\n⚠️ أخطاء شائعة يجب تجنبها:\\n- [خطأ 1]\\n- [خطأ 2]"
}`;

    console.log('[generate-lesson-content] Calling Lovable AI for lesson:', lesson_id);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Egyptian chemistry teacher. Always respond with valid JSON only. No markdown, no code blocks, just raw JSON.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[generate-lesson-content] AI error:', aiResponse.status, errText);

      // Update status to failed
      await supabase
        .from('lesson_ai_content')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('lesson_id', lesson_id);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited, try again later' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    console.log('[generate-lesson-content] Raw AI response length:', rawContent.length);

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed: { slides_content?: string; infographic_content?: string; revision_notes?: string };
    try {
      // Try to extract JSON if wrapped in code blocks
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch (parseErr) {
      console.error('[generate-lesson-content] JSON parse error:', parseErr);
      // Store raw content as summary if parsing fails
      parsed = {
        slides_content: rawContent,
        infographic_content: '',
        revision_notes: '',
      };
    }

    // Update the record with generated content
    const { error: updateError } = await supabase
      .from('lesson_ai_content')
      .update({
        summary_text: parsed.slides_content || null,
        infographic_text: parsed.infographic_content || null,
        revision_notes: parsed.revision_notes || null,
        status: 'ready',
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('lesson_id', lesson_id);

    if (updateError) {
      console.error('[generate-lesson-content] DB update error:', updateError);
      throw updateError;
    }

    console.log('[generate-lesson-content] Successfully generated content for lesson:', lesson_id);

    return new Response(
      JSON.stringify({ status: 'generated', lesson_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-lesson-content] Error:', errMsg);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
