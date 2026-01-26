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
    const { length, difficulty, description, childAge, schoolLevel, customSystemPrompt } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Map length to approximate word count
    const lengthMap: Record<string, string> = {
      short: "220-250 Wörter",
      medium: "250-350 Wörter",
      long: "350-550 Wörter",
    };

    // Map length to question count
    const questionCountMap: Record<string, number> = {
      short: 3,
      medium: 5,
      long: 7,
    };

    // Map difficulty to vocabulary complexity
    const difficultyMap: Record<string, string> = {
      easy: "sehr einfache Wörter, kurze Sätze, grundlegende Grammatik",
      medium: "moderate Komplexität, einige längere Sätze, alltägliche Vokabeln",
      difficult: "reichhaltigerer Wortschatz, komplexere Satzstrukturen, literarische Elemente",
    };

    const questionCount = questionCountMap[length] || 5;

    // Base system prompt
    let systemPrompt = `Du bist ein erfahrener Kinderbuchautor, der französische Geschichten für Kinder schreibt.
Du erstellst kindgerechte, pädagogisch wertvolle Geschichten auf Französisch.
Die Geschichten sollen das Leseverständnis fördern und altersgerecht sein.

WICHTIG: 
- Schreibe NUR auf Französisch
- Die Geschichte soll für ein ${childAge}-jähriges Kind sein (Schulniveau: ${schoolLevel})
- Verwende ${difficultyMap[difficulty] || difficultyMap.medium}
- Die Geschichte soll ${lengthMap[length] || lengthMap.medium} lang sein
- Erstelle auch einen passenden französischen Titel
- Erstelle ${questionCount} Verständnisfragen mit erwarteten Antworten`;

    // Append custom system prompt if provided
    if (customSystemPrompt && customSystemPrompt.trim()) {
      systemPrompt += `\n\nZUSÄTZLICHE ANWEISUNGEN:\n${customSystemPrompt.trim()}`;
    }

    const userPrompt = `Erstelle eine französische Geschichte basierend auf dieser Beschreibung: "${description}"

Antworte im folgenden JSON-Format:
{
  "title": "Der französische Titel der Geschichte",
  "content": "Der vollständige Text der Geschichte auf Französisch",
  "questions": [
    {
      "question": "Frage auf Französisch",
      "expectedAnswer": "Erwartete kurze Antwort auf Französisch"
    }
  ]
}

Achte darauf, dass die Geschichte:
1. Einen klaren Anfang, Mittelteil und Ende hat
2. Interessant und spannend für Kinder ist
3. Positive Werte vermittelt
4. Dem gewünschten Schwierigkeitsgrad entspricht

Die ${questionCount} Verständnisfragen sollen:
1. Das Textverständnis prüfen
2. Auf Französisch formuliert sein
3. Kurze, prägnante Antworten haben`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
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
      throw new Error("Could not parse story JSON");
    }

    const story = JSON.parse(jsonMatch[0]);

    // Generate cover image based on description and age
    console.log("Generating cover image for:", description, "age:", childAge);
    
    // Age-appropriate style mapping
    let artStyle: string;
    if (childAge <= 5) {
      artStyle = "Very soft, round shapes, pastel colors, extremely cute and simple cartoon style like Peppa Pig or Bluey. Large friendly eyes, simple backgrounds.";
    } else if (childAge <= 7) {
      artStyle = "Colorful cartoon style, friendly characters with expressive faces, slightly more detailed backgrounds, similar to Disney Junior or Paw Patrol style.";
    } else if (childAge <= 9) {
      artStyle = "Dynamic comic book style, more mature character designs with personality, action-oriented poses, vibrant colors, similar to modern animated movies like Pixar or DreamWorks. Characters should look cool and adventurous, not babyish.";
    } else {
      artStyle = "Semi-realistic illustration style, detailed environments, characters with realistic proportions, dynamic compositions, similar to graphic novel or manga-inspired art. Sophisticated color palette.";
    }
    
    const imagePrompt = `A captivating book cover illustration for a French children's story. Theme: ${description}. 
Art Style: ${artStyle}
Target audience: ${childAge} year old child.
Requirements: No text on the image, high quality illustration, engaging composition that tells a story.`;
    
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
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