import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useKidProfile } from "@/hooks/useKidProfile";

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

interface LevelSetting {
  level_number: number;
  title: string;
  min_points: number;
  icon: string | null;
}

interface PointSetting {
  category: string;
  difficulty: string;
  points: number;
}

const STREAK_MILESTONES = [3, 7, 14, 30] as const;

const getFlameType = (streak: number): StreakInfo['flameType'] => {
  if (streak >= 30) return 'diamond';
  if (streak >= 14) return 'gold';
  if (streak >= 7) return 'silver';
  if (streak >= 3) return 'bronze';
  return 'none';
};

export const useGamification = () => {
  const { user } = useAuth();
  const { selectedProfileId } = useKidProfile();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [levels, setLevels] = useState<LevelSetting[]>([]);
  const [pointSettings, setPointSettings] = useState<PointSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelInfo | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const [levelsRes, pointsRes] = await Promise.all([
        supabase.from("level_settings").select("*").order("level_number"),
        supabase.from("point_settings").select("*")
      ]);

      if (levelsRes.data) setLevels(levelsRes.data);
      if (pointsRes.data) setPointSettings(pointsRes.data);
    };

    loadSettings();
  }, []);

  // Calculate level from points
  const getLevelFromPoints = useCallback((points: number): LevelInfo => {
    if (levels.length === 0) {
      return {
        level: 1,
        title: "Lesefuchs",
        icon: "🦊",
        minPoints: 0,
        nextLevelPoints: 150,
        isMaxLevel: false
      };
    }

    let currentLevel = levels[0];
    let nextLevel: LevelSetting | null = levels[1] || null;

    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].min_points) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1] || null;
        break;
      }
    }

    return {
      level: currentLevel.level_number,
      title: currentLevel.title,
      icon: currentLevel.icon || "🦊",
      minPoints: currentLevel.min_points,
      nextLevelPoints: nextLevel?.min_points || null,
      isMaxLevel: !nextLevel
    };
  }, [levels]);

  // Get point value for a category
  const getPoints = useCallback((category: string, difficulty?: string): number => {
    const setting = pointSettings.find(
      p => p.category === category && (p.difficulty === 'all' || p.difficulty === difficulty)
    );
    return setting?.points || 0;
  }, [pointSettings]);

  // Load user progress
  const loadProgress = useCallback(async () => {
    if (!user || !selectedProfileId) {
      setProgress(null);
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
        console.error("Error loading progress:", error);
        setIsLoading(false);
        return;
      }

      if (progressData) {
        const levelInfo = getLevelFromPoints(progressData.total_points);
        setProgress({
          totalPoints: progressData.total_points,
          level: levelInfo,
          streak: {
            current: progressData.current_streak,
            longest: progressData.longest_streak,
            lastReadDate: progressData.last_read_date,
            freezeAvailable: progressData.streak_freeze_available,
            flameType: getFlameType(progressData.current_streak)
          },
          storiesReadTotal: progressData.stories_read_total,
          quizzesPerfect: progressData.quizzes_perfect,
          quizzesPassed: progressData.quizzes_passed
        });
      } else {
        // Create initial progress record
        const { data: newProgress } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            kid_profile_id: selectedProfileId,
            total_points: 0,
            current_level: 1,
            current_streak: 0,
            longest_streak: 0
          })
          .select()
          .single();

        if (newProgress) {
          const levelInfo = getLevelFromPoints(0);
          setProgress({
            totalPoints: 0,
            level: levelInfo,
            streak: {
              current: 0,
              longest: 0,
              lastReadDate: null,
              freezeAvailable: true,
              flameType: 'none'
            },
            storiesReadTotal: 0,
            quizzesPerfect: 0,
            quizzesPassed: 0
          });
        }
      }
    } catch (err) {
      console.error("Error loading gamification data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProfileId, getLevelFromPoints]);

  useEffect(() => {
    if (levels.length > 0) {
      loadProgress();
    }
  }, [loadProgress, levels]);

  // Award points for completing a story
  const awardStoryPoints = useCallback(async (storyId: string): Promise<number> => {
    if (!user || !selectedProfileId || !progress) return 0;

    const points = getPoints('story_read');
    const today = new Date().toISOString().split('T')[0];
    const oldLevel = progress.level.level;

    // Check if we need to update streak
    let newStreak = progress.streak.current;
    let newLongest = progress.streak.longest;
    const lastRead = progress.streak.lastReadDate;

    if (!lastRead || lastRead !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastRead === yesterdayStr) {
        // Continuing streak
        newStreak += 1;
        if (newStreak > newLongest) newLongest = newStreak;
      } else if (!lastRead) {
        // First story ever
        newStreak = 1;
        newLongest = 1;
      } else {
        // Streak broken (unless freeze was used)
        newStreak = 1;
      }
    }

    // Check for streak milestone bonuses
    let streakBonus = 0;
    for (const milestone of STREAK_MILESTONES) {
      if (newStreak >= milestone) {
        // Check if this milestone was already claimed for this streak
        const { data: existingMilestone } = await supabase
          .from("streak_milestones")
          .select("id")
          .eq("kid_profile_id", selectedProfileId)
          .eq("milestone_days", milestone)
          .eq("streak_count", Math.floor(newStreak / milestone))
          .maybeSingle();

        if (!existingMilestone && newStreak === milestone) {
          const bonus = getPoints('streak_bonus', String(milestone));
          streakBonus += bonus;

          // Record the milestone
          await supabase.from("streak_milestones").insert({
            kid_profile_id: selectedProfileId,
            milestone_days: milestone,
            streak_count: Math.floor(newStreak / milestone)
          });

          // Record bonus transaction
          await supabase.from("point_transactions").insert({
            user_id: user.id,
            kid_profile_id: selectedProfileId,
            points: bonus,
            transaction_type: `streak_bonus_${milestone}` as any,
            description: `${milestone}-Tage Streak Bonus`
          });
        }
      }
    }

    const totalPoints = points + streakBonus;
    const newTotalPoints = progress.totalPoints + totalPoints;
    const newLevel = getLevelFromPoints(newTotalPoints);

    // Record story transaction
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      kid_profile_id: selectedProfileId,
      points: points,
      transaction_type: 'story_read',
      story_id: storyId,
      description: 'Geschichte gelesen'
    });

    // Update progress
    await supabase
      .from("user_progress")
      .update({
        total_points: newTotalPoints,
        current_level: newLevel.level,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_read_date: today,
        stories_read_total: progress.storiesReadTotal + 1
      })
      .eq("kid_profile_id", selectedProfileId);

    // Check for level up
    if (newLevel.level > oldLevel) {
      setPendingLevelUp(newLevel);
    }

    // Update local state
    setProgress(prev => prev ? {
      ...prev,
      totalPoints: newTotalPoints,
      level: newLevel,
      streak: {
        ...prev.streak,
        current: newStreak,
        longest: newLongest,
        lastReadDate: today,
        flameType: getFlameType(newStreak)
      },
      storiesReadTotal: prev.storiesReadTotal + 1
    } : null);

    return totalPoints;
  }, [user, selectedProfileId, progress, getPoints, getLevelFromPoints]);

  // Award points for quiz
  const awardQuizPoints = useCallback(async (
    storyId: string,
    correctAnswers: number,
    totalQuestions: number
  ): Promise<number> => {
    if (!user || !selectedProfileId || !progress) return 0;

    const percentage = (correctAnswers / totalQuestions) * 100;
    let points = 0;
    let transactionType: 'quiz_perfect' | 'quiz_passed' = 'quiz_passed';

    if (percentage === 100) {
      points = getPoints('quiz_perfect');
      transactionType = 'quiz_perfect';
    } else if (percentage >= 80) {
      points = getPoints('quiz_passed');
      transactionType = 'quiz_passed';
    }

    if (points === 0) return 0;

    const oldLevel = progress.level.level;
    const newTotalPoints = progress.totalPoints + points;
    const newLevel = getLevelFromPoints(newTotalPoints);

    // Record transaction
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      kid_profile_id: selectedProfileId,
      points,
      transaction_type: transactionType,
      story_id: storyId,
      description: percentage === 100 ? 'Quiz perfekt!' : 'Quiz bestanden'
    });

    // Update progress
    const updates: any = {
      total_points: newTotalPoints,
      current_level: newLevel.level
    };

    if (percentage === 100) {
      updates.quizzes_perfect = progress.quizzesPerfect + 1;
    }
    updates.quizzes_passed = progress.quizzesPassed + 1;

    await supabase
      .from("user_progress")
      .update(updates)
      .eq("kid_profile_id", selectedProfileId);

    // Check for level up
    if (newLevel.level > oldLevel) {
      setPendingLevelUp(newLevel);
    }

    // Update local state
    setProgress(prev => prev ? {
      ...prev,
      totalPoints: newTotalPoints,
      level: newLevel,
      quizzesPerfect: percentage === 100 ? prev.quizzesPerfect + 1 : prev.quizzesPerfect,
      quizzesPassed: prev.quizzesPassed + 1
    } : null);

    return points;
  }, [user, selectedProfileId, progress, getPoints, getLevelFromPoints]);

  // Award points for vocabulary
  const awardVocabPoints = useCallback(async (): Promise<number> => {
    if (!user || !selectedProfileId || !progress) return 0;

    const points = getPoints('vocab_learned');
    if (points === 0) return 0;

    const oldLevel = progress.level.level;
    const newTotalPoints = progress.totalPoints + points;
    const newLevel = getLevelFromPoints(newTotalPoints);

    // Record transaction
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      kid_profile_id: selectedProfileId,
      points,
      transaction_type: 'vocab_bonus',
      description: 'Vokabel gelernt'
    });

    // Update progress
    await supabase
      .from("user_progress")
      .update({
        total_points: newTotalPoints,
        current_level: newLevel.level
      })
      .eq("kid_profile_id", selectedProfileId);

    // Check for level up
    if (newLevel.level > oldLevel) {
      setPendingLevelUp(newLevel);
    }

    // Update local state
    setProgress(prev => prev ? {
      ...prev,
      totalPoints: newTotalPoints,
      level: newLevel
    } : null);

    return points;
  }, [user, selectedProfileId, progress, getPoints, getLevelFromPoints]);

  // Use streak freeze
  const useStreakFreeze = useCallback(async (): Promise<boolean> => {
    if (!selectedProfileId || !progress?.streak.freezeAvailable) return false;

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    await supabase
      .from("user_progress")
      .update({
        streak_freeze_available: false,
        streak_freeze_used_this_week: weekStartStr
      })
      .eq("kid_profile_id", selectedProfileId);

    setProgress(prev => prev ? {
      ...prev,
      streak: { ...prev.streak, freezeAvailable: false }
    } : null);

    return true;
  }, [selectedProfileId, progress]);

  // Clear pending level up
  const clearPendingLevelUp = useCallback(() => {
    setPendingLevelUp(null);
  }, []);

  return {
    progress,
    isLoading,
    pendingLevelUp,
    awardStoryPoints,
    awardQuizPoints,
    awardVocabPoints,
    useStreakFreeze,
    clearPendingLevelUp,
    refreshProgress: loadProgress
  };
};
