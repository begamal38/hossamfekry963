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

    const prompt = `You are an expert Egyptian chemistry teacher for Thanaweya Amma students.
The student studies in Arabic, but understands scientific terms in English.

Lesson Title: ${lesson_title || 'Chemistry Lesson'}
YouTube Video URL: ${youtube_url}

Generate structured study content in SIMPLE ARABIC, but keep important chemistry terms in ENGLISH inside brackets.
Example style: "تفاعل الإحلال الأحادي (Single Displacement Reaction)" — "عدد التأكسد (Oxidation Number)" — "الفلز النشط (Active Metal)"

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks. The JSON must have exactly these three keys:

{
  "slides_content": "SLIDE-STYLE EXPLANATION — step-by-step simplified explanation as if making slides:\\n\\n📌 أهم فكرة في الحصة:\\n- [الفكرة الرئيسية بالعربي مع المصطلح الإنجليزي]\\n\\n📝 شرح المفاهيم الأساسية:\\n- [مفهوم 1 (English Term)]\\n- [مفهوم 2 (English Term)]\\n\\n⚗️ القوانين أو المعادلات المهمة:\\n- [قانون/معادلة مع شرح بسيط]\\n\\n🎯 ربط الفكرة بالامتحان:\\n- [كيف بتيجي في الامتحان]\\n\\nUse bullet points. Keep sentences short and clear.",

  "infographic_content": "INFOGRAPHIC — visual-learning friendly content:\\n\\n🔑 نقاط سريعة للحفظ:\\n- [نقطة 1 (English Term)]\\n- [نقطة 2]\\n\\n⚖️ مقارنات مهمة:\\n- [مقارنة 1]\\n- [مقارنة 2]\\n\\n🔗 علاقات بين المفاهيم:\\n- [علاقة 1]\\n\\n⚠️ ملاحظات مهمة للامتحان:\\n- [ملاحظة 1]\\n\\nStyle: Short lines. Memory-friendly.",

  "revision_notes": "REVISION NOTES — quick revision before exam:\\n\\n📋 ملخص سريع للحصة:\\n[فقرة قصيرة]\\n\\n📐 أهم القوانين:\\n- [قانون 1]\\n\\n📚 أهم المصطلحات:\\n- [مصطلح عربي (English Term)]\\n\\n🔄 أفكار بتتكرر في الامتحانات:\\n- [فكرة 1]\\n- [فكرة 2]"
}

TONE: بسيط، واضح، مناسب لطلاب ثانوي، مش أكاديمي زيادة، مش عامي.
IMPORTANT: Do NOT invent facts. Base content on the lesson topic. Focus on exam-relevant understanding.`;

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
            content: 'You are an expert Egyptian chemistry teacher for Thanaweya Amma. Write in simple Arabic with English scientific terms in brackets. Always respond with valid JSON only. No markdown, no code blocks, just raw JSON.',
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
