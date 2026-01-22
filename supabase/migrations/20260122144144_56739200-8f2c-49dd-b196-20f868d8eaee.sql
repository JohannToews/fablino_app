-- Create table for comprehension questions
CREATE TABLE public.comprehension_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comprehension_questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read comprehension_questions" 
ON public.comprehension_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create comprehension_questions" 
ON public.comprehension_questions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update comprehension_questions" 
ON public.comprehension_questions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete comprehension_questions" 
ON public.comprehension_questions 
FOR DELETE 
USING (true);

-- Create index for faster lookups by story
CREATE INDEX idx_comprehension_questions_story_id ON public.comprehension_questions(story_id);