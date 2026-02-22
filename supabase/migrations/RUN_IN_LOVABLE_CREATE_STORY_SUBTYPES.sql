-- =============================================================================
-- Lovable: story_subtypes + story_subtype_history anlegen
-- Enthaelt: Tabelle, RLS, Trigger, Story-Subtype-History, Seed (~42 Subtypes).
-- Voraussetzung: user_roles, kid_profiles, stories, update_updated_at_column()
--   muessen existieren. Bei Fehler: RUN_IN_LOVABLE_CREATE_STORY_SUBTYPES_FALLBACK.sql
-- Danach: story_subtypes-Uebersetzungen aus RUN_IN_LOVABLE_ONLY_2_TO_10.sql
--   (Block "20260223_translations_story_subtypes") in Lovable ausfuehren.
-- =============================================================================

-- ── 1. story_subtypes table ──
create table if not exists story_subtypes (
  id uuid default gen_random_uuid() primary key,
  theme_key text not null,
  subtype_key text not null,
  labels jsonb not null,
  descriptions jsonb not null,
  age_groups text[] not null,
  weight integer default 10,
  is_active boolean default true,
  prompt_hint_en text not null,
  setting_ideas jsonb default '[]',
  title_seeds jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(theme_key, subtype_key)
);

create index if not exists idx_story_subtypes_theme_age on story_subtypes using gin (age_groups);
create index if not exists idx_story_subtypes_theme_key on story_subtypes (theme_key);

alter table story_subtypes enable row level security;

create policy "Everyone can read subtypes"
  on story_subtypes for select
  to authenticated
  using (true);

create policy "Only admins can modify subtypes"
  on story_subtypes for all
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_roles.auth_id = auth.uid()
      and user_roles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_roles.auth_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create trigger update_story_subtypes_updated_at
  before update on story_subtypes
  for each row execute function update_updated_at_column();

-- ── 2. story_subtype_history table ──
create table if not exists story_subtype_history (
  id uuid default gen_random_uuid() primary key,
  kid_profile_id uuid not null references kid_profiles(id) on delete cascade,
  theme_key text not null,
  subtype_key text not null,
  story_id uuid references stories(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_subtype_history_kid_theme
  on story_subtype_history (kid_profile_id, theme_key, created_at desc);

alter table story_subtype_history enable row level security;

create policy "Users can read own history"
  on story_subtype_history for select
  to authenticated
  using (
    exists (
      select 1 from kid_profiles
      where kid_profiles.id = story_subtype_history.kid_profile_id
      and kid_profiles.user_id = auth.uid()::text::uuid
    )
  );

create policy "System can insert history"
  on story_subtype_history for insert
  to authenticated
  with check (true);

-- ════════════════════════════════════════════════════════════
-- SEED DATA: ~42 subtypes across 4 categories
-- ════════════════════════════════════════════════════════════

-- ── Kategorie: magic_fantasy ──

insert into story_subtypes (theme_key, subtype_key, labels, descriptions, age_groups, weight, prompt_hint_en, setting_ideas, title_seeds) values

('magic_fantasy', 'enchanted_forest',
  '{"de": "Verzauberter Wald", "fr": "Forêt enchantée", "en": "Enchanted Forest", "es": "Bosque encantado", "it": "Foresta incantata", "nl": "Betoverd bos", "bs": "Začarana šuma"}',
  '{"de": "Eine Geschichte in einem magischen Wald voller sprechender Tiere und geheimnisvoller Wesen", "en": "A story in a magical forest full of talking animals and mysterious creatures"}',
  '{6-7, 8-9, 10-11}', 12,
  'Set the story in an enchanted forest where trees whisper, animals talk, and hidden magic awaits. The forest has its own rules and surprises.',
  '["in einem Wald wo die Bäume leuchten", "bei einem magischen Wasserfall", "in einer Lichtung mit sprechenden Pilzen"]',
  '["Das Geheimnis des leuchtenden Waldes", "Der Wald der Wünsche", "Wo die Bäume flüstern"]'
),

('magic_fantasy', 'fairy_tale_twist',
  '{"de": "Märchen mal anders", "fr": "Conte revisité", "en": "Fairy Tale Twist", "es": "Cuento reinventado", "it": "Fiaba rivisitata", "nl": "Sprookje met een twist", "bs": "Bajka na novi način"}',
  '{"de": "Ein bekanntes Märchenmotiv wird neu und überraschend erzählt", "en": "A familiar fairy tale motif retold in a new and surprising way"}',
  '{6-7, 8-9}', 11,
  'Take a well-known fairy tale element (dragon, princess, magic beans, three wishes) and flip the expected story. The dragon might need help. The princess might rescue herself. Surprise the reader.',
  '["in einem Schloss das auf dem Kopf steht", "in einem Dorf wo Märchenfiguren leben", "auf einem fliegenden Teppich"]',
  '["Der Drache der nicht fliegen konnte", "Die verkehrte Prinzessin", "Drei Wünsche und ein Problem"]'
),

('magic_fantasy', 'magical_creature_friendship',
  '{"de": "Magische Tierfreundschaft", "fr": "Amitié avec une créature magique", "en": "Magical Creature Friendship", "es": "Amistad con criatura mágica", "it": "Amicizia con creatura magica", "nl": "Magische dierenvriendschap", "bs": "Prijateljstvo s magičnim stvorenjem"}',
  '{"de": "Ein Kind findet oder rettet ein magisches Wesen und sie werden unzertrennlich", "en": "A child finds or rescues a magical creature and they become inseparable friends"}',
  '{6-7, 8-9}', 13,
  'The protagonist discovers or rescues a magical creature (baby dragon, tiny phoenix, star-cat, cloud-puppy). They must keep it secret, care for it, and the creature helps them in return. Focus on the bond and loyalty.',
  '["im Garten hinter dem Haus", "auf dem Dachboden", "an einem versteckten See"]',
  '["Mein geheimer Drache", "Das Wesen aus dem Mondlicht", "Ein Freund mit Flügeln"]'
),

('magic_fantasy', 'shrinking_growing',
  '{"de": "Winzig klein oder riesig groß", "fr": "Minuscule ou gigantesque", "en": "Shrinking & Growing", "es": "Pequeñito o gigante", "it": "Piccolissimo o gigantesco", "nl": "Piepklein of reusachtig", "bs": "Sićušan ili ogromni"}',
  '{"de": "Jemand schrumpft auf Ameisengröße oder wächst über die Häuser hinaus", "en": "Someone shrinks to ant-size or grows taller than houses"}',
  '{6-7, 8-9}', 10,
  'The protagonist (or their friend/pet) magically shrinks to tiny size or grows enormous. Show the world from this radical new perspective. Everyday objects become obstacles or tools. The story is about finding a way back to normal.',
  '["im eigenen Kinderzimmer", "im Schulgarten", "in der Küche"]',
  '["So klein wie eine Ameise", "Der Tag an dem alles riesig wurde", "Die Welt von ganz unten"]'
),

('magic_fantasy', 'flying_adventure',
  '{"de": "Flugabenteuer", "fr": "Aventure volante", "en": "Flying Adventure", "es": "Aventura voladora", "it": "Avventura volante", "nl": "Vliegavontuur", "bs": "Leteća avantura"}',
  '{"de": "Fliegen auf einem magischen Gegenstand, Tier oder mit eigenen Kräften", "en": "Flying on a magical object, creature, or with your own powers"}',
  '{6-7, 8-9, 10-11}', 11,
  'The protagonist gets to FLY — on a magical carpet, a friendly dragon, enchanted shoes, or they simply wake up floating. The sky becomes a world to explore: cloud kingdoms, wind spirits, sky islands. Focus on the wonder and freedom of flight.',
  '["über den Wolken", "zwischen fliegenden Inseln", "über einer schlafenden Stadt bei Nacht"]',
  '["Über den Wolken", "Der Junge der fliegen konnte", "Das Geheimnis der Himmelsinseln"]'
),

('magic_fantasy', 'portal_other_world',
  '{"de": "Portal in eine andere Welt", "fr": "Portail vers un autre monde", "en": "Portal to Another World", "es": "Portal a otro mundo", "it": "Portale per un altro mondo", "nl": "Portaal naar een andere wereld", "bs": "Portal u drugi svijet"}',
  '{"de": "Durch eine magische Tür, ein Buch oder einen Spiegel in eine völlig andere Welt reisen", "en": "Travel through a magical door, book, or mirror into a completely different world"}',
  '{8-9, 10-11}', 12,
  'A portal opens (wardrobe, old book, mirror, painting) and the protagonist steps into a completely different world with its own rules, creatures, and problems. They must solve something in that world before they can return. The portal world should feel vivid and have ONE clear rule that is different from our world.',
  '["durch einen alten Spiegel", "durch ein Buch in der Bibliothek", "durch eine Tür die vorher nicht da war"]',
  '["Die Tür die niemand sah", "Hinter dem Spiegel", "Das Buch das mich verschluckte"]'
),

('magic_fantasy', 'wizard_school',
  '{"de": "Zauberschule", "fr": "École de magie", "en": "Wizard School", "es": "Escuela de magia", "it": "Scuola di magia", "nl": "Toverschool", "bs": "Škola čarolija"}',
  '{"de": "Abenteuer in einer Schule wo man Zauberei, Tränke und magische Fächer lernt", "en": "Adventures at a school where you learn spells, potions, and magical subjects"}',
  '{8-9, 10-11}', 11,
  'Set the story at a school for magic. But instead of copying Harry Potter, make it fresh: maybe it is a tiny school with only 5 students, or a night school, or a school in the clouds. Focus on ONE magical lesson that goes wrong and the consequences.',
  '["in einer Baumhaus-Zauberschule", "in einer unterirdischen Akademie", "auf einem Schiff das eine Schule ist"]',
  '["Der erste Tag an der Zauberschule", "Die verbotene Stunde", "Prüfung in Traummagie"]'
),

('magic_fantasy', 'curse_breaking',
  '{"de": "Fluch brechen", "fr": "Briser la malédiction", "en": "Curse Breaking", "es": "Romper la maldición", "it": "Spezzare la maledizione", "nl": "Vloek verbreken", "bs": "Razbijanje kletve"}',
  '{"de": "Ein Fluch muss gebrochen werden — aber die Lösung ist nicht was man erwartet", "en": "A curse must be broken — but the solution is not what you expect"}',
  '{8-9, 10-11}', 10,
  'Someone or something is cursed. The protagonist must find the cure/solution. The twist: the obvious solution (a kiss, a magic word, defeating the villain) does NOT work. The real solution requires empathy, sacrifice, or understanding. Focus on the journey of discovery.',
  '["in einem Dorf wo alle zu Stein geworden sind", "in einem Wald der ewig schläft", "in einem Schloss ohne Farben"]',
  '["Der Fluch der tausend Stille", "Wenn die Farben verschwinden", "Das letzte Wort des Zauberers"]'
),

('magic_fantasy', 'dream_journey',
  '{"de": "Traumreise", "fr": "Voyage onirique", "en": "Dream Journey", "es": "Viaje de sueños", "it": "Viaggio onirico", "nl": "Droomreis", "bs": "Putovanje snova"}',
  '{"de": "Im Traum eine fantastische Welt bereisen, die sich nach den Gefühlen des Träumers richtet", "en": "Travel through a fantastic dream world that shifts with the dreamer emotions"}',
  '{6-7, 8-9}', 9,
  'The protagonist falls asleep and enters a dream world that responds to their emotions — happy thoughts make flowers bloom, fear creates shadows. They must navigate this shifting world to find something or someone. When they wake up, something has changed in the real world too.',
  '["in einer Welt aus Wolken und Sternen", "in einem Land wo alles aus Musik besteht", "in einem Ozean aus Licht"]',
  '["Die Nacht in der ich fliegen konnte", "Traumland", "Der Stern der auf mich wartete"]'
),

('magic_fantasy', 'underwater_kingdom',
  '{"de": "Unterwasserreich", "fr": "Royaume sous-marin", "en": "Underwater Kingdom", "es": "Reino submarino", "it": "Regno sottomarino", "nl": "Onderwaterrijk", "bs": "Podvodno kraljevstvo"}',
  '{"de": "Abenteuer unter Wasser: Meerjungfrauen, versunkene Städte, sprechende Fische", "en": "Underwater adventures: mermaids, sunken cities, talking fish"}',
  '{6-7, 8-9, 10-11}', 10,
  'The protagonist discovers they can breathe underwater (potion, magic shell, they are part-mermaid). A whole civilization exists below the waves. Focus on the WONDER of the underwater world and one problem that needs solving (a threat to the ocean, a lost artifact, a lonely sea creature).',
  '["in einer versunkenen Stadt aus Korallen", "in einer Unterwasserhöhle", "im tiefsten Ozean"]',
  '["Das Geheimnis der versunkenen Stadt", "Die Muschel die Wünsche singt", "Tief unten im Meer"]'
),

('magic_fantasy', 'time_loop',
  '{"de": "Zeitschleife", "fr": "Boucle temporelle", "en": "Time Loop", "es": "Bucle temporal", "it": "Anello temporale", "nl": "Tijdlus", "bs": "Vremenska petlja"}',
  '{"de": "Denselben Tag immer wieder erleben und herausfinden warum", "en": "Living the same day over and over and figuring out why"}',
  '{10-11}', 10,
  'The protagonist wakes up and realizes they are living the same day AGAIN. Each loop, they try something different. The solution is not about changing events but about changing themselves — understanding something they missed, apologizing, or seeing things from another perspective.',
  '["am Morgen des Schulfests", "am Tag vor den Ferien", "am Geburtstag der besten Freundin"]',
  '["Schon wieder Montag", "Der Tag der nicht enden wollte", "Dreimal dasselbe"]'
),

('magic_fantasy', 'invisible_world',
  '{"de": "Die unsichtbare Welt", "fr": "Le monde invisible", "en": "The Invisible World", "es": "El mundo invisible", "it": "Il mondo invisibile", "nl": "De onzichtbare wereld", "bs": "Nevidljivi svijet"}',
  '{"de": "Eine verborgene Welt existiert parallel zur unseren — nur wenige können sie sehen", "en": "A hidden world exists parallel to ours — only a few can see it"}',
  '{8-9, 10-11}', 10,
  'The protagonist discovers they can see things others cannot — tiny creatures living in the walls, a second city overlapping with their own, messages in the clouds. This gift comes with a responsibility: something in the invisible world needs help, and only they can provide it.',
  '["in der eigenen Stadt", "in der Schule", "im Haus der Großeltern"]',
  '["Was niemand sehen kann", "Die Stadt hinter der Stadt", "Augen die alles sehen"]'
);

-- ── Kategorie: adventure_action ──

insert into story_subtypes (theme_key, subtype_key, labels, descriptions, age_groups, weight, prompt_hint_en, setting_ideas, title_seeds) values

('adventure_action', 'treasure_hunt',
  '{"de": "Schatzsuche", "fr": "Chasse au trésor", "en": "Treasure Hunt", "es": "Búsqueda del tesoro", "it": "Caccia al tesoro", "nl": "Schattenjacht", "bs": "Potraga za blagom"}',
  '{"de": "Eine Karte, Rätsel und Hinweise führen zu einem verborgenen Schatz", "en": "A map, riddles, and clues lead to a hidden treasure"}',
  '{6-7, 8-9, 10-11}', 13,
  'A treasure hunt with a map, riddles, or clues. The treasure at the end should NOT just be gold — it could be a family heirloom, a message from the past, a friendship, or a secret. The journey matters more than the destination. Include at least ONE clever riddle or puzzle.',
  '["auf einer kleinen Insel", "im eigenen Stadtviertel", "in einem alten Haus", "im Wald hinter der Schule"]',
  '["Die Karte im alten Buch", "X markiert die Stelle", "Der Schatz von ..."]'
),

('adventure_action', 'detective_case',
  '{"de": "Detektivfall", "fr": "Enquête policière", "en": "Detective Case", "es": "Caso de detective", "it": "Caso da detective", "nl": "Detectivezaak", "bs": "Detektivski slučaj"}',
  '{"de": "Etwas ist verschwunden oder ein Rätsel muss gelöst werden — mit Spürsinn und Logik", "en": "Something has disappeared or a puzzle must be solved — with wit and logic"}',
  '{6-7, 8-9, 10-11}', 14,
  'Something has gone missing or something suspicious is happening. The protagonist becomes a detective: collecting clues, interviewing witnesses, following leads. Include red herrings and a satisfying reveal. The crime should be kid-appropriate (missing pet, stolen painting, mysterious noise, disappeared cookie jar). NO violence.',
  '["in der Schule", "in der Nachbarschaft", "auf einem Bauernhof", "während einer Feier"]',
  '["Der Fall des verschwundenen ...", "Wer war es?", "Die Spur führt nach ..."]'
),

('adventure_action', 'time_travel',
  '{"de": "Zeitreise", "fr": "Voyage dans le temps", "en": "Time Travel", "es": "Viaje en el tiempo", "it": "Viaggio nel tempo", "nl": "Tijdreis", "bs": "Putovanje kroz vrijeme"}',
  '{"de": "In die Vergangenheit oder Zukunft reisen und dort ein Abenteuer erleben", "en": "Travel to the past or future and experience an adventure there"}',
  '{8-9, 10-11}', 12,
  'The protagonist travels to a specific historical era OR to the future. They must navigate unfamiliar customs, help someone, or fix something before returning. Pick a vivid, specific setting (Viking village, Egyptian pyramid construction, pirate ship, a city in 2200). Include authentic details that make the era feel real.',
  '["ins alte Ägypten", "zu den Wikingern", "ins Mittelalter", "in eine Stadt der Zukunft", "zur Zeit der Piraten", "zum Wilden Westen"]',
  '["Zurück ins Jahr ...", "Der Tag an dem die Zeit stehen blieb", "Morgen war gestern"]'
),

('adventure_action', 'rescue_mission',
  '{"de": "Rettungsmission", "fr": "Mission de sauvetage", "en": "Rescue Mission", "es": "Misión de rescate", "it": "Missione di salvataggio", "nl": "Reddingsmissie", "bs": "Misija spašavanja"}',
  '{"de": "Jemand oder etwas muss gerettet werden — gegen die Zeit", "en": "Someone or something needs to be rescued — against the clock"}',
  '{6-7, 8-9, 10-11}', 12,
  'Someone (friend, family member, animal, magical creature) is trapped, lost, or in danger. The protagonist must mount a rescue. There is a time pressure element. Focus on bravery, problem-solving, and teamwork. The rescue plan should have at least one unexpected complication.',
  '["im Sturm", "auf einem Berg", "in einer Höhle", "auf hoher See", "in einem brennenden Wald"]',
  '["Haltet durch!", "Die Rettung von ...", "Keine Zeit zu verlieren"]'
),

('adventure_action', 'spy_mission',
  '{"de": "Geheimagenten-Mission", "fr": "Mission d''agent secret", "en": "Spy Mission", "es": "Misión de espías", "it": "Missione da agente segreto", "nl": "Geheime agentenmissie", "bs": "Špijunska misija"}',
  '{"de": "Undercover ermitteln, Codes knacken und eine geheime Mission erfüllen", "en": "Go undercover, crack codes, and complete a secret mission"}',
  '{8-9, 10-11}', 11,
  'The protagonist becomes a spy or secret agent (kid spy for a school club, neighborhood watch, or even a real spy organization for kids). Include coded messages, disguises, gadgets (age-appropriate), and a clear mission. The villain should be more funny/clever than threatening.',
  '["in der Schule", "in einem Museum", "während eines Stadtfests", "in einem großen Hotel"]',
  '["Deckname: ...", "Die geheime Mission", "Agent ... im Einsatz"]'
),

('adventure_action', 'survival_nature',
  '{"de": "Überleben in der Wildnis", "fr": "Survie dans la nature", "en": "Wilderness Survival", "es": "Supervivencia en la naturaleza", "it": "Sopravvivenza nella natura", "nl": "Overleven in de natuur", "bs": "Preživljavanje u divljini"}',
  '{"de": "Allein oder zu zweit in der Natur zurechtkommen — mit Mut und Erfindungsgeist", "en": "Surviving alone or in pairs in nature — with courage and ingenuity"}',
  '{8-9, 10-11}', 10,
  'The protagonist gets separated from their group during a hike, camping trip, or excursion. They must use nature skills, observation, and creativity to find their way back. Include realistic survival elements (finding water, building shelter, reading nature signs). NO real danger to life — keep it exciting but safe-feeling.',
  '["im Wald", "am Fluss", "auf einer kleinen Insel", "in den Bergen"]',
  '["Allein im Wald", "Der Weg zurück", "Drei Tage ohne Handy"]'
),

('adventure_action', 'expedition_discovery',
  '{"de": "Expedition & Entdeckung", "fr": "Expédition & découverte", "en": "Expedition & Discovery", "es": "Expedición y descubrimiento", "it": "Spedizione e scoperta", "nl": "Expeditie & ontdekking", "bs": "Ekspedicija i otkriće"}',
  '{"de": "Eine Reise ins Unbekannte um etwas Neues zu entdecken", "en": "A journey into the unknown to discover something new"}',
  '{6-7, 8-9, 10-11}', 11,
  'An expedition to discover something: a new species, a hidden valley, an unknown cave, a mysterious island. The protagonist is an explorer. Focus on curiosity, observation, and the thrill of being the FIRST to see something. Include a journal/log element.',
  '["auf einer unerforschten Insel", "in einer tiefen Höhle", "im Dschungel", "in der Arktis"]',
  '["Die Expedition ins Unbekannte", "Was noch niemand gesehen hat", "Das Logbuch von ..."]'
),

('adventure_action', 'race_competition',
  '{"de": "Wettrennen & Wettbewerb", "fr": "Course & compétition", "en": "Race & Competition", "es": "Carrera y competición", "it": "Gara e competizione", "nl": "Race & wedstrijd", "bs": "Utrka i takmičenje"}',
  '{"de": "Ein spannendes Rennen oder ein Wettbewerb mit überraschenden Wendungen", "en": "An exciting race or competition with surprising twists"}',
  '{6-7, 8-9, 10-11}', 10,
  'A race, contest, or competition (boat race, cooking contest, obstacle course, invention fair, scavenger hunt across town). The protagonist is NOT the obvious winner. They face setbacks but learn that HOW you compete matters more than winning. Include a rival who becomes a friend.',
  '["quer durch die Stadt", "auf dem Schulhof", "auf einem Fluss", "in einem Labyrinth"]',
  '["Das große Rennen", "Wer zuerst ankommt", "Der unwahrscheinliche Gewinner"]'
),

('adventure_action', 'night_adventure',
  '{"de": "Nachtabenteuer", "fr": "Aventure nocturne", "en": "Night Adventure", "es": "Aventura nocturna", "it": "Avventura notturna", "nl": "Nachtavontuur", "bs": "Noćna avantura"}',
  '{"de": "Nachts passiert etwas Unerwartetes — und ein Abenteuer beginnt", "en": "Something unexpected happens at night — and an adventure begins"}',
  '{6-7, 8-9}', 11,
  'The adventure happens at NIGHT. The protagonist sneaks out, or something wakes them up. The familiar world looks different in the dark — everything is more mysterious and exciting. The darkness is NOT scary but magical. Focus on sounds, shadows, moonlight, and the feeling of a secret adventure.',
  '["im Garten bei Vollmond", "in der Stadt wenn alle schlafen", "auf dem Dachboden nachts"]',
  '["Als alle schliefen", "Mitternacht im Garten", "Das Geheimnis der Nacht"]'
),

('adventure_action', 'shipwreck_island',
  '{"de": "Schiffbruch & Inselabenteuer", "fr": "Naufrage & île", "en": "Shipwreck & Island", "es": "Naufragio e isla", "it": "Naufragio e isola", "nl": "Schipbreuk & eiland", "bs": "Brodolom i otok"}',
  '{"de": "Auf einer einsamen Insel stranden und dort ein Abenteuer erleben", "en": "Stranded on a deserted island and having an adventure there"}',
  '{8-9, 10-11}', 9,
  'The protagonist ends up on an island (shipwreck, storm, magical transport). The island is not empty — it has mysteries, maybe inhabitants, definitely surprises. Focus on resourcefulness and discovery. Include a moment where the protagonist must decide: stay or find a way home.',
  '["auf einer tropischen Insel", "auf einer Insel aus Eis", "auf einer winzigen Insel mit einem Baum"]',
  '["Die Insel am Ende der Welt", "Gestrandet!", "Das Geheimnis der Insel"]'
),

('adventure_action', 'underground_exploration',
  '{"de": "Unterirdische Erkundung", "fr": "Exploration souterraine", "en": "Underground Exploration", "es": "Exploración subterránea", "it": "Esplorazione sotterranea", "nl": "Ondergrondse verkenning", "bs": "Podzemno istraživanje"}',
  '{"de": "Geheime Tunnel, verborgene Räume und unterirdische Welten entdecken", "en": "Discover secret tunnels, hidden rooms, and underground worlds"}',
  '{8-9, 10-11}', 9,
  'The protagonist discovers something underground — a tunnel under their school, a hidden room in a basement, an ancient passage. What they find below changes everything. Focus on claustrophobic excitement, the thrill of discovery, and what lies hidden beneath the everyday world.',
  '["unter der Schule", "unter der alten Kirche", "unter dem Marktplatz", "in einem Bergwerk"]',
  '["Was unter der Schule liegt", "Der geheime Tunnel", "Tief unter der Stadt"]'
);

-- ── Kategorie: real_life ──

insert into story_subtypes (theme_key, subtype_key, labels, descriptions, age_groups, weight, prompt_hint_en, setting_ideas, title_seeds) values

('real_life', 'new_kid_school',
  '{"de": "Neu in der Klasse", "fr": "Nouveau à l''école", "en": "New Kid at School", "es": "Nuevo en clase", "it": "Nuovo in classe", "nl": "Nieuw in de klas", "bs": "Nov u razredu"}',
  '{"de": "Jemand Neues kommt in die Klasse — und alles wird anders", "en": "Someone new joins the class — and everything changes"}',
  '{6-7, 8-9, 10-11}', 12,
  'Either the protagonist OR a new kid arrives at school. Cultural differences, language barriers, or just being "different" create tension. But a shared interest or unexpected event brings them together. Show that making friends requires courage from BOTH sides.',
  '["in der Grundschule", "im Schulhof", "in der Turnhalle", "in der Kantine"]',
  '["Der neue Junge aus ...", "Mein erster Tag", "Der Stuhl neben mir"]'
),

('real_life', 'animal_rescue',
  '{"de": "Tierrettung", "fr": "Sauvetage d''animal", "en": "Animal Rescue", "es": "Rescate animal", "it": "Salvataggio animale", "nl": "Dierenredding", "bs": "Spašavanje životinje"}',
  '{"de": "Ein verletztes oder verlorenes Tier finden und ihm helfen", "en": "Finding an injured or lost animal and helping it"}',
  '{6-7, 8-9}', 13,
  'The protagonist finds an injured, lost, or abandoned animal. They must care for it, maybe secretly. Include realistic animal behavior and the emotional bond. The resolution should be what is BEST for the animal (which might mean letting it go), teaching responsibility and empathy.',
  '["am Flussufer", "im Park", "hinter dem Supermarkt", "im Wald"]',
  '["Der kleine Vogel im Regen", "Gefunden!", "Das Tier das nicht gehen wollte"]'
),

('real_life', 'family_adventure',
  '{"de": "Familienabenteuer", "fr": "Aventure en famille", "en": "Family Adventure", "es": "Aventura en familia", "it": "Avventura in famiglia", "nl": "Familie-avontuur", "bs": "Porodična avantura"}',
  '{"de": "Ein besonderer Tag oder Ausflug mit der Familie — mit Überraschungen", "en": "A special day or trip with the family — with surprises"}',
  '{6-7, 8-9}', 12,
  'A family outing (camping, road trip, visit to grandparents, day at the beach) where something unexpected happens. The adventure is mild but meaningful. Focus on family dynamics, each family member contributing their strength, and a shared memory being created.',
  '["im Campingurlaub", "bei Oma und Opa", "auf einem Roadtrip", "am Strand"]',
  '["Der verrückteste Sonntag", "Ferien bei Oma", "Der Tag an dem alles anders kam"]'
),

('real_life', 'cooking_baking',
  '{"de": "Koch- & Backabenteuer", "fr": "Aventure culinaire", "en": "Cooking & Baking Adventure", "es": "Aventura culinaria", "it": "Avventura in cucina", "nl": "Kook- en bakavontuur", "bs": "Kulinarska avantura"}',
  '{"de": "In der Küche passiert etwas Unerwartetes — ein Rezept geht schief oder wird zum Erfolg", "en": "Something unexpected happens in the kitchen — a recipe goes wrong or becomes a hit"}',
  '{6-7, 8-9}', 9,
  'The protagonist tries to cook or bake something (birthday cake for mom, cookies for school, a family recipe from grandma). Things go hilariously wrong before they go right. Include specific, fun cooking details. The real ingredient for success is always love, patience, or teamwork.',
  '["in der eigenen Küche", "in der Schulküche", "bei einem Kochwettbewerb"]',
  '["Das Rezept von Oma", "Der Kuchen der nicht aufhören wollte zu wachsen", "Koch-Chaos"]'
),

('real_life', 'neighborhood_mystery',
  '{"de": "Rätsel in der Nachbarschaft", "fr": "Mystère du quartier", "en": "Neighborhood Mystery", "es": "Misterio del barrio", "it": "Mistero del quartiere", "nl": "Buurtmysterie", "bs": "Misterija u komšiluku"}',
  '{"de": "In der Nachbarschaft passiert etwas Seltsames — wer steckt dahinter?", "en": "Something strange is happening in the neighborhood — who is behind it?"}',
  '{6-7, 8-9, 10-11}', 11,
  'Strange things happen in the neighborhood (mysterious lights, weird sounds, someone doing something in secret). The protagonist investigates with friends. The resolution is harmless and often heartwarming (the neighbor was building a surprise, the lights were from a new hobby). Focus on community and curiosity.',
  '["in der eigenen Straße", "im Hinterhof", "auf dem Spielplatz", "im Treppenhaus"]',
  '["Das Geheimnis von Nummer 7", "Wer macht nachts das Licht an?", "Die seltsame Nachbarin"]'
),

('real_life', 'big_game_performance',
  '{"de": "Das große Spiel / Der große Auftritt", "fr": "Le grand match / spectacle", "en": "The Big Game / Performance", "es": "El gran partido / espectáculo", "it": "La grande partita / spettacolo", "nl": "De grote wedstrijd / show", "bs": "Velika utakmica / nastup"}',
  '{"de": "Vorbereitung auf ein wichtiges Spiel, Konzert oder Theaterstück", "en": "Preparing for an important game, concert, or school play"}',
  '{6-7, 8-9, 10-11}', 10,
  'A big event is approaching (sports game, school play, music recital, talent show, science fair). The protagonist prepares but faces doubts, setbacks, or conflicts with teammates. The performance itself has surprises. The lesson is about doing your best, not about winning.',
  '["in der Turnhalle", "auf der Schulbühne", "auf dem Sportplatz"]',
  '["Der große Tag", "Lampenfieber", "Alles auf eine Karte"]'
),

('real_life', 'moving_new_home',
  '{"de": "Umzug ins Neue", "fr": "Déménagement", "en": "Moving to a New Home", "es": "Mudanza", "it": "Trasloco", "nl": "Verhuizen", "bs": "Selidba"}',
  '{"de": "In ein neues Haus, eine neue Stadt oder ein neues Land ziehen", "en": "Moving to a new house, city, or country"}',
  '{6-7, 8-9, 10-11}', 9,
  'The protagonist moves to a new place. Everything is unfamiliar. Show the mix of sadness (leaving old friends) and excitement (new room, new neighborhood). The turning point is when they discover something special about the new place that makes it feel like home.',
  '["in ein altes Haus auf dem Land", "in eine große Stadt", "in ein anderes Land"]',
  '["Das neue Zimmer", "Alles anders", "Das Haus mit dem roten Dach"]'
),

('real_life', 'secret_hobby',
  '{"de": "Das geheime Hobby", "fr": "Le hobby secret", "en": "The Secret Hobby", "es": "El hobby secreto", "it": "L''hobby segreto", "nl": "De geheime hobby", "bs": "Tajni hobi"}',
  '{"de": "Ein Kind entdeckt eine Leidenschaft die andere nicht verstehen — bis es alle überrascht", "en": "A child discovers a passion others don''t understand — until they surprise everyone"}',
  '{8-9, 10-11}', 9,
  'The protagonist secretly pursues a hobby that others might find unusual (a boy who loves ballet, a girl who builds robots, someone who draws comic books, a kid who breeds butterflies). They keep it secret out of fear of being teased. The climax reveals their talent and changes how others see them.',
  '["in der Garage", "im Keller", "auf dem Dachboden", "in einem geheimen Raum"]',
  '["Mein Geheimnis", "Was niemand wissen darf", "Der verborgene Künstler"]'
),

('real_life', 'grandparent_story',
  '{"de": "Opa/Oma erzählt", "fr": "Grand-père/mère raconte", "en": "Grandparent''s Story", "es": "La historia del abuelo/a", "it": "Il racconto dei nonni", "nl": "Opa/Oma vertelt", "bs": "Priča djeda/bake"}',
  '{"de": "Großeltern erzählen von früher — und plötzlich wird die Vergangenheit lebendig", "en": "Grandparents tell about the past — and suddenly the past comes alive"}',
  '{6-7, 8-9, 10-11}', 10,
  'A grandparent starts telling about their own childhood adventure. The story comes alive — the protagonist imagines or "enters" the grandparent''s memory. Show parallels between past and present. The lesson bridges generations. Warm, nostalgic tone.',
  '["im Wohnzimmer bei Oma", "beim Spaziergang mit Opa", "in der alten Werkstatt"]',
  '["Als Opa klein war", "Omas Geheimnis", "Die Geschichte die Opa nie erzählt hat"]'
),

('real_life', 'eco_adventure',
  '{"de": "Umwelt-Abenteuer", "fr": "Aventure écologique", "en": "Eco Adventure", "es": "Aventura ecológica", "it": "Avventura ecologica", "nl": "Eco-avontuur", "bs": "Eko-avantura"}',
  '{"de": "Die Natur braucht Hilfe — und Kinder packen an", "en": "Nature needs help — and kids take action"}',
  '{8-9, 10-11}', 9,
  'The protagonist notices an environmental problem (polluted stream, disappearing bees, littered forest, a tree about to be cut down). They rally friends to take action. The solution is realistic and kid-powered — no magic fixes. Show that small actions matter.',
  '["am Bach hinter dem Dorf", "im Stadtpark", "auf der Schulwiese", "am Strand"]',
  '["Rettet den alten Baum!", "Mission Bienenrettung", "Der Bach der seine Farbe verlor"]'
);

-- ── Kategorie: surprise ──

insert into story_subtypes (theme_key, subtype_key, labels, descriptions, age_groups, weight, prompt_hint_en, setting_ideas, title_seeds) values

('surprise', 'chaos_comedy',
  '{"de": "Chaos-Komödie", "fr": "Comédie chaotique", "en": "Chaos Comedy", "es": "Comedia caótica", "it": "Commedia caotica", "nl": "Chaoskomedie", "bs": "Komedija haosa"}',
  '{"de": "Alles geht schief — und es wird immer lustiger", "en": "Everything goes wrong — and it just gets funnier"}',
  '{6-7, 8-9, 10-11}', 13,
  'A chain reaction of mishaps. One small mistake leads to bigger and bigger chaos. The tone is FUNNY, not stressful. Think slapstick + heart. The resolution comes when someone finally stops trying to fix things and just laughs. Exaggeration is welcome.',
  '["beim Frühstück", "in der Schule", "bei einem Familienfest", "im Supermarkt"]',
  '["Der Tag an dem alles schief ging", "Ooops!", "Von schlimm zu schlimmer"]'
),

('surprise', 'role_reversal',
  '{"de": "Rollentausch", "fr": "Échange de rôles", "en": "Role Reversal", "es": "Intercambio de roles", "it": "Scambio di ruoli", "nl": "Rolwisseling", "bs": "Zamjena uloga"}',
  '{"de": "Kind und Erwachsener tauschen die Rollen — das Kind ist der Chef", "en": "Child and adult swap roles — the kid is in charge"}',
  '{6-7, 8-9}', 12,
  'A child and a parent/teacher swap roles for a day (by wish, magic, or dare). The child realizes being an adult is hard. The adult realizes being a kid is not easy either. Funny situations arise from both perspectives. End with mutual appreciation.',
  '["zu Hause", "in der Schule", "im Büro von Papa/Mama"]',
  '["Heute bin ich der Chef", "Erwachsen für einen Tag", "Papa geht in die Schule"]'
),

('surprise', 'unexpected_talent',
  '{"de": "Unerwartetes Talent", "fr": "Talent inattendu", "en": "Unexpected Talent", "es": "Talento inesperado", "it": "Talento inaspettato", "nl": "Onverwacht talent", "bs": "Neočekivani talenat"}',
  '{"de": "Jemand entdeckt plötzlich eine völlig unerwartete Fähigkeit", "en": "Someone suddenly discovers a completely unexpected ability"}',
  '{6-7, 8-9, 10-11}', 10,
  'The protagonist discovers they are unexpectedly good at something — but it is something unusual, unexpected, or seemingly useless (perfect memory for smells, ability to talk to one specific animal, perfect sense of direction). The story shows how this "useless" talent saves the day.',
  '["in der Schule", "im Urlaub", "bei einem Familientreffen"]',
  '["Das kann doch jeder — oder?", "Mein seltsames Talent", "Wozu das gut ist"]'
),

('surprise', 'wish_gone_wrong',
  '{"de": "Wunsch mit Nebenwirkung", "fr": "Vœu mal tourné", "en": "Wish Gone Wrong", "es": "Deseo con consecuencias", "it": "Desiderio con effetto collaterale", "nl": "Wens met bijwerking", "bs": "Želja s nuspojavom"}',
  '{"de": "Ein Wunsch wird erfüllt — aber anders als erwartet", "en": "A wish comes true — but not as expected"}',
  '{6-7, 8-9, 10-11}', 12,
  'The protagonist makes a wish (on a star, coin, candle, or to a mysterious stranger) and it comes true — but with an unexpected twist. "I wish I never had to go to school" → school disappears but so do all their friends. The lesson: be careful what you wish for, and appreciate what you have.',
  '["am Geburtstag", "an einem Brunnen", "bei Sternschnuppe", "in einer alten Lampe"]',
  '["Ich wünsche mir ...", "Der Wunsch der alles änderte", "Vorsicht beim Wünschen"]'
),

('surprise', 'talking_objects',
  '{"de": "Wenn Dinge sprechen könnten", "fr": "Si les objets pouvaient parler", "en": "Talking Objects", "es": "Objetos que hablan", "it": "Oggetti parlanti", "nl": "Pratende voorwerpen", "bs": "Kada bi stvari mogle govoriti"}',
  '{"de": "Alltagsgegenstände werden lebendig und haben ihren eigenen Willen", "en": "Everyday objects come alive and have a will of their own"}',
  '{6-7, 8-9}', 10,
  'Everyday objects come alive and have opinions (the toothbrush is tired of being in a mouth, the schoolbag wants a vacation, shoes argue about who walks more). The protagonist must negotiate with their own things. Humorous and imaginative. Objects have personality that matches their function.',
  '["im Kinderzimmer", "in der Schulbank", "in der Küche"]',
  '["Der Aufstand der Socken", "Mein Rucksack will nicht mehr", "Die Zahnbürste streikt"]'
),

('surprise', 'backwards_day',
  '{"de": "Alles verkehrt herum", "fr": "Tout à l''envers", "en": "Backwards Day", "es": "Día al revés", "it": "Giorno al contrario", "nl": "Alles achterstevoren", "bs": "Dan naopako"}',
  '{"de": "Ein Tag an dem alles andersherum ist — Regen fällt nach oben, Schule beginnt nachts", "en": "A day where everything is reversed — rain falls up, school starts at night"}',
  '{6-7, 8-9}', 10,
  'One day, the rules of the world are reversed. Rain falls upward, adults go to school and kids go to work, you eat dessert first, the sun rises in the west. The protagonist must navigate this bizarre world. It is FUNNY and ABSURD, not scary. They find it oddly liberating but eventually want normal back.',
  '["in der normalen Welt die verrückt geworden ist"]',
  '["Der verkehrte Tag", "Kopfüber-Welt", "Als alles andersherum war"]'
),

('surprise', 'mix_up_confusion',
  '{"de": "Die große Verwechslung", "fr": "La grande confusion", "en": "The Big Mix-Up", "es": "La gran confusión", "it": "La grande confusione", "nl": "De grote verwisseling", "bs": "Velika zabuna"}',
  '{"de": "Eine Verwechslung löst eine Kettenreaktion aus", "en": "A mix-up triggers a chain reaction"}',
  '{6-7, 8-9, 10-11}', 10,
  'A simple mix-up (wrong bag, wrong address, wrong person, misheard message) triggers a chain of misunderstandings that gets increasingly complicated and funny. Like a comedy of errors. The resolution untangles everything and everyone laughs. Fast pacing.',
  '["am Bahnhof", "in der Schule", "beim Einkaufen", "bei einer Hochzeit"]',
  '["Die vertauschten Koffer", "Das war nicht für mich!", "Alles durcheinander"]'
),

('surprise', 'super_ordinary_hero',
  '{"de": "Der ganz normale Held", "fr": "Le héros ordinaire", "en": "The Ordinary Hero", "es": "El héroe ordinario", "it": "L''eroe ordinario", "nl": "De gewone held", "bs": "Obični heroj"}',
  '{"de": "Kein Superkraft, kein Zauber — ein ganz normales Kind tut das Richtige", "en": "No superpower, no magic — a perfectly ordinary kid does the right thing"}',
  '{8-9, 10-11}', 11,
  'NO magic, NO superpowers. An ordinary kid faces an everyday situation that requires courage (standing up for someone, telling the truth when it is hard, helping a stranger, admitting a mistake). The story shows that real heroism is quiet and everyday. Emotionally resonant.',
  '["in der Schule", "auf dem Spielplatz", "im Bus", "im Supermarkt"]',
  '["Einfach mutig", "Was hätte ich getan?", "Der stille Held"]'
),

('surprise', 'miniature_world',
  '{"de": "Die Miniaturwelt", "fr": "Le monde miniature", "en": "Miniature World", "es": "Mundo en miniatura", "it": "Mondo in miniatura", "nl": "Miniatuurwereld", "bs": "Minijaturni svijet"}',
  '{"de": "In einer Schublade, unter einem Stein oder hinter der Wand lebt eine winzige Zivilisation", "en": "In a drawer, under a rock, or behind the wall lives a tiny civilization"}',
  '{6-7, 8-9}', 10,
  'The protagonist discovers a tiny world — in a dollhouse, under a floorboard, inside a tree stump, behind the wallpaper. The tiny inhabitants have their own society, problems, and culture. The protagonist becomes their giant ally. Scale contrast is the fun: a breadcrumb is a boulder, a puddle is an ocean.',
  '["hinter der Tapete", "im Garten unter einem Stein", "in einer alten Schublade"]',
  '["Die winzige Stadt", "Hinter der Wand", "So klein und doch so groß"]'
),

('surprise', 'letter_from_stranger',
  '{"de": "Brief von einem Unbekannten", "fr": "Lettre d''un inconnu", "en": "Letter from a Stranger", "es": "Carta de un desconocido", "it": "Lettera da uno sconosciuto", "nl": "Brief van een onbekende", "bs": "Pismo od nepoznatog"}',
  '{"de": "Ein mysteriöser Brief kommt an — und führt auf eine unerwartete Reise", "en": "A mysterious letter arrives — and leads to an unexpected journey"}',
  '{8-9, 10-11}', 10,
  'A mysterious letter (or package, or map) arrives addressed to the protagonist. It contains a clue, a challenge, or a cry for help. The protagonist follows the trail. Each clue leads to the next. The sender turns out to be someone surprising. Focus on curiosity and the thrill of the unknown.',
  '["im Briefkasten", "in einem alten Buch", "unter der Fußmatte"]',
  '["Der Brief ohne Absender", "Für dich — öffne mich", "Die Nachricht im Umschlag"]'
);
