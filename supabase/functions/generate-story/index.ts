import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildStoryPrompt, injectLearningTheme, StoryRequest, EPISODE_CONFIG } from '../_shared/promptBuilder.ts';
import { shouldApplyLearningTheme } from '../_shared/learningThemeRotation.ts';
import { buildImagePrompts, buildFallbackImagePrompt, loadImageRules, ImagePromptResult, SeriesImageContext } from '../_shared/imagePromptBuilder.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-legacy-token, x-legacy-user-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// API endpoints
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_IMAGE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const VERTEX_AI_URL = "https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/endpoints/openapi/models/gemini-2.5-flash:generateContent";

// Helper function to count words in a text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Helper function to sleep for a given number of milliseconds
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to create a hash for image prompt caching
async function hashPrompt(prompt: string): Promise<string> {
  const normalized = prompt.toLowerCase().replace(/\s+/g, ' ').trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to get cached image
async function getCachedImage(supabase: any, prompt: string): Promise<string | null> {
  try {
    const promptHash = await hashPrompt(prompt);
    const { data } = await supabase
      .from('image_cache')
      .select('image_url')
      .eq('prompt_hash', promptHash)
      .single();
    
    if (data?.image_url) {
      console.log(`Cache HIT for prompt hash: ${promptHash}`);
      // Update usage stats
      await supabase
        .from('image_cache')
        .update({ 
          last_used_at: new Date().toISOString(),
          use_count: (data.use_count || 1) + 1
        })
        .eq('prompt_hash', promptHash);
      return data.image_url;
    }
    console.log(`Cache MISS for prompt hash: ${promptHash}`);
    return null;
  } catch (error) {
    console.log('Error checking image cache:', error);
    return null;
  }
}

// Helper function to cache image
async function cacheImage(supabase: any, prompt: string, imageUrl: string): Promise<void> {
  try {
    const promptHash = await hashPrompt(prompt);
    await supabase
      .from('image_cache')
      .upsert({
        prompt_hash: promptHash,
        prompt_text: prompt.substring(0, 500), // Store first 500 chars for debugging
        image_url: imageUrl,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'prompt_hash' });
    console.log(`Cached image for prompt hash: ${promptHash}`);
  } catch (error) {
    console.log('Error caching image:', error);
  }
}

// Extract a generated image data URL (or b64) from Lovable AI Gateway response
function extractGatewayImageUrl(data: any): string | null {
  const img = data?.choices?.[0]?.message?.images?.[0];
  if (!img) return null;

  // OpenAI-style nested object
  const nestedUrl = img?.image_url?.url;
  if (typeof nestedUrl === "string" && nestedUrl.length > 0) return nestedUrl;

  // Some gateways return a direct string
  const directUrl = img?.image_url;
  if (typeof directUrl === "string" && directUrl.length > 0) return directUrl;

  // Some providers return b64_json
  const b64 = img?.b64_json;
  if (typeof b64 === "string" && b64.length > 0) {
    return `data:image/png;base64,${b64}`;
  }

  return null;
}

// Helper function to call Lovable AI Gateway for text generation (better rate limits)
async function callLovableAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.8,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 2s, 4s, 8s...
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }
    
    try {
      const response = await fetch(LOVABLE_AI_GATEWAY, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature,
        }),
      });

      if (response.status === 429) {
        console.log(`Lovable AI rate limited (attempt ${attempt + 1}/${maxRetries})`);
        lastError = new Error("Rate limited");
        continue;
      }

      if (response.status === 402) {
        throw new Error("Payment required - please add credits to your Lovable workspace");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI Gateway error:", response.status, errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content in AI response");
      }
      
      return content;
    } catch (error) {
      if (error instanceof Error && error.message === "Rate limited") {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

// Interface for consistency check result (standard single-story)
interface ConsistencyCheckResult {
  hasIssues: boolean;
  issues: string[];
  suggestedFixes: string;
}

// Interface for series consistency check result (Phase 4)
interface SeriesConsistencyError {
  category: 'LOGIC' | 'GRAMMAR' | 'LANGUAGE' | 'CHARACTER' | 'CONTINUITY' | 'EPISODE_FUNCTION' | 'SIGNATURE';
  severity: 'CRITICAL' | 'MEDIUM' | 'LOW';
  original: string;
  problem: string;
  fix: string;
}

interface SeriesConsistencyCheckResult {
  errors_found: boolean;
  summary: string;
  errors: SeriesConsistencyError[];
  stats: { critical: number; medium: number; low: number };
}

// Helper function to fetch consistency check prompt from database
async function getConsistencyCheckPrompt(language: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const promptKey = `system_prompt_consistency_check_${language}`;
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", promptKey)
      .maybeSingle();
    
    return data?.value || null;
  } catch (error) {
    console.error("Error fetching consistency check prompt:", error);
    return null;
  }
}

// Helper function to perform consistency check on generated story
async function performConsistencyCheck(
  apiKey: string,
  story: { title: string; content: string },
  checkPrompt: string,
  seriesContext?: { previousEpisode?: string; episodeNumber?: number }
): Promise<ConsistencyCheckResult> {
  const seriesInfo = seriesContext?.previousEpisode 
    ? `\n\n--- SERIEN-KONTEXT (Episode ${seriesContext.episodeNumber}) ---\nVorherige Episode:\n${seriesContext.previousEpisode.substring(0, 1500)}...`
    : '';

  const userPrompt = `Prüfe diese Geschichte auf Qualität und Konsistenz:

TITEL: ${story.title}

INHALT:
${story.content}
${seriesInfo}

Analysiere den Text und antworte NUR mit einem JSON-Objekt in diesem Format:
{
  "hasIssues": true/false,
  "issues": ["Liste der gefundenen Probleme"],
  "suggestedFixes": "Konkrete Anweisungen zur Korrektur aller Probleme in einem zusammenhängenden Text"
}

Falls keine Probleme gefunden: {"hasIssues": false, "issues": [], "suggestedFixes": ""}`;

  try {
    const response = await callLovableAI(apiKey, checkPrompt, userPrompt, 0.3);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("Could not parse consistency check response, assuming no issues");
      return { hasIssues: false, issues: [], suggestedFixes: "" };
    }
    
    const result = JSON.parse(jsonMatch[0]);
    return {
      hasIssues: result.hasIssues === true,
      issues: Array.isArray(result.issues) ? result.issues : [],
      suggestedFixes: result.suggestedFixes || ""
    };
  } catch (error) {
    console.error("Error in consistency check:", error);
    return { hasIssues: false, issues: [], suggestedFixes: "" };
  }
}

// ── Phase 4: Series Consistency Check ──

/**
 * Build the series-specific consistency check prompt.
 * Uses EPISODE_CONFIG for episode function context and continuity_state for cross-episode checks.
 */
function buildSeriesConsistencyPrompt(
  episodeNumber: number,
  storyLanguage: string,
  childAge: number,
  continuityState: any | null,
): string {
  const config = EPISODE_CONFIG[episodeNumber] || EPISODE_CONFIG[5];

  const ageMin = Math.max(4, childAge - 1);
  const ageMax = childAge + 1;

  const continuityBlock = continuityState
    ? `\nPREVIOUS EPISODES CONTEXT (continuity_state from last episode):\n${JSON.stringify(continuityState, null, 2)}`
    : '\nPREVIOUS EPISODES CONTEXT: This is Episode 1 – no previous context.';

  return `You are a children's story editor checking EPISODE ${episodeNumber} of a 5-episode series.

Target audience: children age ${ageMin}-${ageMax}.
Story language: ${storyLanguage}.
Episode function: ${config.function_name} – ${config.function_description}
Required ending type: ${config.required_ende}
${continuityBlock}

CHECK FOR:
1. LOGIC: spatial impossibilities, time contradictions, characters knowing things they shouldn't, objects appearing/disappearing
2. GRAMMAR: errors in ${storyLanguage} grammar, spelling, punctuation. Missing spaces after punctuation marks.
3. AGE-APPROPRIATENESS: overly complex vocabulary or sentence structures for age ${ageMin}-${ageMax}
4. CHARACTER CONSISTENCY: names, appearance, relationships, abilities must match BOTH this episode AND the continuity state from previous episodes
5. CONTINUITY: facts from previous episodes must not be contradicted. World rules must be respected. Timeline between episodes must be plausible.
6. EPISODE FUNCTION: Does this episode fulfill its dramatic role as "${config.function_name}"? Does the ending match the required type?
7. SIGNATURE ELEMENT: Is the recurring element present and varied from previous usage?

RULES:
- Be strict on CONTINUITY and CHARACTER errors (these break the series)
- Be strict on logic errors and grammar
- Be lenient on creative/stylistic choices — this is children's fiction
- Report each error only ONCE
- Quote the EXACT original text so it can be found
- All your analysis and corrections must be in ${storyLanguage}
- CONTINUITY errors with severity CRITICAL must trigger a correction attempt

Respond ONLY with this JSON:
{"errors_found": boolean,
 "summary": "Brief summary in ${storyLanguage}",
 "errors": [{"category": "LOGIC|GRAMMAR|LANGUAGE|CHARACTER|CONTINUITY|EPISODE_FUNCTION|SIGNATURE", "severity": "CRITICAL|MEDIUM|LOW", "original": "exact quote from text", "problem": "what is wrong", "fix": "suggested correction"}],
 "stats": {"critical": 0, "medium": 0, "low": 0}}`;
}

/**
 * Perform the series-specific consistency check.
 * Returns structured errors with categories and severities.
 */
async function performSeriesConsistencyCheck(
  apiKey: string,
  story: { title: string; content: string },
  systemPrompt: string,
): Promise<SeriesConsistencyCheckResult> {
  const userPrompt = `CHECK THIS EPISODE:

TITLE: ${story.title}

CONTENT:
${story.content}

Respond ONLY with the JSON object as specified.`;

  try {
    const response = await callLovableAI(apiKey, systemPrompt, userPrompt, 0.3);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("[Phase4] Could not parse series consistency check response");
      return { errors_found: false, summary: '', errors: [], stats: { critical: 0, medium: 0, low: 0 } };
    }

    const result = JSON.parse(jsonMatch[0]);
    const errors: SeriesConsistencyError[] = Array.isArray(result.errors)
      ? result.errors.map((e: any) => ({
          category: e.category || 'LOGIC',
          severity: e.severity || 'LOW',
          original: e.original || '',
          problem: e.problem || '',
          fix: e.fix || '',
        }))
      : [];

    const stats = {
      critical: errors.filter(e => e.severity === 'CRITICAL').length,
      medium: errors.filter(e => e.severity === 'MEDIUM').length,
      low: errors.filter(e => e.severity === 'LOW').length,
    };

    return {
      errors_found: result.errors_found === true || errors.length > 0,
      summary: result.summary || '',
      errors,
      stats,
    };
  } catch (error) {
    console.error("[Phase4] Error in series consistency check:", error);
    return { errors_found: false, summary: '', errors: [], stats: { critical: 0, medium: 0, low: 0 } };
  }
}

/**
 * Correct story based on series consistency check errors.
 * Includes the continuity_state so the LLM knows what's canon.
 */
async function correctStoryFromSeriesErrors(
  apiKey: string,
  story: { title: string; content: string; questions: any[]; vocabulary: any[] },
  errors: SeriesConsistencyError[],
  continuityState: any | null,
  targetLanguage: string,
): Promise<{ title: string; content: string; questions: any[]; vocabulary: any[] }> {
  const errorList = errors
    .map((e, i) => `${i + 1}. [${e.category}/${e.severity}] "${e.original}" → Problem: ${e.problem} → Fix: ${e.fix}`)
    .join('\n');

  const continuityRef = continuityState
    ? `\n\nCANON REFERENCE (continuity_state – this is the truth):\n${JSON.stringify(continuityState, null, 2)}`
    : '';

  const correctionPrompt = `You are a children's story editor. Correct the following story based on the errors found.

IMPORTANT:
- Keep the language (${targetLanguage})
- Keep the style and structure
- ONLY fix the listed errors – do NOT rewrite the entire story
- The story must remain age-appropriate
- For CONTINUITY and CHARACTER errors: the continuity_state is the source of truth${continuityRef}`;

  const userPrompt = `Correct this story:

TITLE: ${story.title}

CONTENT:
${story.content}

ERRORS TO FIX:
${errorList}

Respond ONLY with a JSON object:
{"title": "Corrected title (or original if no title error)", "content": "The fully corrected text"}`;

  try {
    const response = await callLovableAI(apiKey, correctionPrompt, userPrompt, 0.5);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Phase4] Could not parse series correction response");
      return story;
    }

    const corrected = JSON.parse(jsonMatch[0]);
    return {
      title: corrected.title || story.title,
      content: corrected.content || story.content,
      questions: story.questions,
      vocabulary: story.vocabulary,
    };
  } catch (error) {
    console.error("[Phase4] Error correcting story from series errors:", error);
    return story;
  }
}

// Helper function to correct story based on consistency check results (standard, non-series)
async function correctStory(
  apiKey: string,
  story: { title: string; content: string; questions: any[]; vocabulary: any[] },
  issues: string[],
  suggestedFixes: string,
  targetLanguage: string
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
    const response = await callLovableAI(apiKey, correctionPrompt, userPrompt, 0.5);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse correction response");
      return story;
    }
    
    const corrected = JSON.parse(jsonMatch[0]);
    return {
      title: corrected.title || story.title,
      content: corrected.content || story.content,
      questions: story.questions,
      vocabulary: story.vocabulary
    };
  } catch (error) {
    console.error("Error correcting story:", error);
    return story;
  }
}

// Helper function to call Lovable AI Gateway for IMAGE generation (fallback when Gemini is rate-limited)
async function callLovableImageGenerate(
  apiKey: string,
  prompt: string,
  maxRetries: number = 3
): Promise<string | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      // Slightly longer backoff for images
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`Lovable image rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }

    // Try the fast image model first, then a higher-quality fallback model.
    const tryModels = [
      "google/gemini-2.5-flash-image",
      "google/gemini-3-pro-image-preview",
    ];

    let imageUrl: string | null = null;

    for (const model of tryModels) {
      const response = await fetch(LOVABLE_AI_GATEWAY, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (response.status === 429) {
        lastError = new Error("Rate limited");
        imageUrl = null;
        break; // handle retry outside
      }

      if (response.status === 402) {
        throw new Error("Payment required");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable image gateway error:", response.status, errorText);
        // Try next model (if any)
        continue;
      }

      const data = await response.json();
      imageUrl = extractGatewayImageUrl(data);
      if (typeof imageUrl === "string" && imageUrl.length > 0) {
        return imageUrl;
      }

      console.error("Lovable image gateway returned no image for model:", model);
    }

    if (lastError?.message === "Rate limited") {
      continue;
    }

    return null;
  }

  if (lastError) throw lastError;
  return null;
}

// Helper function to call Lovable AI Gateway for IMAGE editing (keeps character consistency via reference image)
async function callLovableImageEdit(
  apiKey: string,
  prompt: string,
  referenceImageDataUrl: string,
  maxRetries: number = 3
): Promise<string | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`Lovable image edit rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }

    const tryModels = [
      "google/gemini-2.5-flash-image",
      "google/gemini-3-pro-image-preview",
    ];

    for (const model of tryModels) {
      const response = await fetch(LOVABLE_AI_GATEWAY, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: referenceImageDataUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (response.status === 429) {
        lastError = new Error("Rate limited");
        break;
      }

      if (response.status === 402) {
        throw new Error("Payment required");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable image edit gateway error:", response.status, errorText);
        continue;
      }

      const data = await response.json();
      const imageUrl = extractGatewayImageUrl(data);
      if (typeof imageUrl === "string" && imageUrl.length > 0) {
        return imageUrl;
      }

      console.error("Lovable image edit gateway returned no image for model:", model);
    }

    if (lastError?.message === "Rate limited") {
      continue;
    }

    return null;
  }

  if (lastError) throw lastError;
  return null;
}

// ── JWT Signing for Google Service Account → OAuth2 Access Token ──

// Base64url encode helper
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

// Parse PEM private key to CryptoKey
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

// Cache for OAuth2 access tokens (avoid re-signing JWT every call)
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getVertexAccessToken(serviceAccountJson: string): Promise<string> {
  // Check cache (with 60s buffer)
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

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    console.error('[VERTEX-AUTH] Token exchange failed:', err);
    throw new Error(`Vertex OAuth2 token exchange failed: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
  console.log('[VERTEX-AUTH] Successfully obtained OAuth2 access token');
  return cachedAccessToken.token;
}

// Helper function to call Vertex AI for image generation (proper OAuth2 auth)
async function callVertexImageAPI(
  serviceAccountJson: string,
  prompt: string,
  maxRetries: number = 3
): Promise<string | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`[VERTEX-IMAGE] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }
    
    try {
      const sa = JSON.parse(serviceAccountJson);
      const projectId = sa.project_id || "fablino-prod";
      const accessToken = await getVertexAccessToken(serviceAccountJson);
      
      const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent`;
      
      const response = await fetch(vertexUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      });

      if (response.status === 429) {
        console.log(`[VERTEX-IMAGE] Rate limited (attempt ${attempt + 1}/${maxRetries})`);
        lastError = new Error("Rate limited");
        continue;
      }

      if (response.status === 403 || response.status === 401) {
        const errorText = await response.text();
        console.error(`[VERTEX-IMAGE] Auth error (${response.status}):`, errorText);
        // Invalidate cached token on auth errors
        cachedAccessToken = null;
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[VERTEX-IMAGE] Error (${response.status}):`, errorText);
        return null;
      }

      const data = await response.json();
      
      // Look for inline_data with image in the response
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          console.log(`[VERTEX-IMAGE] Successfully generated image`);
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
      
      console.error("[VERTEX-IMAGE] No image found in response");
      return null;
    } catch (error) {
      console.error("[VERTEX-IMAGE] Request error:", error);
      if (error instanceof Error && error.message.includes("OAuth2")) {
        cachedAccessToken = null; // Reset on auth errors
      }
      return null;
    }
  }
  
  console.log("[VERTEX-IMAGE] Max retries exceeded");
  return null;
}

// Helper function to call Gemini Consumer API (fallback only)
async function callGeminiImageAPI(
  apiKey: string,
  prompt: string,
  maxRetries: number = 3
): Promise<string | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`[GEMINI-CONSUMER-IMAGE] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }
    
    try {
      const response = await fetch(`${GEMINI_IMAGE_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseModalities: ["image", "text"],
          },
        }),
      });

      if (response.status === 429) {
        console.log(`[GEMINI-CONSUMER-IMAGE] Rate limited (attempt ${attempt + 1}/${maxRetries})`);
        lastError = new Error("Rate limited");
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GEMINI-CONSUMER-IMAGE] Error:", response.status, errorText);
        return null;
      }

      const data = await response.json();
      
      // Look for inline_data with image in the response
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
      
      console.error("[GEMINI-CONSUMER-IMAGE] No image found in response");
      return null;
    } catch (error) {
      console.error("[GEMINI-CONSUMER-IMAGE] Error:", error);
      return null;
    }
  }
  
  console.log("[GEMINI-CONSUMER-IMAGE] Max retries exceeded");
  return null;
}

// Helper function to call Vertex AI for image editing (with reference image)
async function callVertexImageEditAPI(
  serviceAccountJson: string,
  prompt: string,
  referenceImageBase64: string,
  maxRetries: number = 3
): Promise<string | null> {
  // Extract base64 data and mime type from data URL
  const matches = referenceImageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    console.error("[VERTEX-EDIT] Invalid base64 image format");
    return null;
  }
  const mimeType = matches[1];
  const base64Data = matches[2];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`[VERTEX-EDIT] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }
    
    try {
      const sa = JSON.parse(serviceAccountJson);
      const projectId = sa.project_id || "fablino-prod";
      const accessToken = await getVertexAccessToken(serviceAccountJson);
      
      const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent`;
      
      const response = await fetch(vertexUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { 
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      });

      if (response.status === 429) {
        console.log(`[VERTEX-EDIT] Rate limited (attempt ${attempt + 1}/${maxRetries})`);
        continue;
      }

      if (response.status === 403 || response.status === 401) {
        const errorText = await response.text();
        console.error(`[VERTEX-EDIT] Auth error (${response.status}):`, errorText);
        cachedAccessToken = null;
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[VERTEX-EDIT] Error (${response.status}):`, errorText);
        return null;
      }

      const data = await response.json();
      
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          const imgBase64Data = part.inlineData.data;
          const imgMimeType = part.inlineData.mimeType;
          console.log(`[VERTEX-EDIT] Successfully edited image`);
          return `data:${imgMimeType};base64,${imgBase64Data}`;
        }
      }
      
      console.error("[VERTEX-EDIT] No image found in response");
      return null;
    } catch (error) {
      console.error("[VERTEX-EDIT] Request error:", error);
      return null;
    }
  }
  
  console.log("[VERTEX-EDIT] Max retries exceeded");
  return null;
}

// Helper function to call Gemini Consumer API for image editing (fallback only)
async function callGeminiImageEditAPI(
  apiKey: string,
  prompt: string,
  referenceImageBase64: string,
  maxRetries: number = 3
): Promise<string | null> {
  // Extract base64 data and mime type from data URL
  const matches = referenceImageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    console.error("[GEMINI-CONSUMER-EDIT] Invalid base64 image format");
    return null;
  }
  const mimeType = matches[1];
  const base64Data = matches[2];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`[GEMINI-CONSUMER-EDIT] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }
    
    try {
      const response = await fetch(`${GEMINI_IMAGE_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { 
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["image", "text"],
          },
        }),
      });

      if (response.status === 429) {
        console.log(`[GEMINI-CONSUMER-EDIT] Rate limited (attempt ${attempt + 1}/${maxRetries})`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[GEMINI-CONSUMER-EDIT] Error:", response.status, errorText);
        return null;
      }

      const data = await response.json();
      
      // Look for inline_data with image in the response
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          const imgBase64Data = part.inlineData.data;
          const imgMimeType = part.inlineData.mimeType;
          return `data:${imgMimeType};base64,${imgBase64Data}`;
        }
      }
      
      console.error("[GEMINI-CONSUMER-EDIT] No image found in response");
      return null;
    } catch (error) {
      console.error("[GEMINI-CONSUMER-EDIT] Error:", error);
      return null;
    }
  }
  
  console.log("[GEMINI-CONSUMER-EDIT] Max retries exceeded");
  return null;
}

// Generate a single image with caching support
async function generateImageWithCache(
  supabase: any,
  geminiKey: string,
  lovableKey: string,
  prompt: string,
  useEdit: boolean = false,
  referenceImage?: string
): Promise<string | null> {
  // Check cache first
  const cached = await getCachedImage(supabase, prompt);
  if (cached) {
    return cached;
  }

  // Generate new image — Vertex AI FIRST (primary), Lovable Gateway as fallback
  let imageUrl: string | null = null;
  
  if (useEdit && referenceImage) {
    // Try Vertex AI first for edits
    if (geminiKey) {
      imageUrl = await callVertexImageEditAPI(geminiKey, prompt, referenceImage);
    }
    if (!imageUrl && lovableKey) {
      console.log('[IMAGE-PIPELINE] Vertex AI edit failed, trying Lovable Gateway...');
      imageUrl = await callLovableImageEdit(lovableKey, prompt, referenceImage);
    }
  } else {
    // Try Vertex AI first for generation
    if (geminiKey) {
      imageUrl = await callVertexImageAPI(geminiKey, prompt);
    }
    if (!imageUrl && lovableKey) {
      console.log('[IMAGE-PIPELINE] Vertex AI generate failed, trying Lovable Gateway...');
      imageUrl = await callLovableImageGenerate(lovableKey, prompt);
    }
  }

  // Cache the result if successful
  if (imageUrl) {
    await cacheImage(supabase, prompt, imageUrl);
  }

  return imageUrl;
}

// ── Phase 2: Load series context from previous episodes ──
interface SeriesEpisodeRow {
  episode_number: number;
  title: string;
  episode_summary: string | null;
  continuity_state: any | null;
  visual_style_sheet: any | null;
}

async function loadSeriesContext(
  supabase: any,
  seriesId: string,
  currentEpisodeNumber: number
): Promise<{
  previousEpisodes: Array<{ episode_number: number; title: string; episode_summary?: string }>;
  lastContinuityState: any | null;
  visualStyleSheet: any | null;
}> {
  const { data: episodes, error } = await supabase
    .from('stories')
    .select('episode_number, title, episode_summary, continuity_state, visual_style_sheet')
    .eq('series_id', seriesId)
    .lt('episode_number', currentEpisodeNumber)
    .order('episode_number', { ascending: true });

  if (error) {
    console.error('[loadSeriesContext] Error loading previous episodes:', error.message);
    return { previousEpisodes: [], lastContinuityState: null, visualStyleSheet: null };
  }

  if (!episodes || episodes.length === 0) {
    console.log('[loadSeriesContext] No previous episodes found for series:', seriesId);
    return { previousEpisodes: [], lastContinuityState: null, visualStyleSheet: null };
  }

  const rows = episodes as SeriesEpisodeRow[];
  console.log(`[loadSeriesContext] Loaded ${rows.length} previous episode(s) for series ${seriesId}`);

  // Build summary list
  const previousEpisodes = rows.map(r => ({
    episode_number: r.episode_number,
    title: r.title || `Episode ${r.episode_number}`,
    episode_summary: r.episode_summary || undefined,
  }));

  // Get continuity_state from the most recent previous episode
  const lastEpisode = rows[rows.length - 1];
  const lastContinuityState = lastEpisode?.continuity_state || null;

  // visual_style_sheet is always from Episode 1
  const ep1 = rows.find(r => r.episode_number === 1);
  const visualStyleSheet = ep1?.visual_style_sheet || null;

  return { previousEpisodes, lastContinuityState, visualStyleSheet };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { 
      length, 
      difficulty, 
      description, 
      schoolLevel, 
      textType, 
      textLanguage, 
      globalLanguage, 
      customSystemPrompt, 
      endingType, 
      episodeNumber, 
      seriesId, 
      userId,
      // New modular parameters
      source = 'admin', // 'admin' or 'kid'
      isSeries = false,
      storyType,
      characters,
      locations,
      timePeriod,
      kidName,
      kidHobbies,
      // Block 2.3c: New dynamic prompt parameters
      kidProfileId,
      kidAge,
      difficultyLevel,
      contentSafetyLevel,
      themeKey,
      storyLanguage: storyLanguageParam,  // 'fr', 'de', 'en', etc.
      storyLength,                        // 'short' | 'medium' | 'long'
      includeSelf,
      selectedCharacters,                 // Array<{name, age?, relation?, description?}>
      specialAbilities,                   // string[]
      userPrompt: userPromptParam,        // free text from user
      seriesContext,                       // summary of previous episodes
      // Block 2.3e: surprise_characters flag
      surprise_characters: surpriseCharactersParam,
      // Modus B: Interactive series
      seriesMode: seriesModeParam,     // 'normal' | 'interactive' | undefined
      branchChosen: branchChosenParam, // option title chosen by child (from frontend)
    } = await req.json();

    // Block 2.3d/e: Debug logging for character data from frontend
    console.log('[generate-story] Request body characters:', JSON.stringify(characters, null, 2));
    console.log('[generate-story] Request body selectedCharacters:', JSON.stringify(selectedCharacters, null, 2));
    console.log('[generate-story] include_self:', includeSelf);
    console.log('[generate-story] surprise_characters:', surpriseCharactersParam);
    console.log('[generate-story] storyType:', storyType);

    // ── Resolve episode number: CreateStoryPage sends no episodeNumber for Ep1, so default to 1 if isSeries ──
    const resolvedEpisodeNumber: number | undefined = episodeNumber || (isSeries ? 1 : undefined);

    // ── Phase 0.2: Auto-finalize series at Episode 5 ──
    // Override ending_type to 'A' (complete) for Episode 5+, regardless of what frontend sends.
    // This ensures no cliffhanger is generated for the final episode.
    let resolvedEndingType = endingType;
    if (seriesId && resolvedEpisodeNumber && resolvedEpisodeNumber >= 5) {
      console.log(`[generate-story] Series finale override: Episode ${resolvedEpisodeNumber} → ending_type 'A' (was '${endingType}')`);
      resolvedEndingType = 'A';
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ================== MODULAR PROMPT LOADING ==================
    const adminLangCode = (textLanguage || 'DE').toLowerCase();

    // Helper function to load a prompt from app_settings
    async function loadPrompt(key: string): Promise<string | null> {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      return data?.value || null;
    }

    // ── Block 2.3c: NEW dynamic prompt path with FALLBACK ──
    let fullSystemPromptFinal: string = "";
    let userMessageFinal: string = "";
    let usedNewPromptPath = false;
    let learningThemeApplied: string | null = null;

    // Resolve the effective story language (new param > textLanguage mapping > default)
    const effectiveStoryLanguage = storyLanguageParam
      || (textLanguage ? textLanguage.toLowerCase() : 'fr');

    // ── Phase 2: Load series context for episodes 2+ (MUST be outside try/catch for image pipeline) ──
    let seriesContextData: {
      previousEpisodes: Array<{ episode_number: number; title: string; episode_summary?: string }>;
      lastContinuityState: any | null;
      visualStyleSheet: any | null;
    } = { previousEpisodes: [], lastContinuityState: null, visualStyleSheet: null };

    if (seriesId && episodeNumber && episodeNumber > 1) {
      console.log(`[generate-story] Loading series context for series=${seriesId}, episode=${episodeNumber}`);
      seriesContextData = await loadSeriesContext(supabase, seriesId, episodeNumber);
      console.log(`[generate-story] Series context loaded: ${seriesContextData.previousEpisodes.length} previous episodes, continuity=${!!seriesContextData.lastContinuityState}, styleSheet=${!!seriesContextData.visualStyleSheet}`);
    }

    // ── Modus B: Resolve series mode ──
    // If not sent in request, load from Episode 1 of the series (ensures Ep2+ inherit it)
    let seriesMode: string | undefined = seriesModeParam || undefined;
    if (!seriesMode && seriesId) {
      try {
        const { data: ep1 } = await supabase
          .from('stories')
          .select('series_mode')
          .eq('series_id', seriesId)
          .eq('episode_number', 1)
          .maybeSingle();
        if (!ep1) {
          // Fallback: Episode 1 may have series_id = its own id (self-ref)
          const { data: ep1Self } = await supabase
            .from('stories')
            .select('series_mode')
            .eq('id', seriesId)
            .maybeSingle();
          if (ep1Self?.series_mode) seriesMode = ep1Self.series_mode;
        } else if (ep1.series_mode) {
          seriesMode = ep1.series_mode;
        }
        if (seriesMode) {
          console.log(`[generate-story] series_mode loaded from DB: ${seriesMode}`);
        }
      } catch (e) {
        console.warn('[generate-story] Failed to load series_mode from DB:', e);
      }
    }

    // ── Modus B (C.2): Load chosen option from previous episode ──
    let branchChosenTitle: string | undefined;
    let branchChosenPreview: string | undefined;
    let branchChosenDirection: string | undefined;

    if (seriesMode === 'interactive' && seriesId && episodeNumber && episodeNumber > 1) {
      try {
        const { data: prevBranch } = await supabase
          .from('story_branches')
          .select('options, chosen_option_id')
          .eq('series_id', seriesId)
          .eq('episode_number', episodeNumber - 1)
          .single();

        if (prevBranch?.chosen_option_id && prevBranch?.options) {
          const opts = Array.isArray(prevBranch.options) ? prevBranch.options : [];
          const chosenOption = opts.find((opt: any) => opt.option_id === prevBranch.chosen_option_id);
          if (chosenOption) {
            branchChosenTitle = chosenOption.title;
            branchChosenPreview = chosenOption.preview;
            branchChosenDirection = chosenOption.direction;
            console.log(`[BRANCH] Loaded child choice for Ep${episodeNumber - 1}: "${branchChosenTitle}" (${branchChosenDirection})`);
          } else {
            console.warn(`[BRANCH] chosen_option_id=${prevBranch.chosen_option_id} not found in options`);
          }
        } else {
          // Fallback: use branchChosen from frontend if available
          if (branchChosenParam) {
            branchChosenTitle = branchChosenParam;
            console.log(`[BRANCH] Using branchChosen from frontend: "${branchChosenTitle}"`);
          } else {
            console.warn(`[BRANCH] No branch choice found for Ep${episodeNumber - 1} of series ${seriesId}`);
          }
        }
      } catch (branchErr: any) {
        console.error(`[BRANCH] Error loading previous branch:`, branchErr.message);
      }
    }

    // ── Modus B (C.3): Load all branch choices for Ep5 finale recap ──
    let seriesAllBranches: Array<{ episode_number: number; chosen_title: string }> | undefined;

    if (seriesMode === 'interactive' && seriesId && episodeNumber === 5) {
      try {
        const { data: allBranches } = await supabase
          .from('story_branches')
          .select('episode_number, options, chosen_option_id')
          .eq('series_id', seriesId)
          .order('episode_number');

        if (allBranches && allBranches.length > 0) {
          seriesAllBranches = allBranches.map((b: any) => {
            const opts = Array.isArray(b.options) ? b.options : [];
            const chosen = opts.find((opt: any) => opt.option_id === b.chosen_option_id);
            return {
              episode_number: b.episode_number,
              chosen_title: chosen?.title ?? 'unbekannt',
            };
          });
          console.log(`[BRANCH] Loaded ${seriesAllBranches.length} branch choices for Ep5 finale recap:`,
            JSON.stringify(seriesAllBranches));
        }
      } catch (branchErr: any) {
        console.error(`[BRANCH] Error loading all branches for finale:`, branchErr.message);
      }
    }

    // Determine the resolved ending type from EPISODE_CONFIG (Phase 2 override)
    const episodeConfig = resolvedEpisodeNumber ? EPISODE_CONFIG[resolvedEpisodeNumber] || EPISODE_CONFIG[5] : null;
    const seriesEndingType = episodeConfig?.ending_type_db || resolvedEndingType || 'A';

    try {
      // 1. Load CORE Slim v2
      const coreSlimData = await loadPrompt('system_prompt_core_v2');
      if (!coreSlimData) {
        throw new Error('system_prompt_core_v2 not found in app_settings');
      }

      // 2. Build StoryRequest from available parameters
      // Map theme_key: Wizard may send storyType like 'adventure' → map to 'action'
      const themeKeyMapping: Record<string, string> = {
        adventure: 'action',
        fairy_tale: 'fantasy',
        fairy_tales: 'fantasy',
        science: 'educational',
        knowledge: 'educational',
        feelings: 'everyday',
        daily_life: 'everyday',
      };
      const resolvedThemeKey = themeKey
        || themeKeyMapping[storyType] || storyType
        || (textType === 'non-fiction' ? 'educational' : 'fantasy');

      // Map length: old code uses 'very_short'|'short'|'medium'|'long'|'very_long'
      // New code uses 'short'|'medium'|'long'
      const lengthMapping: Record<string, 'short' | 'medium' | 'long'> = {
        very_short: 'short',
        short: 'short',
        medium: 'medium',
        long: 'long',
        very_long: 'long',
      };
      const resolvedLength = storyLength || lengthMapping[length] || 'medium';

      // ── Load kid profile from DB if we have kidProfileId but missing details ──
      let resolvedKidAge = kidAge;
      let resolvedKidName = kidName;
      let resolvedDifficultyLevel = difficultyLevel;
      let resolvedContentSafetyLevel = contentSafetyLevel;

      if (kidProfileId && (!kidAge || !kidName)) {
        try {
          const { data: kidProfile } = await supabase
            .from('kid_profiles')
            .select('first_name, age, difficulty_level, content_safety_level')
            .eq('id', kidProfileId)
            .maybeSingle();
          if (kidProfile) {
            resolvedKidAge = kidAge || kidProfile.age;
            resolvedKidName = kidName || kidProfile.first_name;
            resolvedDifficultyLevel = difficultyLevel || kidProfile.difficulty_level;
            resolvedContentSafetyLevel = contentSafetyLevel || kidProfile.content_safety_level;
            console.log(`[generate-story] Loaded kid profile: ${resolvedKidName}, age=${resolvedKidAge}, diff=${resolvedDifficultyLevel}`);
          }
        } catch (profileErr: any) {
          console.warn('[generate-story] Could not load kid profile:', profileErr.message);
        }
      }

      const storyRequest: StoryRequest = {
        kid_profile: {
          id: kidProfileId || userId || 'unknown',
          first_name: resolvedKidName || 'Child',
          age: resolvedKidAge || 8,
          difficulty_level: resolvedDifficultyLevel || 2,
          content_safety_level: resolvedContentSafetyLevel || 2,
        },
        story_language: effectiveStoryLanguage,
        theme_key: resolvedThemeKey,
        length: resolvedLength,
        is_series: isSeries || false,
        series_context: seriesContext || (episodeNumber && episodeNumber > 1 ? description : undefined),
        protagonists: {
          include_self: includeSelf || false,
          characters: (characters || selectedCharacters || []).map((c: any) => ({
            name: c.name,
            age: c.age || undefined,
            relation: c.relation || undefined,
            description: c.description || undefined,
            role: c.role || undefined,
          })),
        },
        special_abilities: specialAbilities || [],
        user_prompt: userPromptParam || (source === 'kid' ? description : undefined),
        source: source === 'kid' ? 'kid' : 'parent',
        question_count: 5,
        surprise_characters: surpriseCharactersParam || false,
        // ── Phase 2: Series context fields ──
        series_episode_number: (isSeries || seriesId) ? resolvedEpisodeNumber : undefined,
        series_ending_type: (isSeries || seriesId) ? seriesEndingType : undefined,
        series_previous_episodes: seriesContextData.previousEpisodes.length > 0
          ? seriesContextData.previousEpisodes : undefined,
        series_continuity_state: seriesContextData.lastContinuityState || undefined,
        series_visual_style_sheet: seriesContextData.visualStyleSheet || undefined,
        // ── Modus B: Interactive series fields ──
        series_mode: seriesMode as StoryRequest['series_mode'],
        branch_chosen: branchChosenTitle,
        branch_chosen_preview: branchChosenPreview,
        branch_chosen_direction: branchChosenDirection,
        series_all_branches: seriesAllBranches,
      };

      // 3. Build dynamic user message
      userMessageFinal = await buildStoryPrompt(storyRequest, supabase);

      // Block 2.3d: Log the CHARACTERS section from the built prompt
      const charSectionMatch = userMessageFinal.match(/## (PERSONNAGES|FIGUREN|CHARACTERS|PERSONAJES|PERSONAGGI|LIKOVI|PERSONAGES)[\s\S]*?(?=\n## |$)/);
      console.log('[generate-story] Built prompt CHARACTERS section:', charSectionMatch ? charSectionMatch[0] : '(no characters section found)');
      console.log('[generate-story] StoryRequest protagonists:', JSON.stringify(storyRequest.protagonists, null, 2));

      // 4. Check for learning theme
      if (kidProfileId) {
        const themeResult = await shouldApplyLearningTheme(
          kidProfileId,
          effectiveStoryLanguage,
          supabase
        );
        if (themeResult) {
          learningThemeApplied = themeResult.themeKey;
          userMessageFinal = injectLearningTheme(
            userMessageFinal,
            themeResult.themeLabel,
            effectiveStoryLanguage
          );
        }
      }

      fullSystemPromptFinal = coreSlimData;
      usedNewPromptPath = true;
      console.log('[generate-story] Using NEW prompt path (CORE Slim + dynamic context)');

    } catch (promptError: any) {
      // ── FALLBACK: Old prompt loading logic ──
      console.warn('[generate-story] FALLBACK to old prompts:', promptError.message);

      const [corePrompt, elternModulPrompt, kinderModulPrompt, serienModulPrompt] = await Promise.all([
        loadPrompt(`system_prompt_${adminLangCode}`),
        loadPrompt(`system_prompt_story_creation_${adminLangCode}`),
        loadPrompt(`system_prompt_kid_creation_${adminLangCode}`),
        loadPrompt(`system_prompt_continuation_${adminLangCode}`)
      ]);

      console.log('[generate-story] Using OLD prompt path (FALLBACK - modular prompts)');
      console.log("Loaded OLD prompts:", {
        source, isSeries,
        hasCorePrompt: !!corePrompt,
        hasElternModul: !!elternModulPrompt,
        hasKinderModul: !!kinderModulPrompt,
        hasSerienModul: !!serienModulPrompt
      });

      let compositePrompt = "";
      if (corePrompt) {
        compositePrompt += `# CORE PROMPT\n${corePrompt}\n\n`;
      }
      if (source === 'admin' && elternModulPrompt) {
        compositePrompt += `# ELTERN-MODUL (Admin/Lehrer Modus)\n${elternModulPrompt}\n\n`;
      } else if (source === 'kid' && kinderModulPrompt) {
        let kidPrompt = kinderModulPrompt;
        if (storyType) kidPrompt = kidPrompt.replace(/\{storyType\}/g, storyType);
        if (characters) kidPrompt = kidPrompt.replace(/\{characters\}/g, Array.isArray(characters) ? characters.join(', ') : characters);
        if (locations) kidPrompt = kidPrompt.replace(/\{locations\}/g, Array.isArray(locations) ? locations.join(', ') : locations);
        if (timePeriod) kidPrompt = kidPrompt.replace(/\{timePeriod\}/g, timePeriod);
        if (kidName) kidPrompt = kidPrompt.replace(/\{kidName\}/g, kidName);
        if (kidHobbies) kidPrompt = kidPrompt.replace(/\{kidHobbies\}/g, kidHobbies);
        compositePrompt += `# KINDER-MODUL (Kind erstellt eigene Geschichte)\n${kidPrompt}\n\n`;
      }
      if ((isSeries || (resolvedEpisodeNumber && resolvedEpisodeNumber > 1)) && serienModulPrompt) {
        compositePrompt += `# SERIEN-MODUL\n${serienModulPrompt}\n\n`;
      }
      fullSystemPromptFinal = compositePrompt.trim() || customSystemPrompt || "";
      // userMessageFinal will be set below in the old dynamic context block
    }

    const baseSystemPrompt = fullSystemPromptFinal;

    // Get API keys - prefer VERTEX_API_KEY_NEW (Service Account JSON) for Vertex AI
    const GEMINI_API_KEY = Deno.env.get("VERTEX_API_KEY_NEW") || Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_VERTEX_AI_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!GEMINI_API_KEY) {
      console.warn("[generate-story] No VERTEX_API_KEY_NEW, GEMINI_API_KEY or GOOGLE_VERTEX_AI_KEY configured - image generation may fail");
    } else {
      // Log which key source is being used (first 20 chars for debugging)
      const keyPreview = GEMINI_API_KEY.substring(0, 20);
      console.log(`[generate-story] Image API key loaded, starts with: ${keyPreview}...`);
    }

    // Language mappings (used by both new and old paths)
    const languageNames: Record<string, string> = {
      DE: "Deutsch",
      FR: "Französisch",
      EN: "Englisch",
    };
    const targetLanguage = languageNames[textLanguage] || "Französisch";

    // Map length to approximate word count with explicit minimum
    const lengthMap: Record<string, { range: string; min: number; max: number }> = {
      very_short: { range: "150-200 Wörter", min: 150, max: 200 },
      short: { range: "250-300 Wörter", min: 250, max: 300 },
      medium: { range: "300-350 Wörter", min: 300, max: 350 },
      long: { range: "350-450 Wörter", min: 350, max: 450 },
      very_long: { range: "500-600 Wörter", min: 500, max: 600 },
    };
    const questionCountMap: Record<string, number> = {
      very_short: 2, short: 3, medium: 5, long: 7, very_long: 8,
    };
    const difficultyLabels: Record<string, string> = {
      easy: "LEICHT", medium: "MITTEL", difficult: "SCHWER",
    };

    const difficultyLabel = difficultyLabels[difficulty] || "MITTEL";
    const questionCount = questionCountMap[length] || 5;
    const lengthConfig = lengthMap[length] || lengthMap.medium;
    const minWordCount = lengthConfig.min;

    // ── Build fullSystemPrompt + userPrompt depending on path ──
    let fullSystemPrompt: string;
    let userPrompt: string;

    if (usedNewPromptPath) {
      // NEW path: system = CORE Slim, user = dynamic context from promptBuilder
      fullSystemPrompt = fullSystemPromptFinal;
      userPrompt = userMessageFinal;
    } else {
      // OLD FALLBACK path: build dynamic context + user prompt inline
      const textTypeLabels: Record<string, string> = {
        fiction: "FIKTION/GESCHICHTE (Textes narratifs)",
        "non-fiction": "SACHTEXT (Texte documentaires)",
      };
      const textTypeDescription = textTypeLabels[textType] || textTypeLabels.fiction;
      const wordCount = lengthConfig.range;

      const dynamicContext = `
---
## AKTUELLE AUFGABE - PARAMETER

**Zielsprache des Textes:** ${targetLanguage}
**Schulniveau:** ${schoolLevel}
**Schwierigkeitsgrad:** ${difficultyLabel}
**Textlänge:** ${wordCount}
**MINDESTANZAHL WÖRTER:** ${minWordCount} (STRIKT EINHALTEN!)
**Texttyp:** ${textTypeDescription}
**Anzahl Verständnisfragen:** ${questionCount}
${source === 'kid' && storyType ? `**Story-Typ:** ${storyType}` : ''}
${source === 'kid' && characters ? `**Charaktere:** ${Array.isArray(characters) ? characters.join(', ') : characters}` : ''}
${source === 'kid' && locations ? `**Orte:** ${Array.isArray(locations) ? locations.join(', ') : locations}` : ''}
${source === 'kid' && timePeriod ? `**Zeitepoche:** ${timePeriod}` : ''}
${isSeries ? `**Serie:** Ja - Geschichte wird als Teil einer Serie erstellt` : ''}

---
## KRITISCHE QUALITÄTSKONTROLLE - TEXTLÄNGE

**ABSOLUT KRITISCH:** Der Text MUSS mindestens **${minWordCount} Wörter** haben!

Bevor du antwortest:
1. Zähle die Wörter im generierten Text
2. Falls weniger als ${minWordCount} Wörter: Erweitere den Text mit mehr Details, Dialogen oder Beschreibungen
3. Der Text sollte ${lengthConfig.min}-${lengthConfig.max} Wörter haben
`;

      fullSystemPrompt = baseSystemPrompt 
        ? `${baseSystemPrompt}\n${dynamicContext}`
        : dynamicContext;

      // Build series context for fallback path (enhanced with Phase 2 data)
      let oldSeriesContext = '';
      if (resolvedEpisodeNumber && resolvedEpisodeNumber > 1) {
        const endingHint = resolvedEndingType === 'C'
          ? 'ein Cliffhanger sein, der Spannung für die nächste Episode aufbaut'
          : resolvedEndingType === 'B' ? 'offen sein' : 'abgeschlossen sein';
        const finaleHint = resolvedEndingType === 'A' && resolvedEpisodeNumber >= 5
          ? '\n- WICHTIG: Dies ist das FINALE der Serie. Kein Cliffhanger. Alle offenen Fäden auflösen. Ein befriedigendes Ende schreiben.'
          : '';

        // Include previous episode summaries if available (Phase 2)
        let previousEpBlock = '';
        if (seriesContextData.previousEpisodes.length > 0) {
          const epLines = seriesContextData.previousEpisodes
            .map(ep => `- Episode ${ep.episode_number}: "${ep.title}" – ${ep.episode_summary || '(keine Zusammenfassung)'}`)
            .join('\n');
          previousEpBlock = `\n\nBISHERIGER VERLAUF:\n${epLines}`;
        }

        // Include continuity state if available (Phase 2)
        let continuityBlock = '';
        const cs = seriesContextData.lastContinuityState;
        if (cs) {
          const parts: string[] = [];
          if (cs.established_facts?.length) parts.push(`Etablierte Fakten: ${cs.established_facts.join('; ')}`);
          if (cs.open_threads?.length) parts.push(`Offene Fäden: ${cs.open_threads.join('; ')}`);
          if (cs.character_states) {
            const charLines = Object.entries(cs.character_states).map(([n, s]) => `${n}: ${s}`).join(', ');
            if (charLines) parts.push(`Charakter-Entwicklung: ${charLines}`);
          }
          if (parts.length > 0) continuityBlock = `\n\nKONTINUITÄTS-STATE:\n${parts.join('\n')}`;
        }

        oldSeriesContext = `\n\n**SERIEN-KONTEXT:**
- Dies ist Episode ${resolvedEpisodeNumber} einer fortlaufenden Serie (5 Episoden)
- Führe die Geschichte nahtlos fort, behalte dieselben Charaktere und den Stil bei
- Der Text in "description" enthält den Kontext der vorherigen Episode
- Das Ende sollte ${endingHint}${finaleHint}${previousEpBlock}${continuityBlock}`;
      }

      // Series output instructions (for both new series Ep1 and continuations Ep2+)
      const seriesOutputInstructions = (isSeries || seriesId)
        ? `\n\nSERIEN-OUTPUT (PFLICHT - als zusätzliche JSON-Felder):
- "episode_summary": Zusammenfassung dieser Episode in max 80 Wörtern (nur Plot-Punkte, keine Stilbeschreibung)
- "continuity_state": {"established_facts": [...], "open_threads": [...], "character_states": {"Name": "Zustand"}, "world_rules": [...], "signature_element": {"description": "...", "usage_history": [...]}}${(!resolvedEpisodeNumber || resolvedEpisodeNumber === 1) ? '\n- "visual_style_sheet": {"characters": {"Name": "englische Beschreibung für Bildgenerierung"}, "world_style": "englische Stil-Beschreibung", "recurring_visual": "visuelles Signature Element"}' : ''}`
        : '';

      userPrompt = `Erstelle ${textType === "non-fiction" ? "einen Sachtext" : "eine Geschichte"} basierend auf dieser Beschreibung: "${description}"
${oldSeriesContext}
**WICHTIG:** 
- Der gesamte Text muss auf ${targetLanguage} sein!
- Der Text MUSS mindestens **${minWordCount} Wörter** haben! Zähle deine Wörter und erweitere wenn nötig!

Antworte NUR mit einem validen JSON-Objekt.
Erstelle genau ${questionCount} Multiple-Choice Fragen.
Wähle genau 10 Vokabelwörter aus.${seriesOutputInstructions}`;
    }

    console.log("Generating story with Lovable AI Gateway:", {
      usedNewPromptPath,
      targetLanguage,
      schoolLevel,
      difficulty: difficultyLabel,
      length: lengthConfig.range,
      minWordCount,
      textType,
      questionCount
    });

    // Generate the story using Lovable AI Gateway
    // Helper to extract category number from A1-A6, M1-M6, E1-E6
    const extractCategoryNumber = (category: string | undefined): number | null => {
      if (!category) return null;
      const match = category.match(/[AME](\d)/);
      return match ? parseInt(match[1], 10) : null;
    };

    let story: { 
      title: string; 
      content: string; 
      questions: any[]; 
      vocabulary: any[];
      structure_beginning?: string;
      structure_middle?: string;
      structure_ending?: string;
      emotional_coloring?: string;
      // Block 2.3c: New classification fields
      emotional_secondary?: string;
      humor_level?: number;
      emotional_depth?: number;
      moral_topic?: string;
      concrete_theme?: string;
      summary?: string;
      learning_theme_response?: any;
      // Phase 2: Series fields from LLM
      episode_summary?: string;
      continuity_state?: any;
      visual_style_sheet?: any;
    } = {
      title: "",
      content: "",
      questions: [],
      vocabulary: []
    };
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Story generation attempt ${attempts}/${maxAttempts}`);

      const promptToUse = attempts === 1 
        ? userPrompt 
        : `${userPrompt}\n\n**ACHTUNG:** Der vorherige Versuch hatte zu wenige Wörter. Schreibe einen LÄNGEREN Text mit mindestens ${minWordCount} Wörtern!`;

      const content = await callLovableAI(LOVABLE_API_KEY, fullSystemPrompt, promptToUse, 0.8);

      // Parse the JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not parse story JSON from:", content);
        throw new Error("Could not parse story JSON");
      }

      story = JSON.parse(jsonMatch[0]);

      // ── DEBUG: Log raw LLM response for series episodes ──
      if (isSeries || seriesId) {
        console.log(`[generate-story] [SERIES-DEBUG] Raw LLM response keys: ${Object.keys(story).join(', ')}`);
        console.log(`[generate-story] [SERIES-DEBUG] Has episode_summary: ${!!story.episode_summary}, type: ${typeof story.episode_summary}`);
        console.log(`[generate-story] [SERIES-DEBUG] Has continuity_state: ${!!story.continuity_state}, type: ${typeof story.continuity_state}`);
        console.log(`[generate-story] [SERIES-DEBUG] Has visual_style_sheet: ${!!story.visual_style_sheet}, type: ${typeof story.visual_style_sheet}`);
        if (story.episode_summary) console.log(`[generate-story] [SERIES-DEBUG] episode_summary value: ${JSON.stringify(story.episode_summary).substring(0, 200)}`);
        if (story.continuity_state) console.log(`[generate-story] [SERIES-DEBUG] continuity_state value: ${JSON.stringify(story.continuity_state).substring(0, 500)}`);
      }

      // Quality check: Count words in the story content
      const wordCountActual = countWords(story.content);
      console.log(`Story word count: ${wordCountActual}, minimum required: ${minWordCount}`);

      if (wordCountActual >= minWordCount) {
        console.log("Word count check PASSED");
        break;
      } else if (attempts < maxAttempts) {
        console.log(`Word count check FAILED (${wordCountActual} < ${minWordCount}), requesting expansion...`);
        
        // Request expansion of the story
        const expansionSystemPrompt = `Du bist ein Textexpander. Deine Aufgabe ist es, den folgenden Text zu erweitern, bis er mindestens ${minWordCount} Wörter hat. Der aktuelle Text hat nur ${wordCountActual} Wörter.

Erweitere den Text durch:
- Mehr beschreibende Details zu Orten, Personen und Gefühlen
- Zusätzliche kurze Dialoge
- Erweiterte Handlungssequenzen
- Gedanken und Emotionen der Charaktere

WICHTIG: Behalte die Sprache (${targetLanguage}) und den Stil bei!`;

        const expansionUserPrompt = `Erweitere diesen Text auf mindestens ${minWordCount} Wörter. Aktuell: ${wordCountActual} Wörter.

Titel: ${story.title}

Text:
${story.content}

Antworte NUR mit dem erweiterten Text (ohne Titel, ohne JSON-Format).`;

        try {
          const expandedContent = await callLovableAI(LOVABLE_API_KEY, expansionSystemPrompt, expansionUserPrompt, 0.8);
          const newWordCount = countWords(expandedContent);
          console.log(`Expanded story word count: ${newWordCount}`);
          
          if (newWordCount >= minWordCount) {
            story.content = expandedContent;
            console.log("Story successfully expanded");
            break;
          }
        } catch (err) {
          console.error("Error expanding story:", err);
        }
      } else {
        console.log(`Final word count: ${wordCountActual} (min: ${minWordCount}) - proceeding with available content`);
      }
    }

    // ── Block 2.3c: Robust parsing of new classification fields ──
    // Clamp structure values to match database CHECK constraints:
    // - beginning: 1-5 (A1-A5)
    // - middle: 1-6 (M1-M6, includes M6 Wendepunkt-Kette)
    // - ending: 1-5 (E1-E5)
    const structureBeginning = story.structure_beginning 
      ? Math.min(5, Math.max(1, parseInt(String(story.structure_beginning).replace(/[^0-9]/g, '')) || 1))
      : null;
    const structureMiddle = story.structure_middle 
      ? Math.min(6, Math.max(1, parseInt(String(story.structure_middle).replace(/[^0-9]/g, '')) || 1))
      : null;
    const structureEnding = story.structure_ending 
      ? Math.min(5, Math.max(1, parseInt(String(story.structure_ending).replace(/[^0-9]/g, '')) || 1))
      : null;
    const emotionalColoring = story.emotional_coloring 
      ? String(story.emotional_coloring).match(/EM-[JTHWDC]/)?.[0] || null 
      : null;
    const emotionalSecondary = story.emotional_secondary 
      ? String(story.emotional_secondary).match(/EM-[JTHWDC]/)?.[0] || null 
      : null;
    const humorLevel = story.humor_level 
      ? Math.min(5, Math.max(1, parseInt(String(story.humor_level)))) || null
      : null;
    const emotionalDepth = story.emotional_depth 
      ? Math.min(3, Math.max(1, parseInt(String(story.emotional_depth)))) || null
      : null;
    const moralTopic = story.moral_topic || null;
    const concreteTheme = story.concrete_theme || null;
    const summary = story.summary || null;
    const learningThemeResponse = story.learning_theme_response || null;

    console.log(`[generate-story] Classifications: structure=${structureBeginning}-${structureMiddle}-${structureEnding}, emotion=${emotionalColoring}/${emotionalSecondary}, humor=${humorLevel}, depth=${emotionalDepth}, theme=${concreteTheme}`);

    // ── Phase 2: Parse series-specific fields from LLM response ──
    let episodeSummary: string | null = null;
    let continuityState: any | null = null;
    let visualStyleSheet: any | null = null;

    // Helper: safely parse a value that might be a JSON string or already an object
    function safeParseJson(val: any): any | null {
      if (!val) return null;
      if (typeof val === 'object') return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return null; }
      }
      return null;
    }

    if (isSeries || seriesId) {
      console.log(`[generate-story] [SERIES-DEBUG] Parsing series fields. isSeries=${isSeries}, seriesId=${seriesId}, episodeNumber=${episodeNumber}, resolvedEpisodeNumber=${resolvedEpisodeNumber}`);
      console.log(`[generate-story] [SERIES-DEBUG] story keys: ${Object.keys(story).join(', ')}`);

      // episode_summary: string (max 80 words)
      if (story.episode_summary) {
        if (typeof story.episode_summary === 'string') {
          episodeSummary = story.episode_summary.trim().substring(0, 500); // safety cap
        } else {
          // LLM returned it as something else - stringify it
          episodeSummary = String(story.episode_summary).substring(0, 500);
        }
        console.log(`[generate-story] [SERIES-DEBUG] Parsed episode_summary (${countWords(episodeSummary)} words): "${episodeSummary.substring(0, 100)}..."`);
      } else {
        // Fallback: use the existing summary field or auto-generate from content
        episodeSummary = story.summary || story.content.substring(0, 300);
        console.log(`[generate-story] [SERIES-DEBUG] No episode_summary from LLM, using fallback (length=${episodeSummary.length})`);
      }

      // continuity_state: JSONB - handle both object and string forms
      const rawContinuity = story.continuity_state;
      if (rawContinuity) {
        continuityState = safeParseJson(rawContinuity);
        if (continuityState) {
          console.log(`[generate-story] [SERIES-DEBUG] Parsed continuity_state (from ${typeof rawContinuity}): facts=${continuityState?.established_facts?.length || 0}, threads=${continuityState?.open_threads?.length || 0}, chars=${Object.keys(continuityState?.character_states || {}).length}`);
        } else {
          console.log(`[generate-story] [SERIES-DEBUG] continuity_state present but unparseable: type=${typeof rawContinuity}, value=${String(rawContinuity).substring(0, 200)}`);
        }
      } else {
        console.log('[generate-story] [SERIES-DEBUG] No continuity_state in LLM response');
      }

      // visual_style_sheet: JSONB (only expected from Episode 1)
      const currentEp = resolvedEpisodeNumber || 1;
      if (currentEp === 1) {
        const rawVss = story.visual_style_sheet;
        if (rawVss) {
          visualStyleSheet = safeParseJson(rawVss);
          if (visualStyleSheet) {
            console.log(`[generate-story] [SERIES-DEBUG] Parsed visual_style_sheet (from ${typeof rawVss}): characters=${Object.keys(visualStyleSheet?.characters || {}).length}, world_style=${!!visualStyleSheet?.world_style}`);
          } else {
            console.log(`[generate-story] [SERIES-DEBUG] visual_style_sheet present but unparseable: type=${typeof rawVss}, value=${String(rawVss).substring(0, 200)}`);
          }
        } else {
          console.log('[generate-story] [SERIES-DEBUG] No visual_style_sheet from LLM for Episode 1');
        }
      }

      console.log(`[generate-story] [SERIES-DEBUG] Final parsed: episodeSummary=${!!episodeSummary} (${episodeSummary?.length || 0} chars), continuityState=${!!continuityState}, visualStyleSheet=${!!visualStyleSheet}`);
    } else {
      console.log(`[generate-story] [SERIES-DEBUG] Skipping series field parsing: isSeries=${isSeries}, seriesId=${seriesId}`);
    }

    // ── Modus B (C.1): Parse and store branch_options from LLM response ──
    let branchOptionsParsed: any[] | null = null;
    const epNumForBranch = resolvedEpisodeNumber || (isSeries ? 1 : undefined);
    console.log(`[BRANCH] series_mode: ${seriesMode}, episodeNumber: ${epNumForBranch} (raw: ${episodeNumber})`);
    if (seriesMode === 'interactive' && epNumForBranch && epNumForBranch < 5) {
      const rawBranchOptions = (story as any).branch_options;
      console.log(`[BRANCH] LLM response has branch_options: ${!!rawBranchOptions}, type: ${typeof rawBranchOptions}, isArray: ${Array.isArray(rawBranchOptions)}`);
      if (rawBranchOptions && Array.isArray(rawBranchOptions) && rawBranchOptions.length === 3) {
        const validOptions = rawBranchOptions.every((opt: any) =>
          opt.option_id && opt.title && opt.preview && opt.direction && opt.image_hint
        );
        if (validOptions) {
          branchOptionsParsed = rawBranchOptions;
          console.log(`[BRANCH] Parsed 3 valid branch_options for Episode ${epNumForBranch}:`,
            JSON.stringify(rawBranchOptions.map((o: any) => ({ id: o.option_id, title: o.title, dir: o.direction }))));
        } else {
          // Retry with relaxed validation (image_hint is optional)
          const relaxedValid = rawBranchOptions.every((opt: any) =>
            opt.option_id && opt.title && opt.preview && opt.direction
          );
          if (relaxedValid) {
            branchOptionsParsed = rawBranchOptions;
            console.log(`[BRANCH] Parsed 3 branch_options (relaxed, no image_hint required) for Episode ${epNumForBranch}:`,
              JSON.stringify(rawBranchOptions.map((o: any) => ({ id: o.option_id, title: o.title, dir: o.direction }))));
          } else {
            console.error(`[BRANCH] Invalid branch_options structure (missing required fields):`,
              JSON.stringify(rawBranchOptions));
          }
        }
      } else if (rawBranchOptions && Array.isArray(rawBranchOptions) && rawBranchOptions.length > 0) {
        // LLM returned some options but not exactly 3 – still usable if >= 2
        console.warn(`[BRANCH] Got ${rawBranchOptions.length} branch_options instead of 3 for Ep${epNumForBranch}`);
        if (rawBranchOptions.length >= 2) {
          branchOptionsParsed = rawBranchOptions.slice(0, 3);
          console.log(`[BRANCH] Using ${branchOptionsParsed.length} options (trimmed)`);
        }
      } else {
        console.error(`[BRANCH] Missing or invalid branch_options for interactive Ep${epNumForBranch}. Got:`,
          rawBranchOptions ? `type=${typeof rawBranchOptions}, isArray=${Array.isArray(rawBranchOptions)}, length=${Array.isArray(rawBranchOptions) ? rawBranchOptions.length : 'N/A'}` : 'null/undefined');
        // Log all story keys to understand what the LLM returned
        console.error(`[BRANCH] LLM response keys: ${Object.keys(story).join(', ')}`);
      }
    }

    const storyGenerationTime = Date.now() - startTime;
    console.log(`[PERF] Story text generated in ${storyGenerationTime}ms`);

    // ================== Block 2.4: PARSE image_plan FROM LLM RESPONSE ==================
    let imagePlan: any = null;
    try {
      if ((story as any).image_plan) {
        imagePlan = (story as any).image_plan;
        console.log('[generate-story] image_plan extracted:',
          `character_anchor: ${imagePlan.character_anchor?.substring(0, 50)}...`,
          `world_anchor: ${imagePlan.world_anchor?.substring(0, 50)}...`,
          `scenes: ${imagePlan.scenes?.length || 0}`
        );
      } else {
        console.log('[generate-story] No image_plan in LLM response, using fallback');
      }
    } catch (e) {
      console.error('[generate-story] Error parsing image_plan:', e);
    }

    // ================== Block 2.4: LOAD IMAGE RULES FROM DB ==================
    function getAgeGroup(age: number): string {
      if (age <= 6) return '4-6';
      if (age <= 9) return '7-9';
      return '10-12';
    }

    const childAge = kidAge || 8;
    const ageGroup = getAgeGroup(childAge);
    const resolvedThemeKeyForImages = themeKey || storyType || null;

    const imageRulesStart = Date.now();
    const { ageRules: imageAgeRules, themeRules: imageThemeRules } = await loadImageRules(
      supabase,
      ageGroup,
      resolvedThemeKeyForImages,
      effectiveStoryLanguage
    );
    console.log(`[PERF] Image rules loaded in ${Date.now() - imageRulesStart}ms`);

    // ================== Block 2.4: BUILD IMAGE PROMPTS ==================
    let imagePrompts: ImagePromptResult[];

    // Generate character description for fallback path
    let characterDescription = "";

    // ── Phase 3: Build series image context for visual consistency ──
    // Hoisted above the if/else so both paths (structured + fallback) can use it
    let seriesImageCtx: SeriesImageContext | undefined;
    const currentEpForImages = resolvedEpisodeNumber;

    if (currentEpForImages && (isSeries || seriesId)) {
      // For Ep2+: use visual_style_sheet loaded from Episode 1
      // For Ep1: use visual_style_sheet just parsed from this LLM response
      const vss = seriesContextData.visualStyleSheet || visualStyleSheet;
      if (vss && typeof vss === 'object' && (vss.characters || vss.world_style)) {
        seriesImageCtx = {
          visualStyleSheet: {
            characters: vss.characters || {},
            world_style: vss.world_style || '',
            recurring_visual: vss.recurring_visual || '',
          },
          episodeNumber: currentEpForImages,
        };
        console.log(`[generate-story] Phase 3: Series image context built for Episode ${currentEpForImages}, chars=${Object.keys(vss.characters || {}).length}`);
      } else {
        console.log('[generate-story] Phase 3: No visual_style_sheet available, skipping series image context');
      }
    }

    if (imagePlan && imagePlan.character_anchor && imagePlan.scenes?.length > 0) {
      // ═══ NEW PATH: Structured image_plan from LLM ═══
      console.log('[generate-story] Using NEW image path: structured image_plan');

      console.log('[IMAGE-PIPELINE] Calling buildImagePrompts:', JSON.stringify({
        hasSeriesContext: !!seriesImageCtx,
        episodeNumber: seriesImageCtx?.episodeNumber ?? null,
        hasStyleSheet: !!seriesImageCtx?.visualStyleSheet,
        styleSheetKeys: seriesImageCtx?.visualStyleSheet
          ? Object.keys(seriesImageCtx.visualStyleSheet)
          : null
      }));
      imagePrompts = buildImagePrompts(imagePlan, imageAgeRules, imageThemeRules, childAge, seriesImageCtx);
    } else {
      // ═══ FALLBACK: Simple cover prompt (previous behavior) ═══
      console.log('[generate-story] Using FALLBACK image path: simple cover prompt');
      try {
        const characterDescriptionPrompt = `Analysiere diese Geschichte und erstelle eine kurze, präzise visuelle Beschreibung der Hauptcharaktere (Aussehen, Kleidung, besondere Merkmale). Maximal 100 Wörter. Antwort auf Englisch für den Bildgenerator.`;
        const characterContext = `Geschichte: "${story.title}"\n${story.content.substring(0, 500)}...`;
        characterDescription = await callLovableAI(LOVABLE_API_KEY, characterDescriptionPrompt, characterContext, 0.3);
        console.log("Character description generated:", characterDescription.substring(0, 100));
      } catch (err) {
        console.error("Error generating character description:", err);
      }

      console.log('[IMAGE-PIPELINE] Calling buildFallbackImagePrompt:', JSON.stringify({
        hasSeriesContext: !!seriesImageCtx,
        episodeNumber: seriesImageCtx?.episodeNumber ?? null,
        hasStyleSheet: !!seriesImageCtx?.visualStyleSheet
      }));
      const fallbackPrompt = buildFallbackImagePrompt(
        story.title,
        characterDescription,
        imageAgeRules,
        imageThemeRules,
        childAge,
        seriesImageCtx,
      );
      imagePrompts = [fallbackPrompt];
    }

    console.log('[generate-story] Image prompts built:', imagePrompts.length,
      'prompts:', imagePrompts.map(p => p.label).join(', '));

    // ================== PARALLEL: CONSISTENCY CHECK + ALL IMAGES ==================
    console.log("Starting PARALLEL execution: consistency check + image generation...");

    const adminLangMap: Record<string, string> = { DE: 'de', FR: 'fr', EN: 'en' };
    const adminLanguage = adminLangMap[textLanguage] || 'de';

    // Track consistency check results
    let totalIssuesFound = 0;
    let totalIssuesCorrected = 0;
    let allIssueDetails: string[] = [];

    // ── Task 1: Consistency Check (Phase 4: series-aware routing) ──
    const consistencyCheckTask = async () => {
      const isSeriesEpisode = !!(seriesId || isSeries) && !!resolvedEpisodeNumber;

      if (isSeriesEpisode) {
        // ═══ SERIES PATH: Phase 4 structured consistency check ═══
        const effectiveAge = kidAge || 8;
        const lastContinuity = seriesContextData?.lastContinuityState || null;

        console.log(`[Phase4] Starting SERIES consistency check for Episode ${resolvedEpisodeNumber}, age=${effectiveAge}, hasContinuity=${!!lastContinuity}`);

        const seriesCheckPrompt = buildSeriesConsistencyPrompt(
          resolvedEpisodeNumber!,
          targetLanguage,
          effectiveAge,
          lastContinuity,
        );

        let correctionAttempts = 0;
        const maxCorrectionAttempts = 2;

        while (correctionAttempts < maxCorrectionAttempts) {
          const checkResult = await performSeriesConsistencyCheck(
            LOVABLE_API_KEY,
            story,
            seriesCheckPrompt,
          );

          console.log(`[Phase4] Check result: errors_found=${checkResult.errors_found}, critical=${checkResult.stats.critical}, medium=${checkResult.stats.medium}, low=${checkResult.stats.low}`);

          if (!checkResult.errors_found || checkResult.errors.length === 0) {
            console.log(`[Phase4] Series consistency check passed${correctionAttempts > 0 ? ' after correction' : ''}`);
            break;
          }

          totalIssuesFound += checkResult.errors.length;
          allIssueDetails.push(
            ...checkResult.errors.map(e => `[${e.category}/${e.severity}] ${e.problem}: "${e.original}" → ${e.fix}`)
          );

          // For series: CRITICAL CONTINUITY/CHARACTER errors REQUIRE a correction attempt
          const hasCritical = checkResult.stats.critical > 0;
          const criticalErrors = checkResult.errors.filter(e => e.severity === 'CRITICAL');

          if (!hasCritical && correctionAttempts > 0) {
            // No critical errors and already attempted once → stop (be lenient on MEDIUM/LOW)
            console.log(`[Phase4] No CRITICAL errors remaining, stopping after ${correctionAttempts} correction(s)`);
            break;
          }

          correctionAttempts++;
          const errorsToFix = hasCritical ? criticalErrors : checkResult.errors;
          console.log(`[Phase4] Attempting correction ${correctionAttempts}/${maxCorrectionAttempts} for ${errorsToFix.length} error(s) (${hasCritical ? 'CRITICAL only' : 'all'})...`);

          const correctedStory = await correctStoryFromSeriesErrors(
            LOVABLE_API_KEY,
            story,
            errorsToFix,
            lastContinuity,
            targetLanguage,
          );

          if (correctedStory.content !== story.content || correctedStory.title !== story.title) {
            story = correctedStory;
            totalIssuesCorrected += errorsToFix.length;
            console.log("[Phase4] Story corrected, re-checking...");
          } else {
            console.log("[Phase4] No changes made in correction, stopping");
            break;
          }
        }
      } else {
        // ═══ STANDARD PATH: existing single-story consistency check ═══
        const consistencyCheckPrompt = await getConsistencyCheckPrompt(adminLanguage);

        if (!consistencyCheckPrompt) {
          console.log("No consistency check prompt configured, skipping check");
          return;
        }

        console.log("Starting standard consistency check...");

        let correctionAttempts = 0;
        const maxCorrectionAttempts = 2;

        while (correctionAttempts < maxCorrectionAttempts) {
          const checkResult = await performConsistencyCheck(
            LOVABLE_API_KEY,
            story,
            consistencyCheckPrompt,
          );

          if (!checkResult.hasIssues) {
            console.log(`Consistency check passed${correctionAttempts > 0 ? ' after correction' : ''}`);
            break;
          }

          totalIssuesFound += checkResult.issues.length;
          allIssueDetails.push(...checkResult.issues);

          correctionAttempts++;
          console.log(`Consistency check found ${checkResult.issues.length} issue(s), attempting correction ${correctionAttempts}/${maxCorrectionAttempts}...`);

          const correctedStory = await correctStory(
            LOVABLE_API_KEY,
            story,
            checkResult.issues,
            checkResult.suggestedFixes,
            targetLanguage
          );

          if (correctedStory.content !== story.content || correctedStory.title !== story.title) {
            story = correctedStory;
            totalIssuesCorrected += checkResult.issues.length;
            console.log("Story corrected, re-checking...");
          } else {
            console.log("No changes made in correction, stopping");
            break;
          }
        }
      }

      // Save consistency check results (both paths)
      try {
        await supabase.from("consistency_check_results").insert({
          story_title: story.title,
          story_length: length,
          difficulty: difficulty,
          issues_found: totalIssuesFound,
          issues_corrected: totalIssuesCorrected,
          issue_details: allIssueDetails,
          user_id: userId || null,
        });
        console.log("Consistency check results saved");
      } catch (dbErr) {
        console.error("Error saving consistency check results:", dbErr);
      }
    };

    // ── Task 2: Generate ALL images in parallel ──
    const generateAllImagesTask = async (): Promise<Array<{ label: string; url: string | null; cached: boolean }>> => {
      const imageGenerationStart = Date.now();

      const imageResults = await Promise.allSettled(
        imagePrompts.map(async (imgPrompt) => {
          const imgStart = Date.now();

          // 1. Check cache
          const cached = await getCachedImage(supabase, imgPrompt.prompt);
          if (cached) {
            console.log(`[generate-story] Cache HIT for ${imgPrompt.label}`);
            return { label: imgPrompt.label, url: cached, cached: true };
          }
          console.log(`[generate-story] Cache MISS for ${imgPrompt.label}`);

          // 2. Generate image (Vertex AI FIRST → Lovable Gateway fallback)
          let imageUrl: string | null = null;

          if (GEMINI_API_KEY) {
            try {
              imageUrl = await callVertexImageAPI(GEMINI_API_KEY, imgPrompt.prompt);
            } catch (vertexError) {
              console.log(`[IMAGE-PIPELINE] Vertex AI failed for ${imgPrompt.label}, trying Lovable Gateway`);
            }
          }

          if (!imageUrl && LOVABLE_API_KEY) {
            try {
              imageUrl = await callLovableImageGenerate(LOVABLE_API_KEY, imgPrompt.prompt);
            } catch (lovableError) {
              console.error(`[IMAGE-PIPELINE] Lovable Gateway also failed for ${imgPrompt.label}:`, lovableError);
            }
          }

          if (imageUrl) {
            await cacheImage(supabase, imgPrompt.prompt, imageUrl);
            console.log(`[generate-story] Image generated for ${imgPrompt.label} in ${Date.now() - imgStart}ms`);
          } else {
            console.log(`[generate-story] Image generation FAILED for ${imgPrompt.label}`);
          }

          return { label: imgPrompt.label, url: imageUrl, cached: false };
        })
      );

      const imageGenerationTime = Date.now() - imageGenerationStart;
      console.log(`[PERF] All ${imagePrompts.length} images generated in ${imageGenerationTime}ms (parallel)`);

      // Extract fulfilled results
      return imageResults.map(result => {
        if (result.status === 'fulfilled') return result.value;
        console.error('[generate-story] Image generation rejected:', result.reason);
        return { label: 'unknown', url: null, cached: false };
      });
    };

    // ── Execute consistency check + ALL images PARALLEL with timeout ──
    const PARALLEL_TIMEOUT_MS = 180000; // 180 seconds for consistency + ALL images together
    const parallelStart = Date.now();

    let allImageResults: Array<{ label: string; url: string | null; cached: boolean }> = [];

    try {
      const results = await Promise.race([
        Promise.allSettled([
          consistencyCheckTask(),
          generateAllImagesTask(),
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Parallel block timeout')), PARALLEL_TIMEOUT_MS)
        ),
      ]);

      // Extract image results from the settled promises
      const settledResults = results as PromiseSettledResult<any>[];
      if (settledResults[1]?.status === 'fulfilled') {
        allImageResults = settledResults[1].value || [];
      } else if (settledResults[1]?.status === 'rejected') {
        console.error('[generate-story] Image generation task rejected:', settledResults[1].reason);
      }

    } catch (timeoutError) {
      console.error(`[generate-story] Parallel block timed out after ${PARALLEL_TIMEOUT_MS}ms`);
      // Story is still saved without images
    }

    console.log(`[PERF] Parallel block (consistency + images): ${Date.now() - parallelStart}ms`);

    // ── Sort image results: cover vs. scene images ──
    let coverImageBase64: string | null = null;
    const storyImages: string[] = [];

    for (const result of allImageResults) {
      if (result.url) {
        if (result.label === 'cover') {
          coverImageBase64 = result.url;
        } else {
          storyImages.push(result.url);
        }
      }
    }

    // Fallback: If cover failed but scene images exist → use first scene as cover
    if (!coverImageBase64 && storyImages.length > 0) {
      coverImageBase64 = storyImages[0];
      console.log('[generate-story] Using first scene image as cover fallback');
    }

    console.log(`[generate-story] Final images: cover=${!!coverImageBase64}, scenes=${storyImages.length}`);

    // ================== END PARALLEL EXECUTION ==================

    const totalTime = Date.now() - startTime;
    console.log(`[PERF] TOTAL generation time: ${totalTime}ms (story: ${storyGenerationTime}ms, parallel: ${totalTime - storyGenerationTime}ms)`);

    // Final word count log
    const finalWordCount = countWords(story.content);
    console.log(`Final story delivered with ${finalWordCount} words (min: ${minWordCount})`);

    const imageWarning = !coverImageBase64
      ? "cover_generation_failed"
      : (imagePrompts.length > 1 && storyImages.length < (imagePrompts.length - 1))
        ? "some_scene_images_failed"
        : null;

    console.log(`Story generated with ${story.vocabulary?.length || 0} vocabulary words`);
    console.log(`Structure classification: beginning=${structureBeginning}, middle=${structureMiddle}, ending=${structureEnding}`);
    console.log(`Emotional coloring: ${emotionalColoring}/${emotionalSecondary}, humor=${humorLevel}, depth=${emotionalDepth}`);

    // ── DEBUG: Log final series values before response ──
    if (isSeries || seriesId) {
      console.log(`[generate-story] [SERIES-DEBUG] FINAL values for DB storage:`);
      console.log(`[generate-story] [SERIES-DEBUG]   episodeSummary: ${episodeSummary ? episodeSummary.substring(0, 100) + '...' : 'NULL'}`);
      console.log(`[generate-story] [SERIES-DEBUG]   continuityState: ${continuityState ? JSON.stringify(continuityState).substring(0, 300) : 'NULL'}`);
      console.log(`[generate-story] [SERIES-DEBUG]   visualStyleSheet: ${visualStyleSheet ? JSON.stringify(visualStyleSheet).substring(0, 300) : 'NULL'}`);
      console.log(`[generate-story] [SERIES-DEBUG]   isSeries=${isSeries}, seriesId=${seriesId}, episodeNumber=${episodeNumber}, resolvedEpisodeNumber=${resolvedEpisodeNumber}`);
      console.log(`[generate-story] [SERIES-DEBUG]   seriesMode=${seriesMode}, usedNewPromptPath=${usedNewPromptPath}`);
      console.log(`[generate-story] [SERIES-DEBUG]   branchOptionsParsed=${branchOptionsParsed ? branchOptionsParsed.length + ' options' : 'NULL'}`);
    }

    return new Response(JSON.stringify({
      ...story,
      // Parsed classification fields (robust, already extracted above)
      structure_beginning: structureBeginning,
      structure_middle: structureMiddle,
      structure_ending: structureEnding,
      emotional_coloring: emotionalColoring,
      // Block 2.3c: New classification fields
      emotional_secondary: emotionalSecondary,
      humor_level: humorLevel,
      emotional_depth: emotionalDepth,
      moral_topic: moralTopic,
      concrete_theme: concreteTheme,
      summary: summary,
      learning_theme_applied: learningThemeApplied,
      parent_prompt_text: learningThemeResponse?.parent_prompt_text || null,
      // Block 2.4: Image results
      coverImageBase64,
      storyImages,
      image_count: 1 + storyImages.length,
      imageWarning,
      generationTimeMs: totalTime,
      usedNewPromptPath,
      // Phase 2: Series fields for DB storage
      // Use parsed values if available; fall back to raw LLM values from ...story spread;
      // explicitly null out only if we're NOT in a series context
      episode_summary: episodeSummary ?? story.episode_summary ?? null,
      continuity_state: continuityState ?? safeParseJson(story.continuity_state) ?? null,
      visual_style_sheet: visualStyleSheet ?? safeParseJson(story.visual_style_sheet) ?? null,
      // Modus B: Branch options for interactive series (Ep1-4)
      branch_options: branchOptionsParsed ?? null,
      // Modus B: Pass series_mode back so frontend can store it on the new episode
      series_mode: seriesMode || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating story:", msg);

    const status = msg === "Rate limited" ? 429 : (msg === "Payment required" ? 402 : 500);

    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
