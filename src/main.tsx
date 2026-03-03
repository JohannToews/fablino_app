import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

// Global safety net: log unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledRejection]', event.reason);
  try {
    supabase.from('crash_logs').insert({
      error_message: `[UnhandledRejection] ${String(event.reason?.message || event.reason).substring(0, 2000)}`,
      error_stack: event.reason?.stack?.substring(0, 4000) || null,
      url: window.location.href,
      user_agent: navigator.userAgent.substring(0, 1000),
      platform: navigator.platform || '',
      extra: { type: 'unhandledrejection' },
    }).then(() => {}, () => {});
  } catch { /* ignore */ }
});

// App entry point
createRoot(document.getElementById("root")!).render(<App />);
