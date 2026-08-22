// Soundcheck — contenido de práctica.
// Cada frase: en (inglés real de viajero), es (español), ph (pronunciación como
// suena en español, sílaba tónica en MAYÚSCULAS), tags (patrones fonéticos
// difíciles para hispanohablantes que aparecen en la frase).
//
// Claves de tags (ver js/weakspots.js para la tabla completa):
//   th        -> /θ/ /ð/ (think, the)
//   vb        -> v vs b  (vacation, have)
//   scluster  -> s + consonante inicial (speak, stop)
//   h         -> h aspirada (here, hotel)
//   shch      -> sh vs ch (she, check)
//   ivowel    -> /ɪ/ vs /iː/ (this/these)
//   final     -> consonante final que se tiende a omitir (want, help)
//   w         -> sonido w (water, wait)

export const SCENARIOS = [
  // --- Para el viaje ---
  {
    id: 'airport', group: 'travel',
    name: 'Aeropuerto y migración',
    persona: 'You are a US immigration officer at Orlando airport. Be polite but brief and official.',
  },
  {
    id: 'hotel', group: 'travel',
    name: 'Hotel',
    persona: 'You are a friendly front desk agent at a SpringHill Suites hotel.',
  },
  {
    id: 'restaurant', group: 'travel',
    name: 'Restaurante',
    persona: 'You are a server at a casual American restaurant in Orlando.',
  },
  {
    id: 'parks', group: 'travel',
    name: 'Parques Disney',
    persona: 'You are a cheerful Disney World cast member helping a guest.',
  },
  {
    id: 'uber', group: 'travel',
    name: 'Uber y transporte',
    persona: 'You are an Uber driver picking up a passenger in Orlando.',
  },
  {
    id: 'shopping', group: 'travel',
    name: 'Compras y emergencias',
    persona: 'You are a store clerk at a shopping mall in Miami.',
  },

  // --- Día a día (para seguir mejorando el speaking a largo plazo) ---
  {
    id: 'smalltalk', group: 'daily',
    name: 'Conversación casual',
    persona: 'You are a friendly American neighbor making small talk. Chat about the weather, the weekend, food and hobbies. Ask easy follow-up questions.',
  },
  {
    id: 'work', group: 'daily',
    name: 'Trabajo y eventos',
    persona: 'You are a colleague at an international live-events production company. Talk shop about stage setup, sound check, schedules, crew and gear. Keep it practical.',
  },
  {
    id: 'phone', group: 'daily',
    name: 'Llamada telefónica',
    persona: 'You are a customer-support agent on a phone call. Speak clearly, confirm details, and help the caller solve a simple problem (a booking, a bill, an appointment).',
  },
  {
    id: 'meet', group: 'daily',
    name: 'Conocer gente',
    persona: 'You are someone the user just met at a social event. Be warm and curious: ask where they are from, what they do, and what they like.',
  },
];

export const PHRASES = [
  // 1. Aeropuerto y migración (10)
  { id: 'air-01', scen: 'airport', en: 'Here is my passport.',            es: 'Aquí está mi pasaporte.',        ph: 'JÍAR is mai PÁS-port',              tags: ['h', 'final'] },
  { id: 'air-02', scen: 'airport', en: "I'm here on vacation.",           es: 'Estoy aquí de vacaciones.',      ph: 'aim JÍAR on ve-KÉI-shon',           tags: ['vb', 'h'] },
  { id: 'air-03', scen: 'airport', en: 'For six days.',                   es: 'Por seis días.',                 ph: 'for siks déis',                     tags: ['ivowel', 'final'] },
  { id: 'air-04', scen: 'airport', en: "I'm staying in Orlando.",         es: 'Me quedo en Orlando.',           ph: 'aim STÉI-ing in or-LÁN-do',         tags: ['scluster', 'ivowel'] },
  { id: 'air-05', scen: 'airport', en: 'At a hotel in Winter Garden.',    es: 'En un hotel en Winter Garden.',  ph: 'at a jo-TÉL in UÍN-ter GÁR-den',    tags: ['h', 'w'] },
  { id: 'air-06', scen: 'airport', en: "I'm traveling with my family.",   es: 'Viajo con mi familia.',          ph: 'aim TRÁ-ve-ling uíz mai FÁ-mi-li',  tags: ['vb', 'th'] },
  { id: 'air-07', scen: 'airport', en: 'Can you repeat that, please?',    es: '¿Puede repetir eso, por favor?', ph: 'kan yu ri-PÍT dat plis',            tags: ['th', 'ivowel'] },
  { id: 'air-08', scen: 'airport', en: 'Can you speak slower?',           es: '¿Puede hablar más despacio?',    ph: 'kan yu spik SLÓU-er',               tags: ['scluster'] },
  { id: 'air-09', scen: 'airport', en: "Sorry, I don't understand.",      es: 'Perdón, no entiendo.',           ph: 'SÓ-rri ai dont an-der-STÁND',       tags: ['final', 'scluster'] },
  { id: 'air-10', scen: 'airport', en: 'Where is baggage claim?',         es: '¿Dónde recojo las maletas?',     ph: 'juér is BÁ-guech kléim',            tags: ['w'] },

  // 2. Hotel (8)
  { id: 'hot-01', scen: 'hotel', en: 'I have a reservation.',             es: 'Tengo una reservación.',         ph: 'ai jav a re-ser-VÉI-shon',          tags: ['h', 'vb'] },
  { id: 'hot-02', scen: 'hotel', en: "It's under the name Munoz.",        es: 'A nombre de Munoz.',             ph: 'its ÁN-der de neim mu-NÓS',         tags: ['th', 'final'] },
  { id: 'hot-03', scen: 'hotel', en: 'What time is check-out?',           es: '¿A qué hora es la salida?',      ph: 'juát taim is CHÉK-aut',             tags: ['w', 'shch'] },
  { id: 'hot-04', scen: 'hotel', en: 'Is breakfast included?',            es: '¿El desayuno está incluido?',    ph: 'is BRÉK-fast in-KLÚ-ded',           tags: ['final'] },
  { id: 'hot-05', scen: 'hotel', en: 'Can I get extra towels?',           es: '¿Me da toallas extra?',          ph: 'kan ai guet ÉKS-tra TÁU-els',       tags: ['final', 'w'] },
  { id: 'hot-06', scen: 'hotel', en: "The air conditioning isn't working.", es: 'El aire acondicionado no funciona.', ph: 'de er kon-DÍ-sho-ning ÍS-ent UÉR-king', tags: ['th', 'w'] },
  { id: 'hot-07', scen: 'hotel', en: "What's the Wi-Fi password?",        es: '¿Cuál es la clave del wifi?',    ph: 'juáts de UÁI-fai PÁS-uord',         tags: ['w', 'th'] },
  { id: 'hot-08', scen: 'hotel', en: 'Can you call me a taxi?',           es: '¿Me puede pedir un taxi?',       ph: 'kan yu kol mi a TÁK-si',            tags: ['ivowel'] },

  // 3. Restaurante (8)
  { id: 'res-01', scen: 'restaurant', en: 'A table for three, please.',   es: 'Una mesa para tres, por favor.', ph: 'a TÉI-bol for zri plis',            tags: ['th'] },
  { id: 'res-02', scen: 'restaurant', en: 'Can I see the menu?',          es: '¿Me trae el menú?',              ph: 'kan ai si de MÉN-yu',               tags: ['th'] },
  { id: 'res-03', scen: 'restaurant', en: "I'll have the chicken.",       es: 'Voy a pedir el pollo.',          ph: 'ail jav de CHÍ-ken',                tags: ['h', 'shch', 'th'] },
  { id: 'res-04', scen: 'restaurant', en: 'Water, no ice, please.',       es: 'Agua sin hielo, por favor.',     ph: 'UÓ-ter nou ais plis',               tags: ['w'] },
  { id: 'res-05', scen: 'restaurant', en: 'Is this spicy?',               es: '¿Esto es picante?',              ph: 'is dis SPÁI-si',                    tags: ['th', 'scluster', 'ivowel'] },
  { id: 'res-06', scen: 'restaurant', en: 'Can I get this to go?',        es: '¿Me lo puedo llevar?',           ph: 'kan ai guet dis tu gou',            tags: ['th'] },
  { id: 'res-07', scen: 'restaurant', en: 'Can I have the check, please?', es: 'La cuenta, por favor.',         ph: 'kan ai jav de chek plis',           tags: ['h', 'shch', 'th'] },
  { id: 'res-08', scen: 'restaurant', en: 'Thank you, it was delicious.', es: 'Gracias, estuvo delicioso.',     ph: 'zénk yu it uós de-LÍ-shos',         tags: ['th', 'w'] },

  // 4. Parques Disney (7)
  { id: 'par-01', scen: 'parks', en: 'How long is the wait?',             es: '¿Cuánto es la espera?',          ph: 'jáu long is de uéit',               tags: ['h', 'w', 'th'] },
  { id: 'par-02', scen: 'parks', en: 'Is this the line?',                 es: '¿Esta es la fila?',              ph: 'is dis de láin',                    tags: ['th', 'ivowel'] },
  { id: 'par-03', scen: 'parks', en: 'Where are the restrooms?',          es: '¿Dónde están los baños?',        ph: 'juér ar de RÉST-rums',              tags: ['w', 'th'] },
  { id: 'par-04', scen: 'parks', en: 'Can you take our photo?',           es: '¿Nos puede tomar una foto?',     ph: 'kan yu teik áur FÓU-tou',           tags: ['final'] },
  { id: 'par-05', scen: 'parks', en: 'What time is the parade?',          es: '¿A qué hora es el desfile?',     ph: 'juát taim is de pa-RÉID',           tags: ['w', 'th'] },
  { id: 'par-06', scen: 'parks', en: 'Where can I find a locker?',        es: '¿Dónde hay un casillero?',       ph: 'juér kan ai faind a LÓ-ker',        tags: ['w', 'final'] },
  { id: 'par-07', scen: 'parks', en: 'Where is the exit?',                es: '¿Dónde está la salida?',         ph: 'juér is de ÉK-sit',                 tags: ['w', 'th'] },

  // 5. Uber y transporte (6)
  { id: 'ubr-01', scen: 'uber', en: 'Are you John?',                      es: '¿Usted es John?',                ph: 'ar yu chon',                        tags: ['shch'] },
  { id: 'ubr-02', scen: 'uber', en: "I'm going to Winter Garden.",        es: 'Voy a Winter Garden.',           ph: 'aim GÓU-ing tu UÍN-ter GÁR-den',    tags: ['w'] },
  { id: 'ubr-03', scen: 'uber', en: 'Can you open the trunk?',            es: '¿Puede abrir el baúl?',          ph: 'kan yu ÓU-pen de tronk',            tags: ['th', 'final'] },
  { id: 'ubr-04', scen: 'uber', en: 'How long does it take?',            es: '¿Cuánto se demora?',             ph: 'jáu long dos it teik',              tags: ['h'] },
  { id: 'ubr-05', scen: 'uber', en: 'Can you turn on the AC?',            es: '¿Puede poner el aire?',          ph: 'kan yu tern on de ei-SÍ',           tags: ['th'] },
  { id: 'ubr-06', scen: 'uber', en: 'Stop here, please.',                 es: 'Pare aquí, por favor.',          ph: 'stop JÍAR plis',                    tags: ['scluster', 'h'] },

  // 6. Compras y emergencias (7)
  { id: 'shp-01', scen: 'shopping', en: 'How much is this?',              es: '¿Cuánto cuesta esto?',           ph: 'jáu moch is dis',                   tags: ['h', 'shch', 'th'] },
  { id: 'shp-02', scen: 'shopping', en: 'Do you take card?',              es: '¿Aceptan tarjeta?',              ph: 'du yu teik kard',                   tags: ['final'] },
  { id: 'shp-03', scen: 'shopping', en: 'Can I try this on?',             es: '¿Me lo puedo probar?',           ph: 'kan ai trai dis on',                tags: ['th'] },
  { id: 'shp-04', scen: 'shopping', en: 'Do you have a bigger size?',     es: '¿Tiene una talla más grande?',   ph: 'du yu jav a BÍ-guer sais',          tags: ['h', 'vb'] },
  { id: 'shp-05', scen: 'shopping', en: 'I need some help.',              es: 'Necesito ayuda.',                ph: 'ai nid som jelp',                   tags: ['h', 'final'] },
  { id: 'shp-06', scen: 'shopping', en: 'I lost my phone.',               es: 'Perdí mi teléfono.',             ph: 'ai lost mai foun',                  tags: ['final'] },
  { id: 'shp-07', scen: 'shopping', en: 'Where is the nearest pharmacy?', es: '¿Dónde está la farmacia más cercana?', ph: 'juér is de NÍ-rest FÁR-ma-si',  tags: ['w', 'th'] },
];

export function phraseById(id) {
  return PHRASES.find((p) => p.id === id) || null;
}

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || null;
}
