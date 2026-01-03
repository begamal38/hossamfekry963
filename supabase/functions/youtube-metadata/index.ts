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
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return Math.ceil(hours * 60 + minutes + seconds / 60);
}

/**
 * Fetch video metadata from YouTube Data API v3 (official, reliable)
 */
async function fetchFromYouTubeAPI(videoId: string): Promise<{ duration_minutes: number; title?: string } | null> {
  const apiKey = Deno.env.get('YOUTUBE_API_KEY');
  
  if (!apiKey) {
    console.log('[youtube-metadata] YOUTUBE_API_KEY not configured');
    return null;
  }
  
  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${apiKey}`;
    console.log('[youtube-metadata] Fetching from YouTube Data API...');
    
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const duration = item.contentDetails?.duration;
        const title = item.snippet?.title;
        
        if (duration) {
          const durationMinutes = parseISO8601Duration(duration);
          console.log('[youtube-metadata] Got duration from YouTube API:', durationMinutes, 'minutes');
          return { duration_minutes: durationMinutes, title };
        }
      }
    } else {
      const errorText = await response.text();
      console.error('[youtube-metadata] YouTube API error:', response.status, errorText);
    }
  } catch (err) {
    console.error('[youtube-metadata] YouTube API fetch failed:', err);
  }
  
  return null;
}

/**
 * Get video info from oEmbed (title and thumbnail, no duration)
 */
async function fetchOEmbed(videoId: string): Promise<{ title?: string; thumbnail_url?: string; author_name?: string } | null> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(5000) });
    
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        thumbnail_url: data.thumbnail_url,
        author_name: data.author_name,
      };
    }
  } catch (err) {
    console.log('[youtube-metadata] oEmbed fetch failed');
  }
  return null;
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

    // Fetch data from YouTube Data API (primary) and oEmbed (for extra info)
    const [youtubeResult, oEmbedResult] = await Promise.all([
      fetchFromYouTubeAPI(videoId),
      fetchOEmbed(videoId),
    ]);

    // Build result with best available data
    const result = {
      video_id: videoId,
      title: youtubeResult?.title || oEmbedResult?.title || null,
      thumbnail_url: oEmbedResult?.thumbnail_url || null,
      duration_minutes: youtubeResult?.duration_minutes || 60,
      author_name: oEmbedResult?.author_name || null,
    };

    console.log('[youtube-metadata] Final result:', JSON.stringify(result));
    
    return new Response(
      JSON.stringify(result),
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
