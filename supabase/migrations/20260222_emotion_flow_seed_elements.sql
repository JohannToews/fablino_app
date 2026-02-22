-- ============================================================
-- Emotion-Flow-Engine: Seed Data — Story Elements (Task 3.3)
-- 90 elements across 7 types:
--   15 opening_style, 10 narrative_perspective, 15 macguffin,
--   15 setting_detail, 15 humor_technique, 10 tension_technique,
--   10 closing_style
-- ON CONFLICT (element_key) DO NOTHING for idempotency.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. OPENING STYLE (15)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_sound_first', 'opening_style',
 'Start with a SOUND — a crash, a whisper, a strange melody, a crack. The protagonist reacts BEFORE the reader knows what caused it. First sentence = the sound. Second sentence = the reaction.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_question_hook', 'opening_style',
 'Start with a QUESTION the protagonist asks — out loud or in their head. A question that makes the reader curious too. Not "What should I do?" but "Why does the old tree hum at exactly 3 PM?"',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_in_medias_res', 'opening_style',
 'Start IN THE MIDDLE of the action. The protagonist is already running, hiding, climbing, or falling. NO explanation yet. The reader catches up through context. The "how we got here" comes later (or never).',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_ordinary_moment', 'opening_style',
 'Start with the most ORDINARY moment possible — eating breakfast, walking to school, staring out a window. Make it SPECIFIC and sensory. This normalcy will make the extraordinary moment that follows hit harder.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_dialogue_cold', 'opening_style',
 'Start with a line of DIALOGUE — no attribution, no setup. Just the words. "You can''t be serious." or "Don''t open that." or "I found something." The reader is immediately in a conversation.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_weather_mood', 'opening_style',
 'Start with WEATHER that mirrors the story''s mood — heavy rain for tension, impossible sunshine for irony, fog for mystery, the first warm day for hope. The weather isn''t background — it''s a character.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_countdown', 'opening_style',
 'Start with a DEADLINE or countdown — "In exactly three hours, everything would change" or "They had until sunset." Create urgency from the first sentence.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_wrong_assumption', 'opening_style',
 'Start with the protagonist being CERTAIN about something — and they''re wrong. "This was going to be the most boring day ever." (It won''t be.) The reader knows the assumption will break.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_tiny_detail', 'opening_style',
 'Start with a TINY DETAIL that seems unimportant — a crack in the wall, a missing button, a bird that sits on the same branch every morning. This detail will matter later. Plant it casually.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_smell_taste', 'opening_style',
 'Start with a SMELL or TASTE — something that triggers a memory or signals something unusual. "The hallway smelled like cinnamon, which was strange because nobody in the building baked." Unusual senses grab attention.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_animal_pov', 'opening_style',
 'Start from an ANIMAL''S perspective for 2-3 sentences — the cat watching from the windowsill, the bird above the schoolyard, the dog hearing something nobody else hears. Then shift to the protagonist.',
 ARRAY['6-7','8-9'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_list_of_three', 'opening_style',
 'Start with THREE things — "Three things happened that morning: the alarm didn''t ring, the milk was green, and there was a fox in the kitchen." The list creates intrigue and structure.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_whispered_warning', 'opening_style',
 'Start with a WARNING from someone — whispered, written in a note, or said in passing. "Whatever you do, don''t go to the old bridge after dark." Of course, the protagonist will.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_wake_up_wrong', 'opening_style',
 'Start with waking up and something is WRONG — not catastrophically, but noticeably. The room looks different. The sounds are off. Something has shifted overnight. The protagonist feels it before they see it.',
 ARRAY['6-7','8-9','10-11'], ARRAY['magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('opening_the_dare', 'opening_style',
 'Start with a DARE or CHALLENGE — from a friend, a rival, or the protagonist to themselves. "I bet you can''t..." or "What if I just..." The story is set in motion by a choice.',
 ARRAY['6-7','8-9','10-11'], ARRAY['adventure_action','real_life','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 2. NARRATIVE PERSPECTIVE (10)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_first_person', 'narrative_perspective',
 'Tell the story in FIRST PERSON. The protagonist narrates directly: "I knew it was a terrible idea, but my feet were already running." The reader is INSIDE the protagonist''s head — thoughts, doubts, all of it.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_third_close', 'narrative_perspective',
 'Tell the story in CLOSE THIRD PERSON — "she felt her stomach drop" not "one could see she was nervous." Stay close to the protagonist''s feelings and perceptions. The reader sees ONLY what the protagonist sees.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_storyteller', 'narrative_perspective',
 'Tell the story with a WARM STORYTELLER voice — like a grandparent by a fireplace. The narrator can address the reader directly: "Now, what happened next, you won''t believe..." Cozy and engaging.',
 ARRAY['6-7','8-9'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_diary', 'narrative_perspective',
 'Tell the story as DIARY ENTRIES. "Monday: Something weird happened today..." Each entry moves the story forward. The protagonist writes to themselves — honest, messy, real. Date each entry.',
 ARRAY['8-9','10-11'], ARRAY['real_life','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_letter', 'narrative_perspective',
 'Tell the story as a LETTER from the protagonist to someone — a friend, a future self, an imaginary pen pal. "Dear Oma, you won''t believe what happened..." The letter format creates intimacy and voice.',
 ARRAY['8-9','10-11'], ARRAY['real_life','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_dual', 'narrative_perspective',
 'Alternate between TWO characters'' perspectives — label each section with the character''s name. Same events, different interpretations. The reader sees the FULL picture that neither character has.',
 ARRAY['10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_dialogue_heavy', 'narrative_perspective',
 'Tell at least 60% of the story through DIALOGUE. Minimal narration. The characters reveal themselves through how they speak — their words, pauses, interruptions. "Show, don''t tell" through conversation.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_nature_narrator', 'narrative_perspective',
 'The SETTING narrates — the forest watches, the river remembers, the old house knows. Nature provides context and commentary while the protagonist acts within it. Magical realism tone.',
 ARRAY['8-9','10-11'], ARRAY['magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_present_tense', 'narrative_perspective',
 'Tell the story in PRESENT TENSE — "She opens the door. The room is dark. Something moves." Creates a cinematic, immediate feeling. The reader experiences everything AS it happens, with no hindsight.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('perspective_unreliable_child', 'narrative_perspective',
 'The child narrator gets things SLIGHTLY wrong — misunderstands adult conversations, draws wrong conclusions from right observations, sees magic where there is science (or the other way around). Charming and funny.',
 ARRAY['6-7','8-9'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 3. MACGUFFIN (15)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_changing_map', 'macguffin',
 'A MAP that changes — paths appear and disappear, X marks move, new areas reveal themselves as the protagonist grows braver.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_last_piece', 'macguffin',
 'The protagonist needs the LAST PIECE of something — the final ingredient, the missing puzzle piece, the one key that completes the set. Everyone else has given up looking for it.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_wrong_message', 'macguffin',
 'A MESSAGE (letter, note, recording) that was meant for someone else ends up with the protagonist. What do they do with it?',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_broken_thing', 'macguffin',
 'Something important is BROKEN — a promise, an object, a machine, a tradition. The protagonist tries to fix it and discovers the breaking was necessary for something new to emerge.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_borrowed_time', 'macguffin',
 'Something borrowed that MUST be returned — but returning it means giving up the power/comfort/advantage it provides.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_growing_seed', 'macguffin',
 'A SEED (literal or metaphorical) that grows unpredictably — faster than expected, in the wrong direction, producing something nobody planted. Caring for it teaches patience and acceptance.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_talking_object', 'macguffin',
 'An object that seems to COMMUNICATE — not literally talking, but responding to the protagonist. A compass that points to what you NEED (not what you want). A book that opens to relevant pages.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_fading_color', 'macguffin',
 'A COLOR that''s disappearing from the world — slowly everything turns grey/dull. The protagonist must find the source and restore it. The color represents something emotional (joy, courage, love).',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_secret_sound', 'macguffin',
 'A SOUND only the protagonist can hear — a melody, a rhythm, a hum. Following it leads somewhere important. Others think they''re imagining things.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_conditional_gift', 'macguffin',
 'A GIFT that comes with conditions — "Use it only when..." or "It works three times, then it''s gone." The protagonist must choose wisely when to use their limited resource.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_impossible_photo', 'macguffin',
 'An old PHOTOGRAPH showing something impossible — the protagonist in a place they''ve never been, a person they know in the wrong era, a building that doesn''t exist (yet).',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_incomplete_recipe', 'macguffin',
 'A RECIPE or FORMULA with one ingredient missing or unclear. Following it leads to adventure. The missing ingredient is metaphorical — "a genuine laugh" or "the sound of rain on Tuesday."',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_rebel_shadow', 'macguffin',
 'The protagonist''s SHADOW starts behaving independently — pointing at things, pulling toward something, refusing to follow. What does the shadow know that the protagonist doesn''t?',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_orphan_key', 'macguffin',
 'A KEY that doesn''t fit any visible lock. The protagonist carries it, waiting and searching. When they find the lock, what''s behind the door changes their understanding of something.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('macguffin_mystery_countdown', 'macguffin',
 'A CLOCK or TIMER counting down to something — but nobody knows WHAT. The urgency is real even though the stakes are unknown. The reveal of what the countdown means is the twist.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 4. SETTING DETAIL (15)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_first_snow', 'setting_detail',
 'The story takes place during the FIRST SNOW of the year. Everything is muffled, magical, and slightly unreal. Use the silence of snow as atmosphere.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_golden_hour', 'setting_detail',
 'The key scenes happen during GOLDEN HOUR — that warm light before sunset that makes everything glow. Time feels stretched. Shadows are long.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_market_day', 'setting_detail',
 'The story centers around a busy MARKET — smells, colors, voices, languages mixing. The protagonist navigates through the crowd. Use the market as a sensory feast.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_abandoned_place', 'setting_detail',
 'The story includes an ABANDONED PLACE — an empty house, a closed shop, a forgotten playground. What was here before? The emptiness tells a story. The protagonist fills it with imagination.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_night_adventure', 'setting_detail',
 'Key scenes happen at NIGHT — but not scary. The night is a different world: different sounds, different rules, different courage required. Moonlight and shadows. The familiar becomes mysterious.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_rainy_trapped', 'setting_detail',
 'It''s RAINING and everyone is trapped inside. The enforced closeness creates the story — conversations that wouldn''t happen otherwise, discoveries in attics or basements, staring out windows.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_tree_character', 'setting_detail',
 'There is a SIGNIFICANT TREE — old, enormous, central to the story. A climbing tree, a meeting place, a thinking spot, a hiding spot. The tree is almost a character. Describe it with love.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_underground', 'setting_detail',
 'Part of the story happens UNDERGROUND — a cave, a tunnel, a basement, a burrow. Darkness, echoes, the feel of earth. The protagonist must navigate by touch and sound. Claustrophobia or wonder.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_water_present', 'setting_detail',
 'WATER plays a role — a river to cross, a lake to explore, rain that changes plans, a flooded path. Water as obstacle, as mirror, as metaphor for change (you can''t step in the same river twice).',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_high_place', 'setting_detail',
 'A key moment happens in a HIGH PLACE — a tower, a rooftop, a treehouse, a hilltop. The world looks different from above. The height requires courage. The view provides perspective.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_kitchen_warmth', 'setting_detail',
 'The story involves a KITCHEN — cooking, smells, warmth, shared work. The kitchen is where honest conversations happen. Flour on noses, boiling pots, the rhythm of chopping and stirring.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_border_worlds', 'setting_detail',
 'The story takes place at a BORDER — where the town meets the forest, where the familiar ends and the unknown begins, where two neighborhoods touch. The threshold is where courage is needed.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_seasonal_change', 'setting_detail',
 'The story spans a SEASONAL CHANGE — the last day of summer, autumn leaves falling, the first warm day after winter. The changing season mirrors the protagonist''s inner change.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_island_isolation', 'setting_detail',
 'The story happens on or involves an ISLAND — physical or metaphorical. Separation from the familiar. Limited resources. The protagonist must be self-reliant. The sea both traps and liberates.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('setting_festival', 'setting_detail',
 'The story happens during a FESTIVAL or CELEBRATION — decorations, music, crowds, expectations. The festivity creates opportunities for things to go right AND wrong. Heightened emotions.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 5. HUMOR TECHNIQUE (15)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_exaggeration', 'humor_technique',
 'Use EXAGGERATION — if something goes wrong, it goes SPECTACULARLY wrong. The small spill becomes a flood. The tiny mistake becomes a disaster. The "slightly late" becomes running in at the last possible second.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_running_gag', 'humor_technique',
 'Include a RUNNING GAG — something that happens exactly three times. First time: surprising. Second time: "oh no, not again." Third time: the reader expects it AND it happens differently.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_misunderstanding', 'humor_technique',
 'Use a COMEDIC MISUNDERSTANDING — two characters talking about different things but thinking they''re discussing the same thing. The reader sees both sides. The reveal is hilarious.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_physical_comedy', 'humor_technique',
 'Use PHYSICAL COMEDY — slipping, tripping, things falling on heads, domino effects. Keep it cartoon-style: nobody gets HURT, just embarrassed. Sound effects help: SPLAT, CRASH, WOBBLE.',
 ARRAY['6-7','8-9'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_dramatic_irony', 'humor_technique',
 'The READER knows something the character doesn''t — we can see the banana peel, the surprise party, the hidden person. The humor comes from watching the character walk into it.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_unexpected_expert', 'humor_technique',
 'Someone who seems incompetent turns out to be an EXPERT at exactly the wrong thing — "I can''t tie my shoes but I CAN defuse this!" Absurd contrast between weakness and hidden skill.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_literal_interpretation', 'humor_technique',
 'A character takes something LITERALLY — "break a leg!" → actually tries to break furniture. "Keep your eyes peeled" → alarmed face. Works especially well with younger characters or magical beings.',
 ARRAY['6-7','8-9'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_escalating_excuses', 'humor_technique',
 'The protagonist invents ESCALATING EXCUSES — each one more ridiculous than the last. "My dog ate it" → "A bird stole it" → "A time traveler needed it" → until the truth would actually be simpler.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_wrong_genre', 'humor_technique',
 'A character BEHAVES as if they''re in the wrong genre — treating a normal school day like a spy thriller, narrating a trip to the store like an epic quest, being dramatically poetic about lunch.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_animal_reaction', 'humor_technique',
 'An ANIMAL reacts to the chaos — the cat''s unimpressed stare, the dog''s enthusiastic making-it-worse, the bird''s judgmental head-tilt. Animals as deadpan comedy sidekicks.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_sound_effects', 'humor_technique',
 'Include written SOUND EFFECTS for comedic moments — SPLORCH, THWACK, KABOING, SQUEEEAK. Let the sounds tell the story of what went wrong. Kids love reading sounds out loud.',
 ARRAY['6-7','8-9'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_snack_priority', 'humor_technique',
 'In the middle of crisis, someone is focused on FOOD — "Yes, the bridge is collapsing, but did anyone bring the sandwiches?" Absurd priorities during urgent moments.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_understatement', 'humor_technique',
 'Use UNDERSTATEMENT for comedy — massive explosion: "Well, that was louder than expected." Dragon appears: "I think we should maybe leave." The calm reaction to extreme situations.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_failed_cool', 'humor_technique',
 'The protagonist tries to have a COOL MOMENT — a dramatic entrance, a one-liner, a heroic pose — and it goes hilariously wrong. Trips, voice cracks, the door doesn''t open dramatically.',
 ARRAY['8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('humor_honest_kid', 'humor_technique',
 'A young child says something BRUTALLY HONEST that everyone else was thinking but too polite to say. "Why is your hair like that?" "This food tastes weird." Uncomfortable truth as comedy.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 6. TENSION TECHNIQUE (10)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_ticking_clock', 'tension_technique',
 'Create a TICKING CLOCK — the protagonist must finish before sunset, before the tide comes in, before someone arrives, before the last leaf falls. The deadline creates urgency in every scene.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_hidden_watcher', 'tension_technique',
 'Someone or something is WATCHING — the protagonist feels it but can''t see it. Subtle signs: a twig snapping, a shadow moving, the feeling of eyes on the back of their neck.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_dwindling_resources', 'tension_technique',
 'Resources are RUNNING OUT — the flashlight is dimming, the food is gone, they''re down to their last match/wish/chance. Each use must be weighed carefully.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_forbidden_place', 'tension_technique',
 'There is a place the protagonist has been told NOT TO GO. The story pulls them closer and closer to it. The reader knows they''ll end up there. The protagonist knows it too.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_the_secret', 'tension_technique',
 'The protagonist knows a SECRET that grows heavier with each scene. Keeping it costs something. Telling it costs something else. The tension is in the choice, not the secret itself.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_approaching_storm', 'tension_technique',
 'A STORM is coming — literal or metaphorical. The signs build: darkening sky, restless animals, dropping temperature. The protagonist must finish their task before it arrives. Nature as pressure.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_wrong_ally', 'tension_technique',
 'Someone who''s "helping" seems OFF — too eager, too knowledgeable, asking strange questions. The protagonist needs their help but doesn''t fully trust them. Tension in every interaction.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_no_return', 'tension_technique',
 'A clear POINT OF NO RETURN — crossing this line means they can''t go back. The door that locks behind them, the bridge that breaks, the word that can''t be unsaid. Build to the crossing.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_parallel_danger', 'tension_technique',
 'Two threats happening SIMULTANEOUSLY — the protagonist must handle both but can only be in one place. The tension of choosing which problem to solve first.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('tension_the_silence', 'tension_technique',
 'Use SILENCE as tension — everything goes quiet. Too quiet. The absence of sound is louder than noise. What stopped making sound? And why? The protagonist holds their breath.',
 ARRAY['8-9','10-11'], ARRAY['adventure_action','magic_fantasy','surprise'], NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 7. CLOSING STYLE (10)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_echo_opening', 'closing_style',
 'End with an ECHO of the opening — the same sound, image, or phrase from the first paragraph, but now it means something different. The repetition shows how far the protagonist has come.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_looking_forward', 'closing_style',
 'End by looking FORWARD — not wrapping everything up, but opening a new possibility. The protagonist sees something new on the horizon. The story ends, but the life continues.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_quiet_moment', 'closing_style',
 'End with a QUIET MOMENT — sitting on a step, watching the sunset, lying in bed replaying the day. After all the action, the stillness is the most powerful scene. Let the reader breathe.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_shared_laugh', 'closing_style',
 'End with SHARED LAUGHTER — the protagonist and someone else, laughing about what happened. The laughter is relief, connection, and the signal that everything is okay.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_small_ritual', 'closing_style',
 'End with a SMALL RITUAL — a handshake, a shared meal, a new tradition, putting something in a special place. The ritual marks the change and makes it real.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_the_return', 'closing_style',
 'End with RETURNING to a familiar place — home, school, the protagonist''s room. But they see it differently now. The place hasn''t changed. They have.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_last_surprise', 'closing_style',
 'End with ONE LAST SURPRISE — a tiny twist after the resolution. Not a cliffhanger, but a wink. The map has a new mark. The creature left something behind. A note appears.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_passing_on', 'closing_style',
 'End with the protagonist PASSING SOMETHING ON — the knowledge, the gift, the courage, the secret — to someone else who needs it. The cycle continues. They received, now they give.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_falling_asleep', 'closing_style',
 'End with the protagonist FALLING ASLEEP — exhausted, satisfied, smiling. Maybe they''re already dreaming about tomorrow. The cosiest possible ending. Perfect for bedtime stories.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;

INSERT INTO story_elements (element_key, element_type, content_en, age_groups, compatible_themes, compatible_categories, weight, is_active) VALUES
('closing_unanswered_question', 'closing_style',
 'End with a QUESTION that isn''t answered — not frustrating, but intriguing. "And sometimes, late at night, they still wonder..." The reader gets to imagine the answer. Open-ended wonder.',
 ARRAY['6-7','8-9','10-11'], NULL, NULL, 10, true)
ON CONFLICT (element_key) DO NOTHING;
