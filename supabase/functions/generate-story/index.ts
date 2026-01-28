import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { length, difficulty, description, schoolLevel, textType, textLanguage, globalLanguage, customSystemPrompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Language mappings
    const languageNames: Record<string, string> = {
      DE: "Deutsch",
      FR: "Französisch",
      EN: "Englisch",
    };

    const targetLanguage = languageNames[textLanguage] || "Französisch";

    // Map length to approximate word count
    const lengthMap: Record<string, string> = {
      short: "250-300 Wörter",
      medium: "300-350 Wörter",
      long: "350-450 Wörter",
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
    const wordCount = lengthMap[length] || lengthMap.medium;

    // Build the complete system prompt with dynamic parameters
    const dynamicContext = `
---
## AKTUELLE AUFGABE - PARAMETER

**Zielsprache des Textes:** ${targetLanguage}
**Schulniveau:** ${schoolLevel}
**Schwierigkeitsgrad:** ${difficultyLabel}
**Textlänge:** ${wordCount}
**Texttyp:** ${textTypeDescription}
**Anzahl Verständnisfragen:** ${questionCount}

---
## WICHTIGE ANWEISUNGEN

1. Schreibe den GESAMTEN Text (Titel, Inhalt, Fragen, Antworten) auf **${targetLanguage}**
2. Halte dich STRIKT an die oben genannten Parameter
3. Erstelle genau **${questionCount}** Verständnisfragen mit der in deinem System-Prompt beschriebenen Taxonomie-Mischung
4. Jede Frage muss eine kurze, prägnante erwartete Antwort haben
`;

    // Combine the custom system prompt with dynamic context
    const fullSystemPrompt = customSystemPrompt 
      ? `${customSystemPrompt}\n${dynamicContext}`
      : dynamicContext;

    const userPrompt = `Erstelle ${textType === "non-fiction" ? "einen Sachtext" : "eine Geschichte"} basierend auf dieser Beschreibung: "${description}"

**WICHTIG:** Der gesamte Text muss auf ${targetLanguage} sein!

Antworte NUR mit einem validen JSON-Objekt in diesem exakten Format:
{
  "title": "Titel auf ${targetLanguage}",
  "content": "Der vollständige Text auf ${targetLanguage}. Verwende \\n für Absätze.",
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

    console.log("Generating story with params:", {
      targetLanguage,
      schoolLevel,
      difficulty: difficultyLabel,
      length: wordCount,
      textType,
      questionCount
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Zahlungsproblem. Bitte kontaktiere den Administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse story JSON from:", content);
      throw new Error("Could not parse story JSON");
    }

    const story = JSON.parse(jsonMatch[0]);

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
    
    const imagePrompt = `A captivating book cover illustration for a ${textType === "non-fiction" ? "non-fiction educational book" : "children's story"}. 
Theme: ${description}. 
Art Style: ${artStyle}
Target audience: ${targetAudience}.
Requirements: No text on the image, high quality ${textType === "non-fiction" ? "educational and informative" : "imaginative and engaging"} illustration.`;
    
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

    let coverImageBase64: string | null = null;

    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        coverImageBase64 = imageUrl;
        console.log("Cover image generated successfully");
      }
    } else {
      console.error("Failed to generate cover image:", await imageResponse.text());
    }

    return new Response(JSON.stringify({
      ...story,
      coverImageBase64,
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
