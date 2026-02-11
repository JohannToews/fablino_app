/**
 * Speech-to-Text Edge Function
 * Uses Gladia V2 API (EU-based, GDPR-compliant)
 *
 * Flow: Upload audio → Create transcription → Poll for result
 */
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

const ALLOWED_LANGUAGES = ['de', 'fr', 'en', 'es', 'nl', 'it'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const POLL_INTERVAL_MS = 500;
const MAX_POLL_ATTEMPTS = 30;

const GLADIA_BASE_URL = 'https://api.gladia.io/v2';

// Custom vocabulary for children's story context
const CUSTOM_VOCABULARY = [
  'Fablino', 'Drache', 'Einhorn', 'Prinzessin', 'Ritter',
  'Zauberer', 'Meerjungfrau', 'Pirat', 'Dinosaurier',
];

Deno.serve(async (req) => {
  console.log(`[STT] Request: method=${req.method}, content-type=${req.headers.get('content-type')?.substring(0, 60)}`);

  // Handle CORS preflight
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  const cors = getCorsHeaders(req);
  const jsonHeaders = { ...cors, 'Content-Type': 'application/json' };

  try {
    // ── Validate API key ──────────────────────────────────────────────
    const GLADIA_API_KEY = Deno.env.get('GLADIA_API_KEY');
    if (!GLADIA_API_KEY) {
      throw new Error('GLADIA_API_KEY is not configured');
    }

    // ── Parse request ─────────────────────────────────────────────────
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const rawLanguage = (formData.get('language') as string || 'de').toLowerCase();
    const language = ALLOWED_LANGUAGES.includes(rawLanguage) ? rawLanguage : 'de';

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Audio file is required (field "audio")' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: `File too large (${(audioFile.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.` }),
        { status: 400, headers: jsonHeaders },
      );
    }

    console.log(`[STT] Start – file: ${audioFile.name}, size: ${audioFile.size}, language: ${language}`);
    const startTime = Date.now();

    // ── Step 1: Upload audio to Gladia ────────────────────────────────
    console.log('[STT] Step 1: Uploading audio to Gladia...');
    const uploadForm = new FormData();
    uploadForm.append('audio', audioFile);

    const uploadRes = await fetch(`${GLADIA_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'x-gladia-key': GLADIA_API_KEY,
        // Do NOT set Content-Type – FormData sets the boundary automatically
      },
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`[STT] Upload failed: ${uploadRes.status} ${errText}`);
      throw new Error(`Gladia upload failed (${uploadRes.status}): ${errText}`);
    }

    const uploadData = await uploadRes.json();
    const audioUrl = uploadData.audio_url;
    console.log(`[STT] Step 1 done – audio_url: ${audioUrl}`);

    // ── Step 2: Create transcription request ──────────────────────────
    console.log('[STT] Step 2: Creating transcription...');
    const transcriptionRes = await fetch(`${GLADIA_BASE_URL}/transcription`, {
      method: 'POST',
      headers: {
        'x-gladia-key': GLADIA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_config: {
          languages: [language],
          code_switching: false,
        },
        custom_vocabulary: CUSTOM_VOCABULARY,
      }),
    });

    if (!transcriptionRes.ok) {
      const errText = await transcriptionRes.text();
      console.error(`[STT] Transcription create failed: ${transcriptionRes.status} ${errText}`);
      throw new Error(`Gladia transcription failed (${transcriptionRes.status}): ${errText}`);
    }

    const transcriptionData = await transcriptionRes.json();
    const resultUrl = transcriptionData.result_url;
    console.log(`[STT] Step 2 done – id: ${transcriptionData.id}, result_url: ${resultUrl}`);

    // ── Step 3: Poll for result ───────────────────────────────────────
    console.log('[STT] Step 3: Polling for result...');
    let transcript = '';
    let pollCount = 0;

    while (pollCount < MAX_POLL_ATTEMPTS) {
      pollCount++;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const pollRes = await fetch(resultUrl, {
        method: 'GET',
        headers: { 'x-gladia-key': GLADIA_API_KEY },
      });

      if (!pollRes.ok) {
        const errText = await pollRes.text();
        console.error(`[STT] Poll ${pollCount} failed: ${pollRes.status} ${errText}`);
        // Retry on transient errors
        if (pollCount >= MAX_POLL_ATTEMPTS) {
          throw new Error(`Gladia poll failed after ${MAX_POLL_ATTEMPTS} attempts: ${errText}`);
        }
        continue;
      }

      const pollData = await pollRes.json();
      console.log(`[STT] Poll ${pollCount}: status=${pollData.status}`);

      if (pollData.status === 'done') {
        transcript = pollData.result?.transcription?.full_transcript || '';
        console.log(`[STT] Transcription complete: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}"`);
        break;
      }

      if (pollData.status === 'error') {
        const errorMsg = pollData.error_message || pollData.result?.error || 'Unknown Gladia error';
        console.error(`[STT] Transcription error: ${errorMsg}`);
        throw new Error(`Gladia transcription error: ${errorMsg}`);
      }

      // status is "queued" or "processing" → continue polling
    }

    if (pollCount >= MAX_POLL_ATTEMPTS && !transcript) {
      throw new Error(`Transcription timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
    }

    const duration = Date.now() - startTime;
    console.log(`[STT] Done in ${duration}ms – language: ${language}, chars: ${transcript.length}`);

    return new Response(
      JSON.stringify({ text: transcript, language, duration }),
      { headers: jsonHeaders },
    );

  } catch (error) {
    console.error('[STT] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
