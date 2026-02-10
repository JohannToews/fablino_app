import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";

// ═══ Star Rewards interface (loaded from DB point_settings) ═══

export interface StarRewards {
  stars_story_read: number;
  stars_quiz_perfect: number;
  stars_quiz_passed: number;
  stars_quiz_failed: number;
  quiz_pass_threshold: number;
}

const DEFAULT_STAR_REWARDS: StarRewards = {
  stars_story_read: 1,
  stars_quiz_perfect: 2,
  stars_quiz_passed: 1,
  stars_quiz_failed: 0,
  quiz_pass_threshold: 80,
};

export const LEVELS = [
  { level: 1, title: 'buecherfuchs',        icon: '🦊', minStars: 0 },
  { level: 2, title: 'geschichtenentdecker', icon: '🧭', minStars: 25 },
  { level: 3, title: 'leseheld',            icon: '🦸', minStars: 75 },
  { level: 4, title: 'wortmagier',          icon: '🪄', minStars: 150 },
  { level: 5, title: 'fablinoMeister',      icon: '👑', minStars: 300 },
] as const;

// ═══ Legacy Interfaces (for backward compatibility with gamification components) ═══

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  minPoints: number;
  nextLevelPoints: number | null;
  isMaxLevel: boolean;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastReadDate: string | null;
  freezeAvailable: boolean;
  flameType: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface UserProgress {
  totalPoints: number;
  level: LevelInfo;
  streak: StreakInfo;
  storiesReadTotal: number;
  quizzesPerfect: number;
  quizzesPassed: number;
}

// ═══ New Interfaces ═══

export interface GamificationState {
  stars: number;
  level: number;
  levelTitle: string;
  levelIcon: string;
  nextLevelAt: number | null;
  currentStreak: number;
  isStreakDay: boolean;
  storiesCompleted: number;
  wordsLearned: number;
  quizzesPassed: number;
}

interface PendingLevelUp {
  level: number;
  title: string;
  icon: string;
}

// ═══ Helpers ═══

function getLevelFromStars(stars: number): { level: number; title: string; icon: string; nextLevelAt: number | null } {
  let current: typeof LEVELS[number] = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (stars >= LEVELS[i].minStars) {
      current = LEVELS[i];
      break;
    }
  }

  const nextLevel = LEVELS.find(l => l.level === current.level + 1);
  return {
    level: current.level,
    title: current.title,
    icon: current.icon,
    nextLevelAt: nextLevel ? nextLevel.minStars : null,
  };
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ═══ Hook ═══

export const useGamification = () => {
  const { user } = useAuth();
  const { selectedProfileId } = useKidProfile();
  const [state, setState] = useState<GamificationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingLevelUp, setPendingLevelUp] = useState<PendingLevelUp | null>(null);
  const [starRewards, setStarRewards] = useState<StarRewards>(DEFAULT_STAR_REWARDS);

  // ── Load point_settings from DB ──
  useEffect(() => {
    const loadPointSettings = async () => {
      const { data } = await supabase
        .from('point_settings')
        .select('setting_key, value');
      if (data) {
        const map: Partial<StarRewards> = {};
        data.forEach(row => {
          const key = row.setting_key as keyof StarRewards;
          if (key in DEFAULT_STAR_REWARDS) {
            (map as any)[key] = parseInt(row.value, 10) || 0;
          }
        });
        setStarRewards(prev => ({ ...prev, ...map }));
      }
    };
    loadPointSettings();
  }, []);

  // ── Load progress from DB ──
  const loadProgress = useCallback(async () => {
    if (!user || !selectedProfileId) {
      setState(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: progressData, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("kid_profile_id", selectedProfileId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("[useGamification] Error loading progress:", error);
        setIsLoading(false);
        return;
      }

      if (progressData) {
        const totalStars = progressData.total_stars ?? 0;
        const levelInfo = getLevelFromStars(totalStars);
        const today = getTodayStr();
        setState({
          stars: totalStars,
          level: levelInfo.level,
          levelTitle: levelInfo.title,
          levelIcon: levelInfo.icon,
          nextLevelAt: levelInfo.nextLevelAt,
          currentStreak: progressData.current_streak,
          isStreakDay: progressData.last_read_date === today,
          storiesCompleted: progressData.stories_completed ?? progressData.stories_read_total ?? 0,
          wordsLearned: progressData.words_learned ?? 0,
          quizzesPassed: progressData.quizzes_passed ?? 0,
        });
      } else {
        // Create initial progress record
        const { data: newProgress } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            kid_profile_id: selectedProfileId,
            total_stars: 0,
            current_level: 1,
            current_streak: 0,
            longest_streak: 0,
          })
          .select()
          .single();

        if (newProgress) {
          const levelInfo = getLevelFromStars(0);
          setState({
            stars: 0,
            level: levelInfo.level,
            levelTitle: levelInfo.title,
            levelIcon: levelInfo.icon,
            nextLevelAt: levelInfo.nextLevelAt,
            currentStreak: 0,
            isStreakDay: false,
            storiesCompleted: 0,
            wordsLearned: 0,
            quizzesPassed: 0,
          });
        }
      }
    } catch (err) {
      console.error("[useGamification] Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProfileId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // ── Re-load progress when page becomes visible (e.g. navigating back from ReadingPage) ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadProgress();
      }
    };
    const handleFocus = () => {
      loadProgress();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadProgress]);

  // ── Award stars ──
  const awardStars = useCallback(async (count: number, reason: string) => {
    if (!user || !selectedProfileId || !state) return;

    const oldLevel = state.level;
    const newStars = state.stars + count;
    const newLevelInfo = getLevelFromStars(newStars);

    // Update DB
    await supabase
      .from("user_progress")
      .update({
        total_stars: newStars,
        current_level: newLevelInfo.level,
      })
      .eq("kid_profile_id", selectedProfileId);

    console.log(`[useGamification] +${count} stars (${reason}), total: ${newStars}, level: ${newLevelInfo.level}`);

    // Check for level up
    if (newLevelInfo.level > oldLevel) {
      setPendingLevelUp({
        level: newLevelInfo.level,
        title: newLevelInfo.title,
        icon: newLevelInfo.icon,
      });
    }

    // Update local state
    setState(prev => prev ? {
      ...prev,
      stars: newStars,
      level: newLevelInfo.level,
      levelTitle: newLevelInfo.title,
      levelIcon: newLevelInfo.icon,
      nextLevelAt: newLevelInfo.nextLevelAt,
    } : null);
  }, [user, selectedProfileId, state]);

  // ── Check and update streak ──
  const checkAndUpdateStreak = useCallback(async () => {
    if (!user || !selectedProfileId || !state) return;

    const today = getTodayStr();

    // Already counted today
    if (state.isStreakDay) return;

    const yesterday = getYesterdayStr();
    const lastRead = await supabase
      .from("user_progress")
      .select("last_read_date, current_streak, longest_streak")
      .eq("kid_profile_id", selectedProfileId)
      .single();

    if (!lastRead.data) return;

    const lastReadDate = lastRead.data.last_read_date;
    let newStreak: number;
    let newLongest = lastRead.data.longest_streak;

    if (lastReadDate === yesterday) {
      // Continuing streak
      newStreak = lastRead.data.current_streak + 1;
    } else if (!lastReadDate) {
      // First ever
      newStreak = 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    if (newStreak > newLongest) newLongest = newStreak;

    // Update DB
    await supabase
      .from("user_progress")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_read_date: today,
      })
      .eq("kid_profile_id", selectedProfileId);

    // Award streak bonus (from day 2+)
    if (newStreak >= 2) {
      // Award streak bonus stars (don't recurse — direct DB update)
      const bonusStars = 1; // Streak bonus is always 1 star
      const newTotalStars = state.stars + bonusStars;
      const newLevelInfo = getLevelFromStars(newTotalStars);

      await supabase
        .from("user_progress")
        .update({
          total_stars: newTotalStars,
          current_level: newLevelInfo.level,
        })
        .eq("kid_profile_id", selectedProfileId);

      console.log(`[useGamification] Streak bonus: +${bonusStars} stars (streak: ${newStreak})`);

      setState(prev => prev ? {
        ...prev,
        stars: newTotalStars,
        level: newLevelInfo.level,
        levelTitle: newLevelInfo.title,
        levelIcon: newLevelInfo.icon,
        nextLevelAt: newLevelInfo.nextLevelAt,
        currentStreak: newStreak,
        isStreakDay: true,
      } : null);
    } else {
      setState(prev => prev ? {
        ...prev,
        currentStreak: newStreak,
        isStreakDay: true,
      } : null);
    }
  }, [user, selectedProfileId, state]);

  // ── Mark story complete ──
  const markStoryComplete = useCallback(async (storyId: string) => {
    if (!selectedProfileId || !state) return;

    // Set stories.completed = true
    await supabase
      .from("stories")
      .update({ completed: true })
      .eq("id", storyId);

    // Increment stories_completed in user_progress
    const newCount = state.storiesCompleted + 1;
    await supabase
      .from("user_progress")
      .update({ stories_completed: newCount })
      .eq("kid_profile_id", selectedProfileId);

    setState(prev => prev ? {
      ...prev,
      storiesCompleted: newCount,
    } : null);

    console.log(`[useGamification] Story ${storyId} marked complete (total: ${newCount})`);
  }, [selectedProfileId, state]);

  // ── Mark word learned ──
  const markWordLearned = useCallback(async () => {
    if (!selectedProfileId || !state) return;

    const newCount = state.wordsLearned + 1;
    await supabase
      .from("user_progress")
      .update({ words_learned: newCount })
      .eq("kid_profile_id", selectedProfileId);

    setState(prev => prev ? {
      ...prev,
      wordsLearned: newCount,
    } : null);
  }, [selectedProfileId, state]);

  // ── Mark quiz passed ──
  const markQuizPassed = useCallback(async () => {
    if (!selectedProfileId || !state) return;

    const newCount = state.quizzesPassed + 1;
    await supabase
      .from("user_progress")
      .update({ quizzes_passed: newCount })
      .eq("kid_profile_id", selectedProfileId);

    setState(prev => prev ? {
      ...prev,
      quizzesPassed: newCount,
    } : null);

    console.log(`[useGamification] Quiz passed (total: ${newCount})`);
  }, [selectedProfileId, state]);

  // ── Clear pending level up ──
  const clearPendingLevelUp = useCallback(() => {
    setPendingLevelUp(null);
  }, []);

  return {
    state,
    isLoading,
    pendingLevelUp,
    starRewards,
    actions: {
      awardStars,
      checkAndUpdateStreak,
      markStoryComplete,
      markWordLearned,
      markQuizPassed,
    },
    clearPendingLevelUp,
    refreshProgress: loadProgress,

    // ═══ Legacy compatibility aliases (for callers not yet migrated) ═══
    progress: state ? {
      totalPoints: state.stars,
      level: {
        level: state.level,
        title: state.levelTitle,
        icon: state.levelIcon,
        minPoints: LEVELS.find(l => l.level === state.level)?.minStars ?? 0,
        nextLevelPoints: state.nextLevelAt,
        isMaxLevel: state.nextLevelAt === null,
      },
      streak: {
        current: state.currentStreak,
        longest: 0,
        lastReadDate: state.isStreakDay ? getTodayStr() : null,
        freezeAvailable: false,
        flameType: 'none' as const,
      },
      storiesReadTotal: state.storiesCompleted,
      quizzesPerfect: 0,
      quizzesPassed: state.quizzesPassed,
    } : null,
    awardStoryPoints: async (storyId: string): Promise<number> => {
      await awardStars(starRewards.stars_story_read, 'story_read');
      await checkAndUpdateStreak();
      await markStoryComplete(storyId);
      return starRewards.stars_story_read;
    },
    awardQuizPoints: async (_storyId: string, correctAnswers: number, totalQuestions: number): Promise<number> => {
      const isPerfect = correctAnswers === totalQuestions;
      const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const passed = scorePercent >= starRewards.quiz_pass_threshold;
      const stars = !passed ? starRewards.stars_quiz_failed : isPerfect ? starRewards.stars_quiz_perfect : starRewards.stars_quiz_passed;
      if (stars > 0) await awardStars(stars, isPerfect ? 'quiz_perfect' : 'quiz_passed');
      return stars;
    },
  };
};
