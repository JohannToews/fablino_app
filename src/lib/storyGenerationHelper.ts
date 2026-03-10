import { supabase } from "@/integrations/supabase/client";

type TerminalStatus = 'verified' | 'images_partial' | 'images_failed';

/**
 * Waits for a story's generation_status to reach a terminal state
 * via Realtime subscription. Resolves on success, rejects on failure/timeout.
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
      supabase.removeChannel(channel);
      clearTimeout(timer);
      if (action === 'resolve') resolve(value);
      else reject(value);
    };

    const checkStatus = (status: string | null | undefined) => {
      if (!status) return;
      if (['verified', 'images_partial', 'images_failed'].includes(status)) {
        settle('resolve', status as TerminalStatus);
      } else if (['text_failed', 'failed'].includes(status)) {
        settle('reject', new Error('Story generation failed'));
      }
    };

    // Check current status first (might already be done)
    supabase
      .from('stories')
      .select('generation_status')
      .eq('id', storyId)
      .single()
      .then(({ data }) => {
        checkStatus(data?.generation_status);
      });

    // Subscribe to updates
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

    // Timeout
    const timer = setTimeout(() => {
      settle('reject', new Error('Story generation timed out'));
    }, timeoutMs);
  });
}
