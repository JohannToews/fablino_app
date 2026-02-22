-- ============================================================
-- Emotion-Flow-Engine: Seed Data — Character Seeds (Task 3.2)
-- 30 human protagonists + 12 mythical protagonists
-- + 10 sidekick archetypes + 8 antagonist archetypes = 60 total
-- ON CONFLICT (seed_key) DO NOTHING for idempotency.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- A) PROTAGONIST APPEARANCES — Human (P01-P30)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P01
('west_african_girl', 'protagonist_appearance', 'human',
 '{"de": "Westafrikanisches Mädchen", "en": "West African Girl"}',
 'Dark brown skin, tightly coiled black hair in two puffs with colorful hair ties, wide bright eyes, gap-toothed smile, wears a bright yellow top with bold patterns',
 'Curious and talkative — asks questions about EVERYTHING, especially ''but WHY?''',
 'Talks when she should listen, sometimes misses important details because she''s already asking the next question',
 'Her relentless questions lead to discoveries nobody else would make',
 'west_african', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Amara", "Nia", "Adaeze", "Serwaa", "Yaa"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P02
('east_asian_boy', 'protagonist_appearance', 'human',
 '{"de": "Ostasiatischer Junge", "en": "East Asian Boy"}',
 'Light golden-brown skin, straight black hair with a messy fringe that falls into his eyes, sharp observant eyes, slim build, wears a too-big hoodie with the sleeves pushed up',
 'Quiet observer who notices everything — patterns, details, things that are out of place',
 'Overthinks instead of acting, gets stuck in analysis paralysis',
 'When he finally speaks, his observations are so precise they change the entire plan',
 'east_asian', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Hiro", "Jun", "Kai", "Sora", "Ren"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P03
('south_asian_girl', 'protagonist_appearance', 'human',
 '{"de": "Südasiatisches Mädchen", "en": "South Asian Girl"}',
 'Warm brown skin, long thick black hair in a single braid with a red ribbon, dark expressive eyes, bright smile, wears colorful clothes — always at least one thing in orange',
 'Natural organizer — immediately starts making plans and assigning roles',
 'Bossy when stressed, has trouble when things go off-plan',
 'Her organization saves the group when chaos strikes — she''s the calm in the storm',
 'south_asian', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Priya", "Ananya", "Devi", "Meera", "Zara"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P04
('nordic_boy', 'protagonist_appearance', 'human',
 '{"de": "Nordischer Junge", "en": "Nordic Boy"}',
 'Fair skin with rosy cheeks, messy sandy-blond hair, blue-grey eyes, freckles across the nose, sturdy build, wears rubber boots in every weather',
 'Hands-on builder — solves problems by making things, always has pockets full of useful junk',
 'Impatient with talking and planning — wants to START building before the plan is finished',
 'Can build or fix almost anything with whatever''s available',
 'nordic', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Finn", "Lars", "Erik", "Nils", "Sven"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P05
('middle_eastern_girl', 'protagonist_appearance', 'human',
 '{"de": "Nahöstliches Mädchen", "en": "Middle Eastern Girl"}',
 'Olive skin, thick dark wavy hair often held back with a headband, large dark eyes with long lashes, determined expression, wears practical clothes with colorful sneakers',
 'Fiercely fair — cannot stand injustice, will speak up even when it''s risky',
 'Her sense of justice can be rigid — sees things in black and white before learning nuance',
 'When she stands up for someone, others find their courage too',
 'middle_eastern', 'female', ARRAY['8-9','10-11'],
 '{"female": ["Layla", "Noor", "Yasmin", "Samira", "Dina"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P06
('latin_american_boy', 'protagonist_appearance', 'human',
 '{"de": "Lateinamerikanischer Junge", "en": "Latin American Boy"}',
 'Warm tan skin, thick dark curly hair, bright brown eyes full of mischief, dimples when smiling (which is often), wears a favorite faded t-shirt with a cartoon character',
 'Natural storyteller — exaggerates everything into an epic tale, makes boring things sound exciting',
 'Sometimes his stories stretch the truth too far — the line between imagination and lying gets blurry',
 'His storytelling inspires others and turns ordinary situations into adventures',
 'latin_american', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Mateo", "Santiago", "Diego", "Rafael", "Lucas"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P07
('eastern_european_girl', 'protagonist_appearance', 'human',
 '{"de": "Osteuropäisches Mädchen", "en": "Eastern European Girl"}',
 'Fair skin, straight light brown hair in a ponytail, grey-green eyes, serious expression that breaks into a surprising laugh, wears a denim jacket with patches she collected',
 'Logical thinker — approaches every problem like a puzzle to be solved',
 'Dismisses feelings as ''illogical,'' struggles when emotions ARE the point',
 'When everyone else panics, she stays calm and thinks clearly',
 'eastern_european', 'female', ARRAY['8-9','10-11'],
 '{"female": ["Mila", "Kira", "Daria", "Lena", "Anja"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P08
('caribbean_boy', 'protagonist_appearance', 'human',
 '{"de": "Karibischer Junge", "en": "Caribbean Boy"}',
 'Dark brown skin, short tight curls with a lightning-bolt pattern shaved on the side, warm brown eyes, athletic build, always wearing bright colors — especially green and gold',
 'Energetic and physical — runs everywhere, climbs everything, communicates with his whole body',
 'Can''t sit still, finds it hard to be patient or wait for slow things to happen',
 'His physical courage and energy get the group through obstacles nobody else would attempt',
 'caribbean', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Jaylen", "Marcus", "Kofi", "Andre", "Caleb"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P09
('southeast_asian_girl', 'protagonist_appearance', 'human',
 '{"de": "Südostasiatisches Mädchen", "en": "Southeast Asian Girl"}',
 'Golden-brown skin, straight dark hair cut in a practical bob, almond-shaped dark eyes, small but sturdy, wears a backpack that seems too big for her — it''s full of supplies',
 'Always prepared — has the right thing in her bag for every situation',
 'Relies on preparation so much that she freezes when surprised by the truly unexpected',
 'Her preparation saves the day at least once — ''I KNEW we''d need this!''',
 'southeast_asian', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Mai", "Linh", "Sari", "Lani", "Aya"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P10
('mixed_heritage_boy', 'protagonist_appearance', 'human',
 '{"de": "Junge mit gemischtem Erbe", "en": "Mixed Heritage Boy"}',
 'Medium brown skin, loose dark curls, hazel eyes that look different colors in different light, tall and lanky, wears mismatched socks on purpose',
 'Bridge-builder — naturally connects different groups, speaks ''everyone''s language''',
 'Tries so hard to belong everywhere that sometimes he doesn''t feel he belongs anywhere',
 'Sees connections between things/people that others miss, brings unlikely allies together',
 'mixed', 'male', ARRAY['8-9','10-11'],
 '{"male": ["Noah", "Leo", "Elias", "Malik", "Sam"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P11
('indigenous_australian_girl', 'protagonist_appearance', 'human',
 '{"de": "Indigenes australisches Mädchen", "en": "Indigenous Australian Girl"}',
 'Deep brown skin, dark brown wavy hair worn loose, dark eyes that seem to see far distances, bare feet whenever possible, wears a woven bracelet she made herself',
 'Deep listener — hears things others miss, from nature and from people',
 'So tuned into others'' feelings that she sometimes forgets her own needs',
 'Her deep listening reveals truths that change the whole group''s understanding',
 'oceanian', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Aria", "Tala", "Kaia", "Mia", "Jira"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P12
('central_european_boy', 'protagonist_appearance', 'human',
 '{"de": "Mitteleuropäischer Junge", "en": "Central European Boy"}',
 'Light skin, short dark brown hair neatly combed (but one bit always sticks up), brown eyes behind round glasses, thoughtful expression, wears button-up shirts with rolled sleeves',
 'Bookworm and fact-collector — knows random information about everything',
 'Hides behind facts when feelings get uncomfortable, can be a know-it-all',
 'His random knowledge is exactly what''s needed in the strangest situations',
 'central_european', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Jonas", "Felix", "Anton", "Theo", "Paul"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P13
('north_african_girl', 'protagonist_appearance', 'human',
 '{"de": "Nordafrikanisches Mädchen", "en": "North African Girl"}',
 'Warm olive-brown skin, thick dark curly hair often in a bun with loose strands, deep brown eyes, expressive hands that talk as much as her mouth, wears silver earrings',
 'Creative improviser — turns anything into art or a game, sees beauty in unexpected places',
 'Gets so lost in creative flow that she forgets practical things like time, food, or the actual task',
 'Her creative thinking solves problems that logical approaches can''t crack',
 'north_african', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Lina", "Amira", "Selma", "Hana", "Nadia"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P14
('west_european_boy', 'protagonist_appearance', 'human',
 '{"de": "Westeuropäischer Junge", "en": "West European Boy"}',
 'Light skin, wavy reddish-brown hair, green eyes, freckles everywhere, medium build, wears a striped shirt and always has grass stains on his knees',
 'Natural comedian — sees the funny side of everything, uses humor to lighten tense situations',
 'Uses humor to avoid dealing with serious emotions — deflects with jokes when he should listen',
 'His humor breaks tension and helps others relax enough to think clearly',
 'west_european', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Arthur", "Louis", "Hugo", "Oscar", "Jules"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P15
('east_african_girl', 'protagonist_appearance', 'human',
 '{"de": "Ostafrikanisches Mädchen", "en": "East African Girl"}',
 'Rich dark brown skin, black hair in neat cornrows with beads, bright alert eyes, quick smile, wiry and fast, wears a beaded necklace she treasures',
 'Fastest runner and quickest thinker — acts on instinct, trusts her gut',
 'Acts before thinking, sometimes has to fix problems her impulsiveness created',
 'In emergencies, her quick instincts save the day while others are still processing',
 'east_african', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Amani", "Zuri", "Imani", "Neema", "Aisha"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P16
('south_european_boy', 'protagonist_appearance', 'human',
 '{"de": "Südeuropäischer Junge", "en": "South European Boy"}',
 'Olive skin, thick dark wavy hair that''s always a bit too long, dark eyes, expressive face that shows every emotion, wears a favorite scarf even in summer',
 'Passionate about everything — loves deeply, argues fiercely, laughs loudly',
 'His intensity can overwhelm quieter people, doesn''t always read the room',
 'His passion is contagious — when he believes in something, everyone ends up believing too',
 'south_european', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Marco", "Luca", "Pablo", "Nico", "Tiago"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P17
('south_american_girl', 'protagonist_appearance', 'human',
 '{"de": "Südamerikanisches Mädchen", "en": "South American Girl"}',
 'Light brown skin, long straight dark hair with a flower tucked behind one ear, dark eyes with golden flecks, warm smile, wears hand-knit sweater in bright colors',
 'Natural healer and peacemaker — brings calm to conflicts, tends to the hurt',
 'Avoids conflict so strongly that she sometimes doesn''t stand up for herself',
 'Her calming presence helps others think clearly and find solutions together',
 'south_american', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Luna", "Sofia", "Camila", "Valentina", "Isabella"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P18
('central_asian_boy', 'protagonist_appearance', 'human',
 '{"de": "Zentralasiatischer Junge", "en": "Central Asian Boy"}',
 'Tan skin, straight black hair cut short on the sides, dark almond-shaped eyes, compact and strong, wears a leather bracelet and practical outdoor clothes',
 'Silent and reliable — doesn''t say much, but when he acts, it matters',
 'His quietness is sometimes mistaken for not caring, struggles to express feelings in words',
 'Shows care through actions — the person who quietly carries the heaviest bag, fixes the broken thing, stays longest',
 'central_asian', 'male', ARRAY['8-9','10-11'],
 '{"male": ["Timur", "Amir", "Dastan", "Emir", "Arman"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P19
('pacific_islander_girl', 'protagonist_appearance', 'human',
 '{"de": "Pazifisches Inselmädchen", "en": "Pacific Islander Girl"}',
 'Brown skin, long thick wavy dark hair with natural highlights, big warm brown eyes, broad shoulders, strong build, wears a flower crown she makes from whatever''s blooming',
 'Generous and community-minded — shares everything, thinks of the group first',
 'Gives too much, sometimes neglects her own needs to help others',
 'Her generosity creates loyalty — people would do anything for her because she''s done everything for them',
 'oceanian', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Moana", "Leilani", "Sina", "Tia", "Mele"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P20
('northern_european_gender_neutral', 'protagonist_appearance', 'human',
 '{"de": "Nordeuropäisches Kind", "en": "Northern European Gender-Neutral"}',
 'Light skin, short tousled blond hair, bright blue eyes, slim build, wears overalls with lots of pockets and colorful patches, paint under fingernails',
 'Artistic dreamer — sees the world as shapes, colors, and possibilities',
 'Gets lost in imagination and misses practical details right in front of them',
 'Their creative vision reveals solutions that look impossible until you see them drawn out',
 'nordic', 'neutral', ARRAY['6-7','8-9','10-11'],
 '{"neutral": ["Robin", "Alex", "Kim", "Noa", "Sky"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P21
('romani_boy', 'protagonist_appearance', 'human',
 '{"de": "Roma-Junge", "en": "Romani Boy"}',
 'Dark curly hair, olive skin, bright eyes, wears a well-worn leather vest',
 'Streetwise and resourceful — finds solutions in places others wouldn''t look',
 'Distrusts authority even when help is genuine',
 'His resourcefulness in tough situations is unmatched — thrives where others freeze',
 'eastern_european', 'male', ARRAY['8-9','10-11'],
 '{"male": ["Danilo", "Mirko", "Stefan", "Lazar", "Nikola"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P22
('korean_girl', 'protagonist_appearance', 'human',
 '{"de": "Koreanisches Mädchen", "en": "Korean Girl"}',
 'Straight black hair with bangs, light golden skin, precise movements, neat appearance',
 'Perfectionist and determined — won''t stop until it''s exactly right',
 'Can''t start until conditions are perfect — paralysis by perfectionism',
 'When she commits, the result is flawless — her attention to detail catches what everyone else misses',
 'east_asian', 'female', ARRAY['8-9','10-11'],
 '{"female": ["Minji", "Soyeon", "Hana", "Yuna", "Jisoo"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P23
('nigerian_boy', 'protagonist_appearance', 'human',
 '{"de": "Nigerianischer Junge", "en": "Nigerian Boy"}',
 'Dark brown skin, short hair, tall for his age, commanding presence',
 'Natural leader, confident voice — takes charge in group situations',
 'Assumes leadership without asking, sometimes steamrolls quiet voices',
 'In a crisis, his clear direction keeps the group together when they''d otherwise scatter',
 'west_african', 'male', ARRAY['8-9','10-11'],
 '{"male": ["Chidi", "Emeka", "Oluwaseun", "Kalu", "Tunde"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P24
('turkish_girl', 'protagonist_appearance', 'human',
 '{"de": "Türkisches Mädchen", "en": "Turkish Girl"}',
 'Olive skin, dark hair in a loose braid, kind eyes, colorful scarf',
 'Warm diplomat, connects people — finds common ground where others see only differences',
 'Puts harmony above truth sometimes — avoids necessary confrontation',
 'Her diplomatic skill turns enemies into allies and fractured groups into teams',
 'middle_eastern', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Elif", "Defne", "Zeynep", "Aylin", "Ceren"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P25
('mixed_asian_european_boy', 'protagonist_appearance', 'human',
 '{"de": "Junge mit asiatisch-europäischem Erbe", "en": "Mixed Asian-European Boy"}',
 'Light brown skin, wavy dark hair, glasses, always taking things apart',
 'Tech-curious tinkerer — understands how things work by disassembling them',
 'Gets frustrated when things can''t be fixed with logic',
 'His technical understanding saves the group when a mechanical or logical solution is needed',
 'mixed', 'male', ARRAY['8-9','10-11'],
 '{"male": ["Liam", "Kenji", "Max", "Ryo", "Ben"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P26
('brazilian_girl', 'protagonist_appearance', 'human',
 '{"de": "Brasilianisches Mädchen", "en": "Brazilian Girl"}',
 'Warm brown skin, big dark curls, always dancing or tapping a rhythm',
 'Rhythmic and expressive — moves to music that only she seems to hear, full of life',
 'Attention-seeking when anxious — gets louder when she should get quieter',
 'Her expressiveness breaks through awkwardness and inspires others to let loose',
 'latin_american', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Beatriz", "Clara", "Marina", "Luísa", "Ana"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P27
('scandinavian_girl', 'protagonist_appearance', 'human',
 '{"de": "Skandinavisches Mädchen", "en": "Scandinavian Girl"}',
 'Fair skin, long blonde braid, calm grey eyes, outdoor clothes, sturdy hiking boots',
 'Quiet bravery — acts without announcing, does the hard thing without drama',
 'So independent she refuses help even when she needs it',
 'Her silent courage inspires others more than any speech could',
 'nordic', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Astrid", "Sigrid", "Ingrid", "Freya", "Saga"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P28
('south_asian_boy', 'protagonist_appearance', 'human',
 '{"de": "Südasiatischer Junge", "en": "South Asian Boy"}',
 'Brown skin, dark hair, soft eyes, wears a hand-me-down watch he treasures',
 'Gentle and empathetic — reads emotions like a book, knows how everyone is feeling',
 'Absorbs others'' sadness, forgets to protect his own feelings',
 'His emotional intelligence helps the group navigate feelings that would otherwise tear them apart',
 'south_asian', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Arjun", "Rohan", "Ravi", "Kiran", "Dev"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P29
('mediterranean_gender_neutral', 'protagonist_appearance', 'human',
 '{"de": "Mediterranes Kind", "en": "Mediterranean Gender-Neutral"}',
 'Olive skin, short dark hair, curious expression, carries a small notebook everywhere',
 'Collector of stories and secrets — always watching, always writing things down',
 'Knows everyone''s secrets but struggles with their own — observes others to avoid looking inward',
 'Their collected observations reveal the truth at the crucial moment',
 'south_european', 'neutral', ARRAY['8-9','10-11'],
 '{"neutral": ["Sasha", "Andrea", "Noel", "Kai", "Remy"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- P30
('indigenous_american_boy', 'protagonist_appearance', 'human',
 '{"de": "Indigener amerikanischer Junge", "en": "Indigenous American Boy"}',
 'Medium brown skin, straight dark hair, steady dark eyes, wears a carved pendant',
 'Connected to nature, patient observer — notices what the land is telling him',
 'Uncomfortable in indoor/urban settings, can seem distant when overwhelmed',
 'His nature-connection reveals paths, warnings, and solutions that others can''t see',
 'indigenous_american', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Koda", "Takoda", "Ahanu", "Chayton", "Nikan"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- B) PROTAGONIST APPEARANCES — Mythical Creatures (FM01-FM12)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM01
('wise_fox', 'protagonist_appearance', 'mythical',
 '{"de": "Schlaues Fuchsmädchen", "en": "Wise Fox"}',
 'Sleek orange-red fur with a white-tipped bushy tail, bright amber eyes that gleam with mischief, pointed ears that swivel toward every sound, small and agile, wears a tiny scarf made of woven leaves',
 'Clever and quick-witted — always three steps ahead, solves problems with cunning rather than force',
 'Overconfident in her own cleverness, sometimes outsmarts herself',
 'Her cunning plans save the day when brute force fails',
 'mythical', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Finja", "Roux", "Kitsune", "Vulpa", "Fennah"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM02
('small_dragon', 'protagonist_appearance', 'mythical',
 '{"de": "Kleiner unsicherer Drache", "en": "Small Insecure Dragon"}',
 'Emerald-green scales with a golden belly, tiny crumpled wings that don''t quite work yet, big round eyes with slit pupils, a tail he keeps tripping over, smoke puffs out when he sneezes',
 'Wants desperately to be brave and fierce like the big dragons, but is actually gentle and uncertain',
 'Terrified of heights (ironic for a dragon), his fire comes out as hiccup-sparks at the worst moments',
 'His gentleness is his real power — the courage to be soft in a world that expects dragons to be fierce',
 'mythical', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Zünd", "Flick", "Ember", "Ignis", "Funke"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM03
('talking_cat', 'protagonist_appearance', 'mythical',
 '{"de": "Straßenkatze mit großer Klappe", "en": "Talking Street Cat"}',
 'Scrappy grey tabby with one torn ear and street-smart eyes, patchy fur that''s seen better days, walks with a swagger, always lands on her feet, wears a bent bottle cap as a medallion',
 'Sarcastic and streetwise with a big mouth — talks tough but has a heart of gold underneath',
 'Her sharp tongue hurts feelings before she realizes it, pushes away kindness she secretly wants',
 'Knows every shortcut, every secret, every trick — the ultimate survivor who teaches others resilience',
 'mythical', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Minka", "Pfote", "Scratch", "Gata", "Whisker"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM04
('forest_spirit', 'protagonist_appearance', 'mythical',
 '{"de": "Scheues Waldwesen", "en": "Shy Forest Spirit"}',
 'A translucent figure made of woven moss, fern leaves, and soft golden light, mushrooms grow on its shoulders, eyes like dewdrops catching sunlight, leaves rustle when it moves, barely visible in dappled forest light',
 'Shy and gentle — speaks in whispers, communicates more through showing than telling',
 'So shy it becomes invisible when startled, sometimes can''t make itself heard when it matters most',
 'Understands the language of the forest — can ask trees for help, calm storms, find any path through the woods',
 'mythical', 'neutral', ARRAY['6-7','8-9','10-11'],
 '{"neutral": ["Moos", "Farn", "Lumi", "Sylva", "Flimmer"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM05
('brave_mouse', 'protagonist_appearance', 'mythical',
 '{"de": "Winzige mutige Maus", "en": "Brave Little Mouse"}',
 'Tiny grey-brown mouse with enormous round ears, whiskers that twitch with determination, wears a thimble as a helmet and carries a sewing needle as a sword, stands on hind legs with chest puffed out',
 'Believes she is ENORMOUS and FIERCE — charges into danger without hesitation, gives rousing speeches to creatures a hundred times her size',
 'Completely unaware of her actual size, her bravery borders on recklessness',
 'Her fearless attitude is contagious — when a tiny mouse charges a mountain, bigger creatures feel ashamed to be afraid',
 'mythical', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Pip", "Mausel", "Braveheart", "Squeaka", "Tiny"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM06
('cloud_bear', 'protagonist_appearance', 'mythical',
 '{"de": "Sanfter Wolkenbär", "en": "Cloud Bear"}',
 'A bear made of soft white cloud-stuff, slightly translucent with a pearly sheen, floats a few centimeters above the ground, leaves tiny rain puddles when sad, glows warm gold when happy, fluffy and huggable',
 'Endlessly gentle and comforting — radiates calm, gives the best hugs in any world',
 'Too soft for conflict, literally starts raining (crying) when voices are raised',
 'His calming presence stops fights, soothes fears, and makes everyone feel safe enough to be honest',
 'mythical', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Cumulus", "Wölki", "Nimbus", "Fluff", "Stratos"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM07
('star_hare', 'protagonist_appearance', 'mythical',
 '{"de": "Leuchtender Sternhase", "en": "Star Hare"}',
 'Silver-white fur that glows faintly in the dark with tiny star-like sparkles, long luminous ears that light up when excited, dark eyes like the night sky with actual constellations in them, long powerful legs',
 'Dreamer and night-wanderer — comes alive after dark, knows every star by name, sees beauty in darkness',
 'Sleepy and sluggish during daytime, misses important daytime events because he''s napping',
 'His glow lights the way through any darkness — literal and emotional. When things seem hopeless, his light reminds others that stars exist',
 'mythical', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Stella", "Glimm", "Noktis", "Astro", "Funkel"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM08
('river_otter', 'protagonist_appearance', 'mythical',
 '{"de": "Verspielter Flussotter", "en": "Playful River Otter"}',
 'Sleek brown fur that''s always wet and shiny, bright curious eyes, webbed paws, a long rudder tail, carries a favorite shiny pebble everywhere, can''t stop sliding down things',
 'Endlessly playful and curious — turns everything into a game, finds fun in the most serious situations',
 'CANNOT sit still or be serious for more than thirty seconds, his playfulness derails important moments',
 'His playful approach accidentally solves problems that serious thinking couldn''t crack — play IS his problem-solving method',
 'mythical', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Splash", "Rutsch", "Glitsch", "Plätsch", "Slide"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM09
('old_owl', 'protagonist_appearance', 'mythical',
 '{"de": "Alte weise Eule", "en": "Old Pretend-Wise Owl"}',
 'Large tawny owl with ruffled feathers that look like a professor''s tweed jacket, half-moon spectacles perched on the beak, dignified posture that sometimes wobbles, one feather always sticking up',
 'Acts like she knows EVERYTHING — speaks in riddles and proverbs, gives advice nobody asked for',
 'Actually wrong about half the things she says with such confidence, too proud to admit mistakes',
 'When she IS right, her wisdom is genuinely profound — and her wrong answers are so confidently wrong they''re hilarious',
 'mythical', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Athena", "Kluge", "Hoot", "Sage", "Uhu"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM10
('stone_troll', 'protagonist_appearance', 'mythical',
 '{"de": "Tollpatschiger Steintroll", "en": "Clumsy Stone Troll"}',
 'Made of rough grey-brown rock with moss growing in the cracks, enormous but with a gentle face, tiny pebble eyes that look worried, hands too big for anything delicate, flowers grow in his head-cracks',
 'Sweet-natured and desperately careful, but SO big that he breaks things just by existing',
 'Breaks everything he touches — doors, chairs, cups, feelings. His bigness is his constant frustration',
 'His strength is unstoppable when he finally lets go of trying to be small — he can move mountains when the moment calls for it',
 'mythical', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Brösel", "Rumble", "Klotz", "Boulder", "Fels"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM11
('wind_fairy', 'protagonist_appearance', 'mythical',
 '{"de": "Windgeist", "en": "Wind Fairy"}',
 'Nearly invisible — a shimmer in the air, a swirl of flower petals and dandelion seeds that suggest a small figure, hair that IS the wind, tiny translucent wings that hum, leaves a trail of gentle breezes',
 'Knows everyone''s secrets because she rides the wind that carries whispers — a gossip with a conscience',
 'Can''t keep secrets well — the wind carries her words further than she intends',
 'Her secret-knowledge helps uncover truths, solve mysteries, and connect people who didn''t know they needed each other',
 'mythical', 'female', ARRAY['6-7','8-9','10-11'],
 '{"female": ["Zephyra", "Brise", "Windi", "Aura", "Hauch"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
-- FM12
('mushroom_gnome', 'protagonist_appearance', 'mythical',
 '{"de": "Winziger Pilzwichtel", "en": "Tiny Mushroom Gnome"}',
 'Knee-high gnome with a large red-and-white spotted mushroom cap as a hat, earthy brown skin like tree bark, a round belly, a long white beard with tiny mushrooms growing in it, carries a walking stick made from a twig',
 'Underground expert — knows every tunnel, root system, and hidden passage. Grumpy exterior, warm interior.',
 'Grumpy and stubborn, insists his way is the ONLY way, hates change and anything above ground',
 'His underground knowledge reveals hidden paths, buried treasures, and secret connections nobody suspected',
 'mythical', 'male', ARRAY['6-7','8-9','10-11'],
 '{"male": ["Pilzi", "Spore", "Grummel", "Wurzel", "Truffle"]}',
 10, true)
ON CONFLICT (seed_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- C) SIDEKICK ARCHETYPES (S01-S10)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('loyal_skeptic', 'sidekick_archetype', 'human',
 '{"de": "Loyaler Skeptiker", "en": "Loyal Skeptic"}',
 NULL,
 'Always says ''this is a bad idea'' but comes along anyway. Worries FOR the group.',
 'Worries so much they sometimes hold the group back',
 'Their caution saves the group when the plan goes wrong — ''I TOLD you so'' (but helps anyway)',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('comic_relief', 'sidekick_archetype', 'human',
 '{"de": "Komische Erleichterung", "en": "Comic Relief"}',
 NULL,
 'Makes everything funny. Falls over things, says the wrong thing at the wrong time, laughs at danger.',
 'Can''t be serious even when the situation demands it',
 'Lightens the mood when fear or frustration peaks — their joke at the worst moment is exactly what''s needed',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('quiet_genius', 'sidekick_archetype', 'human',
 '{"de": "Stilles Genie", "en": "Quiet Genius"}',
 NULL,
 'Barely speaks. When they do, it''s the most important sentence of the day.',
 'Frustratingly uncommunicative — knows the answer but won''t share until asked directly',
 'The ONE sentence they say changes the entire plan or reveals the hidden truth',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('enthusiastic_rookie', 'sidekick_archetype', 'human',
 '{"de": "Begeisterter Neuling", "en": "Enthusiastic Rookie"}',
 NULL,
 'Everything is AMAZING and EXCITING and they''ve NEVER done this before! Boundless energy and zero experience.',
 'Dangerously naive — their excitement creates problems the experienced characters have to fix',
 'Their fresh perspective sees solutions the experienced characters are blind to',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('reluctant_expert', 'sidekick_archetype', 'human',
 '{"de": "Widerwilliger Experte", "en": "Reluctant Expert"}',
 NULL,
 'Knows everything about THIS topic but insists they don''t want to be involved.',
 'Pretends not to care while clearly caring. Won''t commit until the last possible moment.',
 'When they FINALLY commit, their expertise is exactly what was missing',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('fierce_protector', 'sidekick_archetype', 'human',
 '{"de": "Wilder Beschützer", "en": "Fierce Protector"}',
 NULL,
 'Small but fierce. Protective of the group, especially the vulnerable members. Will fight anything.',
 'Overprotective — sometimes fights threats that aren''t there, or prevents others from taking necessary risks',
 'Their fierce loyalty gives others courage they wouldn''t have alone',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_translator', 'sidekick_archetype', 'human',
 '{"de": "Der Übersetzer", "en": "The Translator"}',
 NULL,
 'Understands what everyone means, even when they say it wrong. Bridges misunderstandings.',
 'So focused on making everyone understand each other that they forget to express their OWN needs',
 'Resolves conflicts by helping both sides hear what the other actually means',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('chaos_agent', 'sidekick_archetype', 'human',
 '{"de": "Chaos-Agent", "en": "Chaos Agent"}',
 NULL,
 'Has wild ideas that SOUND terrible but sometimes work brilliantly. Lives to break the rules.',
 'Their wild ideas fail more often than they work — they leave messes for others to clean up',
 'The ONE time their crazy idea works, it''s the only thing that could have worked',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_documentarian', 'sidekick_archetype', 'human',
 '{"de": "Der Dokumentar", "en": "The Documentarian"}',
 NULL,
 'Records everything — draws pictures, takes notes, remembers exact quotes. The group''s memory.',
 'So busy documenting the adventure that they sometimes forget to PARTICIPATE in it',
 'Their records reveal patterns nobody noticed, or prove something crucial at the key moment',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('animal_companion', 'sidekick_archetype', 'human',
 '{"de": "Tierischer Begleiter", "en": "Animal Companion"}',
 NULL,
 'Not a person — a loyal animal with personality. Understands more than it should. Communicates through behavior.',
 'Can''t explain what it knows — acts in ways that seem random until the pattern becomes clear',
 'Senses danger before anyone, finds hidden things, provides comfort without words',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- D) ANTAGONIST ARCHETYPES (A01-A08)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_scared_bully', 'antagonist_archetype', 'human',
 '{"de": "Der ängstliche Raufbold", "en": "The Scared Bully"}',
 NULL,
 'Acts tough and mean, but underneath is scared — of being seen as weak, of losing control, of their own situation at home',
 'The mask of toughness is exhausting to maintain — cracks when shown genuine kindness',
 'Controls others because their own life feels out of control. A moment where the mask slips and the fear shows through.',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_jealous_friend', 'antagonist_archetype', 'human',
 '{"de": "Der eifersüchtige Freund", "en": "The Jealous Friend"}',
 NULL,
 'Used to be close to the protagonist, now acts cold or sabotaging. Jealousy eats at them.',
 'Feels replaced, left behind, or inferior. Their actions are a distorted cry for attention.',
 'When confronted, they break down: ''I just missed you''. The friendship can be rebuilt.',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_well_meaning_controller', 'antagonist_archetype', 'human',
 '{"de": "Der wohlmeinende Kontrolleur", "en": "The Well-Meaning Controller"}',
 NULL,
 'An adult or older kid who restricts the protagonist ''for their own good.'' Genuinely cares, but smothers.',
 'Love expressed as control. Has experienced loss and is terrified of it happening again.',
 'Realizes they''re protecting themselves, not the protagonist. Can learn to let go.',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_rule_worshipper', 'antagonist_archetype', 'human',
 '{"de": "Der Regelanbeter", "en": "The Rule Worshipper"}',
 NULL,
 'Follows every rule rigidly. Reports infractions. Can''t understand why anyone would break a rule.',
 'Rules make the world safe and predictable. Without them, everything is chaos — and chaos is terrifying.',
 'A situation where the rules clearly cause harm forces a choice between rules and kindness.',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_rival', 'antagonist_archetype', 'human',
 '{"de": "Der Rivale", "en": "The Rival"}',
 NULL,
 'Competes with the protagonist for the same thing — a position, a prize, someone''s attention. Talented and driven.',
 'Needs to win because winning is the only way they feel valued. Second place means invisible.',
 'Mutual respect after genuine competition — ''You''re actually good at this''.',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_trickster', 'antagonist_archetype', 'human',
 '{"de": "Der Trickser", "en": "The Trickster"}',
 NULL,
 'Manipulates through charm and cleverness. Gets others to do things by making it seem like THEIR idea.',
 'Learned that being direct doesn''t work. Has been ignored or punished for honesty.',
 'When someone sees through the trick AND still helps — being seen is what they actually needed.',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_pack_leader', 'antagonist_archetype', 'human',
 '{"de": "Der Anführer", "en": "The Pack Leader"}',
 NULL,
 'Leader of a group that excludes or pressures others. Sets the social rules.',
 'Terrified of being on the outside. Maintains control of the group because being alone is unbearable.',
 'A moment alone reveals the loneliness underneath the social power.',
 NULL, 'neutral', ARRAY['8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;

INSERT INTO character_seeds (seed_key, seed_type, creature_type, labels, appearance_en, personality_trait_en, weakness_en, strength_en, cultural_background, gender, age_range, name_pool, weight, is_active)
VALUES
('the_careless_one', 'antagonist_archetype', 'human',
 '{"de": "Der Gedankenlose", "en": "The Careless One"}',
 NULL,
 'Not intentionally mean — just thoughtless. Hurts others through inattention, selfishness, or obliviousness.',
 'Genuinely doesn''t realize the impact of their behavior. Never learned to see from others'' perspectives.',
 'When shown the impact — genuine shock and remorse. ''I didn''t know. I''m sorry.''',
 NULL, 'neutral', ARRAY['6-7','8-9','10-11'], NULL, 10, true)
ON CONFLICT (seed_key) DO NOTHING;
