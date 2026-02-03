-- Create enum for ending types
CREATE TYPE public.ending_type AS ENUM ('A', 'B', 'C');

-- Add series-related columns to stories table
ALTER TABLE public.stories 
ADD COLUMN ending_type public.ending_type DEFAULT NULL,
ADD COLUMN series_id uuid DEFAULT NULL,
ADD COLUMN episode_number integer DEFAULT NULL;

-- Add self-referencing foreign key for series
ALTER TABLE public.stories
ADD CONSTRAINT stories_series_id_fkey 
FOREIGN KEY (series_id) REFERENCES public.stories(id) ON DELETE SET NULL;

-- Add index for series queries
CREATE INDEX idx_stories_series_id ON public.stories(series_id);

-- Comment for documentation
COMMENT ON COLUMN public.stories.ending_type IS 'A=Abgeschlossen, B=Offen, C=Cliffhanger (für Serien)';
COMMENT ON COLUMN public.stories.series_id IS 'ID der ersten Episode (Serien-Verknüpfung)';
COMMENT ON COLUMN public.stories.episode_number IS 'Episode-Nummer innerhalb einer Serie';