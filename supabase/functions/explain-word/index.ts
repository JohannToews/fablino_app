import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PROMPT_TEMPLATE = (word: string, context?: string) => `Tu es un dictionnaire vivant pour enfants français de 8 ans.

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

// Helper: sleep for exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: parse LLM response
function parseResponse(rawText: string, originalWord: string): { explanation: string; correctedWord: string } {
  try {
    // Clean up potential markdown code blocks
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    let explanation = parsed.explanation || '';
    let correctedWord = parsed.correctedWord || originalWord;
    
    // Clean up the response
    explanation = explanation.replace(/[.!?]$/, '').replace(/^["']|["']$/g, '').trim();
    correctedWord = correctedWord.toLowerCase().trim();
    
    return { explanation, correctedWord };
  } catch {
    // Fallback: treat whole response as explanation
    const explanation = rawText.replace(/[.!?]$/, '').replace(/^["']|["']$/g, '').trim();
    return { explanation, correctedWord: originalWord };
  }
}

// Primary: Try Gemini API with retry
async function tryGeminiAPI(prompt: string, apiKey: string, maxRetries = 3): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
      }

      // Rate limit or server error - retry with backoff
      if (response.status === 429 || response.status >= 500) {
        console.log(`Gemini attempt ${attempt + 1} failed with ${response.status}, retrying...`);
        await sleep(Math.pow(2, attempt) * 500); // 500ms, 1s, 2s
        continue;
      }

      // Other error - don't retry
      console.error(`Gemini API error: ${response.status}`);
      return null;
    } catch (error) {
      console.error(`Gemini attempt ${attempt + 1} error:`, error);
      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 500);
      }
    }
  }
  return null;
}

// Fallback: Try Lovable AI Gateway
async function tryLovableGateway(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error(`Lovable Gateway error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Lovable Gateway error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, context } = await req.json();
    
    if (!word || typeof word !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid word parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'No API keys configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = PROMPT_TEMPLATE(word, context);
    let rawText: string | null = null;

    // Try primary (Gemini) first
    if (GEMINI_API_KEY) {
      rawText = await tryGeminiAPI(prompt, GEMINI_API_KEY);
    }

    // Fallback to Lovable Gateway if Gemini failed
    if (!rawText && LOVABLE_API_KEY) {
      console.log('Gemini failed, trying Lovable Gateway fallback...');
      rawText = await tryLovableGateway(prompt, LOVABLE_API_KEY);
    }

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable, please try again' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { explanation, correctedWord } = parseResponse(rawText, word);

    return new Response(
      JSON.stringify({ explanation, correctedWord }),
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
