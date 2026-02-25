
CREATE TABLE public.word_explanation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  word text NOT NULL,
  word_language text NOT NULL,
  explanation_language text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for analytics queries
CREATE INDEX idx_word_explanation_log_kid ON public.word_explanation_log(kid_profile_id, created_at DESC);
CREATE INDEX idx_word_explanation_log_word ON public.word_explanation_log(word, word_language);

-- RLS
ALTER TABLE public.word_explanation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own children logs"
  ON public.word_explanation_log FOR SELECT
  USING (kid_profile_id IN (
    SELECT id FROM kid_profiles WHERE user_id = get_user_profile_id()
  ));

CREATE POLICY "Service can insert logs"
  ON public.word_explanation_log FOR INSERT
  WITH CHECK (true);
