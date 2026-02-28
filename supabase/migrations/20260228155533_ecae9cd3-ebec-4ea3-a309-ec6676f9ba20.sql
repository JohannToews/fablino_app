
-- 1. Add linked_kid_profile_id to kid_characters
ALTER TABLE public.kid_characters 
ADD COLUMN linked_kid_profile_id UUID NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE;

-- 2. Add soft-delete columns to kid_profiles
ALTER TABLE public.kid_profiles 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN deleted_at TIMESTAMPTZ NULL;

-- 3. Add deleted_at to stories (is_deleted already exists)
ALTER TABLE public.stories 
ADD COLUMN deleted_at TIMESTAMPTZ NULL;

-- 4. Index for sibling lookups
CREATE INDEX idx_kid_characters_linked_profile ON public.kid_characters(linked_kid_profile_id) WHERE linked_kid_profile_id IS NOT NULL;

-- 5. Index for soft-delete filtering
CREATE INDEX idx_kid_profiles_not_deleted ON public.kid_profiles(user_id) WHERE is_deleted = false;

-- 6. Trigger: Auto-sync siblings on kid_profile INSERT
CREATE OR REPLACE FUNCTION public.sync_siblings_on_profile_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sibling RECORD;
BEGIN
  -- For each existing active kid profile under the same parent
  FOR sibling IN
    SELECT id, name, age, gender
    FROM kid_profiles
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_deleted = false
  LOOP
    -- Add sibling to the NEW kid's character list
    INSERT INTO kid_characters (kid_profile_id, name, role, relation, age, is_active, linked_kid_profile_id)
    VALUES (NEW.id, sibling.name, 'family', 
      CASE WHEN sibling.gender = 'male' THEN 'Bruder'
           WHEN sibling.gender = 'female' THEN 'Schwester'
           ELSE 'Geschwister' END,
      sibling.age, true, sibling.id)
    ON CONFLICT DO NOTHING;

    -- Add the NEW kid to the sibling's character list
    INSERT INTO kid_characters (kid_profile_id, name, role, relation, age, is_active, linked_kid_profile_id)
    VALUES (sibling.id, NEW.name, 'family',
      CASE WHEN NEW.gender = 'male' THEN 'Bruder'
           WHEN NEW.gender = 'female' THEN 'Schwester'
           ELSE 'Geschwister' END,
      NEW.age, true, NEW.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_siblings_on_create
AFTER INSERT ON public.kid_profiles
FOR EACH ROW
WHEN (NEW.is_deleted = false)
EXECUTE FUNCTION public.sync_siblings_on_profile_create();

-- 7. Trigger: Sync name/age/gender changes to linked characters
CREATE OR REPLACE FUNCTION public.sync_siblings_on_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name 
     OR OLD.age IS DISTINCT FROM NEW.age
     OR OLD.gender IS DISTINCT FROM NEW.gender THEN
    UPDATE kid_characters
    SET name = NEW.name,
        age = NEW.age,
        relation = CASE WHEN NEW.gender = 'male' THEN 'Bruder'
                        WHEN NEW.gender = 'female' THEN 'Schwester'
                        ELSE 'Geschwister' END,
        updated_at = now()
    WHERE linked_kid_profile_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_siblings_on_update
AFTER UPDATE ON public.kid_profiles
FOR EACH ROW
WHEN (NEW.is_deleted = false)
EXECUTE FUNCTION public.sync_siblings_on_profile_update();

-- 8. Prevent deletion of linked sibling characters (validation trigger)
CREATE OR REPLACE FUNCTION public.prevent_linked_character_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.linked_kid_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot delete a linked sibling character. Delete the kid profile instead.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_prevent_linked_char_delete
BEFORE DELETE ON public.kid_characters
FOR EACH ROW
EXECUTE FUNCTION public.prevent_linked_character_delete();

-- 9. Update kid_profiles RLS to filter deleted by default for non-admins
-- Drop and recreate the select policy
DROP POLICY IF EXISTS "user_own_kids_select" ON public.kid_profiles;
CREATE POLICY "user_own_kids_select" ON public.kid_profiles
FOR SELECT USING (
  user_id = get_user_profile_id() AND is_deleted = false
);

-- Admin policy already has ALL access, but let's ensure they can see deleted too
-- (admin_all_kids already covers this since it doesn't filter is_deleted)
