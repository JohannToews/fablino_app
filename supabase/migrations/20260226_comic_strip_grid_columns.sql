-- Comic-Strip 2×(2x2) / LLM grid format: add columns for second image, panel count, and grid plan
-- comic_full_image_2: URL of the second 2x2 grid image (when 8 panels)
-- comic_panel_count: 4 or 8
-- comic_grid_plan: JSON from LLM (character_anchor, world_anchor, grid_1, grid_2) for frontend panel order/roles

ALTER TABLE stories ADD COLUMN IF NOT EXISTS comic_full_image_2 TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS comic_panel_count SMALLINT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS comic_grid_plan JSONB;

COMMENT ON COLUMN stories.comic_full_image_2 IS 'URL of second 2x2 grid image when comic has 8 panels';
COMMENT ON COLUMN stories.comic_panel_count IS 'Number of comic panels (4 or 8)';
COMMENT ON COLUMN stories.comic_grid_plan IS 'LLM image plan: character_anchor, world_anchor, grid_1, grid_2 (for cover/ending roles and order)';
