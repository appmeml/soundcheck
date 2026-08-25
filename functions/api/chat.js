// Proxy del tutor de conversación. La llave vive SOLO en Cloudflare y nunca
// llega al navegador. Cloudflare Pages Function en /api/chat.
//
// Diseñado para que la charla FLUYA aunque un modelo esté saturado:
//   1) Prueba varios modelos Flash de Gemini (rota si uno no existe o está saturado).
//   2) Reintenta una vez con espera corta si todos están saturados.
//   3) Si defines GROQ_API_KEY, usa Groq (Llama) como segunda IA de respaldo.
// El tutor se adapta al nivel del usuario (A1/A2/B1), que evoluciona con su progreso.
//
// Variables de entorno (Cloudflare → Settings → Environment variables):
//   GEMINI_API_KEY  (obligatoria, secreta)
//   MODEL           (opcional; modelo de Gemini a probar primero)
//   GROQ_API_KEY    (opcional, secreta; segunda IA de respaldo, gratis en groq.com)
//   GROQ_MODEL      (opcional; por defecto llama-3.3-70b-versatile)

const MODEL_FALLBACKS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
];
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

function modelCandidates(env) {
  const first = env && env.MODEL;
  const list = MODEL_FALLBACKS.slice();
  if (first && !list.includes(first)) return [first, ...list];
  if (first) return [first, ...list.filter((m) => m !== first)];
  return list;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Clasifica la respuesta de Gemini para decidir qué hacer.
function classify(status, raw) {
  let s = '', m = '';
  try { const e = JSON.parse(raw).error || {}; s = String(e.status || ''); m = String(e.message || '').toLowerCase(); } catch (_) {}
  if (status >= 200 && status < 300) return 'ok';
  if (status === 429 || s === 'RESOURCE_EXHAUSTED') return 'quota';
  if (status === 404 || s === 'NOT_FOUND' || m.includes('not found') || m.includes('is not supported') || m.includes('not available')) return 'notfound';
  if (status === 503 || status === 500 || s === 'UNAVAILABLE' || s === 'INTERNAL' || m.includes('overloaded') || m.includes('high demand') || m.includes('try again')) return 'overloaded';
  return 'fatal'; // 400/401/403: llave, API deshabilitada, región, etc.
}

// El tutor, adaptado al nivel. El nivel EVOLUCIONA con el progreso del usuario.
function systemInstruction(persona, level) {
  const role = (typeof persona === 'string' && persona.trim())
    ? persona.trim()
    : 'You are a friendly American helping someone practice spoken English.';
  const lvl = ({ A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2' })[String(level || '').toUpperCase()] || 'A1';
  const byLevel = {
    A1: 'The learner is a BEGINNER (A1). Reply in VERY simple English, at most 2 short sentences, basic words only.',
    A2: 'The learner is ELEMENTARY (A2). Reply in simple English, 2-3 short sentences, common everyday vocabulary.',
    B1: 'The learner is INTERMEDIATE (B1). Reply in natural but clear English, 2-4 sentences. Introduce a few new useful words.',
    B2: 'The learner is UPPER-INTERMEDIATE (B2). Reply naturally, 3-5 sentences. Use richer vocabulary and idioms, but stay clear.',
  };
  return [
    role,
    'The user is a native Spanish speaker from Ecuador practicing spoken English.',
    byLevel[lvl],
    'Keep the conversation flowing: always end with a natural question so the user can reply.',
    'Rules:',
    '- Always give a natural Spanish translation of your reply in "reply_es".',
    '- Only add a "correction" when the user made a REAL error; otherwise null.',
    '- A correction has "better" (corrected English) and "why" (a Spanish explanation, max 15 words).',
    '- Always give exactly 3 short suggested replies in "options" (simple English) so the user is never stuck.',
    '- Be warm, patient and encouraging. Stay in character.',
    '',
    'Respond with ONLY a valid JSON object (no markdown, no code fences), EXACTLY these keys:',
    '{"reply": string, "reply_es": string, "correction": {"better": string, "why": string} | null, "options": [string, string, string]}',
  ].join('\n');
}

function shape(structured) {
  return {
    reply: typeof structured.reply === 'string' ? structured.reply : '…',
    reply_es: typeof structured.reply_es === 'string' ? structured.reply_es : '',
    correction: structured.correction && structured.correction.better
      ? { better: String(structured.correction.better), why: String(structured.correction.why || '') }
      : null,
    options: Array.isArray(structured.options) ? structured.options.map(String).slice(0, 3) : [],
  };
}

// ---------- Gemini ----------
async function tryGemini(env, key, systemText, contents) {
  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 800, responseMimeType: 'application/json' },
  };

  let hardFatal = null;   // 400/401/403: llave, API, región (lo más importante)
  let notFoundInfo = null;
  let sawOverload = false;

  // Dos pasadas: la segunda con una espera corta, por si todo estaba saturado.
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) {
      if (!sawOverload) break;
      await sleep(700);
    }
    for (const model of modelCandidates(env)) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
      let res, raw;
      try {
        res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        raw = await res.text();
      } catch (_) { sawOverload = true; continue; } // error de red: trátalo como reintentar

      const kind = classify(res.status, raw);
      if (kind === 'ok') {
        const text = extractText(raw);
        const structured = text ? parseLoose(text) : null;
        return { ok: true, data: structured ? shape(structured) : { reply: (text || '…').trim(), reply_es: '', correction: null, options: [] } };
      }
      if (kind === 'notfound') { notFoundInfo = { status: res.status, raw, model }; continue; }
      if (kind === 'overloaded') { sawOverload = true; continue; }
      if (kind === 'quota') return { ok: false, reason: 'quota' };
      hardFatal = { status: res.status, raw, model }; // llave/API/región
    }
  }
  if (hardFatal) return { ok: false, reason: 'fatal', ...hardFatal };
  if (sawOverload) return { ok: false, reason: 'overloaded' };
  if (notFoundInfo) return { ok: false, reason: 'notfound', ...notFoundInfo };
  return { ok: false, reason: 'overloaded' };
}

function extractText(raw) {
  try {
    const data = JSON.parse(raw);
    const parts = data && data.candidates && data.candidates[0]
      && data.candidates[0].content && data.candidates[0].content.parts;
    if (Array.isArray(parts)) return parts.map((p) => p.text || '').join('');
  } catch (_) {}
  return '';
}

// ---------- Groq (segunda IA de respaldo, opcional) ----------
async function tryGroq(env, systemText, contents) {
  const key = env && env.GROQ_API_KEY;
  if (!key) return null;
  const model = (env && env.GROQ_MODEL) || GROQ_DEFAULT_MODEL;
  const messages = [{ role: 'system', content: systemText }];
  for (const c of contents) {
    const text = (c.parts && c.parts[0] && c.parts[0].text) || '';
    messages.push({ role: c.role === 'model' ? 'assistant' : 'user', content: text });
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 800, response_format: { type: 'json_object' } }),
    });
    const raw = await res.text();
    if (!res.ok) return null;
    let content = '';
    try {
      const data = JSON.parse(raw);
      content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
    } catch (_) {}
    const structured = content ? parseLoose(content) : null;
    if (!structured) return null;
    return { ok: true, data: shape(structured) };
  } catch (_) { return null; }
}

// Todas las llaves de Gemini configuradas (para SUMAR cuotas de varios proyectos).
function geminiKeys(env) {
  return [env && env.GEMINI_API_KEY, env && env.GEMINI_API_KEY_2, env && env.GEMINI_API_KEY_3]
    .filter((k) => k && String(k).trim());
}
// ¿Conviene probar con OTRA llave de Gemini? Solo si esta se quedó sin cuota o es inválida.
function shouldTryNextKey(g) {
  if (g.reason === 'quota') return true;
  if (g.reason === 'fatal') {
    const m = (() => { try { return String(JSON.parse(g.raw).error.message || '').toLowerCase(); } catch (_) { return ''; } })();
    return m.includes('api key not valid') || g.status === 401;
  }
  return false;
}

export async function onRequestPost({ request, env }) {
  const keys = geminiKeys(env);
  const groqKey = env && env.GROQ_API_KEY;
  if (!keys.length && !groqKey) {
    return json({ error: 'Falta configurar GEMINI_API_KEY en Cloudflare. La Charla no está disponible; Kit y Oído siguen funcionando.' }, 401);
  }

  let payload;
  try { payload = await request.json(); } catch (_) { return json({ error: 'Solicitud inválida.' }, 400); }

  const persona = payload && payload.persona;
  const level = payload && payload.level;
  const rawMessages = Array.isArray(payload && payload.messages) ? payload.messages : [];
  const trimmed = rawMessages.slice(-12); // últimos 12 mensajes (no gastar cuota)
  const contents = trimmed.map((m) => ({
    role: m && m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String((m && m.text) || '') }],
  }));
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: '(The conversation just started. Greet the user briefly, in character, and ask one simple question.)' }] });
  }

  const systemText = systemInstruction(persona, level);

  // Prueba los proveedores en orden. Con Groq presente, va PRIMERO (su cuota
  // gratis diaria es mayor); así las cuotas de Groq y Gemini se SUMAN.
  let geminiFail = null;
  for (const provider of providerOrder(env)) {
    if (provider === 'groq') {
      const gr = await tryGroq(env, systemText, contents);
      if (gr && gr.ok) return json(gr.data);
    } else {
      // Rota entre las llaves de Gemini: si una se quedó sin cuota, prueba la siguiente.
      for (const k of keys) {
        const g = await tryGemini(env, k, systemText, contents);
        if (g.ok) return json(g.data);
        geminiFail = g;
        if (!shouldTryNextKey(g)) break;
      }
    }
  }

  // Ninguno respondió: mensaje accionable (prioriza el diagnóstico de Gemini).
  if (geminiFail) {
    if (geminiFail.reason === 'quota') {
      return json({ error: 'Se acabó la cuota gratuita de hoy en las dos IAs. Vuelve mañana (se renueva solo), o sigue practicando en Kit y Oído — esas funcionan siempre.' }, 429);
    }
    if (geminiFail.reason === 'fatal') {
      return json({ error: upstreamError(geminiFail.status, geminiFail.raw, geminiFail.model) }, geminiFail.status === 403 ? 403 : 502);
    }
    if (geminiFail.reason === 'notfound') {
      return json({ error: 'Ningún modelo de IA está disponible para tu llave. Revisa que la GEMINI_API_KEY sea válida y tenga la "Generative Language API" activada; o fija MODEL a gemini-2.5-flash.' }, 502);
    }
  }
  return json({ error: 'El tutor está con mucha demanda ahora mismo. Reintenta en unos segundos (suele durar poco).' }, 503);
}

// Orden de proveedores. Si hay Groq, va primero (mayor cuota gratis diaria).
// AI_PRIMARY ('groq'|'gemini') permite forzarlo.
function providerOrder(env) {
  const hasGroq = !!(env && env.GROQ_API_KEY);
  const hasGemini = geminiKeys(env).length > 0;
  const explicit = env && env.AI_PRIMARY && String(env.AI_PRIMARY).toLowerCase();
  let order;
  if (explicit === 'gemini') order = ['gemini', 'groq'];
  else if (explicit === 'groq') order = ['groq', 'gemini'];
  else order = hasGroq ? ['groq', 'gemini'] : ['gemini', 'groq'];
  return order.filter((p) => (p === 'groq' && hasGroq) || (p === 'gemini' && hasGemini));
}

// Convierte un error real de Gemini en un mensaje claro en español (sin filtrar la llave).
function upstreamError(status, raw, model) {
  let msg = '', gstatus = '';
  try { const e = JSON.parse(raw).error || {}; msg = String(e.message || ''); gstatus = String(e.status || ''); } catch (_) {}
  const m = msg.toLowerCase();
  if (m.includes('api key not valid') || m.includes('api_key_invalid') || status === 401) {
    return 'La llave GEMINI_API_KEY no es válida. Genera una nueva en aistudio.google.com/apikey y actualízala en Cloudflare (Retry deployment).';
  }
  if (status === 403 || gstatus === 'PERMISSION_DENIED' || m.includes('has not been used') || m.includes('is disabled') || m.includes('service_disabled') || m.includes('permission')) {
    return 'Falta habilitar la API de Gemini para tu llave. Crea la llave en aistudio.google.com/apikey en un proyecto con la "Generative Language API" activada, y actualízala en Cloudflare.';
  }
  if (status === 400 && m.includes('user location')) {
    return 'Gemini no está disponible en tu región para esta llave. Prueba otra llave/proyecto, o configura GROQ_API_KEY como respaldo.';
  }
  const hint = (msg || gstatus || ('HTTP ' + status)).slice(0, 160);
  return 'La IA devolvió un error. Detalle: ' + hint;
}

// Parseo tolerante: quita fences ```json y recorta al primer objeto {...}.
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
