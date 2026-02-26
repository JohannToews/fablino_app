
-- Add dedicated column for user's free-text input
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS user_prompt_text text;

-- Backfill from prompt field: extract text after "Zusätzliche Wünsche: "
UPDATE public.stories
SET user_prompt_text = substring(prompt FROM 'Zusätzliche Wünsche: (.+)$')
WHERE prompt LIKE '%Zusätzliche Wünsche: %'
  AND user_prompt_text IS NULL;
