-- Comic-Strip: Add columns for comic layout key and full comic image URL
-- comic_layout_key: stores which layout was used (e.g. 'layout_1_2x2')
-- comic_full_image: URL to the full (uncropped) comic strip image

ALTER TABLE stories ADD COLUMN IF NOT EXISTS comic_layout_key TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS comic_full_image TEXT;
