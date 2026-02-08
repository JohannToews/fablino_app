-- Block 2.3d Phase 1: Update kid_characters role constraint
-- Change from (sibling, friend, known_figure, custom) to (family, friend, known_figure)
-- 'sibling' and 'custom' are migrated to 'family'

-- 1. Migrate existing data first
UPDATE kid_characters SET role = 'family' WHERE role IN ('sibling', 'custom');

-- 2. Drop old constraint and add new one
ALTER TABLE kid_characters DROP CONSTRAINT IF EXISTS kid_characters_role_check;
ALTER TABLE kid_characters ADD CONSTRAINT kid_characters_role_check 
  CHECK (role IN ('family', 'friend', 'known_figure'));
