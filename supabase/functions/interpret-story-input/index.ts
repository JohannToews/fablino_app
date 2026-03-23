/**
 * FSE3 Interpreter Edge Function
 *
 * Takes wizard inputs and generates 3 story variants (A, B, C) for user selection.
 * This is a SYNCHRONOUS endpoint — it returns the variants directly (not fire-and-forget).
 *
 * Flow:
 *   1. Authenticate user
 *   2. Load interpreter prompt template + system prompt from DB
 *   3. Load available story subtypes for the selected theme
 *   4. Build prompt using FSE3 PromptBuilder
 *   5. Call Gemini via Vertex AI
 *   6. Parse JSON response → return { variants: FSE3Variant[] }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { buildFSE3Prompt } from '../_shared/fse3PromptBuilder.ts';
import { getModel } from '../_shared/fse3FeatureFlag.ts';
import { listAvailableSubtypes } from '../_shared/storySubtypeSelector.ts';
import type { FSE3Variant, FSE3InterpreterResult, FSE3PipelineContext } from '../_shared/fse3Types.ts';

// ---------------------------------------------------------------------------
// Vertex AI Auth Helpers (same as pipelineFSE3.ts)
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
    console.error('[FSE3-INTERP-AUTH] Token exchange failed:', err);
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
// Gemini LLM Call
// ---------------------------------------------------------------------------

async function callGeminiVertex(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  temperature = 0.8,
  maxRetries = 3,
  thinkingBudget?: number,
): Promise<string> {
  const serviceAccountJson = Deno.env.get('VERTEX_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) throw new Error('[FSE3-INTERP] VERTEX_SERVICE_ACCOUNT_JSON not configured');

  const sa = JSON.parse(serviceAccountJson);
  const projectId = sa.project_id || 'fablino-prod';
  const geminiUrl = `https://europe-west1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/europe-west1/publishers/google/models/${model}:generateContent`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[FSE3-INTERP] Retry ${attempt + 1}/${maxRetries}, waiting ${waitTime}ms...`);
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
          generationConfig: {
            temperature,
            maxOutputTokens: 4000,
            ...(thinkingBudget ? { thinkingConfig: { thinkingBudget } } : {}),
          },
        }),
      });

      if (response.status === 429) {
        lastError = new Error('Rate limited');
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        const errorBody = await response.text();
        console.error('[FSE3-INTERP] Auth error:', response.status, errorBody.substring(0, 300));
        cachedAccessToken = null;
        lastError = new Error(`Vertex auth error: ${response.status}`);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[FSE3-INTERP] API error ${response.status}:`, errorBody.substring(0, 300));
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      // With thinking enabled, Gemini returns thinking parts (thought:true) before the actual text.
      const parts = data.candidates?.[0]?.content?.parts || [];
      const textPart = parts.filter((p: any) => !p.thought && p.text).pop();
      const content = textPart?.text;

      if (!content) {
        console.error('[FSE3-INTERP] No content:', JSON.stringify(data).substring(0, 300));
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

  throw lastError || new Error('[FSE3-INTERP] Max retries exceeded');
}

// ---------------------------------------------------------------------------
// Variant C Tone Descriptions
// ---------------------------------------------------------------------------

// VARIANT_C_TONE_DESCRIPTIONS removed — replaced by dynamic em_driver system

// ---------------------------------------------------------------------------
// Parse Variants from LLM Response
// ---------------------------------------------------------------------------

function parseVariants(raw: string): FSE3Variant[] {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object from response
    const jsonMatch = cleaned.match(/\{[\s\S]*"variants"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('[FSE3-INTERP] Failed to parse variants JSON from response');
      }
    } else {
      throw new Error('[FSE3-INTERP] No valid JSON found in interpreter response');
    }
  }

  const variants: FSE3Variant[] = parsed.variants || parsed;

  if (!Array.isArray(variants) || variants.length < 3) {
    throw new Error(`[FSE3-INTERP] Expected 3 variants, got ${Array.isArray(variants) ? variants.length : 'non-array'}`);
  }

  // Validate and normalize variant structure
  const validIds: Array<"A" | "B" | "C"> = ["A", "B", "C"];
  return validIds.map((id, i) => {
    const v = variants[i];
    if (!v) throw new Error(`[FSE3-INTERP] Missing variant ${id}`);

    return {
      id,
      visible: {
        emoji: v.visible?.emoji || '📖',
        title: v.visible?.title || `Story ${id}`,
        teaser: v.visible?.teaser || '',
      },
      routing: {
        em_driver: v.routing?.em_driver || '',
        primary_driver: v.routing?.primary_driver || 'adventure',
        subtype_key: v.routing?.subtype_key || '',
        conflict_type: v.routing?.conflict_type || '',
        one_line_summary: v.routing?.one_line_summary || '',
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // CORS preflight
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    // 1. Authenticate
    const auth = await getAuthenticatedUser(req);
    const { userId, supabase } = auth;
    console.log('[FSE3-INTERP] Authenticated user:', userId);

    // 2. Parse request body
    const body = await req.json();
    const {
      kidName,
      kidAge,
      kidGender,
      storyType,
      characters,
      villain,
      additionalDescription,
      specialAttributes,
      storyLanguage,
      readingLevel,
      variantCTone,
    } = body;

    if (!kidName || !storyType || !storyLanguage) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: kidName, storyType, storyLanguage',
      }), { status: 400, headers: jsonHeaders });
    }

    console.log('[FSE3-INTERP] Request:', {
      kidName, kidAge, storyType, storyLanguage, readingLevel,
      variantCTone, characterCount: characters?.length || 0,
      hasVillain: !!villain,
    });

    const startTime = Date.now();

    // 3. Load interpreter prompt template from DB
    const { data: templateRow, error: templateError } = await supabase
      .from('fse3_prompt_templates')
      .select('prompt_template, system_prompt_key')
      .eq('pass_name', 'interpreter')
      .eq('is_active', true)
      .maybeSingle();

    if (templateError || !templateRow?.prompt_template) {
      console.error('[FSE3-INTERP] Failed to load interpreter template:', templateError?.message);
      return new Response(JSON.stringify({
        error: 'Interpreter prompt template not found in DB',
      }), { status: 500, headers: jsonHeaders });
    }

    // 4. Load system prompt from app_settings
    const systemPromptKey = templateRow.system_prompt_key || 'system_prompt_core_v3';
    const { data: spRow } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', systemPromptKey)
      .maybeSingle();
    const systemPrompt = spRow?.value || '';

    // 5. Load available subtypes for the theme
    const availableSubtypes = await listAvailableSubtypes(storyType, supabase);
    console.log(`[FSE3-INTERP] Loaded ${availableSubtypes.length} subtypes for theme=${storyType}`);

    // 5b. Load theme → em_driver mapping + em_driver config
    const { data: themeDriversData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'fse3_theme_em_drivers')
      .maybeSingle();
    const themeEmDrivers = themeDriversData?.value ? JSON.parse(themeDriversData.value) : {};

    const { data: driverConfigData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'fse3_em_driver_config')
      .maybeSingle();
    const emDriverConfig = driverConfigData?.value ? JSON.parse(driverConfigData.value) : {};

    const allowedEmDrivers: string[] = themeEmDrivers[storyType] || ['spannung', 'humor', 'gefühl', 'staunen'];
    console.log(`[FSE3-INTERP] Allowed em_drivers for theme=${storyType}:`, allowedEmDrivers);

    // 6. Build a minimal pipeline context for the prompt builder
    const promptTemplates: Record<string, string> = {
      interpreter: templateRow.prompt_template,
    };
    if (templateRow.system_prompt_key) {
      promptTemplates['interpreter_system_key'] = templateRow.system_prompt_key;
    }
    const systemPrompts: Record<string, string> = {};
    if (systemPrompt) {
      systemPrompts[systemPromptKey] = systemPrompt;
    }

    const ctx: FSE3PipelineContext & Record<string, any> = {
      // Wizard data
      kidProfileId: '',
      storyLanguage: storyLanguage || 'de',
      readingLevel: readingLevel ?? 2,
      theme: storyType || '',
      characters: characters || [],
      villain: villain || null,
      freeText: additionalDescription || '',
      specialEffects: (specialAttributes || []).includes('superpowers')
        ? 'superpowers'
        : (specialAttributes || []).filter((a: string) => a !== 'normal').join(', ') || 'none',
      storyLength: 'medium',
      includeSelf: (characters || []).some((c: any) => c.type === 'self'),
      imageStyleKey: '',

      // Kid data (from request)
      kidName: kidName || '',
      kidAge: kidAge ?? 7,
      kidGender: kidGender || 'neutral',
      kidAppearanceAnchor: '',
      characterAnchors: [],

      // Language config (not needed for interpreter, minimal)
      languageConfig: {
        language_code: storyLanguage || 'de',
        level: readingLevel ?? 2,
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
      },

      // DB data
      availableSubtypes,
      availablePaths: [],
      wordCountTarget: 0,
      paragraphCount: 0,
      sceneCount: 0,
      generationConfig: {},
      promptTemplates,
      systemPrompts,
      emCodeMapping: {},

      // em_driver config (for interpreter variant generation)
      allowedEmDrivers,
      emDriverConfig,

      // Not applicable for interpreter
      chosenVariant: {} as FSE3Variant,
      interpreterResult: { variants: [] },
    };

    // 7. Build prompt ({{AVAILABLE_EM_DRIVERS}} is replaced by the PromptBuilder)
    const { systemPrompt: builtSystemPrompt, userPrompt: finalUserPrompt } = buildFSE3Prompt('interpreter', ctx);

    console.log(`[FSE3-INTERP] Prompt built. System prompt: ${builtSystemPrompt.length} chars, User prompt: ${finalUserPrompt.length} chars`);

    // 9. Get model for interpreter
    const model = await getModel('interpreter', supabase);
    console.log(`[FSE3-INTERP] Using model: ${model}`);

    // 10. Call Gemini
    const rawResponse = await callGeminiVertex(builtSystemPrompt, finalUserPrompt, model, 0.9, 3, -1);
    const interpreterMs = Date.now() - startTime;
    console.log(`[FSE3-INTERP] Gemini response received in ${interpreterMs}ms, length=${rawResponse.length}`);

    // 11. Parse variants
    const variants = parseVariants(rawResponse);
    console.log('[FSE3-INTERP] Parsed variants:', variants.map(v => `${v.id}: ${v.visible.title} (${v.routing.primary_driver})`));

    // 12. Return
    const result: FSE3InterpreterResult = { variants };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: jsonHeaders,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[FSE3-INTERP] Error:', message);

    // Check for auth errors
    if (message.includes('Auth') || message.includes('auth') || message.includes('unauthorized')) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
