// Transcripción de voz con Gemini. Recibe audio (WAV base64) y devuelve el
// texto en inglés que se escuchó. Sirve como reconocimiento de voz confiable
// donde el Web Speech API del navegador falla (Safari/iOS). La llave vive solo
// en Cloudflare; nunca llega al navegador.
//
// Variables de entorno:
//   GEMINI_API_KEY  (obligatoria, secreta)
//   STT_MODEL       (opcional; por defecto usa MODEL, y si no, gemini-2.5-flash-lite)
//   MODEL           (opcional; compartida con /api/chat)

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
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

  const model = (env && (env.STT_MODEL || env.MODEL)) || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

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

  let upstream;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_) {
    return json({ error: 'No se pudo contactar al transcriptor. Revisa tu conexión.' }, 502);
  }

  if (upstream.status === 429) {
    return json({ error: 'Se acabó la cuota gratuita de hoy. Usa el cuadro de texto, o vuelve mañana.' }, 429);
  }

  const raw = await upstream.text();
  if (!upstream.ok) {
    let msg = '', gstatus = '';
    try { const e = JSON.parse(raw).error || {}; msg = String(e.message || ''); gstatus = String(e.status || ''); } catch (_) {}
    const m = msg.toLowerCase();
    if (m.includes('api key not valid') || upstream.status === 401) {
      return json({ error: 'La llave GEMINI_API_KEY no es válida. Actualízala en Cloudflare. Mientras tanto, escribe la frase.' }, 502);
    }
    if (upstream.status === 403 || gstatus === 'PERMISSION_DENIED' || m.includes('has not been used') || m.includes('disabled')) {
      return json({ error: 'Falta habilitar la API de Gemini para tu llave. Mientras tanto, escribe la frase.' }, 502);
    }
    if (upstream.status === 404 || m.includes('not found')) {
      return json({ error: 'El modelo de voz no está disponible. En Cloudflare pon STT_MODEL=gemini-2.5-flash. Mientras tanto, escribe la frase.' }, 502);
    }
    return json({ error: 'El transcriptor devolvió un error. Detalle: ' + (msg || gstatus || ('HTTP ' + upstream.status)).slice(0, 140) }, 502);
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
