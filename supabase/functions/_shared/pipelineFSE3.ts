/**
 * FSE3 — Multi-Pass Story Generation Pipeline
 *
 * Orchestrates: Pass 0 (Blueprint) → Pass 1 (Writer) → parallel Text + Image branches.
 *   Text-Branch: Pass 2 (Language) → Pass 3 (Style) → Pass 4 (JSON Wrapper)
 *   Image-Branch: Visual Director → Imagen 4
 *
 * Activated via fse3_enabled feature flag (checked in index.ts before FSE2).
 * Fire-and-forget: returns 202 immediately, updates DB with status.
 */

import type {
  FSE3PipelineContext,
  FSE3Blueprint,
  FSE3LanguageConfig,
  FSE3Variant,
  FSE3InterpreterResult,
  FSE3PassTiming,
} from './fse3Types.ts';
import { buildFSE3Prompt, translateBlueprint } from './fse3PromptBuilder.ts';
import { getModel } from './fse3FeatureFlag.ts';
import { listAvailableSubtypes, getThemeCategory, recordSubtypeUsage } from './storySubtypeSelector.ts';
import { buildAppearanceAnchor, buildAnchorFromSlots } from './appearanceAnchor.ts';
import { inferAgeCategory, inferGenderFromRelation } from './appearanceSlots.ts';
import { callVisualDirector } from './visualDirector.ts';
import {
  mapVisualDirectorToImagePlan,
  buildImagePrompts,
  getStyleForAge,
  loadImageRules,
} from './imagePromptBuilder.ts';

// ---------------------------------------------------------------------------
// CORS headers (same as index.ts / FSE2)
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-legacy-token, x-legacy-user-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// ---------------------------------------------------------------------------
// Vertex AI Auth Helpers (copied from pipeline-fse2.ts)
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function base64urlEncode(data: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < data.length; i += 3) {
    const a = data[i], b = data[i + 1] ?? 0, c = data[i + 2] ?? 0;
    result += chars[a >> 2] + chars[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < data.length ? chars[((b & 15) << 2) | (c >> 6)] : '=') +
      (i + 2 < data.length ? chars[c & 63] : '=');
  }
  return result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlEncodeString(str: string): string {
  return base64urlEncode(new TextEncoder().encode(str));
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binaryString = atob(pemBody);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getVertexAccessToken(serviceAccountJson: string): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60000) {
    return cachedAccessToken.token;
  }

  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = base64urlEncodeString(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64urlEncodeString(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp,
  }));

  const signingInput = `${header}.${payload}`;
  const key = await importPrivateKey(sa.private_key);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  const sig = base64urlEncode(new Uint8Array(signature));
  const jwt = `${signingInput}.${sig}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    console.error('[FSE3-AUTH] Token exchange failed:', err);
    throw new Error(`Vertex OAuth2 token exchange failed: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
  return cachedAccessToken.token;
}

// ---------------------------------------------------------------------------
// Gemini LLM Call via Vertex AI
// ---------------------------------------------------------------------------

async function callGeminiVertex(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  temperature = 0.8,
  maxRetries = 3,
): Promise<string> {
  const serviceAccountJson = Deno.env.get('VERTEX_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) throw new Error('[FSE3] VERTEX_SERVICE_ACCOUNT_JSON not configured');

  const sa = JSON.parse(serviceAccountJson);
  const projectId = sa.project_id || 'fablino-prod';
  const geminiUrl = `https://europe-west1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/europe-west1/publishers/google/models/${model}:generateContent`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[FSE3-LLM] Retry ${attempt + 1}/${maxRetries}, waiting ${waitTime}ms...`);
      await sleep(waitTime);
    }

    try {
      const accessToken = await getVertexAccessToken(serviceAccountJson);

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature, maxOutputTokens: 12000 },
        }),
      });

      if (response.status === 429) {
        lastError = new Error('Rate limited');
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        const errorBody = await response.text();
        console.error('[FSE3-LLM] Auth error:', response.status, errorBody.substring(0, 300));
        cachedAccessToken = null;
        lastError = new Error(`Vertex auth error: ${response.status}`);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[FSE3-LLM] API error ${response.status}:`, errorBody.substring(0, 300));
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        console.error('[FSE3-LLM] No content:', JSON.stringify(data).substring(0, 300));
        lastError = new Error('No content in Gemini response');
        await sleep(2000);
        continue;
      }

      return content;
    } catch (error) {
      if (error instanceof Error && (error.message === 'Rate limited' || error.message.startsWith('Vertex auth error'))) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('[FSE3-LLM] Max retries exceeded');
}

// ---------------------------------------------------------------------------
// Imagen 4 Image Generation via Vertex AI (europe-west4)
// ---------------------------------------------------------------------------

async function generateImageWithImagen(
  prompt: string,
  negativePrompt: string | undefined,
  maxRetries = 3,
): Promise<string | null> {
  const serviceAccountJson = Deno.env.get('VERTEX_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    console.error('[FSE3-IMAGE] VERTEX_SERVICE_ACCOUNT_JSON not configured');
    return null;
  }

  const sa = JSON.parse(serviceAccountJson);
  const projectId = sa.project_id || 'fablino-prod';
  const vertexModel = 'imagen-4.0-generate-001';
  const vertexUrl = `https://europe-west4-aiplatform.googleapis.com/v1/projects/${projectId}/locations/europe-west4/publishers/google/models/${vertexModel}:predict`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`[FSE3-IMAGE] Retry ${attempt + 1}/${maxRetries}, waiting ${waitTime}ms...`);
      await sleep(waitTime);
    }

    try {
      const accessToken = await getVertexAccessToken(serviceAccountJson);

      const response = await fetch(vertexUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            personGeneration: 'allow_all',
            safetySetting: 'block_only_high',
            ...(negativePrompt ? { negativePrompt } : {}),
            outputOptions: { mimeType: 'image/png' },
          },
        }),
      });

      if (response.status === 429) {
        lastError = new Error('Rate limited');
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        const errorText = await response.text();
        console.error(`[FSE3-IMAGE] Auth error (${response.status}):`, errorText);
        cachedAccessToken = null;
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FSE3-IMAGE] Error (${response.status}):`, errorText.substring(0, 300));
        return null;
      }

      const data = await response.json();
      const predictions = data.predictions || [];

      if (predictions.length > 0 && predictions[0].raiFilteredReason) {
        console.error(`[FSE3-IMAGE] RAI filter: ${predictions[0].raiFilteredReason}`);
        return null;
      }

      if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
        const base64Data = predictions[0].bytesBase64Encoded;
        const mimeType = predictions[0].mimeType || 'image/png';
        console.log('[FSE3-IMAGE] Image generated successfully');
        return `data:${mimeType};base64,${base64Data}`;
      }

      console.error('[FSE3-IMAGE] No image in response:', JSON.stringify(data).substring(0, 300));
      return null;
    } catch (error) {
      console.error('[FSE3-IMAGE] Request error:', error);
      if (error instanceof Error && error.message.includes('OAuth2')) {
        cachedAccessToken = null;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  console.error('[FSE3-IMAGE] Max retries exceeded');
  return null;
}

// ---------------------------------------------------------------------------
// Upload Image to Supabase Storage
// ---------------------------------------------------------------------------

async function uploadImageToStorage(
  supabase: any,
  base64DataUrl: string,
  bucket: string,
  prefix: string,
): Promise<string | null> {
  try {
    let mimeType = 'image/png';
    let rawBase64 = base64DataUrl;
    if (base64DataUrl.startsWith('data:')) {
      const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        rawBase64 = match[2];
      } else {
        rawBase64 = base64DataUrl.split(',')[1] || base64DataUrl;
      }
    }

    const binaryStr = atob(rawBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const ext = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';
    const fileName = `${prefix}-${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, bytes, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error(`[FSE3-UPLOAD] Error (${bucket}/${fileName}):`, uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    console.log(`[FSE3-UPLOAD] ${prefix} → ${urlData.publicUrl.substring(0, 80)}...`);
    return urlData.publicUrl;
  } catch (err) {
    console.error(`[FSE3-UPLOAD] Exception uploading ${prefix}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Context Loading
// ---------------------------------------------------------------------------

async function loadFSE3Context(
  body: any,
  supabase: any,
): Promise<FSE3PipelineContext & Record<string, any>> {
  const {
    kidProfileId,
    language = 'de',
    characters: rawChars = [],
    storyType = 'surprise',
    description = '',
    specialAbilities = [],
    storyLength = 'medium',
    includeSelf = true,
    imageStyleKey = '',
    fse3_chosen_variant,
    fse3_interpreter_result,
  } = body;

  // 1. Kid profile
  const { data: kidProfile } = await supabase
    .from('kid_profiles')
    .select('name, age, gender')
    .eq('id', kidProfileId)
    .maybeSingle();

  const kidName = kidProfile?.name || body.kidName || 'Kind';
  const kidAge = kidProfile?.age ?? 8;
  const kidGenderRaw = kidProfile?.gender || '';
  const kidGender = (kidGenderRaw === 'male' || kidGenderRaw === 'm' || kidGenderRaw === 'boy')
    ? 'male'
    : (kidGenderRaw === 'female' || kidGenderRaw === 'f' || kidGenderRaw === 'girl')
      ? 'female'
      : '';

  console.log(`[FSE3-CTX] Kid: ${kidName}, age=${kidAge}, gender=${kidGender}`);

  // 2. Kid language settings → reading level
  let readingLevel = 2; // default fluent reader
  if (kidProfileId) {
    const { data: langSettings } = await supabase
      .from('kid_language_settings')
      .select('language_level')
      .eq('kid_profile_id', kidProfileId)
      .eq('language', language)
      .maybeSingle();
    if (langSettings?.language_level) {
      readingLevel = langSettings.language_level;
    }
  }

  // 3. FSE3 Language Config
  const { data: langConfigRow } = await supabase
    .from('fse3_language_config')
    .select('*')
    .eq('language_code', language)
    .eq('level', readingLevel)
    .maybeSingle();

  const languageConfig: FSE3LanguageConfig = langConfigRow || {
    language_code: language,
    level: readingLevel,
    tense_rules: '',
    tense_example: '',
    max_sentence_length: 12,
    avg_sentence_length: 8,
    vocabulary_guidance: '',
    adjective_limit: 2,
    additional_rules: '',
    dialogue_format: '',
    dialogue_example_spoken: '',
    dialogue_example_thought: '',
    rhythm_example_right: '',
    rhythm_example_wrong: '',
    scenic_example_right: '',
    scenic_example_wrong: '',
  };

  // 4. Prompt templates (from fse3_prompt_templates)
  const { data: templateRows } = await supabase
    .from('fse3_prompt_templates')
    .select('pass_name, prompt_template, system_prompt_key')
    .eq('is_active', true);

  const promptTemplates: Record<string, string> = {};
  if (templateRows) {
    for (const row of templateRows) {
      promptTemplates[row.pass_name] = row.prompt_template;
      if (row.system_prompt_key) {
        promptTemplates[row.pass_name + '_system_key'] = row.system_prompt_key;
      }
    }
  }
  console.log(`[FSE3-CTX] Loaded ${Object.keys(promptTemplates).length / 2} prompt templates`);

  // 5. System prompts (from app_settings)
  const systemPromptKeys = [...new Set(
    (templateRows || []).map((r: any) => r.system_prompt_key).filter(Boolean),
  )];
  const systemPrompts: Record<string, string> = {};
  for (const key of systemPromptKeys) {
    const { data: spRow } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (spRow?.value) systemPrompts[key as string] = spRow.value;
  }

  // 6. EM-Code Mapping (from app_settings)
  let emCodeMapping: Record<string, { label: string; description: string }> = {};
  const { data: emRow } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'fse3_em_code_mapping')
    .maybeSingle();
  if (emRow?.value) {
    try {
      emCodeMapping = JSON.parse(emRow.value);
    } catch {
      console.warn('[FSE3-CTX] Failed to parse fse3_em_code_mapping');
    }
  }

  // 7. Available subtypes for Interpreter/Pass 0
  const themeKey = storyType || 'surprise';
  const availableSubtypes = await listAvailableSubtypes(themeKey, supabase);

  // 8. Available story paths
  const ageGroup = kidAge <= 7 ? '6-7' : kidAge <= 9 ? '8-9' : '10-11';
  const { data: pathRows } = await supabase
    .from('story_paths')
    .select('*')
    .eq('is_active', true)
    .contains('age_groups', [ageGroup]);
  const availablePaths = pathRows || [];

  // 9. Story length → word count target, paragraph count, scene count
  const { data: lengthConfig } = await supabase
    .from('story_length_levels')
    .select('word_approx, paragraph_count, scene_count')
    .eq('content_level', readingLevel)
    .eq('length_level', storyLength === 'short' ? 1 : storyLength === 'long' ? 3 : 2)
    .maybeSingle();

  const wordCountTarget = lengthConfig?.word_approx ?? 400;
  const paragraphCount = lengthConfig?.paragraph_count ?? 6;
  const sceneCount = lengthConfig?.scene_count ?? 3;

  // 10. Generation config (optional)
  const { data: genConfig } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'fse3_generation_config')
    .maybeSingle();
  let generationConfig: any = {};
  if (genConfig?.value) {
    try { generationConfig = JSON.parse(genConfig.value); } catch {}
  }

  // 11. Character enrichment (appearance anchors)
  const { kidAppearanceAnchor, characterAnchors, enrichedCharacters } =
    await enrichCharacters(supabase, kidProfileId, kidName, kidAge, kidGender, rawChars);

  // 12. Villain from body
  const villain = body.villain || null;

  // 13. Special effects
  const specialEffects = specialAbilities.includes('superpowers')
    ? 'superpowers'
    : specialAbilities.length > 0
      ? specialAbilities[0]
      : 'none';

  const ctx: FSE3PipelineContext & Record<string, any> = {
    kidProfileId,
    storyLanguage: language,
    readingLevel,
    theme: themeKey,
    characters: enrichedCharacters,
    villain,
    freeText: description,
    specialEffects,
    storyLength,
    includeSelf,
    imageStyleKey,

    kidName,
    kidAge,
    kidGender,
    kidAppearanceAnchor: kidAppearanceAnchor || '',
    characterAnchors,
    languageConfig,
    availableSubtypes,
    availablePaths,
    wordCountTarget,
    paragraphCount,
    sceneCount,
    generationConfig,
    promptTemplates,
    systemPrompts,
    emCodeMapping,

    chosenVariant: fse3_chosen_variant as FSE3Variant,
    interpreterResult: fse3_interpreter_result as FSE3InterpreterResult,
  };

  return ctx;
}

// ---------------------------------------------------------------------------
// Character Enrichment (adapted from pipeline-fse2.ts lines 645-788)
// ---------------------------------------------------------------------------

async function enrichCharacters(
  supabase: any,
  kidProfileId: string | undefined,
  kidName: string,
  kidAge: number,
  kidGender: string | null,
  rawChars: any[],
): Promise<{
  kidAppearanceAnchor: string | null;
  characterAnchors: Array<{ name: string; role: string; anchor: string }>;
  enrichedCharacters: any[];
}> {
  const anchorMap = new Map<string, string>();
  const characterAnchors: Array<{ name: string; role: string; anchor: string }> = [];
  let kidAppearanceAnchor: string | null = null;

  if (!kidProfileId) {
    return { kidAppearanceAnchor: null, characterAnchors: [], enrichedCharacters: rawChars };
  }

  // Kid protagonist appearance
  try {
    const { data: kidApp } = await supabase
      .from('kid_appearance')
      .select('skin_tone, hair_length, hair_type, hair_style, hair_color, glasses, appearance_data')
      .eq('kid_profile_id', kidProfileId)
      .maybeSingle();

    if (kidApp) {
      // Try Avatar V2 (appearance_data JSONB) first
      const hasV2 = kidApp.appearance_data &&
        typeof kidApp.appearance_data === 'object' &&
        Object.keys(kidApp.appearance_data).length > 0;

      if (hasV2) {
        try {
          kidAppearanceAnchor = buildAnchorFromSlots(
            kidName, kidAge, kidGender, 'child', kidApp.appearance_data,
          );
        } catch (v2Err: any) {
          console.warn('[FSE3-ANCHOR] buildAnchorFromSlots failed:', v2Err?.message);
        }
      }

      // Fall back to legacy columns
      if (!kidAppearanceAnchor && (kidApp.skin_tone || kidApp.hair_color)) {
        try {
          kidAppearanceAnchor = buildAppearanceAnchor(
            kidName, kidAge, kidGender || '', {
              skin_tone: kidApp.skin_tone || '',
              hair_length: kidApp.hair_length || '',
              hair_type: kidApp.hair_type || '',
              hair_style: kidApp.hair_style || '',
              hair_color: kidApp.hair_color || '',
              glasses: kidApp.glasses || false,
            },
          );
        } catch (legacyErr: any) {
          console.warn('[FSE3-ANCHOR] buildAppearanceAnchor failed:', legacyErr?.message);
          // Ultimate fallback: simple string
          const parts: string[] = [];
          if (kidApp.hair_length && kidApp.hair_length !== 'medium') parts.push(kidApp.hair_length);
          if (kidApp.hair_type && kidApp.hair_type !== 'straight') parts.push(kidApp.hair_type);
          if (kidApp.hair_color) parts.push(kidApp.hair_color + ' hair');
          if (kidApp.glasses) parts.push('glasses');
          if (parts.length > 0) kidAppearanceAnchor = parts.join(', ');
        }
      }

      if (kidAppearanceAnchor) {
        anchorMap.set(kidName, kidAppearanceAnchor);
        characterAnchors.push({ name: kidName, role: 'protagonist', anchor: kidAppearanceAnchor });
      }
    }
  } catch (err: any) {
    console.warn('[FSE3-ANCHOR] kid_appearance load failed:', err?.message);
  }

  // Side characters from kid_characters + character_appearances
  if (rawChars.length > 0) {
    try {
      const { data: charsWithAppearance } = await supabase
        .from('kid_characters')
        .select(`
          name, role, relation,
          character_appearances!character_appearance_id (
            appearance_data, age_category, gender
          )
        `)
        .eq('kid_profile_id', kidProfileId)
        .eq('is_active', true)
        .not('character_appearance_id', 'is', null);

      if (charsWithAppearance) {
        for (const char of charsWithAppearance as any[]) {
          const ca = char.character_appearances;
          if (ca?.appearance_data && Object.keys(ca.appearance_data).length > 0) {
            const anchor = buildAnchorFromSlots(
              char.name,
              'adult',
              ca.gender || inferGenderFromRelation(char.relation),
              ca.age_category || inferAgeCategory(char.role, char.relation),
              ca.appearance_data,
            );
            anchorMap.set(char.name, anchor);
            characterAnchors.push({
              name: char.name,
              role: char.role || 'sidekick',
              anchor,
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[FSE3-ANCHOR] Character appearance load failed:', err?.message);
    }
  }

  const enrichedCharacters = rawChars.map((c: any) => {
    const anchor = anchorMap.get(c.name);
    return anchor ? { ...c, appearance_anchor: anchor } : c;
  });

  console.log('[FSE3-ANCHOR] Enriched:', enrichedCharacters.map((c: any) =>
    ({ name: c.name, hasAnchor: !!c.appearance_anchor })));

  return { kidAppearanceAnchor, characterAnchors, enrichedCharacters };
}

// ---------------------------------------------------------------------------
// JSON Parsing Helpers
// ---------------------------------------------------------------------------

function parseBlueprint(raw: string): FSE3Blueprint {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('[FSE3] Blueprint: no valid JSON found');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    path_code: parsed.path_code || '',
    emotional_coloring: parsed.emotional_coloring || '',
    emotional_secondary: parsed.emotional_secondary || '',
    world_rule: parsed.world_rule || 'none',
    setup_objects: parsed.setup_objects || [],
    plot_skeleton: parsed.plot_skeleton || [],
    forbidden_in_writer: parsed.forbidden_in_writer || [],
    state_tracking: parsed.state_tracking || {},
    causality_check: parsed.causality_check || {
      p6_resolution_steps: '',
      fire_trajectory: '',
      defeat_mechanism: '',
    },
    self_check: parsed.self_check || {
      setup_payoff_map: [],
      p6_resolver: '',
      all_state_transitions_consistent: true,
      p6_physically_possible: true,
    },
  };
}

function parseFinalJSON(raw: string): {
  title: string;
  content: string;
  questions: any[];
  vocabulary: any[];
} {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('[FSE3] Pass 4: no valid JSON found');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: parsed.title || '',
    content: parsed.content || '',
    questions: parsed.questions || [],
    vocabulary: parsed.vocabulary || [],
  };
}

/**
 * Extract a story title from Pass 1 output.
 * Pass 1 may output raw story text; look for a title line or first line.
 */
function extractTitleFromPass1(pass1Output: string): string {
  // Try JSON first (if Pass 1 returns JSON with a title field)
  try {
    const jsonMatch = pass1Output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title) return parsed.title;
    }
  } catch { /* not JSON */ }

  // Try first non-empty line as title
  const lines = pass1Output.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    // Remove markdown heading markers
    const firstLine = lines[0].replace(/^#+\s*/, '').trim();
    if (firstLine.length < 100) return firstLine;
  }

  return 'Untitled Story';
}

// ---------------------------------------------------------------------------
// Normalize spacing after punctuation
// ---------------------------------------------------------------------------

function normalizeVocabulary(text: string): string {
  // Fix missing spaces after sentence-ending punctuation
  return text.replace(/([.!?])([A-ZÄÖÜ„])/g, '$1 $2');
}

// ---------------------------------------------------------------------------
// Text Branch: Pass 2 → 3 → 4
// ---------------------------------------------------------------------------

async function runTextBranch(
  ctx: FSE3PipelineContext & Record<string, any>,
  supabase: any,
  timing: Partial<FSE3PassTiming>,
): Promise<{ title: string; content: string; questions: any[]; vocabulary: any[] }> {
  // Pass 2 — Language Editor
  const t2 = Date.now();
  const model2 = await getModel('pass2', supabase);
  const pass2Prompt = buildFSE3Prompt('pass_2', ctx);
  console.log(`[FSE3-P2] Calling ${model2}...`);
  ctx.pass2Output = await callGeminiVertex(pass2Prompt.systemPrompt, pass2Prompt.userPrompt, model2, 0.5);
  timing.pass2_ms = Date.now() - t2;
  console.log(`[FSE3-P2] Done in ${timing.pass2_ms}ms (${ctx.pass2Output.length} chars)`);

  // Pass 3 — Style Editor
  const t3 = Date.now();
  const model3 = await getModel('pass3', supabase);
  const pass3Prompt = buildFSE3Prompt('pass_3', ctx);
  console.log(`[FSE3-P3] Calling ${model3}...`);
  ctx.pass3Output = await callGeminiVertex(pass3Prompt.systemPrompt, pass3Prompt.userPrompt, model3, 0.6);
  timing.pass3_ms = Date.now() - t3;
  console.log(`[FSE3-P3] Done in ${timing.pass3_ms}ms (${ctx.pass3Output.length} chars)`);

  // Pass 4 — JSON Wrapper
  const t4 = Date.now();
  const model4 = await getModel('pass4', supabase);
  const pass4Prompt = buildFSE3Prompt('pass_4', ctx);
  console.log(`[FSE3-P4] Calling ${model4}...`);
  const pass4Raw = await callGeminiVertex(pass4Prompt.systemPrompt, pass4Prompt.userPrompt, model4, 0.3);
  timing.pass4_ms = Date.now() - t4;
  console.log(`[FSE3-P4] Done in ${timing.pass4_ms}ms`);

  const finalJSON = parseFinalJSON(pass4Raw);

  // Normalize spacing
  finalJSON.content = normalizeVocabulary(finalJSON.content);

  return finalJSON;
}

// ---------------------------------------------------------------------------
// Image Branch: Visual Director → Image Generation
// ---------------------------------------------------------------------------

async function runImageBranch(
  ctx: FSE3PipelineContext & Record<string, any>,
  supabase: any,
  timing: Partial<FSE3PassTiming>,
): Promise<{
  coverImageUrl: string | null;
  storyImageUrls: string[];
}> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    console.error('[FSE3-IMG] LOVABLE_API_KEY not configured, skipping image branch');
    return { coverImageUrl: null, storyImageUrls: [] };
  }

  // Visual Director
  const tvd = Date.now();
  console.log(`[FSE3-VD] Calling Visual Director (sceneCount=${ctx.sceneCount})...`);

  let vdOutput;
  try {
    vdOutput = await callVisualDirector({
      apiKey: lovableApiKey,
      storyTitle: ctx.storyTitle || 'Untitled',
      storyContent: ctx.pass1Output || '',
      storyLanguage: ctx.storyLanguage,
      sceneCount: ctx.sceneCount,
      kidName: ctx.kidName,
      kidAge: ctx.kidAge,
      kidGender: ctx.kidGender,
      kidAppearanceAnchor: ctx.kidAppearanceAnchor || undefined,
      includeSelf: ctx.includeSelf,
      characterAnchors: ctx.characterAnchors,
    });
  } catch (vdErr: any) {
    console.error('[FSE3-VD] Visual Director failed:', vdErr?.message);
    timing.visual_director_ms = Date.now() - tvd;
    return { coverImageUrl: null, storyImageUrls: [] };
  }

  timing.visual_director_ms = Date.now() - tvd;
  console.log(`[FSE3-VD] Done in ${timing.visual_director_ms}ms, ${vdOutput.scenes.length} scenes`);

  // Map VD output → ImagePlan → Image Prompts
  const imagePlan = mapVisualDirectorToImagePlan(
    vdOutput,
    ctx.kidAppearanceAnchor || null,
    ctx.kidName,
    ctx.includeSelf,
  );

  // Resolve image style
  const ageGroup = ctx.kidAge <= 7 ? '6-7' : ctx.kidAge <= 9 ? '8-9' : '10-11';
  const styleOverride = await getStyleForAge(supabase, ctx.kidAge, ctx.imageStyleKey || null);
  const { ageRules } = await loadImageRules(supabase, ageGroup, ctx.theme, ctx.storyLanguage);

  const imagePrompts = buildImagePrompts(
    imagePlan,
    ageRules,
    null, // themeImageRules not used
    ctx.kidAge,
    undefined, // no series context
    {
      promptSnippet: styleOverride.promptSnippet,
      ageModifier: styleOverride.ageModifier,
      negative_prompt: styleOverride.negative_prompt,
      consistency_suffix: styleOverride.consistency_suffix,
    },
    {
      title: ctx.storyTitle || 'Untitled',
      protagonistGender: ctx.kidGender || undefined,
    },
  );

  console.log(`[FSE3-IMG] Generating ${imagePrompts.length} images...`);

  // Generate all images in parallel
  const timg = Date.now();
  const imageResults = await Promise.allSettled(
    imagePrompts.map(async (imgPrompt) => {
      const base64 = await generateImageWithImagen(imgPrompt.prompt, imgPrompt.negative_prompt);
      if (!base64) return { label: imgPrompt.label, url: null };

      const url = await uploadImageToStorage(supabase, base64, 'covers', imgPrompt.label);
      return { label: imgPrompt.label, url };
    }),
  );
  timing.image_generation_ms = Date.now() - timg;
  console.log(`[FSE3-IMG] All images done in ${timing.image_generation_ms}ms`);

  // Extract results
  let coverImageUrl: string | null = null;
  const storyImageUrls: string[] = [];

  for (const result of imageResults) {
    if (result.status !== 'fulfilled') continue;
    const { label, url } = result.value;
    if (label === 'cover') {
      coverImageUrl = url;
    } else if (url) {
      storyImageUrls.push(url);
    }
  }

  return { coverImageUrl, storyImageUrls };
}

// ---------------------------------------------------------------------------
// Main Pipeline Entry Point
// ---------------------------------------------------------------------------

export async function runPipelineFSE3(
  req: Request,
  supabase: any,
  body: any,
): Promise<Response> {
  const storyId = body.story_id;
  const userId = body.userId;

  console.log(`[FSE3-ENTRY] user=${userId} kid=${body.kidProfileId} storyId=${storyId}`);

  // Return 202 immediately, process in background
  // The EdgeRuntime.waitUntil pattern keeps the function alive after response
  const responsePromise = new Response(
    JSON.stringify({ status: 'accepted', storyId }),
    {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );

  // Fire-and-forget pipeline execution
  const pipelinePromise = executePipeline(supabase, body, storyId).catch((err) => {
    console.error('[FSE3-FATAL] Pipeline crashed:', err);
    // Update story status to failed
    supabase.from('stories').update({
      generation_status: 'error',
      fse3_pass_timing: { error: err instanceof Error ? err.message : String(err) },
    }).eq('id', storyId).then(() => {
      console.log('[FSE3] Error status written to DB');
    });
  });

  // Use EdgeRuntime.waitUntil if available (Supabase Edge Functions)
  try {
    // @ts-ignore — EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(pipelinePromise);
    }
  } catch {
    // Fallback: just let the promise run (works in Deno Deploy)
    // The response is sent immediately, pipeline continues in background
  }

  return responsePromise;
}

// ---------------------------------------------------------------------------
// Pipeline Execution (runs after 202 is returned)
// ---------------------------------------------------------------------------

async function executePipeline(
  supabase: any,
  body: any,
  storyId: string,
): Promise<void> {
  const startTime = Date.now();
  const timing: Partial<FSE3PassTiming> = {};

  try {
    // 1. Load context
    const ctx = await loadFSE3Context(body, supabase);
    console.log(`[FSE3] Context loaded, theme=${ctx.theme}, readingLevel=${ctx.readingLevel}`);

    // 2. Update status → generating
    await supabase.from('stories').update({ generation_status: 'generating' }).eq('id', storyId);

    // 3. Pass 0 — Blueprint
    const t0 = Date.now();
    const model0 = await getModel('pass0', supabase);
    const pass0Prompt = buildFSE3Prompt('pass_0', ctx);
    console.log(`[FSE3-P0] Calling ${model0}...`);
    const blueprintRaw = await callGeminiVertex(pass0Prompt.systemPrompt, pass0Prompt.userPrompt, model0, 0.7);
    timing.pass0_ms = Date.now() - t0;
    console.log(`[FSE3-P0] Done in ${timing.pass0_ms}ms`);

    // Parse blueprint
    ctx.blueprint = parseBlueprint(blueprintRaw);
    ctx.worldRule = ctx.blueprint.world_rule;

    // Translate blueprint codes → plaintext for Pass 1
    const translated = translateBlueprint(ctx.blueprint, ctx);
    ctx.storyArcPlaintext = translated.arc;
    ctx.emotionalTonePlaintext = translated.emotion;
    ctx.blueprintPlaintext = [
      `Arc: ${translated.arc}`,
      `Emotion: ${translated.emotion}`,
      `Setup Objects:\n${translated.setupObjects}`,
      `Plot Skeleton:\n${translated.skeleton}`,
      `Forbidden:\n${translated.forbidden}`,
    ].join('\n\n');
    ctx.setupObjectsList = translated.setupObjects;
    ctx.forbiddenList = translated.forbidden;

    // 4. Pass 1 — Story Writer
    const t1 = Date.now();
    const model1 = await getModel('pass1', supabase);
    const pass1Prompt = buildFSE3Prompt('pass_1', ctx);
    console.log(`[FSE3-P1] Calling ${model1}...`);
    ctx.pass1Output = await callGeminiVertex(pass1Prompt.systemPrompt, pass1Prompt.userPrompt, model1, 0.8);
    timing.pass1_ms = Date.now() - t1;
    console.log(`[FSE3-P1] Done in ${timing.pass1_ms}ms (${ctx.pass1Output.length} chars)`);

    // Extract title from Pass 1 output for VD
    ctx.storyTitle = extractTitleFromPass1(ctx.pass1Output);

    // 5. FORK — Text Branch + Image Branch in parallel
    console.log('[FSE3] Starting parallel branches (Text + Image)...');
    const [finalJSON, imageResult] = await Promise.all([
      runTextBranch(ctx, supabase, timing),
      runImageBranch(ctx, supabase, timing),
    ]);

    // Use final title from Pass 4 if available
    const storyTitle = finalJSON.title || ctx.storyTitle;
    const storyContent = finalJSON.content;

    // 6. Timing
    timing.total_ms = Date.now() - startTime;
    console.log(`[FSE3] Pipeline complete in ${timing.total_ms}ms`);
    console.log(`[FSE3-TIMING]`, JSON.stringify(timing));

    // 7. Determine final status
    const hasText = !!storyContent && storyContent.length > 50;
    const hasImages = !!imageResult.coverImageUrl || imageResult.storyImageUrls.length > 0;
    let finalStatus = 'error';
    if (hasText && hasImages) {
      finalStatus = 'verified';
    } else if (hasText && !hasImages) {
      finalStatus = 'text_complete';
    } else if (hasText) {
      finalStatus = 'images_failed';
    }

    // 8. DB Write — story data + images + timing
    const updatePayload: Record<string, any> = {
      generation_status: finalStatus,
      title: storyTitle,
      content: storyContent,
      questions: finalJSON.questions,
      vocabulary: finalJSON.vocabulary,
      cover_image_url: imageResult.coverImageUrl,
      story_image_urls: imageResult.storyImageUrls.length > 0
        ? imageResult.storyImageUrls
        : null,
      fse3_pass_timing: timing,
      story_path_code: ctx.blueprint?.path_code || null,
      emotional_coloring: ctx.blueprint?.emotional_coloring || null,
      emotional_secondary: ctx.blueprint?.emotional_secondary || null,
      used_fse3: true,
    };

    const { error: updateErr } = await supabase
      .from('stories')
      .update(updatePayload)
      .eq('id', storyId);

    if (updateErr) {
      console.error('[FSE3] DB write failed:', updateErr.message);
    } else {
      console.log(`[FSE3] DB write success, status=${finalStatus}`);
    }

    // 9. Record subtype usage (round-robin)
    if (ctx.chosenVariant?.routing?.subtype_key) {
      const category = getThemeCategory(ctx.theme);
      await recordSubtypeUsage(
        supabase,
        ctx.kidProfileId,
        category,
        ctx.chosenVariant.routing.subtype_key,
        storyId,
      );
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('[FSE3-ERROR]', msg, stack);

    timing.total_ms = Date.now() - startTime;

    // Update DB with error
    await supabase.from('stories').update({
      generation_status: 'error',
      fse3_pass_timing: { ...timing, error: msg },
    }).eq('id', storyId);
  }
}
