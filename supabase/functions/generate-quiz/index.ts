const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini API endpoint
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const languageConfig: Record<string, { systemPrompt: string; userPromptTemplate: string; fallbackOptions: string[] }> = {
  fr: {
    systemPrompt: "Tu es un assistant qui génère des quiz de vocabulaire pour enfants. Réponds toujours en JSON valide sans markdown.",
    userPromptTemplate: `Crée un quiz pour le mot français "{word}".
La bonne réponse est: "{correctExplanation}"

IMPORTANT: Si le mot "{word}" est un verbe conjugué, convertis-le d'abord en infinitif.
Par exemple: "dépasse" → "dépasser", "mangeons" → "manger", "allait" → "aller"

Génère 3 FAUSSES réponses qui:
- Sont plausibles mais incorrectes
- Ont la même longueur que la bonne réponse (environ {wordCount} mots)
- Sont en français simple pour enfant de 7 ans
- Ne sont PAS des synonymes de la bonne réponse

Réponds UNIQUEMENT avec un JSON valide (pas de markdown):
{
  "infinitive": "le mot en infinitif (si verbe) ou le mot original",
  "wrongOptions": ["fausse réponse 1", "fausse réponse 2", "fausse réponse 3"]
}`,
    fallbackOptions: ["Une couleur vive", "Un animal de la forêt", "Quelque chose de rond"]
  },
  de: {
    systemPrompt: "Du bist ein Assistent, der Vokabel-Quiz für Kinder erstellt. Antworte immer mit gültigem JSON ohne Markdown.",
    userPromptTemplate: `Erstelle ein Quiz für das deutsche Wort "{word}".
Die richtige Antwort ist: "{correctExplanation}"

WICHTIG: Wenn "{word}" ein konjugiertes Verb ist, wandle es zuerst in den Infinitiv um.
Zum Beispiel: "geht" → "gehen", "aß" → "essen", "lief" → "laufen"

Generiere 3 FALSCHE Antworten, die:
- Plausibel aber falsch sind
- Die gleiche Länge wie die richtige Antwort haben (etwa {wordCount} Wörter)
- In einfachem Deutsch für 7-jährige Kinder sind
- KEINE Synonyme der richtigen Antwort sind

Antworte NUR mit gültigem JSON (kein Markdown):
{
  "infinitive": "das Wort im Infinitiv (wenn Verb) oder das Originalwort",
  "wrongOptions": ["falsche Antwort 1", "falsche Antwort 2", "falsche Antwort 3"]
}`,
    fallbackOptions: ["Eine helle Farbe", "Ein Waldtier", "Etwas Rundes"]
  },
  en: {
    systemPrompt: "You are an assistant that generates vocabulary quizzes for children. Always respond with valid JSON without markdown.",
    userPromptTemplate: `Create a quiz for the English word "{word}".
The correct answer is: "{correctExplanation}"

IMPORTANT: If "{word}" is a conjugated verb, first convert it to the infinitive.
For example: "goes" → "go", "ran" → "run", "ate" → "eat"

Generate 3 WRONG answers that:
- Are plausible but incorrect
- Have the same length as the correct answer (about {wordCount} words)
- Are in simple English for 7-year-old children
- Are NOT synonyms of the correct answer

Respond ONLY with valid JSON (no markdown):
{
  "infinitive": "the word in infinitive (if verb) or the original word",
  "wrongOptions": ["wrong answer 1", "wrong answer 2", "wrong answer 3"]
}`,
    fallbackOptions: ["A bright color", "A forest animal", "Something round"]
  },
  es: {
    systemPrompt: "Eres un asistente que genera cuestionarios de vocabulario para niños. Responde siempre con JSON válido sin markdown.",
    userPromptTemplate: `Crea un quiz para la palabra española "{word}".
La respuesta correcta es: "{correctExplanation}"

IMPORTANTE: Si "{word}" es un verbo conjugado, conviértelo primero al infinitivo.
Por ejemplo: "come" → "comer", "fue" → "ir", "tenía" → "tener"

Genera 3 respuestas INCORRECTAS que:
- Sean plausibles pero incorrectas
- Tengan la misma longitud que la respuesta correcta (aproximadamente {wordCount} palabras)
- Estén en español sencillo para niños de 7 años
- NO sean sinónimos de la respuesta correcta

Responde SOLO con JSON válido (sin markdown):
{
  "infinitive": "la palabra en infinitivo (si es verbo) o la palabra original",
  "wrongOptions": ["respuesta incorrecta 1", "respuesta incorrecta 2", "respuesta incorrecta 3"]
}`,
    fallbackOptions: ["Un color brillante", "Un animal del bosque", "Algo redondo"]
  },
  nl: {
    systemPrompt: "Je bent een assistent die woordenschat-quizzen voor kinderen maakt. Antwoord altijd met geldige JSON zonder markdown.",
    userPromptTemplate: `Maak een quiz voor het Nederlandse woord "{word}".
Het juiste antwoord is: "{correctExplanation}"

BELANGRIJK: Als "{word}" een vervoegd werkwoord is, zet het eerst om naar de infinitief.
Bijvoorbeeld: "loopt" → "lopen", "at" → "eten", "had" → "hebben"

Genereer 3 FOUTE antwoorden die:
- Plausibel maar onjuist zijn
- Dezelfde lengte hebben als het juiste antwoord (ongeveer {wordCount} woorden)
- In eenvoudig Nederlands zijn voor kinderen van 7 jaar
- GEEN synoniemen zijn van het juiste antwoord

Antwoord ALLEEN met geldige JSON (geen markdown):
{
  "infinitive": "het woord in infinitief (als werkwoord) of het originele woord",
  "wrongOptions": ["fout antwoord 1", "fout antwoord 2", "fout antwoord 3"]
}`,
    fallbackOptions: ["Een heldere kleur", "Een bosdier", "Iets ronds"]
  },
  it: {
    systemPrompt: "Sei un assistente che crea quiz di vocabolario per bambini. Rispondi sempre con JSON valido senza markdown.",
    userPromptTemplate: `Crea un quiz per la parola italiana "{word}".
La risposta corretta è: "{correctExplanation}"

IMPORTANTE: Se "{word}" è un verbo coniugato, convertilo prima all'infinito.
Per esempio: "mangia" → "mangiare", "andò" → "andare", "aveva" → "avere"

Genera 3 risposte SBAGLIATE che:
- Siano plausibili ma errate
- Abbiano la stessa lunghezza della risposta corretta (circa {wordCount} parole)
- Siano in italiano semplice per bambini di 7 anni
- NON siano sinonimi della risposta corretta

Rispondi SOLO con JSON valido (niente markdown):
{
  "infinitive": "la parola all'infinito (se verbo) o la parola originale",
  "wrongOptions": ["risposta sbagliata 1", "risposta sbagliata 2", "risposta sbagliata 3"]
}`,
    fallbackOptions: ["Un colore vivace", "Un animale del bosco", "Qualcosa di rotondo"]
  }
};

// Helper function to make Gemini API request with retry
async function makeGeminiRequest(apiKey: string, systemPrompt: string, userPrompt: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          return content;
        }
        throw new Error("No content in response");
      }

      // If rate limited and we have retries left, wait and retry
      if (response.status === 429 && attempt < retries) {
        console.log(`Rate limited, waiting ${attempt * 2} seconds before retry ${attempt + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }

      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  throw new Error("Max retries exceeded");
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, correctExplanation, language = 'fr' } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = languageConfig[language] || languageConfig['fr'];
    const wordCount = correctExplanation.split(' ').length;
    
    const userPrompt = config.userPromptTemplate
      .replace(/{word}/g, word)
      .replace(/{correctExplanation}/g, correctExplanation)
      .replace(/{wordCount}/g, String(wordCount));

    let result;
    try {
      const rawText = await makeGeminiRequest(GEMINI_API_KEY, config.systemPrompt, userPrompt);
      
      try {
        const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim();
        result = JSON.parse(cleanJson);
      } catch {
        console.error('Failed to parse JSON:', rawText);
        result = { 
          infinitive: word,
          wrongOptions: config.fallbackOptions
        };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      // Return fallback data so quiz can continue
      console.log('API error, using fallback options');
      return new Response(
        JSON.stringify({ 
          infinitive: word,
          wrongOptions: config.fallbackOptions,
          fallback: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
