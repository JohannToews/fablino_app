-- Block 2.2: Rule Tables for Story Generation
-- Creates age_rules, theme_rules, emotion_rules, image_style_rules with rich seed data.
-- These tables will feed the promptBuilder in Block 2.3.

-- ============================================================
-- 1. age_rules – Language complexity rules by age + language
-- ============================================================

CREATE TABLE IF NOT EXISTS public.age_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_age integer NOT NULL,
  max_age integer NOT NULL,
  language text NOT NULL,               -- 'fr', 'de', 'en', etc.
  max_sentence_length integer NOT NULL, -- max words per sentence
  allowed_tenses text[] NOT NULL,       -- e.g. '{"présent", "passé composé"}'
  sentence_structures text NOT NULL,    -- prose: which structures allowed
  vocabulary_level integer NOT NULL,    -- 1-5
  complexity_level integer NOT NULL,    -- 1-5
  min_word_count integer NOT NULL,
  max_word_count integer NOT NULL,
  paragraph_length text,                -- e.g. "2-3 sentences per paragraph"
  dialogue_ratio text,                  -- e.g. "30-40%"
  narrative_perspective text,           -- e.g. "third person"
  narrative_guidelines text NOT NULL,   -- prose: storytelling rules
  example_sentences text[],             -- example sentences for this age/language
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(min_age, max_age, language)
);

-- ============================================================
-- 2. theme_rules – Plot templates and settings per theme + language
-- ============================================================

CREATE TABLE IF NOT EXISTS public.theme_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_key text NOT NULL,              -- e.g. 'fantasy', 'action', 'animals'
  language text NOT NULL,
  labels jsonb NOT NULL,                -- {"de": "Märchen & Fantasie", "fr": "Contes & Fantaisie"}
  plot_templates text[] NOT NULL,       -- possible plot structures
  setting_descriptions text NOT NULL,   -- atmospheric descriptions
  character_archetypes text[],          -- suitable character types
  sensory_details text,                 -- sensory impressions for this theme
  typical_conflicts text[],             -- typical conflicts
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(theme_key, language)
);

-- ============================================================
-- 3. emotion_rules – Conflict patterns and character development
-- ============================================================

CREATE TABLE IF NOT EXISTS public.emotion_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emotion_key text NOT NULL,            -- e.g. 'courage', 'friendship', 'curiosity'
  language text NOT NULL,
  labels jsonb NOT NULL,                -- {"de": "Mut", "fr": "Courage"}
  conflict_patterns text[] NOT NULL,    -- matching conflict arcs
  character_development text NOT NULL,  -- how characters evolve
  resolution_patterns text[],           -- how the story resolves
  emotional_vocabulary text[],          -- age-appropriate emotional words
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(emotion_key, language)
);

-- ============================================================
-- 4. image_style_rules – Visual style per age group + optional theme
-- ============================================================

CREATE TABLE IF NOT EXISTS public.image_style_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group text NOT NULL,              -- '4-6', '7-9', '10-12'
  theme_key text,                       -- optional, NULL = general
  style_prompt text NOT NULL,           -- style instructions for image generation
  negative_prompt text,                 -- what to avoid in images
  color_palette text,                   -- e.g. "warm, soft, pastel"
  art_style text,                       -- e.g. "watercolor illustration"
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. Seed: age_rules (4 age groups × 3 languages = 12 entries)
-- ============================================================

INSERT INTO public.age_rules (min_age, max_age, language, max_sentence_length, allowed_tenses, sentence_structures, vocabulary_level, complexity_level, min_word_count, max_word_count, paragraph_length, dialogue_ratio, narrative_perspective, narrative_guidelines, example_sentences) VALUES

-- === FRENCH ===
(4, 5, 'fr', 6,
  '{"présent de l''indicatif"}',
  'Uniquement des phrases simples (sujet-verbe-complément). Pas de subordonnées. Pas de propositions relatives. Une idée par phrase.',
  1, 1, 150, 250,
  '2 phrases par paragraphe maximum',
  '40-50% de dialogue – les jeunes enfants adorent les dialogues',
  'Troisième personne (il/elle)',
  'Utilise un vocabulaire du quotidien de l''enfant. Les mots doivent être concrets et visuels (animaux, couleurs, objets de la maison). Évite les abstractions. Chaque paragraphe introduit UNE action simple. Les répétitions sont souhaitées – elles aident l''apprentissage. Utilise des onomatopées (Boum! Splash! Miam!). Les phrases interrogatives directes engagent le lecteur. Fin toujours positive et rassurante.',
  '{"Le chat dort sur le lit.", "Mia joue dans le jardin.", "— Regarde! dit Tom.", "Le soleil brille. Les oiseaux chantent."}'),

(6, 7, 'fr', 10,
  '{"présent de l''indicatif", "passé composé", "futur proche (aller + infinitif)"}',
  'Phrases simples dominantes. Quelques phrases avec ''et'' ou ''mais'' pour relier deux idées. Début de subordonnées très simples (''quand...'', ''parce que...''). Maximum 2 propositions par phrase.',
  2, 2, 250, 400,
  '2-3 phrases par paragraphe',
  '35-45% de dialogue',
  'Troisième personne (il/elle)',
  'Introduis un vocabulaire légèrement plus riche mais toujours concret. Les émotions sont nommées simplement (content, triste, surpris, en colère). Les personnages peuvent avoir UN trait de caractère clair. Construis un problème simple et sa résolution. Utilise des connecteurs temporels (d''abord, ensuite, puis, enfin). Le dialogue avance l''action. Descriptions sensorielles simples (ce que le personnage voit, entend, sent).',
  '{"Mia a trouvé un petit chat dans le jardin.", "— Est-ce que je peux le garder? demande Mia.", "Le lendemain, elle va chercher de la nourriture pour le chat.", "Quand le chat ronronne, Mia est très contente."}'),

(8, 9, 'fr', 14,
  '{"présent de l''indicatif", "passé composé", "imparfait", "futur simple", "futur proche", "conditionnel présent (introduction)"}',
  'Mélange de phrases simples et complexes. Subordonnées avec ''qui'', ''que'', ''quand'', ''parce que'', ''si'', ''comme''. Phrases avec compléments circonstanciels (lieu, temps, manière). Trois propositions par phrase maximum.',
  3, 3, 400, 600,
  '3-4 phrases par paragraphe',
  '30-40% de dialogue',
  'Troisième personne, possibilité de première personne (je)',
  'Vocabulaire enrichi avec mots descriptifs et comparaisons simples. Les personnages ont des motivations et des conflits internes légers. Descriptions d''ambiance et d''atmosphère. Plusieurs péripéties possibles avant la résolution. Utilise l''imparfait pour les descriptions et le passé composé pour les actions. Le lecteur doit pouvoir faire des inférences simples (indice → conclusion). Intro de vocabulaire thématique spécifique. Humour adapté à l''âge (situations absurdes, jeux de mots simples).',
  '{"Pendant que les autres dormaient, Luna observait les étoiles depuis sa fenêtre.", "Elle avait toujours rêvé de voler comme les oiseaux qui passaient chaque matin.", "Si seulement elle pouvait trouver la carte secrète que grand-père avait cachée quelque part dans le grenier.", "— Je n''abandonnerai jamais, murmura-t-elle en serrant le médaillon dans sa main."}'),

(10, 12, 'fr', 18,
  '{"présent de l''indicatif", "passé composé", "imparfait", "plus-que-parfait", "futur simple", "futur antérieur", "conditionnel présent", "conditionnel passé", "subjonctif présent (introduction)"}',
  'Phrases complexes avec plusieurs subordonnées. Relatives, causales, concessives, hypothétiques. Appositions et incises. Discours direct et indirect. Inversion sujet-verbe possible.',
  4, 4, 600, 900,
  '4-5 phrases par paragraphe',
  '25-35% de dialogue',
  'Variable – troisième ou première personne selon le type d''histoire',
  'Vocabulaire riche et nuancé. Figures de style simples (métaphore, comparaison, personnification). Personnages multidimensionnels avec des dilemmes moraux. Sous-intrigues possibles. Descriptions détaillées qui créent une atmosphère. Le rythme narratif varie (accélération pour l''action, ralentissement pour la réflexion). Thèmes plus profonds (identité, justice, amitié complexe). Le lecteur est amené à réfléchir et interpréter. Fins ouvertes ou ambiguës possibles.',
  '{"Bien que la tempête faisait rage au-dehors, Léo n''avait pas l''intention de renoncer à son expédition.", "Il réalisa soudain que le véritable trésor n''était pas celui qu''il avait cherché pendant tout ce temps, mais les amis qu''il s''était faits en chemin.", "— Tu crois vraiment qu''on peut changer les choses? demanda Sara d''une voix hésitante.", "Le vieil homme sourit, comme s''il avait attendu cette question depuis toujours."}'),

-- === GERMAN ===
(4, 5, 'de', 6,
  '{"Präsens"}',
  'Nur einfache Hauptsätze (Subjekt-Verb-Objekt). Keine Nebensätze. Keine Relativsätze. Ein Gedanke pro Satz.',
  1, 1, 150, 250,
  'Maximal 2 Sätze pro Absatz',
  '40-50% Dialog',
  'Dritte Person (er/sie)',
  'Verwende Alltagswortschatz des Kindes. Wörter müssen konkret und bildlich sein (Tiere, Farben, Haushaltsgegenstände). Vermeide Abstraktionen. Jeder Absatz führt EINE einfache Handlung ein. Wiederholungen sind erwünscht – sie helfen beim Lernen. Verwende Lautmalerei (Bumm! Platsch! Mmmh!). Direkte Fragesätze binden den Leser ein. Das Ende ist immer positiv und beruhigend.',
  '{"Die Katze schläft auf dem Bett.", "Mia spielt im Garten.", "— Schau mal! sagt Tom.", "Die Sonne scheint. Die Vögel singen."}'),

(6, 7, 'de', 10,
  '{"Präsens", "Perfekt", "Futur I (werden + Infinitiv)"}',
  'Hauptsätze dominieren. Einige Sätze mit ''und'' oder ''aber'' verbunden. Erste sehr einfache Nebensätze (''als...'', ''weil...''). Maximal 2 Teilsätze pro Satz.',
  2, 2, 250, 400,
  '2-3 Sätze pro Absatz',
  '35-45% Dialog',
  'Dritte Person (er/sie)',
  'Etwas reicherer Wortschatz, aber immer noch konkret. Emotionen werden einfach benannt (fröhlich, traurig, überrascht, wütend). Figuren haben EIN klares Charaktermerkmal. Baue ein einfaches Problem und seine Lösung auf. Verwende zeitliche Verbindungswörter (zuerst, dann, danach, zum Schluss). Der Dialog treibt die Handlung voran. Einfache sensorische Beschreibungen (was die Figur sieht, hört, riecht).',
  '{"Mia hat eine kleine Katze im Garten gefunden.", "— Darf ich sie behalten? fragt Mia.", "Am nächsten Tag sucht sie Futter für die Katze.", "Als die Katze schnurrt, ist Mia sehr froh."}'),

(8, 9, 'de', 14,
  '{"Präsens", "Perfekt", "Präteritum", "Futur I", "Konjunktiv II (Einführung: würde + Infinitiv)"}',
  'Mischung aus einfachen und komplexen Sätzen. Nebensätze mit ''der/die/das'', ''wenn'', ''weil'', ''dass'', ''als'', ''obwohl''. Sätze mit Orts-, Zeit- und Artangaben. Maximal drei Teilsätze pro Satz.',
  3, 3, 400, 600,
  '3-4 Sätze pro Absatz',
  '30-40% Dialog',
  'Dritte Person, Ich-Form möglich',
  'Erweiterter Wortschatz mit beschreibenden Wörtern und einfachen Vergleichen. Figuren haben Motivationen und leichte innere Konflikte. Atmosphäre- und Stimmungsbeschreibungen. Mehrere Wendungen vor der Auflösung möglich. Verwende Präteritum für Erzählung und Perfekt im Dialog. Der Leser soll einfache Schlüsse ziehen können (Hinweis → Folgerung). Thematisch spezifischer Wortschatz. Altersgerechter Humor (absurde Situationen, einfache Wortspiele).',
  '{"Während die anderen schliefen, beobachtete Luna die Sterne von ihrem Fenster aus.", "Sie hatte schon immer davon geträumt, wie die Vögel zu fliegen, die jeden Morgen vorbeizogen.", "Wenn sie nur die geheime Karte finden könnte, die Opa irgendwo auf dem Dachboden versteckt hatte.", "— Ich gebe niemals auf, flüsterte sie und drückte das Medaillon fest in ihrer Hand."}'),

(10, 12, 'de', 18,
  '{"Präsens", "Perfekt", "Präteritum", "Plusquamperfekt", "Futur I", "Futur II", "Konjunktiv I (indirekte Rede)", "Konjunktiv II"}',
  'Komplexe Sätze mit mehreren Nebensätzen. Relativ-, Kausal-, Konzessiv- und Konditionalsätze. Appositionen und Einschübe. Direkte und indirekte Rede. Satzumstellungen möglich.',
  4, 4, 600, 900,
  '4-5 Sätze pro Absatz',
  '25-35% Dialog',
  'Variabel – dritte oder erste Person je nach Geschichte',
  'Reicher, nuancierter Wortschatz. Einfache Stilmittel (Metapher, Vergleich, Personifikation). Mehrdimensionale Figuren mit moralischen Dilemmata. Nebenhandlungen möglich. Detaillierte Beschreibungen, die Atmosphäre schaffen. Das Erzähltempo variiert (Beschleunigung bei Action, Verlangsamung bei Reflexion). Tiefere Themen (Identität, Gerechtigkeit, komplexe Freundschaft). Der Leser wird zum Nachdenken und Interpretieren angeregt. Offene oder ambivalente Enden möglich.',
  '{"Obwohl der Sturm draußen tobte, hatte Leo nicht vor, seine Expedition aufzugeben.", "Ihm wurde plötzlich klar, dass der wahre Schatz nicht der war, den er die ganze Zeit gesucht hatte, sondern die Freunde, die er unterwegs gewonnen hatte.", "— Glaubst du wirklich, dass wir etwas verändern können? fragte Sara mit zögernder Stimme.", "Der alte Mann lächelte, als hätte er schon immer auf diese Frage gewartet."}'),

-- === ENGLISH ===
(4, 5, 'en', 6,
  '{"simple present"}',
  'Only simple sentences (subject-verb-object). No subordinate clauses. No relative clauses. One idea per sentence.',
  1, 1, 150, 250,
  'Maximum 2 sentences per paragraph',
  '40-50% dialogue',
  'Third person (he/she)',
  'Use everyday vocabulary familiar to the child. Words must be concrete and visual (animals, colors, household objects). Avoid abstractions. Each paragraph introduces ONE simple action. Repetitions are welcome – they aid learning. Use onomatopoeia (Boom! Splash! Yum!). Direct questions engage the reader. The ending is always positive and reassuring.',
  '{"The cat sleeps on the bed.", "Mia plays in the garden.", "— Look! says Tom.", "The sun is shining. The birds are singing."}'),

(6, 7, 'en', 10,
  '{"simple present", "simple past", "going to future"}',
  'Simple sentences dominate. Some sentences connected with ''and'' or ''but''. First very simple subordinate clauses (''when...'', ''because...''). Maximum 2 clauses per sentence.',
  2, 2, 250, 400,
  '2-3 sentences per paragraph',
  '35-45% dialogue',
  'Third person (he/she)',
  'Introduce slightly richer vocabulary but keep it concrete. Emotions are named simply (happy, sad, surprised, angry). Characters have ONE clear trait. Build a simple problem and its resolution. Use time connectors (first, then, next, finally). Dialogue drives the action forward. Simple sensory descriptions (what the character sees, hears, smells).',
  '{"Mia found a little cat in the garden.", "— Can I keep it? asks Mia.", "The next day, she goes to find food for the cat.", "When the cat purrs, Mia is very happy."}'),

(8, 9, 'en', 14,
  '{"simple present", "simple past", "past continuous", "present perfect", "future (will)", "going to future", "first conditional (introduction)"}',
  'Mix of simple and complex sentences. Subordinate clauses with ''who'', ''which'', ''when'', ''because'', ''if'', ''although''. Sentences with adverbial phrases (place, time, manner). Maximum three clauses per sentence.',
  3, 3, 400, 600,
  '3-4 sentences per paragraph',
  '30-40% dialogue',
  'Third person, first person possible',
  'Enriched vocabulary with descriptive words and simple comparisons. Characters have motivations and light internal conflicts. Atmosphere and mood descriptions. Multiple twists possible before resolution. Use past tense for narration and present in dialogue when appropriate. The reader should be able to make simple inferences (clue → conclusion). Theme-specific vocabulary. Age-appropriate humor (absurd situations, simple puns).',
  '{"While the others slept, Luna watched the stars from her window.", "She had always dreamed of flying like the birds that passed by every morning.", "If only she could find the secret map that grandpa had hidden somewhere in the attic.", "— I will never give up, she whispered, clutching the medallion in her hand."}'),

(10, 12, 'en', 18,
  '{"simple present", "simple past", "past continuous", "present perfect", "past perfect", "future (will)", "future perfect", "conditionals (first, second, third)", "passive voice", "reported speech"}',
  'Complex sentences with multiple subordinate clauses. Relative, causal, concessive, and conditional clauses. Appositives and parentheticals. Direct and indirect speech. Subject-verb inversion possible.',
  4, 4, 600, 900,
  '4-5 sentences per paragraph',
  '25-35% dialogue',
  'Variable – third or first person depending on story type',
  'Rich, nuanced vocabulary. Simple literary devices (metaphor, simile, personification). Multi-dimensional characters with moral dilemmas. Subplots possible. Detailed descriptions that create atmosphere. Narrative pace varies (acceleration for action, deceleration for reflection). Deeper themes (identity, justice, complex friendship). The reader is encouraged to think and interpret. Open or ambiguous endings possible.',
  '{"Although the storm raged outside, Leo had no intention of abandoning his expedition.", "He suddenly realized that the true treasure was not the one he had been searching for all along, but the friends he had made along the way.", "— Do you really believe we can change things? Sara asked in a hesitant voice.", "The old man smiled, as if he had been waiting for that question all along."}')

ON CONFLICT (min_age, max_age, language) DO NOTHING;

-- ============================================================
-- 6. Seed: theme_rules (6 main themes + 6 educational topics × 3 languages)
-- ============================================================

INSERT INTO public.theme_rules (theme_key, language, labels, plot_templates, setting_descriptions, character_archetypes, sensory_details, typical_conflicts) VALUES

-- === FANTASY ===
('fantasy', 'fr',
  '{"de": "Märchen & Fantasie", "fr": "Contes & Fantaisie", "en": "Fairy Tales & Fantasy"}',
  '{"Un enfant ordinaire découvre un objet magique qui le transporte dans un monde enchanté", "Une créature magique a besoin d''aide et seul l''enfant peut sauver son royaume", "Un sortilège doit être brisé avant le coucher du soleil grâce à trois épreuves", "L''enfant trouve une porte secrète vers un monde où les animaux parlent"}',
  'Forêts enchantées avec des arbres lumineux, châteaux flottants dans les nuages, villages miniatures cachés sous les champignons, cavernes de cristal scintillantes, îles volantes reliées par des ponts arc-en-ciel.',
  '{"L''apprenti magicien maladroit", "La fée espiègle", "Le dragon bienveillant", "Le roi/la reine en détresse", "L''animal guide parlant", "Le gardien mystérieux"}',
  'Lueurs dorées, poussière d''étoiles, parfum de fleurs magiques, sons de clochettes, textures de mousse et de soie.',
  '{"La magie disparaît et doit être restaurée", "Un méchant sorcier menace le monde enchanté", "L''enfant doit choisir entre rentrer chez lui et rester au pays magique", "Un malentendu entre créatures magiques crée le chaos"}'),

('fantasy', 'de',
  '{"de": "Märchen & Fantasie", "fr": "Contes & Fantaisie", "en": "Fairy Tales & Fantasy"}',
  '{"Ein gewöhnliches Kind entdeckt einen magischen Gegenstand, der es in eine verzauberte Welt bringt", "Ein magisches Wesen braucht Hilfe und nur das Kind kann sein Königreich retten", "Ein Zauber muss vor Sonnenuntergang durch drei Prüfungen gebrochen werden", "Das Kind findet eine geheime Tür zu einer Welt, in der Tiere sprechen"}',
  'Verzauberte Wälder mit leuchtenden Bäumen, schwebende Schlösser in den Wolken, Miniatur-Dörfer unter Pilzen versteckt, funkelnde Kristallhöhlen, fliegende Inseln verbunden durch Regenbogenbrücken.',
  '{"Der tollpatschige Zauberlehrling", "Die schelmische Fee", "Der gutmütige Drache", "Der König/die Königin in Not", "Das sprechende Tier als Führer", "Der geheimnisvolle Wächter"}',
  'Goldenes Schimmern, Sternenstaub, Duft magischer Blumen, Klingeln von Glöckchen, Moos und Seide.',
  '{"Die Magie verschwindet und muss wiederhergestellt werden", "Ein böser Zauberer bedroht die verzauberte Welt", "Das Kind muss wählen zwischen Heimkehr und Bleiben im Zauberland", "Ein Missverständnis zwischen magischen Wesen stiftet Chaos"}'),

('fantasy', 'en',
  '{"de": "Märchen & Fantasie", "fr": "Contes & Fantaisie", "en": "Fairy Tales & Fantasy"}',
  '{"An ordinary child discovers a magical object that transports them to an enchanted world", "A magical creature needs help and only the child can save its kingdom", "A spell must be broken before sunset through three trials", "The child finds a secret door to a world where animals talk"}',
  'Enchanted forests with glowing trees, floating castles in the clouds, miniature villages hidden under mushrooms, sparkling crystal caves, flying islands connected by rainbow bridges.',
  '{"The clumsy wizard apprentice", "The mischievous fairy", "The kind-hearted dragon", "The king/queen in distress", "The talking animal guide", "The mysterious guardian"}',
  'Golden glimmers, stardust, scent of magical flowers, tinkling bells, moss and silk textures.',
  '{"Magic is disappearing and must be restored", "An evil sorcerer threatens the enchanted world", "The child must choose between going home and staying in the magical land", "A misunderstanding between magical creatures creates chaos"}'),

-- === ACTION / ADVENTURE ===
('action', 'fr',
  '{"de": "Abenteuer & Action", "fr": "Aventure & Action", "en": "Adventure & Action"}',
  '{"L''enfant trouve une carte au trésor et part en expédition avec ses amis", "Un mystère dans le quartier doit être résolu avant la fin des vacances", "L''enfant est emporté dans une aventure imprévue pendant une sortie scolaire", "Une course contre la montre pour sauver quelque chose ou quelqu''un"}',
  'Jungles luxuriantes, grottes sombres avec des torches, bateaux pirates sur l''océan, montagnes enneigées, ruines anciennes avec des passages secrets.',
  '{"L''explorateur courageux", "Le meilleur ami loyal", "Le rival qui devient allié", "Le mentor sage", "Le personnage comic relief"}',
  'Vent dans les cheveux, cœur qui bat fort, odeur de terre mouillée, bruit de pas pressés, soleil brûlant.',
  '{"Un obstacle naturel bloque le chemin", "Un rival veut atteindre le but en premier", "Le groupe doit se séparer et se retrouver", "Une trahison apparente cache une bonne intention"}'),

('action', 'de',
  '{"de": "Abenteuer & Action", "fr": "Aventure & Action", "en": "Adventure & Action"}',
  '{"Das Kind findet eine Schatzkarte und bricht mit Freunden auf", "Ein Rätsel in der Nachbarschaft muss vor Ferienende gelöst werden", "Das Kind gerät bei einem Schulausflug in ein unerwartetes Abenteuer", "Ein Wettlauf gegen die Zeit, um etwas oder jemanden zu retten"}',
  'Üppige Dschungel, dunkle Höhlen mit Fackeln, Piratenschiffe auf dem Ozean, verschneite Berge, antike Ruinen mit Geheimgängen.',
  '{"Der mutige Entdecker", "Der treue beste Freund", "Der Rivale der zum Verbündeten wird", "Der weise Mentor", "Die lustige Nebenfigur"}',
  'Wind in den Haaren, hämmerndes Herz, Geruch von feuchter Erde, hastige Schritte, brennende Sonne.',
  '{"Ein natürliches Hindernis blockiert den Weg", "Ein Rivale will das Ziel zuerst erreichen", "Die Gruppe muss sich trennen und wiederfinden", "Ein scheinbarer Verrat verbirgt eine gute Absicht"}'),

('action', 'en',
  '{"de": "Abenteuer & Action", "fr": "Aventure & Action", "en": "Adventure & Action"}',
  '{"The child finds a treasure map and sets off on an expedition with friends", "A mystery in the neighborhood must be solved before the holidays end", "The child is swept into an unexpected adventure during a school trip", "A race against time to save something or someone"}',
  'Lush jungles, dark caves with torches, pirate ships on the ocean, snowy mountains, ancient ruins with secret passages.',
  '{"The brave explorer", "The loyal best friend", "The rival who becomes an ally", "The wise mentor", "The comic relief character"}',
  'Wind in hair, pounding heart, smell of wet earth, hurried footsteps, burning sun.',
  '{"A natural obstacle blocks the path", "A rival wants to reach the goal first", "The group must split up and reunite", "An apparent betrayal hides a good intention"}'),

-- === ANIMALS ===
('animals', 'fr',
  '{"de": "Tiergeschichten", "fr": "Histoires d''animaux", "en": "Animal Stories"}',
  '{"Un animal perdu cherche le chemin du retour vers sa famille", "Un groupe d''animaux différents doit coopérer pour surmonter un défi", "Un jeune animal doit prouver sa valeur face aux doutes des autres", "L''amitié inattendue entre deux espèces très différentes"}',
  'Fermes paisibles au lever du soleil, forêts profondes avec terriers et nids, océans et récifs coralliens, savanes africaines, jardins secrets avec des mares.',
  '{"Le petit animal courageux", "Le sage ancien du groupe", "L''animal méfiant qui apprend la confiance", "Le compagnon maladroit mais attachant"}',
  'Fourrure douce, chants d''oiseaux, bruissements de feuilles, odeur de terre et d''herbe, chaleur du soleil sur le pelage.',
  '{"Un prédateur menace le groupe", "Les saisons changent et il faut migrer ou s''adapter", "Un bébé animal est séparé de sa mère", "Deux groupes d''animaux revendiquent le même territoire"}'),

('animals', 'de',
  '{"de": "Tiergeschichten", "fr": "Histoires d''animaux", "en": "Animal Stories"}',
  '{"Ein verlorenes Tier sucht den Weg zurück zu seiner Familie", "Verschiedene Tiere müssen zusammenarbeiten um eine Herausforderung zu meistern", "Ein junges Tier muss seinen Wert beweisen", "Die unerwartete Freundschaft zwischen zwei sehr unterschiedlichen Arten"}',
  'Friedliche Bauernhöfe bei Sonnenaufgang, tiefe Wälder mit Bauten und Nestern, Ozeane und Korallenriffe, afrikanische Savannen, geheime Gärten mit Teichen.',
  '{"Das mutige kleine Tier", "Der weise Älteste der Gruppe", "Das misstrauische Tier das Vertrauen lernt", "Der tollpatschige aber liebenswerte Begleiter"}',
  'Weiches Fell, Vogelgesang, Rascheln von Blättern, Geruch von Erde und Gras, Sonnenwärme auf dem Fell.',
  '{"Ein Raubtier bedroht die Gruppe", "Die Jahreszeiten ändern sich und es muss gewandert oder angepasst werden", "Ein Tierbaby wird von seiner Mutter getrennt", "Zwei Tiergruppen beanspruchen das gleiche Revier"}'),

('animals', 'en',
  '{"de": "Tiergeschichten", "fr": "Histoires d''animaux", "en": "Animal Stories"}',
  '{"A lost animal searches for the way back to its family", "A group of different animals must cooperate to overcome a challenge", "A young animal must prove its worth despite others'' doubts", "The unexpected friendship between two very different species"}',
  'Peaceful farms at sunrise, deep forests with burrows and nests, oceans and coral reefs, African savannas, secret gardens with ponds.',
  '{"The brave little animal", "The wise elder of the group", "The wary animal that learns trust", "The clumsy but lovable companion"}',
  'Soft fur, birdsong, rustling leaves, smell of earth and grass, warm sun on fur.',
  '{"A predator threatens the group", "Seasons change and migration or adaptation is needed", "A baby animal is separated from its mother", "Two animal groups claim the same territory"}'),

-- === EVERYDAY / FEELINGS ===
('everyday', 'fr',
  '{"de": "Alltag & Gefühle", "fr": "Quotidien & Émotions", "en": "Everyday & Feelings"}',
  '{"Un enfant fait face à un changement dans sa vie quotidienne et apprend à s''adapter", "Un malentendu entre amis qui se résout par la communication", "L''enfant découvre une passion ou un talent inattendu", "Le premier jour dans un nouvel environnement (école, quartier, activité)"}',
  'Maisons chaleureuses, cours de récréation animées, parcs de quartier, salles de classe, chambres d''enfant, cuisines familiales au moment du goûter.',
  '{"L''enfant sensible et observateur", "Le nouveau venu timide", "Le grand frère/grande sœur protecteur", "L''ami fidèle", "Le voisin original"}',
  'Odeur de gâteau au four, rires d''enfants, lumière tamisée du soir, texture des crayons de couleur, goût du chocolat chaud.',
  '{"Un ami déménage et il faut gérer la séparation", "Un enfant se sent différent des autres", "Un secret qui pèse et qui doit être partagé", "La jalousie face à un nouveau bébé ou un nouveau camarade"}'),

('everyday', 'de',
  '{"de": "Alltag & Gefühle", "fr": "Quotidien & Émotions", "en": "Everyday & Feelings"}',
  '{"Ein Kind stellt sich einer Veränderung im Alltag und lernt sich anzupassen", "Ein Missverständnis unter Freunden das durch Kommunikation gelöst wird", "Das Kind entdeckt eine unerwartete Leidenschaft oder ein Talent", "Der erste Tag in einer neuen Umgebung (Schule, Nachbarschaft, Aktivität)"}',
  'Gemütliche Häuser, lebhafte Schulhöfe, Stadtteilparks, Klassenzimmer, Kinderzimmer, Familienküchen zur Snackzeit.',
  '{"Das sensible und aufmerksame Kind", "Der schüchterne Neuankömmling", "Der beschützende große Bruder/die große Schwester", "Der treue Freund", "Der originelle Nachbar"}',
  'Duft von Kuchen im Ofen, Kinderlachen, gedämpftes Abendlicht, Textur von Buntstiften, Geschmack heißer Schokolade.',
  '{"Ein Freund zieht weg und die Trennung muss verarbeitet werden", "Ein Kind fühlt sich anders als die anderen", "Ein Geheimnis das drückt und geteilt werden muss", "Eifersucht auf ein neues Baby oder einen neuen Kameraden"}'),

('everyday', 'en',
  '{"de": "Alltag & Gefühle", "fr": "Quotidien & Émotions", "en": "Everyday & Feelings"}',
  '{"A child faces a change in daily life and learns to adapt", "A misunderstanding between friends that resolves through communication", "The child discovers an unexpected passion or talent", "The first day in a new environment (school, neighborhood, activity)"}',
  'Cozy homes, lively school playgrounds, neighborhood parks, classrooms, children''s bedrooms, family kitchens at snack time.',
  '{"The sensitive and observant child", "The shy newcomer", "The protective older sibling", "The loyal friend", "The quirky neighbor"}',
  'Smell of cake in the oven, children''s laughter, soft evening light, texture of crayons, taste of hot chocolate.',
  '{"A friend moves away and the separation must be processed", "A child feels different from the others", "A secret that weighs heavy and must be shared", "Jealousy about a new baby or a new classmate"}'),

-- === HUMOR ===
('humor', 'fr',
  '{"de": "Humor & Chaos", "fr": "Humour & Chaos", "en": "Humor & Chaos"}',
  '{"Tout va de travers quand un enfant essaie de préparer une surprise", "Un objet du quotidien se met à faire des choses absurdes", "Un animal de compagnie cause une série de catastrophes comiques", "Échange de rôles : l''enfant devient le parent et le parent devient l''enfant"}',
  'Cuisines en désordre, fêtes d''anniversaire chaotiques, salles de classe pendant une expérience qui tourne mal, zoos le jour où les animaux décident de changer d''enclos.',
  '{"L''enfant inventeur dont les plans échouent toujours de façon spectaculaire", "L''animal excentrique", "Le personnage qui prend tout au pied de la lettre", "Le jumeau farceur"}',
  'Bruits improbables, couleurs vives et éclaboussures, odeurs surprenantes (fromage qui pue, potions ratées), textures gluantes.',
  '{"Chaque tentative de résoudre le problème empire les choses", "Un quiproquo crée une chaîne de situations absurdes", "Un objet magique fait exactement le contraire de ce qu''on attend", "La préparation secrète d''un événement tourne au désastre comique"}'),

('humor', 'de',
  '{"de": "Humor & Chaos", "fr": "Humour & Chaos", "en": "Humor & Chaos"}',
  '{"Alles geht schief als ein Kind eine Überraschung vorbereiten will", "Ein Alltagsgegenstand beginnt absurde Dinge zu tun", "Ein Haustier verursacht eine Serie komischer Katastrophen", "Rollentausch: Das Kind wird zum Elternteil und umgekehrt"}',
  'Unordentliche Küchen, chaotische Geburtstagsfeiern, Klassenzimmer während eines missglückten Experiments, Zoos am Tag als die Tiere beschließen die Gehege zu tauschen.',
  '{"Das Erfinderkind dessen Pläne immer spektakulär scheitern", "Das exzentrische Tier", "Die Figur die alles wörtlich nimmt", "Der Spaßvogel-Zwilling"}',
  'Unwahrscheinliche Geräusche, knallige Farben und Spritzer, überraschende Gerüche (stinkender Käse, misslungene Tränke), schleimige Texturen.',
  '{"Jeder Versuch das Problem zu lösen macht es schlimmer", "Ein Missverständnis löst eine Kette absurder Situationen aus", "Ein magischer Gegenstand tut genau das Gegenteil von dem was man erwartet", "Die geheime Vorbereitung einer Veranstaltung endet im komischen Desaster"}'),

('humor', 'en',
  '{"de": "Humor & Chaos", "fr": "Humour & Chaos", "en": "Humor & Chaos"}',
  '{"Everything goes wrong when a child tries to prepare a surprise", "An everyday object starts doing absurd things", "A pet causes a series of comical catastrophes", "Role swap: the child becomes the parent and the parent becomes the child"}',
  'Messy kitchens, chaotic birthday parties, classrooms during a failed experiment, zoos on the day animals decide to swap enclosures.',
  '{"The inventor child whose plans always fail spectacularly", "The eccentric animal", "The character who takes everything literally", "The prankster twin"}',
  'Improbable sounds, bright colors and splashes, surprising smells (stinky cheese, failed potions), slimy textures.',
  '{"Every attempt to solve the problem makes things worse", "A misunderstanding triggers a chain of absurd situations", "A magical object does the exact opposite of what is expected", "The secret preparation of an event turns into a comical disaster"}'),

-- === EDUCATIONAL ===
('educational', 'fr',
  '{"de": "Wissen & Entdecken", "fr": "Savoir & Découvrir", "en": "Learn & Discover"}',
  '{"Un enfant curieux pose une question et part en voyage de découverte pour trouver la réponse", "Un personnage historique raconte son histoire comme s''il parlait à l''enfant", "L''enfant se réveille dans une époque différente et observe comment les gens vivaient", "Un animal ou objet scientifique explique son propre fonctionnement de façon ludique"}',
  'Laboratoires imaginaires, machines à remonter le temps, bibliothèques enchantées, observatoires, musées qui prennent vie la nuit.',
  '{"L''enfant curieux qui pose toujours des questions", "Le professeur excentrique", "Le robot assistant sympathique", "L''animal expert de son écosystème"}',
  'Précision des détails, couleurs naturelles, sons authentiques de la nature ou de la ville historique, textures des matériaux étudiés.',
  '{"L''enfant doit résoudre un problème en utilisant ses nouvelles connaissances", "Une expérience scientifique ne donne pas le résultat attendu", "Deux théories s''affrontent et l''enfant doit trouver la vérité", "Un phénomène naturel mystérieux doit être expliqué"}'),

('educational', 'de',
  '{"de": "Wissen & Entdecken", "fr": "Savoir & Découvrir", "en": "Learn & Discover"}',
  '{"Ein neugieriges Kind stellt eine Frage und begibt sich auf eine Entdeckungsreise", "Eine historische Persönlichkeit erzählt ihre Geschichte als spräche sie zum Kind", "Das Kind wacht in einer anderen Epoche auf und beobachtet wie die Menschen lebten", "Ein Tier oder wissenschaftliches Objekt erklärt spielerisch seine eigene Funktionsweise"}',
  'Fantasie-Labore, Zeitmaschinen, verzauberte Bibliotheken, Sternwarten, Museen die nachts lebendig werden.',
  '{"Das neugierige Kind das immer Fragen stellt", "Der verrückte Professor", "Der freundliche Roboter-Assistent", "Das Tier als Experte seines Ökosystems"}',
  'Präzise Details, Naturfarben, authentische Geräusche aus Natur oder historischer Stadt, Texturen der untersuchten Materialien.',
  '{"Das Kind muss ein Problem mit neuem Wissen lösen", "Ein wissenschaftliches Experiment liefert unerwartete Ergebnisse", "Zwei Theorien stehen sich gegenüber und das Kind muss die Wahrheit finden", "Ein mysteriöses Naturphänomen muss erklärt werden"}'),

('educational', 'en',
  '{"de": "Wissen & Entdecken", "fr": "Savoir & Découvrir", "en": "Learn & Discover"}',
  '{"A curious child asks a question and goes on a discovery journey to find the answer", "A historical figure tells their story as if speaking to the child", "The child wakes up in a different era and observes how people lived", "An animal or scientific object explains its own workings in a playful way"}',
  'Imaginary laboratories, time machines, enchanted libraries, observatories, museums that come alive at night.',
  '{"The curious child who always asks questions", "The eccentric professor", "The friendly robot assistant", "The animal as expert of its ecosystem"}',
  'Precise details, natural colors, authentic sounds from nature or historical cities, textures of studied materials.',
  '{"The child must solve a problem using new knowledge", "A scientific experiment yields unexpected results", "Two theories clash and the child must find the truth", "A mysterious natural phenomenon must be explained"}')

ON CONFLICT (theme_key, language) DO NOTHING;

-- ============================================================
-- 7. Seed: emotion_rules (6 emotions × 3 languages = 18 entries)
-- ============================================================

INSERT INTO public.emotion_rules (emotion_key, language, labels, conflict_patterns, character_development, resolution_patterns, emotional_vocabulary) VALUES

-- === JOY (EM-J) ===
('joy', 'fr',
  '{"de": "Freude", "fr": "Joie", "en": "Joy"}',
  '{"Un moment de bonheur menacé par un petit obstacle qui rend le dénouement encore plus satisfaisant", "La recherche d''un bonheur simple que l''enfant ne voit pas au début", "Un cadeau ou une surprise qui ne se passe pas comme prévu mais finit encore mieux"}',
  'Le personnage passe de l''attente ou de l''impatience à la gratitude. Il apprend que le bonheur vient souvent des petites choses et des moments partagés, pas des grands événements.',
  '{"La joie est multipliée quand elle est partagée", "Ce qui semblait perdu revient sous une forme inattendue", "Le personnage crée sa propre joie au lieu de l''attendre"}',
  '{"émerveillé", "radieux", "débordant de joie", "le cœur léger", "pétillant", "enthousiaste", "reconnaissant"}'),

('joy', 'de',
  '{"de": "Freude", "fr": "Joie", "en": "Joy"}',
  '{"Ein Moment des Glücks wird durch ein kleines Hindernis bedroht das die Auflösung umso befriedigender macht", "Die Suche nach einem einfachen Glück das das Kind anfangs nicht sieht", "Ein Geschenk oder eine Überraschung die nicht wie geplant läuft aber noch besser endet"}',
  'Die Figur entwickelt sich von Erwartung oder Ungeduld zu Dankbarkeit. Sie lernt dass Glück oft von kleinen Dingen und geteilten Momenten kommt, nicht von großen Ereignissen.',
  '{"Freude wird größer wenn man sie teilt", "Was verloren schien kommt in unerwarteter Form zurück", "Die Figur erschafft ihre eigene Freude statt auf sie zu warten"}',
  '{"begeistert", "strahlend", "überglücklich", "leichten Herzens", "vor Freude hüpfend", "dankbar", "beflügelt"}'),

('joy', 'en',
  '{"de": "Freude", "fr": "Joie", "en": "Joy"}',
  '{"A moment of happiness threatened by a small obstacle that makes the resolution even more satisfying", "The search for a simple joy that the child doesn''t see at first", "A gift or surprise that doesn''t go as planned but ends even better"}',
  'The character moves from anticipation or impatience to gratitude. They learn that happiness often comes from small things and shared moments, not grand events.',
  '{"Joy is multiplied when shared", "What seemed lost returns in an unexpected form", "The character creates their own joy instead of waiting for it"}',
  '{"delighted", "radiant", "overjoyed", "lighthearted", "bubbling with happiness", "grateful", "elated"}'),

-- === THRILL (EM-T) ===
('thrill', 'fr',
  '{"de": "Spannung", "fr": "Suspense", "en": "Thrill"}',
  '{"Un compte à rebours crée l''urgence – le personnage doit agir vite", "Un mystère s''approfondit avec chaque indice trouvé", "Le personnage est poursuivi ou doit fuir un danger", "Un lieu familier révèle soudain un aspect inconnu et inquiétant"}',
  'Le personnage surmonte sa peur initiale et découvre un courage qu''il ne se connaissait pas. La tension monte progressivement, puis se relâche dans un soulagement partagé.',
  '{"Le danger était en réalité moins terrible qu''il semblait", "L''ennemi mystérieux se révèle être un allié incompris", "La clé de la solution était sous les yeux du personnage depuis le début"}',
  '{"le souffle coupé", "le cœur battant", "sur ses gardes", "tendu comme un arc", "frissonnant", "aux aguets", "retenir sa respiration"}'),

('thrill', 'de',
  '{"de": "Spannung", "fr": "Suspense", "en": "Thrill"}',
  '{"Ein Countdown erzeugt Dringlichkeit – die Figur muss schnell handeln", "Ein Rätsel vertieft sich mit jedem gefundenen Hinweis", "Die Figur wird verfolgt oder muss vor einer Gefahr fliehen", "Ein vertrauter Ort enthüllt plötzlich eine unbekannte beunruhigende Seite"}',
  'Die Figur überwindet ihre anfängliche Angst und entdeckt einen Mut den sie nicht kannte. Die Spannung steigt stetig und löst sich in gemeinsamer Erleichterung.',
  '{"Die Gefahr war in Wirklichkeit weniger schlimm als sie schien", "Der mysteriöse Feind entpuppt sich als missverstandener Verbündeter", "Der Schlüssel zur Lösung lag die ganze Zeit vor den Augen der Figur"}',
  '{"atemlos", "mit pochendem Herzen", "auf der Hut", "angespannt wie eine Feder", "schaudernd", "wachsam", "den Atem anhaltend"}'),

('thrill', 'en',
  '{"de": "Spannung", "fr": "Suspense", "en": "Thrill"}',
  '{"A countdown creates urgency – the character must act fast", "A mystery deepens with each clue found", "The character is chased or must flee from danger", "A familiar place suddenly reveals an unknown and unsettling side"}',
  'The character overcomes their initial fear and discovers a courage they didn''t know they had. Tension builds steadily, then releases in shared relief.',
  '{"The danger was actually less terrible than it seemed", "The mysterious enemy turns out to be a misunderstood ally", "The key to the solution was right before the character''s eyes all along"}',
  '{"breathless", "heart pounding", "on guard", "tense as a bowstring", "shivering", "watchful", "holding their breath"}'),

-- === HUMOR (EM-H) ===
('humor_emotion', 'fr',
  '{"de": "Humor", "fr": "Humour", "en": "Humor"}',
  '{"Une situation quotidienne dérape de façon absurde et incontrôlable", "Un personnage prend une expression au pied de la lettre avec des conséquences hilarantes", "Des quiproquos en cascade – chaque malentendu empire les choses", "Le personnage essaie de cacher une bêtise et s''enfonce de plus en plus"}',
  'Le personnage apprend à rire de ses erreurs et à ne pas se prendre trop au sérieux. L''humour vient de la reconnaissance – le lecteur se reconnaît dans les situations.',
  '{"La vérité éclate de la façon la plus drôle possible", "Le chaos se résout quand tout le monde rit ensemble", "Ce qui semblait être un désastre devient le meilleur souvenir"}',
  '{"écroulé de rire", "les yeux écarquillés", "mort de rire", "hilare", "plié en deux", "le fou rire", "pouffer"}'),

('humor_emotion', 'de',
  '{"de": "Humor", "fr": "Humour", "en": "Humor"}',
  '{"Eine Alltagssituation gerät absurd und unkontrollierbar aus dem Ruder", "Eine Figur nimmt eine Redewendung wörtlich mit urkomischen Folgen", "Missverständnisse häufen sich – jedes macht die Sache schlimmer", "Die Figur versucht einen Fehler zu vertuschen und verstrickt sich immer tiefer"}',
  'Die Figur lernt über ihre Fehler zu lachen und sich nicht zu ernst zu nehmen. Humor entsteht durch Wiedererkennung – der Leser erkennt sich in den Situationen.',
  '{"Die Wahrheit kommt auf die lustigste Art ans Licht", "Das Chaos löst sich auf wenn alle gemeinsam lachen", "Was wie ein Desaster aussah wird zur besten Erinnerung"}',
  '{"vor Lachen auf dem Boden", "mit großen Augen", "Tränen lachend", "prustend", "sich den Bauch haltend", "Lachanfall", "kichernd"}'),

('humor_emotion', 'en',
  '{"de": "Humor", "fr": "Humour", "en": "Humor"}',
  '{"An everyday situation spirals absurdly out of control", "A character takes an expression literally with hilarious consequences", "Cascading misunderstandings – each one makes things worse", "The character tries to hide a mistake and digs deeper and deeper"}',
  'The character learns to laugh at their mistakes and not take themselves too seriously. Humor comes from recognition – the reader sees themselves in the situations.',
  '{"The truth comes out in the funniest way possible", "Chaos resolves when everyone laughs together", "What seemed like a disaster becomes the best memory"}',
  '{"rolling on the floor laughing", "wide-eyed", "crying with laughter", "snorting", "holding their belly", "giggle fit", "chuckling"}'),

-- === WARMTH (EM-W) ===
('warmth', 'fr',
  '{"de": "Wärme", "fr": "Chaleur/Tendresse", "en": "Warmth"}',
  '{"Un geste simple de gentillesse qui crée un lien inattendu", "Retrouver quelqu''un ou quelque chose de cher après une séparation", "Un personnage découvre combien il compte pour les autres", "Un moment de complicité entre un enfant et un adulte bienveillant"}',
  'Le personnage passe du doute ou de la solitude à la certitude d''être aimé. Les petits gestes comptent plus que les grandes déclarations.',
  '{"La chaleur humaine triomphe du froid de la solitude", "Un souvenir partagé renforce le lien entre les personnages", "Le personnage réalise qu''il n''a jamais été seul"}',
  '{"attendri", "ému", "le cœur rempli", "blotti", "réconforté", "touché", "enveloppé de douceur"}'),

('warmth', 'de',
  '{"de": "Wärme", "fr": "Chaleur/Tendresse", "en": "Warmth"}',
  '{"Eine einfache freundliche Geste die eine unerwartete Verbindung schafft", "Wiedersehen mit jemandem oder etwas Liebem nach einer Trennung", "Eine Figur entdeckt wie viel sie anderen bedeutet", "Ein Moment der Vertrautheit zwischen Kind und wohlwollendem Erwachsenem"}',
  'Die Figur entwickelt sich von Zweifel oder Einsamkeit zur Gewissheit geliebt zu werden. Kleine Gesten zählen mehr als große Erklärungen.',
  '{"Menschliche Wärme besiegt die Kälte der Einsamkeit", "Eine geteilte Erinnerung stärkt die Bindung zwischen den Figuren", "Die Figur erkennt dass sie nie allein war"}',
  '{"gerührt", "bewegt", "mit warmem Herzen", "angekuschelt", "getröstet", "berührt", "in Geborgenheit gehüllt"}'),

('warmth', 'en',
  '{"de": "Wärme", "fr": "Chaleur/Tendresse", "en": "Warmth"}',
  '{"A simple act of kindness that creates an unexpected bond", "Reuniting with someone or something dear after a separation", "A character discovers how much they mean to others", "A moment of closeness between a child and a caring adult"}',
  'The character moves from doubt or loneliness to the certainty of being loved. Small gestures count more than grand declarations.',
  '{"Human warmth triumphs over the cold of loneliness", "A shared memory strengthens the bond between characters", "The character realizes they were never alone"}',
  '{"touched", "moved", "warm-hearted", "snuggled", "comforted", "stirred", "wrapped in tenderness"}'),

-- === CURIOSITY (EM-C) ===
('curiosity', 'fr',
  '{"de": "Neugier", "fr": "Curiosité", "en": "Curiosity"}',
  '{"Une question sans réponse pousse le personnage à explorer un lieu inconnu", "Un phénomène étrange se produit et le personnage veut comprendre pourquoi", "Le personnage découvre un objet mystérieux qui ouvre une piste d''enquête", "Quelqu''un dit ''c''est impossible'' et le personnage veut prouver le contraire"}',
  'Le personnage passe de la simple curiosité à une compréhension plus profonde du monde. Chaque découverte mène à de nouvelles questions – la curiosité se nourrit elle-même.',
  '{"La réponse est plus fascinante que la question initiale", "Le personnage découvre que la recherche est aussi précieuse que la réponse", "Une découverte inattendue ouvre un nouveau champ de possibilités"}',
  '{"fasciné", "intrigué", "émerveillé", "les yeux grand ouverts", "captivé", "assoiffé de savoir", "étonné"}'),

('curiosity', 'de',
  '{"de": "Neugier", "fr": "Curiosité", "en": "Curiosity"}',
  '{"Eine unbeantwortete Frage treibt die Figur an einen unbekannten Ort zu erkunden", "Ein seltsames Phänomen geschieht und die Figur will verstehen warum", "Die Figur entdeckt einen geheimnisvollen Gegenstand der eine Spur eröffnet", "Jemand sagt ''das ist unmöglich'' und die Figur will das Gegenteil beweisen"}',
  'Die Figur entwickelt sich von einfacher Neugier zu einem tieferen Verständnis der Welt. Jede Entdeckung führt zu neuen Fragen – Neugier nährt sich selbst.',
  '{"Die Antwort ist faszinierender als die ursprüngliche Frage", "Die Figur entdeckt dass die Suche genauso wertvoll ist wie die Antwort", "Eine unerwartete Entdeckung eröffnet neue Möglichkeiten"}',
  '{"fasziniert", "neugierig", "staunend", "mit großen Augen", "gefesselt", "wissbegierig", "verblüfft"}'),

('curiosity', 'en',
  '{"de": "Neugier", "fr": "Curiosité", "en": "Curiosity"}',
  '{"An unanswered question drives the character to explore an unknown place", "A strange phenomenon occurs and the character wants to understand why", "The character discovers a mysterious object that opens a trail of investigation", "Someone says ''that''s impossible'' and the character wants to prove otherwise"}',
  'The character moves from simple curiosity to a deeper understanding of the world. Each discovery leads to new questions – curiosity feeds itself.',
  '{"The answer is more fascinating than the initial question", "The character discovers that the search is as precious as the answer", "An unexpected discovery opens a new field of possibilities"}',
  '{"fascinated", "intrigued", "amazed", "wide-eyed", "captivated", "thirsty for knowledge", "astonished"}'),

-- === DEPTH (EM-D) ===
('depth', 'fr',
  '{"de": "Tiefgang", "fr": "Profondeur", "en": "Depth"}',
  '{"Le personnage fait face à une perte et apprend à l''accepter progressivement", "Un choix difficile entre deux options qui ont chacune des conséquences", "Le personnage découvre une vérité inconfortable sur lui-même ou sur quelqu''un qu''il admire", "Une injustice qui pousse le personnage à agir malgré la peur"}',
  'Le personnage gagne en maturité émotionnelle. Il apprend que la vie n''est pas toujours simple, mais que la force vient de la capacité à affronter les difficultés avec honnêteté.',
  '{"L''acceptation apporte une paix inattendue", "Le personnage grandit grâce à l''épreuve plutôt que malgré elle", "Comprendre les autres mène au pardon et à la réconciliation"}',
  '{"songeur", "mélancolique", "tiraillé", "résolu malgré la douleur", "mûri", "apaisé", "plus sage"}'),

('depth', 'de',
  '{"de": "Tiefgang", "fr": "Profondeur", "en": "Depth"}',
  '{"Die Figur steht vor einem Verlust und lernt ihn schrittweise zu akzeptieren", "Eine schwere Wahl zwischen zwei Optionen die jeweils Konsequenzen haben", "Die Figur entdeckt eine unbequeme Wahrheit über sich selbst oder jemanden den sie bewundert", "Eine Ungerechtigkeit die die Figur trotz Angst zum Handeln bringt"}',
  'Die Figur gewinnt emotionale Reife. Sie lernt dass das Leben nicht immer einfach ist, aber dass Stärke aus der Fähigkeit kommt Schwierigkeiten ehrlich zu begegnen.',
  '{"Akzeptanz bringt unerwarteten Frieden", "Die Figur wächst durch die Prüfung, nicht trotz ihr", "Andere verstehen führt zu Vergebung und Versöhnung"}',
  '{"nachdenklich", "wehmütig", "hin- und hergerissen", "entschlossen trotz Schmerz", "gereift", "beruhigt", "weiser"}'),

('depth', 'en',
  '{"de": "Tiefgang", "fr": "Profondeur", "en": "Depth"}',
  '{"The character faces a loss and learns to accept it gradually", "A difficult choice between two options that each have consequences", "The character discovers an uncomfortable truth about themselves or someone they admire", "An injustice that drives the character to act despite fear"}',
  'The character gains emotional maturity. They learn that life is not always simple, but that strength comes from the ability to face difficulties with honesty.',
  '{"Acceptance brings unexpected peace", "The character grows through the ordeal rather than despite it", "Understanding others leads to forgiveness and reconciliation"}',
  '{"thoughtful", "wistful", "torn", "resolved despite the pain", "matured", "at peace", "wiser"}')

ON CONFLICT (emotion_key, language) DO NOTHING;

-- ============================================================
-- 8. Seed: image_style_rules (3 age groups × 2 text types + general)
-- ============================================================

INSERT INTO public.image_style_rules (age_group, theme_key, style_prompt, negative_prompt, color_palette, art_style) VALUES

-- General fiction styles by age
('4-6', NULL,
  'Colorful cartoon style with soft rounded shapes, friendly characters with big expressive eyes, simple backgrounds with bright colors. Similar to Peppa Pig or Bluey style. Warm and inviting atmosphere.',
  'No scary images, no dark shadows, no sharp edges, no realistic proportions, no text or letters, no violence',
  'Warm pastel tones, bright primary colors, soft gradients',
  'Cute cartoon / picture book illustration'),

('7-9', NULL,
  'Colorful cartoon style, friendly characters with expressive faces, slightly more detailed backgrounds with depth. Similar to Disney Junior or Pixar Junior style. Dynamic poses and action-oriented compositions.',
  'No scary or disturbing imagery, no overly realistic proportions, no text or letters, no violence or blood',
  'Vibrant colors, warm tones, dynamic contrasts',
  'Modern animated movie / comic book style'),

('10-12', NULL,
  'Semi-realistic illustration style with detailed environments, characters with realistic proportions, dynamic compositions, atmospheric lighting. Similar to graphic novel or manga-inspired art.',
  'No overly childish style, no scary imagery inappropriate for children, no text or letters, no explicit violence',
  'Rich color palette, atmospheric lighting, natural tones with accents',
  'Graphic novel / semi-realistic illustration'),

-- Non-fiction specific styles
('4-6', 'educational',
  'Clean educational illustration style with accurate but friendly depictions. Clear visual hierarchy, labeled elements where appropriate (without text). Bright and informative. Similar to quality children''s encyclopedia.',
  'No scary imagery, no text or letters in the image, no overly abstract representations',
  'Bright educational colors, high contrast for clarity',
  'Children''s encyclopedia / friendly infographic'),

('7-9', 'educational',
  'Detailed educational illustration with realistic proportions and informative visual elements. Documentary photography inspired. Similar to DK Eyewitness or Usborne educational books.',
  'No text in the image, no overly stylized or inaccurate depictions',
  'Natural colors, educational palette, documentary tones',
  'Educational textbook / documentary illustration'),

('10-12', 'educational',
  'Sophisticated documentary illustration style, realistic and accurate, scientific visualization quality. Infographic elements without text. Similar to National Geographic or science magazines for young readers.',
  'No text, no oversimplified depictions, no childish cartoon style',
  'Professional documentary palette, precise natural colors',
  'Scientific illustration / documentary style')

ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. RLS Policies
-- ============================================================

-- age_rules: read for all, write for admin only
ALTER TABLE public.age_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "age_rules_select" ON public.age_rules;
CREATE POLICY "age_rules_select" ON public.age_rules FOR SELECT USING (true);

-- theme_rules: read for all, write for admin only
ALTER TABLE public.theme_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "theme_rules_select" ON public.theme_rules;
CREATE POLICY "theme_rules_select" ON public.theme_rules FOR SELECT USING (true);

-- emotion_rules: read for all, write for admin only
ALTER TABLE public.emotion_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emotion_rules_select" ON public.emotion_rules;
CREATE POLICY "emotion_rules_select" ON public.emotion_rules FOR SELECT USING (true);

-- image_style_rules: read for all, write for admin only
ALTER TABLE public.image_style_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "image_style_rules_select" ON public.image_style_rules;
CREATE POLICY "image_style_rules_select" ON public.image_style_rules FOR SELECT USING (true);

-- Auto-update updated_at triggers
DROP TRIGGER IF EXISTS update_age_rules_updated_at ON public.age_rules;
CREATE TRIGGER update_age_rules_updated_at
  BEFORE UPDATE ON public.age_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_theme_rules_updated_at ON public.theme_rules;
CREATE TRIGGER update_theme_rules_updated_at
  BEFORE UPDATE ON public.theme_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emotion_rules_updated_at ON public.emotion_rules;
CREATE TRIGGER update_emotion_rules_updated_at
  BEFORE UPDATE ON public.emotion_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_image_style_rules_updated_at ON public.image_style_rules;
CREATE TRIGGER update_image_style_rules_updated_at
  BEFORE UPDATE ON public.image_style_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
