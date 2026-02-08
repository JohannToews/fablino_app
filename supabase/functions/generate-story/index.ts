import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildStoryPrompt, injectLearningTheme, StoryRequest } from '../_shared/promptBuilder.ts';
import { shouldApplyLearningTheme } from '../_shared/learningThemeRotation.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// API endpoints
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_IMAGE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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

// Interface for consistency check result (v2 format)
interface ConsistencyCheckResultV2 {
  errors_found: boolean;
  summary: string;
  errors: Array<{
    category: string;
    severity: string;
    original: string;
    problem: string;
    fix: string;
  }>;
  stats: { critical: number; medium: number; low: number };
}

// Old interface for backwards compatibility
interface ConsistencyCheckResult {
  hasIssues: boolean;
  issues: string[];
  suggestedFixes: string;
}

// Helper function to fetch consistency check prompts (v2 or fallback to old)
async function getConsistencyCheckPromptV2(supabase: any): Promise<{ basePrompt: string | null; seriesAddon: string | null }> {
  try {
    // Fetch both v2 prompts
    const { data: prompts } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["consistency_check_prompt_v2", "consistency_check_series_addon_v2"]);
    
    const basePrompt = prompts?.find((p: any) => p.key === "consistency_check_prompt_v2")?.value || null;
    const seriesAddon = prompts?.find((p: any) => p.key === "consistency_check_series_addon_v2")?.value || null;
    
    return { basePrompt, seriesAddon };
  } catch (error) {
    console.error("Error fetching consistency check prompt v2:", error);
    return { basePrompt: null, seriesAddon: null };
  }
}

// Helper function to fetch OLD consistency check prompt from database (fallback)
async function getConsistencyCheckPrompt(): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First try the new universal prompt, fallback to German if not found
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "system_prompt_consistency_check")
      .maybeSingle();
    
    if (data?.value) {
      return data.value;
    }
    
    // Fallback to old German prompt for backwards compatibility
    const { data: fallback } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "system_prompt_consistency_check_de")
      .maybeSingle();
    
    return fallback?.value || null;
  } catch (error) {
    console.error("Error fetching consistency check prompt:", error);
    return null;
  }
}

// Helper function to perform consistency check with v2 prompt (all languages)
async function performConsistencyCheckV2(
  apiKey: string,
  story: { title: string; content: string },
  prompt: string
): Promise<ConsistencyCheckResultV2> {
  const userPrompt = `${prompt}

--- STORY TO CHECK ---

TITLE: ${story.title}

CONTENT:
${story.content}`;

  try {
    const response = await callLovableAI(apiKey, "You are a children's story quality checker. Respond only with valid JSON.", userPrompt, 0.3);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("[Consistency V2] Could not parse response, assuming no issues");
      return { errors_found: false, summary: "", errors: [], stats: { critical: 0, medium: 0, low: 0 } };
    }
    
    const result = JSON.parse(jsonMatch[0]);
    return {
      errors_found: result.errors_found === true,
      summary: result.summary || "",
      errors: Array.isArray(result.errors) ? result.errors : [],
      stats: result.stats || { critical: 0, medium: 0, low: 0 }
    };
  } catch (error) {
    console.error("Error in consistency check v2:", error);
    return { errors_found: false, summary: "", errors: [], stats: { critical: 0, medium: 0, low: 0 } };
  }
}

// Helper function to perform consistency check on generated story (OLD - for fallback)
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

// Helper function to correct story based on consistency check results (v2 format)
async function correctStoryV2(
  apiKey: string,
  story: { title: string; content: string; questions: any[]; vocabulary: any[] },
  errors: ConsistencyCheckResultV2['errors'],
  targetLanguage: string
): Promise<{ title: string; content: string; questions: any[]; vocabulary: any[]; correctedCount: number }> {
  // Build correction instructions from errors
  const errorInstructions = errors.map((e, i) => 
    `${i + 1}. [${e.severity}] ${e.category}: "${e.original}" → Problem: ${e.problem} → Fix: ${e.fix}`
  ).join('\n');

  const correctionPrompt = `You are a text editor. Correct the following text based on the found problems.

IMPORTANT:
- Keep the language (${targetLanguage})
- Keep the style and structure
- Correct ONLY the mentioned problems
- The text must remain child-friendly`;

  const userPrompt = `Correct this story:

TITLE: ${story.title}

CONTENT:
${story.content}

ERRORS TO FIX:
${errorInstructions}

Respond ONLY with a JSON object:
{
  "title": "Corrected title (or original if no issue)",
  "content": "The fully corrected text"
}`;

  try {
    const response = await callLovableAI(apiKey, correctionPrompt, userPrompt, 0.5);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse correction response");
      return { ...story, correctedCount: 0 };
    }
    
    const corrected = JSON.parse(jsonMatch[0]);
    
    // Count how many errors were actually corrected by checking if content changed
    let correctedCount = 0;
    if (corrected.content && corrected.content !== story.content) {
      // For each error, check if the original text is no longer present
      for (const error of errors) {
        if (error.original && !corrected.content.includes(error.original)) {
          correctedCount++;
        }
      }
    }
    if (corrected.title && corrected.title !== story.title) {
      correctedCount++;
    }
    
    return {
      title: corrected.title || story.title,
      content: corrected.content || story.content,
      questions: story.questions,
      vocabulary: story.vocabulary,
      correctedCount
    };
  } catch (error) {
    console.error("Error correcting story:", error);
    return { ...story, correctedCount: 0 };
  }
}

// Helper function to correct story based on consistency check results (OLD - for fallback)
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

// Helper function to call Gemini API for image generation with retry logic
async function callGeminiImageAPI(
  apiKey: string,
  prompt: string,
  maxRetries: number = 3
): Promise<string | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 3s, 6s, 12s... (longer for images)
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`Image API rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
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
        console.log(`Gemini Image API rate limited (attempt ${attempt + 1}/${maxRetries})`);
        lastError = new Error("Rate limited");
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini Image API error:", response.status, errorText);
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
      
      console.error("No image found in Gemini response");
      return null;
    } catch (error) {
      console.error("Error calling Gemini Image API:", error);
      return null;
    }
  }
  
  console.log("Max retries exceeded for image generation");
  return null;
}

// Helper function to call Gemini API for image editing (with reference image) with retry logic
async function callGeminiImageEditAPI(
  apiKey: string,
  prompt: string,
  referenceImageBase64: string,
  maxRetries: number = 3
): Promise<string | null> {
  // Extract base64 data and mime type from data URL
  const matches = referenceImageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    console.error("Invalid base64 image format");
    return null;
  }
  const mimeType = matches[1];
  const base64Data = matches[2];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const waitTime = Math.pow(2, attempt) * 1500;
      console.log(`Image Edit API rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
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
        console.log(`Gemini Image Edit API rate limited (attempt ${attempt + 1}/${maxRetries})`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini Image Edit API error:", response.status, errorText);
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
      
      console.error("No image found in Gemini edit response");
      return null;
    } catch (error) {
      console.error("Error calling Gemini Image Edit API:", error);
      return null;
    }
  }
  
  console.log("Max retries exceeded for image editing");
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

  // Generate new image
  let imageUrl: string | null = null;
  
  if (useEdit && referenceImage) {
    imageUrl = await callGeminiImageEditAPI(geminiKey, prompt, referenceImage);
    if (!imageUrl) {
      imageUrl = await callLovableImageEdit(lovableKey, prompt, referenceImage);
    }
  } else {
    imageUrl = await callGeminiImageAPI(geminiKey, prompt);
    if (!imageUrl) {
      imageUrl = await callLovableImageGenerate(lovableKey, prompt);
    }
  }

  // Cache the result if successful
  if (imageUrl) {
    await cacheImage(supabase, prompt, imageUrl);
  }

  return imageUrl;
}

// Performance tracking interface
interface PerfMetrics {
  storyLLM: number;
  parsing: number;
  consistency: number | 'skipped';
  imagePromptBuild: number;
  imageGeneration: number;
  imageProvider: string;
  dbSave: number;
  total: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const perf: Partial<PerfMetrics> = {};

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
    } = await req.json();

    // Block 2.3d/e: Debug logging for character data from frontend
    console.log('[generate-story] Request body characters:', JSON.stringify(characters, null, 2));
    console.log('[generate-story] Request body selectedCharacters:', JSON.stringify(selectedCharacters, null, 2));
    console.log('[generate-story] include_self:', includeSelf);
    console.log('[generate-story] surprise_characters:', surpriseCharactersParam);
    console.log('[generate-story] storyType:', storyType);

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

      const storyRequest: StoryRequest = {
        kid_profile: {
          id: kidProfileId || userId || 'unknown',
          first_name: kidName || 'Child',
          age: kidAge || 8,
          difficulty_level: difficultyLevel || 2,
          content_safety_level: contentSafetyLevel || 2,
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
      if ((isSeries || (episodeNumber && episodeNumber > 1)) && serienModulPrompt) {
        compositePrompt += `# SERIEN-MODUL\n${serienModulPrompt}\n\n`;
      }
      fullSystemPromptFinal = compositePrompt.trim() || customSystemPrompt || "";
      // userMessageFinal will be set below in the old dynamic context block
    }

    const baseSystemPrompt = fullSystemPromptFinal;

    // Determine how many images to generate based on length
    const imageCountMap: Record<string, number> = {
      very_short: 1, // Cover only
      short: 1,      // Cover only
      medium: 2,     // Cover + 1 progress image
      long: 3,       // Cover + 2 progress images
      very_long: 4,  // Cover + 3 progress images
    };
    // Use length parameter from request (e.g., 'medium', 'long')
    const effectiveLength = storyLength || length || 'medium';
    const totalImageCount = imageCountMap[effectiveLength] || 1;
    console.log(`[generate-story] Image count config: length="${length}", storyLength="${storyLength}", effectiveLength="${effectiveLength}", totalImageCount=${totalImageCount}`);

    // Get API keys
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured (needed for image generation)");
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

      const oldSeriesContext = episodeNumber && episodeNumber > 1 
        ? `\n\n**SERIEN-KONTEXT:**
- Dies ist Episode ${episodeNumber} einer fortlaufenden Serie
- Führe die Geschichte nahtlos fort, behalte dieselben Charaktere und den Stil bei
- Der Text in "description" enthält den Kontext der vorherigen Episode
- Das Ende sollte ${endingType === 'C' ? 'ein Cliffhanger sein, der Spannung für die nächste Episode aufbaut' : endingType === 'B' ? 'offen sein' : 'abgeschlossen sein'}`
        : '';

      userPrompt = `Erstelle ${textType === "non-fiction" ? "einen Sachtext" : "eine Geschichte"} basierend auf dieser Beschreibung: "${description}"
${oldSeriesContext}
**WICHTIG:** 
- Der gesamte Text muss auf ${targetLanguage} sein!
- Der Text MUSS mindestens **${minWordCount} Wörter** haben! Zähle deine Wörter und erweitere wenn nötig!

Antworte NUR mit einem validen JSON-Objekt.
Erstelle genau ${questionCount} Multiple-Choice Fragen.
Wähle genau 10 Vokabelwörter aus.`;
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

      // [PERF] Story LLM call - START
      const llmStart = Date.now();
      const content = await callLovableAI(LOVABLE_API_KEY, fullSystemPrompt, promptToUse, 0.8);
      const llmDuration = Date.now() - llmStart;
      perf.storyLLM = (perf.storyLLM || 0) + llmDuration;
      console.log(`[generate-story] [PERF] Story LLM call: ${llmDuration}ms`);
      // [PERF] Story LLM call - END

      // [PERF] Response parsing - START
      const parseStart = Date.now();
      // Parse the JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not parse story JSON from:", content);
        throw new Error("Could not parse story JSON");
      }

      story = JSON.parse(jsonMatch[0]);
      const parseDuration = Date.now() - parseStart;
      perf.parsing = (perf.parsing || 0) + parseDuration;
      console.log(`[generate-story] [PERF] Response parsing: ${parseDuration}ms`);
      // [PERF] Response parsing - END

      // Quality check: Count words in the story content
      const wordCountActual = countWords(story.content);
      console.log(`Story word count: ${wordCountActual}, minimum required: ${minWordCount}`);

      if (wordCountActual >= minWordCount) {
        console.log("Word count check PASSED");
        break;
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

    const storyGenerationTime = Date.now() - startTime;
    console.log(`Story text generated in ${storyGenerationTime}ms`);

    // ================== PARALLEL: CONSISTENCY CHECK + IMAGES ==================
    // Start consistency check and image generation in PARALLEL
    
    const adminLangMap: Record<string, string> = { DE: 'de', FR: 'fr', EN: 'en' };
    const adminLanguage = adminLangMap[textLanguage] || 'de';
    
    // Prepare image generation parameters
    const effectiveSchoolLevel = schoolLevel || "CE2";
    const schoolLevelLower = effectiveSchoolLevel.toLowerCase();
    let artStyle: string;
    let targetAudience: string;
    
    if (textType === "non-fiction") {
      if (schoolLevelLower.includes("cp") || schoolLevelLower.includes("1e") || schoolLevelLower.includes("ce1") || schoolLevelLower.includes("2e") || schoolLevelLower.includes("grade 2") || schoolLevelLower.includes("groep 4") || schoolLevelLower.includes("2. klasse") || schoolLevelLower.includes("2º")) {
        artStyle = "Clean educational illustration style, accurate and informative, friendly but realistic depictions, clear visual hierarchy, similar to quality children's encyclopedia or National Geographic Kids.";
        targetAudience = "early primary school children (ages 6-7)";
      } else if (schoolLevelLower.includes("ce2") || schoolLevelLower.includes("3e") || schoolLevelLower.includes("grade 3") || schoolLevelLower.includes("groep 5") || schoolLevelLower.includes("3. klasse") || schoolLevelLower.includes("3º")) {
        artStyle = "Detailed educational illustration, realistic proportions, informative visual elements, documentary photography inspired, similar to DK Eyewitness or Usborne educational books.";
        targetAudience = "mid primary school children (ages 8-9)";
      } else if (schoolLevelLower.includes("cm1") || schoolLevelLower.includes("4e") || schoolLevelLower.includes("grade 4") || schoolLevelLower.includes("groep 6") || schoolLevelLower.includes("4. klasse") || schoolLevelLower.includes("4º")) {
        artStyle = "Sophisticated documentary illustration style, realistic and accurate, scientific visualization quality, infographic elements, similar to educational textbooks or science magazines.";
        targetAudience = "upper primary school children (ages 9-10)";
      } else {
        artStyle = "Professional documentary or photorealistic illustration style, highly detailed and accurate, educational diagram quality, similar to scientific publications or high-quality textbooks.";
        targetAudience = "upper primary school children (ages 10-11)";
      }
    } else {
      if (schoolLevelLower.includes("cp") || schoolLevelLower.includes("1e") || schoolLevelLower.includes("ce1") || schoolLevelLower.includes("2e") || schoolLevelLower.includes("grade 2") || schoolLevelLower.includes("groep 4") || schoolLevelLower.includes("2. klasse") || schoolLevelLower.includes("2º")) {
        artStyle = "Colorful cartoon style, friendly characters with expressive faces, slightly more detailed backgrounds, similar to Disney Junior or Paw Patrol style.";
        targetAudience = "early primary school children (ages 6-7)";
      } else if (schoolLevelLower.includes("ce2") || schoolLevelLower.includes("3e") || schoolLevelLower.includes("grade 3") || schoolLevelLower.includes("groep 5") || schoolLevelLower.includes("3. klasse") || schoolLevelLower.includes("3º")) {
        artStyle = "Dynamic comic book style, more mature character designs with personality, action-oriented poses, vibrant colors, similar to modern animated movies like Pixar or DreamWorks.";
        targetAudience = "mid primary school children (ages 8-9)";
      } else if (schoolLevelLower.includes("cm1") || schoolLevelLower.includes("4e") || schoolLevelLower.includes("grade 4") || schoolLevelLower.includes("groep 6") || schoolLevelLower.includes("4. klasse") || schoolLevelLower.includes("4º")) {
        artStyle = "Dynamic comic book style with more sophisticated compositions, detailed character designs, vibrant colors, similar to high-quality animated movies.";
        targetAudience = "upper primary school children (ages 9-10)";
      } else {
        artStyle = "Semi-realistic illustration style, detailed environments, characters with realistic proportions, dynamic compositions, similar to graphic novel or manga-inspired art.";
        targetAudience = "upper primary school children (ages 10-11)";
      }
    }

    // [PERF] Image prompt build - START
    const imagePromptStart = Date.now();
    
    // Generate character description for image consistency
    let characterDescription = "";
    try {
      const characterDescriptionPrompt = `Analysiere diese Geschichte und erstelle eine kurze, präzise visuelle Beschreibung der Hauptcharaktere (Aussehen, Kleidung, besondere Merkmale). Maximal 100 Wörter. Antwort auf Englisch für den Bildgenerator.`;
      const characterContext = `Geschichte: "${story.title}"\n${story.content.substring(0, 500)}...`;
      characterDescription = await callLovableAI(LOVABLE_API_KEY, characterDescriptionPrompt, characterContext, 0.3);
      console.log("Character description generated:", characterDescription.substring(0, 100));
    } catch (err) {
      console.error("Error generating character description:", err);
    }
    
    const imagePromptDuration = Date.now() - imagePromptStart;
    perf.imagePromptBuild = imagePromptDuration;
    console.log(`[generate-story] [PERF] Image prompt build: ${imagePromptDuration}ms`);
    // [PERF] Image prompt build - END

    // Build cover image prompt
    const coverPrompt = `A captivating book cover illustration for a ${textType === "non-fiction" ? "non-fiction educational book" : "children's story"}. 
Theme: ${description}. 
Story title: "${story.title}"
${characterDescription ? `Main characters: ${characterDescription}` : ""}
Art Style: ${artStyle}
Target audience: ${targetAudience}.
Requirements: High quality ${textType === "non-fiction" ? "educational and informative" : "imaginative and engaging"} illustration.
IMPORTANT: Create distinctive, memorable character designs that can be recognized in follow-up illustrations.
CRITICAL: The image must contain ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO WRITING of any kind. Pure illustration only.`;

    // Prepare progress image prompts
    // Normalize escaped newlines (LLM sometimes returns literal "\n" strings)
    // ROBUST: Handle multiple escape patterns and ensure clean paragraph splitting
    let normalizedContent = story.content;
    
    // Pattern 1: Literal escaped sequences (\\n\\n or \\n)
    normalizedContent = normalizedContent.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');
    
    // Pattern 2: Mixed single backslash (sometimes JSON parsing leaves single backslash)
    if (normalizedContent.includes('\\n')) {
      normalizedContent = normalizedContent.replace(/\n/g, '\n');  // Already real newlines, skip
    }
    
    // Pattern 3: Multiple consecutive newlines → collapse to double newline (paragraph boundary)
    normalizedContent = normalizedContent.replace(/\n\n\n+/g, '\n\n');
    
    // Pattern 4: Trailing/leading whitespace in paragraphs
    const storyParts = normalizedContent
      .split('\n\n')
      .map(p => p.trim())
      .filter((p: string) => p.length > 0);
    
    const partCount = storyParts.length;
    console.log(`[generate-story] Story has ${partCount} paragraphs (after normalization), totalImageCount=${totalImageCount}, will generate ${Math.min(totalImageCount - 1, partCount > 1 ? 1 : 0)} progress images`);
    console.log(`[generate-story] Debug - Raw content length: ${story.content.length}, normalized length: ${normalizedContent.length}`);
    if (partCount <= 1) {
      console.log(`[generate-story] Debug - Full normalized content:\n${normalizedContent.substring(0, 500)}`);
    }
    
    const styleReference = `
CRITICAL - VISUAL CONSISTENCY REQUIREMENTS:
- Use EXACTLY the same art style as the cover image: ${artStyle}
- Keep the SAME character designs, faces, clothing, and distinctive features as the cover
- Maintain consistent color palette and lighting style
- Characters must be immediately recognizable from the cover image
${characterDescription ? `- Character reference: ${characterDescription}` : ""}
- ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO WRITING of any kind in the image
`;

    const progressPrompts: string[] = [];
    
    if (totalImageCount >= 2 && partCount > 1) {
      const middleIndex = Math.floor(partCount / 2);
      const middleContext = storyParts[middleIndex]?.substring(0, 200) || description;
      progressPrompts.push(`Continue the visual story from the cover image. Scene from the middle of the story: "${middleContext}".

${styleReference}

Art Style: ${textType === "non-fiction" ? "Simplified documentary sketch style" : "Gentle, slightly muted version of the cover style"} with softer, pastel tones.
The image should maintain the same characters but with reduced visual intensity - think soft colors and gentle washes.
Target audience: ${targetAudience}. 
The characters MUST look exactly like they do on the cover - same faces, hair, clothing, proportions.
CRITICAL: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO WRITING of any kind. Pure illustration only.`);
    }
    
    if (totalImageCount >= 3 && partCount > 2) {
      const nearEndIndex = Math.floor(partCount * 0.75);
      const nearEndContext = storyParts[nearEndIndex]?.substring(0, 200) || description;
      progressPrompts.push(`Continue the visual story. Scene near the end: "${nearEndContext}".

${styleReference}

Art Style: ${textType === "non-fiction" ? "Simple line-art sketch with minimal color" : "Soft pencil sketch style matching the cover"} using desaturated, calm tones.
Very understated visual style - muted colors, intentionally reduced saturation.
Target audience: ${targetAudience}. 
CRITICAL: The characters MUST be the exact same as in the cover image - identical faces, features, and clothing.
CRITICAL: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO WRITING of any kind. Pure illustration only.`);
    }

    // ================== PARALLEL EXECUTION ==================
    console.log("Starting PARALLEL execution: consistency check + image generation...");

    // Track consistency check results
    let totalIssuesFound = 0;
    let totalIssuesCorrected = 0;
    let allIssueDetails: string[] = [];
    let coverImageBase64: string | null = null;
    const storyImages: string[] = [];

    // Create parallel tasks
    // [PERF] Consistency check timing
    let consistencyStart = 0;
    let consistencyDuration: number | 'skipped' = 'skipped';
    
    const consistencyCheckTask = async () => {
      // Load v2 consistency check prompts (with placeholders)
      const { basePrompt: rawPrompt, seriesAddon } = await getConsistencyCheckPromptV2(supabase);
      
      if (!rawPrompt) {
        console.log("[generate-story] [PERF] Consistency check: skipped (no prompt)");
        return;
      }
      
      consistencyStart = Date.now();
      
      // Determine age range from school level
      const ageRanges: Record<string, { min: number; max: number }> = {
        'cp': { min: 6, max: 7 }, '1e': { min: 6, max: 7 },
        'ce1': { min: 7, max: 8 }, '2e': { min: 7, max: 8 },
        'ce2': { min: 8, max: 9 }, '3e': { min: 8, max: 9 },
        'cm1': { min: 9, max: 10 }, '4e': { min: 9, max: 10 },
        'cm2': { min: 10, max: 11 }, '5e': { min: 10, max: 11 },
        '6e': { min: 11, max: 12 },
        // German
        '1. klasse': { min: 6, max: 7 }, '2. klasse': { min: 7, max: 8 },
        '3. klasse': { min: 8, max: 9 }, '4. klasse': { min: 9, max: 10 },
        // English
        'grade 1': { min: 6, max: 7 }, 'grade 2': { min: 7, max: 8 },
        'grade 3': { min: 8, max: 9 }, 'grade 4': { min: 9, max: 10 },
        'grade 5': { min: 10, max: 11 },
      };
      const effectiveSchoolLevelLower = (schoolLevel || 'ce2').toLowerCase();
      const ageRange = ageRanges[effectiveSchoolLevelLower] || { min: 8, max: 9 };
      
      // Map text language code to full language name
      const languageMap: Record<string, string> = {
        'DE': 'German', 'FR': 'French', 'EN': 'English',
        'ES': 'Spanish', 'IT': 'Italian', 'NL': 'Dutch', 'PT': 'Portuguese'
      };
      const storyLanguage = languageMap[textLanguage] || 'French';
      
      // Replace placeholders in base prompt
      let prompt = rawPrompt
        .replace(/{story_language}/g, storyLanguage)
        .replace(/{age_min}/g, String(ageRange.min))
        .replace(/{age_max}/g, String(ageRange.max));
      
      // Add series addon if applicable
      if (seriesId && episodeNumber && episodeNumber > 1 && seriesAddon) {
        // Build series context from description (which contains previous episode info)
        const seriesContext = description?.substring(0, 1500) || '';
        prompt += '\n\n' + seriesAddon
          .replace(/{episode_number}/g, String(episodeNumber))
          .replace(/{series_context}/g, seriesContext);
      }
      
      console.log(`[generate-story] Starting consistency check v2 (language: ${storyLanguage}, age: ${ageRange.min}-${ageRange.max})...`);
      
      let correctionAttempts = 0;
      const maxCorrectionAttempts = 2;
      
      while (correctionAttempts < maxCorrectionAttempts) {
        const checkResult = await performConsistencyCheckV2(
          LOVABLE_API_KEY,
          story,
          prompt
        );
        
        if (!checkResult.errors_found || checkResult.errors.length === 0) {
          console.log(`[generate-story] Consistency check passed${correctionAttempts > 0 ? ' after correction' : ''}`);
          break;
        }
        
        // Map errors to issue_details format: [SEVERITY] [CATEGORY] problem | Original: "..." | Fix: "..."
        const newIssueDetails = checkResult.errors.map(e => 
          `[${e.severity}] [${e.category}] ${e.problem} | Original: "${e.original}" | Fix: "${e.fix}"`
        );
        
        totalIssuesFound += checkResult.errors.length;
        allIssueDetails.push(...newIssueDetails);
        
        correctionAttempts++;
        console.log(`[generate-story] Consistency check found ${checkResult.errors.length} issue(s) (${checkResult.stats.critical} critical, ${checkResult.stats.medium} medium, ${checkResult.stats.low} low), attempting correction ${correctionAttempts}/${maxCorrectionAttempts}...`);
        console.log(`[generate-story] Summary: ${checkResult.summary}`);
        
        const correctedStory = await correctStoryV2(
          LOVABLE_API_KEY,
          story,
          checkResult.errors,
          storyLanguage
        );
        
        if (correctedStory.content !== story.content || correctedStory.title !== story.title) {
          story.title = correctedStory.title;
          story.content = correctedStory.content;
          // Only count errors that were actually corrected
          totalIssuesCorrected += correctedStory.correctedCount;
          console.log(`[generate-story] Story corrected (${correctedStory.correctedCount}/${checkResult.errors.length} errors fixed), re-checking...`);
        } else {
          console.log("[generate-story] No changes made in correction, stopping");
          break;
        }
      }
      
      // Save consistency check results
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
        console.log("[generate-story] Consistency check results saved");
      } catch (dbErr) {
        console.error("[generate-story] Error saving consistency check results:", dbErr);
      }
      
      consistencyDuration = Date.now() - consistencyStart;
      console.log(`[generate-story] [PERF] Consistency check: ${consistencyDuration}ms`);
    };

    // [PERF] Image generation timing
    let imageGenStart = 0;
    let imageProvider = 'none';
    
    const coverImageTask = async () => {
      console.log("Generating cover image...");
      imageGenStart = Date.now();
      
      // Check cache first
      const cachedCover = await getCachedImage(supabase, coverPrompt);
      if (cachedCover) {
        coverImageBase64 = cachedCover;
        imageProvider = 'cache';
        console.log("Cover image from cache");
        return;
      }
      
      // Try Gemini first
      coverImageBase64 = await callGeminiImageAPI(GEMINI_API_KEY, coverPrompt);
      if (coverImageBase64) {
        imageProvider = 'gemini';
        await cacheImage(supabase, coverPrompt, coverImageBase64);
        console.log("Cover image generated successfully (Gemini)");
      } else {
        // Fallback to Lovable Gateway
        coverImageBase64 = await callLovableImageGenerate(LOVABLE_API_KEY, coverPrompt);
        if (coverImageBase64) {
          imageProvider = 'lovable-gateway';
          await cacheImage(supabase, coverPrompt, coverImageBase64);
          console.log("Cover image generated successfully (Lovable Gateway)");
        } else {
          console.log("Cover image generation failed");
        }
      }
    };

    // Execute cover image and consistency check in PARALLEL
    await Promise.all([
      consistencyCheckTask(),
      coverImageTask()
    ]);

    // Now generate progress images in PARALLEL (they need cover as reference)
    if (coverImageBase64 && progressPrompts.length > 0) {
      console.log(`Generating ${progressPrompts.length} progress image(s) in PARALLEL...`);
      
      const progressImageTasks = progressPrompts.map(async (prompt, index) => {
        console.log(`Starting progress image ${index + 1}...`);
        const image = await generateImageWithCache(
          supabase,
          GEMINI_API_KEY,
          LOVABLE_API_KEY,
          prompt,
          true, // useEdit
          coverImageBase64!
        );
        if (image) {
          console.log(`Progress image ${index + 1} generated`);
        }
        return image;
      });

      const progressResults = await Promise.all(progressImageTasks);
      
      // Filter out nulls and add to storyImages
      for (const img of progressResults) {
        if (img) {
          storyImages.push(img);
        }
      }
    }

    // [PERF] Image generation - END (covers all image work)
    const imageGenDuration = imageGenStart > 0 ? Date.now() - imageGenStart : 0;
    console.log(`[generate-story] [PERF] Image generation: ${imageGenDuration}ms (provider: ${imageProvider})`);
    
    // Update perf metrics
    perf.consistency = consistencyDuration;
    perf.imageGeneration = imageGenDuration;
    perf.imageProvider = imageProvider;

    // ================== END PARALLEL EXECUTION ==================

    const totalTime = Date.now() - startTime;
    console.log(`Total generation time: ${totalTime}ms (story: ${storyGenerationTime}ms, images+check: ${totalTime - storyGenerationTime}ms)`);

    // Final word count log
    const finalWordCount = countWords(story.content);
    console.log(`Final story delivered with ${finalWordCount} words (min: ${minWordCount})`);

    const imageWarning = !coverImageBase64
      ? "cover_generation_failed"
      : (totalImageCount > 1 && storyImages.length < (totalImageCount - 1))
        ? "some_progress_images_failed"
        : null;

    console.log(`Story generated with ${story.vocabulary?.length || 0} vocabulary words`);
    console.log(`Structure classification: beginning=${structureBeginning}, middle=${structureMiddle}, ending=${structureEnding}`);
    console.log(`Emotional coloring: ${emotionalColoring}/${emotionalSecondary}, humor=${humorLevel}, depth=${emotionalDepth}`);
    
    // [PERF] === SUMMARY ===
    perf.storyLLM = perf.storyLLM || 0;
    perf.parsing = perf.parsing || 0;
    perf.imagePromptBuild = perf.imagePromptBuild || 0;
    perf.total = totalTime;
    
    console.log(`[generate-story] [PERF] === SUMMARY ===`);
    console.log(`[generate-story] [PERF]   Story LLM:        ${String(perf.storyLLM).padStart(6)}ms`);
    console.log(`[generate-story] [PERF]   Parsing:          ${String(perf.parsing).padStart(6)}ms`);
    console.log(`[generate-story] [PERF]   Consistency:      ${typeof perf.consistency === 'number' ? String(perf.consistency).padStart(6) + 'ms' : 'skipped'}`);
    console.log(`[generate-story] [PERF]   Image prompt:     ${String(perf.imagePromptBuild).padStart(6)}ms`);
    console.log(`[generate-story] [PERF]   Image generation: ${String(perf.imageGeneration || 0).padStart(6)}ms (provider: ${perf.imageProvider || 'none'})`);
    console.log(`[generate-story] [PERF]   TOTAL:            ${String(perf.total).padStart(6)}ms`);

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
      // Existing fields
      coverImageBase64,
      storyImages,
      imageWarning,
      generationTimeMs: totalTime,
      usedNewPromptPath,
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
