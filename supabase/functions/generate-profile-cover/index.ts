import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Lovable AI Gateway endpoint for image generation
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Helper function to call Lovable AI Gateway for image generation
async function callLovableAIImageAPI(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    // Extract image from Lovable AI Gateway response format
    const images = data.choices?.[0]?.message?.images;
    if (images && images.length > 0) {
      const imageUrl = images[0]?.image_url?.url;
      if (imageUrl) {
        return imageUrl; // Already in data:image/... format
      }
    }
    
    console.error("No image found in Lovable AI response:", JSON.stringify(data));
    return null;
  } catch (error) {
    console.error("Error calling Lovable AI Gateway:", error);
    return null;
  }
}

// Helper function to determine age group and style based on school class
function getAgeStyleFromSchoolClass(schoolClass: string): { ageDescription: string; styleModifier: string; characterStyle: string } {
  const lowerClass = schoolClass?.toLowerCase() || "";
  
  // Early primary (P1-P3, Klasse 3-4, Grade 3-4) - Ages ~6-9
  if (lowerClass.includes("p1") || lowerClass.includes("p2") || lowerClass.includes("p3") ||
      lowerClass.includes("3. klasse") || lowerClass.includes("4. klasse") ||
      lowerClass.includes("grade 3") || lowerClass.includes("grade 4") ||
      lowerClass.includes("3º primaria") || lowerClass.includes("4º primaria") ||
      lowerClass.includes("groep 5") || lowerClass.includes("groep 6")) {
    return {
      ageDescription: "young child (around 7-9 years old)",
      styleModifier: "cute, playful, whimsical style with rounded shapes and friendly proportions",
      characterStyle: "adorable child with big expressive eyes, rosy cheeks, and a cheerful innocent expression"
    };
  }
  
  // Late primary (P4-P6, Klasse 5-6, Grade 5-6) - Ages ~9-12
  if (lowerClass.includes("p4") || lowerClass.includes("p5") || lowerClass.includes("p6") ||
      lowerClass.includes("5. klasse") || lowerClass.includes("6. klasse") ||
      lowerClass.includes("grade 5") || lowerClass.includes("grade 6") ||
      lowerClass.includes("5º primaria") || lowerClass.includes("6º primaria") ||
      lowerClass.includes("groep 7") || lowerClass.includes("groep 8")) {
    return {
      ageDescription: "pre-teen child (around 10-12 years old)",
      styleModifier: "modern animated style with balanced proportions, slightly more realistic than cartoons",
      characterStyle: "confident kid with natural proportions, friendly smile, and engaged curious expression"
    };
  }
  
  // Secondary (S1-S3, Klasse 7-10, Grade 7-10, ESO) - Ages ~12-16
  if (lowerClass.includes("s1") || lowerClass.includes("s2") || lowerClass.includes("s3") ||
      lowerClass.includes("7. klasse") || lowerClass.includes("8. klasse") ||
      lowerClass.includes("9. klasse") || lowerClass.includes("10. klasse") ||
      lowerClass.includes("grade 7") || lowerClass.includes("grade 8") ||
      lowerClass.includes("grade 9") || lowerClass.includes("grade 10") ||
      lowerClass.includes("eso") ||
      lowerClass.includes("1e klas") || lowerClass.includes("2e klas") ||
      lowerClass.includes("3e klas") || lowerClass.includes("4e klas")) {
    return {
      ageDescription: "teenager (around 13-16 years old)",
      styleModifier: "contemporary illustration style with realistic proportions, cool and sophisticated aesthetic",
      characterStyle: "young teen with natural body proportions, confident relaxed posture, and a cool engaged expression"
    };
  }
  
  // Default fallback - middle range
  return {
    ageDescription: "child (around 10 years old)",
    styleModifier: "modern animated illustration style",
    characterStyle: "friendly child with natural proportions and warm smile"
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, hobbies, colorPalette, imageStyle, schoolClass } = await req.json();

    if (!name) {
      throw new Error("Name is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Map color palette to pure color descriptions (5 distinct palettes)
    const paletteColors: Record<string, string> = {
      ocean: "deep blue (#0077BE), turquoise (#40E0D0) and cyan (#00CED1) colors",
      sunset: "warm coral (#FF7F50), rose (#FF6B6B) and soft pink (#FFB6C1) hues",
      forest: "rich emerald green (#228B22), teal (#008B8B) and forest tones",
      lavender: "soft purple (#9B59B6), violet (#8E44AD) and indigo (#6366F1) tones",
      sunshine: "warm golden yellow (#FFD700), amber (#FFA500) and orange tones",
    };

    const colorDescription = paletteColors[colorPalette] || paletteColors.ocean;
    
    // Get age-appropriate style based on school class
    const { ageDescription, styleModifier, characterStyle } = getAgeStyleFromSchoolClass(schoolClass);
    
    // User-defined image style combined with age-appropriate modifier
    const userStyle = imageStyle || "modern illustration";
    const combinedStyle = `${userStyle}, ${styleModifier}`;

    // Base style description - adapted to age group
    const baseStyle = `${combinedStyle}. 
${characterStyle}.
Bright, cheerful lighting with soft ambient glow. 
Professional app illustration quality.
The scene should be warm, inviting and age-appropriate.
Background should be simple and clean, not distracting.
CRITICAL: Do NOT include any text, letters, words, numbers, or typography in the image. No labels, no signs, no book titles - completely text-free illustration.`;

    // Create the prompt - fixed 16:9 WIDE landscape for tablet
    const prompt = `Create a wide panoramic illustration (16:9 aspect ratio, much wider than tall) of a happy ${ageDescription} named ${name} reading a book with enthusiasm.

The character should be centered, sitting comfortably with an open book, looking engaged and happy.

Around the character, include small items representing their hobbies: ${hobbies || "books, art supplies, and creative activities"}.
Keep composition simple and balanced across the wide format.

COLOR SCHEME: Use ${colorDescription} as the dominant palette for the background and ambient lighting.

STYLE: ${baseStyle}

CRITICAL FORMAT REQUIREMENTS:
- Wide panoramic 16:9 landscape orientation (much wider than tall, like a movie screen)
- Absolutely NO text, letters, words, numbers, or typography anywhere
- Simple clean background, character as focal point in center
- High quality, polished finish suitable for app header image
- Age-appropriate character design matching a ${ageDescription}`;

    console.log("Generating cover image with Lovable AI Gateway for school class:", schoolClass);

    const imageData = await callLovableAIImageAPI(LOVABLE_API_KEY, prompt);

    if (!imageData) {
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ 
        imageBase64: imageData,
        success: true 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating profile cover:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});