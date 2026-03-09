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
import { selectStorySubtype, type SelectedSubtype } from '../_shared/storySubtypeSelector.ts';
import { buildAppearanceAnchor, buildAnchorFromSlots } from '../_shared/appearanceAnchor.ts';
import { inferAgeCategory, inferGenderFromRelation } from '../_shared/appearanceSlots.ts';

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

        if (kidApp) {
          // Try Avatar V2 (appearance_data JSONB) first
          if (kidApp.appearance_data && typeof kidApp.appearance_data === 'object' && Object.keys(kidApp.appearance_data).length > 0) {
            anchorMap.set(kidProfileName, buildAnchorFromSlots(
              kidProfileName,
              age || 8,
              kidGender,
              'child',
              kidApp.appearance_data,
            ));
            console.log(`[FSE2-ANCHOR-DEBUG] kid anchor from appearance_data (V2) for "${kidProfileName}"`);
          } else if (kidApp.skin_tone || kidApp.hair_color) {
            // Fall back to legacy columns
            anchorMap.set(kidProfileName, buildAppearanceAnchor(
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
            ));
            console.log(`[FSE2-ANCHOR-DEBUG] kid anchor from legacy columns for "${kidProfileName}"`);
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

    // TEMPORARILY SKIPPED: Writer prompt not needed while Writer call is disabled
    // const writerPrompt = await loadPrompt('system_prompt_core_v3');
    // if (!writerPrompt) {
    //   throw new Error('system_prompt_core_v3 not found in app_settings');
    // }
    // console.log(`[FSE2] Writer prompt loaded from DB (${writerPrompt.length} chars)`);

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
    // 7. Planner call
    // -----------------------------------------------------------------------
    console.log('[FSE2-PLANNER-INPUT]', JSON.stringify({
      storyType: requestBody.storyType,
      subtype: selectedSubtype?.subtypeKey ?? null,
      characters: enrichedCharacters,
      description: requestBody.description,
      heroesVillains,
    }));

    const planPrompt = buildPlanPromptV2(storyLevel, lengthLevel, enrichedRequest, plannerPrompt, selectedSubtype, heroesVillains);
    console.log('[FSE2-PLANNER] Calling LLM...');
    const storyPlan = await callGemini(planPrompt.systemPrompt, planPrompt.userMessage, 0.8);
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
        const planJson = JSON.parse(storyPlan);
        const villainChar = planJson?.characters?.find((c: any) => c.role === 'antagonist');
        const villainName = villainChar?.name ?? null;
        const extracted = planJson?.extracted ?? null;

        const plannerUpdate: Record<string, any> = {};
        if (villainName) plannerUpdate.villain_name = villainName;
        if (extracted?.storyType) plannerUpdate.story_type = extracted.storyType;

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
    // 8. Writer call — TEMPORARILY SKIPPED: return storyPlan directly
    // -----------------------------------------------------------------------
    // const storyPrompt = buildStoryPromptV2(writerLevel, lengthLevel, storyPlan, requestBody, writerPrompt);
    // console.log('[FSE2-WRITER] Calling LLM...');
    // const content = await callGemini(storyPrompt.systemPrompt, storyPrompt.userMessage, 0.8);
    // console.log(`[FSE2-WRITER] Done (${content.length} chars). Preview: ${content.substring(0, 200)}`);

    const content = storyPlan;

    // -----------------------------------------------------------------------
    // 9. Return response (matches FSE1 shape for frontend compatibility)
    // -----------------------------------------------------------------------
    const totalTime = Date.now() - startTime;
    console.log(`[FSE2] Pipeline complete in ${totalTime}ms (Writer skipped)`);

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
