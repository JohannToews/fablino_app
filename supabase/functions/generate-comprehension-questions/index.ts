const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const languageConfig: Record<string, { teacherRole: string; rules: string; fallbackQuestions: { question: string; correctAnswer: string; options: string[] }[] }> = {
  fr: {
    teacherRole: "Tu es un enseignant pour enfants de 6-8 ans.",
    rules: `Règles:
- Questions courtes et simples (1 phrase)
- 4 options de réponse par question
- UNE SEULE option correcte, les 3 autres sont des distracteurs plausibles mais incorrects
- Les distracteurs doivent être liés au contexte de l'histoire
- Utilise un vocabulaire adapté aux enfants de 6-8 ans`,
    fallbackQuestions: [
      { question: "De quoi parle cette histoire?", correctAnswer: "Une aventure", options: ["Une aventure", "Une recette", "Un sport", "Une chanson"] },
    ]
  },
  de: {
    teacherRole: "Du bist ein Lehrer für Kinder von 6-8 Jahren.",
    rules: `Regeln:
- Kurze und einfache Fragen (1 Satz)
- 4 Antwortmöglichkeiten pro Frage
- NUR EINE richtige Antwort, die anderen 3 sind plausible aber falsche Ablenker
- Die Ablenker müssen zum Kontext der Geschichte passen
- Verwende einen für Kinder von 6-8 Jahren geeigneten Wortschatz`,
    fallbackQuestions: [
      { question: "Worum geht es in dieser Geschichte?", correctAnswer: "Ein Abenteuer", options: ["Ein Abenteuer", "Ein Rezept", "Ein Sport", "Ein Lied"] },
    ]
  },
  en: {
    teacherRole: "You are a teacher for children aged 6-8.",
    rules: `Rules:
- Short and simple questions (1 sentence)
- 4 answer options per question
- ONLY ONE correct answer, the other 3 are plausible but incorrect distractors
- Distractors must be related to the story context
- Use vocabulary suitable for children aged 6-8`,
    fallbackQuestions: [
      { question: "What is this story about?", correctAnswer: "An adventure", options: ["An adventure", "A recipe", "A sport", "A song"] },
    ]
  },
  es: {
    teacherRole: "Eres un profesor para niños de 6-8 años.",
    rules: `Reglas:
- Preguntas cortas y simples (1 frase)
- 4 opciones de respuesta por pregunta
- SOLO UNA respuesta correcta, las otras 3 son distractores plausibles pero incorrectos
- Los distractores deben estar relacionados con el contexto de la historia
- Usa vocabulario adecuado para niños de 6-8 años`,
    fallbackQuestions: [
      { question: "¿De qué trata esta historia?", correctAnswer: "Una aventura", options: ["Una aventura", "Una receta", "Un deporte", "Una canción"] },
    ]
  },
  nl: {
    teacherRole: "Je bent een leraar voor kinderen van 6-8 jaar.",
    rules: `Regels:
- Korte en eenvoudige vragen (1 zin)
- 4 antwoordmogelijkheden per vraag
- SLECHTS ÉÉN correct antwoord, de andere 3 zijn plausibele maar onjuiste afleiders
- De afleiders moeten gerelateerd zijn aan de context van het verhaal
- Gebruik een woordenschat die geschikt is voor kinderen van 6-8 jaar`,
    fallbackQuestions: [
      { question: "Waar gaat dit verhaal over?", correctAnswer: "Een avontuur", options: ["Een avontuur", "Een recept", "Een sport", "Een liedje"] },
    ]
  },
  it: {
    teacherRole: "Sei un insegnante per bambini di 6-8 anni.",
    rules: `Regole:
- Domande brevi e semplici (1 frase)
- 4 opzioni di risposta per domanda
- SOLO UNA risposta corretta, le altre 3 sono distrattori plausibili ma sbagliati
- I distrattori devono essere legati al contesto della storia
- Usa un vocabolario adatto ai bambini di 6-8 anni`,
    fallbackQuestions: [
      { question: "Di cosa parla questa storia?", correctAnswer: "Un'avventura", options: ["Un'avventura", "Una ricetta", "Uno sport", "Una canzone"] },
    ]
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyContent, storyTitle, language = 'fr' } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = languageConfig[language] || languageConfig['fr'];

    const prompt = `${config.teacherRole} Voici une histoire:

Titre: "${storyTitle}"
Texte: "${storyContent}"

Crée exactement 3 questions de compréhension à choix multiple pour vérifier si l'enfant a compris l'histoire.

${config.rules}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown):
{
  "questions": [
    {
      "question": "Question 1?",
      "correctAnswer": "La bonne réponse",
      "options": ["La bonne réponse", "Mauvaise 1", "Mauvaise 2", "Mauvaise 3"]
    },
    {
      "question": "Question 2?",
      "correctAnswer": "La bonne réponse",
      "options": ["Mauvaise 1", "La bonne réponse", "Mauvaise 2", "Mauvaise 3"]
    },
    {
      "question": "Question 3?",
      "correctAnswer": "La bonne réponse",
      "options": ["Mauvaise 1", "Mauvaise 2", "La bonne réponse", "Mauvaise 3"]
    }
  ]
}

IMPORTANT: Mélange la position de la bonne réponse dans les options (pas toujours en première position).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 800,
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
      result = { questions: config.fallbackQuestions };
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
