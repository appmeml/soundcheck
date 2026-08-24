// Transcripción de voz. La llave vive SOLO en Cloudflare; nunca llega al
// navegador. Reconocimiento confiable donde el Web Speech del navegador falla
// (Safari/iPhone). Cloudflare Pages Function en /api/transcribe.
//
// Resistente a saturación: rota modelos de Gemini y reintenta; si defines
// GROQ_API_KEY, usa Groq Whisper como segunda opción (gratis).
//
// Variables de entorno:
//   GEMINI_API_KEY  (obligatoria si no usas Groq)
//   STT_MODEL / MODEL   (opcional; modelo de Gemini a probar primero)
//   GROQ_API_KEY    (opcional; respaldo con Whisper, groq.com)
//   GROQ_STT_MODEL  (opcional; por defecto whisper-large-v3)

const MODEL_FALLBACKS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
];
const GROQ_STT_DEFAULT = 'whisper-large-v3';
const MAX_AUDIO_B64 = 6_000_000; // ~4.5 MB

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function modelCandidates(env) {
  const first = env && (env.STT_MODEL || env.MODEL);
  const list = MODEL_FALLBACKS.slice();
  if (first && !list.includes(first)) return [first, ...list];
  if (first) return [first, ...list.filter((m) => m !== first)];
  return list;
}
function classify(status, raw) {
  let s = '', m = '';
  try { const e = JSON.parse(raw).error || {}; s = String(e.status || ''); m = String(e.message || '').toLowerCase(); } catch (_) {}
  if (status >= 200 && status < 300) return 'ok';
  if (status === 429 || s === 'RESOURCE_EXHAUSTED') return 'quota';
  if (status === 404 || s === 'NOT_FOUND' || m.includes('not found') || m.includes('is not supported') || m.includes('not available')) return 'notfound';
  if (status === 503 || status === 500 || s === 'UNAVAILABLE' || s === 'INTERNAL' || m.includes('overloaded') || m.includes('high demand') || m.includes('try again')) return 'overloaded';
  return 'fatal';
}

const SYS = [
  'You transcribe short English speech recorded by a Spanish-speaking BEGINNER practicing for a trip.',
  'Expect a strong Spanish accent and imperfect pronunciation; still do your BEST to guess the intended English words.',
  'Output ONLY those words, in lowercase, with no punctuation and no extra comments.',
  'Output an empty string ONLY if the audio is completely silent.',
].join(' ');

function extractText(raw) {
  try {
    const data = JSON.parse(raw);
    const parts = data && data.candidates && data.candidates[0]
      && data.candidates[0].content && data.candidates[0].content.parts;
    if (Array.isArray(parts)) return parts.map((p) => p.text || '').join('');
  } catch (_) {}
  return '';
}

async function tryGemini(env, key, audio, mime) {
  const body = {
    systemInstruction: { parts: [{ text: SYS }] },
    contents: [{ role: 'user', parts: [{ text: 'Transcribe this audio:' }, { inlineData: { mimeType: mime, data: audio } }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 64 },
  };
  let hardFatal = null, notFound = null, sawOverload = false;
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) { if (!sawOverload) break; await sleep(700); }
    for (const model of modelCandidates(env)) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
      let res, raw;
      try { res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); raw = await res.text(); }
      catch (_) { sawOverload = true; continue; }
      const kind = classify(res.status, raw);
      if (kind === 'ok') return { ok: true, text: extractText(raw).trim() };
      if (kind === 'notfound') { notFound = { status: res.status, raw }; continue; }
      if (kind === 'overloaded') { sawOverload = true; continue; }
      if (kind === 'quota') return { ok: false, reason: 'quota' };
      hardFatal = { status: res.status, raw };
    }
  }
  if (hardFatal) return { ok: false, reason: 'fatal', ...hardFatal };
  if (sawOverload) return { ok: false, reason: 'overloaded' };
  if (notFound) return { ok: false, reason: 'notfound', ...notFound };
  return { ok: false, reason: 'overloaded' };
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Respaldo: Groq Whisper (gratis). Devuelve texto o null.
async function tryGroqWhisper(env, audio, mime) {
  const key = env && env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const form = new FormData();
    form.append('model', (env && env.GROQ_STT_MODEL) || GROQ_STT_DEFAULT);
    form.append('response_format', 'text');
    form.append('language', 'en');
    form.append('file', new Blob([b64ToBytes(audio)], { type: mime || 'audio/wav' }), 'audio.wav');
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form,
    });
    if (!res.ok) return null;
    const text = (await res.text()) || '';
    return { ok: true, text: text.trim().toLowerCase().replace(/[.,!?;:"]/g, '') };
  } catch (_) { return null; }
}

export async function onRequestPost({ request, env }) {
  const geminiKey = env && env.GEMINI_API_KEY;
  const groqKey = env && env.GROQ_API_KEY;
  if (!geminiKey && !groqKey) {
    return json({ error: 'Falta configurar GEMINI_API_KEY en Cloudflare. Usa el cuadro de texto para practicar.' }, 401);
  }

  let payload;
  try { payload = await request.json(); } catch (_) { return json({ error: 'Solicitud inválida.' }, 400); }
  const audio = payload && payload.audio;
  const mime = (payload && payload.mime) || 'audio/wav';
  if (!audio || typeof audio !== 'string') return json({ error: 'No llegó audio para transcribir.' }, 400);
  if (audio.length > MAX_AUDIO_B64) return json({ error: 'La grabación es muy larga. Intenta una frase más corta.' }, 413);

  // Si hay Groq (Whisper), va PRIMERO: su cuota gratis de voz es amplia y así se
  // suma a la de Gemini. AI_PRIMARY='gemini' invierte el orden.
  const groqFirst = groqKey && String((env && env.AI_PRIMARY) || '').toLowerCase() !== 'gemini';

  if (groqFirst) {
    const gr = await tryGroqWhisper(env, audio, mime);
    if (gr && gr.ok) return json({ transcript: gr.text });
  }

  let g = null;
  if (geminiKey) {
    g = await tryGemini(env, geminiKey, audio, mime);
    if (g.ok) return json({ transcript: g.text });
  }

  if (!groqFirst) {
    const gr = await tryGroqWhisper(env, audio, mime);
    if (gr && gr.ok) return json({ transcript: gr.text });
  }

  if (g && g.reason === 'quota') return json({ error: 'Se acabó la cuota gratuita de hoy. Usa el cuadro de texto, o vuelve mañana.' }, 429);
  if (g && g.reason === 'overloaded') return json({ error: 'El reconocimiento de voz está con mucha demanda ahora. Reintenta en unos segundos o escribe la frase.' }, 503);
  if (g && g.reason === 'notfound') return json({ error: 'Ningún modelo de voz está disponible para tu llave. Revisa la GEMINI_API_KEY o configura GROQ_API_KEY.' }, 502);
  if (g) return json({ error: upstreamError(g.status, g.raw) }, g.status === 403 ? 403 : 502);
  return json({ error: 'El reconocimiento de voz no está disponible ahora. Escribe la frase.' }, 502);
}

function upstreamError(status, raw) {
  let msg = '', gstatus = '';
  try { const e = JSON.parse(raw).error || {}; msg = String(e.message || ''); gstatus = String(e.status || ''); } catch (_) {}
  const m = msg.toLowerCase();
  if (m.includes('api key not valid') || status === 401) return 'La llave GEMINI_API_KEY no es válida. Actualízala en Cloudflare. Mientras tanto, escribe la frase.';
  if (status === 403 || gstatus === 'PERMISSION_DENIED' || m.includes('has not been used') || m.includes('disabled')) return 'Falta habilitar la API de Gemini para tu llave. Mientras tanto, escribe la frase.';
  return 'El transcriptor devolvió un error. Detalle: ' + (msg || gstatus || ('HTTP ' + status)).slice(0, 140);
}
