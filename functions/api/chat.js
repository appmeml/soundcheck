// Proxy hacia Gemini. La llave GEMINI_API_KEY vive SOLO en Cloudflare y nunca
// llega al navegador. Se ejecuta como Cloudflare Pages Function en /api/chat.
//
// Variables de entorno (Cloudflare Pages → Settings → Environment variables):
//   GEMINI_API_KEY  (obligatoria, secreta)
//   MODEL           (opcional; por defecto gemini-2.5-flash-lite, del tier gratis)
//
// Los nombres de modelo cambian seguido. Verifica en
// https://ai.google.dev/gemini-api/docs/pricing cuáles están hoy en el tier
// gratuito (usa un Flash o Flash-Lite) y ajusta la variable MODEL sin tocar código.

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// El tutor: instrucción de sistema separada de la conversación.
function systemInstruction(persona) {
  const role = typeof persona === 'string' && persona.trim()
    ? persona.trim()
    : 'You are a friendly American helping a traveler practice English.';
  return [
    role,
    'The user is a native Spanish speaker from Ecuador at level A1 (beginner) practicing for a trip to Orlando and Miami.',
    'Rules:',
    '- Reply in VERY simple English, at most 2 short sentences.',
    '- Always give a natural Spanish translation of your reply in "reply_es".',
    '- Only add a "correction" when the user made a REAL error; otherwise set it to null.',
    '- A correction has "better" (the corrected English) and "why" (an explanation in Spanish, max 15 words).',
    '- Always give exactly 3 short suggested replies the user could say next, in "options", in simple English.',
    '- Stay fully in character for the scenario. Be warm and encouraging.',
    '',
    'Respond with ONLY a valid JSON object (no markdown, no code fences) with EXACTLY these keys:',
    '{"reply": string, "reply_es": string, "correction": {"better": string, "why": string} | null, "options": [string, string, string]}',
  ].join('\n');
}

export async function onRequestPost({ request, env }) {
  const key = env && env.GEMINI_API_KEY;
  if (!key) {
    return json({ error: 'Falta configurar GEMINI_API_KEY en Cloudflare. La Charla no está disponible; Kit y Oído siguen funcionando.' }, 401);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return json({ error: 'Solicitud inválida.' }, 400);
  }

  const persona = payload && payload.persona;
  const rawMessages = Array.isArray(payload && payload.messages) ? payload.messages : [];

  // Limita el historial a los últimos 12 mensajes para no gastar la cuota.
  const trimmed = rawMessages.slice(-12);
  const contents = trimmed.map((m) => ({
    role: m && m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String((m && m.text) || '') }],
  }));
  // Si no hay historial, pide el saludo inicial del personaje.
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: '(The conversation just started. Greet the user briefly, in character, and ask one simple question.)' }] });
  }

  const model = (env && env.MODEL) || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction(persona) }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
      responseMimeType: 'application/json',
    },
  };

  let upstream;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_) {
    return json({ error: 'No se pudo contactar a la IA. Intenta de nuevo.' }, 502);
  }

  if (upstream.status === 429) {
    return json({ error: 'Se acabó la cuota gratuita de hoy. Vuelve mañana, o sigue practicando en Kit y Oído — esas funcionan siempre.' }, 429);
  }

  const raw = await upstream.text();
  if (!upstream.ok) {
    // Mensaje accionable según el error real de Gemini (sin filtrar la llave).
    return json({ error: upstreamError(upstream.status, raw, model) }, upstream.status === 403 ? 403 : 502);
  }

  // Parseo defensivo: extrae el texto y trata de leer el JSON estructurado.
  let text = '';
  try {
    const data = JSON.parse(raw);
    const parts = data && data.candidates && data.candidates[0]
      && data.candidates[0].content && data.candidates[0].content.parts;
    if (Array.isArray(parts)) text = parts.map((p) => p.text || '').join('');
  } catch (_) { /* seguimos con text vacío */ }

  if (!text) {
    return json({ reply: '…', reply_es: '', correction: null, options: [] });
  }

  const structured = parseLoose(text);
  if (!structured) {
    // Si el JSON viene mal, al menos devolvemos el texto plano como reply.
    return json({ reply: text.trim(), reply_es: '', correction: null, options: [] });
  }

  return json({
    reply: typeof structured.reply === 'string' ? structured.reply : '…',
    reply_es: typeof structured.reply_es === 'string' ? structured.reply_es : '',
    correction: structured.correction && structured.correction.better
      ? { better: String(structured.correction.better), why: String(structured.correction.why || '') }
      : null,
    options: Array.isArray(structured.options) ? structured.options.map(String).slice(0, 3) : [],
  });
}

// Convierte el error crudo de Gemini en un mensaje claro en español, sin filtrar
// la llave. Incluye una pista técnica corta para poder diagnosticar.
function upstreamError(status, raw, model) {
  let msg = '';
  let gstatus = '';
  try {
    const e = JSON.parse(raw).error || {};
    msg = String(e.message || '');
    gstatus = String(e.status || '');
  } catch (_) {}
  const m = msg.toLowerCase();

  if (m.includes('api key not valid') || m.includes('api_key_invalid') || status === 401) {
    return 'La llave GEMINI_API_KEY no es válida. Genera una nueva en aistudio.google.com/apikey y actualízala en Cloudflare (y haz Retry deployment).';
  }
  if (status === 403 || gstatus === 'PERMISSION_DENIED' || m.includes('has not been used') || m.includes('is disabled') || m.includes('service_disabled') || m.includes('permission')) {
    return 'Falta habilitar la API de Gemini para tu llave. En aistudio.google.com/apikey crea la llave en un proyecto con la "Generative Language API" activada, o actívala en Google Cloud. Luego actualiza la llave en Cloudflare.';
  }
  if (status === 404 || m.includes('not found') || m.includes('is not supported') || m.includes('models/')) {
    return `El modelo "${model}" no está disponible para tu llave. En Cloudflare cambia la variable MODEL a gemini-2.5-flash (o gemini-2.0-flash) y haz Retry deployment.`;
  }
  if (status === 400 && m.includes('user location')) {
    return 'Gemini no está disponible en tu región para esta llave. Prueba otra llave/proyecto.';
  }
  // Genérico: incluimos una pista corta y segura para diagnosticar.
  const hint = (msg || gstatus || ('HTTP ' + status)).slice(0, 160);
  return 'La IA devolvió un error. Detalle: ' + hint;
}

// Parseo tolerante: quita ```json ... ``` y recorta al primer objeto {...}.
function parseLoose(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(t); } catch (_) {}
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a !== -1 && b !== -1 && b > a) {
    try { return JSON.parse(t.slice(a, b + 1)); } catch (_) {}
  }
  return null;
}

// Cualquier método distinto de POST recibe 405 automáticamente de Cloudflare
// Pages (no hay handler para GET/PUT/etc.), así que no exponemos otra ruta.
