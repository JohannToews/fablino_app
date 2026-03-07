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
  type KidLanguageSettings,
} from '../_shared/promptBuilderV2.ts';

// ---------------------------------------------------------------------------
// LLM call — reuses the same Gemini global-API pattern from index.ts
// We duplicate a slim version here to avoid modifying index.ts.
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.8,
  maxRetries = 3,
): Promise<string> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = 'gemini-3.1-flash-lite-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`[FSE2-LLM] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
      await sleep(waitTime);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FSE2-LLM] API error ${response.status}:`, errorText.substring(0, 300));
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        console.error('[FSE2-LLM] No content in response:', JSON.stringify(data).substring(0, 300));
        lastError = new Error('No content in response');
        await sleep(2000);
        continue;
      }

      return content;
    } catch (error) {
      if (error instanceof Error && error.message === 'Rate limited') {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('[FSE2-LLM] Max retries exceeded');
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
    age,
    kidName,
    topic,
    characters,
    genre,
    userId,
  } = requestBody;

  // 1. Entry log
  console.log('[FSE2-ENTRY] user=' + userId + ' kid=' + kidProfileId + ' language=' + language + ' age=' + age);

  try {
    // -----------------------------------------------------------------------
    // 2. Load kid language settings — fall back to age-based defaults
    // -----------------------------------------------------------------------
    let langSettings: KidLanguageSettings | null = null;

    if (kidProfileId) {
      langSettings = await loadKidLanguageSettings(supabase, kidProfileId, language);
    }

    if (!langSettings) {
      console.log('[FSE2] No kid_language_settings found, falling back to age_level_defaults');
      const defaultLevel = await loadAgeLevelDefault(supabase, age);
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
    console.log(`[FSE2] Writer prompt loaded from DB (${writerPrompt.length} chars)`);

    // -----------------------------------------------------------------------
    // 7. Planner call
    // -----------------------------------------------------------------------
    const planPrompt = buildPlanPromptV2(storyLevel, lengthLevel, requestBody, plannerPrompt);
    console.log('[FSE2-PLANNER] Calling LLM...');
    const storyPlan = await callGemini(planPrompt.systemPrompt, planPrompt.userMessage, 0.8);
    console.log(`[FSE2-PLANNER] Done (${storyPlan.length} chars). Output:\n${storyPlan}`);

    // -----------------------------------------------------------------------
    // 8. Writer call
    // -----------------------------------------------------------------------
    const storyPrompt = buildStoryPromptV2(writerLevel, lengthLevel, storyPlan, requestBody, writerPrompt);
    console.log('[FSE2-WRITER] Calling LLM...');
    const content = await callGemini(storyPrompt.systemPrompt, storyPrompt.userMessage, 0.8);
    console.log(`[FSE2-WRITER] Done (${content.length} chars). Preview: ${content.substring(0, 200)}`);

    // -----------------------------------------------------------------------
    // 9. Return response (matches FSE1 shape for frontend compatibility)
    // -----------------------------------------------------------------------
    const totalTime = Date.now() - startTime;
    console.log(`[FSE2] Pipeline complete in ${totalTime}ms`);

    return new Response(JSON.stringify({
      content,
      title: '',
      story_plan: storyPlan,
      generationTimeMs: totalTime,
      performance: {
        story_generation_ms: totalTime,
        image_generation_ms: 0,
        consistency_check_ms: 0,
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
