import { supabase } from "@/integrations/supabase/client";

type TerminalStatus = 'verified' | 'images_partial' | 'images_failed';
const TERMINAL_SUCCESS: string[] = ['verified', 'images_partial', 'images_failed'];
const TERMINAL_FAIL: string[] = ['text_failed', 'failed'];
const POLL_INTERVAL_MS = 5_000; // poll every 5 seconds as fallback

/**
 * Waits for a story's generation_status to reach a terminal state
 * via Realtime subscription + periodic polling fallback.
 * Resolves on success, rejects on failure/timeout.
 */
export function waitForStoryCompletion(
  storyId: string,
  timeoutMs: number = 300_000, // 5 minutes
): Promise<TerminalStatus> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const settle = (action: 'resolve' | 'reject', value: any) => {
      if (settled) return;
      settled = true;
      try { supabase.removeChannel(channel); } catch {}
      clearTimeout(timer);
      clearInterval(pollTimer);
      if (action === 'resolve') resolve(value);
      else reject(value);
    };

    const checkStatus = (status: string | null | undefined) => {
      if (!status) return;
      if (TERMINAL_SUCCESS.includes(status)) {
        settle('resolve', status as TerminalStatus);
      } else if (TERMINAL_FAIL.includes(status)) {
        settle('reject', new Error('Story generation failed'));
      }
    };

    // Helper: poll DB directly
    const pollDb = async () => {
      if (settled) return;
      try {
        const { data } = await supabase
          .from('stories')
          .select('generation_status')
          .eq('id', storyId)
          .single();
        checkStatus(data?.generation_status);
      } catch (e) {
        console.warn('[waitForStoryCompletion] poll error:', e);
      }
    };

    // 1. Check current status immediately (might already be done)
    pollDb();

    // 2. Subscribe to Realtime updates
    const channel = supabase
      .channel(`story-completion-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`,
        },
        (payload: any) => {
          checkStatus(payload.new?.generation_status);
        }
      )
      .subscribe();

    // 3. Polling fallback — catches cases where Realtime is blocked/delayed
    const pollTimer = setInterval(pollDb, POLL_INTERVAL_MS);

    // 4. Timeout
    const timer = setTimeout(() => {
      settle('reject', new Error('Story generation timed out'));
    }, timeoutMs);
  });
}
