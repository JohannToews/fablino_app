-- Performance: composite index for story completion lookups
-- Covers the common query: WHERE user_id = X AND activity_type = 'story_completed' AND reference_id IN (...)
CREATE INDEX IF NOT EXISTS idx_user_results_completion_lookup
  ON user_results (user_id, activity_type, reference_id);
