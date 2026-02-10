-- Drop the broken text-parameter overload of log_activity
DROP FUNCTION IF EXISTS public.log_activity(text, text, jsonb, integer);
