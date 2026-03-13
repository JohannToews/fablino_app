/**
 * V3 Test Prompt — English-only, example-driven reading levels.
 *
 * Feature-flagged via app_settings.prompt_v3_test_users.
 * Replaces ONLY the user prompt; system prompt (coreV2.1) stays unchanged.
 */

// ── Structure instructions (English translations of story_paths.writing_instructions) ──

const structureInstructionsEN: Record<string, string> = {
  'A1': 'In Medias Res — start mid-action, no setup, the reader is thrown into the situation.',
  'A2': 'Riddle Hook — open with a mystery, an inexplicable discovery, or a burning question.',
  'A3': 'Character Moment — open with a scene that reveals who the protagonist is before the plot begins.',
  'A4': 'World Building — open by establishing the world, its rules, and atmosphere.',
  'A5': 'Dialogue Hook — open with a conversation that hints at the conflict.',
  'A6': 'Ordinary World — open with normal life, then disrupt it.',
  'M1': 'Escalation — each obstacle is bigger than the last, pressure builds steadily.',
  'M2': 'Riddle Layers — each answer reveals a new riddle; clues slowly come together.',
  'M3': 'Relationship Development — the conflict develops through changing relationships between characters.',
  'M4': 'Parallel Plotlines — two storylines develop simultaneously and converge.',
  'M5': 'Countdown — a ticking clock creates urgency; time is running out.',
  'M6': 'Twist Chain — a series of reversals where nothing is as it seems.',
  'E1': 'Classic — the problem is solved; the answer is surprising but logically derivable from the clues.',
  'E2': 'Twist — the resolution contains an unexpected reversal.',
  'E3': 'Open — not everything is resolved; the reader is left thinking.',
  'E4': 'Bittersweet — the goal is achieved but something is lost.',
  'E5': 'Return Changed — the protagonist returns to the starting point but has fundamentally changed.',
  'E6': 'Cliffhanger — ONLY for series episodes 1-4.',
};

// ── Example sentences per language & level ──

function getExampleSentence(language: string, level: number): string {
  const examples: Record<string, Record<number, string>> = {
    fr: {
      1: "Mateo a un chat. Le chat est gros. Il aime jouer.",
      2: "Mateo a regardé le vieux miroir. Il était bizarre. Quelque chose bougeait à l'intérieur. 'Tu as vu ça ?' a demandé Mateo. Mais personne n'a répondu.",
      3: "Mateo s'est approché du miroir avec précaution. La surface ondulait comme de l'eau, et il a cru apercevoir une silhouette de l'autre côté. Son cœur battait fort. 'Et si j'essayais de toucher ?' s'est-il demandé, même s'il savait que c'était probablement une mauvaise idée.",
    },
    de: {
      1: "Mateo hat eine Katze. Die Katze ist dick. Sie spielt gern.",
      2: "Mateo hat in den alten Spiegel geschaut. Er war seltsam. Etwas hat sich darin bewegt. 'Hast du das gesehen?' hat Mateo gefragt. Aber niemand hat geantwortet.",
      3: "Mateo näherte sich dem Spiegel vorsichtig. Die Oberfläche wellte sich wie Wasser, und er glaubte, eine Gestalt auf der anderen Seite zu erkennen. Sein Herz schlug schnell. 'Was, wenn ich es berühre?' fragte er sich, obwohl er wusste, dass das wahrscheinlich keine gute Idee war.",
    },
    en: {
      1: "Mateo has a cat. The cat is big. It likes to play.",
      2: "Mateo looked at the old mirror. It was strange. Something moved inside it. 'Did you see that?' Mateo asked. But nobody answered.",
      3: "Mateo approached the mirror carefully. The surface rippled like water, and he thought he saw a figure on the other side. His heart was beating fast. 'What if I try to touch it?' he wondered, even though he knew it was probably a bad idea.",
    },
    es: {
      1: "Mateo tiene un gato. El gato es gordo. Le gusta jugar.",
      2: "Mateo miró el viejo espejo. Era extraño. Algo se movía dentro. '¿Has visto eso?' preguntó Mateo. Pero nadie respondió.",
      3: "Mateo se acercó al espejo con cuidado. La superficie ondulaba como agua, y creyó ver una silueta al otro lado. Su corazón latía fuerte. '¿Y si intento tocarlo?' se preguntó, aunque sabía que probablemente era mala idea.",
    },
    it: {
      1: "Mateo ha un gatto. Il gatto è grosso. Gli piace giocare.",
      2: "Mateo ha guardato il vecchio specchio. Era strano. Qualcosa si muoveva dentro. 'Hai visto?' ha chiesto Mateo. Ma nessuno ha risposto.",
      3: "Mateo si è avvicinato allo specchio con cautela. La superficie ondeggiava come acqua, e gli è parso di vedere una figura dall'altra parte. Il suo cuore batteva forte. 'E se provassi a toccarlo?' si è chiesto, anche se sapeva che probabilmente non era una buona idea.",
    },
    nl: {
      1: "Mateo heeft een kat. De kat is dik. Hij speelt graag.",
      2: "Mateo keek naar de oude spiegel. Hij was vreemd. Er bewoog iets in. 'Heb je dat gezien?' vroeg Mateo. Maar niemand antwoordde.",
      3: "Mateo liep voorzichtig naar de spiegel. Het oppervlak golfde als water, en hij dacht dat hij een gestalte aan de andere kant zag. Zijn hart klopte snel. 'Wat als ik het aanraak?' vroeg hij zich af, ook al wist hij dat het waarschijnlijk geen goed idee was.",
    },
    bs: {
      1: "Mateo ima mačku. Mačka je debela. Voli da se igra.",
      2: "Mateo je pogledao u staro ogledalo. Bilo je čudno. Nešto se pomicalo unutra. 'Jesi li vidio to?' pitao je Mateo. Ali niko nije odgovorio.",
      3: "Mateo se oprezno približio ogledalu. Površina se talasala poput vode, i učinilo mu se da vidi obris na drugoj strani. Srce mu je snažno kucalo. 'Šta ako pokušam dodirnuti?' zapitao se, iako je znao da to vjerovatno nije dobra ideja.",
    },
  };

  return examples[language]?.[level] ?? examples['en']?.[level] ?? examples['en']?.[2] ?? '';
}

// ── Language name mapping ──

const LANG_NAMES_EN: Record<string, string> = {
  de: 'German', fr: 'French', en: 'English', es: 'Spanish',
  it: 'Italian', nl: 'Dutch', bs: 'Bosnian', fa: 'Farsi',
  uk: 'Ukrainian', ru: 'Russian', pt: 'Portuguese', pl: 'Polish',
  tr: 'Turkish', ro: 'Romanian', ca: 'Catalan', sl: 'Slovenian',
  lt: 'Lithuanian', hu: 'Hungarian', bg: 'Bulgarian', sk: 'Slovak',
};

// ── Main V3 prompt builder ──

export interface V3PromptParams {
  structureCode: string;
  structureA: string;
  structureM: string;
  structureE: string;
  childName: string;
  childAge: number;
  childAppearance: string;
  userStoryDescription: string;
  targetLanguageCode: string;
  textLevel: number;
  perspective: string;
  maxSentenceLength: number;
  allowedTenses: string;
  paragraphCount: number;
  wordMin: number;
  wordMax: number;
  dialogueMin: number;
  dialogueMax: number;
  questionCount: number;
  subtypeLabel: string;
  subtypePromptHint: string;
  subtypeSettingIdea: string;
  subtypeTitleSeed: string;
  categoryName: string;
  categoryPlots: string;
  categoryConflicts: string;
  categoryArchetypes: string;
  categorySensory: string;
  categorySettings: string;
  characters: string;
  villainName: string | null;
  maxCharacters: number;
  maxTwists: number;
  safetyLevel: number;
  safetyAllowed: string;
  safetyForbidden: string;
  recentEmotion: string;
  recentThemes: string;
  recentTitles: string;
}

export function getV3TestPrompt(params: V3PromptParams): string {
  const targetLanguage = LANG_NAMES_EN[params.targetLanguageCode] || params.targetLanguageCode;

  // Build structure instructions from EN mapping
  const structureInstructions = [
    structureInstructionsEN[params.structureA],
    structureInstructionsEN[params.structureM],
    structureInstructionsEN[params.structureE],
  ].filter(Boolean).join('\n');

  const exampleSentence = getExampleSentence(params.targetLanguageCode, params.textLevel);

  const villainBlock = params.villainName ? `

## VILLAIN RULES

${params.villainName} MUST be a genuine obstacle: clear opposing goals, concrete actions against the protagonist, credible threat for at least the first two-thirds. A change of heart MAY happen only at the end, after real conflict. Do NOT sanitize into a "misunderstood friend." Age-appropriate villain behavior: tricking, blocking, competing unfairly, hoarding, breaking promises.` : '';

  return `Write a story following these instructions.

## STORY STRUCTURE (mandatory)

Structure: ${params.structureCode}
${structureInstructions}

Follow this structure exactly. The story will be rejected if it deviates.

## CHILD

Name: ${params.childName}, Age: ${params.childAge}
${params.childAppearance ? `Appearance: ${params.childAppearance}` : ''}

## PRIMARY DIRECTIVE (highest priority)

The child described this story: "${params.userStoryDescription}"

This is the CENTRAL plot. The world, conflict, and action MUST be built around this description. The category below serves only as atmospheric BACKDROP — not as an alternative setting or plot. If the description mentions a place, activity, or scenario, the story takes place THERE and is about THAT.

## LANGUAGE LEVEL

Target language: ${targetLanguage}
Reading level: ${params.textLevel}/3
Perspective: ${params.perspective}

**This is how the target reading level sounds — match this style:**
"${exampleSentence}"

Constraints:
- Maximum sentence length: ${params.maxSentenceLength} words
- Allowed tenses: ${params.allowedTenses}
- No other tenses. If in doubt, use a simpler tense.
- Vocabulary: age-appropriate for a ${params.childAge}-year-old. No words beyond this scope.
- Maximum 2 adjectives per sentence
- Dialogue must advance the story

## TEXT LENGTH

Paragraphs: ${params.paragraphCount}
Word count: ${params.wordMin}–${params.wordMax} words (strict range)
Dialogue ratio: ${params.dialogueMin}–${params.dialogueMax}%
Comprehension questions: ${params.questionCount}

## STORY SUBTYPE

Type: ${params.subtypeLabel}
Direction: ${params.subtypePromptHint}
Setting inspiration: ${params.subtypeSettingIdea}
Title inspiration: ${params.subtypeTitleSeed}

Follow the story type. Do NOT write a generic adventure.
NOTE: The subtype is mood inspiration only. The PRIMARY DIRECTIVE above has absolute priority for plot, setting, and world.

## CATEGORY (backdrop only)

${params.categoryName}
Plots: ${params.categoryPlots}
Conflicts: ${params.categoryConflicts}
Archetypes: ${params.categoryArchetypes}
Sensory: ${params.categorySensory}
Settings: ${params.categorySettings}

Pick a concrete theme from this category yourself. This category is ONLY atmospheric inspiration. Plot, setting, and world are determined by the PRIMARY DIRECTIVE above.

## CHARACTERS

Protagonist: ${params.childName}, ${params.childAge}
${params.characters}

ALL listed characters MUST appear actively. Do NOT invent new named characters. Anonymous extras (a shopkeeper, passersby) are allowed.${villainBlock}

## HARD CONSTRAINTS

Characters:
- Maximum ${params.maxCharacters} characters total (protagonist + supporting)
- Every character introduced in the first 2 paragraphs
- No new characters after the introduction scene

Plot:
- Simple plot, maximum ${params.maxTwists} twist(s)
- Each paragraph does ONE thing: introduce, build tension, OR resolve
- Never a new character AND a new problem in the same paragraph

Forbidden:
- More than ${params.maxCharacters} characters
- New characters after introduction
- Multiple quests or cascading obstacles
- Adjective stacking
- Rushed resolution

## CONTENT SAFETY (Level ${params.safetyLevel}/4)

Allowed: ${params.safetyAllowed}
Forbidden: ${params.safetyForbidden}

## FRESHNESS

Recent dominant emotion: ${params.recentEmotion} → choose a different primary emotion.
Recent themes: ${params.recentThemes} → choose a different concrete theme.
Recent titles: ${params.recentTitles} → do NOT reuse similar titles.

Rules:
- No overused names: Leo, Mia, Finn, Max, Luna, Felix, Lina, Emma, Luca, Sophie
- No overused objects: glowing crystals, magic wands, enchanted maps, ancient scrolls, magical amulets
- No overused settings: enchanted forest, magic castle, mysterious cave, dark dungeon
- Character names MUST reflect cultural diversity
- Objects must be specific and unusual
- Settings must be concrete and atmospheric

## JSON OUTPUT FORMAT

Respond with ONLY a valid JSON object (no text before or after):

{
  "title": "string (in ${targetLanguage})",
  "content": "string (full story in ${targetLanguage}, use \\\\n for paragraphs)",
  "structure_beginning": "${params.structureA}",
  "structure_middle": "${params.structureM}",
  "structure_ending": "${params.structureE}",
  "emotional_coloring": "EM-X (Name)",
  "emotional_secondary": "EM-X (Name)",
  "humor_level": "1-5",
  "emotional_depth": "1-3",
  "moral_topic": "theme or null",
  "concrete_theme": "concrete theme within category",
  "summary": "2-3 sentences in ${targetLanguage}",
  "learning_theme_response": null,
  "questions": [
    {
      "question": "question in ${targetLanguage}",
      "correctAnswer": "the correct answer",
      "options": ["correct answer", "wrong 1", "wrong 2", "wrong 3"]
    }
  ],
  "vocabulary": [
    {
      "word": "word from the text (verbs: infinitive)",
      "explanation": "child-friendly explanation in ${targetLanguage} (max 15 words)"
    }
  ]
}

Do NOT include an image_plan field.

CRITICAL: ${params.wordMin}–${params.wordMax} words. ${params.paragraphCount} paragraphs. Respond ONLY with the JSON.`;
}
