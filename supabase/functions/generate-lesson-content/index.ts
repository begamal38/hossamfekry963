import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    const { lesson_id, lesson_title, youtube_url, course_id, chapter_id, language } = await req.json();
    const targetLang = language || 'ar';

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

    // Check if content already exists
    const { data: existing } = await supabase
      .from('lesson_ai_content')
      .select('id, video_url_hash, status, key_points')
      .eq('lesson_id', lesson_id)
      .maybeSingle();

    // For Arabic (default): check main columns
    if (targetLang === 'ar') {
      if (existing && existing.video_url_hash === videoHash && existing.status === 'ready') {
        return new Response(
          JSON.stringify({ status: 'already_generated', id: existing.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (existing && existing.status === 'generating') {
        return new Response(
          JSON.stringify({ status: 'already_generating', id: existing.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // For English: check if English cache exists in key_points
    if (targetLang === 'en' && existing) {
      const kp = existing.key_points as any;
      if (kp && kp.en && kp.en.summary_text) {
        return new Response(
          JSON.stringify({ 
            status: 'already_generated', 
            id: existing.id,
            en_content: kp.en 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // For Arabic generation: mark as generating
    if (targetLang === 'ar') {
      if (existing) {
        await supabase
          .from('lesson_ai_content')
          .update({ status: 'generating', video_url_hash: videoHash, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('lesson_ai_content')
          .insert({ lesson_id, status: 'generating', video_url_hash: videoHash });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Language-specific prompts
    const arPrompt = `You are an expert Egyptian chemistry teacher for Thanaweya Amma students.
The student studies in Arabic, but understands scientific terms in English.

Lesson Title: ${lesson_title || 'Chemistry Lesson'}
YouTube Video URL: ${youtube_url}

Generate structured study content in SIMPLE ARABIC, but keep important chemistry terms in ENGLISH inside brackets.
Example style: "تفاعل الإحلال الأحادي (Single Displacement Reaction)" — "عدد التأكسد (Oxidation Number)"

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks. The JSON must have exactly these three keys:

{
  "slides_content": "SLIDE-STYLE EXPLANATION — step-by-step simplified explanation as if making slides:\\n\\n📌 أهم فكرة في الحصة:\\n- [الفكرة الرئيسية بالعربي مع المصطلح الإنجليزي]\\n\\n📝 شرح المفاهيم الأساسية:\\n- [مفهوم 1 (English Term)]\\n\\n⚗️ القوانين أو المعادلات المهمة:\\n- [قانون/معادلة مع شرح بسيط]\\n\\n🎯 ربط الفكرة بالامتحان:\\n- [كيف بتيجي في الامتحان]",

  "infographic_content": "INFOGRAPHIC — visual-learning friendly content:\\n\\n🔑 نقاط سريعة للحفظ:\\n- [نقطة 1 (English Term)]\\n\\n⚖️ مقارنات مهمة:\\n- [مقارنة 1]\\n\\n🔗 علاقات بين المفاهيم:\\n- [علاقة 1]\\n\\n⚠️ ملاحظات مهمة للامتحان:\\n- [ملاحظة 1]",

  "revision_notes": "REVISION NOTES — quick revision before exam:\\n\\n📋 ملخص سريع للحصة:\\n[فقرة قصيرة]\\n\\n📐 أهم القوانين:\\n- [قانون 1]\\n\\n📚 أهم المصطلحات:\\n- [مصطلح عربي (English Term)]\\n\\n🔄 أفكار بتتكرر في الامتحانات:\\n- [فكرة 1]"
}

TONE: بسيط، واضح، مناسب لطلاب ثانوي.
IMPORTANT: Do NOT invent facts. Base content on the lesson topic.`;

    const enPrompt = `You are an expert chemistry teacher for Egyptian Thanaweya Amma students.
Generate study content in clear, simple English for a chemistry lesson.

Lesson Title: ${lesson_title || 'Chemistry Lesson'}
YouTube Video URL: ${youtube_url}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks. The JSON must have exactly these three keys:

{
  "slides_content": "SLIDE-STYLE EXPLANATION:\\n\\n📌 Main Lesson Idea:\\n- [Core concept of this lesson]\\n\\n📝 Key Concepts:\\n- [Concept 1 with definition]\\n- [Concept 2 with definition]\\n\\n⚗️ Important Laws/Equations:\\n- [Law or equation with explanation]\\n\\n🎯 Exam Relevance:\\n- [How this appears in exams]",

  "infographic_content": "INFOGRAPHIC — visual-learning friendly:\\n\\n🔑 Quick Points to Remember:\\n- [Point 1]\\n\\n⚖️ Important Comparisons:\\n- [Comparison 1]\\n\\n🔗 Concept Relationships:\\n- [Relationship 1]\\n\\n⚠️ Exam Notes:\\n- [Note 1]",

  "revision_notes": "REVISION NOTES — quick exam review:\\n\\n📋 Quick Summary:\\n[Brief paragraph]\\n\\n📐 Key Formulas:\\n- [Formula 1]\\n\\n📚 Key Terms:\\n- [Term with definition]\\n\\n🔄 Recurring Exam Topics:\\n- [Topic 1]"
}

TONE: Clear, concise, student-friendly. Not overly academic.
IMPORTANT: Do NOT invent facts. Base content on the lesson topic.`;

    const systemPrompt = targetLang === 'en'
      ? 'You are an expert chemistry teacher. Write clear English study content. Always respond with valid JSON only. No markdown, no code blocks.'
      : 'You are an expert Egyptian chemistry teacher for Thanaweya Amma. Write in simple Arabic with English scientific terms in brackets. Always respond with valid JSON only. No markdown, no code blocks, just raw JSON.';

    console.log(`[generate-lesson-content] Generating ${targetLang} content for lesson:`, lesson_id);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: targetLang === 'en' ? enPrompt : arPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[generate-lesson-content] AI error:', aiResponse.status, errText);

      if (targetLang === 'ar') {
        await supabase
          .from('lesson_ai_content')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('lesson_id', lesson_id);
      }

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited, try again later' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    let parsed: { slides_content?: string; infographic_content?: string; revision_notes?: string };
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch (parseErr) {
      console.error('[generate-lesson-content] JSON parse error:', parseErr);
      parsed = { slides_content: rawContent, infographic_content: '', revision_notes: '' };
    }

    if (targetLang === 'ar') {
      // Store Arabic in main columns (default behavior)
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

      if (updateError) throw updateError;
    } else {
      // Store English in key_points JSON (cache without schema change)
      const enContent = {
        summary_text: parsed.slides_content || null,
        infographic_text: parsed.infographic_content || null,
        revision_notes: parsed.revision_notes || null,
      };
      
      const currentKp = (existing?.key_points as any) || {};
      const newKp = { ...currentKp, en: enContent };

      const { error: updateError } = await supabase
        .from('lesson_ai_content')
        .update({
          key_points: newKp,
          updated_at: new Date().toISOString(),
        })
        .eq('lesson_id', lesson_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ status: 'generated', lesson_id, en_content: enContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-lesson-content] Successfully generated ${targetLang} content for lesson:`, lesson_id);

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
