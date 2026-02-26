-- Inspiration prompts: anonymized 5-star user prompts for story wizard inspiration
create table inspiration_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_story_id UUID REFERENCES stories(id),  -- internal reference, never exposed
  language TEXT NOT NULL,                         -- ISO 639-1: de, fr, en, es, nl, it, bs
  teaser TEXT NOT NULL,                            -- short version ~50 chars, for placeholder rotation
  full_prompt TEXT NOT NULL,                       -- full anonymized prompt, for bottom sheet
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,            -- for manual moderation
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for frontend queries
CREATE INDEX idx_inspiration_prompts_active_lang ON inspiration_prompts(active, language, batch_date DESC);

-- RLS: all authenticated users can read active prompts
ALTER TABLE inspiration_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active inspiration prompts"
  ON inspiration_prompts FOR SELECT
  USING (active = true);

-- Only service_role can insert/update (Edge Function)
CREATE POLICY "Service role can manage inspiration prompts"
  ON inspiration_prompts FOR ALL
  USING (auth.role() = 'service_role');
