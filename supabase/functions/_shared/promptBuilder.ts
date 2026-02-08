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
  length: 'short' | 'medium' | 'long';
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
      lines.push(fmtChar(friends[0]));
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

// ─── Main: buildStoryPrompt ─────────────────────────────────────

export async function buildStoryPrompt(
  request: StoryRequest,
  supabaseClient: any
): Promise<string> {
  const lang = request.story_language;
  const headers = SECTION_HEADERS[lang] || SECTION_HEADERS['en'];
  const langName = LANGUAGE_NAMES[lang] || lang;
  const questionCount = request.question_count || 5;

  // ── 1. Load age_rules ──
  const { data: ageRules, error: ageErr } = await supabaseClient
    .from('age_rules')
    .select('*')
    .eq('language', lang)
    .lte('min_age', request.kid_profile.age)
    .gte('max_age', request.kid_profile.age)
    .limit(1)
    .maybeSingle();

  if (ageErr) console.error('[promptBuilder] age_rules error:', ageErr.message);
  if (!ageRules) throw new Error(`No age_rules found for language=${lang}, age=${request.kid_profile.age}`);

  // ── 2. Load difficulty_rules ──
  const { data: diffRules, error: diffErr } = await supabaseClient
    .from('difficulty_rules')
    .select('*')
    .eq('language', lang)
    .eq('difficulty_level', request.kid_profile.difficulty_level)
    .limit(1)
    .maybeSingle();

  if (diffErr) console.error('[promptBuilder] difficulty_rules error:', diffErr.message);
  if (!diffRules) throw new Error(`No difficulty_rules found for language=${lang}, level=${request.kid_profile.difficulty_level}`);

  // ── 3. Load theme_rules (skip for 'surprise' theme) ──
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
    if (!data) throw new Error(`No theme_rules found for key=${request.theme_key}, language=${lang}`);
    themeRules = data;
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
  const factor = { short: 0.7, medium: 1.0, long: 1.4 }[request.length] || 1.0;
  const minWords = Math.round(ageRules.min_word_count * factor);
  const maxWords = Math.round(ageRules.max_word_count * factor);

  // ── Build variety block ──
  const varietyBlock = buildVarietyBlock(recentStories || [], headers);

  // ── Build the prompt sections ──
  const sections: string[] = [];

  // Instruction
  sections.push(headers.instruction);

  // CHILD
  sections.push(`## ${headers.child}\nName: ${request.kid_profile.first_name}, Age: ${request.kid_profile.age}`);

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

  // CATEGORY (or surprise theme hint)
  if (isSurpriseTheme) {
    const surpriseThemeHint: Record<string, string> = {
      fr: `## ${headers.category}\nChoisis toi-même un thème créatif et surprenant pour cette histoire. Sois original !`,
      de: `## ${headers.category}\nWähle selbst ein kreatives und überraschendes Thema für diese Geschichte. Sei originell!`,
      en: `## ${headers.category}\nChoose a creative and surprising theme for this story yourself. Be original!`,
      es: `## ${headers.category}\nElige tú mismo un tema creativo y sorprendente para esta historia. ¡Sé original!`,
      it: `## ${headers.category}\nScegli tu un tema creativo e sorprendente per questa storia. Sii originale!`,
      bs: `## ${headers.category}\nSam/a odaberi kreativnu i iznenađujuću temu za ovu priču. Budi originalan/na!`,
      nl: `## ${headers.category}\nKies zelf een creatief en verrassend thema voor dit verhaal. Wees origineel!`,
    };
    sections.push(surpriseThemeHint[lang] || surpriseThemeHint.en);
  } else {
    const themeLabel = label(themeRules.labels, lang);
    const categorySection = [
      `## ${headers.category}`,
      themeLabel,
      `Plots: ${arrJoin(themeRules.plot_templates)}`,
      themeRules.typical_conflicts ? `Conflicts: ${arrJoin(themeRules.typical_conflicts)}` : null,
      themeRules.character_archetypes ? `Archetypes: ${arrJoin(themeRules.character_archetypes)}` : null,
      themeRules.sensory_details ? `Sensory: ${themeRules.sensory_details}` : null,
      `→ ${headers.chooseTheme}`,
    ].filter(Boolean).join('\n');
    sections.push(categorySection);
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

  // SERIES CONTEXT (only if is_series and has context)
  if (request.is_series && request.series_context) {
    sections.push(`## ${headers.series}\n${request.series_context}`);
  }

  // IMAGE PLAN INSTRUCTIONS (Block 2.4)
  const sceneCount = getSceneCount(request.length || 'medium');
  const sceneGuidance = sceneCount === 1
    ? 'Scene should capture the emotional highlight of the story.'
    : sceneCount === 2
    ? 'Scene 1: turning point or discovery. Scene 2: resolution or triumph.'
    : 'Scene 1: departure/beginning (curiosity). Scene 2: conflict/discovery (tension). Scene 3: resolution/return (joy/relief).';
  
  const imagePlanSection = [
    '## IMAGE PLAN INSTRUCTIONS',
    `Generate exactly ${sceneCount} scene(s) in the image_plan.`,
    sceneGuidance,
    'All descriptions in ENGLISH. No text, signs, or readable writing in any scene.',
  ].join('\n');
  sections.push(imagePlanSection);

  // Final instruction
  sections.push(headers.respondJson);

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
