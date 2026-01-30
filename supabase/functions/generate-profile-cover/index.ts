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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, age, hobbies, colorPalette, imageStyle } = await req.json();

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
    
    // User-defined image style or default
    const styleDescription = imageStyle || "modern cartoon";
    const childAge = age || 8;

    // Base style description - uses user-defined style
    const baseStyle = `${styleDescription} illustration style. 
Cute expressive character with big friendly eyes and warm smile. 
Bright, cheerful lighting with soft ambient glow. 
Professional children's app illustration quality.
The scene should be warm, inviting and fun.
Background should be simple and clean, not distracting.
CRITICAL: Do NOT include any text, letters, words, numbers, or typography in the image. No labels, no signs, no book titles - completely text-free illustration.`;

    // Create the prompt - fixed 16:9 WIDE landscape for tablet
    const prompt = `Create a wide panoramic cartoon illustration (16:9 aspect ratio, much wider than tall) of a happy child named ${name} (approximately ${childAge} years old) reading a book with excitement.

The child should be centered, sitting comfortably with an open book, looking happy and engaged.

Around the child, include small items representing their hobbies: ${hobbies || "books, art supplies, and creative activities"}.
Keep composition simple and balanced across the wide format.

COLOR SCHEME: Use ${colorDescription} as the dominant palette for the background and ambient lighting.

STYLE: ${baseStyle}

CRITICAL FORMAT REQUIREMENTS:
- Wide panoramic 16:9 landscape orientation (much wider than tall, like a movie screen)
- Absolutely NO text, letters, words, numbers, or typography anywhere
- Simple clean background, child as focal point in center
- High quality, polished finish suitable for app header image`;

    console.log("Generating cover image with Lovable AI Gateway for age", childAge);

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