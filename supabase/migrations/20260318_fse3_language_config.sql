-- Migration 2: FSE3 Language Config
-- Creates the fse3_language_config table and seeds 9 rows (DE/FR/EN x Level 1/2/3).

CREATE TABLE IF NOT EXISTS fse3_language_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  level INTEGER NOT NULL,
  tense_rules TEXT NOT NULL,
  tense_example TEXT NOT NULL,
  max_sentence_length INTEGER NOT NULL,
  avg_sentence_length INTEGER NOT NULL,
  vocabulary_guidance TEXT NOT NULL,
  adjective_limit INTEGER NOT NULL DEFAULT 2,
  additional_rules TEXT,
  dialogue_format TEXT NOT NULL,
  dialogue_example_spoken TEXT NOT NULL,
  dialogue_example_thought TEXT NOT NULL,
  rhythm_example_right TEXT NOT NULL,
  rhythm_example_wrong TEXT NOT NULL,
  scenic_example_right TEXT NOT NULL,
  scenic_example_wrong TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(language_code, level)
);

-- Trigger for updated_at
CREATE TRIGGER update_fse3_language_config_updated_at
  BEFORE UPDATE ON fse3_language_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE fse3_language_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read fse3_language_config" ON fse3_language_config
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin write fse3_language_config" ON fse3_language_config
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Seed: 9 Rows (DE/FR/EN x L1/L2/L3)

-- DE Level 1
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'de', 1,
  $$Tense: Präteritum (narrative past) as main tense. No Plusquamperfekt. Present tense ONLY inside direct dialogue. Example: "Mia lief zum Baum. Der Vogel saß ganz oben."$$,
  $$Mia lief zum Baum. Der Vogel saß ganz oben. Sie rief: „Hallo, kleiner Vogel!"$$,
  12, 8,
  $$Simple, concrete words a 7-year-old knows. No compound words longer than 2 parts. No abstract concepts. Prefer familiar, everyday vocabulary.$$,
  1,
  $$Short paragraphs. Simple sentence structures (subject-verb-object). No subordinate clauses with "obwohl", "während". Simple connectors only: "und", "aber", "dann", "weil".$$,
  $$„German quotes" with „ and "$$,
  $$„Komm schnell!" rief Mia.$$,
  $$„Was ist das?", dachte Mia.$$,
  $$Mia lief los. Der Wind blies ihr ins Gesicht, und die Blätter tanzten um sie herum. Stille.$$,
  $$Mia lief los. Sie sah den Wind. Die Blätter flogen. Es war still.$$,
  $$Mias Herz klopfte laut, als sie die Tür öffnete.$$,
  $$Mia hatte Angst, als sie die Tür öffnete.$$
);

-- DE Level 2
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'de', 2,
  $$Tense: Präteritum as main tense. Plusquamperfekt only for clear flashbacks. Present tense ONLY inside direct dialogue. Example: "Elias rannte durch den Wald. Das Licht, das er vorher gesehen hatte, war verschwunden."$$,
  $$Elias rannte durch den Wald. Das Licht, das er vorher gesehen hatte, war verschwunden. „Wo bist du?", rief er.$$,
  18, 10,
  $$Age-appropriate for a confident 9-year-old. Simple compound words OK (Schattenwald, Feuerball). No academic vocabulary. Prefer vivid, concrete words.$$,
  2,
  $$Relative clauses allowed. Simple subordinate clauses with "weil", "obwohl", "als". Connectors: "deshalb", "trotzdem", "plötzlich".$$,
  $$„German quotes" with „ and "$$,
  $$„Wir müssen einen Plan machen!" sagte Elias.$$,
  $$„Das kann doch nicht sein!", dachte Elias.$$,
  $$Elias duckte sich. Der Feuerball raste über seinen Kopf hinweg und schlug krachend in die Felswand ein. Stille.$$,
  $$Elias duckte sich. Der Feuerball flog über ihn. Er schlug in die Wand. Es war laut.$$,
  $$Elias' Hände zitterten, als er den Stein berührte.$$,
  $$Elias war nervös, als er den Stein fand.$$
);

-- DE Level 3
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'de', 3,
  $$Tense: Präteritum (narrative past) as main tense. Plusquamperfekt only for clear flashbacks. Present tense ONLY inside direct dialogue. Example: "Elias hob das Amulett. Das Licht, das er vorher entdeckt hatte, wurde stärker."$$,
  $$Elias hob das Amulett. Das Licht, das er vorher entdeckt hatte, wurde stärker. „Jetzt oder nie", flüsterte er.$$,
  22, 13,
  $$Age-appropriate for a confident 10-year-old reader. Compound words OK (Schattenform, Kristallsplitter). Avoid academic or literary vocabulary (e.g., "materialisierte sich" → simpler alternative). Allow rich but accessible word choices.$$,
  2,
  $$Relative clauses and indirect speech: allowed and encouraged. Connectors: "deshalb", "trotzdem", "obwohl", "während" for complex sentence structures.$$,
  $$„German quotes" with „ and "$$,
  $$„Wir schaffen das zusammen!" rief Elias.$$,
  $$„Das muss der Schlüssel sein!", dachte Elias.$$,
  $$Elias hob das Amulett. Das Licht breitete sich aus und verschlang die Schatten um ihn herum in einem warmen Glanz. Stille.$$,
  $$Elias hob das Amulett. Er richtete es auf den König. Das Licht wurde heller. Die Schatten wichen zurück.$$,
  $$Elias' Hände zitterten, als er den Splitter berührte.$$,
  $$Elias war nervös, als er den Splitter fand.$$
);

-- FR Level 1
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'fr', 1,
  $$USE présent and imparfait ONLY. DO NOT USE passé composé for main narrative (too complex for L1). DO NOT USE passé simple. Zero instances. Example: "Léo court vers la porte. Le chat dort sur le tapis."$$,
  $$Léo court vers la porte. Le chat dort sur le tapis. « Viens ici ! » dit Léo.$$,
  12, 7,
  $$Very simple. Words a 6-7 year old French child knows. No literary words. Concrete, everyday objects. Max 2-syllable words preferred.$$,
  1,
  $$Very short sentences. Subject-verb-object. No subordinate clauses. Simple connectors: "et", "mais", "puis", "alors". No relative clauses.$$,
  $$« French guillemets » — NOT "English quotes"$$,
  $$« Viens vite ! » dit Léo.$$,
  $$« Oh non ! » pense Léo.$$,
  $$Léo court. Le vent souffle fort dans ses cheveux. Silence.$$,
  $$Léo court. Il voit le vent. Les feuilles bougent. C'est calme.$$,
  $$Les mains de Léo tremblent quand il touche la porte.$$,
  $$Léo a peur de toucher la porte.$$
);

-- FR Level 2
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'fr', 2,
  $$USE présent, imparfait, passé composé, futur proche (aller + infinitif). DO NOT USE passé simple. Zero instances. Not even one verb. Example: "Mateo a couru vers la porte. Le dragon crachait des flammes. Il allait devoir trouver une solution."$$,
  $$Mateo a couru vers la porte. Le dragon crachait des flammes. Il allait devoir trouver une solution.$$,
  18, 10,
  $$Age-appropriate for a 9-year-old French reader. Avoid literary vocabulary (e.g., "s'exclama" → "a crié", "contempla" → "a regardé"). Use concrete, everyday words.$$,
  2,
  $$Contractions: Natural French (l', d', n'...pas, c'est, qu'il). Simple relative clauses with "qui" and "que". Connectors: "mais", "parce que", "alors", "soudain".$$,
  $$« French guillemets » — NOT "English quotes"$$,
  $$« On doit trouver un plan ! » a dit Mateo.$$,
  $$« C'est impossible ! » a pensé Johann.$$,
  $$Mateo a couru. Le souffle brûlant du dragon a balayé le passage derrière lui, noircissant les pierres. Silence.$$,
  $$Mateo a couru. Il a vu le dragon. Le feu a brûlé. Les pierres sont tombées.$$,
  $$Les mains de Johann tremblaient quand il a touché la pierre.$$,
  $$Johann avait peur de toucher la pierre.$$
);

-- FR Level 3
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'fr', 3,
  $$USE présent, imparfait, passé composé, plus-que-parfait, futur proche. DO NOT USE passé simple. Zero instances. Example: "Mateo avait découvert le passage la veille. Maintenant, il courait à travers les flammes. Le dragon qui les avait attaqués revenait."$$,
  $$Mateo avait découvert le passage la veille. Maintenant, il courait à travers les flammes. Le dragon qui les avait attaqués revenait.$$,
  22, 13,
  $$Rich vocabulary for a confident 10-year-old French reader. Allow expressive words but avoid literary register (no "s'exclama", "contempla", "murmura"). Compound expressions OK.$$,
  2,
  $$Complex sentences with relative clauses (qui, que, dont, où). Indirect speech allowed. Connectors: "cependant", "néanmoins", "puisque", "tandis que".$$,
  $$« French guillemets » — NOT "English quotes"$$,
  $$« Il faut absolument trouver une solution ! » s'est écrié Mateo.$$,
  $$« Et si tout ça n'était qu'un piège ? » a pensé Johann.$$,
  $$Mateo a plongé. Le souffle du dragon a balayé le couloir derrière lui, transformant les pierres en lave fumante. Un silence lourd est tombé.$$,
  $$Mateo a plongé. Il a vu le dragon. Le feu a brûlé les pierres. C'était chaud. Il a couru.$$,
  $$Les doigts de Johann tremblaient quand il a effleuré la pierre froide.$$,
  $$Johann avait très peur quand il a trouvé la pierre.$$
);

-- EN Level 1
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'en', 1,
  $$Simple past as main tense. No past perfect. Present tense ONLY inside direct dialogue. Example: "Mia ran to the tree. The bird sat on top."$$,
  $$Mia ran to the tree. The bird sat on top. "Hello, little bird!" she called.$$,
  12, 7,
  $$Simple, concrete words a 7-year-old knows. Short words (1-2 syllables preferred). No abstract concepts. Everyday vocabulary.$$,
  1,
  $$Short sentences. Subject-verb-object. No subordinate clauses. Simple connectors: "and", "but", "then", "so". Contractions natural: "didn't", "wasn't", "it's".$$,
  $$"English double quotes"$$,
  $$"Come quick!" Mia called.$$,
  $$"What is that?" Mia thought.$$,
  $$Mia ran. The wind blew hard through her hair, and the leaves danced around her. Silence.$$,
  $$Mia ran. She saw the wind. The leaves moved. It was quiet.$$,
  $$Mia's heart pounded as she opened the door.$$,
  $$Mia was scared when she opened the door.$$
);

-- EN Level 2
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'en', 2,
  $$Simple past as main tense. Past perfect only for clear flashbacks. Present tense ONLY inside direct dialogue. Example: "Kenji grabbed the device. The signal he had noticed earlier grew stronger."$$,
  $$Kenji grabbed the device. The signal he had noticed earlier grew stronger. "We have to move!" he shouted.$$,
  20, 11,
  $$Age-appropriate for a confident 9-year-old. Allow exciting words (signal, device, circuit) but avoid academic language (commenced, manifestation, subsequently). Prefer concrete over abstract.$$,
  2,
  $$Contractions natural: "didn't", "couldn't", "wasn't". Relative clauses with "who", "which", "that". Connectors: "suddenly", "however", "because", "although".$$,
  $$"English double quotes"$$,
  $$"We have to move!" Kenji shouted.$$,
  $$"This can't be real," Kenji thought.$$,
  $$Kenji grabbed the device. The light spread outward, swallowing the shadows around him in a warm golden glow. Silence.$$,
  $$Kenji grabbed the device. He pointed it forward. The light grew brighter. The shadows pulled back.$$,
  $$Kenji's hands trembled as he reached for the switch.$$,
  $$Kenji was nervous when he found the switch.$$
);

-- EN Level 3
INSERT INTO fse3_language_config (
  language_code, level, tense_rules, tense_example,
  max_sentence_length, avg_sentence_length, vocabulary_guidance, adjective_limit,
  additional_rules, dialogue_format, dialogue_example_spoken, dialogue_example_thought,
  rhythm_example_right, rhythm_example_wrong, scenic_example_right, scenic_example_wrong
) VALUES (
  'en', 3,
  $$Simple past as main tense. Past perfect for flashbacks and layered narrative. Present tense ONLY inside direct dialogue. Example: "Kenji had already noticed the signal before the first explosion rocked the building. Now he ran."$$,
  $$Kenji had already noticed the signal before the first explosion rocked the building. Now he ran, his mind racing through the options he had considered earlier.$$,
  22, 13,
  $$Rich vocabulary for a confident 10-year-old. Allow expressive and precise words (reverberate, plummet, deflect) but avoid academic register (commenced, subsequently, manifestation).$$,
  2,
  $$Complex sentences with relative clauses, participial phrases. Indirect speech allowed. Connectors: "meanwhile", "nevertheless", "despite", "whereas".$$,
  $$"English double quotes"$$,
  $$"We need to figure this out — now!" Kenji shouted.$$,
  $$"What if this is all a trap?" Kenji wondered.$$,
  $$Kenji dove. The blast tore through the corridor behind him, turning stone to molten slag. A heavy silence settled.$$,
  $$Kenji dove. He saw the blast. It hit the wall. The stones melted. It was hot. He kept running.$$,
  $$Kenji's fingers trembled as they brushed the cold surface of the shard.$$,
  $$Kenji was very nervous when he touched the shard.$$
);
