# Cómo evoluciona Soundcheck 🎚️

La meta inmediata es el viaje (6 de septiembre de 2026), pero Soundcheck está hecho para que sigas mejorando tu *speaking* y tu oído **por años**, con temas nuevos. Este documento explica el plan y cómo crece la app sin costo.

## Por qué ya sirve a largo plazo

- **La repetición espaciada no “se acaba”.** El motor Leitner te sigue trayendo lo que estás por olvidar, para siempre. Mientras más frases agregues, más rica es tu práctica diaria.
- **Charla ya es infinita.** El tutor de IA improvisa; nunca se repite. Además de los temas de viaje, ya agregamos temas del **día a día** (conversación casual, trabajo y eventos, llamadas, conocer gente). Puedes hablar de lo que quieras.
- **La voz es gratis e ilimitada** en la práctica (Web Speech en Android/Chrome; en iPhone se transcribe con Gemini).

## El plan por fases

### Fase 1 — Listo para el viaje (AHORA)
- 46 frases esenciales en 6 escenarios de viaje.
- Kit (pronunciación), Oído (comprensión), Charla (conversación), Familia.
- Detección de tu punto débil (sonidos difíciles del español).

### Fase 2 — Después del viaje: inglés de la vida diaria
- **Nuevos “paquetes” de frases** por tema: trabajo y producción de eventos, tecnología, salud, banco, restaurante formal, entrevistas, viajes de negocios.
- **Niveles**: además de A1, ir sumando A2 y B1 (frases más largas, tiempos verbales).
- Charla con más personajes (jefe, cliente, colega, doctor).

### Fase 3 — Que la app trabaje por ti
- **Meta diaria y recordatorio** (notificación “practica 10 min”).
- **Historia de progreso**: gráfica de racha y de sonidos que ya dominaste.
- **Repaso del punto débil automático** dentro de la sesión diaria.
- **“Frase del día”** real (audio de nativos) para el oído.

### Fase 4 — Contenido vivo
- Generar frases nuevas con IA a partir de un tema que tú pidas (“quiero practicar para una reunión de trabajo el viernes”), revisadas antes de entrar al mazo.
- Importar tus propias frases (las que te cuestan en la vida real).

## Cómo se agregan temas nuevos (práctico)

Todo el contenido vive en `js/content.js`. Para que la app crezca:

**1. Agregar frases (Kit y Oído)** — añade objetos al arreglo `PHRASES`:
```js
{ id: 'work-01', scen: 'work',
  en: 'Can you send me the schedule?',
  es: '¿Me puedes enviar el itinerario?',
  ph: 'kan yu send mi de SKÉ-yul',
  tags: ['scluster', 'final'] }
```
El motor las toma solas: entran a la sesión diaria y a la repetición espaciada. No hay que tocar nada más.

**2. Agregar un tema de conversación (Charla)** — añade un escenario a `SCENARIOS`:
```js
{ id: 'doctor', group: 'daily',
  name: 'En el doctor',
  persona: 'You are a friendly doctor at a US clinic. Ask simple questions about symptoms.' }
```
Aparece de inmediato en Charla, con su propio avatar de color.

**3. Niveles** — cuando queramos A2/B1, añadimos un campo `level` a cada frase y un selector; el motor es el mismo.

## Ideas para pedirle a Claude (yo lo implemento)

Cuando quieras crecer la app, pídeme cosas como:
- “Agrega un paquete de 20 frases de inglés para reuniones de trabajo.”
- “Crea un escenario de Charla para pedir cita médica.”
- “Añade nivel A2 con frases más largas.”
- “Ponme una meta diaria con recordatorio.”
- “Hazme una gráfica de mi progreso de las últimas semanas.”

Cada mejora se prueba, se sube a GitHub y Cloudflare la publica sola. **Sigue siendo gratis**: mientras usemos los tiers gratuitos (Cloudflare, Firebase, Web Speech, y Gemini Flash-Lite para Charla), el costo mensual es cero.
