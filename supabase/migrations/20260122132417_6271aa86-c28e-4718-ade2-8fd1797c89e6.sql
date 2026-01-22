-- Stories table for reading exercises
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marked words table for vocabulary
CREATE TABLE public.marked_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- App settings for API key storage
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access (no auth for MVP)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marked_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for stories (admin will manage)
CREATE POLICY "Anyone can read stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Anyone can create stories" ON public.stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stories" ON public.stories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete stories" ON public.stories FOR DELETE USING (true);

-- Public policies for marked words
CREATE POLICY "Anyone can read marked_words" ON public.marked_words FOR SELECT USING (true);
CREATE POLICY "Anyone can create marked_words" ON public.marked_words FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update marked_words" ON public.marked_words FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete marked_words" ON public.marked_words FOR DELETE USING (true);

-- Public policies for app_settings
CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can create app_settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update app_settings" ON public.app_settings FOR UPDATE USING (true);

-- Create storage bucket for cover images
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);

-- Storage policies for cover images
CREATE POLICY "Anyone can view covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Anyone can upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers');
CREATE POLICY "Anyone can update covers" ON storage.objects FOR UPDATE USING (bucket_id = 'covers');
CREATE POLICY "Anyone can delete covers" ON storage.objects FOR DELETE USING (bucket_id = 'covers');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();