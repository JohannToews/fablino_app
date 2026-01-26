-- Add quiz tracking columns to marked_words
ALTER TABLE public.marked_words 
ADD COLUMN IF NOT EXISTS quiz_history text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_learned boolean DEFAULT false;

-- Create a function to update is_learned based on quiz_history
CREATE OR REPLACE FUNCTION public.update_word_learned_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the last 3 results are all 'correct'
  IF array_length(NEW.quiz_history, 1) >= 3 THEN
    -- Get the last 3 elements
    IF NEW.quiz_history[array_length(NEW.quiz_history, 1)] = 'correct' 
       AND NEW.quiz_history[array_length(NEW.quiz_history, 1) - 1] = 'correct'
       AND NEW.quiz_history[array_length(NEW.quiz_history, 1) - 2] = 'correct' THEN
      NEW.is_learned := true;
    ELSE
      NEW.is_learned := false;
    END IF;
  ELSE
    NEW.is_learned := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-update is_learned
DROP TRIGGER IF EXISTS update_marked_words_learned ON public.marked_words;
CREATE TRIGGER update_marked_words_learned
BEFORE UPDATE ON public.marked_words
FOR EACH ROW
WHEN (OLD.quiz_history IS DISTINCT FROM NEW.quiz_history)
EXECUTE FUNCTION public.update_word_learned_status();