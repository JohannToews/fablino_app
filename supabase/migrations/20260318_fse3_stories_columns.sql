-- Migration 4: FSE3 Stories Columns + Generation Status Extension
-- Adds new JSONB columns to stories table and extends generation_status CHECK constraint.

-- New columns for FSE3 pipeline data
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS fse3_interpreter_result JSONB,
  ADD COLUMN IF NOT EXISTS fse3_chosen_variant JSONB,
  ADD COLUMN IF NOT EXISTS fse3_pass_timing JSONB;

-- Extend generation_status CHECK constraint with FSE3 values
-- Drop existing constraint (name may vary across environments)
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_generation_status_check;

-- Re-create with all existing + new FSE3 values
ALTER TABLE stories ADD CONSTRAINT stories_generation_status_check
  CHECK (generation_status IN (
    -- Existing FSE1/FSE2 values
    'generating', 'checking', 'verified', 'error',
    'text_complete', 'images_complete', 'text_failed', 'images_failed',
    -- New FSE3 values
    'interpreter_pending', 'interpreter_done', 'variant_chosen'
  ));
