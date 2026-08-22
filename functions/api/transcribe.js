// Transcripción de voz con Gemini. Recibe audio (WAV base64) y devuelve el
// texto en inglés que se escuchó. Sirve como reconocimiento de voz confiable
// donde el Web Speech API del navegador falla (Safari/iOS). La llave vive solo
// en Cloudflare; nunca llega al navegador.
//
// Variables de entorno:
//   GEMINI_API_KEY  (obligatoria, secreta)
//   STT_MODEL       (opcional; por defecto usa MODEL, y si no, gemini-2.5-flash-lite)
//   MODEL           (opcional; compartida con /api/chat)

// Modelos a probar en orden (todos aceptan audio). Si STT_MODEL/MODEL están
// definidos en Cloudflare, se prueban primero.
const MODEL_FALLBACKS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
];
function modelCandidates(env) {
  const first = env && (env.STT_MODEL || env.MODEL);
  const list = MODEL_FALLBACKS.slice();
  if (first && !list.includes(first)) return [first, ...list];
  if (first) return [first, ...list.filter((m) => m !== first)];
  return list;
}
function isModelNotFound(status, raw) {
  if (status === 404) return true;
  try {
    const e = JSON.parse(raw).error || {};
    const s = String(e.status || '');
    const m = String(e.message || '').toLowerCase();
    return s === 'NOT_FOUND' || m.includes('not found') || m.includes('is not supported') || m.includes('not available');
  } catch (_) { return false; }
}

const MAX_AUDIO_B64 = 6_000_000; // ~4.5 MB de audio; suficiente para frases cortas

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost({ request, env }) {
  const key = env && env.GEMINI_API_KEY;
  if (!key) {
    return json({ error: 'Falta configurar GEMINI_API_KEY en Cloudflare. Usa el cuadro de texto para practicar.' }, 401);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return json({ error: 'Solicitud inválida.' }, 400);
  }

  const audio = payload && payload.audio;
  const mime = (payload && payload.mime) || 'audio/wav';
  if (!audio || typeof audio !== 'string') {
    return json({ error: 'No llegó audio para transcribir.' }, 400);
  }
  if (audio.length > MAX_AUDIO_B64) {
    return json({ error: 'La grabación es muy larga. Intenta una frase más corta.' }, 413);
  }

  const body = {
    systemInstruction: {
      parts: [{
        text: [
          'You transcribe short English speech recorded by a Spanish-speaking learner practicing for a trip.',
          'Output ONLY the exact English words you hear, in lowercase, with no punctuation and no extra comments.',
          'If you truly hear nothing intelligible, output an empty string.',
        ].join(' '),
      }],
    },
    contents: [{
      role: 'user',
      parts: [
        { text: 'Transcribe this audio:' },
        { inlineData: { mimeType: mime, data: audio } },
      ],
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 64 },
  };

  // Prueba modelos en orden hasta que uno acepte el audio.
  let upstream = null;
  let raw = '';
  for (const candidate of modelCandidates(env)) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (_) {
      return json({ error: 'No se pudo contactar al transcriptor. Revisa tu conexión.' }, 502);
    }
    raw = await upstream.text();
    if (isModelNotFound(upstream.status, raw)) continue;
    break;
  }

  if (upstream && upstream.status === 429) {
    return json({ error: 'Se acabó la cuota gratuita de hoy. Usa el cuadro de texto, o vuelve mañana.' }, 429);
  }

  if (!upstream || !upstream.ok) {
    let msg = '', gstatus = '';
    try { const e = JSON.parse(raw).error || {}; msg = String(e.message || ''); gstatus = String(e.status || ''); } catch (_) {}
    const m = msg.toLowerCase();
    const status = upstream ? upstream.status : 502;
    if (m.includes('api key not valid') || status === 401) {
      return json({ error: 'La llave GEMINI_API_KEY no es válida. Actualízala en Cloudflare. Mientras tanto, escribe la frase.' }, 502);
    }
    if (status === 403 || gstatus === 'PERMISSION_DENIED' || m.includes('has not been used') || m.includes('disabled')) {
      return json({ error: 'Falta habilitar la API de Gemini para tu llave. Mientras tanto, escribe la frase.' }, 502);
    }
    return json({ error: 'El transcriptor devolvió un error. Detalle: ' + (msg || gstatus || ('HTTP ' + status)).slice(0, 140) }, 502);
  }

  let text = '';
  try {
    const data = JSON.parse(raw);
    const parts = data && data.candidates && data.candidates[0]
      && data.candidates[0].content && data.candidates[0].content.parts;
    if (Array.isArray(parts)) text = parts.map((p) => p.text || '').join('');
  } catch (_) { /* text queda vacío */ }

  return json({ transcript: text.trim() });
}
