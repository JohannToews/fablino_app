
-- Create image_generation_config table
CREATE TABLE public.image_generation_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_generation_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "image_generation_config_select" ON public.image_generation_config
  FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "image_generation_config_update" ON public.image_generation_config
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert
CREATE POLICY "image_generation_config_insert" ON public.image_generation_config
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default rows
INSERT INTO public.image_generation_config (config_key, config_value) VALUES
  ('imagen_models', '{"cover": {"model": "imagen-4.0-generate-001", "label": "Standard", "cost_per_image": 0.04}, "scene": {"model": "imagen-4.0-fast-generate-001", "label": "Fast", "cost_per_image": 0.02}}'::jsonb),
  ('generation_limits', '{"max_images_per_story": 4, "max_stories_per_day_free": 2, "max_stories_per_day_premium": 10}'::jsonb);
