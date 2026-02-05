import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

// Interface for consistency check result
interface ConsistencyCheckResult {
  hasIssues: boolean;
  issues: string[];
  suggestedFixes: string;
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

// Helper function to correct story based on consistency check results
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
      kidHobbies
    } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ================== MODULAR PROMPT LOADING ==================
    // Load prompts from database based on source and settings
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

    // Load prompts in parallel
    const [corePrompt, elternModulPrompt, kinderModulPrompt, serienModulPrompt] = await Promise.all([
      loadPrompt(`system_prompt_${adminLangCode}`),
      loadPrompt(`system_prompt_story_creation_${adminLangCode}`),
      loadPrompt(`system_prompt_kid_creation_${adminLangCode}`),
      loadPrompt(`system_prompt_continuation_${adminLangCode}`)
    ]);

    console.log("Loaded prompts:", {
      source,
      isSeries,
      hasCorePrompt: !!corePrompt,
      hasElternModul: !!elternModulPrompt,
      hasKinderModul: !!kinderModulPrompt,
      hasSerienModul: !!serienModulPrompt
    });

    // Build composite system prompt based on source
    let compositePrompt = "";

    // CORE: Always included
    if (corePrompt) {
      compositePrompt += `# CORE PROMPT\n${corePrompt}\n\n`;
    }

    // MODULE: Add ELTERN-MODUL or KINDER-MODUL based on source
    if (source === 'admin' && elternModulPrompt) {
      compositePrompt += `# ELTERN-MODUL (Admin/Lehrer Modus)\n${elternModulPrompt}\n\n`;
    } else if (source === 'kid' && kinderModulPrompt) {
      // Replace placeholders in KINDER-MODUL
      let kidPrompt = kinderModulPrompt;
      if (storyType) kidPrompt = kidPrompt.replace(/\{storyType\}/g, storyType);
      if (characters) kidPrompt = kidPrompt.replace(/\{characters\}/g, Array.isArray(characters) ? characters.join(', ') : characters);
      if (locations) kidPrompt = kidPrompt.replace(/\{locations\}/g, Array.isArray(locations) ? locations.join(', ') : locations);
      if (timePeriod) kidPrompt = kidPrompt.replace(/\{timePeriod\}/g, timePeriod);
      if (kidName) kidPrompt = kidPrompt.replace(/\{kidName\}/g, kidName);
      if (kidHobbies) kidPrompt = kidPrompt.replace(/\{kidHobbies\}/g, kidHobbies);
      
      compositePrompt += `# KINDER-MODUL (Kind erstellt eigene Geschichte)\n${kidPrompt}\n\n`;
    }

    // SERIEN-MODUL: Add if isSeries is true OR if episodeNumber > 1
    if ((isSeries || (episodeNumber && episodeNumber > 1)) && serienModulPrompt) {
      compositePrompt += `# SERIEN-MODUL\n${serienModulPrompt}\n\n`;
    }

    // Fallback to customSystemPrompt if no composite could be built
    const baseSystemPrompt = compositePrompt.trim() || customSystemPrompt || "";

    // Determine how many images to generate based on length
    const imageCountMap: Record<string, number> = {
      very_short: 1, // Cover only
      short: 1,      // Cover only
      medium: 2,     // Cover + 1 progress image
      long: 3,       // Cover + 2 progress images
      very_long: 4,  // Cover + 3 progress images
    };
    const totalImageCount = imageCountMap[length] || 1;

    // Get API keys
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured (needed for image generation)");
    }

    // Language mappings
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

    // Map length to question count
    const questionCountMap: Record<string, number> = {
      very_short: 2,
      short: 3,
      medium: 5,
      long: 7,
      very_long: 8,
    };

    // Map difficulty labels
    const difficultyLabels: Record<string, string> = {
      easy: "LEICHT",
      medium: "MITTEL",
      difficult: "SCHWER",
    };

    // Text type mapping
    const textTypeLabels: Record<string, string> = {
      fiction: "FIKTION/GESCHICHTE (Textes narratifs)",
      "non-fiction": "SACHTEXT (Texte documentaires)",
    };

    const textTypeDescription = textTypeLabels[textType] || textTypeLabels.fiction;
    const difficultyLabel = difficultyLabels[difficulty] || "MITTEL";
    const questionCount = questionCountMap[length] || 5;
    const lengthConfig = lengthMap[length] || lengthMap.medium;
    const wordCount = lengthConfig.range;
    const minWordCount = lengthConfig.min;

    // Build the complete system prompt with dynamic parameters
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

Typische Techniken zur Texterweiterung:
- Mehr beschreibende Details zu Orten und Personen
- Zusätzliche kurze Dialoge zwischen Charakteren
- Erweiterte Handlungssequenzen
- Gefühle und Gedanken der Charaktere beschreiben

---
## WICHTIGE ANWEISUNGEN

1. Schreibe den GESAMTEN Text (Titel, Inhalt, Fragen, Antworten) auf **${targetLanguage}**
2. Halte dich STRIKT an die oben genannten Parameter
3. Erstelle genau **${questionCount}** Verständnisfragen mit der in deinem System-Prompt beschriebenen Taxonomie-Mischung
4. Jede Frage muss eine kurze, prägnante erwartete Antwort haben
5. **Der Text MUSS mindestens ${minWordCount} Wörter lang sein!**
`;

    // Combine the composite system prompt with dynamic context
    const fullSystemPrompt = baseSystemPrompt 
      ? `${baseSystemPrompt}\n${dynamicContext}`
      : dynamicContext;

    // Build series continuation context if applicable
    const seriesContext = episodeNumber && episodeNumber > 1 
      ? `\n\n**SERIEN-KONTEXT:**
- Dies ist Episode ${episodeNumber} einer fortlaufenden Serie
- Führe die Geschichte nahtlos fort, behalte dieselben Charaktere und den Stil bei
- Der Text in "description" enthält den Kontext der vorherigen Episode
- Das Ende sollte ${endingType === 'C' ? 'ein Cliffhanger sein, der Spannung für die nächste Episode aufbaut' : endingType === 'B' ? 'offen sein' : 'abgeschlossen sein'}`
      : '';

    const userPrompt = `Erstelle ${textType === "non-fiction" ? "einen Sachtext" : "eine Geschichte"} basierend auf dieser Beschreibung: "${description}"
${seriesContext}
**WICHTIG:** 
- Der gesamte Text muss auf ${targetLanguage} sein!
- Der Text MUSS mindestens **${minWordCount} Wörter** haben! Zähle deine Wörter und erweitere wenn nötig!

**VOKABEL-AUSWAHL:**
Wähle die 10 BESTEN Lernwörter aus dem Text aus. Diese sollten:
- NICHT trivial sein (keine Wörter wie "le", "la", "et", "est", "un", "une", "de", "à", "il", "elle", "dans", "sur", "avec", "pour", "que", "qui", "ce", "cette")
- Für Kinder auf ${schoolLevel}-Niveau herausfordernd aber lernbar sein
- Substantive, Verben (Infinitivform angeben!) oder Adjektive sein
- Zum Textverständnis und Wortschatzaufbau beitragen

Antworte NUR mit einem validen JSON-Objekt in diesem exakten Format:
{
  "title": "Titel auf ${targetLanguage}",
  "content": "Der vollständige Text auf ${targetLanguage}. Verwende \\n für Absätze. MINDESTENS ${minWordCount} WÖRTER!",
  "questions": [
    {
      "question": "Frage 1 auf ${targetLanguage}?",
      "correctAnswer": "Die korrekte Antwort",
      "options": ["Die korrekte Antwort", "Falsche Option 1", "Falsche Option 2", "Falsche Option 3"]
    },
    {
      "question": "Frage 2 auf ${targetLanguage}?",
      "correctAnswer": "Die korrekte Antwort",
      "options": ["Falsche Option 1", "Die korrekte Antwort", "Falsche Option 2", "Falsche Option 3"]
    }
  ],
  "vocabulary": [
    {
      "word": "das Wort aus dem Text (bei Verben: Infinitiv)",
      "explanation": "kindgerechte Erklärung auf ${targetLanguage} (max 15 Wörter)"
    }
  ],
  "structure_beginning": "A1-A6",
  "structure_middle": "M1-M6",
  "structure_ending": "E1-E6",
  "emotional_coloring": "EM-X (Name) – z.B. EM-T (Thrill/Spannung)"
}

**WICHTIG FÜR MULTIPLE-CHOICE FRAGEN:**
- Jede Frage hat GENAU 4 Antwortoptionen
- NUR EINE Option ist korrekt (correctAnswer)
- Die 3 falschen Optionen (Distraktoren) müssen plausibel aber falsch sein
- MISCHE die Position der korrekten Antwort (nicht immer an erster Stelle!)
- Die correctAnswer muss EXAKT mit einer der options übereinstimmen

**STORY-STRUKTUR-KLASSIFIKATION (wie im CORE-Prompt definiert):**
- structure_beginning: Wähle A1 (In Medias Res), A2 (Rätsel-Hook), A3 (Charaktermoment), A4 (Weltenbau), A5 (Dialogue-Hook) oder A6 (Ordinary World)
- structure_middle: Wähle M1 (Eskalation), M2 (Rätsel-Schichten), M3 (Beziehungs-Entwicklung), M4 (Parallele Handlungen), M5 (Countdown) oder M6 (Wendepunkt-Kette)
- structure_ending: Wähle E1 (Klassisch-Befriedigend), E2 (Twist-Ende), E3 (Offenes Ende), E4 (Bittersüß), E5 (Rückkehr mit Veränderung) oder E6 (Leser-Entscheidung/Cliffhanger)

**EMOTIONALE FÄRBUNG (wie im CORE-Prompt definiert):**
- emotional_coloring: Wähle EM-J (Joy/Freude), EM-T (Thrill/Spannung), EM-H (Humor), EM-W (Warmth/Wärme), EM-D (Depth/Tiefgang) oder EM-C (Curiosity/Neugier) mit kurzer Beschreibung

Erstelle genau ${questionCount} Multiple-Choice Fragen mit der richtigen Mischung:
- ~30% explizite Informationsfragen
- ~40% Inferenzfragen (die wichtigste Kategorie!)
- ~15% Vokabular im Kontext
- ~15% Textstruktur & Zusammenhänge

Wähle genau 10 Vokabelwörter aus.`;

    console.log("Generating story with Lovable AI Gateway:", {
      targetLanguage,
      schoolLevel,
      difficulty: difficultyLabel,
      length: wordCount,
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
    const storyParts = story.content.split('\n\n').filter((p: string) => p.trim().length > 0);
    const partCount = storyParts.length;
    
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
    const consistencyCheckTask = async () => {
      const consistencyCheckPrompt = await getConsistencyCheckPrompt(adminLanguage);
      
      if (!consistencyCheckPrompt) {
        console.log("No consistency check prompt configured, skipping check");
        return;
      }
      
      console.log("Starting consistency check...");
      const seriesContextForCheck = episodeNumber && episodeNumber > 1 && description
        ? { previousEpisode: description, episodeNumber }
        : undefined;
      
      let correctionAttempts = 0;
      const maxCorrectionAttempts = 2;
      
      while (correctionAttempts < maxCorrectionAttempts) {
        const checkResult = await performConsistencyCheck(
          LOVABLE_API_KEY,
          story,
          consistencyCheckPrompt,
          seriesContextForCheck
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
        console.log("Consistency check results saved");
      } catch (dbErr) {
        console.error("Error saving consistency check results:", dbErr);
      }
    };

    const coverImageTask = async () => {
      console.log("Generating cover image...");
      coverImageBase64 = await generateImageWithCache(
        supabase,
        GEMINI_API_KEY,
        LOVABLE_API_KEY,
        coverPrompt
      );
      if (coverImageBase64) {
        console.log("Cover image generated successfully");
      } else {
        console.log("Cover image generation failed");
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
    console.log(`Structure classification: beginning=${story.structure_beginning}, middle=${story.structure_middle}, ending=${story.structure_ending}`);
    console.log(`Emotional coloring: ${story.emotional_coloring}`);

    return new Response(JSON.stringify({
      ...story,
      // Convert category strings (A1-A6, M1-M6, E1-E6) to numbers for DB storage
      structure_beginning: extractCategoryNumber(story.structure_beginning),
      structure_middle: extractCategoryNumber(story.structure_middle),
      structure_ending: extractCategoryNumber(story.structure_ending),
      emotional_coloring: story.emotional_coloring || null,
      coverImageBase64,
      storyImages,
      imageWarning,
      generationTimeMs: totalTime,
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
