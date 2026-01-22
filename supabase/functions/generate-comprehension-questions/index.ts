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
    const { storyContent, storyTitle } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Tu es un enseignant pour enfants de 6-8 ans. Voici une histoire en français:

Titre: "${storyTitle}"
Texte: "${storyContent}"

Crée exactement 3 questions de compréhension simples pour vérifier si l'enfant a compris l'histoire.

Règles:
- Questions courtes et simples (1 phrase)
- Réponses attendues courtes (1-2 phrases maximum)
- Les questions doivent porter sur des éléments clés de l'histoire
- Utilise un vocabulaire adapté aux enfants de 6-8 ans
- Les réponses doivent être factuelles et basées sur le texte

Réponds UNIQUEMENT avec un JSON valide (pas de markdown):
{
  "questions": [
    {"question": "Question 1?", "expectedAnswer": "Réponse attendue 1"},
    {"question": "Question 2?", "expectedAnswer": "Réponse attendue 2"},
    {"question": "Question 3?", "expectedAnswer": "Réponse attendue 3"}
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 500,
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
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let result;
    try {
      const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse JSON:', rawText);
      result = { 
        questions: [
          { question: "De quoi parle cette histoire?", expectedAnswer: "L'histoire parle de..." },
          { question: "Qui est le personnage principal?", expectedAnswer: "Le personnage principal est..." },
          { question: "Que s'est-il passé à la fin?", expectedAnswer: "À la fin..." }
        ]
      };
    }

    return new Response(
      JSON.stringify(result),
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
