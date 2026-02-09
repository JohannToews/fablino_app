
-- Fun facts table for story generation loading screen
CREATE TABLE public.fun_facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💡',
  translations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Public read access (no auth needed for fun facts)
ALTER TABLE public.fun_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fun facts are readable by everyone"
ON public.fun_facts FOR SELECT USING (true);

-- Index for category filtering
CREATE INDEX idx_fun_facts_category ON public.fun_facts(category);
