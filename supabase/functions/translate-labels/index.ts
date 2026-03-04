const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TARGET_LANGUAGES = [
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'bs', name: 'Bosnian' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, style_id } = await req.json();
    // texts: { label_en: string, description_en: string }
    
    if (!texts?.label_en && !texts?.description_en) {
      return new Response(
        JSON.stringify({ error: 'No texts to translate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const langList = TARGET_LANGUAGES.map(l => `"${l.code}" (${l.name})`).join(', ');

    const prompt = `Translate the following English texts into these languages: ${langList}.
These are UI labels for a children's story illustration app.

${texts.label_en ? `Label (short name): "${texts.label_en}"` : ''}
${texts.description_en ? `Description (1-2 sentences): "${texts.description_en}"` : ''}

Return ONLY valid JSON (no markdown):
{
  ${texts.label_en ? `"labels": { "en": "${texts.label_en}", "de": "...", "fr": "...", "es": "...", "it": "...", "nl": "...", "bs": "..." }` : ''}${texts.label_en && texts.description_en ? ',' : ''}
  ${texts.description_en ? `"descriptions": { "en": "${texts.description_en}", "de": "...", "fr": "...", "es": "...", "it": "...", "nl": "...", "bs": "..." }` : ''}
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini error:', await response.text());
      return new Response(
        JSON.stringify({ error: 'Translation service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let translations;
    try {
      const clean = rawText.replace(/```json\n?|\n?```/g, '').trim();
      translations = JSON.parse(clean);
    } catch {
      console.error('Failed to parse:', rawText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse translations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If style_id provided, update the DB directly
    if (style_id) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const updatePayload: Record<string, unknown> = {};
      if (translations.labels) updatePayload.labels = translations.labels;
      if (translations.descriptions) updatePayload.description = translations.descriptions;

      const { error } = await supabase
        .from('image_styles')
        .update(updatePayload)
        .eq('id', style_id);

      if (error) {
        console.error('DB update error:', error);
      }
    }

    return new Response(
      JSON.stringify(translations),
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
