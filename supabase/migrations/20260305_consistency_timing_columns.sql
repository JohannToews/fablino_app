-- Add granular timing columns for consistency check pipeline
ALTER TABLE stories ADD COLUMN IF NOT EXISTS consistency_check_only_ms integer;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS patch_ms integer;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS recheck_ms integer;

COMMENT ON COLUMN stories.consistency_check_only_ms IS 'Time spent only on LLM consistency check (excludes patch and recheck)';
COMMENT ON COLUMN stories.patch_ms IS 'Time spent on patching errors';
COMMENT ON COLUMN stories.recheck_ms IS 'Time spent on targeted re-check loops';
