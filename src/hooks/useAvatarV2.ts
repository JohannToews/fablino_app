import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Whether the current user has Avatar v2 enabled (feature flag).
 * Reads from app_settings key "avatar_v2_enabled_users".
 */
export function useAvatarV2(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: row } = await (supabase as any)
          .from("app_settings")
          .select("value")
          .eq("key", "avatar_v2_enabled_users")
          .maybeSingle();

        if (cancelled || !row?.value) return;

        let ids: string[] = [];
        try { ids = JSON.parse(row.value); } catch { ids = []; }
        if (!Array.isArray(ids)) ids = [];

        if (ids.includes("*")) { setEnabled(true); return; }

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (cancelled) return;

        if (authUser?.id) {
          const { data: profile } = await (supabase as any)
            .from("user_profiles")
            .select("id")
            .eq("auth_id", authUser.id)
            .maybeSingle();
          if (!cancelled && profile && ids.includes(profile.id)) {
            setEnabled(true);
          }
        }
      } catch (err) {
        console.warn("[useAvatarV2] Error:", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return enabled;
}
