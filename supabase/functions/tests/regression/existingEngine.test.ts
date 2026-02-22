/**
 * REGRESSION TESTS — Existing Story Engine
 *
 * These tests ensure the EXISTING story generation pipeline remains
 * 100% functional as we build the new Emotion-Flow-Engine alongside it.
 *
 * HOLY TESTS: These must NEVER be deleted or weakened in any later phase.
 * They must be GREEN before and after EVERY change.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Resolve workspace root by walking up from this test file
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const SUPABASE_DIR = path.join(WORKSPACE_ROOT, 'supabase');
const SUPABASE_FUNCTIONS = path.join(SUPABASE_DIR, 'functions');
const SHARED_DIR = path.join(SUPABASE_FUNCTIONS, '_shared');
const GENERATE_STORY = path.join(SUPABASE_FUNCTIONS, 'generate-story', 'index.ts');
const PROMPT_BUILDER = path.join(SHARED_DIR, 'promptBuilder.ts');
const IMAGE_PROMPT_BUILDER = path.join(SHARED_DIR, 'imagePromptBuilder.ts');
const LEARNING_THEME_ROTATION = path.join(SHARED_DIR, 'learningThemeRotation.ts');
const SUBTYPE_SELECTOR = path.join(SHARED_DIR, 'storySubtypeSelector.ts');
const MIGRATIONS_DIR = path.join(SUPABASE_DIR, 'migrations');
const EMOTION_FLOW_DIR = path.join(SHARED_DIR, 'emotionFlow');

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function getExistingPipelineFiles(): string[] {
  return [
    GENERATE_STORY,
    PROMPT_BUILDER,
    IMAGE_PROMPT_BUILDER,
    LEARNING_THEME_ROTATION,
    SUBTYPE_SELECTOR,
  ];
}

// ─── Test Suite 1: Existing pipeline has ZERO imports from emotionFlow ───

describe('Existing engine ignores new Emotion-Flow tables and code', () => {
  const IMPORT_PATTERNS = [
    /from\s+['"].*emotionFlow/,
    /from\s+['"].*emotion_flow/,
    /import.*emotionFlow/,
    /import.*emotion_flow/,
  ];

  for (const filePath of getExistingPipelineFiles()) {
    const fileName = path.relative(SUPABASE_FUNCTIONS, filePath);

    it(`${fileName} does NOT import from emotionFlow/`, () => {
      const content = readFile(filePath);
      for (const pattern of IMPORT_PATTERNS) {
        expect(content).not.toMatch(pattern);
      }
    });

    it(`${fileName} does NOT read from emotion_blueprints table`, () => {
      const content = readFile(filePath);
      expect(content).not.toMatch(/\.from\(\s*['"]emotion_blueprints['"]\s*\)/);
    });

    it(`${fileName} does NOT read from character_seeds table`, () => {
      const content = readFile(filePath);
      expect(content).not.toMatch(/\.from\(\s*['"]character_seeds['"]\s*\)/);
    });

    it(`${fileName} does NOT read from story_elements table`, () => {
      const content = readFile(filePath);
      expect(content).not.toMatch(/\.from\(\s*['"]story_elements['"]\s*\)/);
    });
  }
});

// ─── Test Suite 2: promptBuilder.ts structure is intact ───

describe('promptBuilder.ts structure is intact', () => {
  let content: string;

  beforeAll(() => {
    content = readFile(PROMPT_BUILDER);
  });

  it('exports StoryRequest interface', () => {
    expect(content).toMatch(/export\s+interface\s+StoryRequest/);
  });

  it('exports buildStoryPrompt function', () => {
    expect(content).toMatch(/export\s+async\s+function\s+buildStoryPrompt/);
  });

  it('exports injectLearningTheme function', () => {
    expect(content).toMatch(/export\s+function\s+injectLearningTheme/);
  });

  it('exports PromptBuildResult interface', () => {
    expect(content).toMatch(/export\s+interface\s+PromptBuildResult/);
  });

  it('buildStoryPrompt returns PromptBuildResult (not raw string)', () => {
    expect(content).toMatch(/Promise<PromptBuildResult>/);
  });

  it('reads from theme_rules table', () => {
    expect(content).toMatch(/\.from\(\s*['"]theme_rules['"]\s*\)/);
  });

  it('reads from age_rules table', () => {
    expect(content).toMatch(/\.from\(\s*['"]age_rules['"]\s*\)/);
  });

  it('reads from difficulty_rules table', () => {
    expect(content).toMatch(/\.from\(\s*['"]difficulty_rules['"]\s*\)/);
  });

  it('reads from stories table for variety block', () => {
    expect(content).toMatch(/\.from\(\s*['"]stories['"]\s*\)/);
  });

  it('contains SPECIAL_ABILITIES_DESC for prompt enrichment', () => {
    expect(content).toMatch(/SPECIAL_ABILITIES_DESC/);
  });

  it('contains buildVarietyBlock function', () => {
    expect(content).toMatch(/function\s+buildVarietyBlock/);
  });
});

// ─── Test Suite 3: generate-story/index.ts structure is intact ───

describe('generate-story/index.ts structure is intact', () => {
  let content: string;

  beforeAll(() => {
    content = readFile(GENERATE_STORY);
  });

  it('imports buildStoryPrompt from promptBuilder', () => {
    expect(content).toMatch(/import.*buildStoryPrompt.*from.*promptBuilder/);
  });

  it('imports injectLearningTheme from promptBuilder', () => {
    expect(content).toMatch(/import.*injectLearningTheme.*from.*promptBuilder/);
  });

  it('imports shouldApplyLearningTheme from learningThemeRotation', () => {
    expect(content).toMatch(/import.*shouldApplyLearningTheme.*from.*learningThemeRotation/);
  });

  it('imports selectStorySubtype from storySubtypeSelector', () => {
    expect(content).toMatch(/import.*selectStorySubtype.*from.*storySubtypeSelector/);
  });

  it('calls buildStoryPrompt()', () => {
    expect(content).toMatch(/buildStoryPrompt\s*\(/);
  });

  it('constructs StoryRequest object', () => {
    expect(content).toMatch(/const\s+storyRequest/);
  });

  it('calls selectStorySubtype for subtype round-robin', () => {
    expect(content).toMatch(/selectStorySubtype\s*\(/);
  });

  it('has themeKeyMapping for storyType resolution', () => {
    expect(content).toMatch(/themeKeyMapping/);
  });

  it('saves stories to database', () => {
    expect(content).toMatch(/\.from\(\s*['"]stories['"]\s*\)/);
    expect(content).toMatch(/\.insert\s*\(/);
  });

  it('handles comprehension questions in LLM response', () => {
    expect(content).toMatch(/questions/);
  });
});

// ─── Test Suite 4: Feature flag default is OFF ───

describe('Feature flag defaults to OFF (no new code executes)', () => {
  it('migration file exists for emotion_flow_enabled_users', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const flagMigration = files.find(f => f.includes('emotion_flow_feature_flag'));
    expect(flagMigration).toBeDefined();
  });

  it('migration inserts empty array as default', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const flagFile = files.find(f => f.includes('emotion_flow_feature_flag'))!;
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, flagFile), 'utf-8');
    expect(content).toMatch(/emotion_flow_enabled_users/);
    expect(content).toMatch(/'\[\]'/);
  });

  it('featureFlag.ts checks for wildcard and specific userId', () => {
    const flagPath = path.join(EMOTION_FLOW_DIR, 'featureFlag.ts');
    const flagContent = readFile(flagPath);
    expect(flagContent).toMatch(/enabledUsers\.includes\('\*'\)/);
    expect(flagContent).toMatch(/enabledUsers\.includes\(userId\)/);
  });

  it('featureFlag.ts defaults to false on error', () => {
    const flagPath = path.join(EMOTION_FLOW_DIR, 'featureFlag.ts');
    const flagContent = readFile(flagPath);
    expect(flagContent).toMatch(/enabled:\s*false/);
  });

  it('generate-story does NOT import from emotionFlow/ yet', () => {
    const content = readFile(GENERATE_STORY);
    expect(content).not.toMatch(/from\s+['"].*emotionFlow/);
    expect(content).not.toMatch(/isEmotionFlowEnabled/);
    expect(content).not.toMatch(/runEmotionFlowEngine/);
  });
});

// ─── Test Suite 5: New nullable columns won't break existing queries ───

describe('New emotion_flow columns on stories table are safely nullable', () => {
  it('generate-story does NOT set emotion_blueprint_key in story insert', () => {
    const content = readFile(GENERATE_STORY);
    expect(content).not.toMatch(/emotion_blueprint_key\s*:/);
  });

  it('generate-story does NOT set tone_mode in story insert', () => {
    const content = readFile(GENERATE_STORY);
    // Check specifically for tone_mode as a property in an insert
    const insertBlocks = content.match(/\.insert\s*\(\s*\[?\s*\{[\s\S]*?\}\s*\]?\s*\)/g) || [];
    for (const block of insertBlocks) {
      expect(block).not.toMatch(/tone_mode\s*:/);
    }
  });

  it('generate-story does NOT set intensity_level in story insert', () => {
    const content = readFile(GENERATE_STORY);
    expect(content).not.toMatch(/intensity_level\s*:/);
  });

  it('generate-story does NOT set character_seed_key in story insert', () => {
    const content = readFile(GENERATE_STORY);
    expect(content).not.toMatch(/character_seed_key\s*:/);
  });
});

// ─── Test Suite 6: emotionFlow module structure exists but is isolated ───

describe('emotionFlow module exists but is completely isolated', () => {
  it('emotionFlow directory exists', () => {
    expect(fs.existsSync(EMOTION_FLOW_DIR)).toBe(true);
  });

  it('featureFlag.ts exists', () => {
    expect(fs.existsSync(path.join(EMOTION_FLOW_DIR, 'featureFlag.ts'))).toBe(true);
  });

  it('types.ts exists', () => {
    expect(fs.existsSync(path.join(EMOTION_FLOW_DIR, 'types.ts'))).toBe(true);
  });

  it('no existing pipeline file references the emotionFlow directory', () => {
    for (const filePath of getExistingPipelineFiles()) {
      const content = readFile(filePath);
      expect(content).not.toContain('emotionFlow');
    }
  });
});

// ─── Test Suite 7: Core tables migration exists and is correct ───

describe('Core tables migration (Task 2.1) is correct', () => {
  let migrationContent: string;

  beforeAll(() => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const coreTablesMigration = files.find(f => f.includes('emotion_flow_core_tables'));
    expect(coreTablesMigration).toBeDefined();
    migrationContent = fs.readFileSync(path.join(MIGRATIONS_DIR, coreTablesMigration!), 'utf-8');
  });

  it('creates emotion_blueprints table', () => {
    expect(migrationContent).toMatch(/CREATE TABLE.*emotion_blueprints/);
  });

  it('creates character_seeds table', () => {
    expect(migrationContent).toMatch(/CREATE TABLE.*character_seeds/);
  });

  it('creates story_elements table', () => {
    expect(migrationContent).toMatch(/CREATE TABLE.*story_elements/);
  });

  it('emotion_blueprints has blueprint_key UNIQUE NOT NULL', () => {
    expect(migrationContent).toMatch(/blueprint_key\s+TEXT\s+UNIQUE\s+NOT\s+NULL/);
  });

  it('emotion_blueprints has category CHECK constraint', () => {
    expect(migrationContent).toMatch(/category.*CHECK.*growth.*social.*courage.*empathy.*humor.*wonder/s);
  });

  it('emotion_blueprints has min_intensity CHECK constraint', () => {
    expect(migrationContent).toMatch(/min_intensity.*CHECK.*light.*medium.*deep/s);
  });

  it('character_seeds has creature_type with human/mythical CHECK', () => {
    expect(migrationContent).toMatch(/creature_type.*CHECK.*human.*mythical/s);
  });

  it('character_seeds has seed_type CHECK constraint', () => {
    expect(migrationContent).toMatch(/seed_type.*CHECK.*protagonist_appearance.*sidekick_archetype.*antagonist_archetype/s);
  });

  it('character_seeds has gender CHECK constraint', () => {
    expect(migrationContent).toMatch(/gender.*CHECK.*female.*male.*neutral/s);
  });

  it('story_elements has element_type CHECK with all 7 types', () => {
    expect(migrationContent).toMatch(/opening_style/);
    expect(migrationContent).toMatch(/narrative_perspective/);
    expect(migrationContent).toMatch(/macguffin/);
    expect(migrationContent).toMatch(/setting_detail/);
    expect(migrationContent).toMatch(/humor_technique/);
    expect(migrationContent).toMatch(/tension_technique/);
    expect(migrationContent).toMatch(/closing_style/);
  });

  it('creates updated_at triggers for blueprints and seeds', () => {
    expect(migrationContent).toMatch(/TRIGGER.*set_updated_at_emotion_blueprints/);
    expect(migrationContent).toMatch(/TRIGGER.*set_updated_at_character_seeds/);
  });

  it('enables RLS on all three tables', () => {
    expect(migrationContent).toMatch(/ENABLE ROW LEVEL SECURITY/);
  });

  it('does NOT alter existing tables', () => {
    expect(migrationContent).not.toMatch(/ALTER TABLE stories/);
    expect(migrationContent).not.toMatch(/ALTER TABLE kid_profiles/);
    expect(migrationContent).not.toMatch(/ALTER TABLE user_profiles/);
  });
});

// ─── Test Suite 8: History tables migration (Task 2.2) ───

describe('History tables migration (Task 2.2) is correct', () => {
  let migrationContent: string;

  beforeAll(() => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const historyMigration = files.find(f => f.includes('emotion_flow_history_tables'));
    expect(historyMigration).toBeDefined();
    migrationContent = fs.readFileSync(path.join(MIGRATIONS_DIR, historyMigration!), 'utf-8');
  });

  it('creates emotion_blueprint_history table', () => {
    expect(migrationContent).toMatch(/CREATE TABLE.*emotion_blueprint_history/);
  });

  it('creates character_seed_history table', () => {
    expect(migrationContent).toMatch(/CREATE TABLE.*character_seed_history/);
  });

  it('creates story_element_usage table', () => {
    expect(migrationContent).toMatch(/CREATE TABLE.*story_element_usage/);
  });

  it('emotion_blueprint_history has FK to kid_profiles', () => {
    expect(migrationContent).toMatch(/emotion_blueprint_history[\s\S]*?kid_profile_id.*REFERENCES\s+kid_profiles/);
  });

  it('emotion_blueprint_history has FK to stories', () => {
    expect(migrationContent).toMatch(/emotion_blueprint_history[\s\S]*?story_id.*REFERENCES\s+stories/);
  });

  it('emotion_blueprint_history has tone_mode and intensity_level columns', () => {
    expect(migrationContent).toMatch(/tone_mode\s+TEXT/);
    expect(migrationContent).toMatch(/intensity_level\s+TEXT/);
  });

  it('character_seed_history has seed_type CHECK constraint', () => {
    expect(migrationContent).toMatch(/character_seed_history[\s\S]*?seed_type.*CHECK.*protagonist_appearance.*sidekick_archetype.*antagonist_archetype/s);
  });

  it('story_element_usage has element_type CHECK with all 7 types', () => {
    expect(migrationContent).toMatch(/story_element_usage[\s\S]*?element_type.*CHECK/s);
    expect(migrationContent).toMatch(/opening_style/);
    expect(migrationContent).toMatch(/closing_style/);
    expect(migrationContent).toMatch(/macguffin/);
  });

  it('has performance index on blueprint_history (kid_profile_id, created_at DESC)', () => {
    expect(migrationContent).toMatch(/CREATE INDEX.*blueprint_history.*kid_profile_id.*created_at/s);
  });

  it('has performance index on seed_history (kid_profile_id, seed_type, created_at DESC)', () => {
    expect(migrationContent).toMatch(/CREATE INDEX.*seed_history.*kid_profile_id.*seed_type.*created_at/s);
  });

  it('has performance index on element_usage (kid_profile_id, element_type, created_at DESC)', () => {
    expect(migrationContent).toMatch(/CREATE INDEX.*element_usage.*kid_profile_id.*element_type.*created_at/s);
  });

  it('enables RLS on all three history tables', () => {
    const rlsMatches = migrationContent.match(/ENABLE ROW LEVEL SECURITY/g) || [];
    expect(rlsMatches.length).toBe(3);
  });

  it('does NOT alter existing tables (only FKs are declarative)', () => {
    expect(migrationContent).not.toMatch(/ALTER TABLE stories/);
    expect(migrationContent).not.toMatch(/ALTER TABLE kid_profiles/);
  });

  it('uses ON DELETE CASCADE for kid_profiles FK', () => {
    expect(migrationContent).toMatch(/REFERENCES\s+kid_profiles.*ON DELETE CASCADE/);
  });

  it('uses ON DELETE SET NULL for stories FK', () => {
    expect(migrationContent).toMatch(/REFERENCES\s+stories.*ON DELETE SET NULL/);
  });
});

// ─── Test Suite 9: Stories columns migration (Task 2.3) ───

describe('Stories table extension migration (Task 2.3) is correct', () => {
  let migrationContent: string;

  beforeAll(() => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const storiesColMigration = files.find(f => f.includes('emotion_flow_stories_columns'));
    expect(storiesColMigration).toBeDefined();
    migrationContent = fs.readFileSync(path.join(MIGRATIONS_DIR, storiesColMigration!), 'utf-8');
  });

  const EXPECTED_COLUMNS = [
    'emotion_blueprint_key',
    'tone_mode',
    'intensity_level',
    'character_seed_key',
    'sidekick_seed_key',
    'opening_element_key',
    'perspective_element_key',
  ];

  it('adds exactly 7 columns via ALTER TABLE stories', () => {
    const alterMatches = migrationContent.match(/ALTER TABLE stories/g) || [];
    expect(alterMatches.length).toBe(7);
  });

  for (const col of EXPECTED_COLUMNS) {
    it(`adds ${col} column`, () => {
      expect(migrationContent).toMatch(new RegExp(`ADD COLUMN.*${col}\\s+TEXT`));
    });

    it(`${col} is NULLABLE (no NOT NULL)`, () => {
      const colBlock = migrationContent.split(col)[1]?.split(/ALTER TABLE|$/)[0] || '';
      expect(colBlock).not.toMatch(/NOT NULL/);
    });
  }

  it('tone_mode has CHECK constraint with 5 modes', () => {
    expect(migrationContent).toMatch(/tone_mode IS NULL OR tone_mode IN/);
    expect(migrationContent).toMatch(/dramatic/);
    expect(migrationContent).toMatch(/comedic/);
    expect(migrationContent).toMatch(/adventurous/);
    expect(migrationContent).toMatch(/gentle/);
    expect(migrationContent).toMatch(/absurd/);
  });

  it('intensity_level has CHECK constraint with 3 levels', () => {
    expect(migrationContent).toMatch(/intensity_level IS NULL OR intensity_level IN/);
    expect(migrationContent).toMatch(/light/);
    expect(migrationContent).toMatch(/medium/);
    expect(migrationContent).toMatch(/deep/);
  });

  it('emotion_blueprint_key references emotion_blueprints(blueprint_key)', () => {
    expect(migrationContent).toMatch(/emotion_blueprint_key\s+TEXT[\s\S]*?REFERENCES\s+emotion_blueprints\(blueprint_key\)/);
  });

  it('character_seed_key references character_seeds(seed_key)', () => {
    expect(migrationContent).toMatch(/character_seed_key\s+TEXT[\s\S]*?REFERENCES\s+character_seeds\(seed_key\)/);
  });

  it('sidekick_seed_key references character_seeds(seed_key)', () => {
    expect(migrationContent).toMatch(/sidekick_seed_key\s+TEXT[\s\S]*?REFERENCES\s+character_seeds\(seed_key\)/);
  });

  it('opening_element_key references story_elements(element_key)', () => {
    expect(migrationContent).toMatch(/opening_element_key\s+TEXT[\s\S]*?REFERENCES\s+story_elements\(element_key\)/);
  });

  it('perspective_element_key references story_elements(element_key)', () => {
    expect(migrationContent).toMatch(/perspective_element_key\s+TEXT[\s\S]*?REFERENCES\s+story_elements\(element_key\)/);
  });

  it('does NOT add NOT NULL to any column', () => {
    const addBlocks = migrationContent.match(/ADD COLUMN.*?;/gs) || [];
    for (const block of addBlocks) {
      expect(block).not.toMatch(/NOT NULL/);
    }
  });

  it('does NOT change any other table besides stories', () => {
    const alterTargets = migrationContent.match(/ALTER TABLE\s+(\w+)/g) || [];
    for (const target of alterTargets) {
      expect(target).toBe('ALTER TABLE stories');
    }
  });
});
