import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Determine content language from course grade.
 * "languages" track → English, everything else → Arabic.
 */
function getTrackLanguage(courseGrade?: string): 'ar' | 'en' {
  if (!courseGrade) return 'ar';
  return courseGrade.includes('languages') ? 'en' : 'ar';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lesson_id, lesson_title, summary_text, force_regenerate, course_grade } = await req.json();

    if (!lesson_id || !summary_text) {
      return new Response(
        JSON.stringify({ error: 'lesson_id and summary_text are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const trackLang = getTrackLanguage(course_grade);

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
      const imgs = existing.infographic_images as any[];
      // Detect old format: missing description_ar or broken Arabic
      const hasOldFormat = imgs.some(img => !img.description_ar || !img.title_en);
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

    // Step 1: Use Gemini Flash to extract key concepts (TEXT ONLY — no images)
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
            content: trackLang === 'ar'
              ? `Extract from this chemistry lesson the following. Return valid JSON only, no markdown.
Lesson: "${lesson_title}"
Content: ${summary_text.substring(0, 1000)}

Return this exact JSON structure:
{
  "cards": [
    {
      "type": "concept",
      "title_ar": "عنوان المفهوم بالعربي",
      "title_en": "Concept Title in English",
      "description_ar": "شرح قصير بالعربي في نقطتين أو ثلاثة",
      "image_prompt_ar": "إنشاء بطاقة انفوجراف أكاديمية عن [المفهوم]. يجب أن تحتوي على عنوان عربي كبير واضح وتحته شرح قصير بالعربي مع المصطلح الإنجليزي بين أقواس. تصميم نظيف أكاديمي بخلفية بيضاء وإطار أزرق."
    },
    {
      "type": "structure",
      "title_ar": "عنوان التركيب بالعربي",
      "title_en": "Structure Title",
      "description_ar": "شرح التركيب بالعربي",
      "image_prompt_ar": "بطاقة انفوجراف توضيحية عن التركيب الكيميائي. عنوان عربي كبير، رسم بياني بسيط مع تسميات بالعربي والإنجليزي بين أقواس."
    },
    {
      "type": "relationship",
      "title_ar": "خريطة العلاقات",
      "title_en": "Relationship Map Title",
      "description_ar": "شرح العلاقة بالعربي",
      "image_prompt_ar": "بطاقة انفوجراف توضح العلاقة بين المفاهيم. أسهم وصناديق مع نص عربي واضح ومصطلحات إنجليزية بين أقواس."
    },
    {
      "type": "rule",
      "title_ar": "القاعدة أو القانون",
      "title_en": "Rule or Law Title",
      "description_ar": "شرح القاعدة بالعربي",
      "image_prompt_ar": "بطاقة ملخص قاعدة كيميائية. عنوان عربي بارز، نقاط مختصرة بالعربي، معادلة أو قانون واضح."
    },
    {
      "type": "exam_hint",
      "title_ar": "نصيحة للامتحان",
      "title_en": "Exam Hint Title",
      "description_ar": "نصيحة مهمة للامتحان بالعربي",
      "image_prompt_ar": "بطاقة نصائح امتحان. عنوان عربي واضح، نقاط مختصرة بالعربي عن الأخطاء الشائعة والنقاط المهمة."
    }
  ]
}

Generate 4-5 cards relevant to the lesson content. Keep description_ar short (2-3 bullet points max). image_prompt_ar should describe an Arabic-language infographic card with clear Arabic text and English scientific terms in brackets.`
              : `Extract from this chemistry lesson the following. Return valid JSON only, no markdown.
Lesson: "${lesson_title}"
Content: ${summary_text.substring(0, 1000)}

Return this exact JSON structure:
{
  "cards": [
    {
      "type": "concept",
      "title_en": "Main Concept Title",
      "description_ar": "Brief English description in 2-3 points",
      "image_prompt": "A description for generating a clean diagram with English labels"
    },
    {
      "type": "structure",
      "title_en": "Structure or Formula",
      "description_ar": "Structure explanation",
      "image_prompt": "A description for generating a structure diagram"
    },
    {
      "type": "relationship",
      "title_en": "Relationship Map Title",
      "description_ar": "Relationship explanation",
      "image_prompt": "A description for a relationship flow diagram"
    },
    {
      "type": "rule",
      "title_en": "Rule or Law Title",
      "description_ar": "Rule explanation",
      "image_prompt": "A description for a rule summary diagram"
    },
    {
      "type": "exam_hint",
      "title_en": "Exam Hint Title",
      "description_ar": "Important exam tip",
      "image_prompt": "A description for an exam hint visual"
    }
  ]
}

Generate 4-5 cards relevant to the lesson content. Keep description_ar short (2-3 bullet points max). image_prompt should describe a clean academic diagram with English labels only.`,
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

    let cardPlan: { cards: any[] };
    try {
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      cardPlan = JSON.parse(jsonMatch ? jsonMatch[0] : planText);
    } catch {
      console.error('[generate-lesson-infographics] Failed to parse plan JSON, using fallback');
      if (trackLang === 'ar') {
        cardPlan = {
          cards: [
            { type: 'concept', title_ar: 'المفاهيم الأساسية', title_en: 'Key Concepts', description_ar: 'المفاهيم الأساسية في الدرس', image_prompt_ar: `بطاقة انفوجراف أكاديمية عن المفاهيم الأساسية في درس ${lesson_title}. عنوان عربي كبير ونقاط مختصرة بالعربي مع مصطلحات إنجليزية بين أقواس.` },
            { type: 'relationship', title_ar: 'العلاقات بين المفاهيم', title_en: 'Concept Relationships', description_ar: 'العلاقات بين المفاهيم', image_prompt_ar: `بطاقة انفوجراف عن العلاقات بين المفاهيم في ${lesson_title}. أسهم وصناديق مع نص عربي واضح.` },
            { type: 'rule', title_ar: 'القوانين والقواعد', title_en: 'Rules & Laws', description_ar: 'القوانين والقواعد المهمة', image_prompt_ar: `بطاقة ملخص قوانين وقواعد من ${lesson_title}. نقاط مختصرة بالعربي.` },
            { type: 'exam_hint', title_ar: 'نصائح للامتحان', title_en: 'Exam Tips', description_ar: 'نقاط مهمة للامتحان', image_prompt_ar: `بطاقة نصائح امتحان عن ${lesson_title}. نقاط عربية مختصرة عن الأخطاء الشائعة.` },
          ]
        };
      } else {
        cardPlan = {
          cards: [
            { type: 'concept', title_en: 'Key Concepts', description_ar: 'Key concepts in the lesson', image_prompt: `Clean academic diagram showing key concepts from ${lesson_title} with labeled boxes and arrows` },
            { type: 'relationship', title_en: 'Concept Relationships', description_ar: 'Relationships between concepts', image_prompt: `Flow diagram showing relationships between concepts in ${lesson_title} with English labels` },
            { type: 'rule', title_en: 'Rules & Laws', description_ar: 'Important rules and laws', image_prompt: `Summary diagram of rules and laws from ${lesson_title} with clear English labels` },
            { type: 'exam_hint', title_en: 'Exam Tips', description_ar: 'Important exam points', image_prompt: `Exam tips visual for ${lesson_title} highlighting common mistakes with English labels` },
          ]
        };
      }
    }

    // Step 2: Generate images using NanoBanana Pro ONLY
    const generatedImages: Array<{
      url: string;
      title_en: string;
      title_ar?: string;
      description_ar: string;
      type: string;
    }> = [];

    for (const card of cardPlan.cards.slice(0, 5)) {
      try {
        console.log(`[generate-lesson-infographics] Generating ${card.type} (${trackLang}) with NanoBanana Pro for lesson: ${lesson_id}`);

        // Build the image prompt based on track language
        let imagePrompt: string;

        if (trackLang === 'ar') {
          // Arabic track: Arabic text inside images with English scientific terms in brackets
          const arPromptBase = card.image_prompt_ar || `بطاقة انفوجراف أكاديمية عن ${card.title_ar || card.title_en}`;
          imagePrompt = `Create a clean academic infographic card for chemistry education.

STYLE:
- Pure white background
- Soft blue borders (#3B6CB4 accent)
- High contrast, large readable text
- Simple flat design, no gradients
- Portrait-friendly 3:4 aspect ratio
- Minimal visual noise
- RTL layout (right-to-left)

CONTENT:
- Title at top in large bold Arabic text: "${card.title_ar || card.title_en}"
- ${arPromptBase}
- Use Arabic as the main language for all text
- Include English scientific terms in brackets where appropriate
- Example format: "السلسلة الكربونية الأم (Parent Chain)"
- Clean scientific diagrams with labeled parts
- Use arrows, boxes, and simple icons
- Large readable Arabic font
- Short phrases only, not long paragraphs

IMPORTANT: Main text must be in Arabic with clear typography. English terms appear in brackets only. Keep it minimal and readable on mobile screens.`;
        } else {
          // English/Languages track: English only
          const enPromptBase = card.image_prompt || `Clean academic diagram about ${card.title_en}`;
          imagePrompt = `Create a clean academic infographic card for chemistry education.

STYLE:
- Pure white background
- Soft blue borders (#3B6CB4 accent)
- High contrast, large readable text
- Simple flat design, no gradients
- Portrait-friendly 3:4 aspect ratio
- Minimal visual noise

CONTENT:
- Title at top in large bold text: "${card.title_en}"
- ${enPromptBase}
- Use ONLY English text labels
- NO Arabic text anywhere in the image
- Clean scientific diagrams with labeled parts
- Use arrows, boxes, and simple icons

IMPORTANT: All text inside the image must be in English. Keep it minimal and readable on mobile screens.`;
        }

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

          const finalUrl = uploadError
            ? imageUrl
            : supabase.storage.from('lesson-infographics').getPublicUrl(fileName).data.publicUrl;

          if (uploadError) {
            console.error(`[generate-lesson-infographics] Upload error for ${card.type}:`, uploadError);
          }

          generatedImages.push({
            url: finalUrl,
            title_en: card.title_en,
            title_ar: card.title_ar || undefined,
            description_ar: card.description_ar,
            type: card.type,
          });
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

    console.log(`[generate-lesson-infographics] Generated ${generatedImages.length} ${trackLang} images for lesson: ${lesson_id}`);

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
