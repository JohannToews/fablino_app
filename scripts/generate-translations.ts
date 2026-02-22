/**
 * Generate missing translations (fr, es, nl, it, bs) for emotion_blueprints.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... npx tsx scripts/generate-translations.ts
 *
 * Output: writes SQL UPDATE statements to supabase/migrations/20260222_emotion_flow_translations.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_LANGS = ['fr', 'es', 'nl', 'it', 'bs'] as const;

async function translateWithClaude(deText: string, enText: string, field: string): Promise<Record<string, string>> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Translate this children's reading app UI text. Keep it short, friendly, age-appropriate.
Field: ${field}
DE: ${deText}
EN: ${enText}

Translate to: FR (French), ES (Spanish), NL (Dutch), IT (Italian), BS (Bosnian)
Return ONLY valid JSON, no markdown: {"fr": "...", "es": "...", "nl": "...", "it": "...", "bs": "..."}`
      }]
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON in response: ${text}`);
  return JSON.parse(jsonMatch[0]);
}

function escapeSQL(s: string): string {
  return s.replace(/'/g, "''");
}

async function main() {
  const { data: blueprints, error } = await supabase
    .from('emotion_blueprints')
    .select('blueprint_key, labels, descriptions')
    .order('blueprint_key');

  if (error || !blueprints) {
    console.error('Failed to fetch blueprints:', error);
    process.exit(1);
  }

  console.log(`Found ${blueprints.length} blueprints to translate`);

  const sqlLines: string[] = [
    '-- ============================================================',
    '-- Emotion-Flow-Engine: Translations for emotion_blueprints (Task 3.4)',
    '-- Generated via scripts/generate-translations.ts',
    '-- Adds: fr, es, nl, it, bs to labels and descriptions JSONB',
    '-- ============================================================',
    '',
  ];

  for (const bp of blueprints) {
    console.log(`Translating: ${bp.blueprint_key}...`);

    const labels = typeof bp.labels === 'string' ? JSON.parse(bp.labels) : bp.labels;
    const descs = typeof bp.descriptions === 'string' ? JSON.parse(bp.descriptions) : bp.descriptions;

    const labelTranslations = await translateWithClaude(labels.de, labels.en, 'label (short name)');
    const descTranslations = await translateWithClaude(descs.de, descs.en, 'description (one sentence)');

    const mergedLabels = { ...labels, ...labelTranslations };
    const mergedDescs = { ...descs, ...descTranslations };

    sqlLines.push(
      `UPDATE emotion_blueprints SET`,
      `  labels = '${escapeSQL(JSON.stringify(mergedLabels))}',`,
      `  descriptions = '${escapeSQL(JSON.stringify(mergedDescs))}'`,
      `WHERE blueprint_key = '${bp.blueprint_key}';`,
      ''
    );

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  const outPath = path.resolve(__dirname, '../supabase/migrations/20260222_emotion_flow_translations.sql');
  fs.writeFileSync(outPath, sqlLines.join('\n'), 'utf-8');
  console.log(`\nDone! Written ${blueprints.length} UPDATE statements to:\n${outPath}`);
}

main().catch(console.error);
