import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractVideoId(input: string): string | null {
  if (!input) return null;
  
  const patterns = [
    /youtube\.com\/embed\/([^\"&?\s\/]+)/,
    /youtube\.com\/watch\?v=([^&?\s]+)/,
    /youtu\.be\/([^&?\s\/]+)/,
    /youtube\.com\/shorts\/([^&?\s\/]+)/,
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
 * Fetch duration from YouTube Data API v3 (official, reliable)
 */
async function fetchDurationFromYT(videoId: string, apiKey: string): Promise<number | null> {
  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const duration = data.items[0].contentDetails?.duration;
        if (duration) {
          const minutes = parseISO8601Duration(duration);
          console.log(`[bulk-update] Got duration for ${videoId}: ${minutes} min`);
          return minutes;
        }
      }
    } else {
      const errorText = await response.text();
      console.error('[bulk-update] YouTube API error:', response.status, errorText);
    }
  } catch (err) {
    console.error('[bulk-update] YouTube API fetch failed:', err);
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'YOUTUBE_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all lessons with video URLs
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title_ar, video_url, duration_minutes')
      .not('video_url', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch lessons: ${fetchError.message}`);
    }

    console.log(`[bulk-update] Found ${lessons?.length || 0} lessons with videos`);

    const results: { id: string; title: string; old: number; new: number; status: string }[] = [];
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const lesson of lessons || []) {
      const videoId = extractVideoId(lesson.video_url);
      
      if (!videoId) {
        results.push({ 
          id: lesson.id, 
          title: lesson.title_ar, 
          old: lesson.duration_minutes || 60, 
          new: lesson.duration_minutes || 60, 
          status: 'invalid_url' 
        });
        skipped++;
        continue;
      }

      console.log(`[bulk-update] Processing: ${lesson.title_ar} (${videoId})`);
      
      const duration = await fetchDurationFromYT(videoId, apiKey);
      
      if (duration && duration !== lesson.duration_minutes) {
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ duration_minutes: duration })
          .eq('id', lesson.id);
        
        if (updateError) {
          console.log(`[bulk-update] Update error: ${updateError.message}`);
          results.push({ 
            id: lesson.id, 
            title: lesson.title_ar, 
            old: lesson.duration_minutes || 60, 
            new: lesson.duration_minutes || 60, 
            status: 'update_failed' 
          });
          failed++;
        } else {
          console.log(`[bulk-update] Updated ${lesson.title_ar}: ${lesson.duration_minutes} -> ${duration}`);
          results.push({ 
            id: lesson.id, 
            title: lesson.title_ar, 
            old: lesson.duration_minutes || 60, 
            new: duration, 
            status: 'updated' 
          });
          updated++;
        }
      } else if (duration) {
        results.push({ 
          id: lesson.id, 
          title: lesson.title_ar, 
          old: lesson.duration_minutes || 60, 
          new: duration, 
          status: 'unchanged' 
        });
        skipped++;
      } else {
        results.push({ 
          id: lesson.id, 
          title: lesson.title_ar, 
          old: lesson.duration_minutes || 60, 
          new: lesson.duration_minutes || 60, 
          status: 'fetch_failed' 
        });
        failed++;
      }

      // Delay between requests
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`[bulk-update] Complete: ${updated} updated, ${skipped} skipped, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: { total: lessons?.length || 0, updated, skipped, failed },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[bulk-update] Error:', errMsg);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
