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
}

export interface BadgeInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  earned_at: string;
  is_new: boolean;
}

export interface BadgeHint {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  condition_type: string;
  condition_value: number;
  sort_order: number;
  current_progress: number;
}

export interface ResultsPageData {
  child_name: string;
  total_stars: number;
  current_streak: number;
  longest_streak: number;
  levels: LevelInfo[];
  earned_badges: BadgeInfo[];
  next_badge_hints: BadgeHint[];
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
