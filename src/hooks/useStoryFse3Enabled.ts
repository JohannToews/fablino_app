import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Whether the current user has FSE3 (Story Engine 3) enabled.
 *
 * Reads `fse3_enabled_users` from app_settings:
 *   []          → nobody (default)
 *   ["uuid-1"]  → specific users
 *   ["*"]       → everyone
 *
 * Fail-safe: returns false on any error.
 */
export function useStoryFse3Enabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "fse3_enabled_users")
          .single();

        if (cancelled) return;
        if (error || !data?.value) {
          setEnabled(false);
          return;
        }

        let enabledUsers: string[];
        try {
          enabledUsers = JSON.parse(data.value as string);
        } catch {
          setEnabled(false);
          return;
        }

        if (!Array.isArray(enabledUsers)) {
          setEnabled(false);
          return;
        }

        setEnabled(enabledUsers.includes("*") || enabledUsers.includes(user.id));
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  return enabled;
}
