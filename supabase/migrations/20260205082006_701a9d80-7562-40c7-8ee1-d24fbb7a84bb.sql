-- Create shared_stories table for QR code sharing
CREATE TABLE public.shared_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  retrieved_count INTEGER NOT NULL DEFAULT 0
);

-- Create index for fast token lookups
CREATE INDEX idx_shared_stories_token ON public.shared_stories(share_token);

-- Create index for cleanup of expired shares
CREATE INDEX idx_shared_stories_expires_at ON public.shared_stories(expires_at);

-- Enable Row Level Security
ALTER TABLE public.shared_stories ENABLE ROW LEVEL SECURITY;

-- Anyone can read shared_stories (needed for public share retrieval)
CREATE POLICY "Anyone can read shared_stories"
ON public.shared_stories
FOR SELECT
USING (true);

-- Anyone can create shared_stories (auth checked in edge function)
CREATE POLICY "Anyone can create shared_stories"
ON public.shared_stories
FOR INSERT
WITH CHECK (true);

-- Anyone can update shared_stories (for retrieved_count increment)
CREATE POLICY "Anyone can update shared_stories"
ON public.shared_stories
FOR UPDATE
USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.shared_stories IS 'Stores temporary share tokens for QR code story sharing. Tokens expire after 24 hours.';