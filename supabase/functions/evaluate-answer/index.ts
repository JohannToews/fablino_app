const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const languageConfig: Record<string, { teacherRole: string; rules: string; fallbackFeedback: string }> = {
  fr: {
    teacherRole: "Tu es un enseignant bienveillant pour enfants de 6-8 ans.",
    rules: `Règles:
- Si la réponse montre une bonne compréhension = "correct"
- Si la réponse est partiellement correcte = "partial"  
- Si la réponse est incorrecte ou hors sujet = "incorrect"
- Donne un feedback encourageant et simple (1-2 phrases max)`,
    fallbackFeedback: "Bonne tentative! Continue comme ça! 🌟"
  },
  de: {
    teacherRole: "Du bist ein freundlicher Lehrer für Kinder von 6-8 Jahren.",
    rules: `Regeln:
- Wenn die Antwort gutes Verständnis zeigt = "correct"
- Wenn die Antwort teilweise richtig ist = "partial"
- Wenn die Antwort falsch oder nicht zum Thema ist = "incorrect"
- Gib ermutigendes und einfaches Feedback (maximal 1-2 Sätze)`,
    fallbackFeedback: "Guter Versuch! Weiter so! 🌟"
  },
  en: {
    teacherRole: "You are a kind teacher for children aged 6-8.",
    rules: `Rules:
- If the answer shows good understanding = "correct"
- If the answer is partially correct = "partial"
- If the answer is incorrect or off-topic = "incorrect"
- Give encouraging and simple feedback (1-2 sentences max)`,
    fallbackFeedback: "Good try! Keep it up! 🌟"
  },
  es: {
    teacherRole: "Eres un profesor amable para niños de 6-8 años.",
    rules: `Reglas:
- Si la respuesta muestra buena comprensión = "correct"
- Si la respuesta es parcialmente correcta = "partial"
- Si la respuesta es incorrecta o fuera de tema = "incorrect"
- Da un feedback alentador y sencillo (máximo 1-2 frases)`,
    fallbackFeedback: "¡Buen intento! ¡Sigue así! 🌟"
  },
  nl: {
    teacherRole: "Je bent een vriendelijke leraar voor kinderen van 6-8 jaar.",
    rules: `Regels:
- Als het antwoord goed begrip toont = "correct"
- Als het antwoord gedeeltelijk juist is = "partial"
- Als het antwoord onjuist of niet relevant is = "incorrect"
- Geef bemoedigend en eenvoudig feedback (maximaal 1-2 zinnen)`,
    fallbackFeedback: "Goed geprobeerd! Ga zo door! 🌟"
  },
  it: {
    teacherRole: "Sei un insegnante gentile per bambini di 6-8 anni.",
    rules: `Regole:
- Se la risposta mostra buona comprensione = "correct"
- Se la risposta è parzialmente corretta = "partial"
- Se la risposta è sbagliata o fuori tema = "incorrect"
- Dai un feedback incoraggiante e semplice (massimo 1-2 frasi)`,
    fallbackFeedback: "Buon tentativo! Continua così! 🌟"
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, expectedAnswer, childAnswer, language = 'fr' } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = languageConfig[language] || languageConfig['fr'];

    const prompt = `${config.teacherRole}

Question posée: "${question}"
Réponse attendue: "${expectedAnswer}"
Réponse de l'enfant: "${childAnswer}"

Évalue si la réponse de l'enfant est correcte ou partiellement correcte. Sois indulgent - l'enfant peut formuler différemment mais avoir compris l'essentiel.

${config.rules}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown):
{
  "result": "correct" | "partial" | "incorrect",
  "feedback": "Ton feedback encourageant ici"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
            responseMimeType: 'application/json',
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
      const cleanJson = rawText.trim();
      result = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse JSON:', rawText);
      result = { 
        result: "partial",
        feedback: config.fallbackFeedback
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
