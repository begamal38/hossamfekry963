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
    const { lesson_id, lesson_title, summary_text } = await req.json();

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

    if (existing?.infographic_images && (existing.infographic_images as any[]).length > 0) {
      return new Response(
        JSON.stringify({ status: 'already_generated', images: existing.infographic_images }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Extract key concepts from summary for targeted image generation
    const truncatedSummary = summary_text.substring(0, 800);

    // Generate 4 infographic cards using Gemini image generation
    const cardPrompts = [
      {
        type: 'concepts',
        title_ar: 'المفاهيم الأساسية',
        prompt: `Create a clean educational infographic card in Arabic for Egyptian chemistry students. White background, indigo blue (#3B6CB4) accent color. Title at top: "المفاهيم الأساسية". Show the main concepts from this lesson as organized visual blocks with icons. Lesson: "${lesson_title}". Key content: ${truncatedSummary.substring(0, 200)}. Style: flat design, minimal, professional, 4:3 aspect ratio. Include Arabic text with English chemistry terms in brackets.`
      },
      {
        type: 'relationships',
        title_ar: 'العلاقات بين المفاهيم',
        prompt: `Create a clean educational concept map infographic in Arabic for Egyptian chemistry students. White background, indigo blue (#3B6CB4) accent. Title: "العلاقات بين المفاهيم". Show relationships between concepts using arrows and connected boxes. Lesson: "${lesson_title}". Content: ${truncatedSummary.substring(0, 200)}. Style: flat design, clear arrows, minimal, 4:3 aspect ratio. Arabic text with English chemistry terms.`
      },
      {
        type: 'exam_tips',
        title_ar: 'نصائح للامتحان',
        prompt: `Create a clean educational exam tips infographic in Arabic for Egyptian chemistry students. White background with amber/warning accent color. Title: "مهم للامتحان". Show 3-4 key exam tips as highlighted bullet points with warning icons. Lesson: "${lesson_title}". Content: ${truncatedSummary.substring(0, 200)}. Style: flat design, attention-grabbing, 4:3 aspect ratio. Arabic text.`
      },
      {
        type: 'summary',
        title_ar: 'ملخص سريع',
        prompt: `Create a clean educational quick summary infographic in Arabic for Egyptian chemistry students. White background, green accent color. Title: "ملخص سريع". Show the lesson summary as organized visual sections with small icons. Lesson: "${lesson_title}". Content: ${truncatedSummary.substring(0, 200)}. Style: flat design, scannable, 4:3 aspect ratio. Arabic with English chemistry terms in brackets.`
      }
    ];

    const generatedImages: { url: string; title: string; title_ar: string; type: string }[] = [];

    // Generate images sequentially to avoid rate limits
    for (const card of cardPrompts) {
      try {
        console.log(`[generate-lesson-infographics] Generating ${card.type} for lesson: ${lesson_id}`);
        
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [
              { role: 'user', content: card.prompt }
            ],
            modalities: ['image', 'text'],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`[generate-lesson-infographics] AI error for ${card.type}:`, aiResponse.status);
          if (aiResponse.status === 429) {
            // Rate limited, wait and continue with what we have
            console.log('[generate-lesson-infographics] Rate limited, stopping generation');
            break;
          }
          continue;
        }

        const aiData = await aiResponse.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          // Upload to Supabase Storage
          const fileName = `${lesson_id}/${card.type}.png`;
          
          // Convert base64 to binary
          const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('lesson-infographics')
            .upload(fileName, binaryData, {
              contentType: 'image/png',
              upsert: true,
            });

          if (uploadError) {
            console.error(`[generate-lesson-infographics] Upload error for ${card.type}:`, uploadError);
            // Still save the base64 URL as fallback
            generatedImages.push({
              url: imageUrl,
              title: card.type,
              title_ar: card.title_ar,
              type: card.type,
            });
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('lesson-infographics')
              .getPublicUrl(fileName);

            generatedImages.push({
              url: publicUrlData.publicUrl,
              title: card.type,
              title_ar: card.title_ar,
              type: card.type,
            });
          }
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
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
