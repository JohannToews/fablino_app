import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

// Helper: Build prompt from custom template or fallback
function buildPromptFromTemplate(template: string, word: string, context?: string): string {
  let prompt = template.replace(/\{word\}/g, word);
  prompt = prompt.replace(/\{context\}/g, context ? `Kontext des Satzes: "${context}"` : '');
  return prompt;
}

// Language-specific prompts (fallback)
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
{"correctedWord": "parola_corretta_o_originale", "explanation": "spiegazione breve"}`,

  fa: (word: string, context?: string) => `تو یک فرهنگ‌لغت زنده برای کودکان ۸ ساله هستی.

کلمه یا عبارتی که باید توضیح داده شود: "${word}"
${context ? `زمینه جمله: "${context}"` : ''}

وظیفه:
۱. اگر کلمه اشتباه نوشته شده، آن را تصحیح کن
۲. یک توضیح ساده و واضح در حداکثر ۸ کلمه بده

قوانین سختگیرانه:
۱. حداکثر ۸ کلمه برای توضیح، نه بیشتر
۲. از کلمات بسیار ساده که یک کودک ۸ ساله می‌فهمد استفاده کن
۳. بدون نقطه‌گذاری در انتها
۴. کلمه مورد توضیح را تکرار نکن
۵. برای فعل‌ها: عمل را توضیح بده
۶. برای اسم‌ها: بگو دقیقاً چیست
۷. برای صفت‌ها: یک مترادف ساده بده

نمونه‌های عالی:
- "شجاع" → "کسی که نمی‌ترسد"
- "بلعیدن" → "خیلی سریع و با ولع خوردن"
- "باشکوه" → "خیلی خیلی زیبا"

فقط با JSON معتبر پاسخ بده:
{"correctedWord": "کلمه_تصحیح_شده_یا_اصلی", "explanation": "توضیح کوتاه"}`,

  pt: (word: string, context?: string) => `És um dicionário vivo para crianças de 8 anos (português de Portugal).

A palavra ou expressão a explicar: "${word}"
${context ? `Contexto da frase: "${context}"` : ''}

MISSÃO:
1. Se a palavra estiver mal escrita, corrige
2. Dá uma explicação SIMPLES e CLARA no máximo de 8 palavras

REGRAS ESTRITAS:
1. Máximo 8 palavras para a explicação, não mais
2. Usa palavras muito simples que uma criança de 8 anos conhece
3. Sem pontuação no final (nem ponto, nem vírgula)
4. Não repitas a palavra a explicar
5. Para verbos: explica a ação
6. Para nomes: diz concretamente o que é
7. Para adjetivos: dá um sinónimo simples ou descreve

EXEMPLOS PERFEITOS:
- "corajoso" → "Alguém que não tem medo"
- "devorar" → "Comer muito depressa com vontade"
- "magnífico" → "Muito muito bonito"

RESPONDE APENAS com JSON válido:
{"correctedWord": "palavra_corrigida_ou_original", "explanation": "explicação curta"}`,

  tr: (word: string, context?: string) => `Sen 8 yaşındaki çocuklar için canlı bir sözlüksün.

Açıklanacak kelime veya ifade: "${word}"
${context ? `Cümle bağlamı: "${context}"` : ''}

GÖREV:
1. Kelime yanlış yazılmışsa düzelt
2. En fazla 8 kelimeyle BASIT ve NET bir açıklama yap

KATI KURALLAR:
1. Açıklama için en fazla 8 kelime, fazlası yok
2. 8 yaşındaki bir çocuğun bildiği çok basit kelimeler kullan
3. Sonda noktalama işareti yok (nokta, virgül yok)
4. Açıklanacak kelimeyi tekrarlama
5. Fiiller için: eylemi açıkla
6. İsimler için: somut olarak ne olduğunu söyle
7. Sıfatlar için: basit bir eş anlamlı ver veya tanımla
8. Açıklama dili ZORUNLU olarak Türkçe olmalı, asla İngilizce kullanma

MÜKEMMEL ÖRNEKLER:
- "cesur" → "Korkmayan biri"
- "oburca yemek" → "Çok hızlı ve iştahla yemek"
- "muhteşem" → "Çok çok güzel"

YALNIZCA geçerli JSON ile yanıt ver (açıklama Türkçe olmalı):
{"correctedWord": "düzeltilmiş_veya_orijinal_kelime", "explanation": "kısa açıklama"}`,

  pl: (word: string, context?: string) => `Jesteś żywym słownikiem dla 8-letnich dzieci.

Słowo lub wyrażenie do wyjaśnienia: "${word}"
${context ? `Kontekst zdania: "${context}"` : ''}

ZADANIE:
1. Jeśli słowo jest błędnie napisane, popraw je
2. Podaj PROSTE i JASNE wyjaśnienie w maksymalnie 8 słowach

SUROWE ZASADY:
1. Maksymalnie 8 słów w wyjaśnieniu, nie więcej
2. Używaj bardzo prostych słów, które zna 8-letnie dziecko
3. Bez znaków interpunkcyjnych na końcu (bez kropki, bez przecinka)
4. Nie powtarzaj wyjaśnianego słowa
5. Dla czasowników: wyjaśnij czynność
6. Dla rzeczowników: powiedz konkretnie, co to jest
7. Dla przymiotników: podaj prosty synonim lub opisz
8. Wyjaśnienie MUSI być po polsku, nigdy po angielsku

IDEALNE PRZYKŁADY:
- "odważny" → "Ktoś, kto się nie boi"
- "pożerać" → "Jeść bardzo szybko i łapczywie"
- "wspaniały" → "Bardzo bardzo ładny"

ODPOWIEDZ TYLKO poprawnym JSON (wyjaśnienie po polsku):
{"correctedWord": "poprawione_lub_oryginalne_slowo", "explanation": "krotkie_wyjasnienie"}`,

  uk: (word: string, context?: string) => `Ти — живий словник для 8-річних дітей.

Слово або вираз для пояснення: "${word}"
${context ? `Контекст речення: "${context}"` : ''}

ЗАВДАННЯ:
1. Якщо слово написано з помилкою, виправ його
2. Дай ПРОСТЕ і ЗРОЗУМІЛЕ пояснення максимум з 8 слів

СУВОРІ ПРАВИЛА:
1. Максимум 8 слів для пояснення, не більше
2. Використовуй дуже прості слова, які знає 8-річна дитина
3. Без розділових знаків в кінці (без крапки, без коми)
4. Не повторюй слово, яке пояснюється
5. Для дієслів: поясни дію
6. Для іменників: скажи конкретно, що це
7. Для прикметників: дай простий синонім або опиши

ІДЕАЛЬНІ ПРИКЛАДИ:
- "хоробрий" → "Той, хто не боїться"
- "пожирати" → "Їсти дуже швидко та з апетитом"
- "чудовий" → "Дуже дуже гарний"

ВІДПОВІДАЙ ЛИШЕ валідним JSON:
{"correctedWord": "виправлене_або_оригінальне_слово", "explanation": "коротке_пояснення"}`,

  ru: (word: string, context?: string) => `Ты — живой словарь для 8-летних детей.

Слово или выражение для объяснения: "${word}"
${context ? `Контекст предложения: "${context}"` : ''}

ЗАДАЧА:
1. Если слово написано с ошибкой, исправь его
2. Дай ПРОСТОЕ и ПОНЯТНОЕ объяснение максимум из 8 слов

СТРОГИЕ ПРАВИЛА:
1. Максимум 8 слов для объяснения, не больше
2. Используй очень простые слова, которые знает 8-летний ребёнок
3. Без знаков препинания в конце (без точки, без запятой)
4. Не повторяй объясняемое слово
5. Для глаголов: объясни действие
6. Для существительных: скажи конкретно, что это
7. Для прилагательных: дай простой синоним или опиши

ИДЕАЛЬНЫЕ ПРИМЕРЫ:
- "храбрый" → "Тот, кто не боится"
- "пожирать" → "Есть очень быстро и с аппетитом"
- "великолепный" → "Очень очень красивый"

ОТВЕЧАЙ ТОЛЬКО валидным JSON:
{"correctedWord": "исправленное_или_оригинальное_слово", "explanation": "короткое_объяснение"}`,

  bs: (word: string, context?: string) => `Ti si živi rječnik za 8-godišnju djecu.

Riječ ili izraz za objašnjenje: "${word}"
${context ? `Kontekst rečenice: "${context}"` : ''}

ZADATAK:
1. Ako je riječ pogrešno napisana, ispravi je
2. Daj JEDNOSTAVNO i JASNO objašnjenje u najviše 8 riječi

STROGA PRAVILA:
1. Maksimalno 8 riječi za objašnjenje, ne više
2. Koristi vrlo jednostavne riječi koje dijete od 8 godina zna
3. Bez interpunkcije na kraju (bez tačke, bez zareza)
4. Ne ponavljaj riječ koja se objašnjava
5. Za glagole: objasni radnju
6. Za imenice: reci konkretno šta je to
7. Za prideve: daj jednostavan sinonim ili opiši

SAVRŠENI PRIMJERI:
- "hrabar" → "Neko ko se ne boji"
- "prožderati" → "Jesti vrlo brzo i proždrljivo"
- "prekrasan" → "Vrlo vrlo lijep"

ODGOVORI SAMO validnim JSON:
{"correctedWord": "ispravljena_ili_originalna_rijec", "explanation": "kratko_objašnjenje"}`,

  ro: (word: string, context?: string) => `Ești un dicționar viu pentru copii de 8 ani.

Cuvântul sau expresia de explicat: "${word}"
${context ? `Contextul propoziției: "${context}"` : ''}

MISIUNE:
1. Dacă cuvântul este scris greșit, corectează-l
2. Dă o explicație SIMPLĂ și CLARĂ în maximum 8 cuvinte

REGULI STRICTE:
1. Maximum 8 cuvinte pentru explicație, nu mai mult
2. Folosește cuvinte foarte simple pe care un copil de 8 ani le cunoaște
3. Fără semne de punctuație la final (fără punct, fără virgulă)
4. Nu repeta cuvântul de explicat
5. Pentru verbe: explică acțiunea
6. Pentru substantive: spune concret ce este
7. Pentru adjective: dă un sinonim simplu sau descrie
8. Explicația TREBUIE să fie în limba română, niciodată în engleză

EXEMPLE PERFECTE:
- "curajos" → "Cineva care nu se teme"
- "a devora" → "A mânca foarte repede și lacom"
- "magnific" → "Foarte foarte frumos"

RĂSPUNDE DOAR cu JSON valid (explicația în română):
{"correctedWord": "cuvânt_corectat_sau_original", "explanation": "explicație scurtă"}`
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

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    // Optional: Authentifizierung wenn vorhanden (nicht zwingend für diese Function)
    let userId: string | undefined;
    try {
      const { userId: authUserId } = await getAuthenticatedUser(req);
      userId = authUserId;
    } catch {
      // Nicht authentifiziert – das ist OK für diese Function
    }

    const { word, context, language = 'fr', explanationLanguage, kidProfileId, storyId } = await req.json();

    // Normalize language codes (e.g. TR, tr-TR -> tr)
    const normalizedStoryLanguage = String(language || 'fr').toLowerCase().split('-')[0];
    const normalizedExplanationLanguage = explanationLanguage
      ? String(explanationLanguage).toLowerCase().split('-')[0]
      : normalizedStoryLanguage;

    // If explanationLanguage is provided, use it for the prompt language
    // This allows word explanations to be in a different language than the story text
    const promptLanguage = normalizedExplanationLanguage || normalizedStoryLanguage || 'fr';
    
    if (!word || typeof word !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid word parameter' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'No API keys configured' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Try to get custom prompt from database first
    // Use promptLanguage (which prefers explanationLanguage if provided)
    let prompt: string;
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const promptKey = `system_prompt_word_explanation_${promptLanguage}`;
      const { data: customPrompt } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', promptKey)
        .maybeSingle();

      if (customPrompt?.value) {
        // Use custom prompt with placeholders replaced
        prompt = buildPromptFromTemplate(customPrompt.value, word, context);
      } else {
        // Fallback to built-in prompts
        const promptFn = PROMPTS[promptLanguage] || PROMPTS.en;
        prompt = promptFn(word, context);
      }
    } catch (dbError) {
      console.log('Could not fetch custom prompt, using fallback:', dbError);
      const promptFn = PROMPTS[promptLanguage] || PROMPTS.en;
      prompt = promptFn(word, context);
    }

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
        { status: 503, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const { explanation, correctedWord } = parseResponse(rawText, word);

    // Fire-and-forget: log word explanation request
    if (kidProfileId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        supabase.from('word_explanation_log').insert({
          kid_profile_id: kidProfileId,
          story_id: storyId || null,
          word: correctedWord || word,
          word_language: normalizedStoryLanguage,
          explanation_language: promptLanguage,
        }).then(({ error }) => {
          if (error) console.error('[word-log] insert failed:', error.message);
        });
      } catch (e) {
        console.error('[word-log] error:', e);
      }
    }

    return new Response(
      JSON.stringify({ explanation, correctedWord }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
