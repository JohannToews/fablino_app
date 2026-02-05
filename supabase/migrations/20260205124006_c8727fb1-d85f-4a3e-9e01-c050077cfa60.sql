-- Create enum for item categories
CREATE TYPE public.collectible_category AS ENUM ('creature', 'place', 'object', 'star');

-- Create collected_items table
CREATE TABLE public.collected_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  category collectible_category NOT NULL,
  item_name TEXT NOT NULL,
  item_emoji TEXT NOT NULL DEFAULT '✨',
  item_description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kid_profile_id, story_id, category)
);

-- Enable RLS
ALTER TABLE public.collected_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read collected_items" ON public.collected_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert collected_items" ON public.collected_items FOR INSERT WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_collected_items_kid_profile ON public.collected_items(kid_profile_id);
CREATE INDEX idx_collected_items_category ON public.collected_items(category);

-- Create a table for predefined collectible items (pool of possible items)
CREATE TABLE public.collectible_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category collectible_category NOT NULL,
  item_name TEXT NOT NULL,
  item_emoji TEXT NOT NULL,
  item_description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collectible_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read collectible_pool" ON public.collectible_pool FOR SELECT USING (true);

-- Insert predefined collectible items
INSERT INTO public.collectible_pool (category, item_name, item_emoji, item_description, rarity, keywords) VALUES
-- Creatures (Magische Wesen)
('creature', 'Drache', '🐉', 'Ein mächtiger Feuerdrache', 'rare', ARRAY['drache', 'dragon', 'feuer', 'feu']),
('creature', 'Einhorn', '🦄', 'Ein magisches Einhorn', 'rare', ARRAY['einhorn', 'licorne', 'unicorn', 'magie']),
('creature', 'Phoenix', '🔥', 'Ein wiedergeborener Phoenix', 'legendary', ARRAY['phoenix', 'phönix', 'feuer', 'vogel']),
('creature', 'Fee', '🧚', 'Eine kleine Fee mit Glitzerflügeln', 'common', ARRAY['fee', 'fée', 'fairy', 'flügel']),
('creature', 'Meerjungfrau', '🧜‍♀️', 'Eine singende Meerjungfrau', 'rare', ARRAY['meerjungfrau', 'sirène', 'mermaid', 'meer']),
('creature', 'Wolf', '🐺', 'Ein treuer Wolf', 'common', ARRAY['wolf', 'loup', 'wald', 'forêt']),
('creature', 'Eule', '🦉', 'Eine weise Eule', 'common', ARRAY['eule', 'hibou', 'owl', 'nacht']),
('creature', 'Fuchs', '🦊', 'Ein schlauer Fuchs', 'common', ARRAY['fuchs', 'renard', 'fox', 'schlau']),
('creature', 'Bär', '🐻', 'Ein starker Bär', 'common', ARRAY['bär', 'ours', 'bear', 'wald']),
('creature', 'Schmetterling', '🦋', 'Ein bunter Schmetterling', 'common', ARRAY['schmetterling', 'papillon', 'butterfly']),
('creature', 'Delfin', '🐬', 'Ein fröhlicher Delfin', 'common', ARRAY['delfin', 'dauphin', 'dolphin', 'meer']),
('creature', 'Löwe', '🦁', 'Ein mutiger Löwe', 'rare', ARRAY['löwe', 'lion', 'mut', 'savanne']),
('creature', 'Adler', '🦅', 'Ein majestätischer Adler', 'rare', ARRAY['adler', 'aigle', 'eagle', 'berg']),
('creature', 'Elefant', '🐘', 'Ein weiser Elefant', 'common', ARRAY['elefant', 'éléphant', 'elephant']),
('creature', 'Roboter', '🤖', 'Ein freundlicher Roboter', 'rare', ARRAY['roboter', 'robot', 'maschine', 'zukunft']),

-- Places (Orte)
('place', 'Schloss', '🏰', 'Ein prächtiges Königsschloss', 'rare', ARRAY['schloss', 'château', 'castle', 'könig']),
('place', 'Insel', '🏝️', 'Eine tropische Insel', 'common', ARRAY['insel', 'île', 'island', 'strand']),
('place', 'Raumstation', '🛸', 'Eine Raumstation im All', 'epic', ARRAY['raumstation', 'station', 'weltraum', 'space']),
('place', 'Vulkan', '🌋', 'Ein brodelnder Vulkan', 'rare', ARRAY['vulkan', 'volcan', 'volcano', 'lava']),
('place', 'Wald', '🌲', 'Ein geheimnisvoller Wald', 'common', ARRAY['wald', 'forêt', 'forest', 'baum']),
('place', 'Höhle', '🕳️', 'Eine dunkle Höhle', 'common', ARRAY['höhle', 'grotte', 'cave', 'dunkel']),
('place', 'Leuchtturm', '🗼', 'Ein alter Leuchtturm', 'common', ARRAY['leuchtturm', 'phare', 'lighthouse', 'meer']),
('place', 'Pyramide', '🔺', 'Eine mystische Pyramide', 'rare', ARRAY['pyramide', 'pyramid', 'ägypten', 'egypt']),
('place', 'Dschungel', '🌴', 'Ein wilder Dschungel', 'common', ARRAY['dschungel', 'jungle', 'urwald']),
('place', 'Unterwasserwelt', '🐠', 'Eine bunte Unterwasserwelt', 'rare', ARRAY['unterwasser', 'sous-marin', 'underwater', 'koralle']),
('place', 'Wolkenstadt', '☁️', 'Eine Stadt in den Wolken', 'epic', ARRAY['wolken', 'nuage', 'cloud', 'himmel']),
('place', 'Eispalast', '🏔️', 'Ein glitzernder Eispalast', 'rare', ARRAY['eis', 'glace', 'ice', 'schnee']),

-- Objects (Gegenstände)
('object', 'Zauberstab', '🪄', 'Ein mächtiger Zauberstab', 'rare', ARRAY['zauberstab', 'baguette', 'wand', 'magie']),
('object', 'Schatzkarte', '🗺️', 'Eine alte Schatzkarte', 'common', ARRAY['schatzkarte', 'carte', 'treasure', 'map']),
('object', 'Kristall', '💎', 'Ein funkelnder Kristall', 'rare', ARRAY['kristall', 'cristal', 'crystal', 'edelstein']),
('object', 'Schwert', '⚔️', 'Ein legendäres Schwert', 'rare', ARRAY['schwert', 'épée', 'sword', 'ritter']),
('object', 'Kompass', '🧭', 'Ein magischer Kompass', 'common', ARRAY['kompass', 'boussole', 'compass']),
('object', 'Buch', '📖', 'Ein verzaubertes Buch', 'common', ARRAY['buch', 'livre', 'book', 'geheimnis']),
('object', 'Krone', '👑', 'Eine goldene Krone', 'epic', ARRAY['krone', 'couronne', 'crown', 'könig']),
('object', 'Schlüssel', '🔑', 'Ein mysteriöser Schlüssel', 'common', ARRAY['schlüssel', 'clé', 'key']),
('object', 'Laterne', '🏮', 'Eine leuchtende Laterne', 'common', ARRAY['laterne', 'lanterne', 'lantern', 'licht']),
('object', 'Teleskop', '🔭', 'Ein Sternen-Teleskop', 'rare', ARRAY['teleskop', 'télescope', 'telescope', 'stern']),
('object', 'Muschel', '🐚', 'Eine singende Muschel', 'common', ARRAY['muschel', 'coquillage', 'shell', 'meer']),
('object', 'Feder', '🪶', 'Eine magische Feder', 'common', ARRAY['feder', 'plume', 'feather']),
('object', 'Ring', '💍', 'Ein verzauberter Ring', 'rare', ARRAY['ring', 'anneau', 'bague']),
('object', 'Trank', '🧪', 'Ein geheimnisvoller Trank', 'rare', ARRAY['trank', 'potion', 'zaubertrank']),
('object', 'Medaillon', '🏅', 'Ein uraltes Medaillon', 'epic', ARRAY['medaillon', 'médaillon', 'medallion']),

-- Stars (für Quiz 100%)
('star', 'Bronzestern', '⭐', 'Ein glänzender Bronzestern', 'common', ARRAY['quiz', 'stern', 'star']),
('star', 'Silberstern', '🌟', 'Ein leuchtender Silberstern', 'rare', ARRAY['quiz', 'stern', 'star']),
('star', 'Goldstern', '✨', 'Ein strahlender Goldstern', 'epic', ARRAY['quiz', 'stern', 'star']),
('star', 'Diamantstern', '💫', 'Ein funkelnder Diamantstern', 'legendary', ARRAY['quiz', 'stern', 'star']);