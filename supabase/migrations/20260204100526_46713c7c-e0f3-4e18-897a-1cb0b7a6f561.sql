-- Neue Status-Spalten für Stories (für Background Processing)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'generating' 
  CHECK (generation_status IN ('generating', 'checking', 'verified', 'error'));

ALTER TABLE stories ADD COLUMN IF NOT EXISTS cover_image_status TEXT DEFAULT 'pending'
  CHECK (cover_image_status IN ('pending', 'generating', 'complete', 'error'));

ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_images_status TEXT DEFAULT 'pending'
  CHECK (story_images_status IN ('pending', 'generating', 'complete', 'error'));

-- Für Analytics/Debugging
ALTER TABLE stories ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER;

-- Index für schnelle Queries nach Status
CREATE INDEX IF NOT EXISTS idx_stories_generation_status ON stories(generation_status);

-- Bild-Cache: Gleicher Prompt → gleiches Bild wiederverwenden
CREATE TABLE IF NOT EXISTS image_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash TEXT UNIQUE NOT NULL,
  prompt_text TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_image_cache_hash ON image_cache(prompt_hash);

-- RLS für image_cache
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read image_cache" ON image_cache FOR SELECT USING (true);
CREATE POLICY "Anyone can insert image_cache" ON image_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update image_cache" ON image_cache FOR UPDATE USING (true);

-- Realtime für stories Tabelle aktivieren (für Live-Updates)
ALTER PUBLICATION supabase_realtime ADD TABLE stories;