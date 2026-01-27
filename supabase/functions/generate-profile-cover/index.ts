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
    const { name, hobbies, colorPalette } = await req.json();

    if (!name) {
      throw new Error("Name is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Map color palette to descriptive colors
    const paletteColors: Record<string, string> = {
      sunshine: "warm golden yellow and soft orange tones",
      mint: "fresh mint green and light teal colors",
      lavender: "soft purple and lavender tones",
      ocean: "deep blue and turquoise ocean colors",
      sunset: "warm orange, coral and pink sunset hues",
      forest: "deep green and earthy forest tones",
    };

    const colorDescription = paletteColors[colorPalette] || paletteColors.sunshine;

    // Create a child-friendly prompt for the cover image
    const prompt = `Create a magical, whimsical illustration for a child named ${name}. 
The image should be colorful and cheerful, featuring ${colorDescription}.
${hobbies ? `Include playful elements related to: ${hobbies}.` : "Include playful elements like books, stars, and magical sparkles."}
Style: Soft watercolor children's book illustration, dreamy and enchanting.
The image should feel warm, inviting, and perfect for a reading app for kids.
Make it look like a professional children's book cover illustration.
Ultra high resolution, vibrant colors.`;

    console.log("Generating cover image with prompt:", prompt);

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