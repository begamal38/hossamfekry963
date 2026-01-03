import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(input: string): string | null {
  if (!input) return null;
  
  const patterns = [
    /youtube\.com\/embed\/([^\"&?\s\/]+)/,
    /youtube\.com\/watch\?v=([^&?\s]+)/,
    /youtu\.be\/([^&?\s\/]+)/,
    /youtube\.com\/shorts\/([^&?\s\/]+)/,
    /youtube\.com\/v\/([^&?\s\/]+)/,
    /youtube\.com\/live\/([^&?\s\/]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1].split('?')[0];
    }
  }
  
  return null;
}

/**
 * Try to fetch YouTube transcript using various methods
 */
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  // Method 1: Try YouTube's timedtext API (works for videos with available captions)
  try {
    // First, get the video page to extract caption tracks
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(videoPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ar,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (pageResponse.ok) {
      const pageHtml = await pageResponse.text();
      
      // Try to find captions in the page data
      const captionsMatch = pageHtml.match(/"captionTracks":\s*(\[.*?\])/);
      if (captionsMatch) {
        try {
          const captionTracks = JSON.parse(captionsMatch[1]);
          
          // Prefer Arabic captions, then auto-generated, then any
          let captionUrl = null;
          for (const track of captionTracks) {
            if (track.languageCode === 'ar') {
              captionUrl = track.baseUrl;
              break;
            }
          }
          if (!captionUrl && captionTracks.length > 0) {
            captionUrl = captionTracks[0].baseUrl;
          }
          
          if (captionUrl) {
            const transcriptResponse = await fetch(captionUrl + '&fmt=srv3', {
              signal: AbortSignal.timeout(10000),
            });
            
            if (transcriptResponse.ok) {
              const transcriptXml = await transcriptResponse.text();
              // Parse XML and extract text
              const textMatches = transcriptXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
              const texts: string[] = [];
              for (const match of textMatches) {
                if (match[1]) {
                  texts.push(match[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
                }
              }
              
              if (texts.length > 0) {
                console.log('[generate-lesson-summary] Got transcript with', texts.length, 'segments');
                return texts.join(' ');
              }
            }
          }
        } catch (e) {
          console.log('[generate-lesson-summary] Failed to parse captions:', e);
        }
      }
    }
  } catch (err) {
    console.log('[generate-lesson-summary] Failed to fetch video page:', err);
  }
  
  return null;
}

/**
 * Get video title from oEmbed
 */
async function getVideoTitle(videoId: string): Promise<string | null> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(5000) });
    
    if (response.ok) {
      const data = await response.json();
      return data.title || null;
    }
  } catch (err) {
    console.log('[generate-lesson-summary] oEmbed fetch failed');
  }
  return null;
}

/**
 * Generate summary using Lovable AI
 */
async function generateSummary(content: string, lessonTitle: string): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error('[generate-lesson-summary] LOVABLE_API_KEY not configured');
    return null;
  }

  const systemPrompt = `أنت مساعد تعليمي متخصص في تلخيص دروس الثانوية العامة المصرية.

مهمتك: إنشاء ملخص مختصر ومفيد للطلاب.

القواعد:
1. اكتب بالعربية الفصحى البسيطة المناسبة لطلاب الثانوية
2. استخدم نقاط مختصرة (bullet points)
3. ركز على:
   - المفاهيم الأساسية
   - التعريفات المهمة
   - الأفكار الرئيسية
4. لا تضف شروحات إضافية
5. لا تكرر المعلومات
6. لا تستخدم إيموجي أو رموز تعبيرية
7. اجعل الملخص بين 5-10 نقاط فقط
8. ابدأ مباشرة بالنقاط بدون مقدمة

مثال على التنسيق المطلوب:
• [نقطة 1]
• [نقطة 2]
• [نقطة 3]`;

  const userMessage = content 
    ? `عنوان الدرس: ${lessonTitle}\n\nمحتوى الدرس:\n${content.substring(0, 8000)}`
    : `عنوان الدرس: ${lessonTitle}\n\nلخص هذا الدرس بناءً على العنوان فقط. اذكر النقاط الأساسية المتوقعة في هذا الموضوع.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-lesson-summary] AI gateway error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;
    
    if (summary) {
      console.log('[generate-lesson-summary] Generated summary successfully');
      return summary.trim();
    }
  } catch (err) {
    console.error('[generate-lesson-summary] AI generation failed:', err);
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonId, videoUrl, lessonTitle, forceRegenerate } = await req.json();
    
    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'Lesson ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-lesson-summary] Processing lesson:', lessonId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if summary already exists (unless force regenerate)
    if (!forceRegenerate) {
      const { data: existingLesson } = await supabase
        .from('lessons')
        .select('summary_ar')
        .eq('id', lessonId)
        .single();
      
      if (existingLesson?.summary_ar) {
        console.log('[generate-lesson-summary] Summary already exists');
        return new Response(
          JSON.stringify({ summary: existingLesson.summary_ar, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let transcript: string | null = null;
    let videoTitle: string | null = null;

    // Try to get transcript from YouTube
    if (videoUrl) {
      const videoId = extractVideoId(videoUrl);
      if (videoId) {
        console.log('[generate-lesson-summary] Fetching transcript for video:', videoId);
        transcript = await fetchYouTubeTranscript(videoId);
        videoTitle = await getVideoTitle(videoId);
      }
    }

    // Generate summary
    const title = lessonTitle || videoTitle || 'درس';
    const summary = await generateSummary(transcript || '', title);

    if (!summary) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate summary', summary: null }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save summary to database
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ summary_ar: summary })
      .eq('id', lessonId);

    if (updateError) {
      console.error('[generate-lesson-summary] Failed to save summary:', updateError);
    } else {
      console.log('[generate-lesson-summary] Summary saved successfully');
    }

    return new Response(
      JSON.stringify({ summary, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate-lesson-summary] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
