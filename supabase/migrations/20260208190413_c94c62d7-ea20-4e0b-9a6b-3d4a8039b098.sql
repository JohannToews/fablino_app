-- Phase 4: RLS Policies härten

-- 4.1 Hilfsfunktion für User-ID Mapping (auth.uid() → user_profiles.id)
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 4.2 RLS Policies für Kerntabellen

-- kid_profiles: User sieht nur eigene Kinder
DROP POLICY IF EXISTS "Anyone can insert kid_profiles" ON kid_profiles;
DROP POLICY IF EXISTS "Anyone can read kid_profiles" ON kid_profiles;
DROP POLICY IF EXISTS "Anyone can update kid_profiles" ON kid_profiles;

CREATE POLICY "user_own_kids_select" ON kid_profiles
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_kids_insert" ON kid_profiles
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

CREATE POLICY "user_own_kids_update" ON kid_profiles
  FOR UPDATE USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_kids_delete" ON kid_profiles
  FOR DELETE USING (user_id = get_user_profile_id());

-- stories: User sieht nur eigene Stories
DROP POLICY IF EXISTS "Anyone can read stories" ON stories;
DROP POLICY IF EXISTS "Users can create their own stories" ON stories;
DROP POLICY IF EXISTS "Users can update their own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON stories;

CREATE POLICY "user_own_stories_select" ON stories
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_stories_insert" ON stories
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

CREATE POLICY "user_own_stories_update" ON stories
  FOR UPDATE USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_stories_delete" ON stories
  FOR DELETE USING (user_id = get_user_profile_id());

-- marked_words: über Story-Chain
DROP POLICY IF EXISTS "Anyone can create marked_words" ON marked_words;
DROP POLICY IF EXISTS "Anyone can read marked_words" ON marked_words;
DROP POLICY IF EXISTS "Anyone can update marked_words" ON marked_words;
DROP POLICY IF EXISTS "Anyone can delete marked_words" ON marked_words;

CREATE POLICY "user_own_words_select" ON marked_words
  FOR SELECT USING (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

CREATE POLICY "user_own_words_insert" ON marked_words
  FOR INSERT WITH CHECK (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

CREATE POLICY "user_own_words_update" ON marked_words
  FOR UPDATE USING (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

CREATE POLICY "user_own_words_delete" ON marked_words
  FOR DELETE USING (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

-- comprehension_questions: über Story-Chain
DROP POLICY IF EXISTS "Anyone can create comprehension_questions" ON comprehension_questions;
DROP POLICY IF EXISTS "Anyone can read comprehension_questions" ON comprehension_questions;
DROP POLICY IF EXISTS "Anyone can update comprehension_questions" ON comprehension_questions;
DROP POLICY IF EXISTS "Anyone can delete comprehension_questions" ON comprehension_questions;

CREATE POLICY "user_own_questions_select" ON comprehension_questions
  FOR SELECT USING (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

CREATE POLICY "user_own_questions_insert" ON comprehension_questions
  FOR INSERT WITH CHECK (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

CREATE POLICY "user_own_questions_update" ON comprehension_questions
  FOR UPDATE USING (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

CREATE POLICY "user_own_questions_delete" ON comprehension_questions
  FOR DELETE USING (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

-- user_progress: über kid_profile_id Chain
DROP POLICY IF EXISTS "Anyone can insert user_progress" ON user_progress;
DROP POLICY IF EXISTS "Anyone can read user_progress" ON user_progress;
DROP POLICY IF EXISTS "Anyone can update user_progress" ON user_progress;

CREATE POLICY "user_own_progress_select" ON user_progress
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_progress_insert" ON user_progress
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

CREATE POLICY "user_own_progress_update" ON user_progress
  FOR UPDATE USING (user_id = get_user_profile_id());

-- point_transactions
DROP POLICY IF EXISTS "Anyone can insert point_transactions" ON point_transactions;
DROP POLICY IF EXISTS "Anyone can read point_transactions" ON point_transactions;

CREATE POLICY "user_own_transactions_select" ON point_transactions
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_transactions_insert" ON point_transactions
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

-- collected_items
DROP POLICY IF EXISTS "Anyone can insert collected_items" ON collected_items;
DROP POLICY IF EXISTS "Anyone can read collected_items" ON collected_items;

CREATE POLICY "user_own_collected_select" ON collected_items
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_collected_insert" ON collected_items
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

-- streak_milestones: über kid_profile Chain
DROP POLICY IF EXISTS "Anyone can insert streak_milestones" ON streak_milestones;
DROP POLICY IF EXISTS "Anyone can read streak_milestones" ON streak_milestones;

CREATE POLICY "user_own_streaks_select" ON streak_milestones
  FOR SELECT USING (
    kid_profile_id IN (SELECT id FROM kid_profiles WHERE user_id = get_user_profile_id())
  );

CREATE POLICY "user_own_streaks_insert" ON streak_milestones
  FOR INSERT WITH CHECK (
    kid_profile_id IN (SELECT id FROM kid_profiles WHERE user_id = get_user_profile_id())
  );

-- user_results
DROP POLICY IF EXISTS "Anyone can create user_results" ON user_results;
DROP POLICY IF EXISTS "Anyone can read user_results" ON user_results;
DROP POLICY IF EXISTS "Anyone can update user_results" ON user_results;
DROP POLICY IF EXISTS "Anyone can delete user_results" ON user_results;

CREATE POLICY "user_own_results_select" ON user_results
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_results_insert" ON user_results
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

CREATE POLICY "user_own_results_update" ON user_results
  FOR UPDATE USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_results_delete" ON user_results
  FOR DELETE USING (user_id = get_user_profile_id());

-- story_ratings
DROP POLICY IF EXISTS "Anyone can create story_ratings" ON story_ratings;
DROP POLICY IF EXISTS "Anyone can read story_ratings" ON story_ratings;
DROP POLICY IF EXISTS "Anyone can update story_ratings" ON story_ratings;
DROP POLICY IF EXISTS "Anyone can delete story_ratings" ON story_ratings;

CREATE POLICY "user_own_ratings_select" ON story_ratings
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_ratings_insert" ON story_ratings
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

CREATE POLICY "user_own_ratings_update" ON story_ratings
  FOR UPDATE USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_ratings_delete" ON story_ratings
  FOR DELETE USING (user_id = get_user_profile_id());

-- consistency_check_results
DROP POLICY IF EXISTS "Anyone can insert consistency_check_results" ON consistency_check_results;
DROP POLICY IF EXISTS "Anyone can read consistency_check_results" ON consistency_check_results;

CREATE POLICY "user_own_consistency_select" ON consistency_check_results
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "user_own_consistency_insert" ON consistency_check_results
  FOR INSERT WITH CHECK (user_id = get_user_profile_id());

-- shared_stories: Lese-Zugriff für alle (für Sharing), aber nur eigene erstellen
DROP POLICY IF EXISTS "Anyone can create shared_stories" ON shared_stories;
DROP POLICY IF EXISTS "Anyone can read shared_stories" ON shared_stories;
DROP POLICY IF EXISTS "Anyone can update shared_stories" ON shared_stories;

CREATE POLICY "shared_stories_public_read" ON shared_stories
  FOR SELECT USING (true);

CREATE POLICY "user_own_shares_insert" ON shared_stories
  FOR INSERT WITH CHECK (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

CREATE POLICY "user_own_shares_update" ON shared_stories
  FOR UPDATE USING (
    story_id IN (SELECT id FROM stories WHERE user_id = get_user_profile_id())
  );

-- image_cache: Öffentlich lesbar (für Performance), alle können cachen
DROP POLICY IF EXISTS "Anyone can insert image_cache" ON image_cache;
DROP POLICY IF EXISTS "Anyone can read image_cache" ON image_cache;
DROP POLICY IF EXISTS "Anyone can update image_cache" ON image_cache;

CREATE POLICY "image_cache_public_read" ON image_cache
  FOR SELECT USING (true);

CREATE POLICY "image_cache_authenticated_insert" ON image_cache
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "image_cache_authenticated_update" ON image_cache
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 4.3 Admin-Policies für user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON user_profiles;

CREATE POLICY "user_own_profile_select" ON user_profiles
  FOR SELECT USING (auth_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_own_profile_update" ON user_profiles
  FOR UPDATE USING (auth_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_profile_insert" ON user_profiles
  FOR INSERT WITH CHECK (auth_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Admin kann alle kid_profiles sehen/bearbeiten
CREATE POLICY "admin_all_kids" ON kid_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin kann alle stories sehen/bearbeiten
CREATE POLICY "admin_all_stories" ON stories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin kann alle user_results sehen
CREATE POLICY "admin_all_results" ON user_results
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin kann alle user_progress sehen
CREATE POLICY "admin_all_progress" ON user_progress
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));