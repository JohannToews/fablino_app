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
    const childAge = age || 8;

    // Adjust art style based on age
    let styleDescription: string;
    let subjectDescription: string;
    
    if (childAge <= 5) {
      // Very young: soft, dreamy, simple shapes
      styleDescription = "Soft watercolor children's book illustration style. Simple, rounded shapes. Dreamy and magical atmosphere. Cute and whimsical.";
      subjectDescription = `a happy young child (around ${childAge} years old)`;
    } else if (childAge <= 7) {
      // Young: still colorful but slightly more detailed
      styleDescription = "Colorful children's book illustration. Friendly and inviting. Some detail but still playful and imaginative.";
      subjectDescription = `a cheerful child (around ${childAge} years old)`;
    } else if (childAge <= 9) {
      // Middle: balanced between playful and realistic
      styleDescription = "Modern digital illustration style. Vibrant colors, clean lines. Semi-realistic but still fun and engaging. Like a cool book cover for kids.";
      subjectDescription = `a confident young person (around ${childAge} years old)`;
    } else if (childAge <= 11) {
      // Pre-teen: more mature, less childish
      styleDescription = "Contemporary digital art style. Dynamic composition. Cool and stylish, appropriate for pre-teens. Not too childish, not too adult.";
      subjectDescription = `a cool pre-teen (around ${childAge} years old)`;
    } else {
      // Teen: more mature, realistic
      styleDescription = "Modern digital illustration. Clean, sophisticated style. Age-appropriate for teenagers. Trendy and stylish aesthetic.";
      subjectDescription = `a teenager (around ${childAge} years old)`;
    }

    // Create age-appropriate prompt
    const prompt = `Create an illustration featuring ${subjectDescription} named ${name}. 
The image should use ${colorDescription} as the main color scheme.
${hobbies ? `Show elements related to their interests: ${hobbies}. Make these hobbies prominent in the scene.` : "Include elements suggesting learning and reading."}
${styleDescription}
This is a personalized cover image for a reading app - make it feel special and personal.
The child should look engaged and happy.
High quality, detailed illustration.
16:9 aspect ratio, landscape orientation.`;

    console.log("Generating cover image for age", childAge, "with prompt:", prompt);

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