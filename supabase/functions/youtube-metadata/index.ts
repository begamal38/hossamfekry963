import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple Invidious instances for fallback
const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.snopyta.org',
  'https://yewtu.be',
  'https://invidious.kavin.rocks',
  'https://inv.riverside.rocks',
];

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
 * Try to get video info from Invidious API (provides duration directly)
 */
async function fetchFromInvidious(videoId: string): Promise<{ duration_minutes: number; title?: string } | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const apiUrl = `${instance}/api/v1/videos/${videoId}?fields=lengthSeconds,title`;
      console.log('[youtube-metadata] Trying Invidious instance:', instance);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout per instance
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.lengthSeconds) {
          const durationMinutes = Math.ceil(data.lengthSeconds / 60);
          console.log('[youtube-metadata] Got duration from Invidious:', durationMinutes, 'minutes');
          return {
            duration_minutes: durationMinutes,
            title: data.title,
          };
        }
      }
    } catch (err) {
      console.log('[youtube-metadata] Invidious instance failed:', instance);
    }
  }
  return null;
}

/**
 * Try to scrape duration from YouTube page directly
 */
async function scrapeYouTubePage(videoId: string): Promise<number | null> {
  try {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('[youtube-metadata] Scraping YouTube page...');
    
    const pageResponse = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000),
    });
    
    if (pageResponse.ok) {
      const pageHtml = await pageResponse.text();
      
      // Try multiple patterns to find duration
      // Pattern 1: "lengthSeconds":"XXX"
      const lengthMatch = pageHtml.match(/"lengthSeconds"\s*:\s*"?(\d+)"?/);
      if (lengthMatch) {
        const seconds = parseInt(lengthMatch[1], 10);
        const minutes = Math.ceil(seconds / 60);
        console.log('[youtube-metadata] Scraped duration (lengthSeconds):', minutes, 'minutes');
        return minutes;
      }
      
      // Pattern 2: approxDurationMs
      const durationMsMatch = pageHtml.match(/"approxDurationMs"\s*:\s*"?(\d+)"?/);
      if (durationMsMatch) {
        const ms = parseInt(durationMsMatch[1], 10);
        const minutes = Math.ceil(ms / 60000);
        console.log('[youtube-metadata] Scraped duration (approxDurationMs):', minutes, 'minutes');
        return minutes;
      }
      
      // Pattern 3: duration in ISO 8601 format (PT1H2M3S)
      const isoMatch = pageHtml.match(/"duration"\s*:\s*"PT(\d+H)?(\d+M)?(\d+S)?"/);
      if (isoMatch) {
        const hours = isoMatch[1] ? parseInt(isoMatch[1], 10) : 0;
        const mins = isoMatch[2] ? parseInt(isoMatch[2], 10) : 0;
        const secs = isoMatch[3] ? parseInt(isoMatch[3], 10) : 0;
        const minutes = Math.ceil(hours * 60 + mins + secs / 60);
        console.log('[youtube-metadata] Scraped duration (ISO):', minutes, 'minutes');
        return minutes;
      }
      
      console.log('[youtube-metadata] Could not find duration in page HTML');
    }
  } catch (err) {
    console.log('[youtube-metadata] YouTube page scraping failed');
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

    // Fetch data from multiple sources in parallel for speed
    const [invidiousResult, oEmbedResult, scrapedDuration] = await Promise.all([
      fetchFromInvidious(videoId),
      fetchOEmbed(videoId),
      scrapeYouTubePage(videoId),
    ]);

    // Build result with best available data
    const result = {
      video_id: videoId,
      title: invidiousResult?.title || oEmbedResult?.title || null,
      thumbnail_url: oEmbedResult?.thumbnail_url || null,
      duration_minutes: invidiousResult?.duration_minutes || scrapedDuration || 60,
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
