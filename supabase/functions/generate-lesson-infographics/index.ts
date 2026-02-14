import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lesson_id, lesson_title, summary_text, force_regenerate } = await req.json();

    if (!lesson_id || !summary_text) {
      return new Response(
        JSON.stringify({ error: 'lesson_id and summary_text are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if infographic images already exist
    const { data: existing } = await supabase
      .from('lesson_ai_content')
      .select('infographic_images')
      .eq('lesson_id', lesson_id)
      .maybeSingle();

    if (!force_regenerate && existing?.infographic_images && (existing.infographic_images as any[]).length > 0) {
      // Check if old images need regeneration (have Arabic titles = old format)
      const imgs = existing.infographic_images as any[];
      const hasOldFormat = imgs.some(img => !img.description_ar);
      if (!hasOldFormat) {
        return new Response(
          JSON.stringify({ status: 'already_generated', images: existing.infographic_images }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('[generate-lesson-infographics] Old format detected, regenerating with NanoBanana Pro');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Use Gemini Flash to extract key concepts (text only, no images)
    const planResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a chemistry education expert. Extract key concepts from lesson content. Respond in JSON only.'
          },
          {
            role: 'user',
            content: `Extract from this chemistry lesson the following. Return valid JSON only, no markdown.
Lesson: "${lesson_title}"
Content: ${summary_text.substring(0, 1000)}

Return this exact JSON structure:
{
  "cards": [
    {
      "type": "concept",
      "title_en": "Main Concept Title",
      "description_ar": "شرح قصير بالعربي في نقطتين أو ثلاثة",
      "image_prompt": "A description for generating a clean diagram"
    },
    {
      "type": "structure",
      "title_en": "Structure or Formula",
      "description_ar": "شرح التركيب بالعربي",
      "image_prompt": "A description for generating a structure diagram"
    },
    {
      "type": "relationship",
      "title_en": "Relationship Map Title",
      "description_ar": "شرح العلاقة بالعربي",
      "image_prompt": "A description for a relationship flow diagram"
    },
    {
      "type": "rule",
      "title_en": "Rule or Law Title",
      "description_ar": "شرح القاعدة بالعربي",
      "image_prompt": "A description for a rule summary diagram"
    },
    {
      "type": "exam_hint",
      "title_en": "Exam Hint Title",
      "description_ar": "نصيحة مهمة للامتحان بالعربي",
      "image_prompt": "A description for an exam hint visual"
    }
  ]
}

Generate 4-5 cards relevant to the lesson content. Keep description_ar short (2-3 bullet points max). image_prompt should describe a clean academic diagram with English labels only.`
          }
        ],
      }),
    });

    if (!planResponse.ok) {
      console.error('[generate-lesson-infographics] Plan extraction failed:', planResponse.status);
      throw new Error(`Plan extraction failed: ${planResponse.status}`);
    }

    const planData = await planResponse.json();
    const planText = planData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let cardPlan: { cards: Array<{ type: string; title_en: string; description_ar: string; image_prompt: string }> };
    try {
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      cardPlan = JSON.parse(jsonMatch ? jsonMatch[0] : planText);
    } catch {
      console.error('[generate-lesson-infographics] Failed to parse plan JSON, using fallback');
      cardPlan = {
        cards: [
          { type: 'concept', title_en: 'Key Concepts', description_ar: 'المفاهيم الأساسية في الدرس', image_prompt: `Clean academic diagram showing key concepts from ${lesson_title} with labeled boxes and arrows` },
          { type: 'relationship', title_en: 'Concept Relationships', description_ar: 'العلاقات بين المفاهيم', image_prompt: `Flow diagram showing relationships between concepts in ${lesson_title} with English labels` },
          { type: 'rule', title_en: 'Rules & Laws', description_ar: 'القوانين والقواعد المهمة', image_prompt: `Summary diagram of rules and laws from ${lesson_title} with clear English labels` },
          { type: 'exam_hint', title_en: 'Exam Tips', description_ar: 'نقاط مهمة للامتحان', image_prompt: `Exam tips visual for ${lesson_title} highlighting common mistakes with English labels` },
        ]
      };
    }

    // Step 2: Generate images using NanoBanana Pro (English labels only)
    const generatedImages: Array<{
      url: string;
      title_en: string;
      description_ar: string;
      type: string;
    }> = [];

    for (const card of cardPlan.cards.slice(0, 5)) {
      try {
        console.log(`[generate-lesson-infographics] Generating ${card.type} with NanoBanana Pro for lesson: ${lesson_id}`);

        const imagePrompt = `Create a clean academic infographic card for chemistry education.

STYLE:
- Pure white background
- Soft blue borders (#3B6CB4 accent)
- High contrast, large readable text
- Simple flat design, no gradients
- Portrait-friendly 3:4 aspect ratio
- Minimal visual noise

CONTENT:
- Title at top in large bold text: "${card.title_en}"
- ${card.image_prompt}
- Use ONLY English text labels
- NO Arabic text anywhere in the image
- Clean scientific diagrams with labeled parts
- Use arrows, boxes, and simple icons

IMPORTANT: All text inside the image must be in English. Keep it minimal and readable on mobile screens.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-pro-image-preview',
            messages: [
              { role: 'user', content: imagePrompt }
            ],
            modalities: ['image', 'text'],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`[generate-lesson-infographics] NanoBanana Pro error for ${card.type}:`, aiResponse.status);
          if (aiResponse.status === 429) {
            console.log('[generate-lesson-infographics] Rate limited, waiting 5s...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          if (aiResponse.status === 402) {
            console.error('[generate-lesson-infographics] Payment required');
            break;
          }
          continue;
        }

        const aiData = await aiResponse.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          const fileName = `${lesson_id}/${card.type}.png`;
          const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          const { error: uploadError } = await supabase.storage
            .from('lesson-infographics')
            .upload(fileName, binaryData, {
              contentType: 'image/png',
              upsert: true,
            });

          if (uploadError) {
            console.error(`[generate-lesson-infographics] Upload error for ${card.type}:`, uploadError);
            generatedImages.push({
              url: imageUrl,
              title_en: card.title_en,
              description_ar: card.description_ar,
              type: card.type,
            });
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('lesson-infographics')
              .getPublicUrl(fileName);

            generatedImages.push({
              url: publicUrlData.publicUrl,
              title_en: card.title_en,
              description_ar: card.description_ar,
              type: card.type,
            });
          }
        }

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (err) {
        console.error(`[generate-lesson-infographics] Error generating ${card.type}:`, err);
        continue;
      }
    }

    // Save generated images to database
    if (generatedImages.length > 0) {
      const { error: updateError } = await supabase
        .from('lesson_ai_content')
        .update({
          infographic_images: generatedImages,
          updated_at: new Date().toISOString(),
        })
        .eq('lesson_id', lesson_id);

      if (updateError) {
        console.error('[generate-lesson-infographics] DB update error:', updateError);
        throw updateError;
      }
    }

    console.log(`[generate-lesson-infographics] Generated ${generatedImages.length} images for lesson: ${lesson_id}`);

    return new Response(
      JSON.stringify({ status: 'generated', count: generatedImages.length, images: generatedImages }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-lesson-infographics] Error:', errMsg);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
