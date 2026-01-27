import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { name, age, hobbies, colorPalette } = await req.json();

    if (!name) {
      throw new Error("Name is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Map color palette to pure color descriptions (NO thematic names!)
    const paletteColors: Record<string, string> = {
      sunshine: "warm golden yellow (#FFD700) and soft orange (#FFA500) tones",
      mint: "fresh green (#98FF98) and light teal (#40E0D0) colors",
      lavender: "soft purple (#E6E6FA) and violet (#EE82EE) tones",
      ocean: "deep blue (#0077BE) and turquoise (#40E0D0) colors",
      sunset: "warm coral (#FF7F50), peach (#FFCBA4) and soft pink (#FFB6C1) hues",
      forest: "rich green (#228B22) and earthy brown-green (#6B8E23) tones",
      sky: "light blue (#87CEEB) and soft white (#F0F8FF) colors",
      berry: "rich magenta (#C71585) and raspberry (#E30B5C) tones",
      earth: "warm brown (#8B4513) and terracotta (#E2725B) colors",
      candy: "bright pink (#FF69B4) and soft lilac (#C8A2C8) tones",
      arctic: "icy blue (#B0E0E6) and silver-white (#C0C0C0) colors",
      tropical: "vibrant teal (#00CED1) and lime green (#32CD32) tones",
    };

    const colorDescription = paletteColors[colorPalette] || paletteColors.sunshine;
    const childAge = age || 8;

    // Base style description - modern cartoon style, NO TEXT
    const baseStyle = `Modern digital cartoon illustration style. Clean vector-like artwork with smooth gradients and soft shadows. 
Cute expressive character with big friendly eyes and warm smile. 
Bright, cheerful lighting with soft ambient glow. 
Professional children's app illustration quality.
The scene should be warm, inviting and fun.
Background should be simple and clean, not distracting.
CRITICAL: Do NOT include any text, letters, words, numbers, or typography in the image. No labels, no signs, no book titles - completely text-free illustration.`;

    // Create the prompt - fixed 16:9 landscape for tablet
    const prompt = `Create a cheerful cartoon illustration of a happy child named ${name} (approximately ${childAge} years old) sitting and reading a book with excitement.

The child should be the main focus, sitting comfortably with an open book, looking happy and engaged.

Around the child, include items representing their hobbies: ${hobbies || "books, art supplies, and creative activities"}.
These items should be arranged naturally around the scene, not overwhelming the composition.

COLOR SCHEME: Use ${colorDescription} as the dominant palette for the background and ambient lighting.

STYLE: ${baseStyle}

The illustration should feel personal and special - like a custom avatar for a reading app.
IMPORTANT: 16:9 wide landscape format, optimized for tablet display.
IMPORTANT: Absolutely NO text, letters, words, or numbers anywhere in the image.
High quality, polished finish.`;

    console.log("Generating cover image for age", childAge);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation API error:", errorText);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Image generation response received");

    // Extract the base64 image from the response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data));
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