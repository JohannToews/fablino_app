/**
 * FSE2 — Story Generation Pipeline
 *
 * Completely separate from FSE1 (index.ts).
 * Activated via the fse2_enabled feature flag.
 */

import {
  loadKidLanguageSettings,
  loadStoryLevel,
  loadStoryLengthLevel,
  loadAgeLevelDefault,
  buildPlanPromptV2,
  buildStoryPromptV2,
  selectNextPathV2,
  ageToAgeGroupV2,
  type KidLanguageSettings,
  type StoryPathV2,
} from '../_shared/promptBuilderV2.ts';
import { selectStorySubtype, type SelectedSubtype } from '../_shared/storySubtypeSelector.ts';
import { buildAppearanceAnchor, buildAnchorFromSlots } from '../_shared/appearanceAnchor.ts';
import { inferAgeCategory, inferGenderFromRelation } from '../_shared/appearanceSlots.ts';

// ---------------------------------------------------------------------------
// LLM call — Vertex AI Claude Sonnet 4.6 (primary) with Gemini fallback
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Vertex AI auth helpers (same as index.ts) ---

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
    ['sign']
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
    new TextEncoder().encode(signingInput)
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
    console.error('[FSE2-AUTH] Token exchange failed:', err);
    throw new Error(`Vertex OAuth2 token exchange failed: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
  return cachedAccessToken.token;
}

// --- callLLM: Sonnet primary, Gemini fallback ---

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.8,
  maxRetries = 3,
): Promise<string> {
  const serviceAccountJson = Deno.env.get('VERTEX_SERVICE_ACCOUNT_JSON');

  // ── TEMPORARY: Skip Sonnet, use Gemini directly (rate-limit issues) ──
  // To revert: change `if (false &&` back to `if (`
  if (false && serviceAccountJson) {
    try {
      const sa = JSON.parse(serviceAccountJson!);
      const projectId = sa.project_id || 'fablino-prod';
      const modelName = 'claude-sonnet-4-6';
      const vertexUrl = `https://europe-west1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/europe-west1/publishers/anthropic/models/${modelName}:rawPredict`;
      console.log('[FSE2-LLM] Sonnet model string:', modelName);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`[FSE2-LLM] Sonnet retry, waiting ${waitTime}ms (${attempt + 1}/${maxRetries})...`);
          await sleep(waitTime);
        }

        try {
          const accessToken = await getVertexAccessToken(serviceAccountJson!);
          console.log('[FSE2-LLM] Sonnet request url:', vertexUrl);
          console.log('[FSE2-LLM] Sonnet auth token length:', accessToken?.length);

          let response: Response;
          try {
            response = await fetch(vertexUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                anthropic_version: 'vertex-2023-10-16',
                max_tokens: 8192,
                temperature,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
              }),
            });
          } catch (err: any) {
            console.log('[FSE2-LLM] Sonnet fetch exception:', err.message, err.stack?.substring(0, 300));
            throw err;
          }

          if (response.status === 429) {
            console.log('[FSE2-LLM] Sonnet HTTP status:', response.status, 'attempt:', attempt);
            lastError = new Error('Rate limited');
            continue;
          }

          // Read body exactly once
          const rawBody = await response.text();
          console.log('[FSE2-LLM] Sonnet HTTP status:', response.status);

          if (response.status === 401 || response.status === 403) {
            console.log('[FSE2-LLM] Sonnet error body:', rawBody.substring(0, 500));
            cachedAccessToken = null;
            lastError = new Error(`Vertex auth error: ${response.status}`);
            continue;
          }

          if (!response.ok) {
            console.log('[FSE2-LLM] Sonnet error body:', rawBody.substring(0, 500));
            throw new Error(`Vertex Claude error: ${response.status}`);
          }

          const data = JSON.parse(rawBody);
          const content = data.content?.[0]?.text;

          if (!content) {
            console.log('[FSE2-LLM] Sonnet response structure:', rawBody.substring(0, 500));
            lastError = new Error('No content in Sonnet response');
            await sleep(2000);
            continue;
          }

          console.log('[FSE2-LLM] using model: sonnet');
          return content;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          console.log('[FSE2-LLM] Sonnet raw error:', err.message);
          console.log('[FSE2-LLM] Sonnet response status if available:', (error as any)?.status);
          if (err.message === 'Rate limited' || err.message.startsWith('Vertex auth error')) {
            lastError = err;
            continue;
          }
          throw error;
        }
      }

      // All Sonnet retries exhausted — fall through to Gemini
      console.warn('[FSE2-LLM] Sonnet failed after retries, falling back to Gemini:', lastError?.message);
    } catch (sonnetError: unknown) {
      const sonnetMsg = sonnetError instanceof Error ? (sonnetError as Error).message : String(sonnetError);
      console.warn('[FSE2-LLM] Sonnet unavailable, falling back to Gemini:', sonnetMsg);
    }
  }

  // ── Fallback: Gemini 2.5 Flash via Vertex AI ──
  console.log('[FSE2-LLM] using model: gemini-fallback');

  if (!serviceAccountJson) throw new Error('VERTEX_SERVICE_ACCOUNT_JSON not configured for Gemini fallback');

  const gSa = JSON.parse(serviceAccountJson);
  const gProjectId = gSa.project_id || 'fablino-prod';
  const geminiModel = 'gemini-2.5-flash';
  const geminiUrl = `https://europe-west1-aiplatform.googleapis.com/v1/projects/${gProjectId}/locations/europe-west1/publishers/google/models/${geminiModel}:generateContent`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[FSE2-LLM] Gemini retry, waiting ${waitTime}ms (${attempt + 1}/${maxRetries})...`);
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
          generationConfig: { temperature },
        }),
      });

      if (response.status === 429) {
        lastError = new Error('Rate limited');
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        const errorBody = await response.text();
        console.log('[FSE2-LLM] Gemini auth error:', response.status, errorBody.substring(0, 300));
        cachedAccessToken = null;
        lastError = new Error(`Vertex auth error: ${response.status}`);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[FSE2-LLM] Gemini API error ${response.status}:`, errorBody.substring(0, 300));
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        console.error('[FSE2-LLM] Gemini no content:', JSON.stringify(data).substring(0, 300));
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

  throw lastError || new Error('[FSE2-LLM] Max retries exceeded');
}

// ---------------------------------------------------------------------------
// Consistency Checker — types, helpers, and functions (adapted from index.ts)
// ---------------------------------------------------------------------------

interface ConsistencyCheckResult {
  hasIssues: boolean;
  issues: string[];
  suggestedFixes: string;
  structuredErrors?: SeriesConsistencyError[];
}

type CheckerSubcategory =
  | 'RESOLUTION' | 'MAGIC_RULES' | 'KNOWLEDGE' | 'CAUSE_EFFECT'
  | 'CHARACTER_EXIT' | 'OBJECT_TRACKING' | 'SETUP_PAYOFF' | 'OTHER';
type FlaggedSegment = 'beginning' | 'middle' | 'ending' | 'unspecified';

interface SeriesConsistencyError {
  category: 'LOGIC' | 'GRAMMAR' | 'LANGUAGE' | 'CHARACTER' | 'CONTINUITY' | 'EPISODE_FUNCTION' | 'SIGNATURE';
  subcategory: CheckerSubcategory;
  severity: 'CRITICAL' | 'MEDIUM' | 'LOW';
  flagged_segment: FlaggedSegment;
  path_violation: boolean;
  original: string;
  problem: string;
  fix: string;
}

function getDefaultSeverity(category: string): 'CRITICAL' | 'MEDIUM' | 'LOW' {
  const cat = category.toUpperCase();
  if (cat === 'CONTINUITY' || cat === 'EPISODE_FUNCTION') return 'CRITICAL';
  if (cat === 'LOGIC' || cat === 'CHARACTER') return 'MEDIUM';
  if (cat === 'GRAMMAR' || cat === 'LANGUAGE' || cat === 'SIGNATURE') return 'LOW';
  return 'MEDIUM';
}

function parseCategoryString(raw: string): { category: string; subcategory: string | null } {
  const upper = (raw || 'LOGIC').toUpperCase().trim();

  if (upper.includes(':')) {
    const [cat, sub] = upper.split(':');
    return { category: cat, subcategory: sub || null };
  }

  const knownCategories = ['LOGIC', 'GRAMMAR', 'LANGUAGE', 'CHARACTER', 'CONTINUITY', 'EPISODE_FUNCTION', 'SIGNATURE'];
  for (const cat of knownCategories) {
    if (upper.startsWith(cat + '_')) {
      const sub = upper.slice(cat.length + 1);
      return { category: cat, subcategory: sub || null };
    }
  }

  return { category: upper, subcategory: null };
}

function extractSegment(content: string, segment: FlaggedSegment): string {
  const lines = content.split('\n');
  const total = lines.length;
  if (total === 0) return content;
  const third = Math.ceil(total / 3);

  switch (segment) {
    case 'beginning': return lines.slice(0, third).join('\n');
    case 'middle':    return lines.slice(third, third * 2).join('\n');
    case 'ending':    return lines.slice(third * 2).join('\n');
    default:          return content;
  }
}

async function performConsistencyCheck(
  story: { title: string; content: string },
  checkPrompt: string,
): Promise<ConsistencyCheckResult> {
  const userPrompt = `Check this story exactly against the rules in the system prompt.
Return ONLY the JSON format specified by the system prompt.

STORY TITLE:
${story.title}

STORY CONTENT:
${story.content}`;

  try {
    const response = await callLLM(checkPrompt, userPrompt, 0.3);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('[FSE2-CC] Could not parse check response, assuming no issues');
      return { hasIssues: false, issues: [], suggestedFixes: '' };
    }

    const result = JSON.parse(jsonMatch[0]);
    const rawIssues = result.issues || result.errors || result.fehler || [];

    const issues = Array.isArray(rawIssues)
      ? rawIssues.map((f: any) => {
          if (typeof f === 'string') return f;
          const rawCat = f.category || f.kategorie || 'LOGIC';
          const parsed = parseCategoryString(rawCat);
          const category = parsed.category;
          const subcategory = parsed.subcategory || f.subcategory || f.unterkategorie || 'OTHER';
          const rawSeverity = f.severity || f.schweregrad;
          const severity = rawSeverity ? rawSeverity.toUpperCase() : getDefaultSeverity(category);
          const segment = f.flagged_segment || f.segment || 'middle';
          return `[${category}:${subcategory}/${severity}@${segment}] ${f.problem || ''}: "${f.originaltext || f.original || ''}" → ${f.korrektur || f.fix || ''}`;
        })
      : [];

    const structuredErrors: SeriesConsistencyError[] = Array.isArray(rawIssues)
      ? rawIssues
          .filter((f: any) => typeof f === 'object' && f !== null)
          .map((f: any) => {
            const rawCat = f.category || f.kategorie || 'LOGIC';
            const parsed = parseCategoryString(rawCat);
            const category = parsed.category;
            const subcategory = parsed.subcategory || f.subcategory || f.unterkategorie || 'OTHER';
            const rawSeverity = f.severity || f.schweregrad;
            const severity = rawSeverity ? rawSeverity.toUpperCase() : getDefaultSeverity(category);
            return {
              category: category as SeriesConsistencyError['category'],
              subcategory: subcategory.toUpperCase() as SeriesConsistencyError['subcategory'],
              severity: severity as SeriesConsistencyError['severity'],
              flagged_segment: (f.flagged_segment || f.segment || 'middle') as SeriesConsistencyError['flagged_segment'],
              path_violation: f.path_violation || false,
              original: f.original || f.originaltext || '',
              problem: f.problem || '',
              fix: f.fix || f.korrektur || '',
            };
          })
      : [];

    const stats = result.stats || result.statistik || {};
    const statsCount = Number(stats.critical || stats.kritisch || 0) + Number(stats.medium || stats.mittel || 0) + Number(stats.low || stats.gering || 0);
    const hasIssues =
      result.hasIssues === true ||
      result.fehler_gefunden === true ||
      result.errors_found === true ||
      issues.length > 0 ||
      statsCount > 0;

    const suggestedFixes = result.suggestedFixes || result.zusammenfassung || result.summary || '';
    console.log(`[FSE2-CC] Parsed: hasIssues=${hasIssues}, issues=${issues.length}, structuredErrors=${structuredErrors.length}`);
    return { hasIssues, issues, suggestedFixes, structuredErrors };
  } catch (error) {
    console.error('[FSE2-CC] Error in consistency check:', error);
    return { hasIssues: false, issues: [], suggestedFixes: '' };
  }
}

async function correctStory(
  story: { title: string; content: string; questions: any[]; vocabulary: any[] },
  issues: string[],
  suggestedFixes: string,
  targetLanguage: string,
): Promise<{ title: string; content: string; questions: any[]; vocabulary: any[] }> {
  const correctionPrompt = `Du bist ein Texteditor. Korrigiere den folgenden Text basierend auf den gefundenen Problemen.

WICHTIG:
- Behalte die Sprache (${targetLanguage}) bei
- Behalte den Stil und die Struktur bei
- Korrigiere NUR die genannten Probleme
- Der Text muss weiterhin kindgerecht sein`;

  const userPrompt = `Korrigiere diese Geschichte:

TITEL: ${story.title}

INHALT:
${story.content}

GEFUNDENE PROBLEME:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

KORREKTURANWEISUNGEN:
${suggestedFixes}

Antworte NUR mit einem JSON-Objekt:
{
  "title": "Korrigierter Titel (oder original wenn kein Problem)",
  "content": "Der vollständig korrigierte Text"
}`;

  try {
    const response = await callLLM(correctionPrompt, userPrompt, 0.5);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[FSE2-CC] Could not parse correction response');
      return story;
    }

    const corrected = JSON.parse(jsonMatch[0]);
    const normalizedContent = (corrected.content || story.content).replace(/([.!?])([A-ZÄÖÜ„])/g, '$1 $2');
    return {
      title: corrected.title || story.title,
      content: normalizedContent,
      questions: story.questions,
      vocabulary: story.vocabulary,
    };
  } catch (error) {
    console.error('[FSE2-CC] Error correcting story:', error);
    return story;
  }
}

async function targetedReCheck(
  storyContent: string,
  error: SeriesConsistencyError,
): Promise<boolean> {
  const segment = extractSegment(storyContent, error.flagged_segment);

  const systemPrompt = `You are a children's story editor verifying whether a specific error has been fixed.
You will receive a text segment and the original error. Determine if the error is still present.
Respond ONLY with JSON: {"fixed": true} or {"fixed": false}`;

  const userPrompt = `ORIGINAL ERROR:
[${error.category}:${error.subcategory}/${error.severity}] "${error.original}"
Problem: ${error.problem}

TEXT SEGMENT (${error.flagged_segment}):
${segment}

Is this specific error fixed in the text above?`;

  try {
    const response = await callLLM(systemPrompt, userPrompt, 0.1);
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return false;
    const result = JSON.parse(jsonMatch[0]);
    return result.fixed === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// CORS headers (same as index.ts)
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-legacy-token, x-legacy-user-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export async function runPipelineFSE2(
  req: Request,
  supabase: any,
  requestBody: any,
): Promise<Response> {
  const startTime = Date.now();

  const {
    kidProfileId,
    language = 'de',
    kidName,
    topic,
    characters,
    genre,
    userId,
  } = requestBody;

  // 1. Entry log
  console.log('[FSE2-ENTRY] user=' + userId + ' kid=' + kidProfileId + ' language=' + language);

  try {
    // -----------------------------------------------------------------------
    // 1b. Fetch kid age from kid_profiles
    // -----------------------------------------------------------------------
    let age: number | null = null;
    if (kidProfileId) {
      const { data: kidProfile } = await supabase
        .from('kid_profiles')
        .select('age')
        .eq('id', kidProfileId)
        .maybeSingle();
      age = kidProfile?.age ?? null;
    }
    console.log('[FSE2] kid age=' + age);

    // -----------------------------------------------------------------------
    // 2. Load kid language settings — fall back to age-based defaults
    // -----------------------------------------------------------------------
    let langSettings: KidLanguageSettings | null = null;

    if (kidProfileId) {
      langSettings = await loadKidLanguageSettings(supabase, kidProfileId, language);
    }

    if (!langSettings) {
      console.log('[FSE2] No kid_language_settings found, falling back to age_level_defaults');
      const defaultLevel = await loadAgeLevelDefault(supabase, age ?? 6);
      const level = defaultLevel ?? 1;

      langSettings = {
        kid_profile_id: kidProfileId || 'fallback',
        language,
        language_class: level,
        language_level: level,
        content_level: level,
        length_level: 1,
      };
      console.log(`[FSE2] Using age-based fallback: level=${level}`);
    }

    // -----------------------------------------------------------------------
    // 3. Load storyLevel (content_level) — for Planner
    // -----------------------------------------------------------------------
    const storyLevel = await loadStoryLevel(supabase, langSettings.content_level);
    if (!storyLevel) {
      throw new Error(`story_level ${langSettings.content_level} not found`);
    }

    // -----------------------------------------------------------------------
    // 4. Load lengthLevel
    // -----------------------------------------------------------------------
    const lengthLevel = await loadStoryLengthLevel(supabase, langSettings.content_level, langSettings.length_level);
    if (!lengthLevel) {
      throw new Error(`story_length_level (${langSettings.content_level}, ${langSettings.length_level}) not found`);
    }

    // -----------------------------------------------------------------------
    // 5. Load writerLevel (language_level) — for Writer
    // -----------------------------------------------------------------------
    const writerLevel = await loadStoryLevel(supabase, langSettings.language_level);
    if (!writerLevel) {
      throw new Error(`story_level (writer) ${langSettings.language_level} not found`);
    }

    // Settings log
    console.log('[FSE2-SETTINGS]', JSON.stringify(langSettings));
    console.log('[FSE2-LEVELS]', JSON.stringify({ storyLevel, lengthLevel, writerLevel }));

    // -----------------------------------------------------------------------
    // 5b. Enrich characters with appearance_anchor (Avatar V2)
    // -----------------------------------------------------------------------
    const rawChars: any[] = Array.isArray(requestBody.characters) ? requestBody.characters : [];
    let enrichedCharacters = rawChars;

    if (kidProfileId) {
      const anchorMap = new Map<string, string>();

      // 5b-i: Load kid protagonist appearance from kid_appearance table ("My Look")
      try {
        // Load kid profile name + gender for anchor building
        const { data: kidProfileData } = await supabase
          .from('kid_profiles')
          .select('name, gender')
          .eq('id', kidProfileId)
          .maybeSingle();
        const kidProfileName = kidProfileData?.name || kidName || 'Child';
        const kidGenderRaw = kidProfileData?.gender || '';
        const kidGender = (kidGenderRaw === 'male' || kidGenderRaw === 'm' || kidGenderRaw === 'boy')
          ? 'male'
          : (kidGenderRaw === 'female' || kidGenderRaw === 'f' || kidGenderRaw === 'girl')
            ? 'female'
            : null;

        // Load full row: legacy columns + appearance_data (Avatar V2)
        const { data: kidApp } = await supabase
          .from('kid_appearance')
          .select('skin_tone, hair_length, hair_type, hair_style, hair_color, glasses, appearance_data')
          .eq('kid_profile_id', kidProfileId)
          .maybeSingle();

        console.log('[FSE2-ANCHOR-DEBUG] kid_appearance raw result:', JSON.stringify(kidApp));
        console.log('[FSE2-ANCHOR-DEBUG] kidProfileName:', kidProfileName, 'kidGender:', kidGender, 'age:', age);

        if (kidApp) {
          let kidAnchor: string | null = null;

          // Try Avatar V2 (appearance_data JSONB) first
          const hasV2 = kidApp.appearance_data && typeof kidApp.appearance_data === 'object' && Object.keys(kidApp.appearance_data).length > 0;
          console.log('[FSE2-ANCHOR-DEBUG] hasV2:', hasV2, 'appearance_data keys:', kidApp.appearance_data ? Object.keys(kidApp.appearance_data) : 'null');

          if (hasV2) {
            try {
              kidAnchor = buildAnchorFromSlots(
                kidProfileName,
                age || 8,
                kidGender,
                'child',
                kidApp.appearance_data,
              );
              console.log(`[FSE2-ANCHOR-DEBUG] V2 anchor built: "${kidAnchor}"`);
            } catch (v2Err: any) {
              console.warn('[FSE2-ANCHOR-DEBUG] buildAnchorFromSlots failed:', v2Err?.message);
            }
          }

          // Fall back to legacy columns → build simple string directly
          if (!kidAnchor && (kidApp.skin_tone || kidApp.hair_color)) {
            try {
              kidAnchor = buildAppearanceAnchor(
                kidProfileName,
                age || 8,
                kidGender || '',
                {
                  skin_tone: kidApp.skin_tone || '',
                  hair_length: kidApp.hair_length || '',
                  hair_type: kidApp.hair_type || '',
                  hair_style: kidApp.hair_style || '',
                  hair_color: kidApp.hair_color || '',
                  glasses: kidApp.glasses || false,
                },
              );
              console.log(`[FSE2-ANCHOR-DEBUG] legacy anchor built: "${kidAnchor}"`);
            } catch (legacyErr: any) {
              console.warn('[FSE2-ANCHOR-DEBUG] buildAppearanceAnchor failed:', legacyErr?.message);
              // Ultimate fallback: simple string from raw fields
              const parts: string[] = [];
              if (kidApp.hair_length && kidApp.hair_length !== 'medium') parts.push(kidApp.hair_length);
              if (kidApp.hair_type && kidApp.hair_type !== 'straight') parts.push(kidApp.hair_type);
              if (kidApp.hair_color) parts.push(kidApp.hair_color + ' hair');
              if (kidApp.glasses) parts.push('glasses');
              if (parts.length > 0) {
                kidAnchor = parts.join(', ');
                console.log(`[FSE2-ANCHOR-DEBUG] fallback anchor built: "${kidAnchor}"`);
              }
            }
          }

          if (kidAnchor) {
            anchorMap.set(kidProfileName, kidAnchor);
            console.log(`[FSE2-ANCHOR-DEBUG] anchorMap.set("${kidProfileName}", "${kidAnchor}")`);
          } else {
            console.warn('[FSE2-ANCHOR-DEBUG] No anchor could be built for kid protagonist');
          }
        }
      } catch (err: any) {
        console.warn('[FSE2] kid_appearance load failed:', err?.message);
      }

      // 5b-ii: Load side character appearances from kid_characters + character_appearances
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
                anchorMap.set(char.name, buildAnchorFromSlots(
                  char.name,
                  'adult',
                  ca.gender || inferGenderFromRelation(char.relation),
                  ca.age_category || inferAgeCategory(char.role, char.relation),
                  ca.appearance_data,
                ));
              }
            }
          }
        } catch (err: any) {
          console.warn('[FSE2] Avatar V2 character appearance load failed, continuing without:', err?.message);
        }
      }

      console.log('[FSE2-ANCHOR-DEBUG] anchorMap:', JSON.stringify([...anchorMap.entries()]));

      enrichedCharacters = rawChars.map((c: any) => {
        const anchor = anchorMap.get(c.name);
        return anchor ? { ...c, appearance_anchor: anchor } : c;
      });
    }

    console.log('[FSE2] characters enriched with appearance_anchor:',
      enrichedCharacters.map((c: any) => ({ name: c.name, hasAnchor: !!c.appearance_anchor })));

    // Build enriched request for prompt builders
    const enrichedRequest = { ...requestBody, characters: enrichedCharacters };

    // -----------------------------------------------------------------------
    // 6. Load prompts from app_settings
    // -----------------------------------------------------------------------
    async function loadPrompt(key: string): Promise<string | null> {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      return data?.value || null;
    }

    const plannerPrompt = await loadPrompt('system_prompt_planner');
    if (!plannerPrompt) {
      throw new Error('system_prompt_planner not found in app_settings');
    }
    console.log(`[FSE2] Planner prompt loaded from DB (${plannerPrompt.length} chars)`);

    const writerPrompt = await loadPrompt('system_prompt_core_v3');
    if (!writerPrompt) {
      throw new Error('system_prompt_core_v3 not found in app_settings');
    }
    console.log(`[FSE2] Writer prompt loaded (${writerPrompt.length} chars)`);

    // -----------------------------------------------------------------------
    // 6b. Select story subtype
    // -----------------------------------------------------------------------
    const themeKey = requestBody.storyType || 'surprise';
    let selectedSubtype: SelectedSubtype | null = null;
    try {
      selectedSubtype = await selectStorySubtype(
        supabase,
        themeKey,
        kidProfileId,
        age || 8,
        language,
      );
    } catch (err) {
      console.warn('[FSE2] SubtypeSelector error, continuing without subtype:', err);
    }
    console.log('[FSE2-SUBTYPE]', JSON.stringify(selectedSubtype));

    // -----------------------------------------------------------------------
    // 6c. Check heroes_villains flag
    // -----------------------------------------------------------------------
    const specialAbilities: string[] = requestBody.specialAbilities || [];
    const heroesVillains = specialAbilities.includes('heroes_villains');
    console.log('[FSE2] heroesVillains=' + heroesVillains + ' specialAbilities=' + JSON.stringify(specialAbilities));

    // -----------------------------------------------------------------------
    // 6d. Select story path
    // -----------------------------------------------------------------------
    let selectedPath: StoryPathV2 | null = null;
    try {
      const ageGroup = ageToAgeGroupV2(age || 8);

      // Get recent story_path_codes to avoid repetition
      const { data: recentStories } = await supabase
        .from('stories')
        .select('story_path_code')
        .eq('kid_profile_id', kidProfileId)
        .not('story_path_code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
      const recentCodes = (recentStories || []).map((s: any) => s.story_path_code).filter(Boolean);

      // Get total story count for onboarding phase detection
      const { count: storyCount } = await supabase
        .from('stories')
        .select('id', { count: 'exact', head: true })
        .eq('kid_profile_id', kidProfileId);

      selectedPath = await selectNextPathV2(supabase, ageGroup, storyCount ?? 0, recentCodes);
      console.log('[FSE2-PATH] Selected:', JSON.stringify({ code: selectedPath.code, label: selectedPath.label }));
    } catch (pathErr) {
      console.warn('[FSE2-PATH] Path selection failed, continuing without path:', pathErr);
    }

    // -----------------------------------------------------------------------
    // 7. Planner call
    // -----------------------------------------------------------------------
    console.log('[FSE2-PLANNER-INPUT]', JSON.stringify({
      storyType: requestBody.storyType,
      subtype: selectedSubtype?.subtypeKey ?? null,
      characters: enrichedCharacters,
      description: requestBody.description,
      heroesVillains,
    }));

    const planPrompt = buildPlanPromptV2(storyLevel, lengthLevel, enrichedRequest, plannerPrompt, selectedSubtype, heroesVillains, selectedPath);
    console.log('[FSE2-LLM] call params:', {
      caller: 'planner',
      systemPromptLength: planPrompt.systemPrompt.length,
      userMessageLength: planPrompt.userMessage.length,
      temperature: 0.8,
      maxTokens: 8192,
      model: 'claude-sonnet-4-6',
    });
    console.log('[FSE2-PLANNER] Calling LLM...');
    const plannerStart = Date.now();
    const storyPlan = await callLLM(planPrompt.systemPrompt, planPrompt.userMessage, 0.8);
    const plannerMs = Date.now() - plannerStart;
    console.log(`[FSE2-PLANNER] Done in ${plannerMs}ms`);
    console.log('[FSE2-PLANNER]', JSON.stringify(storyPlan));

    // -----------------------------------------------------------------------
    // 7b. Persist story_plan to DB (before Writer, so plan survives Writer errors)
    // -----------------------------------------------------------------------
    const storyId = requestBody.story_id ?? null;
    if (storyId) {
      const { error: planUpdateErr } = await supabase
        .from('stories')
        .update({ story_plan: storyPlan ?? null })
        .eq('id', storyId);
      if (planUpdateErr) {
        console.warn('[FSE2] story_plan DB write failed:', planUpdateErr.message);
      } else {
        console.log('[FSE2] story_plan written to DB for storyId=' + storyId);
      }
    } else {
      console.log('[FSE2] No story_id in request, skipping DB write');
    }

    // -----------------------------------------------------------------------
    // 7c. Extract fields from storyPlan and persist
    // -----------------------------------------------------------------------
    if (storyId) {
      try {
        const cleanPlan = storyPlan.replace(/```json|```/g, '').trim();
        const planJson = JSON.parse(cleanPlan);
        const villainChar = planJson?.characters?.find((c: any) => c.role === 'antagonist');
        const villainName = villainChar?.name ?? null;
        const extracted = planJson?.extracted ?? null;

        const plannerUpdate: Record<string, any> = {};
        if (villainName) plannerUpdate.villain_name = villainName;
        if (extracted?.storyType) plannerUpdate.story_type = extracted.storyType;
        if (selectedPath) plannerUpdate.story_path_code = selectedPath.code;

        if (Object.keys(plannerUpdate).length > 0) {
          await supabase
            .from('stories')
            .update(plannerUpdate)
            .eq('id', storyId);
          console.log('[FSE2] planner update written to DB:', plannerUpdate);
        }
      } catch (parseErr) {
        console.warn('[FSE2] Could not parse storyPlan for field extraction:', parseErr);
      }
    }

    // -----------------------------------------------------------------------
    // 8. Writer call
    // -----------------------------------------------------------------------
    const storyPrompt = buildStoryPromptV2(writerLevel, lengthLevel, storyPlan, enrichedRequest, writerPrompt);
    console.log('[FSE2-WRITER-INPUT] systemPrompt length:', storyPrompt.systemPrompt.length);
    console.log('[FSE2-WRITER-INPUT] userMessage preview:', storyPrompt.userMessage.substring(0, 500));
    console.log('[FSE2-LLM] call params:', {
      caller: 'writer',
      systemPromptLength: storyPrompt.systemPrompt.length,
      userMessageLength: storyPrompt.userMessage.length,
      temperature: 0.8,
      maxTokens: 8192,
      model: 'claude-sonnet-4-6',
    });
    console.log('[FSE2-WRITER] Calling LLM...');
    let writerRaw = await callLLM(storyPrompt.systemPrompt, storyPrompt.userMessage, 0.8);
    console.log(`[FSE2-WRITER] Done (${writerRaw.length} chars)`);

    // Strip markdown code fences if present
    writerRaw = writerRaw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let writerJson: any = {};
    try {
      writerJson = JSON.parse(writerRaw);
    } catch (e) {
      // Try to repair by escaping unescaped double quotes inside string values
      try {
        const repaired = writerRaw.replace(
          /:\s*"((?:[^"\\]|\\.)*)"/g,
          (_match: string, inner: string) => {
            const fixed = inner.replace(/(?<!\\)"/g, '\\"');
            return `: "${fixed}"`;
          }
        );
        writerJson = JSON.parse(repaired);
        console.log('[FSE2-WRITER] JSON repaired, proceeding');
      } catch (_e2) {
        console.error('[FSE2-WRITER] JSON parse failed, raw start:', writerRaw.substring(0, 500));
        throw new Error('Writer output could not be parsed as JSON');
      }
    }

    console.log('[FSE2-WRITER-JSON] classification fields:', JSON.stringify({
      emotional_coloring: writerJson.emotional_coloring,
      emotional_secondary: writerJson.emotional_secondary,
      humor_level: writerJson.humor_level,
      emotional_depth: writerJson.emotional_depth,
      structure_beginning: writerJson.structure_beginning,
      structure_middle: writerJson.structure_middle,
      structure_ending: writerJson.structure_ending,
    }));

    let content = writerJson.content ?? writerRaw;

    // -----------------------------------------------------------------------
    // 8b. Consistency Check (standard path, no series logic)
    // -----------------------------------------------------------------------
    let ccMs = 0;
    let checkOnlyMs = 0;
    let patchMs = 0;
    let recheckMs = 0;
    const ccStart = Date.now();

    const { data: ccPromptRow } = await supabase
      .from('app_settings').select('value')
      .eq('key', 'consistency_check_prompt_v2').maybeSingle();
    const ccPrompt = ccPromptRow?.value;

    if (!ccPrompt) {
      console.log('[FSE2-CC] no prompt found, skipping');
    } else {
      const story = { title: writerJson.title ?? '', content: writerJson.content ?? '' };

      // Initial check
      const ccCheckStart = Date.now();
      const initialResult = await performConsistencyCheck(story, ccPrompt);
      checkOnlyMs = Date.now() - ccCheckStart;

      const initialCritical = initialResult.structuredErrors?.filter(e => e.severity === 'CRITICAL').length ?? 0;
      const initialMedium = initialResult.structuredErrors?.filter(e => e.severity === 'MEDIUM').length ?? 0;
      const initialLow = initialResult.structuredErrors?.filter(e => e.severity === 'LOW').length ?? 0;
      const initialIssueCount = initialResult.structuredErrors?.length ?? 0;
      console.log('[FSE2-CC] initial check:', {
        hasIssues: initialResult.hasIssues,
        criticalCount: initialCritical,
        mediumCount: initialMedium,
        lowCount: initialLow,
        checkOnlyMs,
      });

      let fixedCount = 0;
      let recheckCritical = 0;
      let recheckMedium = 0;
      let recheckLow = 0;
      let recheckIssueCount = 0;

      if (initialResult.hasIssues) {
        // Patch
        const patchStart = Date.now();
        const targetLanguage = requestBody.language || 'DE';
        const corrected = await correctStory(
          { ...story, questions: writerJson.questions ?? [], vocabulary: writerJson.vocabulary ?? [] },
          initialResult.issues,
          initialResult.suggestedFixes,
          targetLanguage,
        );
        patchMs = Date.now() - patchStart;
        writerJson.title = corrected.title;
        writerJson.content = corrected.content;
        content = corrected.content;
        console.log(`[FSE2-CC] story patched in ${patchMs}ms`);

        // Targeted recheck on each structured error
        const recheckStart = Date.now();
        const recheckResults: Array<{ error: SeriesConsistencyError; fixed: boolean }> = [];
        for (const err of initialResult.structuredErrors ?? []) {
          const fixed = await targetedReCheck(writerJson.content, err);
          recheckResults.push({ error: err, fixed });
        }
        recheckMs = Date.now() - recheckStart;

        fixedCount = recheckResults.filter(r => r.fixed).length;
        const unfixedErrors = recheckResults.filter(r => !r.fixed);
        recheckCritical = unfixedErrors.filter(r => r.error.severity === 'CRITICAL').length;
        recheckMedium = unfixedErrors.filter(r => r.error.severity === 'MEDIUM').length;
        recheckLow = unfixedErrors.filter(r => r.error.severity === 'LOW').length;
        recheckIssueCount = unfixedErrors.length;

        console.log('[FSE2-CC] recheck:', {
          total: recheckResults.length,
          fixed: fixedCount,
          unfixed: recheckIssueCount,
          recheckCritical,
          recheckMedium,
          recheckLow,
          recheckMs,
        });
      }

      ccMs = Date.now() - ccStart;
      const patchFixRate = initialIssueCount > 0 ? (initialIssueCount - recheckIssueCount) / initialIssueCount : 0;
      console.log(`[FSE2-CC] completed in ${ccMs}ms (check=${checkOnlyMs}ms, patch=${patchMs}ms, recheck=${recheckMs}ms, fixRate=${patchFixRate.toFixed(2)})`);

      // Save to consistency_check_results
      try {
        await supabase.from('consistency_check_results').insert({
          story_id: storyId || null,
          story_title: writerJson.title ?? '',
          story_length: requestBody.length ?? null,
          difficulty: requestBody.difficulty ?? null,
          issues_found: initialIssueCount,
          issues_corrected: fixedCount,
          issue_details: initialResult.issues,
          user_id: requestBody.user_id || null,
        });
        console.log('[FSE2-CC] results saved to consistency_check_results');
      } catch (dbErr) {
        console.warn('[FSE2-CC] Error saving CC results:', dbErr);
      }

      // Write metrics to stories table (counts from recheck = remaining unfixed issues)
      if (storyId) {
        try {
          await supabase.from('stories').update({
            planner_ms: plannerMs,
            consistency_check_ms: ccMs,
            checker_critical: recheckCritical,
            checker_medium: recheckMedium,
            checker_low: recheckLow,
            consistency_check_only_ms: checkOnlyMs,
            patch_ms: patchMs,
            recheck_ms: recheckMs,
            patch_fix_rate: patchFixRate,
            critical_patch_failed: recheckCritical > 0,
            emotional_coloring: writerJson.emotional_coloring ?? null,
            emotional_secondary: writerJson.emotional_secondary ?? null,
            humor_level: writerJson.humor_level ?? null,
            emotional_depth: writerJson.emotional_depth ?? null,
          }).eq('id', storyId);
          console.log('[FSE2-CC] metrics written to stories table');
        } catch (dbErr) {
          console.warn('[FSE2-CC] Error writing metrics:', dbErr);
        }
      }
    }

    // -----------------------------------------------------------------------
    // 8c. Image generation (skipped — CC testing mode)
    // -----------------------------------------------------------------------
    console.log('[FSE2-CC] image generation skipped (CC testing mode)');

    // -----------------------------------------------------------------------
    // 9. Return response (matches FSE1 shape for frontend compatibility)
    // -----------------------------------------------------------------------
    const totalTime = Date.now() - startTime;
    console.log(`[FSE2] Pipeline complete in ${totalTime}ms`);

    return new Response(JSON.stringify({
      content,
      title: writerJson.title ?? '',
      image_plan: writerJson.image_plan ?? null,
      questions: writerJson.questions ?? [],
      story_plan: storyPlan,
      generationTimeMs: totalTime,
      performance: {
        story_generation_ms: totalTime - ccMs,
        image_generation_ms: 0,
        consistency_check_ms: ccMs,
        total_ms: totalTime,
      },
      used_fse2: true,
      fse2_meta: {
        content_level: langSettings.content_level,
        language_level: langSettings.language_level,
        length_level: langSettings.length_level,
        paragraph_count: lengthLevel.paragraph_count,
        word_approx: lengthLevel.word_approx,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.error('[FSE2-ERROR]', msg, stack);

    // Return a valid FSE1-compatible dummy response so UI doesn't crash
    const totalTime = Date.now() - startTime;
    return new Response(JSON.stringify({
      content: `[FSE2-ERROR] ${msg}`,
      title: 'FSE2 Error',
      generationTimeMs: totalTime,
      performance: {
        story_generation_ms: totalTime,
        image_generation_ms: 0,
        consistency_check_ms: 0,
        total_ms: totalTime,
      },
      used_fse2: true,
      fse2_error: msg,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
