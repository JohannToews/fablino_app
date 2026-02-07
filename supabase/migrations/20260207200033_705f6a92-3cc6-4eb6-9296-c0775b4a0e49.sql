-- Drop the old constraint and add new one allowing 1-6 for structure_middle
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_structure_middle_check;
ALTER TABLE public.stories ADD CONSTRAINT stories_structure_middle_check CHECK (structure_middle >= 1 AND structure_middle <= 6);