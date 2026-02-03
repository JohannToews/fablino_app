import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Language-specific prompts
const PROMPTS: Record<string, (word: string, context?: string) => string> = {
  fr: (word: string, context?: string) => `Tu es un dictionnaire vivant pour enfants français de 8 ans.

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

RÉPONDS UNIQUEMENT en JSON valide:
{"correctedWord": "mot_corrigé_ou_original", "explanation": "explication courte"}`,

  de: (word: string, context?: string) => `Du bist ein lebendiges Wörterbuch für 8-jährige Kinder.

Das zu erklärende Wort oder Ausdruck: "${word}"
${context ? `Kontext des Satzes: "${context}"` : ''}

AUFGABE:
1. Falls das Wort falsch geschrieben ist, korrigiere es
2. Gib eine EINFACHE und KLARE Erklärung in maximal 8 Wörtern

STRENGE REGELN:
1. Maximal 8 Wörter für die Erklärung, nicht mehr
2. Verwende sehr einfache Wörter, die ein 8-jähriges Kind kennt
3. Keine Satzzeichen am Ende (kein Punkt, kein Komma)
4. Keine Wiederholung des zu erklärenden Wortes
5. Bei Verben: erkläre die Handlung
6. Bei Nomen: sage konkret, was es ist
7. Bei Adjektiven: gib ein einfaches Synonym oder beschreibe es

PERFEKTE BEISPIELE:
- "mutig" → "Jemand der keine Angst hat"
- "verschlingen" → "Sehr schnell und gierig essen"
- "wunderschön" → "Ganz besonders schön"

ANTWORTE NUR mit gültigem JSON:
{"correctedWord": "korrigiertes_oder_originales_wort", "explanation": "kurze erklärung"}`,

  en: (word: string, context?: string) => `You are a living dictionary for 8-year-old children.

The word or expression to explain: "${word}"
${context ? `Sentence context: "${context}"` : ''}

MISSION:
1. If the word is misspelled, correct it
2. Give a SIMPLE and CLEAR explanation in maximum 8 words

STRICT RULES:
1. Maximum 8 words for the explanation, no more
2. Use very simple words that an 8-year-old child knows
3. No punctuation at the end (no period, no comma)
4. No repetition of the word to explain
5. For verbs: explain the action
6. For nouns: say concretely what it is
7. For adjectives: give a simple synonym or describe

PERFECT EXAMPLES:
- "brave" → "Someone who is not afraid"
- "devour" → "Eat very fast and hungrily"
- "magnificent" → "Very very beautiful"

RESPOND ONLY with valid JSON:
{"correctedWord": "corrected_or_original_word", "explanation": "short explanation"}`,

  es: (word: string, context?: string) => `Eres un diccionario viviente para niños de 8 años.

La palabra o expresión a explicar: "${word}"
${context ? `Contexto de la frase: "${context}"` : ''}

MISIÓN:
1. Si la palabra está mal escrita, corrígela
2. Da una explicación SIMPLE y CLARA en máximo 8 palabras

REGLAS ESTRICTAS:
1. Máximo 8 palabras para la explicación, no más
2. Usa palabras muy simples que un niño de 8 años conoce
3. Sin puntuación al final (ni punto, ni coma)
4. Sin repetir la palabra a explicar
5. Para verbos: explica la acción
6. Para sustantivos: di concretamente qué es
7. Para adjetivos: da un sinónimo simple o describe

EJEMPLOS PERFECTOS:
- "valiente" → "Alguien que no tiene miedo"
- "devorar" → "Comer muy rápido con hambre"
- "magnífico" → "Muy muy bonito"

RESPONDE SOLO con JSON válido:
{"correctedWord": "palabra_corregida_u_original", "explanation": "explicación corta"}`,

  nl: (word: string, context?: string) => `Je bent een levend woordenboek voor kinderen van 8 jaar.

Het te verklaren woord of uitdrukking: "${word}"
${context ? `Zinscontext: "${context}"` : ''}

OPDRACHT:
1. Als het woord verkeerd gespeld is, corrigeer het
2. Geef een EENVOUDIGE en DUIDELIJKE uitleg in maximaal 8 woorden

STRENGE REGELS:
1. Maximaal 8 woorden voor de uitleg, niet meer
2. Gebruik zeer eenvoudige woorden die een kind van 8 kent
3. Geen leestekens aan het einde (geen punt, geen komma)
4. Geen herhaling van het te verklaren woord
5. Bij werkwoorden: leg de actie uit
6. Bij zelfstandige naamwoorden: zeg concreet wat het is
7. Bij bijvoeglijke naamwoorden: geef een eenvoudig synoniem of beschrijf

PERFECTE VOORBEELDEN:
- "dapper" → "Iemand die niet bang is"
- "verslinden" → "Heel snel en gretig eten"
- "prachtig" → "Heel erg mooi"

ANTWOORD ALLEEN met geldige JSON:
{"correctedWord": "gecorrigeerd_of_origineel_woord", "explanation": "korte uitleg"}`,

  it: (word: string, context?: string) => `Sei un dizionario vivente per bambini di 8 anni.

La parola o espressione da spiegare: "${word}"
${context ? `Contesto della frase: "${context}"` : ''}

MISSIONE:
1. Se la parola è scritta male, correggila
2. Dai una spiegazione SEMPLICE e CHIARA in massimo 8 parole

REGOLE STRETTE:
1. Massimo 8 parole per la spiegazione, non di più
2. Usa parole molto semplici che un bambino di 8 anni conosce
3. Nessuna punteggiatura alla fine (né punto, né virgola)
4. Nessuna ripetizione della parola da spiegare
5. Per i verbi: spiega l'azione
6. Per i nomi: di' concretamente cos'è
7. Per gli aggettivi: dai un sinonimo semplice o descrivi

ESEMPI PERFETTI:
- "coraggioso" → "Qualcuno che non ha paura"
- "divorare" → "Mangiare molto velocemente e avidamente"
- "magnifico" → "Molto molto bello"

RISPONDI SOLO con JSON valido:
{"correctedWord": "parola_corretta_o_originale", "explanation": "spiegazione breve"}`
};

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
    const { word, context, language = 'fr' } = await req.json();
    
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

    // Get language-specific prompt or fallback to French
    const promptFn = PROMPTS[language] || PROMPTS.fr;
    const prompt = promptFn(word, context);
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
