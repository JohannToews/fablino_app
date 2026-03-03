
CREATE TABLE public.crash_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT,
  error_stack TEXT,
  component_stack TEXT,
  url TEXT,
  user_agent TEXT,
  platform TEXT,
  user_id TEXT,
  kid_profile_id TEXT,
  extra JSONB
);

-- Allow anonymous inserts (crash can happen before auth)
ALTER TABLE public.crash_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert crash logs"
  ON public.crash_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read crash logs"
  ON public.crash_logs FOR SELECT
  TO authenticated
  USING (true);
