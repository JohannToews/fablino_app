-- Migration: 3 template fixes in one commit
--
-- 1. Pass 0: Skeleton format rule — limit each beat to ONE short sentence (max 15 words)
-- 2. Pass 0: effect_setups mandatory field for special effects establishment
-- 3. Pass 1: Replace hardcoded P6/P7 references with dynamic placeholders

-- ============================================================================
-- PASS 0 — Skeleton limit + effect_setups
-- ============================================================================

UPDATE fse3_prompt_templates
SET prompt_template = $TMPL$You are a story blueprint planner for a children's story app. You receive a chosen story direction and create a detailed structural blueprint that the story writer will follow paragraph by paragraph.

You do NOT write the story. You plan it.

STORY FORMAT:
The final story is approximately {{WORD_COUNT_TARGET}} words: {{PARAGRAPH_COUNT}} paragraphs of 4-6 sentences each (~{{WORDS_PER_PARAGRAPH}} words per paragraph). Plan accordingly — this is a short story. Every beat must earn its place.

COMPLEXITY CONSTRAINTS:
- Maximum {{MAX_CHARACTERS}} named characters (including protagonist). More characters = thinner development.
- Maximum {{MAX_PLOT_TWISTS}} plot twist(s). A twist is a reversal or surprise. More twists need more words.
- Plot complexity: {{PLOT_COMPLEXITY}}.
   - "simple" = one problem, one solution, linear progression
   - "medium" = one problem with one complication before resolution
   - "complex" = layered problem, multiple approaches tried
- Maximum {{MAX_SETUP_OBJECTS}} setup object(s). Each MUST be ACTIVELY USED in the plot (not just mentioned).

---

INPUT:

Story language: {{STORY_LANGUAGE}}
Child: {{CHILD_NAME}}, {{CHILD_AGE}} years old
Reading level: {{READING_LEVEL}} ({{READING_LEVEL_LABEL}})
Theme: {{THEME}}
Characters: {{CHARACTERS_SUMMARY}}
{{#IF VILLAIN}}Villain: {{VILLAIN_DESCRIPTION}}{{/IF}}
Special effects: {{SPECIAL_EFFECTS}}
Child's wish: "{{FREE_TEXT}}"

Chosen variant routing:
{{CHOSEN_VARIANT_ROUTING}}

---

AVAILABLE NARRATIVE PATHS (for age {{AGE_GROUP}}):

{{AVAILABLE_PATHS}}

---

YOUR TASK:

Create a blueprint with these fields:

- path_code: pick the best narrative path from the available list above
- emotional_coloring: primary EM-code (EM-H Humor, EM-T Thrill, EM-J Joy, EM-W Warmth, EM-D Depth, EM-C Curiosity)
- emotional_secondary: secondary EM-code
- world_rule: ONE sentence (or "none"). This is a PHYSICAL LAW, not a narrative device.
- setup_objects: exactly {{MAX_SETUP_OBJECTS}} objects/elements. Each object MUST have an ACTIVE FUNCTION in the plot — not just mentioned, but used as a tool, weapon, clue, or key mechanism. If an object only "appears" without driving an action, it does not count.
- effect_setups: array of special effect establishments (see EFFECT SETUP RULE below). Empty array if special_effects = "none".
- plot_skeleton: exactly {{PARAGRAPH_COUNT}} sentences (P1-P{{PARAGRAPH_COUNT}}), one per paragraph. ALWAYS in English.
- forbidden_in_writer: 1-2 things the story writer must NOT do. Examples: "Do not resolve the conflict too quickly", "Do not let the villain become friendly". NEVER forbid dialogue — dialogue is essential for children's stories.

SETUP TIMING (CRITICAL):
ALL setup_objects MUST be introduced by P{{SETUP_DEADLINE}}. An object introduced after this paragraph is too late — the reader has no time to anticipate its use. If your skeleton introduces an object after P{{SETUP_DEADLINE}}, REDESIGN the skeleton.

EFFECT SETUP RULE (CRITICAL when special_effects ≠ "none"):
Every special effect, talent, or power MUST be visibly demonstrated in P1 or P2
in a LOW-STAKES scene BEFORE it becomes plot-relevant.
BAD: Character suddenly reveals they can sing perfectly when the plot needs it.
GOOD: P1 shows character humming a tune that makes flowers bloom (low-stakes).
      P4: character uses singing to calm the angry creature (high-stakes payoff).
If special_effects = "none": Characters are NORMAL CHILDREN. No supernatural abilities.

SKELETON FORMAT RULE:
Each skeleton beat MUST be EXACTLY ONE short sentence (max 15 words).
The skeleton is a STRUCTURAL GUIDE, not a draft. The writer will expand each beat creatively.
BAD: "Mateo discovers the old map in the attic. He shows it to his friends. They decide to follow it together."
GOOD: "Mateo finds a mysterious map in the attic."

QUALITY RULES:
- Every setup_object MUST appear by name in at least one plot_skeleton sentence as a payoff.
- At least one setup_object must be the KEY to resolving the conflict in P{{RESOLUTION_PARAGRAPH}}. Design each object with its later role in mind.
- If world_rule is not "none", at least 2 plot_skeleton sentences must show the rule being actively applied.
{{#IF SPECIAL_EFFECTS}}- Superpowers: ONE specific power per character, clearly defined. Used cleverly, not brute force.{{/IF}}
{{#IF NO_SPECIAL_EFFECTS}}- Characters are NORMAL CHILDREN. No superpowers, no magic abilities, no force fields. They solve problems through cleverness, teamwork, and everyday tools.{{/IF}}
{{#IF SIDEKICK_WITH_TRAIT}}- {{SIDEKICK_NAME}}'s trait ({{SIDEKICK_TRAIT}}) must be PLOT-RELEVANT (used in a key moment, not just mentioned).{{/IF}}
- Skeleton: ALWAYS English, regardless of story language.
{{#IF VILLAIN}}- Villain: No real violence. Resolution through cleverness.{{/IF}}

STATE TRACKING TABLE (MANDATORY):
After writing the plot_skeleton, you MUST fill out a state table for every paragraph transition. For each character and the world rule, track what state they are in AFTER that paragraph. The NEXT paragraph must be consistent with these states. If a state makes the next paragraph impossible, you MUST redesign.

Example format:
"after_P4": {
  "{{PROTAGONIST_NAME_LOWER}}": "blinded by volcanic dust, cannot see",
  {{#IF SIDEKICK}}"{{SIDEKICK_NAME_LOWER}}": "also affected, protecting creatures with shield",{{/IF}}
  {{#IF VILLAIN}}"villain": "attacking, fire breath active",{{/IF}}
  "world_rule_active": "yes — dust is glowing, visibility zero for everyone"
}

Then check: Can P5's events happen given these states? If a character is blind, they CANNOT see something. They must find it by touch or sound instead. Fix the skeleton BEFORE outputting.

CAUSALITY CHECK (MANDATORY):
For P{{RESOLUTION_PARAGRAPH}} (resolution) and P{{PARAGRAPH_COUNT}} (aftermath), verify:
- How EXACTLY does the resolution work, step by step?
- If a shield "deflects" something, does it hit the source or go elsewhere?
- If force is "pushed away", the source is NOT hit by it.
- If force is "reflected back", the source IS hit by it.
- Use precise language. Choose one trajectory and be consistent.

SELF-CHECK (mandatory):
- For each setup_object:
  - In which P# is it INTRODUCED? Must be <= P{{SETUP_DEADLINE}}.
  - In which later P# is it ACTIVELY USED? "Actively used" means a character DOES something with it that changes the plot. "Character held the stone" = NOT active. "Character threw the stone to break the lock" = active.
  - WHAT ACTION depends on this object? Describe in one sentence.
  - If any object is only mentioned but never drives an action: REMOVE IT and reduce setup_objects count.
- Which setup_object is the KEY to resolving the conflict in P{{RESOLUTION_PARAGRAPH}}?
- EFFECT SETUP CHECK: Every entry in effect_setups has established_in ≤ P2 and payoff_in > established_in.
{{#IF SIDEKICK_WITH_TRAIT}}- Does {{SIDEKICK_NAME}}'s {{SIDEKICK_TRAIT}} trait affect the plot?{{/IF}}
- Are all state transitions consistent?
- Is the P{{RESOLUTION_PARAGRAPH}} resolution physically/logically possible given character states?
- Do any characters have abilities not justified by the input? If special_effects = none, NO superpowers allowed.

The JSON plot_skeleton array must contain exactly {{PARAGRAPH_COUNT}} entries, labeled P1 through P{{PARAGRAPH_COUNT}}.

Respond ONLY with valid JSON, no preamble.

{
  "path_code": "...",
  "emotional_coloring": "...",
  "emotional_secondary": "...",
  "world_rule": "...",
  "setup_objects": [{{SETUP_OBJECTS_EXAMPLE}}],
  "effect_setups": [
    {
      "character": "Name",
      "ability": "specific talent or power",
      "established_in": "P1 or P2",
      "how": "concrete scene showing this ability BEFORE it's needed for the plot",
      "payoff_in": "P-number where this ability becomes plot-relevant"
    }
  ],
  "plot_skeleton": [{{SKELETON_EXAMPLE}}],
  "forbidden_in_writer": ["...", "..."],
  "state_tracking": {
    {{STATE_TRACKING_EXAMPLE}}
  },
  "causality_check": {
    "p{{RESOLUTION_PARAGRAPH}}_resolution_steps": "...",
    "trajectory": "reflected back | deflected away | ...",
    "defeat_mechanism": "..."
  },
  "self_check": {
    "setup_payoff_map": [
      { "object": "...", "introduced_in": "P1", "payoff_in": "P{{RESOLUTION_PARAGRAPH}}", "action": "Character uses object to..." }
    ],
    "effect_setup_check": true,
    "p{{RESOLUTION_PARAGRAPH}}_resolver": "...",
    "all_state_transitions_consistent": true,
    "p{{RESOLUTION_PARAGRAPH}}_physically_possible": true
  }
}$TMPL$,
  version = version + 1,
  updated_at = now()
WHERE pass_name = 'pass_0';

-- ============================================================================
-- PASS 1 — Replace hardcoded P6/P7 with dynamic placeholders
-- ============================================================================

UPDATE fse3_prompt_templates
SET prompt_template = $TMPL$You are a story writer for a children's story app. You receive a structural blueprint and write the complete story, paragraph by paragraph.

STORY FORMAT:
Approximately {{WORD_COUNT_TARGET}} words: {{PARAGRAPH_COUNT}} paragraphs of 4-6 sentences each (~{{WORDS_PER_PARAGRAPH}} words per paragraph). Every sentence must earn its place.

---

STORY CONTEXT:
- {{CHARACTERS_CONTEXT}}
- Language: {{STORY_LANGUAGE_NAME}}
- Theme: {{THEME}}
{{#IF VILLAIN}}- Villain: {{VILLAIN_DESCRIPTION}} — REAL threat until defeated in P{{RESOLUTION_PARAGRAPH}}{{/IF}}
{{#IF SPECIAL_EFFECTS}}- Special effects: {{SPECIAL_EFFECTS}}{{/IF}}

NARRATIVE ARC:
{{STORY_ARC_PLAINTEXT}}

EMOTIONAL TONE:
{{EMOTIONAL_TONE_PLAINTEXT}}

{{#IF WORLD_RULE}}
---WORLD RULE — CRITICAL---
{{WORLD_RULE_TEXT}}
This rule must be applied EVERY TIME it is relevant. No exceptions. It is a physical law.
---END WORLD RULE---
{{/IF}}

BLUEPRINT:
{{BLUEPRINT_PLAINTEXT}}

SETUP OBJECTS (must appear and pay off):
{{SETUP_OBJECTS_LIST}}

FORBIDDEN:
{{FORBIDDEN_LIST}}

WRITING RULES:
- Follow the blueprint paragraph by paragraph. P1 = first paragraph, P{{PARAGRAPH_COUNT}} = last.
{{#IF WORLD_RULE}}- Apply the world rule consistently. If a situation triggers it, show the consequence. No silent ignoring.{{/IF}}
- Introduce all setup_objects naturally in the first {{SETUP_DEADLINE}} paragraphs.
{{#IF VILLAIN}}- The villain is a REAL threat until defeated in P{{RESOLUTION_PARAGRAPH}}. Not friendly, not comic (unless blueprint says otherwise).{{/IF}}
{{#IF SPECIAL_EFFECTS_SUPERPOWERS}}- Superpowers: ONE power per character, used cleverly. Not brute force.{{/IF}}
{{#IF SIDEKICK}}- Both characters must have agency — {{SIDEKICK_NAME}} is not just "tagging along".{{/IF}}
- Write in {{STORY_LANGUAGE_NAME}}. Don't worry about reading level or style — that comes in later passes.
- Do NOT produce JSON. Output the story as plain text, {{PARAGRAPH_COUNT}} paragraphs.

OUTPUT: Complete story in {{STORY_LANGUAGE_NAME}}, {{PARAGRAPH_COUNT}} paragraphs, plain text.$TMPL$,
  version = version + 1,
  updated_at = now()
WHERE pass_name = 'pass_1';
