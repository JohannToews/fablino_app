import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── TypeScript Interfaces ──

export interface LevelInfo {
  id: number;
  name: string;
  emoji: string;
  stars_required: number;
  sort_order: number;
  color: string;
  unlock_feature?: string;
  icon_url?: string;
}

export interface BadgeInfo {
  id: string;
  name: string;
  emoji: string;
  category: string;
  condition_type: string;
  condition_value: number;
  bonus_stars: number;
  fablino_message: string | null;
  frame_color: string | null;
  icon_url: string | null;
  repeatable: boolean;
  sort_order: number;
  earned: boolean;
  earned_at: string | null;
  times_earned: number;
}

export interface ResultsPageData {
  child_name: string;
  total_stars: number;
  current_streak: number;
  longest_streak: number;
  weekly_stories_count: number;
  weekly_bonus_claimed: number | null;
  total_stories_read: number;
  total_perfect_quizzes: number;
  languages_read: string[];
  current_level: LevelInfo | null;
  next_level: LevelInfo | null;
  levels: LevelInfo[];
  badges: BadgeInfo[];
}

// ── Derived helpers ──

export function getEarnedBadges(badges: BadgeInfo[]): BadgeInfo[] {
  return badges.filter(b => b.earned);
}

export function getUnearnedBadges(badges: BadgeInfo[]): BadgeInfo[] {
  return badges.filter(b => !b.earned);
}

// ── Hook ──

export const useResultsPage = (childId: string | null) => {
  const [data, setData] = useState<ResultsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "get_results_page",
          { p_child_id: childId }
        );

        if (rpcError) {
          console.error("[useResultsPage] RPC error:", rpcError);
          setError(rpcError.message);
          setData(null);
        } else {
          setData(rpcData as unknown as ResultsPageData);
        }
      } catch (e: any) {
        console.error("[useResultsPage] Unexpected error:", e);
        setError(e.message || "Unknown error");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [childId]);

  return { data, loading, error };
};
