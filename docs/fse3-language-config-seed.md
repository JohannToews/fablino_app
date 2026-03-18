# FSE3 Language Config — Seed-Daten für `fse3_language_config`

> Stand: 2026-03-17
> Zweck: Initiale Sprach+Level-Constraints für Pass 2 und Pass 3.
> Getestet: DE L3 ✓, FR L2 ✓, EN L2 ✓. Andere Kombinationen abgeleitet, müssen verifiziert werden.
> Wird in die DB-Tabelle `fse3_language_config` geseedet.

---

## Tabellen-Schema (Wiederholung)

```sql
CREATE TABLE fse3_language_config (
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
```

---

## Deutsch (DE)

### DE Level 1 (Erstleser, 6-7 Jahre)

| Feld | Wert |
|------|------|
| `language_code` | de |
| `level` | 1 |
| `tense_rules` | Tense: Präteritum (narrative past) as main tense. No Plusquamperfekt. Present tense ONLY inside direct dialogue. Example: "Mia lief zum Baum. Der Vogel saß ganz oben." |
| `tense_example` | Mia lief zum Baum. Der Vogel saß ganz oben. Sie rief: „Hallo, kleiner Vogel!" |
| `max_sentence_length` | 12 |
| `avg_sentence_length` | 8 |
| `vocabulary_guidance` | Simple, concrete words a 7-year-old knows. No compound words longer than 2 parts. No abstract concepts. Prefer familiar, everyday vocabulary. |
| `adjective_limit` | 1 |
| `additional_rules` | Short paragraphs. Simple sentence structures (subject-verb-object). No subordinate clauses with "obwohl", "während". Simple connectors only: "und", "aber", "dann", "weil". |
| `dialogue_format` | „German quotes" with „ and " |
| `dialogue_example_spoken` | „Komm schnell!" rief Mia. |
| `dialogue_example_thought` | „Was ist das?", dachte Mia. |
| `rhythm_example_right` | Mia lief los. Der Wind blies ihr ins Gesicht, und die Blätter tanzten um sie herum. Stille. |
| `rhythm_example_wrong` | Mia lief los. Sie sah den Wind. Die Blätter flogen. Es war still. |
| `scenic_example_right` | Mias Herz klopfte laut, als sie die Tür öffnete. |
| `scenic_example_wrong` | Mia hatte Angst, als sie die Tür öffnete. |

### DE Level 2 (Geübter Leser, 8-9 Jahre)

| Feld | Wert |
|------|------|
| `language_code` | de |
| `level` | 2 |
| `tense_rules` | Tense: Präteritum as main tense. Plusquamperfekt only for clear flashbacks. Present tense ONLY inside direct dialogue. Example: "Elias rannte durch den Wald. Das Licht, das er vorher gesehen hatte, war verschwunden." |
| `tense_example` | Elias rannte durch den Wald. Das Licht, das er vorher gesehen hatte, war verschwunden. „Wo bist du?", rief er. |
| `max_sentence_length` | 18 |
| `avg_sentence_length` | 10 |
| `vocabulary_guidance` | Age-appropriate for a confident 9-year-old. Simple compound words OK (Schattenwald, Feuerball). No academic vocabulary. Prefer vivid, concrete words. |
| `adjective_limit` | 2 |
| `additional_rules` | Relative clauses allowed. Simple subordinate clauses with "weil", "obwohl", "als". Connectors: "deshalb", "trotzdem", "plötzlich". |
| `dialogue_format` | „German quotes" with „ and " |
| `dialogue_example_spoken` | „Wir müssen einen Plan machen!" sagte Elias. |
| `dialogue_example_thought` | „Das kann doch nicht sein!", dachte Elias. |
| `rhythm_example_right` | Elias duckte sich. Der Feuerball raste über seinen Kopf hinweg und schlug krachend in die Felswand ein. Stille. |
| `rhythm_example_wrong` | Elias duckte sich. Der Feuerball flog über ihn. Er schlug in die Wand. Es war laut. |
| `scenic_example_right` | Elias' Hände zitterten, als er den Stein berührte. |
| `scenic_example_wrong` | Elias war nervös, als er den Stein fand. |

### DE Level 3 (Fortgeschritten, 10-11 Jahre) — GETESTET ✓

| Feld | Wert |
|------|------|
| `language_code` | de |
| `level` | 3 |
| `tense_rules` | Tense: Präteritum (narrative past) as main tense. Plusquamperfekt only for clear flashbacks. Present tense ONLY inside direct dialogue. Example: "Elias hob das Amulett. Das Licht, das er vorher entdeckt hatte, wurde stärker." |
| `tense_example` | Elias hob das Amulett. Das Licht, das er vorher entdeckt hatte, wurde stärker. „Jetzt oder nie", flüsterte er. |
| `max_sentence_length` | 22 |
| `avg_sentence_length` | 13 |
| `vocabulary_guidance` | Age-appropriate for a confident 10-year-old reader. Compound words OK (Schattenform, Kristallsplitter). Avoid academic or literary vocabulary (e.g., "materialisierte sich" → simpler alternative). Allow rich but accessible word choices. |
| `adjective_limit` | 2 |
| `additional_rules` | Relative clauses and indirect speech: allowed and encouraged. Connectors: "deshalb", "trotzdem", "obwohl", "während" for complex sentence structures. |
| `dialogue_format` | „German quotes" with „ and " |
| `dialogue_example_spoken` | „Wir schaffen das zusammen!" rief Elias. |
| `dialogue_example_thought` | „Das muss der Schlüssel sein!", dachte Elias. |
| `rhythm_example_right` | Elias hob das Amulett. Das Licht breitete sich aus und verschlang die Schatten um ihn herum in einem warmen Glanz. Stille. |
| `rhythm_example_wrong` | Elias hob das Amulett. Er richtete es auf den König. Das Licht wurde heller. Die Schatten wichen zurück. |
| `scenic_example_right` | Elias' Hände zitterten, als er den Splitter berührte. |
| `scenic_example_wrong` | Elias war nervös, als er den Splitter fand. |

---

## Französisch (FR)

### FR Level 1 (Erstleser, 6-7 Jahre, CP/CE1)

| Feld | Wert |
|------|------|
| `language_code` | fr |
| `level` | 1 |
| `tense_rules` | USE présent and imparfait ONLY. DO NOT USE passé composé for main narrative (too complex for L1). DO NOT USE passé simple. Zero instances. Example: "Léo court vers la porte. Le chat dort sur le tapis." |
| `tense_example` | Léo court vers la porte. Le chat dort sur le tapis. « Viens ici ! » dit Léo. |
| `max_sentence_length` | 12 |
| `avg_sentence_length` | 7 |
| `vocabulary_guidance` | Very simple. Words a 6-7 year old French child knows. No literary words. Concrete, everyday objects. Max 2-syllable words preferred. |
| `adjective_limit` | 1 |
| `additional_rules` | Very short sentences. Subject-verb-object. No subordinate clauses. Simple connectors: "et", "mais", "puis", "alors". No relative clauses. |
| `dialogue_format` | « French guillemets » — NOT "English quotes" |
| `dialogue_example_spoken` | « Viens vite ! » dit Léo. |
| `dialogue_example_thought` | « Oh non ! » pense Léo. |
| `rhythm_example_right` | Léo court. Le vent souffle fort dans ses cheveux. Silence. |
| `rhythm_example_wrong` | Léo court. Il voit le vent. Les feuilles bougent. C'est calme. |
| `scenic_example_right` | Les mains de Léo tremblent quand il touche la porte. |
| `scenic_example_wrong` | Léo a peur de toucher la porte. |

### FR Level 2 (Geübter Leser, 8-9 Jahre, CE2) — GETESTET ✓

| Feld | Wert |
|------|------|
| `language_code` | fr |
| `level` | 2 |
| `tense_rules` | USE présent, imparfait, passé composé, futur proche (aller + infinitif). DO NOT USE passé simple. Zero instances. Not even one verb. Example: "Mateo a couru vers la porte. Le dragon crachait des flammes. Il allait devoir trouver une solution." |
| `tense_example` | Mateo a couru vers la porte. Le dragon crachait des flammes. Il allait devoir trouver une solution. |
| `max_sentence_length` | 18 |
| `avg_sentence_length` | 10 |
| `vocabulary_guidance` | Age-appropriate for a 9-year-old French reader. Avoid literary vocabulary (e.g., "s'exclama" → "a crié", "contempla" → "a regardé"). Use concrete, everyday words. |
| `adjective_limit` | 2 |
| `additional_rules` | Contractions: Natural French (l', d', n'...pas, c'est, qu'il). Simple relative clauses with "qui" and "que". Connectors: "mais", "parce que", "alors", "soudain". |
| `dialogue_format` | « French guillemets » — NOT "English quotes" |
| `dialogue_example_spoken` | « On doit trouver un plan ! » a dit Mateo. |
| `dialogue_example_thought` | « C'est impossible ! » a pensé Johann. |
| `rhythm_example_right` | Mateo a couru. Le souffle brûlant du dragon a balayé le passage derrière lui, noircissant les pierres. Silence. |
| `rhythm_example_wrong` | Mateo a couru. Il a vu le dragon. Le feu a brûlé. Les pierres sont tombées. |
| `scenic_example_right` | Les mains de Johann tremblaient quand il a touché la pierre. |
| `scenic_example_wrong` | Johann avait peur de toucher la pierre. |

### FR Level 3 (Fortgeschritten, 10-11 Jahre, CM1/CM2)

| Feld | Wert |
|------|------|
| `language_code` | fr |
| `level` | 3 |
| `tense_rules` | USE présent, imparfait, passé composé, plus-que-parfait, futur proche. DO NOT USE passé simple. Zero instances. Example: "Mateo avait découvert le passage la veille. Maintenant, il courait à travers les flammes. Le dragon qui les avait attaqués revenait." |
| `tense_example` | Mateo avait découvert le passage la veille. Maintenant, il courait à travers les flammes. Le dragon qui les avait attaqués revenait. |
| `max_sentence_length` | 22 |
| `avg_sentence_length` | 13 |
| `vocabulary_guidance` | Rich vocabulary for a confident 10-year-old French reader. Allow expressive words but avoid literary register (no "s'exclama", "contempla", "murmura"). Compound expressions OK. |
| `adjective_limit` | 2 |
| `additional_rules` | Complex sentences with relative clauses (qui, que, dont, où). Indirect speech allowed. Connectors: "cependant", "néanmoins", "puisque", "tandis que". |
| `dialogue_format` | « French guillemets » — NOT "English quotes" |
| `dialogue_example_spoken` | « Il faut absolument trouver une solution ! » s'est écrié Mateo. |
| `dialogue_example_thought` | « Et si tout ça n'était qu'un piège ? » a pensé Johann. |
| `rhythm_example_right` | Mateo a plongé. Le souffle du dragon a balayé le couloir derrière lui, transformant les pierres en lave fumante. Un silence lourd est tombé. |
| `rhythm_example_wrong` | Mateo a plongé. Il a vu le dragon. Le feu a brûlé les pierres. C'était chaud. Il a couru. |
| `scenic_example_right` | Les doigts de Johann tremblaient quand il a effleuré la pierre froide. |
| `scenic_example_wrong` | Johann avait très peur quand il a trouvé la pierre. |

---

## Englisch (EN)

### EN Level 1 (Early reader, 6-7 Jahre)

| Feld | Wert |
|------|------|
| `language_code` | en |
| `level` | 1 |
| `tense_rules` | Simple past as main tense. No past perfect. Present tense ONLY inside direct dialogue. Example: "Mia ran to the tree. The bird sat on top." |
| `tense_example` | Mia ran to the tree. The bird sat on top. "Hello, little bird!" she called. |
| `max_sentence_length` | 12 |
| `avg_sentence_length` | 7 |
| `vocabulary_guidance` | Simple, concrete words a 7-year-old knows. Short words (1-2 syllables preferred). No abstract concepts. Everyday vocabulary. |
| `adjective_limit` | 1 |
| `additional_rules` | Short sentences. Subject-verb-object. No subordinate clauses. Simple connectors: "and", "but", "then", "so". Contractions natural: "didn't", "wasn't", "it's". |
| `dialogue_format` | "English double quotes" |
| `dialogue_example_spoken` | "Come quick!" Mia called. |
| `dialogue_example_thought` | "What is that?" Mia thought. |
| `rhythm_example_right` | Mia ran. The wind blew hard through her hair, and the leaves danced around her. Silence. |
| `rhythm_example_wrong` | Mia ran. She saw the wind. The leaves moved. It was quiet. |
| `scenic_example_right` | Mia's heart pounded as she opened the door. |
| `scenic_example_wrong` | Mia was scared when she opened the door. |

### EN Level 2 (Fluent reader, 8-9 Jahre) — GETESTET ✓

| Feld | Wert |
|------|------|
| `language_code` | en |
| `level` | 2 |
| `tense_rules` | Simple past as main tense. Past perfect only for clear flashbacks. Present tense ONLY inside direct dialogue. Example: "Kenji grabbed the device. The signal he had noticed earlier grew stronger." |
| `tense_example` | Kenji grabbed the device. The signal he had noticed earlier grew stronger. "We have to move!" he shouted. |
| `max_sentence_length` | 20 |
| `avg_sentence_length` | 11 |
| `vocabulary_guidance` | Age-appropriate for a confident 9-year-old. Allow exciting words (signal, device, circuit) but avoid academic language (commenced, manifestation, subsequently). Prefer concrete over abstract. |
| `adjective_limit` | 2 |
| `additional_rules` | Contractions natural: "didn't", "couldn't", "wasn't". Relative clauses with "who", "which", "that". Connectors: "suddenly", "however", "because", "although". |
| `dialogue_format` | "English double quotes" |
| `dialogue_example_spoken` | "We have to move!" Kenji shouted. |
| `dialogue_example_thought` | "This can't be real," Kenji thought. |
| `rhythm_example_right` | Kenji grabbed the device. The light spread outward, swallowing the shadows around him in a warm golden glow. Silence. |
| `rhythm_example_wrong` | Kenji grabbed the device. He pointed it forward. The light grew brighter. The shadows pulled back. |
| `scenic_example_right` | Kenji's hands trembled as he reached for the switch. |
| `scenic_example_wrong` | Kenji was nervous when he found the switch. |

### EN Level 3 (Advanced reader, 10-11 Jahre)

| Feld | Wert |
|------|------|
| `language_code` | en |
| `level` | 3 |
| `tense_rules` | Simple past as main tense. Past perfect for flashbacks and layered narrative. Present tense ONLY inside direct dialogue. Example: "Kenji had already noticed the signal before the first explosion rocked the building. Now he ran." |
| `tense_example` | Kenji had already noticed the signal before the first explosion rocked the building. Now he ran, his mind racing through the options he had considered earlier. |
| `max_sentence_length` | 22 |
| `avg_sentence_length` | 13 |
| `vocabulary_guidance` | Rich vocabulary for a confident 10-year-old. Allow expressive and precise words (reverberate, plummet, deflect) but avoid academic register (commenced, subsequently, manifestation). |
| `adjective_limit` | 2 |
| `additional_rules` | Complex sentences with relative clauses, participial phrases. Indirect speech allowed. Connectors: "meanwhile", "nevertheless", "despite", "whereas". |
| `dialogue_format` | "English double quotes" |
| `dialogue_example_spoken` | "We need to figure this out — now!" Kenji shouted. |
| `dialogue_example_thought` | "What if this is all a trap?" Kenji wondered. |
| `rhythm_example_right` | Kenji dove. The blast tore through the corridor behind him, turning stone to molten slag. A heavy silence settled. |
| `rhythm_example_wrong` | Kenji dove. He saw the blast. It hit the wall. The stones melted. It was hot. He kept running. |
| `scenic_example_right` | Kenji's fingers trembled as they brushed the cold surface of the shard. |
| `scenic_example_wrong` | Kenji was very nervous when he touched the shard. |

---

## Erweiterungs-Hinweis

Für weitere Sprachen (ES, NL, IT, PT, etc.) müssen die gleichen 3 Levels befüllt werden. Besonders wichtig:
- **ES:** Pretérito indefinido vs. pretérito perfecto Unterscheidung (regional!)
- **NL:** Einfache Vergangenheit vs. Voltooid Tegenwoordige Tijd
- **IT:** Passato remoto vs. Passato prossimo (ähnliches Problem wie FR Passé simple)

Jede neue Sprache braucht Muttersprachler-Review der Beispielsätze.
