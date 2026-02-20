import React, { useState, useCallback, useRef } from 'react';
import { RefreshCw, Play, CheckCircle, XCircle, Loader2, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type SyncMode = 'all' | 'missing_content' | 'visuals_only';

interface BatchResult {
  status: string;
  batch_offset: number;
  batch_size: number;
  total_lessons: number;
  processed: number;
  skipped: number;
  failed: number;
  has_more: boolean;
  next_offset: number;
  results: Array<{ lesson_id: string; action: string; success: boolean; error?: string; retried?: boolean }>;
}

const MODES: { value: SyncMode; labelAr: string; labelEn: string }[] = [
  { value: 'all', labelAr: 'مزامنة الكل', labelEn: 'Sync All' },
  { value: 'missing_content', labelAr: 'المحتوى الناقص', labelEn: 'Missing Content' },
  { value: 'visuals_only', labelAr: 'الصور البصرية فقط', labelEn: 'Visuals Only' },
];

export function SyncAssistantPanel() {
  const { isRTL } = useLanguage();
  const [mode, setMode] = useState<SyncMode>('all');
  const [running, setRunning] = useState(false);
  const [totalLessons, setTotalLessons] = useState(0);
  const [processedTotal, setProcessedTotal] = useState(0);
  const [skippedTotal, setSkippedTotal] = useState(0);
  const [failedTotal, setFailedTotal] = useState(0);
  const [retriedTotal, setRetriedTotal] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const abortRef = useRef(false);

  const BATCH_SIZE = 5;

  const runSync = useCallback(async () => {
    setRunning(true);
    setDone(false);
    setError(null);
    setProcessedTotal(0);
    setSkippedTotal(0);
    setFailedTotal(0);
    setRetriedTotal(0);
    setCurrentOffset(0);
    setTotalLessons(0);
    setStatusHint(null);
    abortRef.current = false;

    let offset = 0;

    while (!abortRef.current) {
      try {
        setStatusHint(isRTL ? 'جاري إرسال الدفعة...' : 'Sending batch...');

        const { data, error: fnError } = await supabase.functions.invoke('sync-lesson-content', {
          body: { mode, batch_size: BATCH_SIZE, offset },
        });

        if (fnError) {
          setError(fnError.message || 'Function error');
          break;
        }

        const result = data as BatchResult;

        // Count retried items
        const batchRetried = (result.results || []).filter(r => r.retried).length;

        if (result.status === 'complete' || !result.has_more) {
          setTotalLessons(result.total_lessons || totalLessons);
          setProcessedTotal(prev => prev + (result.processed || 0));
          setSkippedTotal(prev => prev + (result.skipped || 0));
          setFailedTotal(prev => prev + (result.failed || 0));
          setRetriedTotal(prev => prev + batchRetried);
          setStatusHint(null);
          setDone(true);
          break;
        }

        setTotalLessons(result.total_lessons);
        setProcessedTotal(prev => prev + result.processed);
        setSkippedTotal(prev => prev + result.skipped);
        setFailedTotal(prev => prev + result.failed);
        setRetriedTotal(prev => prev + batchRetried);
        setCurrentOffset(result.next_offset);
        offset = result.next_offset;

        // Pause between batches to avoid overloading
        setStatusHint(isRTL ? 'في انتظار فتحة AI...' : 'Waiting for AI slot...');
        await new Promise(resolve => setTimeout(resolve, 4000));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        break;
      }
    }

    setStatusHint(null);
    setRunning(false);
  }, [mode, isRTL]);

  const stopSync = useCallback(() => {
    abortRef.current = true;
  }, []);

  const progressPercent = totalLessons > 0
    ? Math.round(((processedTotal + skippedTotal) / totalLessons) * 100)
    : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">
            {isRTL ? 'مزامنة مساعد المذاكرة' : 'Sync Study Assistant'}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {isRTL ? 'المحتوى يتحدد حسب مسار الكورس (عربي / لغات)' : 'Content language is determined by course track'}
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => !running && setMode(m.value)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full border transition-colors font-medium',
              mode === m.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            )}
            disabled={running}
          >
            {isRTL ? m.labelAr : m.labelEn}
          </button>
        ))}
      </div>

      {/* Progress */}
      {(running || done) && (
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {processedTotal + skippedTotal} / {totalLessons}
            </span>
            <span>{progressPercent}%</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              {isRTL ? `تم: ${processedTotal}` : `Done: ${processedTotal}`}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              {isRTL ? `تخطي: ${skippedTotal}` : `Skipped: ${skippedTotal}`}
            </span>
            {retriedTotal > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <RotateCcw className="w-3.5 h-3.5" />
                {isRTL ? `إعادة: ${retriedTotal}` : `Retried: ${retriedTotal}`}
              </span>
            )}
            {failedTotal > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="w-3.5 h-3.5" />
                {isRTL ? `فشل: ${failedTotal}` : `Failed: ${failedTotal}`}
              </span>
            )}
          </div>

          {/* Status hint */}
          {statusHint && running && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 animate-pulse">
              <Clock className="w-3 h-3" />
              {statusHint}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {done && !error && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg p-2.5">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {isRTL ? 'اكتملت المزامنة بنجاح!' : 'Sync completed successfully!'}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!running ? (
          <Button size="sm" onClick={runSync} className="gap-1.5">
            <Play className="w-3.5 h-3.5" />
            {isRTL ? 'بدء المزامنة' : 'Start Sync'}
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={stopSync} className="gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {isRTL ? 'إيقاف' : 'Stop'}
          </Button>
        )}
      </div>
    </div>
  );
}
