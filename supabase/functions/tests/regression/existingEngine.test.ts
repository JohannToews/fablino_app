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
