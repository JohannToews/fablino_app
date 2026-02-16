// ============================================================
// Edge Function: generate-story-onboarding
// Anonymous story generation for the Fablino onboarding flow.
// Simplified version of generate-story — no auth, no series,
// no consistency check, only cover image.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildStoryPrompt, StoryRequest } from '../_shared/promptBuilder.ts';
import { buildFallbackImagePrompt, loadImageRules, getStyleForAge } from '../_shared/imagePromptBuilder.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

// ── API Endpoints ──
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ── Rate Limit Config ──
const MAX_REQUESTS_PER_HOUR = 5;

// ── Types ──
interface OnboardingStoryRequest {
  childName: string;
  childAge: number;
  textLanguage: string;
  storyTheme: string;
  betaCode: string;
}

// ──────────────────────────────────────────────────────────────
// Copied Helper Functions (from generate-story/index.ts)
// These are NOT shared modules yet — Phase 5 refactor target.
// ──────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function safeParseStoryResponse(raw: string): any | null {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e1: any) {
    console.warn('[onboarding][PARSE] Direct JSON.parse failed:', e1.message?.substring(0, 100));
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      console.log('[onboarding][PARSE] Extracted JSON block succeeded');
      return parsed;
    } catch (e2: any) {
      console.warn('[onboarding][PARSE] Extracted JSON block failed:', e2.message?.substring(0, 100));
    }
  }

  const contentMatch = cleaned.match(/"(?:content|text)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (contentMatch) {
    console.warn('[onboarding][PARSE] Using regex fallback for content field');
    return {
      title: 'Untitled Story',
      content: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
      questions: [],
      vocabulary: [],
    };
  }

  console.error('[onboarding][PARSE] All parsing attempts failed. Raw (first 500):', raw.substring(0, 500));
  return null;
}

function extractGatewayImageUrl(data: any): string | null {
  const img = data?.choices?.[0]?.message?.images?.[0];
  if (!img) return null;

  const nestedUrl = img?.image_url?.url;
  if (typeof nestedUrl === "string" && nestedUrl.length > 0) return nestedUrl;

  const directUrl = img?.image_url;
  if (typeof directUrl === "string" && directUrl.length > 0) return directUrl;

  const b64 = img?.b64_json;
  if (typeof b64 === "string" && b64.length > 0) {
    return `data:image/png;base64,${b64}`;
  }

  return null;
}

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
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[onboarding] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
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
        console.log(`[onboarding] Lovable AI rate limited (attempt ${attempt + 1}/${maxRetries})`);
        lastError = new Error("Rate limited");
        continue;
      }

      if (response.status === 402) {
        throw new Error("Payment required - please add credits to your Lovable workspace");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[onboarding] Lovable AI Gateway error:", response.status, errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('[onboarding] JSON parse of gateway response failed. Starts with:', responseText.substring(0, 200));
        throw new Error('AI Gateway returned invalid JSON');
      }
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('[onboarding] No content in response. Keys:', JSON.stringify(Object.keys(data)).substring(0, 200));
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

async function callLovableImageGenerate(
  apiKey: string,
  prompt: string,
  maxRetries: number = 3
): Promise<string | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`[onboarding] Lovable image rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
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
          messages: [{ role: "user", content: prompt }],
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
        console.error("[onboarding] Lovable image gateway error:", response.status, errorText);
        continue;
      }

      let data: any;
      try {
        const respText = await response.text();
        data = JSON.parse(respText);
      } catch (parseErr) {
        console.error("[onboarding] Image JSON parse failed for model:", model);
        continue;
      }
      const imageUrl = extractGatewayImageUrl(data);
      if (typeof imageUrl === "string" && imageUrl.length > 0) {
        return imageUrl;
      }

      console.error("[onboarding] Lovable image gateway returned no image for model:", model);
    }

    if (lastError?.message === "Rate limited") {
      continue;
    }

    return null;
  }

  if (lastError) throw lastError;
  return null;
}

// ── JWT / OAuth2 for Vertex AI ──

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

  let sa: any;
  try {
    sa = JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error('[onboarding][VERTEX] Failed to parse service account JSON:', (e as Error).message?.substring(0, 100));
    throw new Error('Invalid service account JSON configuration');
  }
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
    console.error('[onboarding][VERTEX-AUTH] Token exchange failed:', err);
    throw new Error(`Vertex OAuth2 token exchange failed: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
  console.log('[onboarding][VERTEX-AUTH] Successfully obtained OAuth2 access token');
  return cachedAccessToken.token;
}

async function callVertexImageAPI(
  serviceAccountJson: string,
  prompt: string,
  maxRetries: number = 3
): Promise<string | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`[onboarding][VERTEX-IMAGE] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }

    try {
      const sa = JSON.parse(serviceAccountJson);
      const projectId = sa.project_id || "fablino-prod";
      const accessToken = await getVertexAccessToken(serviceAccountJson);

      const vertexUrl = `https://europe-west1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/europe-west1/publishers/google/models/gemini-2.0-flash-exp:generateContent`;

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
        console.log(`[onboarding][VERTEX-IMAGE] Rate limited (attempt ${attempt + 1}/${maxRetries})`);
        lastError = new Error("Rate limited");
        continue;
      }

      if (response.status === 403 || response.status === 401) {
        const errorText = await response.text();
        console.error(`[onboarding][VERTEX-IMAGE] Auth error (${response.status}):`, errorText);
        cachedAccessToken = null;
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[onboarding][VERTEX-IMAGE] Error (${response.status}):`, errorText);
        return null;
      }

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[onboarding][VERTEX-IMAGE] JSON parse failed. Response starts with:', responseText.substring(0, 200));
        return null;
      }

      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          if (!base64Data) {
            console.error("[onboarding][VERTEX-IMAGE] Image part found but data is empty");
            return null;
          }
          console.log(`[onboarding][VERTEX-IMAGE] Successfully generated image`);
          return `data:${mimeType};base64,${base64Data}`;
        }
      }

      console.error("[onboarding][VERTEX-IMAGE] No image found in response");
      return null;
    } catch (error) {
      console.error("[onboarding][VERTEX-IMAGE] Request error:", error);
      if (error instanceof Error && error.message.includes("OAuth2")) {
        cachedAccessToken = null;
      }
      return null;
    }
  }

  console.log("[onboarding][VERTEX-IMAGE] Max retries exceeded");
  return null;
}

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
      console.error(`[onboarding][IMAGE-UPLOAD] Upload error (${bucket}/${fileName}):`, uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    console.log(`[onboarding][IMAGE-UPLOAD] Uploaded ${prefix} → ${urlData.publicUrl.substring(0, 80)}...`);
    return urlData.publicUrl;
  } catch (err) {
    console.error(`[onboarding][IMAGE-UPLOAD] Exception uploading ${prefix}:`, err);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Error Response Helper
// ──────────────────────────────────────────────────────────────

function errorResponse(
  corsHeaders: Record<string, string>,
  status: number,
  message: string,
  userFriendly?: string
) {
  return new Response(JSON.stringify({
    error: message,
    userMessage: userFriendly || 'Etwas ist schiefgelaufen. Bitte versuche es nochmal.',
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ──────────────────────────────────────────────────────────────
// Age Group Helper (same as generate-story)
// ──────────────────────────────────────────────────────────────

function getAgeGroup(age: number): string {
  if (age <= 6) return '4-6';
  if (age <= 9) return '7-9';
  return '10-12';
}

// ──────────────────────────────────────────────────────────────
// Theme Mapping
// ──────────────────────────────────────────────────────────────

const themeKeyMapping: Record<string, string> = {
  fantasy: 'fantasy',
  adventure: 'action',
  funny: 'humor',
};

// ══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  const startTime = Date.now();

  // CORS
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  // Only POST
  if (req.method !== 'POST') {
    return errorResponse(corsHeaders, 405, 'Method not allowed');
  }

  try {
    // ── Parse Request ──
    const body: OnboardingStoryRequest = await req.json();
    const { childName, childAge, textLanguage, storyTheme, betaCode } = body;

    // ── Validate Required Fields ──
    if (!childName || !childAge || !textLanguage || !storyTheme || !betaCode) {
      return errorResponse(corsHeaders, 400, 'Missing required fields', 'Bitte fülle alle Felder aus.');
    }

    // ── Beta-Code Check (case-insensitive) ──
    if (betaCode.trim().toLowerCase() !== 'myfablino') {
      return errorResponse(corsHeaders, 403, 'Invalid beta code', 'Der Beta-Code ist leider ungültig.');
    }

    // ── Age Range Check ──
    if (childAge < 5 || childAge > 12) {
      return errorResponse(corsHeaders, 400, 'Age must be between 5 and 12', 'Alter muss zwischen 5 und 12 sein.');
    }

    console.log(`[onboarding] Starting story generation for ${childName} (age ${childAge}), lang=${textLanguage}, theme=${storyTheme}`);

    // ── Supabase Client (service_role for DB access without RLS) ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── IP Rate Limiting ──
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    const { data: rateData } = await supabase
      .from('onboarding_rate_limits')
      .select('*')
      .eq('ip_address', clientIP)
      .maybeSingle();

    if (rateData) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(rateData.first_request_at) > hourAgo && rateData.request_count >= MAX_REQUESTS_PER_HOUR) {
        console.log(`[onboarding] Rate limit exceeded for IP: ${clientIP} (${rateData.request_count} requests)`);
        return errorResponse(
          corsHeaders, 429,
          'Rate limit exceeded',
          'Fablino braucht eine kleine Pause. Versuche es in einer Stunde nochmal.'
        );
      }
      if (new Date(rateData.first_request_at) <= hourAgo) {
        await supabase.from('onboarding_rate_limits')
          .update({
            request_count: 1,
            first_request_at: new Date().toISOString(),
            last_request_at: new Date().toISOString(),
          })
          .eq('ip_address', clientIP);
      } else {
        await supabase.from('onboarding_rate_limits')
          .update({
            request_count: rateData.request_count + 1,
            last_request_at: new Date().toISOString(),
          })
          .eq('ip_address', clientIP);
      }
    } else {
      await supabase.from('onboarding_rate_limits')
        .insert({ ip_address: clientIP, request_count: 1 });
    }

    // ── Resolve Theme ──
    const resolvedThemeKey = themeKeyMapping[storyTheme] || 'fantasy';

    // ── Build StoryRequest (minimal for onboarding) ──
    const storyRequest: StoryRequest = {
      kid_profile: {
        id: 'onboarding',
        first_name: childName,
        age: childAge,
        difficulty_level: 2,
        content_safety_level: 2,
      },
      story_language: textLanguage,
      theme_key: resolvedThemeKey,
      length: 'short',
      is_series: false,
      protagonists: {
        include_self: true,
        characters: [],
      },
      special_abilities: [],
      source: 'kid',
      question_count: 3,
      surprise_characters: true,
    };

    // ── Load Core System Prompt ──
    const { data: corePromptData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'system_prompt_core_v2')
      .maybeSingle();

    if (!corePromptData?.value) {
      console.error('[onboarding] system_prompt_core_v2 not found in app_settings');
      throw new Error('system_prompt_core_v2 not found');
    }

    // ── Build Story Prompt via shared promptBuilder ──
    const userMessage = await buildStoryPrompt(storyRequest, supabase);
    console.log(`[onboarding] Prompt built (${userMessage.length} chars). Calling LLM...`);

    // ── Call LLM ──
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
    const rawResponse = await callLovableAI(LOVABLE_API_KEY, corePromptData.value, userMessage, 0.8);
    const story = safeParseStoryResponse(rawResponse);

    if (!story || !story.title || !story.content) {
      console.error('[onboarding] Story generation failed: invalid LLM response');
      throw new Error('Story generation failed: invalid LLM response');
    }

    console.log(`[onboarding] Story generated: "${story.title}" (${story.content.length} chars)`);

    // ── Generate Cover Image ──
    const ageGroup = getAgeGroup(childAge);

    const { ageRules: imageAgeRules, themeRules: imageThemeRules } = await loadImageRules(
      supabase, ageGroup, resolvedThemeKey, textLanguage
    );

    let imageStyleData: { styleKey: string; promptSnippet: string; ageModifier: string } | undefined;
    try {
      imageStyleData = await getStyleForAge(supabase, childAge);
      console.log(`[onboarding] Image style resolved: ${imageStyleData.styleKey}`);
    } catch (styleErr: any) {
      console.warn('[onboarding] Image style lookup failed:', styleErr?.message);
    }

    const coverPromptData = buildFallbackImagePrompt(
      story.title,
      `A ${childAge}-year-old child named ${childName} as the main character`,
      imageAgeRules,
      imageThemeRules,
      childAge,
      undefined,
      imageStyleData ? { promptSnippet: imageStyleData.promptSnippet, ageModifier: imageStyleData.ageModifier } : undefined,
    );

    let coverImageUrl: string | null = null;

    // Try Vertex AI (service account) first, then Lovable Gateway as fallback
    const VERTEX_SA_JSON = Deno.env.get('VERTEX_SERVICE_ACCOUNT_JSON') || Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');

    if (VERTEX_SA_JSON) {
      try {
        console.log('[onboarding] Generating cover image via Vertex AI...');
        const base64Result = await callVertexImageAPI(VERTEX_SA_JSON, coverPromptData.prompt);
        if (base64Result) {
          coverImageUrl = await uploadImageToStorage(supabase, base64Result, 'story-images', 'onboarding-cover');
        }
      } catch (e: any) {
        console.warn('[onboarding] Vertex AI image failed:', e?.message);
      }
    }

    if (!coverImageUrl) {
      try {
        console.log('[onboarding] Generating cover image via Lovable Gateway...');
        const base64Result = await callLovableImageGenerate(LOVABLE_API_KEY, coverPromptData.prompt);
        if (base64Result) {
          if (base64Result.startsWith('data:')) {
            coverImageUrl = await uploadImageToStorage(supabase, base64Result, 'story-images', 'onboarding-cover');
          } else if (base64Result.startsWith('http')) {
            coverImageUrl = base64Result;
          }
        }
      } catch (e: any) {
        console.warn('[onboarding] Lovable image also failed:', e?.message);
      }
    }

    if (coverImageUrl) {
      console.log(`[onboarding] Cover image ready: ${coverImageUrl.substring(0, 80)}...`);
    } else {
      console.warn('[onboarding] No cover image generated — continuing without image');
    }

    // ── Save to DB (user_id = NULL, temp_token for claiming) ──
    const tempToken = crypto.randomUUID();

    const { data: insertedStory, error: insertError } = await supabase
      .from('stories')
      .insert({
        title: story.title,
        content: story.content,
        text_language: textLanguage,
        cover_image_url: coverImageUrl,
        cover_image_status: coverImageUrl ? 'complete' : 'pending',
        user_id: null,
        kid_profile_id: null,
        temp_token: tempToken,
        generation_status: 'completed',
        difficulty: 'medium',
        text_type: 'fiction',
        story_length: 'short',
        image_style_key: imageStyleData?.styleKey || null,
        prompt: `[onboarding] ${childName}, age ${childAge}, ${textLanguage}, ${storyTheme}`,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[onboarding] DB insert failed:', insertError.message);
      throw new Error(`DB insert failed: ${insertError.message}`);
    }

    // Save comprehension questions to separate table
    if (story.questions?.length > 0 && insertedStory) {
      const questionsToInsert = story.questions.map((q: any, idx: number) => ({
        story_id: insertedStory.id,
        question: q.question,
        expected_answer: q.correctAnswer || q.expectedAnswer || q.correct_answer || '',
        options: q.options || [],
        order_index: idx,
      }));
      const { error: qError } = await supabase.from('comprehension_questions').insert(questionsToInsert);
      if (qError) console.warn('[onboarding] Failed to save questions:', qError.message);
    }

    // Save vocabulary words to separate table
    if (story.vocabulary?.length > 0 && insertedStory) {
      const wordsToInsert = story.vocabulary.map((w: any) => ({
        story_id: insertedStory.id,
        word: w.word,
        explanation: w.explanation,
        difficulty: 'medium',
      }));
      const { error: vError } = await supabase.from('marked_words').insert(wordsToInsert);
      if (vError) console.warn('[onboarding] Failed to save vocabulary:', vError.message);
    }

    const generationTimeMs = Date.now() - startTime;
    console.log(`[onboarding] Complete! Story ${insertedStory.id} saved. Time: ${generationTimeMs}ms`);

    // ── Response ──
    return new Response(JSON.stringify({
      title: story.title,
      content: story.content,
      coverImageUrl: coverImageUrl,
      tempToken: tempToken,
      storyId: insertedStory.id,
      questions: story.questions || [],
      vocabulary: story.vocabulary || [],
      generationTimeMs,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    const generationTimeMs = Date.now() - startTime;
    console.error(`[onboarding] Fatal error after ${generationTimeMs}ms:`, error?.message || error);

    return errorResponse(
      corsHeaders, 500,
      error?.message || 'Internal server error',
      'Fablino hatte einen kleinen Schluckauf. Bitte versuche es nochmal!'
    );
  }
});
