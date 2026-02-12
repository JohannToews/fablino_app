
-- Add series context columns to stories table (used by Phase 2 series logic)
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS episode_summary text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS continuity_state jsonb;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS visual_style_sheet jsonb;
