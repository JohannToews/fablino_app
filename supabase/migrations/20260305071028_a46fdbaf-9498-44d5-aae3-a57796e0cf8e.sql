ALTER TABLE public.stories 
  ADD COLUMN IF NOT EXISTS consistency_check_only_ms integer,
  ADD COLUMN IF NOT EXISTS patch_ms integer,
  ADD COLUMN IF NOT EXISTS recheck_ms integer;