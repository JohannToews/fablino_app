import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Whether the current user has Avatar Builder (Mein Look) enabled (feature flag).
 * Reads directly from app_settings + checks user_profiles for the current user.
 */
export function useAvatarBuilderEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. Read the flag value from app_settings
        const { data: row } = await (supabase as any)
          .from("app_settings")
          .select("value")
          .eq("key", "avatar_builder_enabled_users")
          .maybeSingle();

        if (cancelled || !row?.value) return;

        let ids: string[] = [];
        try { ids = JSON.parse(row.value); } catch { ids = []; }
        if (!Array.isArray(ids)) ids = [];

        // Global wildcard
        if (ids.includes("*")) {
          setEnabled(true);
          return;
        }

        // 2. Get current user's profile id
        // Try Supabase Auth first
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
            return;
          }
        }

        // Try legacy auth
        const legacyUserJson = sessionStorage.getItem('liremagie_user') || localStorage.getItem('liremagie_user');
        if (legacyUserJson) {
          try {
            const legacyUser = JSON.parse(legacyUserJson);
            if (legacyUser?.id && ids.includes(legacyUser.id)) {
              if (!cancelled) setEnabled(true);
              return;
            }
          } catch { /* ignore */ }
        }
      } catch (err) {
        console.warn("[useAvatarBuilderEnabled] Error:", err);
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return enabled;
}
