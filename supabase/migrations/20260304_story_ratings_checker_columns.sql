-- Extend stories with granular consistency-checker metrics.
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS checker_critical      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checker_medium        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checker_low           INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checker_subcategories TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS was_regenerated       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS regenerate_count      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS patch_fix_rate        NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS critical_patch_failed BOOLEAN DEFAULT false;

-- Widen structure_beginning / structure_ending from CHECK 1-5 to 1-6
-- so A6 and E6 values are valid. (structure_middle was already widened
-- to 1-6 in migration 20260207200033.)
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_structure_beginning_check;
ALTER TABLE public.stories
  ADD CONSTRAINT stories_structure_beginning_check
  CHECK (structure_beginning >= 1 AND structure_beginning <= 6);

ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_structure_ending_check;
ALTER TABLE public.stories
  ADD CONSTRAINT stories_structure_ending_check
  CHECK (structure_ending >= 1 AND structure_ending <= 6);

-- Update column comments to reflect classification types, not ratings.
COMMENT ON COLUMN public.stories.structure_beginning IS 'Story beginning classification type (A1-A6)';
COMMENT ON COLUMN public.stories.structure_middle    IS 'Story middle classification type (M1-M6)';
COMMENT ON COLUMN public.stories.structure_ending    IS 'Story ending classification type (E1-E6)';
