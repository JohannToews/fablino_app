-- Create level_settings table for configurable levels
CREATE TABLE public.level_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.level_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read level_settings" 
ON public.level_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update level_settings" 
ON public.level_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can insert level_settings" 
ON public.level_settings 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_level_settings_updated_at
BEFORE UPDATE ON public.level_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default levels
INSERT INTO public.level_settings (level_number, title, min_points) VALUES
  (1, 'Débutant', 0),
  (2, 'Intermédiaire', 50),
  (3, 'Avancé', 100),
  (4, 'Expert', 200),
  (5, 'Champion', 350),
  (6, 'Maître', 500);