import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Hardcoded fallback if rate_limits_config can't be loaded
/**
 * Daily story limit is currently DISABLED.
 * Users can create unlimited stories per day.
 * To re-enable, restore the previous DB-based logic.
 */
export function useDailyStoryLimit(_kidProfileId: string | undefined) {
  return {
    storiesCreatedToday: 0,
    remaining: Infinity,
    limit: Infinity,
    limitReached: false,
    loading: false,
    refresh: () => Promise.resolve(),
  };
}
