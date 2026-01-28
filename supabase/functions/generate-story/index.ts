import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gemini API endpoint
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Helper function to count words in a text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Helper function to call Gemini API directly
async function callGeminiAPI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.8
): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error("No content in Gemini response");
  }
  
  return content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { length, difficulty, description, schoolLevel, textType, textLanguage, globalLanguage, customSystemPrompt } = await req.json();

    // Determine how many images to generate based on length
    const imageCountMap: Record<string, number> = {
      short: 1,   // Cover only
      medium: 2,  // Cover + 1 progress image
      long: 3,    // Cover + 2 progress images
    };
    const totalImageCount = imageCountMap[length] || 1;

    // Get API keys
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Lovable API key still needed for image generation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Language mappings
    const languageNames: Record<string, string> = {
      DE: "Deutsch",
      FR: "Französisch",
      EN: "Englisch",
    };

    const targetLanguage = languageNames[textLanguage] || "Französisch";

    // Map length to approximate word count with explicit minimum
    const lengthMap: Record<string, { range: string; min: number; max: number }> = {
      short: { range: "250-300 Wörter", min: 250, max: 300 },
      medium: { range: "300-350 Wörter", min: 300, max: 350 },
      long: { range: "350-450 Wörter", min: 350, max: 450 },
    };

    // Map length to question count
    const questionCountMap: Record<string, number> = {
      short: 3,
      medium: 5,
      long: 7,
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

    // Combine the custom system prompt with dynamic context
    const fullSystemPrompt = customSystemPrompt 
      ? `${customSystemPrompt}\n${dynamicContext}`
      : dynamicContext;

    const userPrompt = `Erstelle ${textType === "non-fiction" ? "einen Sachtext" : "eine Geschichte"} basierend auf dieser Beschreibung: "${description}"

**WICHTIG:** 
- Der gesamte Text muss auf ${targetLanguage} sein!
- Der Text MUSS mindestens **${minWordCount} Wörter** haben! Zähle deine Wörter und erweitere wenn nötig!

Antworte NUR mit einem validen JSON-Objekt in diesem exakten Format:
{
  "title": "Titel auf ${targetLanguage}",
  "content": "Der vollständige Text auf ${targetLanguage}. Verwende \\n für Absätze. MINDESTENS ${minWordCount} WÖRTER!",
  "questions": [
    {
      "question": "Frage 1 auf ${targetLanguage}",
      "expectedAnswer": "Erwartete Antwort auf ${targetLanguage}"
    },
    {
      "question": "Frage 2 auf ${targetLanguage}",
      "expectedAnswer": "Erwartete Antwort auf ${targetLanguage}"
    }
  ]
}

Erstelle genau ${questionCount} Fragen mit der richtigen Mischung:
- ~30% explizite Informationsfragen
- ~40% Inferenzfragen (die wichtigste Kategorie!)
- ~15% Vokabular im Kontext
- ~15% Textstruktur & Zusammenhänge`;

    console.log("Generating story with Gemini API directly:", {
      targetLanguage,
      schoolLevel,
      difficulty: difficultyLabel,
      length: wordCount,
      minWordCount,
      textType,
      questionCount
    });

    // Generate the story using direct Gemini API
    let story: { title: string; content: string; questions: any[] } = {
      title: "",
      content: "",
      questions: []
    };
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Story generation attempt ${attempts}/${maxAttempts}`);

      const promptToUse = attempts === 1 
        ? userPrompt 
        : `${userPrompt}\n\n**ACHTUNG:** Der vorherige Versuch hatte zu wenige Wörter. Schreibe einen LÄNGEREN Text mit mindestens ${minWordCount} Wörtern!`;

      const content = await callGeminiAPI(GEMINI_API_KEY, fullSystemPrompt, promptToUse, 0.8);

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
          const expandedContent = await callGeminiAPI(GEMINI_API_KEY, expansionSystemPrompt, expansionUserPrompt, 0.8);
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

    // Generate cover image based on description and school level
    // Default to CE2 (mid primary) if schoolLevel is not provided
    const effectiveSchoolLevel = schoolLevel || "CE2";
    console.log("Generating cover image for:", description, "school level:", effectiveSchoolLevel);
    
    // Map school level to art style - different styles for fiction vs non-fiction
    const schoolLevelLower = effectiveSchoolLevel.toLowerCase();
    let artStyle: string;
    let targetAudience: string;
    
    if (textType === "non-fiction") {
      // Non-fiction: Use documentary/educational illustration styles
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
      // Fiction: Use imaginative, story-driven styles
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
    
    // Generate detailed character descriptions from the story for consistency
    let characterDescription = "";
    
    try {
      const characterDescriptionPrompt = `Analysiere diese Geschichte und erstelle eine kurze, präzise visuelle Beschreibung der Hauptcharaktere (Aussehen, Kleidung, besondere Merkmale). Maximal 100 Wörter. Antwort auf Englisch für den Bildgenerator.`;
      
      const characterContext = `Geschichte: "${story.title}"\n${story.content.substring(0, 500)}...`;
      
      characterDescription = await callGeminiAPI(GEMINI_API_KEY, characterDescriptionPrompt, characterContext, 0.3);
      console.log("Character description generated:", characterDescription.substring(0, 100));
    } catch (err) {
      console.error("Error generating character description:", err);
    }

    const imagePrompt = `A captivating book cover illustration for a ${textType === "non-fiction" ? "non-fiction educational book" : "children's story"}. 
Theme: ${description}. 
Story title: "${story.title}"
${characterDescription ? `Main characters: ${characterDescription}` : ""}
Art Style: ${artStyle}
Target audience: ${targetAudience}.
Requirements: No text on the image, high quality ${textType === "non-fiction" ? "educational and informative" : "imaginative and engaging"} illustration.
IMPORTANT: Create distinctive, memorable character designs that can be recognized in follow-up illustrations.`;
    
    let coverImageBase64: string | null = null;

    // Only generate images if Lovable API key is available
    if (LOVABLE_API_KEY) {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: imagePrompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (imageUrl) {
          coverImageBase64 = imageUrl;
          console.log("Cover image generated successfully");
        }
      } else {
        const errorText = await imageResponse.text();
        console.error("Failed to generate cover image:", errorText);
        // Don't fail the whole request if image generation fails
      }
    } else {
      console.log("Skipping image generation - LOVABLE_API_KEY not available");
    }

    // Generate additional progress images for medium/long stories
    const storyImages: string[] = [];
    
    if (totalImageCount > 1 && coverImageBase64 && LOVABLE_API_KEY) {
      console.log(`Generating ${totalImageCount - 1} additional progress image(s) with character consistency...`);
      
      // Create progress image prompts based on story content
      const progressImagePrompts: string[] = [];
      
      // Split story into parts to create relevant image prompts
      const storyParts = story.content.split('\n\n').filter((p: string) => p.trim().length > 0);
      const partCount = storyParts.length;
      
      // Base style reference for consistency
      const styleReference = `
CRITICAL - VISUAL CONSISTENCY REQUIREMENTS:
- Use EXACTLY the same art style as the cover image: ${artStyle}
- Keep the SAME character designs, faces, clothing, and distinctive features as the cover
- Maintain consistent color palette and lighting style
- Characters must be immediately recognizable from the cover image
${characterDescription ? `- Character reference: ${characterDescription}` : ""}
`;
      
      if (totalImageCount >= 2 && partCount > 1) {
        // First progress image - middle of the story
        const middleIndex = Math.floor(partCount / 2);
        const middleContext = storyParts[middleIndex]?.substring(0, 200) || description;
        progressImagePrompts.push(`Continue the visual story from the cover image. Scene from the middle of the story: "${middleContext}".

${styleReference}

Art Style: ${textType === "non-fiction" ? "Simplified documentary sketch style" : "Gentle, slightly muted version of the cover style"} with softer, pastel tones.
The image should maintain the same characters but with reduced visual intensity - think soft colors and gentle washes.
Target audience: ${targetAudience}. No text. 
The characters MUST look exactly like they do on the cover - same faces, hair, clothing, proportions.`);
      }
      
      if (totalImageCount >= 3 && partCount > 2) {
        // Second progress image - near the end
        const nearEndIndex = Math.floor(partCount * 0.75);
        const nearEndContext = storyParts[nearEndIndex]?.substring(0, 200) || description;
        progressImagePrompts.push(`Continue the visual story. Scene near the end: "${nearEndContext}".

${styleReference}

Art Style: ${textType === "non-fiction" ? "Simple line-art sketch with minimal color" : "Soft pencil sketch style matching the cover"} using desaturated, calm tones.
Very understated visual style - muted colors, intentionally reduced saturation.
Target audience: ${targetAudience}. No text. 
CRITICAL: The characters MUST be the exact same as in the cover image - identical faces, features, and clothing.`);
      }
      
      // Generate all progress images in parallel, using cover as reference
      const progressImagePromises = progressImagePrompts.map(async (prompt, index) => {
        try {
          // Use image editing with cover as reference for consistency
          const progressResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: coverImageBase64 } }
                  ]
                }
              ],
              modalities: ["image", "text"],
            }),
          });

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            const progressUrl = progressData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (progressUrl) {
              console.log(`Progress image ${index + 1} generated successfully with character consistency`);
              return progressUrl;
            }
          } else {
            console.error(`Failed to generate progress image ${index + 1}:`, await progressResponse.text());
          }
        } catch (imgError) {
          console.error(`Error generating progress image ${index + 1}:`, imgError);
        }
        return null;
      });

      const results = await Promise.all(progressImagePromises);
      storyImages.push(...results.filter((url): url is string => url !== null));
    }

    // Final word count log
    const finalWordCount = countWords(story.content);
    console.log(`Final story delivered with ${finalWordCount} words (min: ${minWordCount})`);

    return new Response(JSON.stringify({
      ...story,
      coverImageBase64,
      storyImages,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating story:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
