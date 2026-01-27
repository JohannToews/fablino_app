import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, context } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Improved prompt for better, child-friendly explanations + spelling correction
    const prompt = `Tu es un dictionnaire vivant pour enfants français de 8 ans.

Le mot ou l'expression à expliquer: "${word}"
${context ? `Contexte de la phrase: "${context}"` : ''}

MISSION: 
1. Si le mot est mal orthographié, corrige-le
2. Donne une explication SIMPLE et CLAIRE en 8 mots maximum

RÈGLES STRICTES:
1. Maximum 8 mots pour l'explication, pas plus
2. Utilise des mots très simples qu'un enfant de 8 ans connaît
3. Pas de ponctuation finale (ni point, ni virgule)
4. Pas de répétition du mot à expliquer
5. Si c'est un verbe, explique l'action
6. Si c'est un nom, dis ce que c'est concrètement
7. Si c'est un adjectif, donne un synonyme simple ou décris

EXEMPLES PARFAITS:
- "courageux" → "Quelqu'un qui n'a pas peur"
- "dévorer" → "Manger très vite avec appétit"
- "magnifique" → "Très très beau"
- "château" (si écrit "chateau") → corrigé: "château"

RÉPONDS UNIQUEMENT en JSON valide:
{"correctedWord": "mot_corrigé_ou_original", "explanation": "explication courte"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Try to parse JSON response
    try {
      // Clean up potential markdown code blocks
      rawText = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const parsed = JSON.parse(rawText);
      let explanation = parsed.explanation || '';
      let correctedWord = parsed.correctedWord || word;
      
      // Clean up the response
      explanation = explanation.replace(/[.!?]$/, '').replace(/^["']|["']$/g, '').trim();
      correctedWord = correctedWord.toLowerCase().trim();
      
      return new Response(
        JSON.stringify({ explanation, correctedWord }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      // Fallback: treat whole response as explanation
      let explanation = rawText.replace(/[.!?]$/, '').replace(/^["']|["']$/g, '').trim();
      
      return new Response(
        JSON.stringify({ explanation, correctedWord: word }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});