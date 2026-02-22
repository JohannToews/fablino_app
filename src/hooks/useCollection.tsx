import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";
import { getTranslations, Language } from "@/lib/translations";

export type CollectibleCategory = 'creature' | 'place' | 'object' | 'star';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CollectedItem {
  id: string;
  category: CollectibleCategory;
  item_name: string;
  item_emoji: string;
  item_description: string | null;
  rarity: Rarity;
  story_id: string | null;
  collected_at: string;
}

export interface CollectiblePoolItem {
  id: string;
  category: CollectibleCategory;
  item_name: string;
  item_emoji: string;
  item_description: string | null;
  rarity: Rarity;
  keywords: string[];
}

export interface CollectionStats {
  total: number;
  byCategory: Record<CollectibleCategory, number>;
  byRarity: Record<Rarity, number>;
}

const categoryTranslations: Record<string, Record<CollectibleCategory, string>> = {
  de: { creature: 'Magische Wesen', place: 'Orte', object: 'Gegenstände', star: 'Sterne' },
  fr: { creature: 'Créatures magiques', place: 'Lieux', object: 'Objets', star: 'Étoiles' },
  en: { creature: 'Magical Creatures', place: 'Places', object: 'Objects', star: 'Stars' },
  es: { creature: 'Criaturas mágicas', place: 'Lugares', object: 'Objetos', star: 'Estrellas' },
  nl: { creature: 'Magische wezens', place: 'Plaatsen', object: 'Voorwerpen', star: 'Sterren' },
  bs: { creature: 'Magična bića', place: 'Mjesta', object: 'Predmeti', star: 'Zvijezde' },
  it: { creature: 'Creature magiche', place: 'Luoghi', object: 'Oggetti', star: 'Stelle' }
};

const rarityColors: Record<Rarity, string> = {
  common: 'bg-muted border-muted-foreground/30',
  rare: 'bg-blue-500/10 border-blue-500/50',
  epic: 'bg-purple-500/10 border-purple-500/50',
  legendary: 'bg-amber-500/10 border-amber-500/50'
};

const rarityGlows: Record<Rarity, string> = {
  common: '',
  rare: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]',
  epic: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
  legendary: 'shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
};

export const useCollection = () => {
  const { user } = useAuth();
  const { selectedProfileId, kidAppLanguage } = useKidProfile();
  const [items, setItems] = useState<CollectedItem[]>([]);
  const [pool, setPool] = useState<CollectiblePoolItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CollectionStats>({
    total: 0,
    byCategory: { creature: 0, place: 0, object: 0, star: 0 },
    byRarity: { common: 0, rare: 0, epic: 0, legendary: 0 }
  });

  // Get translated category name
  const getCategoryName = useCallback((category: CollectibleCategory): string => {
    const translations = categoryTranslations[kidAppLanguage] || categoryTranslations.de;
    return translations[category];
  }, [kidAppLanguage]);

  // Load collection
  const loadCollection = useCallback(async () => {
    if (!user || !selectedProfileId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const [itemsRes, poolRes] = await Promise.all([
        supabase
          .from("collected_items")
          .select("*")
          .eq("kid_profile_id", selectedProfileId)
          .order("collected_at", { ascending: false }),
        supabase
          .from("collectible_pool")
          .select("*")
      ]);

      if (itemsRes.data) {
        const typedItems = itemsRes.data.map(item => ({
          ...item,
          category: item.category as CollectibleCategory,
          rarity: item.rarity as Rarity
        }));
        setItems(typedItems);

        // Calculate stats
        const newStats: CollectionStats = {
          total: typedItems.length,
          byCategory: { creature: 0, place: 0, object: 0, star: 0 },
          byRarity: { common: 0, rare: 0, epic: 0, legendary: 0 }
        };

        typedItems.forEach(item => {
          newStats.byCategory[item.category]++;
          newStats.byRarity[item.rarity]++;
        });

        setStats(newStats);
      }

      if (poolRes.data) {
        setPool(poolRes.data.map(item => ({
          ...item,
          category: item.category as CollectibleCategory,
          rarity: item.rarity as Rarity
        })));
      }
    } catch (err) {
      console.error("Error loading collection:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProfileId]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Award a collectible based on story content
  const awardCollectible = useCallback(async (
    storyId: string,
    storyContent: string,
    category: CollectibleCategory = 'creature'
  ): Promise<CollectedItem | null> => {
    if (!user || !selectedProfileId) return null;

    // Check if already collected from this story
    const existing = items.find(i => i.story_id === storyId && i.category === category);
    if (existing) return existing;

    // Find a matching item from the pool based on story content
    const contentLower = storyContent.toLowerCase();
    const categoryItems = pool.filter(p => p.category === category);
    
    // Score each item by keyword matches
    const scoredItems = categoryItems.map(item => {
      let score = 0;
      item.keywords.forEach(keyword => {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      return { item, score };
    });

    // Sort by score and pick the best match, or random if no matches
    scoredItems.sort((a, b) => b.score - a.score);
    
    let selectedItem: CollectiblePoolItem;
    if (scoredItems[0]?.score > 0) {
      // Get items with the highest score
      const topScore = scoredItems[0].score;
      const topItems = scoredItems.filter(s => s.score === topScore);
      selectedItem = topItems[Math.floor(Math.random() * topItems.length)].item;
    } else {
      // Random selection with rarity weighting
      const weights = { common: 60, rare: 25, epic: 12, legendary: 3 };
      const weightedItems: CollectiblePoolItem[] = [];
      categoryItems.forEach(item => {
        const weight = weights[item.rarity];
        for (let i = 0; i < weight; i++) {
          weightedItems.push(item);
        }
      });
      selectedItem = weightedItems[Math.floor(Math.random() * weightedItems.length)];
    }

    if (!selectedItem) return null;

    // Insert the collected item
    const { data, error } = await supabase
      .from("collected_items")
      .insert({
        user_id: user.id,
        kid_profile_id: selectedProfileId,
        story_id: storyId,
        category: selectedItem.category,
        item_name: selectedItem.item_name,
        item_emoji: selectedItem.item_emoji,
        item_description: selectedItem.item_description,
        rarity: selectedItem.rarity
      })
      .select()
      .single();

    if (error) {
      console.error("Error awarding collectible:", error);
      return null;
    }

    const newItem: CollectedItem = {
      ...data,
      category: data.category as CollectibleCategory,
      rarity: data.rarity as Rarity
    };

    setItems(prev => [newItem, ...prev]);
    setStats(prev => ({
      total: prev.total + 1,
      byCategory: {
        ...prev.byCategory,
        [newItem.category]: prev.byCategory[newItem.category] + 1
      },
      byRarity: {
        ...prev.byRarity,
        [newItem.rarity]: prev.byRarity[newItem.rarity] + 1
      }
    }));

    return newItem;
  }, [user, selectedProfileId, items, pool]);

  // Award a star for perfect quiz
  const awardStar = useCallback(async (storyId: string, perfectCount: number): Promise<CollectedItem | null> => {
    if (!user || !selectedProfileId) return null;

    // Determine star rarity based on perfect quiz count
    let starName: string;
    let starEmoji: string;
    let rarity: Rarity;

    if (perfectCount >= 20) {
      starName = 'Diamantstern';
      starEmoji = '💫';
      rarity = 'legendary';
    } else if (perfectCount >= 10) {
      starName = 'Goldstern';
      starEmoji = '✨';
      rarity = 'epic';
    } else if (perfectCount >= 5) {
      starName = 'Silberstern';
      starEmoji = '🌟';
      rarity = 'rare';
    } else {
      starName = 'Bronzestern';
      starEmoji = '⭐';
      rarity = 'common';
    }

    // Check if already has a star from this story
    const existing = items.find(i => i.story_id === storyId && i.category === 'star');
    if (existing) return existing;

    const { data, error } = await supabase
      .from("collected_items")
      .insert({
        user_id: user.id,
        kid_profile_id: selectedProfileId,
        story_id: storyId,
        category: 'star',
        item_name: starName,
        item_emoji: starEmoji,
        item_description: getTranslations((navigator.language?.slice(0, 2)?.toLowerCase() || 'de') as Language).hookPerfectQuiz,
        rarity
      })
      .select()
      .single();

    if (error) {
      console.error("Error awarding star:", error);
      return null;
    }

    const newItem: CollectedItem = {
      ...data,
      category: data.category as CollectibleCategory,
      rarity: data.rarity as Rarity
    };

    setItems(prev => [newItem, ...prev]);
    setStats(prev => ({
      total: prev.total + 1,
      byCategory: { ...prev.byCategory, star: prev.byCategory.star + 1 },
      byRarity: { ...prev.byRarity, [rarity]: prev.byRarity[rarity] + 1 }
    }));

    return newItem;
  }, [user, selectedProfileId, items]);

  return {
    items,
    pool,
    stats,
    isLoading,
    getCategoryName,
    awardCollectible,
    awardStar,
    refreshCollection: loadCollection,
    rarityColors,
    rarityGlows
  };
};
