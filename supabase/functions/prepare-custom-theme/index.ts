import { getAuthenticatedUser } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

const GEMINI_MODEL = 'gemini-2.0-flash';

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  const headers = getCorsHeaders(req);

  try {
    const { userId } = await getAuthenticatedUser(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const { description, kid_language } = await req.json();
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Description too short (min 10 chars)' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const systemPrompt = `You are an expert in child psychology and reading promotion.
A parent wants the following learning theme for their child:
"${description.trim()}"

Create a structured learning theme from this. The parent's UI language is "${kid_language || 'en'}".

Respond ONLY as JSON with translations in ALL of these languages: de, fr, en, es, nl, it, bs, tr, bg, ro, pl, lt, hu, ca, sl, pt, sk, uk, ru.

{
  "name": { 
    "de": "Kurzer Titel (2-4 Wörter)",
    "fr": "Titre court (2-4 mots)", 
    "en": "Short title (2-4 words)", 
    "es": "Título corto (2-4 palabras)",
    "nl": "Korte titel (2-4 woorden)",
    "it": "Titolo breve (2-4 parole)",
    "bs": "Kratki naslov (2-4 riječi)",
    "tr": "Kısa başlık (2-4 kelime)",
    "bg": "Кратко заглавие (2-4 думи)",
    "ro": "Titlu scurt (2-4 cuvinte)",
    "pl": "Krótki tytuł (2-4 słowa)",
    "lt": "Trumpas pavadinimas (2-4 žodžiai)",
    "hu": "Rövid cím (2-4 szó)",
    "ca": "Títol curt (2-4 paraules)",
    "sl": "Kratek naslov (2-4 besede)",
    "pt": "Título curto (2-4 palavras)",
    "sk": "Krátky názov (2-4 slová)",
    "uk": "Коротка назва (2-4 слова)",
    "ru": "Короткое название (2-4 слова)"
  },
  "description": {
    "de": "Kind lernt, ... (1 Satz)",
    "fr": "L'enfant apprend à ... (1 phrase)",
    "en": "Child learns to ... (1 sentence)",
    "es": "El niño aprende a ... (1 frase)",
    "nl": "Kind leert om ... (1 zin)",
    "it": "Il bambino impara a ... (1 frase)",
    "bs": "Dijete uči da ... (1 rečenica)",
    "tr": "Çocuk ... öğrenir (1 cümle)",
    "bg": "Детето учи да ... (1 изречение)",
    "ro": "Copilul învață să ... (1 propoziție)",
    "pl": "Dziecko uczy się ... (1 zdanie)",
    "lt": "Vaikas mokosi ... (1 sakinys)",
    "hu": "A gyerek megtanulja ... (1 mondat)",
    "ca": "L'infant aprèn a ... (1 frase)",
    "sl": "Otrok se nauči ... (1 stavek)",
    "pt": "A criança aprende a ... (1 frase)",
    "sk": "Dieťa sa učí ... (1 veta)",
    "uk": "Дитина вчиться ... (1 речення)",
    "ru": "Ребёнок учится ... (1 предложение)"
  },
  "category": "social" | "emotional" | "character" | "cognitive",
  "story_guidance": "Concrete hint for story generation in English, e.g. 'Include a scene where the main character feels jealous of a sibling and learns to cope with it'"
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('[prepare-custom-theme] Gemini error:', errText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(rawText);

    if (!parsed.name || !parsed.description || !parsed.category || !parsed.story_guidance) {
      throw new Error('Invalid response structure from Gemini');
    }

    console.log('[prepare-custom-theme] Success:', parsed.name?.de);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[prepare-custom-theme] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
