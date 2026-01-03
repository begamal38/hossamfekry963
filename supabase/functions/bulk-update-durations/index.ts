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

async function fetchDurationFromYT(videoId: string): Promise<number | null> {
  // Try scraping YouTube with different patterns
  try {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[bulk-update] Fetching: ${pageUrl}`);
    
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Pattern 1: lengthSeconds in ytInitialPlayerResponse
      let match = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
      if (match) {
        const seconds = parseInt(match[1], 10);
        console.log(`[bulk-update] Found lengthSeconds: ${seconds}s = ${Math.ceil(seconds/60)}min`);
        return Math.ceil(seconds / 60);
      }
      
      // Pattern 2: approxDurationMs
      match = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
      if (match) {
        const ms = parseInt(match[1], 10);
        console.log(`[bulk-update] Found approxDurationMs: ${ms}ms = ${Math.ceil(ms/60000)}min`);
        return Math.ceil(ms / 60000);
      }
      
      // Pattern 3: duration in microformat
      match = html.match(/"duration"\s*:\s*"PT(\d+)M(\d+)?S?"/);
      if (match) {
        const mins = parseInt(match[1] || '0', 10);
        const secs = parseInt(match[2] || '0', 10);
        console.log(`[bulk-update] Found ISO duration: ${mins}m ${secs}s`);
        return mins + (secs > 0 ? 1 : 0);
      }
      
      // Pattern 4: videoDuration
      match = html.match(/videoDuration['":\s]+(\d+)/);
      if (match) {
        const seconds = parseInt(match[1], 10);
        console.log(`[bulk-update] Found videoDuration: ${seconds}s`);
        return Math.ceil(seconds / 60);
      }
      
      console.log(`[bulk-update] No duration pattern found in HTML (length: ${html.length})`);
    } else {
      console.log(`[bulk-update] YouTube returned status: ${response.status}`);
    }
  } catch (err) {
    console.log(`[bulk-update] Fetch error: ${err}`);
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      
      const duration = await fetchDurationFromYT(videoId);
      
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
