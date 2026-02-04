import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type GenerationStatus = 'generating' | 'checking' | 'verified' | 'error';
type ImageStatus = 'pending' | 'generating' | 'complete' | 'error';

interface RealtimeStory {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  story_images: string[] | null;
  generation_status: GenerationStatus;
  cover_image_status: ImageStatus;
  story_images_status: ImageStatus;
  generation_time_ms: number | null;
}

interface UseStoryRealtimeResult {
  story: RealtimeStory | null;
  isFullyLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to subscribe to real-time updates for a story.
 * Useful for progressive loading of images while story text is shown immediately.
 */
export function useStoryRealtime(storyId: string | null): UseStoryRealtimeResult {
  const [story, setStory] = useState<RealtimeStory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFullyLoaded = story 
    ? story.generation_status === 'verified' &&
      story.cover_image_status === 'complete' &&
      story.story_images_status === 'complete'
    : false;

  useEffect(() => {
    if (!storyId) {
      setStory(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Initial fetch
    const fetchStory = async () => {
      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('id, title, content, cover_image_url, story_images, generation_status, cover_image_status, story_images_status, generation_time_ms')
        .eq('id', storyId)
        .single();

      if (fetchError) {
        console.error('Error fetching story:', fetchError);
        setError(fetchError.message);
      } else if (data) {
        setStory(data as RealtimeStory);
      }
      setIsLoading(false);
    };

    fetchStory();

    // Set up realtime subscription
    const channel = supabase
      .channel(`story-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`
        },
        (payload) => {
          console.log('Story updated via realtime:', payload.new);
          setStory(payload.new as RealtimeStory);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId]);

  return { story, isFullyLoaded, isLoading, error };
}

/**
 * Hook to subscribe to multiple stories for a list view.
 * Updates stories as their images become available.
 */
export function useStoriesRealtime(storyIds: string[]): Map<string, RealtimeStory> {
  const [stories, setStories] = useState<Map<string, RealtimeStory>>(new Map());

  useEffect(() => {
    if (storyIds.length === 0) {
      setStories(new Map());
      return;
    }

    // Initial fetch for all stories
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, content, cover_image_url, story_images, generation_status, cover_image_status, story_images_status, generation_time_ms')
        .in('id', storyIds);

      if (data) {
        const newMap = new Map<string, RealtimeStory>();
        data.forEach((s) => newMap.set(s.id, s as RealtimeStory));
        setStories(newMap);
      }
    };

    fetchStories();

    // Set up realtime subscription for all stories
    const channel = supabase
      .channel('stories-list')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories'
        },
        (payload) => {
          const updated = payload.new as RealtimeStory;
          if (storyIds.includes(updated.id)) {
            setStories((prev) => {
              const newMap = new Map(prev);
              newMap.set(updated.id, updated);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyIds.join(',')]);

  return stories;
}
