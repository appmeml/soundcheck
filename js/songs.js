// Canciones para aprender inglés cantando (traducción + pronunciación).
// IMPORTANTE (derechos de autor): NO usamos letras de canciones comerciales.
// Solo canciones tradicionales de DOMINIO PÚBLICO y canciones ORIGINALES
// escritas para Soundcheck. Así es 100% legal compartir.
//
// Cada línea: en (inglés), es (español), ph (pronunciación como suena en español).

export const SONGS = [
  {
    id: 'twinkle', title: 'Twinkle, Twinkle, Little Star', level: 'A1',
    origin: 'Tradicional (dominio público)',
    lines: [
      { en: 'Twinkle, twinkle, little star,', es: 'Brilla, brilla, estrellita,', ph: 'TUÍN-kel TUÍN-kel LÍ-tel star' },
      { en: 'How I wonder what you are.', es: 'Cómo me pregunto qué eres.', ph: 'jáu ai UÓN-der uát yu ar' },
      { en: 'Up above the world so high,', es: 'Allá arriba, sobre el mundo,', ph: 'op a-BÓV de uérld so jái' },
      { en: 'Like a diamond in the sky.', es: 'Como un diamante en el cielo.', ph: 'laik a DÁI-mond in de skái' },
    ],
  },
  {
    id: 'row', title: 'Row, Row, Row Your Boat', level: 'A1',
    origin: 'Tradicional (dominio público)',
    lines: [
      { en: 'Row, row, row your boat,', es: 'Rema, rema, rema tu bote,', ph: 'róu róu róu yor bóut' },
      { en: 'Gently down the stream.', es: 'Suavemente por el río.', ph: 'CHÉNT-li daun de strim' },
      { en: 'Merrily, merrily, merrily, merrily,', es: 'Alegremente, alegremente,', ph: 'MÉ-ri-li MÉ-ri-li' },
      { en: 'Life is but a dream.', es: 'La vida es solo un sueño.', ph: 'laif is bat a drim' },
    ],
  },
  {
    id: 'happy', title: 'If You’re Happy and You Know It', level: 'A1',
    origin: 'Tradicional (dominio público)',
    lines: [
      { en: 'If you’re happy and you know it, clap your hands.', es: 'Si estás feliz y lo sabes, aplaude.', ph: 'if yor JÁ-pi and yu nóu it, klap yor jands' },
      { en: 'If you’re happy and you know it, stomp your feet.', es: 'Si estás feliz y lo sabes, zapatea.', ph: 'if yor JÁ-pi and yu nóu it, stomp yor fit' },
      { en: 'If you’re happy and you know it, shout “Hooray!”', es: 'Si estás feliz y lo sabes, grita “¡Hurra!”', ph: 'if yor JÁ-pi and yu nóu it, shaut ju-RÉI' },
      { en: 'If you’re happy and you know it, do all three.', es: 'Si estás feliz y lo sabes, haz las tres.', ph: 'if yor JÁ-pi and yu nóu it, du ol zri' },
    ],
  },
  {
    id: 'head', title: 'Head, Shoulders, Knees and Toes', level: 'A1',
    origin: 'Tradicional (dominio público)',
    lines: [
      { en: 'Head, shoulders, knees and toes,', es: 'Cabeza, hombros, rodillas y dedos,', ph: 'jed, SHÓUL-ders, nis and tóus' },
      { en: 'Knees and toes.', es: 'Rodillas y dedos.', ph: 'nis and tóus' },
      { en: 'Eyes and ears and mouth and nose.', es: 'Ojos y orejas y boca y nariz.', ph: 'ais and irs and mauz and nóus' },
      { en: 'Head, shoulders, knees and toes.', es: 'Cabeza, hombros, rodillas y dedos.', ph: 'jed, SHÓUL-ders, nis and tóus' },
    ],
  },
  {
    id: 'firsttrip', title: 'My First Trip (original)', level: 'A2',
    origin: 'Original de Soundcheck',
    lines: [
      { en: 'I am flying far away,', es: 'Vuelo muy lejos,', ph: 'ai am FLÁI-ing far a-UÉI' },
      { en: 'To a bright and sunny place.', es: 'A un lugar brillante y soleado.', ph: 'tu a brait and SÁ-ni pleis' },
      { en: 'I will learn a little more,', es: 'Aprenderé un poco más,', ph: 'ai uil lern a LÍ-tel mor' },
      { en: 'With a smile upon my face.', es: 'Con una sonrisa en mi cara.', ph: 'uíz a smail a-PÓN mai feis' },
    ],
  },
  {
    id: 'stepbystep', title: 'Step by Step (original)', level: 'B1',
    origin: 'Original de Soundcheck',
    lines: [
      { en: 'Step by step, I find my way,', es: 'Paso a paso, encuentro mi camino,', ph: 'step bai step, ai faind mai UÉI' },
      { en: 'Speaking louder every day.', es: 'Hablando más fuerte cada día.', ph: 'SPÍ-king LÁU-der É-vri déi' },
      { en: 'I’m not perfect, that’s okay,', es: 'No soy perfecto, está bien,', ph: 'aim not PÉR-fekt, dats o-KÉI' },
      { en: 'I just keep on trying anyway.', es: 'Solo sigo intentando de todos modos.', ph: 'ai chast kip on TRÁI-ing É-ni-uei' },
    ],
  },
];

export function songById(id) {
  return SONGS.find((s) => s.id === id) || null;
}
