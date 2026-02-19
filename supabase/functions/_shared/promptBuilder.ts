/**
 * promptBuilder.ts – Block 2.3c
 * Builds dynamic story prompts from DB rules (age_rules, difficulty_rules, theme_rules, content_themes_by_level).
 */

// ─── Types ───────────────────────────────────────────────────────

export interface StoryRequest {
  kid_profile: {
    id: string;
    first_name: string;
    age: number;
    difficulty_level: number;    // 1-3
    content_safety_level: number; // 1-4
  };
  story_language: string;        // 'fr', 'de', 'en', 'es', 'it', 'bs'
  theme_key: string;             // 'fantasy', 'action', 'animals', 'everyday', 'humor', 'educational'
  length: 'short' | 'medium' | 'long' | 'extra_long';
  is_series: boolean;
  series_context?: string;
  protagonists: {
    include_self: boolean;
    characters: Array<{
      name: string;
      age?: number;
      relation?: string;
      description?: string;
      role?: string;  // 'family' | 'friend' | 'known_figure'
    }>;
  };
  special_abilities: string[];
  user_prompt?: string;
  source: 'parent' | 'kid';
  question_count?: number;
  surprise_characters?: boolean;  // Block 2.3e: fictional-only characters
  // ── Phase 2: Series context ──
  series_episode_number?: number;
  series_total_episodes?: number;     // 3-7, set at Ep1 (NULL/undefined = legacy 5)
  series_ending_type?: string;        // resolved ending type ('A', 'B', 'C')
  series_previous_episodes?: Array<{
    episode_number: number;
    title: string;
    episode_summary?: string;
  }>;
  series_continuity_state?: {
    established_facts?: string[];
    open_threads?: string[];
    character_states?: Record<string, string>;
    world_rules?: string[];
    signature_element?: {
      description: string;
      usage_history?: string[];
    };
  };
  series_visual_style_sheet?: {
    characters?: Record<string, string>;
    world_style?: string;
    recurring_visual?: string;
  };
  // ── Modus B: Interactive Series ("Mitgestalten") ──
  series_mode?: 'normal' | 'interactive';   // NULL or 'normal' = Modus A, 'interactive' = Modus B
  branch_chosen?: string;                   // Option title chosen by child (for Ep2-5 context)
  branch_chosen_preview?: string;           // Option preview text
  branch_chosen_direction?: string;         // 'brave' | 'clever' | 'surprising'
  series_all_branches?: Array<{             // All branch choices made so far (for Ep5 finale recap)
    episode_number: number;
    chosen_title: string;
  }>;
  // ── Story Subtype (Themenvariation) ──
  story_subtype?: {
    subtypeKey: string;
    promptHint: string;
    titleSeed: string;
    settingIdea: string;
    label: string;            // localized label for display
  };
  // ── Granular generation config (from generation_config table) ──
  word_count_override?: {
    min_words: number;
    max_words: number;
    scene_image_count: number;
  };
}

// ─── Section Headers (translated) ───────────────────────────────

const SECTION_HEADERS: Record<string, Record<string, string>> = {
  fr: {
    child: 'ENFANT', language: 'LANGUE ET NIVEAU', vocabulary: 'VOCABULAIRE',
    length: 'LONGUEUR DU TEXTE', category: 'CATÉGORIE', characters: 'PERSONNAGES',
    specialEffects: 'EFFETS SPÉCIAUX', guardrails: 'GARDE-FOUS',
    learningTheme: 'THÈME ÉDUCATIF', variety: 'VARIÉTÉ',
    specialRequest: 'DEMANDE SPÉCIALE', series: 'CONTEXTE DE SÉRIE',
    instruction: 'Écris une histoire avec les consignes suivantes :',
    chooseTheme: 'Choisis toi-même un thème concret dans cette catégorie.',
    respondJson: 'Réponds UNIQUEMENT avec le JSON du format de sortie.',
    allowed: 'Autorisé', notAllowed: 'Non autorisé',
  },
  de: {
    child: 'KIND', language: 'SPRACHE & NIVEAU', vocabulary: 'VOKABULAR',
    length: 'TEXTLÄNGE', category: 'KATEGORIE', characters: 'FIGUREN',
    specialEffects: 'SPEZIALEFFEKTE', guardrails: 'GUARDRAILS',
    learningTheme: 'LERNTHEMA', variety: 'VARIETÄT',
    specialRequest: 'BESONDERER WUNSCH', series: 'SERIEN-KONTEXT',
    instruction: 'Schreibe eine Geschichte mit folgenden Vorgaben:',
    chooseTheme: 'Wähle selbst ein konkretes Thema innerhalb dieser Kategorie.',
    respondJson: 'Antworte NUR mit dem JSON aus dem Output-Format.',
    allowed: 'Erlaubt', notAllowed: 'Nicht erlaubt',
  },
  en: {
    child: 'CHILD', language: 'LANGUAGE & LEVEL', vocabulary: 'VOCABULARY',
    length: 'TEXT LENGTH', category: 'CATEGORY', characters: 'CHARACTERS',
    specialEffects: 'SPECIAL EFFECTS', guardrails: 'GUARDRAILS',
    learningTheme: 'LEARNING THEME', variety: 'VARIETY',
    specialRequest: 'SPECIAL REQUEST', series: 'SERIES CONTEXT',
    instruction: 'Write a story with the following specifications:',
    chooseTheme: 'Choose a specific theme within this category.',
    respondJson: 'Respond ONLY with the JSON from the output format.',
    allowed: 'Allowed', notAllowed: 'Not allowed',
  },
  es: {
    child: 'NIÑO/A', language: 'IDIOMA Y NIVEL', vocabulary: 'VOCABULARIO',
    length: 'LONGITUD DEL TEXTO', category: 'CATEGORÍA', characters: 'PERSONAJES',
    specialEffects: 'EFECTOS ESPECIALES', guardrails: 'LÍMITES DE CONTENIDO',
    learningTheme: 'TEMA EDUCATIVO', variety: 'VARIEDAD',
    specialRequest: 'PETICIÓN ESPECIAL', series: 'CONTEXTO DE SERIE',
    instruction: 'Escribe una historia con las siguientes pautas:',
    chooseTheme: 'Elige tú mismo un tema concreto dentro de esta categoría.',
    respondJson: 'Responde ÚNICAMENTE con el JSON del formato de salida.',
    allowed: 'Permitido', notAllowed: 'No permitido',
  },
  it: {
    child: 'BAMBINO/A', language: 'LINGUA E LIVELLO', vocabulary: 'VOCABOLARIO',
    length: 'LUNGHEZZA DEL TESTO', category: 'CATEGORIA', characters: 'PERSONAGGI',
    specialEffects: 'EFFETTI SPECIALI', guardrails: 'LIMITI DI CONTENUTO',
    learningTheme: 'TEMA EDUCATIVO', variety: 'VARIETÀ',
    specialRequest: 'RICHIESTA SPECIALE', series: 'CONTESTO DI SERIE',
    instruction: 'Scrivi una storia con le seguenti indicazioni:',
    chooseTheme: 'Scegli tu stesso un tema concreto all\'interno di questa categoria.',
    respondJson: 'Rispondi SOLO con il JSON del formato di output.',
    allowed: 'Consentito', notAllowed: 'Non consentito',
  },
  bs: {
    child: 'DIJETE', language: 'JEZIK I NIVO', vocabulary: 'VOKABULAR',
    length: 'DUŽINA TEKSTA', category: 'KATEGORIJA', characters: 'LIKOVI',
    specialEffects: 'SPECIJALNI EFEKTI', guardrails: 'ZAŠTITNE MJERE',
    learningTheme: 'OBRAZOVNA TEMA', variety: 'RAZNOLIKOST',
    specialRequest: 'POSEBAN ZAHTJEV', series: 'KONTEKST SERIJE',
    instruction: 'Napiši priču sa sljedećim uputama:',
    chooseTheme: 'Sam/a izaberi konkretnu temu unutar ove kategorije.',
    respondJson: 'Odgovori SAMO sa JSON-om iz formata izlaza.',
    allowed: 'Dozvoljeno', notAllowed: 'Nije dozvoljeno',
  },
  nl: {
    child: 'KIND', language: 'TAAL & NIVEAU', vocabulary: 'WOORDENSCHAT',
    length: 'TEKSTLENGTE', category: 'CATEGORIE', characters: 'PERSONAGES',
    specialEffects: 'SPECIALE EFFECTEN', guardrails: 'VEILIGHEIDSREGELS',
    learningTheme: 'LEER THEMA', variety: 'VARIËTEIT',
    specialRequest: 'SPECIAAL VERZOEK', series: 'SERIE CONTEXT',
    instruction: 'Schrijf een verhaal met de volgende richtlijnen:',
    chooseTheme: 'Kies zelf een concreet thema binnen deze categorie.',
    respondJson: 'Antwoord ALLEEN met de JSON van het outputformaat.',
    allowed: 'Toegestaan', notAllowed: 'Niet toegestaan',
  },
};

// Language name mapping (for display in prompt)
const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'Français', de: 'Deutsch', en: 'English',
  es: 'Español', it: 'Italiano', bs: 'Bosanski', nl: 'Nederlands',
  // Beta languages
  hu: 'Magyar', pt: 'Português', tr: 'Türkçe', bg: 'Български',
  lt: 'Lietuvių', ca: 'Català', pl: 'Polski', sk: 'Slovenčina',
};

// ─── Helper: extract JSONB label ────────────────────────────────

function label(jsonbObj: Record<string, string> | null | undefined, lang: string): string {
  if (!jsonbObj) return '';
  return jsonbObj[lang] || jsonbObj['en'] || jsonbObj['fr'] || Object.values(jsonbObj)[0] || '';
}

// ─── Helper: array to comma-separated string ────────────────────

function arrJoin(arr: string[] | null | undefined): string {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.join(', ');
}

// ─── Special abilities descriptions ─────────────────────────────

const SPECIAL_ABILITIES_DESC: Record<string, Record<string, string>> = {
  fr: {
    superpowers: 'Les personnages peuvent avoir des super-pouvoirs (voler, super-force, invisibilité...)',
    magic: 'La magie existe dans cet univers (baguettes, sortilèges, potions...)',
    heroes_villains: 'Il y a des héros et des vilains avec des motivations claires',
    transformations: 'Les personnages peuvent se transformer (en animaux, en objets, changer de taille...)',
    special_talents: 'Les personnages ont des talents extraordinaires (génie musical, inventeur, parler aux animaux...)',
  },
  de: {
    superpowers: 'Die Figuren können Superkräfte haben (fliegen, Superstärke, Unsichtbarkeit...)',
    magic: 'Magie existiert in dieser Welt (Zauberstäbe, Zaubersprüche, Tränke...)',
    heroes_villains: 'Es gibt Helden und Schurken mit nachvollziehbaren Motiven',
    transformations: 'Figuren können sich verwandeln (in Tiere, Objekte, Größe ändern...)',
    special_talents: 'Figuren haben außergewöhnliche Talente (Musikgenie, Erfinder, mit Tieren sprechen...)',
  },
  en: {
    superpowers: 'Characters can have superpowers (flying, super-strength, invisibility...)',
    magic: 'Magic exists in this world (wands, spells, potions...)',
    heroes_villains: 'There are heroes and villains with clear motivations',
    transformations: 'Characters can transform (into animals, objects, change size...)',
    special_talents: 'Characters have extraordinary talents (musical genius, inventor, talking to animals...)',
  },
  es: {
    superpowers: 'Los personajes pueden tener superpoderes (volar, superfuerza, invisibilidad...)',
    magic: 'La magia existe en este mundo (varitas, hechizos, pociones...)',
    heroes_villains: 'Hay héroes y villanos con motivaciones claras',
    transformations: 'Los personajes pueden transformarse (en animales, objetos, cambiar de tamaño...)',
    special_talents: 'Los personajes tienen talentos extraordinarios (genio musical, inventor, hablar con animales...)',
  },
  it: {
    superpowers: 'I personaggi possono avere superpoteri (volare, superforza, invisibilità...)',
    magic: 'La magia esiste in questo mondo (bacchette, incantesimi, pozioni...)',
    heroes_villains: 'Ci sono eroi e cattivi con motivazioni chiare',
    transformations: 'I personaggi possono trasformarsi (in animali, oggetti, cambiare dimensione...)',
    special_talents: 'I personaggi hanno talenti straordinari (genio musicale, inventore, parlare con gli animali...)',
  },
  bs: {
    superpowers: 'Likovi mogu imati supermoći (letjenje, supersnaga, nevidljivost...)',
    magic: 'Magija postoji u ovom svijetu (štapići, čarolije, napici...)',
    heroes_villains: 'Postoje heroji i negativci s jasnim motivima',
    transformations: 'Likovi se mogu pretvoriti (u životinje, predmete, promijeniti veličinu...)',
    special_talents: 'Likovi imaju izvanredne talente (muzički genije, izumitelj, razgovor sa životinjama...)',
  },
  nl: {
    superpowers: 'Personages kunnen superkrachten hebben (vliegen, superkracht, onzichtbaarheid...)',
    magic: 'Magie bestaat in deze wereld (toverstokken, spreuken, drankjes...)',
    heroes_villains: 'Er zijn helden en schurken met duidelijke motivaties',
    transformations: 'Personages kunnen zich transformeren (in dieren, objecten, van grootte veranderen...)',
    special_talents: 'Personages hebben buitengewone talenten (muzikaal genie, uitvinder, met dieren praten...)',
  },
};

// ─── Character Relationship Helpers (Block 2.3d) ────────────────

type CharacterEntry = { name: string; age?: number; relation?: string; description?: string; role?: string };

function fmtChar(c: { name: string; age?: number }): string {
  return c.age ? `${c.name}, ${c.age}` : c.name;
}

function mainCharLabel(l: string): string {
  const map: Record<string, string> = { fr: 'Personnage principal', de: 'Hauptfigur', en: 'Main character', es: 'Personaje principal', it: 'Protagonista', bs: 'Glavni lik', nl: 'Hoofdpersoon' };
  return map[l] || 'Main character';
}

function ofWord(l: string): string {
  const map: Record<string, string> = { fr: 'de', de: 'von', en: 'of', es: 'de', it: 'di', bs: 'od', nl: 'van' };
  return map[l] || 'of';
}

function andWord(l: string): string {
  const map: Record<string, string> = { fr: 'et', de: 'und', en: 'and', es: 'y', it: 'e', bs: 'i', nl: 'en' };
  return map[l] || 'and';
}

function coupleLabel(l: string): string {
  const map: Record<string, string> = { fr: 'sont un couple / les parents', de: 'sind ein Paar / die Eltern', en: 'are a couple / the parents', es: 'son pareja / los padres', it: 'sono una coppia / i genitori', bs: 'su par / roditelji', nl: 'zijn een koppel / de ouders' };
  return map[l] || 'are a couple / the parents';
}

function siblingsLabel(l: string): string {
  const map: Record<string, string> = { fr: 'sont frères et sœurs', de: 'sind Geschwister', en: 'are siblings', es: 'son hermanos', it: 'sono fratelli', bs: 'su braća i sestre', nl: 'zijn broers en zussen' };
  return map[l] || 'are siblings';
}

function familyHint(l: string): string {
  const map: Record<string, string> = { fr: '→ Ceci est une histoire de famille.', de: '→ Dies ist eine Familiengeschichte.', en: '→ This is a family story.', es: '→ Esta es una historia familiar.', it: '→ Questa è una storia di famiglia.', bs: '→ Ovo je porodična priča.', nl: '→ Dit is een familieverhaal.' };
  return map[l] || '→ This is a family story.';
}

function friendsLabel(l: string): string {
  const map: Record<string, string> = { fr: 'sont amis entre eux', de: 'sind miteinander befreundet', en: 'are friends with each other', es: 'son amigos entre sí', it: 'sono amici tra loro', bs: 'su međusobni prijatelji', nl: 'zijn vrienden van elkaar' };
  return map[l] || 'are friends with each other';
}

function friendOfLabel(l: string): string {
  const map: Record<string, string> = { fr: 'ami(e) de', de: 'Freund(in) von', en: 'friend of', es: 'amigo/a de', it: 'amico/a di', bs: 'prijatelj/ica od', nl: 'vriend(in) van' };
  return map[l] || 'friend of';
}

function singleFriendLabel(l: string): string {
  const map: Record<string, string> = { fr: 'un(e) ami(e)', de: 'ein(e) Freund(in)', en: 'a friend', es: 'un(a) amigo/a', it: 'un(a) amico/a', bs: 'prijatelj/ica', nl: 'een vriend(in)' };
  return map[l] || 'a friend';
}

function knownFigureLabel(l: string): string {
  const map: Record<string, string> = { fr: 'personnage connu', de: 'bekannte Figur', en: 'known character', es: 'personaje conocido', it: 'personaggio noto', bs: 'poznati lik', nl: 'bekend personage' };
  return map[l] || 'known character';
}

function notMainCharHint(l: string): string {
  const map: Record<string, string> = {
    fr: "Note : L'enfant n'est PAS un personnage. Les personnes suivantes sont les personnages de l'histoire.",
    de: 'Hinweis: Das Kind ist NICHT selbst eine Figur. Die folgenden Personen sind die Figuren der Geschichte.',
    en: 'Note: The child is NOT a character. The following people are the story characters.',
    es: 'Nota: El niño NO es un personaje. Las siguientes personas son los personajes de la historia.',
    it: 'Nota: Il bambino NON è un personaggio. Le seguenti persone sono i personaggi della storia.',
    bs: 'Napomena: Dijete NIJE lik. Sljedeće osobe su likovi priče.',
    nl: 'Opmerking: Het kind is GEEN personage. De volgende personen zijn de personages van het verhaal.',
  };
  return map[l] || 'Note: The child is NOT a character. The following people are the story characters.';
}

// Known parent and sibling relation names across supported languages
const PARENT_RELATIONS = ['Mama', 'Papa', 'Maman', 'Mom', 'Dad', 'Mamá', 'Papá', 'Mamma', 'Papà', 'Tata', 'Oma', 'Opa', 'Grand-mère', 'Grand-père', 'Grandma', 'Grandpa', 'Abuela', 'Abuelo', 'Nonna', 'Nonno', 'Baka', 'Djed'];
const SIBLING_RELATIONS = ['Bruder', 'Schwester', 'Frère', 'Sœur', 'Brother', 'Sister', 'Hermano', 'Hermana', 'Fratello', 'Sorella', 'Brat', 'Sestra'];

/**
 * Build the CHARACTERS section with intelligent relationship logic.
 * - include_self = true: All relationships relative to the child.
 * - include_self = false: Characters relate to each other (parents as couple, siblings as group, etc.)
 */
function buildCharactersSection(
  protagonists: StoryRequest['protagonists'],
  kidName: string,
  kidAge: number,
  headers: Record<string, string>,
  lang: string
): string {
  const lines: string[] = [];
  const chars = protagonists.characters;

  if (protagonists.include_self) {
    // ═══ CASE 1: Child is the main character ═══
    lines.push(`${mainCharLabel(lang)}: ${kidName}, ${kidAge}`);

    for (const char of chars) {
      let entry = char.name;
      if (char.age) entry += `, ${char.age}`;

      if (char.relation) {
        entry += ` — ${char.relation} ${ofWord(lang)} ${kidName}`;
      } else if (char.role === 'friend') {
        entry += ` — ${friendOfLabel(lang)} ${kidName}`;
      } else if (char.role === 'known_figure') {
        entry += ` — ${knownFigureLabel(lang)}`;
      }
      lines.push(entry);
    }

  } else {
    // ═══ CASE 2: Child is NOT a character ═══
    lines.push(notMainCharHint(lang));

    const family = chars.filter(c => c.role === 'family');
    const friends = chars.filter(c => c.role === 'friend');
    const known = chars.filter(c => c.role === 'known_figure');
    // Characters without a role get listed individually
    const unclassified = chars.filter(c => !c.role);

    // -- Family --
    if (family.length > 0) {
      const parents = family.filter(c => PARENT_RELATIONS.includes(c.relation || ''));
      const siblings = family.filter(c => SIBLING_RELATIONS.includes(c.relation || ''));
      const otherFamily = family.filter(c => !parents.includes(c) && !siblings.includes(c));

      if (parents.length >= 2) {
        lines.push(`${fmtChar(parents[0])} ${andWord(lang)} ${fmtChar(parents[1])} — ${coupleLabel(lang)}`);
        // If more than 2 parents (e.g. Oma + Opa too), list the rest individually
        for (const p of parents.slice(2)) {
          lines.push(`${fmtChar(p)} — ${p.relation || ''}`);
        }
      } else if (parents.length === 1) {
        lines.push(`${fmtChar(parents[0])} — ${parents[0].relation || ''}`);
      }

      if (siblings.length >= 2) {
        lines.push(`${siblings.map(fmtChar).join(` ${andWord(lang)} `)} — ${siblingsLabel(lang)}`);
      } else if (siblings.length === 1) {
        lines.push(`${fmtChar(siblings[0])} — ${siblings[0].relation || ''}`);
      }

      // Family hint if both parents and siblings present
      if (parents.length > 0 && siblings.length > 0) {
        lines.push(familyHint(lang));
      }

      for (const c of otherFamily) {
        lines.push(`${fmtChar(c)} — ${c.relation || ''}`);
      }
    }

    // -- Friends --
    if (friends.length >= 2) {
      lines.push(`${friends.map(fmtChar).join(` ${andWord(lang)} `)} — ${friendsLabel(lang)}`);
    } else if (friends.length === 1) {
      lines.push(`${fmtChar(friends[0])} — ${singleFriendLabel(lang)}`);
    }

    // -- Known figures --
    for (const c of known) {
      lines.push(`${c.name} — ${knownFigureLabel(lang)}`);
    }

    // -- Unclassified --
    for (const c of unclassified) {
      const parts = [c.name];
      if (c.age) parts.push(`${c.age}`);
      if (c.relation) parts.push(c.relation);
      lines.push(parts.join(', '));
    }
  }

  if (lines.length === 0) return '';
  return `## ${headers.characters}\n${lines.join('\n')}`;
}

// ─── Scene Count by Story Length (Block 2.4) ────────────────────

function getSceneCount(length: string): number {
  switch (length) {
    case 'short': return 1;   // 1 scene + cover
    case 'long': return 3;    // 3 scenes + cover
    default: return 2;        // 2 scenes + cover (medium)
  }
}

// ─── Variety Block Builder ──────────────────────────────────────

function buildVarietyBlock(recentStories: any[], headers: Record<string, string>): string {
  if (recentStories.length === 0) return '';

  const lines: string[] = [];

  // Last 3 structure combinations → "avoid these"
  const recentStructures = recentStories.slice(0, 3)
    .filter(s => s.structure_beginning && s.structure_middle && s.structure_ending)
    .map(s => `A${s.structure_beginning}-M${s.structure_middle}-E${s.structure_ending}`);
  if (recentStructures.length > 0) {
    lines.push(`Avoid / Vermeide: ${recentStructures.join(', ')}`);
  }

  // Last 5 emotional colorings → identify dominant
  const recentEmotions = recentStories
    .map(s => s.emotional_coloring)
    .filter(Boolean);
  const emotionCounts: Record<string, number> = {};
  recentEmotions.forEach(e => { emotionCounts[e] = (emotionCounts[e] || 0) + 1; });
  const dominant = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] >= 2) {
    lines.push(`Recent dominant: ${dominant[0]} → choose a different primary emotion.`);
  }

  // Humor-level variation
  const recentHumor = recentStories.slice(0, 3).map(s => s.humor_level).filter(Boolean);
  const avgHumor = recentHumor.length > 0 ? recentHumor.reduce((a: number, b: number) => a + b, 0) / recentHumor.length : 0;
  if (avgHumor > 3) {
    lines.push('Recent stories were very humorous. Set humor_level to 1-2 this time.');
  } else if (avgHumor < 2 && recentHumor.length >= 2) {
    lines.push('Recent stories had little humor. Try humor_level 3-4 this time.');
  }

  // Theme repetition
  const recentThemes = recentStories.map(s => s.concrete_theme).filter(Boolean);
  if (recentThemes.length > 0) {
    lines.push(`Recent themes: ${recentThemes.join(', ')}. Choose a different concrete theme.`);
  }

  return lines.length > 0 ? `## ${headers.variety}\n${lines.join('\n')}` : '';
}

// ─── Phase 2: Episode Configuration (5-episode linear series) ───

export interface EpisodeConfig {
  function_name: string;
  function_description: string;
  requirements: string[];
  preferred_anfang: string[];
  preferred_mitte: string[];
  required_ende: string;
  ending_type_db: string;
}

export function getDefaultEpisodeCount(age: number): number {
  if (age <= 7) return 3;
  if (age <= 9) return 5;
  return 6;
}

export const EPISODE_CONFIG: Record<number, EpisodeConfig> = {
  1: {
    function_name: "Die Welt öffnet sich",
    function_description: "Etabliere die Welt, führe alle Hauptfiguren mit Iceberg-Tiefe ein, setze das zentrale Mysterium, platziere ein Signature Element, ende mit starkem Hook.",
    requirements: [
      "Die ersten zwei Sätze müssen sofort neugierig machen",
      "Jede Hauptfigur bekommt einen charakteristischen Moment",
      "Ein Geheimnis oder Rätsel wird angedeutet (nicht erklärt)",
      "Signature Element einführen (wiederkehrender Gegenstand, Ritual, Running Gag)",
      "Ende mit unwiderstehlichem Hook – der Leser MUSS Episode 2 wollen",
    ],
    preferred_anfang: ["A1", "A2", "A4"],
    preferred_mitte: ["M1", "M2"],
    required_ende: "Cliffhanger oder starkes offenes Ende",
    ending_type_db: "C",
  },
  2: {
    function_name: "Die Komplikation",
    function_description: "Zeige, dass das Problem größer ist als gedacht. Der erste Plan der Figuren scheitert. Neue Hürden oder Gegner tauchen auf.",
    requirements: [
      "Ein gescheiterter Versuch der Figuren (naheliegende Lösung funktioniert nicht)",
      "Neue Dimension des Problems (neuer Charakter, Hindernis oder Welt-Regel)",
      "Konsequenzen aus Episode 1 zeigen (Entscheidungen haben Folgen)",
      "Beziehungen werden komplexer (Freundschaften getestet, Allianzen verschieben sich)",
      "Signature Element kommt vor (leicht variiert)",
    ],
    preferred_anfang: ["A3", "A5"],
    preferred_mitte: ["M1", "M3", "M6"],
    required_ende: "Cliffhanger – 'Es wird schlimmer, bevor es besser wird'",
    ending_type_db: "C",
  },
  3: {
    function_name: "Der Drehpunkt",
    function_description: "Die Karten werden neu gemischt. Ein Geheimnis wird gelüftet, aber wirft neue Fragen auf. Loyalitäten werden getestet.",
    requirements: [
      "Eine Enthüllung die alles verändert (wirft aber neue Fragen auf)",
      "Loyalitäten werden infrage gestellt (wer steht auf wessen Seite?)",
      "Perspektivwechsel: Figur oder Leser versteht etwas neu",
      "Tiefpunkt vor dem Aufstieg (schlecht, aber Hoffnung bleibt)",
      "Signature Element kommt vor (variiert)",
    ],
    preferred_anfang: ["A2", "A5"],
    preferred_mitte: ["M2", "M4", "M6"],
    required_ende: "Twist-Ende mit Hook ODER Cliffhanger",
    ending_type_db: "C",
  },
  4: {
    function_name: "Die dunkelste Stunde",
    function_description: "Alles scheint verloren. Es geht nicht mehr nur um das äußere Problem, sondern um Werte und Identität. Die emotionalste Episode der Serie.",
    requirements: [
      "Innerer Konflikt (Werte, Identität, Zugehörigkeit)",
      "Opfer oder schwere Entscheidung (Geheimnis, Traum oder Überzeugung aufgeben)",
      "Moment der Einsamkeit (Hauptfigur steht gefühlt allein da)",
      "Der Funke: kleines Detail zeigt den Weg (aber Leser weiß noch nicht wie)",
      "Signature Element kommt vor – bekommt tiefere Bedeutung",
    ],
    preferred_anfang: ["A3", "A6"],
    preferred_mitte: ["M3", "M5"],
    required_ende: "Der absolut stärkste Cliffhanger der gesamten Serie",
    ending_type_db: "C",
  },
  5: {
    function_name: "Das Finale",
    function_description: "Alles kommt zusammen. Das zentrale Mysterium wird gelöst – aber nicht unbedingt wie erwartet. Die Figuren haben sich verändert.",
    requirements: [
      "Alle wesentlichen Fäden auflösen (kein wichtiges Mysterium bleibt offen)",
      "Callback zu Episode 1 (mindestens ein Element aus Ep1 wird wichtig)",
      "Jede Hauptfigur bekommt ihren Moment (auch Nebenfiguren)",
      "Charakterentwicklung sichtbar: Figuren handeln anders als in Ep1",
      "Signature Element hat finalen, bedeutungsvollen Moment",
      "KEIN Deus ex machina – Lösung ergibt sich aus der Geschichte",
      "KEIN Cliffhanger – Serie muss abschließen",
    ],
    preferred_anfang: ["A1", "A3"],
    preferred_mitte: ["M1", "M4"],
    required_ende: "Abschluss: Klassisch (6-8J), Offenes Fenster (9-11J), oder Philosophisch (10-12J)",
    ending_type_db: "A",
  },
};

// ─── Dynamic Episode Config (variable episode count 3-7) ────────

/**
 * Returns the episode config for a given episode number within a series of totalEpisodes.
 * Backward-compatible: totalEpisodes=5 returns exactly the old EPISODE_CONFIG.
 */
export function getEpisodeConfig(
  episodeNumber: number,
  totalEpisodes: number,
  age: number
): EpisodeConfig {

  // ═══ BACKWARD COMPATIBILITY ═══
  if (totalEpisodes === 5 && EPISODE_CONFIG[episodeNumber]) {
    return EPISODE_CONFIG[episodeNumber];
  }

  // ═══ TEMPLATE: ERSTLESER (3 episodes, age 6-7) ═══
  if (totalEpisodes === 3) {
    const ERSTLESER_CONFIG: Record<number, EpisodeConfig> = {
      1: {
        function_name: "Das Abenteuer beginnt",
        function_description: "Stelle die Welt und die Figuren vor. Zeige das Problem oder Mysterium. Mache neugierig auf mehr. Alles bleibt freundlich und einladend.",
        requirements: [
          "Die ersten Sätze müssen sofort neugierig machen",
          "Alle Figuren werden vorgestellt (max. 2-3 Figuren)",
          "Ein klares, einfaches Problem wird eingeführt",
          "Signature Element einführen (z.B. magischer Gegenstand, Tier-Begleiter)",
          "Ende macht neugierig (KEIN harter Cliffhanger, KEIN Angst-Moment)",
        ],
        preferred_anfang: ["A1", "A2"],
        preferred_mitte: ["M1", "M2"],
        required_ende: "Neugierig-offenes Ende: eine Frage oder Entdeckung die Lust auf Weiterlesen macht",
        ending_type_db: "B",
      },
      2: {
        function_name: "Die Herausforderung",
        function_description: "Die Figuren versuchen das Problem zu lösen. Es ist schwieriger als gedacht. Sie brauchen Mut, Freundschaft oder eine clevere Idee.",
        requirements: [
          "Ein erster Lösungsversuch, der nicht ganz klappt",
          "Die Figuren zeigen Mut, Teamwork oder Kreativität",
          "Konsequenzen aus Kapitel 1 zeigen",
          "Signature Element kommt vor",
          "Ende zeigt: Es gibt noch etwas zu tun, aber Hoffnung ist da",
        ],
        preferred_anfang: ["A3", "A5"],
        preferred_mitte: ["M1", "M3"],
        required_ende: "Hoffnungsvolles offenes Ende: die Figuren haben eine Idee",
        ending_type_db: "B",
      },
      3: {
        function_name: "Das Happy End",
        function_description: "Alles kommt zusammen. Das Problem wird gelöst. Die Figuren haben etwas gelernt. Abschluss mit gutem Gefühl.",
        requirements: [
          "Die Lösung ergibt sich aus den vorherigen Kapiteln (kein Zufall)",
          "Callback zu Kapitel 1 (mindestens ein Element wird wieder wichtig)",
          "Jede Figur hat ihren Moment",
          "Signature Element hat einen besonderen Moment",
          "KEIN Cliffhanger — Geschichte muss abschließen",
          "Ende fühlt sich belohnend an (Kind hat mitgefiebert und bekommt Auflösung)",
        ],
        preferred_anfang: ["A1", "A3"],
        preferred_mitte: ["M1", "M4"],
        required_ende: "Abgeschlossen: Happy End oder warmherziger Abschluss. Kind fühlt sich gut.",
        ending_type_db: "A",
      },
    };
    return ERSTLESER_CONFIG[episodeNumber] || ERSTLESER_CONFIG[3];
  }

  // ═══ TEMPLATE: FORTGESCHRITTEN (4 episodes, age 8-9) ═══
  if (totalEpisodes === 4) {
    const FORTGESCHRITTEN_4_CONFIG: Record<number, EpisodeConfig> = {
      1: {
        function_name: "Die Welt öffnet sich",
        function_description: "Etabliere die Welt und Figuren. Setze das zentrale Mysterium. Platziere ein Signature Element. Ende mit starkem Hook.",
        requirements: [
          "Die ersten zwei Sätze müssen sofort neugierig machen",
          "Jede Hauptfigur bekommt einen charakteristischen Moment",
          "Ein Geheimnis oder Rätsel wird angedeutet (nicht erklärt)",
          "Signature Element einführen",
          "Ende mit unwiderstehlichem Hook",
        ],
        preferred_anfang: ["A1", "A2", "A4"],
        preferred_mitte: ["M1", "M2"],
        required_ende: "Cliffhanger oder starkes offenes Ende",
        ending_type_db: "C",
      },
      2: {
        function_name: "Alles wird komplizierter",
        function_description: "Der erste Plan scheitert. Neue Hürden tauchen auf. Die Figuren müssen umdenken.",
        requirements: [
          "Ein gescheiterter Versuch der Figuren",
          "Neue Dimension des Problems",
          "Konsequenzen aus Kapitel 1 zeigen",
          "Beziehungen werden komplexer",
          "Signature Element kommt vor",
        ],
        preferred_anfang: ["A3", "A5"],
        preferred_mitte: ["M1", "M3", "M6"],
        required_ende: "Cliffhanger — es wird schlimmer bevor es besser wird",
        ending_type_db: "C",
      },
      3: {
        function_name: "Die Wende",
        function_description: "Enthüllung und emotionaler Wendepunkt. Karten werden neu gemischt. Schwere Entscheidung für die Hauptfigur.",
        requirements: [
          "Eine Enthüllung die alles verändert",
          "Schwere Entscheidung oder Opfer der Hauptfigur",
          "Moment der Einsamkeit oder Zweifel",
          "Aber: ein Funke Hoffnung bleibt",
          "Signature Element bekommt tiefere Bedeutung",
        ],
        preferred_anfang: ["A2", "A5"],
        preferred_mitte: ["M2", "M4", "M5"],
        required_ende: "Stärkster Cliffhanger: alles scheint verloren, aber ein Detail zeigt den Weg",
        ending_type_db: "C",
      },
      4: {
        function_name: "Das große Finale",
        function_description: "Alles kommt zusammen. Das Mysterium wird gelöst. Die Figuren haben sich verändert.",
        requirements: [
          "Alle wesentlichen Fäden auflösen",
          "Callback zu Kapitel 1",
          "Jede Hauptfigur bekommt ihren Moment",
          "Charakterentwicklung sichtbar",
          "Signature Element hat finalen Moment",
          "KEIN Deus ex machina",
          "KEIN Cliffhanger — Geschichte muss abschließen",
        ],
        preferred_anfang: ["A1", "A3"],
        preferred_mitte: ["M1", "M4"],
        required_ende: "Abschluss: Klassisch (8J) oder Offenes Fenster (9J)",
        ending_type_db: "A",
      },
    };
    return FORTGESCHRITTEN_4_CONFIG[episodeNumber] || FORTGESCHRITTEN_4_CONFIG[4];
  }

  // ═══ TEMPLATE: LESERATTE (6 episodes, age 10+) ═══
  if (totalEpisodes === 6) {
    const LESERATTE_6_CONFIG: Record<number, EpisodeConfig> = {
      1: { ...EPISODE_CONFIG[1] },
      2: { ...EPISODE_CONFIG[2] },
      3: { ...EPISODE_CONFIG[3] },
      4: {
        function_name: "Die Vertiefung",
        function_description: "Eine Pause im äußeren Konflikt. Innere Welten und Beziehungen vertiefen sich. Nebenfiguren bekommen ihre Geschichte. Subtile Hinweise auf die finale Auflösung.",
        requirements: [
          "Fokus auf Beziehungen und innere Konflikte (nicht Action)",
          "Eine Nebenfigur bekommt Tiefe und ihre eigene Mini-Geschichte",
          "Subtile Hinweise die im Finale wichtig werden",
          "Perspektive einer anderen Figur zeigen",
          "Signature Element kommt vor — in unerwarteter Weise",
        ],
        preferred_anfang: ["A3", "A6"],
        preferred_mitte: ["M2", "M5"],
        required_ende: "Ruhiger Cliffhanger: eine leise Entdeckung die alles verändern wird",
        ending_type_db: "C",
      },
      5: { ...EPISODE_CONFIG[4] },
      6: {
        ...EPISODE_CONFIG[5],
        requirements: [
          ...EPISODE_CONFIG[5].requirements,
          "Nutze die Vertiefungs-Episode: Nebenfigur-Geschichte fließt ins Finale",
        ],
      },
    };
    return LESERATTE_6_CONFIG[episodeNumber] || LESERATTE_6_CONFIG[6];
  }

  // ═══ TEMPLATE: LESERATTE LANG (7 episodes, age 12+) ═══
  if (totalEpisodes === 7) {
    const LESERATTE_7_CONFIG: Record<number, EpisodeConfig> = {
      1: { ...EPISODE_CONFIG[1] },
      2: { ...EPISODE_CONFIG[2] },
      3: { ...EPISODE_CONFIG[3] },
      4: {
        function_name: "Die Vertiefung",
        function_description: "Pause im äußeren Konflikt. Beziehungen und Hintergeschichten vertiefen sich.",
        requirements: [
          "Fokus auf Beziehungen und innere Konflikte",
          "Nebenfigur bekommt Tiefe",
          "Subtile Hinweise auf die finale Auflösung",
          "Signature Element in unerwarteter Weise",
        ],
        preferred_anfang: ["A3", "A6"],
        preferred_mitte: ["M2", "M5"],
        required_ende: "Ruhiger Cliffhanger: leise Entdeckung",
        ending_type_db: "C",
      },
      5: {
        function_name: "Die Eskalation",
        function_description: "Die Ruhe ist vorbei. Konsequenzen der Vertiefung treffen auf den äußeren Konflikt. Alles beschleunigt sich.",
        requirements: [
          "Ergebnisse der Vertiefung eskalieren den Hauptkonflikt",
          "Tempo steigt deutlich",
          "Allianzen verschieben sich final",
          "Point of no return: Figuren können nicht mehr zurück",
          "Signature Element wird zur Waffe/zum Schlüssel",
        ],
        preferred_anfang: ["A5", "A3"],
        preferred_mitte: ["M3", "M6"],
        required_ende: "Harter Cliffhanger: die finale Konfrontation steht bevor",
        ending_type_db: "C",
      },
      6: { ...EPISODE_CONFIG[4] },
      7: {
        ...EPISODE_CONFIG[5],
        required_ende: "Abschluss: Philosophisch oder offenes Fenster (für 12+)",
        requirements: [
          ...EPISODE_CONFIG[5].requirements,
          "Nutze Vertiefungs- und Eskalations-Episode für die Auflösung",
        ],
      },
    };
    return LESERATTE_7_CONFIG[episodeNumber] || LESERATTE_7_CONFIG[7];
  }

  // ═══ FALLBACK: Use old 5-episode config ═══
  return EPISODE_CONFIG[episodeNumber] || EPISODE_CONFIG[5];
}

// ─── Modus B: Interactive Series Prompt Blocks ───────────────────

/**
 * B.1: Build BRANCH OPTIONS block for interactive series (Ep1-4).
 * Instructs the LLM to generate 3 continuation options at the end of the episode.
 */
function buildInteractiveBranchOptionsBlock(request: StoryRequest): string {
  const epNum = request.series_episode_number || 1;
  const totalEps = request.series_total_episodes || 5;
  if (request.series_mode !== 'interactive' || epNum >= totalEps) return '';

  const nextEpConfig = getEpisodeConfig(epNum + 1, totalEps, request.kid_profile.age);
  const nextEpFunction = nextEpConfig ? nextEpConfig.function_name : '';
  const age = request.kid_profile.age;

  return [
    '',
    'MITGESTALTEN-MODUS:',
    'Am Ende dieser Episode generiere genau 3 Fortsetzungs-Optionen.',
    '',
    'Für jede Option liefere:',
    '- option_id: "A", "B" oder "C"',
    `- title: Kurzer, spannender Titel (3-6 Wörter, in der Story-Sprache "${request.story_language}")`,
    `- preview: 1-2 Sätze die neugierig machen OHNE zu spoilern (in der Story-Sprache "${request.story_language}")`,
    '- direction: "brave" (mutig/aktiv), "clever" (schlau/vorsichtig) oder "surprising" (überraschend/unerwartet)',
    '- image_hint: 1 Satz auf Englisch der die Szene beschreibt (für Bildgenerierung)',
    '',
    'REGELN FÜR DIE OPTIONEN:',
    '- Alle 3 Optionen müssen zu UNTERSCHIEDLICHEN Handlungssträngen führen',
    nextEpFunction
      ? `- Jede Option muss die Episoden-Funktion der NÄCHSTEN Episode ermöglichen (nächste Episode = "${nextEpFunction}")`
      : '- Jede Option muss eine sinnvolle Fortsetzung ermöglichen',
    '- Keine Option darf die Serie vorzeitig beenden oder das Mysterium vollständig lösen',
    `- Die Optionen sollen für Kinder im Alter ${age} spannend und verständlich sein`,
    '- Eine mutige Option, eine kluge Option, eine überraschende Option',
    '- Der Cliffhanger der Episode soll die Optionen motivieren (nicht danach kommen)',
    '',
    'Liefere die Optionen als JSON-Array im Feld "branch_options".',
  ].join('\n');
}

/**
 * B.2: Build CHILD CHOICE CONTEXT block for Ep2-5 when child chose a branch.
 * Tells the LLM to continue from the child's chosen option.
 */
function buildBranchChosenBlock(request: StoryRequest): string {
  if (request.series_mode !== 'interactive') return '';
  if (!request.branch_chosen) return '';

  const chosenTitle = request.branch_chosen;
  const chosenPreview = request.branch_chosen_preview || '';
  const chosenDirection = request.branch_chosen_direction || '';

  const lines = [
    '',
    'KINDER-WAHL:',
    'Das Kind hat am Ende der letzten Episode folgende Option gewählt:',
    `Titel: "${chosenTitle}"`,
  ];
  if (chosenPreview) {
    lines.push(`Beschreibung: "${chosenPreview}"`);
  }
  if (chosenDirection) {
    lines.push(`Richtung: ${chosenDirection}`);
  }
  lines.push('');
  lines.push('WICHTIG: Baue diese Episode auf dieser Wahl auf. Die ersten 2-3 Sätze');
  lines.push('müssen direkt an die gewählte Option anknüpfen. Das Kind soll spüren,');
  lines.push('dass SEINE Entscheidung die Geschichte beeinflusst hat.');

  return lines.join('\n');
}

/**
 * B.3: Build FINALE RECAP block for Episode 5 of interactive series.
 * Summarizes all previous branch choices so the LLM can include callbacks.
 */
function buildInteractiveFinaleBlock(request: StoryRequest): string {
  if (request.series_mode !== 'interactive') return '';
  const epNum = request.series_episode_number || 1;
  const totalEps = request.series_total_episodes || 5;
  if (epNum !== totalEps) return '';

  const allBranches = request.series_all_branches || [];
  if (allBranches.length === 0) return '';

  const lines = [
    '',
    'FINALE MIT RÜCKBLICK:',
    'Dies ist das Finale einer interaktiven Serie. Das Kind hat in den',
    'vorherigen Episoden folgende Entscheidungen getroffen:',
  ];
  for (const branch of allBranches) {
    lines.push(`- Episode ${branch.episode_number} → ${branch.chosen_title}`);
  }
  lines.push('');
  lines.push('Baue mindestens einen Callback zu einer früheren Entscheidung ein.');
  lines.push('Das Kind soll sehen, dass seine Entscheidungen Konsequenzen hatten.');
  lines.push('Generiere KEINE branch_options (Serie endet hier).');

  return lines.join('\n');
}

/**
 * Build the full SERIES CONTEXT block for the prompt.
 * Called only when the story is part of a series (is_series=true + series_episode_number).
 */
function buildSeriesContextBlock(request: StoryRequest): string {
  const epNum = request.series_episode_number;
  if (!epNum) return '';

  const totalEps = request.series_total_episodes || 5;
  const config = getEpisodeConfig(epNum, totalEps, request.kid_profile.age);
  const lines: string[] = [];

  // ═══ Header ═══
  lines.push('═══════════════════════════════════════════════');
  lines.push(`SERIEN-MODUS: Episode ${epNum} von ${totalEps}`);
  lines.push('═══════════════════════════════════════════════');
  lines.push('');

  // ═══ Episode function ═══
  lines.push(`EPISODEN-FUNKTION: ${config.function_name}`);
  lines.push(config.function_description);
  lines.push('');

  // ═══ Requirements ═══
  lines.push('PFLICHT-ELEMENTE DIESER EPISODE:');
  for (const req of config.requirements) {
    lines.push(`- ${req}`);
  }
  lines.push('');

  // ═══ Structure constraints ═══
  lines.push('STRUKTUR-CONSTRAINTS:');
  lines.push(`- ANFANG bevorzugt: ${config.preferred_anfang.join(', ')}`);
  lines.push(`- MITTE bevorzugt: ${config.preferred_mitte.join(', ')}`);
  lines.push(`- ENDE Pflicht: ${config.required_ende}`);
  lines.push('');

  // ═══ Previous episodes context (Ep2+) ═══
  if (epNum > 1 && request.series_previous_episodes && request.series_previous_episodes.length > 0) {
    lines.push('BISHERIGER VERLAUF:');
    for (const ep of request.series_previous_episodes) {
      const summary = ep.episode_summary || '(keine Zusammenfassung)';
      lines.push(`- Episode ${ep.episode_number}: "${ep.title}" – ${summary}`);
    }
    lines.push('');
  }

  // ═══ Continuity state (Ep2+) ═══
  const cs = request.series_continuity_state;
  if (epNum > 1 && cs) {
    lines.push('KONTINUITÄTS-STATE:');
    if (cs.established_facts?.length) {
      lines.push(`- Etablierte Fakten: ${cs.established_facts.join('; ')}`);
    }
    if (cs.open_threads?.length) {
      lines.push(`- Offene Fäden: ${cs.open_threads.join('; ')}`);
    }
    if (cs.character_states && Object.keys(cs.character_states).length > 0) {
      lines.push('- Charakter-Entwicklung:');
      for (const [name, state] of Object.entries(cs.character_states)) {
        lines.push(`  - ${name}: ${state}`);
      }
    }
    if (cs.world_rules?.length) {
      lines.push(`- Welt-Regeln: ${cs.world_rules.join('; ')}`);
    }
    if (cs.signature_element) {
      lines.push(`- Signature Element: ${cs.signature_element.description}`);
      if (cs.signature_element.usage_history?.length) {
        lines.push(`  Bisherige Verwendung: ${cs.signature_element.usage_history.join('; ')}`);
      }
    }
    lines.push('');
  }

  // ═══ Character states enrichment for Ep2+ ═══
  if (epNum > 1 && cs?.character_states && Object.keys(cs.character_states).length > 0) {
    lines.push('BEZIEHUNGS-REGELN:');
    lines.push('- Verwende die definierten Beziehungen konsistent über alle Episoden');
    lines.push('- Familienrollen sind fest (Papa ist IMMER Papa, nicht ein Freund)');
    lines.push('- Beziehungen dürfen sich ENTWICKELN (Streit, Versöhnung) aber nie WIDERSPRECHEN');
    lines.push('- Anti-Klischee: Jüngere Geschwister sind NICHT automatisch nervig oder unfähig');
    lines.push('');
  }

  // ═══ Output extension for series ═══
  lines.push('OUTPUT-ERWEITERUNG FÜR SERIEN:');
  lines.push('Liefere zusätzlich zum normalen Output folgende JSON-Felder:');
  lines.push('');
  lines.push('episode_summary: Zusammenfassung dieser Episode in max 80 Wörtern.');
  lines.push('Nur Plot-Punkte und Charakter-Entwicklung, keine Stilbeschreibung.');
  lines.push('');
  lines.push('continuity_state: {');
  lines.push('  "established_facts": [...alle Fakten die jetzt feststehen...],');
  lines.push('  "open_threads": [...alle offenen Fragen...],');
  lines.push('  "character_states": {"Name": "aktueller Zustand"},');
  lines.push('  "world_rules": [...alle etablierten Regeln...],');
  lines.push('  "signature_element": {');
  lines.push('    "description": "...",');
  lines.push('    "usage_history": ["Ep1: ...", "Ep2: ...", ...]');
  lines.push('  }');
  lines.push('}');

  // Visual style sheet only for Episode 1
  if (epNum === 1) {
    lines.push('');
    lines.push('visual_style_sheet: {');
    lines.push('  "characters": {"Name": "englische Beschreibung für Bildgenerierung, max 1 Satz pro Figur"},');
    lines.push('  "world_style": "englische Stil-Beschreibung der visuellen Welt",');
    lines.push('  "recurring_visual": "visuelles Signature Element"');
    lines.push('}');
  }

  // ═══ Modus B: Interactive Series Blocks ═══

  // B.2: Child's chosen option context (Ep2-5 of interactive series)
  const branchChosenBlock = buildBranchChosenBlock(request);
  if (branchChosenBlock) {
    lines.push(branchChosenBlock);
  }

  // B.3: Finale recap for Episode 5 of interactive series
  const finaleBlock = buildInteractiveFinaleBlock(request);
  if (finaleBlock) {
    lines.push(finaleBlock);
  }

  // B.1: Branch options generation for Ep1-4 of interactive series
  const branchOptionsBlock = buildInteractiveBranchOptionsBlock(request);
  if (branchOptionsBlock) {
    lines.push(branchOptionsBlock);
  }

  lines.push('═══════════════════════════════════════════════');

  return lines.join('\n');
}

// ─── Main: buildStoryPrompt ─────────────────────────────────────

export async function buildStoryPrompt(
  request: StoryRequest,
  supabaseClient: any
): Promise<string> {
  const lang = request.story_language;
  const headers = SECTION_HEADERS[lang] || SECTION_HEADERS['en'];
  const langName = LANGUAGE_NAMES[lang] || lang;
  const questionCount = request.question_count || 5;

  // ── 1. Load age_rules (with fallback to 'de') ──
  // Clamp to min 6 for DB lookup — age_rules starts at min_age=6.
  // The real age (e.g. 5) is still used in the prompt text itself.
  const ageForRules = Math.max(request.kid_profile.age, 6);

  let ageRules: any = null;
  {
    const { data, error: ageErr } = await supabaseClient
      .from('age_rules')
      .select('*')
      .eq('language', lang)
      .lte('min_age', ageForRules)
      .gte('max_age', ageForRules)
      .limit(1)
      .maybeSingle();
    if (ageErr) console.error('[promptBuilder] age_rules error:', ageErr.message);
    ageRules = data;

    if (!ageRules && lang !== 'en' && lang !== 'de') {
      console.warn(`[promptBuilder] No age_rules for lang=${lang}. Trying 'en'...`);
      const { data: enFallback } = await supabaseClient
        .from('age_rules')
        .select('*')
        .eq('language', 'en')
        .lte('min_age', ageForRules)
        .gte('max_age', ageForRules)
        .limit(1)
        .maybeSingle();
      ageRules = enFallback;
    }
    if (!ageRules && lang !== 'de') {
      console.warn(`[promptBuilder] No age_rules for lang=${lang} or 'en'. Trying 'de'...`);
      const { data: deFallback } = await supabaseClient
        .from('age_rules')
        .select('*')
        .eq('language', 'de')
        .lte('min_age', ageForRules)
        .gte('max_age', ageForRules)
        .limit(1)
        .maybeSingle();
      ageRules = deFallback;
    }
    if (!ageRules) {
      console.error(`[promptBuilder] No age_rules found at all for age=${request.kid_profile.age}. Using hardcoded defaults.`);
      ageRules = {
        style_prompt: 'Write in a child-friendly, engaging style.',
        vocabulary_level: 'age-appropriate',
        sentence_complexity: 'simple to moderate',
        color_palette: 'warm, friendly colors',
        labels: {},
      };
    }
  }

  // ── 2. Load difficulty_rules (with fallback to 'de') ──
  let diffRules: any = null;
  {
    const { data, error: diffErr } = await supabaseClient
      .from('difficulty_rules')
      .select('*')
      .eq('language', lang)
      .eq('difficulty_level', request.kid_profile.difficulty_level)
      .limit(1)
      .maybeSingle();
    if (diffErr) console.error('[promptBuilder] difficulty_rules error:', diffErr.message);
    diffRules = data;

    if (!diffRules && lang !== 'en' && lang !== 'de') {
      console.warn(`[promptBuilder] No difficulty_rules for lang=${lang}. Trying 'en'...`);
      const { data: enFallback } = await supabaseClient
        .from('difficulty_rules')
        .select('*')
        .eq('language', 'en')
        .eq('difficulty_level', request.kid_profile.difficulty_level)
        .limit(1)
        .maybeSingle();
      diffRules = enFallback;
    }
    if (!diffRules && lang !== 'de') {
      console.warn(`[promptBuilder] No difficulty_rules for lang=${lang} or 'en'. Trying 'de'...`);
      const { data: deFallback } = await supabaseClient
        .from('difficulty_rules')
        .select('*')
        .eq('language', 'de')
        .eq('difficulty_level', request.kid_profile.difficulty_level)
        .limit(1)
        .maybeSingle();
      diffRules = deFallback;
    }
    if (!diffRules) {
      console.error(`[promptBuilder] No difficulty_rules found at all for level=${request.kid_profile.difficulty_level}. Using hardcoded defaults.`);
      diffRules = {
        word_count_min: 200,
        word_count_max: 500,
        sentence_length: 'moderate',
        labels: {},
      };
    }
  }

  // ── 3. Load theme_rules (skip for 'surprise' theme, with fallback to 'de' / 'everyday') ──
  const isSurpriseTheme = !request.theme_key || request.theme_key === 'surprise';
  let themeRules: any = null;
  
  if (!isSurpriseTheme) {
    const { data, error: themeErr } = await supabaseClient
      .from('theme_rules')
      .select('*')
      .eq('theme_key', request.theme_key)
      .eq('language', lang)
      .limit(1)
      .maybeSingle();

    if (themeErr) console.error('[promptBuilder] theme_rules error:', themeErr.message);
    themeRules = data;

    // Fallback 1: Same theme in English
    if (!themeRules && lang !== 'en' && lang !== 'de') {
      console.warn(`[promptBuilder] No theme_rules for key=${request.theme_key}, lang=${lang}. Trying 'en'...`);
      const { data: enFallback } = await supabaseClient
        .from('theme_rules')
        .select('*')
        .eq('theme_key', request.theme_key)
        .eq('language', 'en')
        .limit(1)
        .maybeSingle();
      themeRules = enFallback;
    }

    // Fallback 2: Same theme in German
    if (!themeRules && lang !== 'de') {
      console.warn(`[promptBuilder] No theme_rules for key=${request.theme_key}, lang=${lang}. Trying 'de'...`);
      const { data: deFallback } = await supabaseClient
        .from('theme_rules')
        .select('*')
        .eq('theme_key', request.theme_key)
        .eq('language', 'de')
        .limit(1)
        .maybeSingle();
      themeRules = deFallback;
    }

    // Fallback 3: 'everyday' theme in German
    if (!themeRules) {
      console.warn(`[promptBuilder] No theme_rules for key=${request.theme_key} in any language. Trying 'everyday' (de) fallback...`);
      const { data: fallback2 } = await supabaseClient
        .from('theme_rules')
        .select('*')
        .eq('theme_key', 'everyday')
        .eq('language', 'de')
        .limit(1)
        .maybeSingle();
      themeRules = fallback2;
    }

    // Fallback 3: Hardcoded minimal – NO CRASH
    if (!themeRules) {
      console.error(`[promptBuilder] No theme_rules found at all. Using hardcoded minimal rules.`);
      themeRules = null; // Will be handled like surprise theme (no theme constraints)
    }
  }

  // ── 4. Load content_themes_by_level (guardrails) ──
  const { data: allowedThemes } = await supabaseClient
    .from('content_themes_by_level')
    .select('theme_key, labels, min_safety_level')
    .gt('min_safety_level', 0)
    .lte('min_safety_level', request.kid_profile.content_safety_level);

  const { data: forbiddenThemes } = await supabaseClient
    .from('content_themes_by_level')
    .select('theme_key, labels, min_safety_level')
    .or(`min_safety_level.gt.${request.kid_profile.content_safety_level},min_safety_level.eq.0`);

  const allowedLabels = (allowedThemes || []).map((t: any) => label(t.labels, lang)).filter(Boolean);
  const forbiddenLabels = (forbiddenThemes || []).map((t: any) => label(t.labels, lang)).filter(Boolean);

  // ── 5. Learning theme (imported externally, passed as parameter or null) ──
  // The caller (generate-story/index.ts) will call shouldApplyLearningTheme separately
  // and pass the result. We check for it in the request or skip.
  // For now, we'll just leave a placeholder – the caller injects it.

  // ── 6. Load last 5 stories for variety ──
  const { data: recentStories } = await supabaseClient
    .from('stories')
    .select('structure_beginning, structure_middle, structure_ending, emotional_coloring, emotional_secondary, humor_level, concrete_theme')
    .eq('kid_profile_id', request.kid_profile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // ── Compute word counts ──
  // If generation_config override is provided (from DB), use it directly.
  // Otherwise fall back to the age_rules × factor calculation.
  let minWords: number;
  let maxWords: number;
  if (request.word_count_override) {
    minWords = request.word_count_override.min_words;
    maxWords = request.word_count_override.max_words;
  } else {
    const factor = { short: 0.7, medium: 1.0, long: 1.4, extra_long: 2.0 }[request.length] || 1.0;
    minWords = Math.round(ageRules.min_word_count * factor);
    maxWords = Math.round(ageRules.max_word_count * factor);
  }

  // ── Build variety block ──
  const varietyBlock = buildVarietyBlock(recentStories || [], headers);

  // ── Build the prompt sections ──
  const sections: string[] = [];

  // Instruction
  sections.push(headers.instruction);

  // CHILD
  sections.push(`## ${headers.child}\nName: ${request.kid_profile.first_name}, Age: ${request.kid_profile.age}`);

  // Explicit language instruction for beta languages (no UI translations)
  const BETA_LANG_CODES = new Set(['hu','pt','tr','bg','lt','ca','pl','sk']);
  if (BETA_LANG_CODES.has(lang)) {
    sections.push(
      `## CRITICAL LANGUAGE INSTRUCTION\n` +
      `Write the ENTIRE story in ${LANGUAGE_NAMES[lang] || lang} (${lang}).\n` +
      `ALL text must be in ${LANGUAGE_NAMES[lang] || lang}: title, story text, dialogue, narration, descriptions.\n` +
      `ALL comprehension questions and answer options must be in ${LANGUAGE_NAMES[lang] || lang}.\n` +
      `ALL vocabulary words and their explanations must be in ${LANGUAGE_NAMES[lang] || lang}.\n` +
      `Use correct grammar, diacritics, and punctuation for ${LANGUAGE_NAMES[lang] || lang}.\n` +
      `Character names can remain as provided (child's real name).`
    );
  }

  // LANGUAGE & LEVEL
  const diffLabel = label(diffRules.label, lang);
  const diffDesc = label(diffRules.description, lang);
  const langSection = [
    `## ${headers.language}`,
    `Language: ${langName}`,
    `Level: ${diffLabel} — ${diffDesc}`,
    `Max sentence length: ${ageRules.max_sentence_length} words`,
    `Tenses: ${arrJoin(ageRules.allowed_tenses)}`,
    `Sentence structures: ${ageRules.sentence_structures}`,
    ageRules.narrative_perspective ? `Perspective: ${ageRules.narrative_perspective}` : null,
    `Style: ${ageRules.narrative_guidelines}`,
  ].filter(Boolean).join('\n');
  sections.push(langSection);

  // VOCABULARY
  const vocabSection = [
    `## ${headers.vocabulary}`,
    diffRules.vocabulary_scope,
    `New words: max. ${diffRules.new_words_per_story}`,
    `Figurative language: ${diffRules.figurative_language}`,
    `Idioms: ${diffRules.idiom_usage}`,
    `Repetition: ${diffRules.repetition_strategy}`,
  ].join('\n');
  sections.push(vocabSection);

  // LENGTH
  const lengthSection = [
    `## ${headers.length}`,
    `${minWords}–${maxWords} words`,
    ageRules.paragraph_length ? `Paragraphs: ${ageRules.paragraph_length}` : null,
    ageRules.dialogue_ratio ? `Dialogue: ${ageRules.dialogue_ratio}` : null,
    `Questions: ${questionCount}`,
  ].filter(Boolean).join('\n');
  sections.push(lengthSection);

  // STORY SUBTYPE (Themenvariation — inserted before CATEGORY)
  if (request.story_subtype) {
    const st = request.story_subtype;
    const subtypeIntro: Record<string, string> = {
      de: 'KONKRETER STORY-TYP',
      fr: 'TYPE D\'HISTOIRE CONCRET',
      en: 'SPECIFIC STORY TYPE',
      es: 'TIPO DE HISTORIA CONCRETO',
      it: 'TIPO DI STORIA CONCRETO',
      bs: 'KONKRETAN TIP PRIČE',
      nl: 'CONCREET VERHAALTYPE',
    };
    const subtypeWarning: Record<string, string> = {
      de: 'WICHTIG: Folge der Story-Art. Schreibe KEINE generische Abenteuergeschichte.',
      fr: 'IMPORTANT : Suis le type d\'histoire. N\'écris PAS une aventure générique.',
      en: 'IMPORTANT: Follow the story type. Do NOT write a generic adventure story.',
      es: 'IMPORTANTE: Sigue el tipo de historia. NO escribas una aventura genérica.',
      it: 'IMPORTANTE: Segui il tipo di storia. NON scrivere un\'avventura generica.',
      bs: 'VAŽNO: Prati tip priče. NEMOJ pisati generičku avanturu.',
      nl: 'BELANGRIJK: Volg het verhaaltype. Schrijf GEEN generiek avontuurverhaal.',
    };
    const titleSeedHint: Record<string, string> = {
      de: 'Titel-Impuls: Orientiere dich an Titeln wie',
      fr: 'Inspiration de titre : Inspire-toi de titres comme',
      en: 'Title inspiration: Orient yourself to titles like',
      es: 'Inspiración de título: Oriéntate a títulos como',
      it: 'Ispirazione titolo: Orientati a titoli come',
      bs: 'Inspiracija za naslov: Orijentiši se na naslove poput',
      nl: 'Titel-inspiratie: Oriënteer je op titels zoals',
    };
    const settingHint: Record<string, string> = {
      de: 'Setting-Inspiration',
      fr: 'Inspiration de décor',
      en: 'Setting inspiration',
      es: 'Inspiración de escenario',
      it: 'Ispirazione ambientazione',
      bs: 'Inspiracija za mjesto radnje',
      nl: 'Setting-inspiratie',
    };

    const subtypeSection = [
      `## ${subtypeIntro[lang] || subtypeIntro.en}`,
      `Story-Art: ${st.label}`,
      `Anweisung: ${st.promptHint}`,
      st.settingIdea ? `${settingHint[lang] || settingHint.en}: ${st.settingIdea}` : null,
      st.titleSeed ? `${titleSeedHint[lang] || titleSeedHint.en} "${st.titleSeed}"` : null,
      '',
      subtypeWarning[lang] || subtypeWarning.en,
    ].filter(s => s !== null).join('\n');
    sections.push(subtypeSection);
    console.log(`[promptBuilder] Added STORY SUBTYPE section: ${st.subtypeKey} (${st.label})`);
  }

  // CATEGORY (or surprise theme hint)
  const surpriseThemeHint: Record<string, string> = {
    fr: `## ${headers.category}\nChoisis toi-même un thème créatif et surprenant pour cette histoire. Sois original !`,
    de: `## ${headers.category}\nWähle selbst ein kreatives und überraschendes Thema für diese Geschichte. Sei originell!`,
    en: `## ${headers.category}\nChoose a creative and surprising theme for this story yourself. Be original!`,
    es: `## ${headers.category}\nElige tú mismo un tema creativo y sorprendente para esta historia. ¡Sé original!`,
    it: `## ${headers.category}\nScegli tu un tema creativo e sorprendente per questa storia. Sii originale!`,
    bs: `## ${headers.category}\nSam/a odaberi kreativnu i iznenađujuću temu za ovu priču. Budi originalan/na!`,
    nl: `## ${headers.category}\nKies zelf een creatief en verrassend thema voor dit verhaal. Wees origineel!`,
  };

  if (isSurpriseTheme) {
    sections.push(surpriseThemeHint[lang] || surpriseThemeHint.en);
  } else if (themeRules) {
    // Theme rules loaded (or fallback succeeded)
    const themeLabel = label(themeRules.labels, lang);
    const categorySection = [
      `## ${headers.category}`,
      themeLabel,
      `Plots: ${arrJoin(themeRules.plot_templates)}`,
      themeRules.typical_conflicts ? `Conflicts: ${arrJoin(themeRules.typical_conflicts)}` : null,
      themeRules.character_archetypes ? `Archetypes: ${arrJoin(themeRules.character_archetypes)}` : null,
      themeRules.sensory_details ? `Sensory: ${themeRules.sensory_details}` : null,
      themeRules.setting_descriptions ? `Setting/Atmosphere: ${themeRules.setting_descriptions}` : null,
      `→ ${headers.chooseTheme}`,
    ].filter(Boolean).join('\n');
    sections.push(categorySection);
  } else {
    // themeRules is null even after all fallbacks – treat like surprise theme
    console.warn(`[promptBuilder] themeRules null after all fallbacks for key=${request.theme_key}. Using generic prompt.`);
    sections.push(surpriseThemeHint[lang] || surpriseThemeHint.en);
  }

  // CHARACTERS (Block 2.3d: relationship logic, Block 2.3e: surprise_characters)
  if (request.surprise_characters) {
    // Fictional-only characters: no real persons
    const fictionalHint: Record<string, string> = {
      fr: `## ${headers.characters}\nInvente des personnages 100% fictifs pour cette histoire.\nUtilise des animaux, des créatures fantastiques, des robots, des fées, ou d'autres êtres imaginaires.\nNE PAS utiliser de prénoms humains réalistes.\nNE PAS inclure d'enfants humains comme personnages principaux.\nLes personnages doivent être originaux et surprenants.`,
      de: `## ${headers.characters}\nErfinde 100% fiktive Figuren für diese Geschichte.\nNutze Tiere, Fabelwesen, Roboter, Feen oder andere Fantasiewesen.\nKEINE realistischen menschlichen Vornamen.\nKEINE menschlichen Kinder als Hauptfiguren.\nDie Figuren sollen originell und überraschend sein.`,
      en: `## ${headers.characters}\nInvent 100% fictional characters for this story.\nUse animals, mythical creatures, robots, fairies, or other imaginary beings.\nDo NOT use realistic human first names.\nDo NOT include human children as main characters.\nCharacters should be original and surprising.`,
      es: `## ${headers.characters}\nInventa personajes 100% ficticios para esta historia.\nUsa animales, criaturas fantásticas, robots, hadas u otros seres imaginarios.\nNO uses nombres humanos realistas.\nNO incluyas niños humanos como personajes principales.\nLos personajes deben ser originales y sorprendentes.`,
      it: `## ${headers.characters}\nInventa personaggi 100% di fantasia per questa storia.\nUsa animali, creature fantastiche, robot, fate o altri esseri immaginari.\nNON usare nomi umani realistici.\nNON includere bambini umani come personaggi principali.\nI personaggi devono essere originali e sorprendenti.`,
      bs: `## ${headers.characters}\nIzmisli 100% izmišljene likove za ovu priču.\nKoristi životinje, bajkovita bića, robote, vile ili druga maštovita bića.\nNE koristi realistična ljudska imena.\nNE uključuj ljudsku djecu kao glavne likove.\nLikovi trebaju biti originalni i iznenađujući.`,
      nl: `## ${headers.characters}\nVerzin 100% fictieve personages voor dit verhaal.\nGebruik dieren, mythische wezens, robots, feeën of andere denkbeeldige wezens.\nGebruik GEEN realistische menselijke voornamen.\nNeem GEEN menselijke kinderen op als hoofdpersonen.\nDe personages moeten origineel en verrassend zijn.`,
    };
    sections.push(fictionalHint[lang] || fictionalHint.en);
  } else {
    const charactersSection = buildCharactersSection(
      request.protagonists,
      request.kid_profile.first_name,
      request.kid_profile.age,
      headers,
      lang
    );
    if (charactersSection) {
      // Add enrichment hint: LLM may add secondary fictional characters
      const enrichmentHint: Record<string, string> = {
        fr: "Tu peux enrichir l'histoire avec des personnages secondaires inventés (animaux, créatures, etc.) en plus des personnages listés ci-dessus.",
        de: 'Du darfst die Geschichte mit erfundenen Nebenfiguren (Tiere, Fabelwesen, etc.) anreichern, zusätzlich zu den oben genannten Figuren.',
        en: 'You may enrich the story with invented secondary characters (animals, creatures, etc.) in addition to the characters listed above.',
        es: 'Puedes enriquecer la historia con personajes secundarios inventados (animales, criaturas, etc.) además de los personajes listados arriba.',
        it: 'Puoi arricchire la storia con personaggi secondari inventati (animali, creature, ecc.) oltre ai personaggi elencati sopra.',
        bs: 'Možeš obogatiti priču izmišljenim sporednim likovima (životinje, bića, itd.) uz likove navedene iznad.',
        nl: 'Je mag het verhaal verrijken met verzonnen bijfiguren (dieren, wezens, enz.) naast de hierboven genoemde personages.',
      };
      sections.push(`${charactersSection}\n${enrichmentHint[lang] || enrichmentHint.en}`);
    }
  }

  // STORYTELLING RULES (age-dependent complexity constraints)
  const age = request.kid_profile.age;
  const maxChars = ageRules.max_characters || 2;
  const maxTwists = ageRules.max_plot_twists ?? 1;
  const plotComplexity = ageRules.plot_complexity || 'simple';
  const maxSentLen = ageRules.max_sentence_length;

  const storytellingRulesBlock: Record<string, string> = {
    de: [
      `## ERZÄHLREGELN`,
      ``,
      `FIGUREN:`,
      `- Maximal ${maxChars} Figuren in der gesamten Geschichte (inkl. Protagonist und Nebenfiguren)`,
      `- JEDE Figur muss in den ersten 2 Absätzen eingeführt werden`,
      `- KEINE neue Figur darf nach der Einführungsszene erscheinen`,
      `- Jede Nebenfigur hat EINE klare Eigenschaft und EINE Funktion in der Geschichte`,
      `- Der Protagonist muss jemand sein, mit dem sich ein ${age}-jähriges Kind identifizieren kann`,
      ``,
      `HANDLUNG:`,
      `- ${plotComplexity}`,
      `- Maximal ${maxTwists} Wendepunkt(e) in der Geschichte`,
      `- Jeder Absatz macht EINE Sache: einführen, Spannung aufbauen, ODER auflösen`,
      `- Niemals eine neue Figur UND ein neues Problem im selben Absatz`,
      `- Die Geschichte soll sich ruhig und fokussiert anfühlen`,
      ``,
      `SPRACHE:`,
      `- Maximale Satzlänge: ${maxSentLen} Wörter`,
      `- Verwende NUR Wörter die ein ${age}-jähriges Kind kennt`,
      `- Maximal 2 Adjektive pro Satz`,
      `- Dialog treibt die Geschichte voran (Kinder verstehen Dialog am besten)`,
      ``,
      `VERBOTEN:`,
      `- ❌ Mehr als ${maxChars} Figuren`,
      `- ❌ Neue Figuren nach der Einführungsszene`,
      `- ❌ Mehrere Quests oder kaskadierende Hindernisse`,
      `- ❌ Adjektiv-Häufung ("der kleine glänzende mechanische Roboter")`,
      `- ❌ Jeder Absatz führt etwas Neues ein`,
      `- ❌ Überhastete Auflösung im letzten Absatz`,
    ].join('\n'),

    fr: [
      `## RÈGLES NARRATIVES`,
      ``,
      `PERSONNAGES:`,
      `- Maximum ${maxChars} personnages dans toute l'histoire (protagoniste + personnages secondaires)`,
      `- CHAQUE personnage doit être introduit dans les 2 premiers paragraphes`,
      `- AUCUN nouveau personnage après la scène d'introduction`,
      `- Chaque personnage secondaire a UNE caractéristique claire et UNE fonction`,
      `- Le protagoniste doit être quelqu'un à qui un enfant de ${age} ans peut s'identifier`,
      ``,
      `INTRIGUE:`,
      `- ${plotComplexity}`,
      `- Maximum ${maxTwists} rebondissement(s)`,
      `- Chaque paragraphe fait UNE chose: introduire, créer la tension, OU résoudre`,
      `- Jamais un nouveau personnage ET un nouveau problème dans le même paragraphe`,
      ``,
      `LANGUE:`,
      `- Longueur maximale des phrases: ${maxSentLen} mots`,
      `- Utiliser UNIQUEMENT des mots qu'un enfant de ${age} ans connaît`,
      `- Maximum 2 adjectifs par phrase`,
      `- Le dialogue fait avancer l'histoire`,
      ``,
      `INTERDIT:`,
      `- ❌ Plus de ${maxChars} personnages`,
      `- ❌ Nouveaux personnages après l'introduction`,
      `- ❌ Quêtes multiples ou obstacles en cascade`,
      `- ❌ Accumulation d'adjectifs`,
      `- ❌ Résolution précipitée`,
    ].join('\n'),

    en: [
      `## STORYTELLING RULES`,
      ``,
      `CHARACTERS:`,
      `- Maximum ${maxChars} characters total (protagonist + side characters)`,
      `- EVERY character must be introduced in the first 2 paragraphs`,
      `- NO new character may appear after the opening scene`,
      `- Each side character has ONE clear trait and ONE purpose`,
      `- The protagonist must be relatable for a ${age}-year-old`,
      ``,
      `PLOT:`,
      `- ${plotComplexity}`,
      `- Maximum ${maxTwists} plot twist(s)`,
      `- Each paragraph does ONE thing: introduce, build tension, OR resolve`,
      `- Never introduce a new character AND a new problem in the same paragraph`,
      ``,
      `LANGUAGE:`,
      `- Maximum sentence length: ${maxSentLen} words`,
      `- Use ONLY words a ${age}-year-old would know`,
      `- Maximum 2 adjectives per sentence`,
      `- Dialogue drives the story`,
      ``,
      `FORBIDDEN:`,
      `- ❌ More than ${maxChars} characters`,
      `- ❌ New characters after opening scene`,
      `- ❌ Multiple quests or cascading obstacles`,
      `- ❌ Adjective stacking`,
      `- ❌ Rushed resolution in final paragraph`,
    ].join('\n'),

    es: [
      `## REGLAS NARRATIVAS`,
      ``,
      `PERSONAJES:`,
      `- Máximo ${maxChars} personajes en toda la historia`,
      `- CADA personaje debe ser introducido en los primeros 2 párrafos`,
      `- NINGÚN personaje nuevo después de la escena de introducción`,
      `- Cada personaje secundario tiene UNA característica clara y UNA función`,
      `- El protagonista debe ser alguien con quien un niño de ${age} años se identifique`,
      ``,
      `TRAMA:`,
      `- ${plotComplexity}`,
      `- Máximo ${maxTwists} giro(s) en la trama`,
      `- Cada párrafo hace UNA cosa: introducir, generar tensión, O resolver`,
      ``,
      `IDIOMA:`,
      `- Longitud máxima de frases: ${maxSentLen} palabras`,
      `- Usar SOLO palabras que un niño de ${age} años conoce`,
      `- Máximo 2 adjetivos por frase`,
      ``,
      `PROHIBIDO:`,
      `- ❌ Más de ${maxChars} personajes`,
      `- ❌ Personajes nuevos después de la introducción`,
      `- ❌ Múltiples misiones u obstáculos en cascada`,
      `- ❌ Acumulación de adjetivos`,
      `- ❌ Resolución apresurada`,
    ].join('\n'),

    it: [
      `## REGOLE NARRATIVE`,
      ``,
      `PERSONAGGI:`,
      `- Massimo ${maxChars} personaggi in tutta la storia (protagonista + personaggi secondari)`,
      `- OGNI personaggio deve essere introdotto nei primi 2 paragrafi`,
      `- NESSUN nuovo personaggio dopo la scena di apertura`,
      `- Ogni personaggio secondario ha UNA caratteristica chiara e UNA funzione`,
      `- Il protagonista deve essere qualcuno con cui un bambino di ${age} anni si identifica`,
      ``,
      `TRAMA:`,
      `- ${plotComplexity}`,
      `- Massimo ${maxTwists} colpo/i di scena`,
      `- Ogni paragrafo fa UNA cosa: introdurre, creare tensione, O risolvere`,
      ``,
      `LINGUA:`,
      `- Lunghezza massima delle frasi: ${maxSentLen} parole`,
      `- Usare SOLO parole che un bambino di ${age} anni conosce`,
      `- Massimo 2 aggettivi per frase`,
      ``,
      `VIETATO:`,
      `- ❌ Più di ${maxChars} personaggi`,
      `- ❌ Nuovi personaggi dopo l'apertura`,
      `- ❌ Missioni multiple o ostacoli a cascata`,
      `- ❌ Accumulo di aggettivi`,
      `- ❌ Risoluzione affrettata`,
    ].join('\n'),

    bs: [
      `## PRAVILA PRIPOVIJEDANJA`,
      ``,
      `LIKOVI:`,
      `- Maksimalno ${maxChars} likova u cijeloj priči (protagonist + sporedni likovi)`,
      `- SVAKI lik mora biti predstavljen u prva 2 paragrafa`,
      `- NIJEDAN novi lik ne smije se pojaviti nakon uvodne scene`,
      `- Svaki sporedni lik ima JEDNU jasnu osobinu i JEDNU funkciju`,
      `- Protagonist mora biti neko s kim se dijete od ${age} godina može identificirati`,
      ``,
      `RADNJA:`,
      `- ${plotComplexity}`,
      `- Maksimalno ${maxTwists} preokret(a)`,
      `- Svaki paragraf radi JEDNU stvar: uvodi, gradi napetost, ILI rješava`,
      ``,
      `JEZIK:`,
      `- Maksimalna dužina rečenice: ${maxSentLen} riječi`,
      `- Koristi SAMO riječi koje dijete od ${age} godina poznaje`,
      `- Maksimalno 2 pridjeva po rečenici`,
      ``,
      `ZABRANJENO:`,
      `- ❌ Više od ${maxChars} likova`,
      `- ❌ Novi likovi nakon uvoda`,
      `- ❌ Višestruki zadaci ili kaskadne prepreke`,
      `- ❌ Nagomilavanje pridjeva`,
      `- ❌ Ishitreno rješenje`,
    ].join('\n'),

    nl: [
      `## VERTELREGELS`,
      ``,
      `PERSONAGES:`,
      `- Maximaal ${maxChars} personages in het hele verhaal (protagonist + bijfiguren)`,
      `- ELK personage moet in de eerste 2 alinea's worden geïntroduceerd`,
      `- GEEN nieuw personage mag verschijnen na de openingsscène`,
      `- Elk bijfiguur heeft ÉÉN duidelijke eigenschap en ÉÉN functie`,
      `- De protagonist moet herkenbaar zijn voor een kind van ${age} jaar`,
      ``,
      `PLOT:`,
      `- ${plotComplexity}`,
      `- Maximaal ${maxTwists} plotwending(en)`,
      `- Elke alinea doet ÉÉN ding: introduceren, spanning opbouwen, OF oplossen`,
      ``,
      `TAAL:`,
      `- Maximale zinslengte: ${maxSentLen} woorden`,
      `- Gebruik ALLEEN woorden die een kind van ${age} jaar kent`,
      `- Maximaal 2 bijvoeglijke naamwoorden per zin`,
      ``,
      `VERBODEN:`,
      `- ❌ Meer dan ${maxChars} personages`,
      `- ❌ Nieuwe personages na de opening`,
      `- ❌ Meerdere quests of opeenstapelende obstakels`,
      `- ❌ Bijvoeglijk naamwoord-ophoping`,
      `- ❌ Overhaaste oplossing`,
    ].join('\n'),
  };

  sections.push(storytellingRulesBlock[lang] || storytellingRulesBlock.en);

  // SPECIAL EFFECTS (only if non-empty)
  if (request.special_abilities && request.special_abilities.length > 0) {
    const abilityDescs = SPECIAL_ABILITIES_DESC[lang] || SPECIAL_ABILITIES_DESC['en'];
    const effectLines = request.special_abilities
      .map(a => abilityDescs[a] || a)
      .filter(Boolean);
    if (effectLines.length > 0) {
      sections.push(`## ${headers.specialEffects}\n${effectLines.join('\n')}`);
    }
  }

  // GUARDRAILS
  const guardrailSection = [
    `## ${headers.guardrails} (Safety Level ${request.kid_profile.content_safety_level}/4)`,
    allowedLabels.length > 0 ? `${headers.allowed}: ${allowedLabels.join(', ')}` : null,
    forbiddenLabels.length > 0 ? `${headers.notAllowed}: ${forbiddenLabels.join(', ')}` : null,
  ].filter(Boolean).join('\n');
  sections.push(guardrailSection);

  // VARIETY (only if non-empty)
  if (varietyBlock) {
    sections.push(varietyBlock);
  }

  // SPECIAL REQUEST (only if user_prompt)
  if (request.user_prompt && request.user_prompt.trim()) {
    sections.push(`## ${headers.specialRequest}\n${request.user_prompt.trim()}`);
  }

  // SERIES CONTEXT – Phase 2: structured episode context block
  if (request.is_series && request.series_episode_number) {
    const seriesBlock = buildSeriesContextBlock(request);
    if (seriesBlock) {
      sections.push(`## ${headers.series}\n${seriesBlock}`);
    }
  } else if (request.is_series && request.series_context) {
    // Legacy fallback for old-style plain-text series context
    sections.push(`## ${headers.series}\n${request.series_context}`);
  }

  // IMAGE PLAN INSTRUCTIONS (Block 2.4)
  const sceneCount = request.word_count_override?.scene_image_count ?? getSceneCount(request.length || 'medium');
  const sceneGuidance = sceneCount === 1
    ? 'Scene should capture the emotional highlight of the story.'
    : sceneCount === 2
    ? 'Scene 1: turning point or discovery. Scene 2: resolution or triumph.'
    : 'Scene 1: departure/beginning (curiosity). Scene 2: conflict/discovery (tension). Scene 3: resolution/return (joy/relief).';
  
  const imagePlanSection = [
    '## IMAGE PLAN INSTRUCTIONS',
    `Generate exactly ${sceneCount} scene(s) in the image_plan.`,
    sceneGuidance,
    'For each scene in image_plan, include "target_paragraph": the 0-based index of the paragraph in the story text that this image best illustrates. Count paragraphs starting from 0. Distribute images evenly across the story — do not cluster them at the beginning or end.',
    'All descriptions in ENGLISH. No text, signs, or readable writing in any scene.',
  ].join('\n');
  sections.push(imagePlanSection);

  // Final instruction
  sections.push(headers.respondJson);

  // Hard word-count constraint (last thing the model reads)
  sections.push(`CRITICAL CONSTRAINT: The story MUST contain between ${minWords} and ${maxWords} words. This is a hard limit. Count your words carefully. A story that exceeds ${maxWords} words is a failure and will be rejected.`);

  return sections.join('\n\n');
}

/**
 * Inject a learning theme section into an already-built prompt.
 * Called externally after buildStoryPrompt to keep concerns separate.
 */
export function injectLearningTheme(
  prompt: string,
  themeLabel: string,
  storyLanguage: string
): string {
  const headers = SECTION_HEADERS[storyLanguage] || SECTION_HEADERS['en'];
  const learningSection = `## ${headers.learningTheme}\nSubtly weave the theme "${themeLabel}" into the story. It should feel natural, not forced. If learning_theme_response field applies, fill it with {"applied": true, "parent_prompt_text": "3 discussion questions for parents"}.`;

  // Insert before the respondJson line
  const respondLine = headers.respondJson;
  if (prompt.includes(respondLine)) {
    return prompt.replace(respondLine, `${learningSection}\n\n${respondLine}`);
  }
  // Fallback: append
  return `${prompt}\n\n${learningSection}`;
}
