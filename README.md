# Soundcheck 🎚️

**Práctica de inglés hablado y comprensión auditiva, para viajar.** Multiusuario, con repetición espaciada. Pensada para un nivel A1 real que necesita, sobre todo, **entender a los nativos a velocidad normal**.

Costo mensual: **cero**. Todo corre en tiers gratuitos permanentes.

- **HTML + CSS + JavaScript vanilla** — sin React, sin build step, sin bundler.
- **Firebase** (Auth con Google + Firestore con persistencia offline) por CDN.
- **Cloudflare Pages** para hosting y **Pages Functions** como proxy hacia Gemini (la llave nunca llega al navegador).
- **Web Speech API** nativa para escuchar (SpeechSynthesis) y grabarse (SpeechRecognition) — gratis e ilimitada.
- **PWA instalable** con service worker; abre en modo avión.

---

## Las secciones

Navegación inferior: **Hoy · Kit · Oído · Charla · Familia**.

- **Hoy** — saludo, racha, cuenta regresiva al viaje (6 de septiembre de 2026), botón grande de la *sesión del día* (12 tarjetas) y tu *punto débil* actual.
- **Kit** — pronunciación. Escucha la frase (lento 0.6× o normal 1.0×), grábate, y la app compara palabra por palabra: verde si la dijiste, rojo tachado si se perdió. Medidor VU en vivo con tu voz.
- **Oído** — comprensión auditiva (lo más importante). Reproduce una frase **sin mostrar el texto**; tú escribes lo que oíste. Velocidades: 0.55× · Suave 0.8× · Normal 1.0× · Nativo 1.15×.
- **Charla** — conversación con IA (Gemini). Eliges escenario, el personaje responde en inglés muy simple con traducción, te corrige solo ante errores reales y te sugiere 3 respuestas para que nunca te quedes trabado.
- **Familia** — creas un grupo o te unes con un código de 6 letras. Marcador con frases dominadas y racha de cada miembro. **Nunca** se comparten grabaciones ni transcripciones.

### El motor de repetición espaciada (sin IA, gratis, offline)

Leitner de 5 cajas. Tras cada intento:

| Puntaje | Efecto |
|---|---|
| ≥ 80 % | sube una caja |
| 50–79 % | se queda en la caja; vuelve mañana |
| < 50 % | regresa a la caja 1 |

Intervalos por caja: **1** → mismo día · **2** → 1 día · **3** → 3 días · **4** → 7 días · **5** → 16 días. "Dominada" = caja 4 o 5.

La comparación usa **subsecuencia común más larga (LCS)**, no strings exactos, con normalización previa: expande contracciones (`I'm`↔`I am`, `what's`↔`what is`…), unifica variantes (`Wi-Fi`/`wifi`, `check-out`/`checkout`…), quita puntuación y mayúsculas.

### Detección de puntos débiles (para hispanohablantes)

Acumula las palabras falladas y las clasifica contra los sonidos difíciles del español (la *th*, *v* vs *b*, *s+consonante*, *h* aspirada, *sh/ch*, *i* corta, consonante final, *w*). Cuando un patrón aparece en 3+ palabras, lo muestra como tu punto débil con un botón que arma una sesión solo con esas palabras.

---

## Estructura del proyecto

```
index.html            La app entera (UI + estilos "consola de audio")
js/
  content.js          46 frases en 6 escenarios (en, es, pronunciación, tags)
  normalize.js        Normalización de texto (contracciones, variantes)
  lcs.js              Puntaje por subsecuencia común más larga
  leitner.js          Motor de repetición espaciada + armado de sesión
  weakspots.js        Detección de puntos débiles
  audio.js            Voz (Web Speech) + medidor VU (Web Audio)
  store.js            Firebase Auth + Firestore (offline) + familias
  firebaseConfig.js   Config pública del proyecto + fecha del viaje
functions/api/chat.js Proxy a Gemini (Cloudflare Pages Function)
firestore.rules       Reglas de seguridad de Firestore
manifest.json, sw.js  PWA
scripts/gen-icons.mjs Genera icon-192.png / icon-512.png
tests/run.mjs         Pruebas de LCS y Leitner
```

---

## Qué te falta a ti (una sola vez)

### 1. Cloudflare Pages — desplegar

1. Entra a **Cloudflare → Workers & Pages → Create → Pages → Connect to Git** y elige el repo `soundcheck`.
2. **Build settings:** framework preset **None**. *Build command* vacío. *Build output directory* `/` (la raíz). No hay build step.
3. Cloudflare detecta la carpeta `functions/` sola y publica `/api/chat`.
4. En **Settings → Environment variables** agrega:
   - `GEMINI_API_KEY` = tu llave de Google AI Studio (**márcala como Secret / Encrypt**).
   - `MODEL` = opcional. Por defecto `gemini-2.5-flash-lite` (tier gratis). Si Google cambia los nombres, revisa <https://ai.google.dev/gemini-api/docs/pricing> y pon aquí un modelo **Flash** o **Flash-Lite** vigente — sin tocar código.
5. Guarda y **Redeploy**. Tu app queda en `https://soundcheck-xxxx.pages.dev`.

La llave de Gemini **solo** vive en Cloudflare; nunca se envía al navegador.

### 2. Firebase — autorizar el dominio

Para que el login con Google funcione en tu dominio de Pages:

1. **Firebase Console → Authentication → Sign-in method →** habilita **Google**.
2. **Authentication → Settings → Authorized domains → Add domain** y agrega tu dominio de Cloudflare (ej. `soundcheck-xxxx.pages.dev`, y tu dominio propio si usas uno).

Si ves el error *"Falta autorizar este dominio…"* al entrar, es exactamente este paso.

### 3. Firestore — crear la base y publicar las reglas

1. **Firebase Console → Firestore Database → Create database** (modo *production*).
2. Publica las reglas de `firestore.rules`:
   - **Rápido:** pega el contenido en **Firestore → Rules → Publish**.
   - **Con CLI:** `npm i -g firebase-tools`, `firebase login`, `firebase use soundcheck-familia`, y `firebase deploy --only firestore:rules`.

Las reglas garantizan que cada quien lee/escribe solo lo suyo, que **nadie lee los intentos (transcripciones) de otro**, y que el marcador familiar solo comparte agregados.

---

## Cómo la usa la familia

1. Cada miembro entra con su propia cuenta de Google (progreso independiente).
2. Uno crea el grupo en **Familia → Crear un grupo** y comparte el **código de 6 letras**.
3. Los demás entran a **Familia → Unirme** y escriben el código. Listo: aparecen todos en el marcador.

---

## Cómo agregar o cambiar frases

Edita `js/content.js`. Cada frase es un objeto:

```js
{ id: 'air-11', scen: 'airport',
  en: 'Do you have a pen?',            // inglés real de viajero
  es: '¿Tiene un bolígrafo?',          // español
  ph: 'du yu jav a pen',               // pronunciación como suena en español,
                                       // sílaba tónica en MAYÚSCULAS
  tags: ['h', 'vb', 'final'] }         // patrones fonéticos que contiene
```

`id` debe ser único. Los `tags` alimentan la detección de puntos débiles (claves válidas: `th`, `vb`, `scluster`, `h`, `shch`, `ivowel`, `final`, `w`). No hace falta nada más: el motor toma las frases nuevas automáticamente.

---

## Qué es gratis y qué tiene límite

| Pieza | Límite |
|---|---|
| Hosting (Cloudflare Pages) | Gratis, sin límite práctico. |
| Voz (escuchar y grabarse) | **Ilimitada** — es del navegador (Web Speech API). |
| Repetición espaciada, Kit, Oído | **Ilimitados y offline** — no usan servidor. |
| Firebase Auth + Firestore | Tier gratis Spark: sobrado para una familia. |
| **Charla (Gemini)** | Tier gratis: ~1 000 mensajes/día con `gemini-2.5-flash-lite` (15/min). Al agotarse, la app avisa y **Kit y Oído siguen funcionando siempre**. |

> **Compatibilidad de voz:** SpeechRecognition (grabarse) funciona en Chrome/Edge/Android y en Safari iOS reciente. Donde no exista, cada pantalla tiene un cuadro de texto de respaldo con el mismo botón de revisar, así que la app **siempre** es usable.

---

## Desarrollo local

```bash
npm test                    # pruebas de LCS y Leitner (15 casos)
node scripts/gen-icons.mjs  # regenera los iconos PNG
npx wrangler pages dev .    # servidor local con las Functions (necesita GEMINI_API_KEY)
```

Sin Wrangler puedes servir los estáticos con cualquier servidor (`python3 -m http.server`), pero **Charla** necesita `/api/chat`, que solo existe con Pages Functions.

### Si la app no carga (404 de Firebase)

El SDK de Firebase se sirve por CDN con una versión fija en `js/store.js` (`const FB = '11.6.1'`). Si algún día esa versión desaparece del CDN, cambia ese número por una versión vigente de <https://firebase.google.com/support/release-notes/js> y vuelve a desplegar.

---

## Nota de seguridad

- La **apiKey de Firebase** en `firebaseConfig.js` **no es un secreto** — identifica al proyecto; el acceso se controla con las reglas de Firestore y los dominios autorizados.
- La **única llave secreta** es `GEMINI_API_KEY`, que vive solo en Cloudflare. `.gitignore` bloquea `.env`, `.dev.vars` y llaves para que nunca lleguen al repo.
- Todo el HTML dinámico (transcripciones, respuestas de IA, nombres de otros usuarios) se escapa antes de entrar al DOM.
