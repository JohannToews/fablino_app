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

    // Improved prompt for better, child-friendly explanations
    const prompt = `Tu es un dictionnaire vivant pour enfants français de 8 ans.

Le mot ou l'expression à expliquer: "${word}"
${context ? `Contexte de la phrase: "${context}"` : ''}

MISSION: Donne une explication SIMPLE et CLAIRE en 8 mots maximum.

RÈGLES STRICTES:
1. Maximum 8 mots, pas plus
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
- "s'élancer" → "Partir vite en courant"
- "un terrier" → "La maison sous terre d'un animal"
- "inquiet" → "Qui a un peu peur dans sa tête"
- "bondir" → "Sauter très haut"
- "murmurer" → "Parler très doucement"

MAUVAIS EXEMPLES (à éviter):
- Trop long: "C'est quand quelqu'un fait quelque chose de bien pour aider les autres"
- Trop compliqué: "Manifestation d'un sentiment positif"
- Répète le mot: "Courageux veut dire être courageux"

Ta réponse (8 mots max, simple, clair):`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 60,
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
    let explanation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Clean up the response
    if (!explanation) {
      return new Response(
        JSON.stringify({ explanation: null, error: 'No explanation generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove trailing punctuation and quotes
    explanation = explanation.replace(/[.!?]$/, '').replace(/^["']|["']$/g, '').trim();

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});