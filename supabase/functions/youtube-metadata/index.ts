import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
 * Parse ISO 8601 duration (PT1H2M3S) to minutes
 */
function parseDuration(duration: string): number {
  if (!duration) return 60; // Default fallback
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 60;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  // Calculate total minutes, rounding up if there are remaining seconds
  const totalMinutes = hours * 60 + minutes + (seconds > 0 ? 1 : 0);
  
  return totalMinutes || 60; // Minimum 1 minute, default 60 if parsing fails
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    
    if (!videoUrl) {
      console.log('[youtube-metadata] No video URL provided');
      return new Response(
        JSON.stringify({ error: 'No video URL provided', duration_minutes: 60 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[youtube-metadata] Processing URL:', videoUrl);
    
    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      console.log('[youtube-metadata] Could not extract video ID from:', videoUrl);
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL', duration_minutes: 60 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[youtube-metadata] Extracted video ID:', videoId);

    // Try oEmbed first (no API key required)
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      console.log('[youtube-metadata] Fetching oEmbed data');
      
      const oEmbedResponse = await fetch(oEmbedUrl);
      
      if (oEmbedResponse.ok) {
        const oEmbedData = await oEmbedResponse.json();
        console.log('[youtube-metadata] oEmbed data received:', oEmbedData.title);
        
        // oEmbed doesn't provide duration, so we'll try to get it from the page
        // For now, return default duration with video info
        const result = {
          video_id: videoId,
          title: oEmbedData.title || null,
          thumbnail_url: oEmbedData.thumbnail_url || null,
          duration_minutes: 60, // Default - oEmbed doesn't provide duration
          author_name: oEmbedData.author_name || null,
        };

        // Try to fetch actual duration from YouTube page (scraping fallback)
        try {
          const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
          const pageResponse = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (pageResponse.ok) {
            const pageHtml = await pageResponse.text();
            
            // Try to find duration in the page
            // Look for "lengthSeconds":"XXX" pattern
            const lengthMatch = pageHtml.match(/"lengthSeconds":"(\d+)"/);
            if (lengthMatch) {
              const seconds = parseInt(lengthMatch[1], 10);
              result.duration_minutes = Math.ceil(seconds / 60);
              console.log('[youtube-metadata] Extracted duration from page:', result.duration_minutes, 'minutes');
            }
            
            // Alternative: look for approxDurationMs
            if (!lengthMatch) {
              const durationMsMatch = pageHtml.match(/"approxDurationMs":"(\d+)"/);
              if (durationMsMatch) {
                const ms = parseInt(durationMsMatch[1], 10);
                result.duration_minutes = Math.ceil(ms / 60000);
                console.log('[youtube-metadata] Extracted duration from approxDurationMs:', result.duration_minutes, 'minutes');
              }
            }
          }
        } catch (scrapeError: unknown) {
          const errMsg = scrapeError instanceof Error ? scrapeError.message : 'Unknown error';
          console.log('[youtube-metadata] Page scraping failed, using default duration:', errMsg);
        }

        console.log('[youtube-metadata] Final result:', result);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (oEmbedError: unknown) {
      const errMsg = oEmbedError instanceof Error ? oEmbedError.message : 'Unknown error';
      console.log('[youtube-metadata] oEmbed fetch failed:', errMsg);
    }

    // Fallback response
    console.log('[youtube-metadata] Using fallback response with default duration');
    return new Response(
      JSON.stringify({
        video_id: videoId,
        duration_minutes: 60,
        error: 'Could not fetch video metadata'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[youtube-metadata] Error:', errMsg);
    return new Response(
      JSON.stringify({ error: errMsg, duration_minutes: 60 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
