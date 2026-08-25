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
    melody: { bpm: 100, notes: [['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2],['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2]] },
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
    melody: { bpm: 110, notes: [['C4',1],['C4',1],['C4',1],['D4',1],['E4',1],['E4',1],['D4',1],['E4',1],['F4',1],['G4',2]] },
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
    melody: { bpm: 120, notes: [['C4',1],['F4',1],['F4',1],['F4',1],['F4',1],['F4',1],['A4',1],['G4',1],['F4',2]] },
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
    melody: { bpm: 104, notes: [['G4',1],['G4',1],['E4',1],['E4',1],['C4',1],['C4',1],['G3',2],['A4',1],['A4',1],['F4',1],['F4',1],['C4',2]] },
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
    melody: { bpm: 112, notes: [['C4',1],['E4',1],['G4',1],['G4',1],['A4',1],['G4',2],['F4',1],['E4',1],['D4',2]] },
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
    melody: { bpm: 100, notes: [['E4',1],['E4',1],['F4',1],['G4',2],['G4',1],['F4',1],['E4',1],['D4',1],['C4',2]] },
    lines: [
      { en: 'Step by step, I find my way,', es: 'Paso a paso, encuentro mi camino,', ph: 'step bai step, ai faind mai UÉI' },
      { en: 'Speaking louder every day.', es: 'Hablando más fuerte cada día.', ph: 'SPÍ-king LÁU-der É-vri déi' },
      { en: 'I’m not perfect, that’s okay,', es: 'No soy perfecto, está bien,', ph: 'aim not PÉR-fekt, dats o-KÉI' },
      { en: 'I just keep on trying anyway.', es: 'Solo sigo intentando de todos modos.', ph: 'ai chast kip on TRÁI-ing É-ni-uei' },
    ],
  },
  {
    id: 'oldmacdonald', title: 'Old MacDonald Had a Farm', level: 'A1',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 112, notes: [['G4',1],['G4',1],['G4',1],['D4',1],['E4',1],['E4',1],['D4',2],['B4',1],['B4',1],['A4',1],['A4',1],['G4',2]] },
    lines: [
      { en: 'Old MacDonald had a farm,', es: 'El viejo MacDonald tenía una granja,', ph: 'óuld mak-DÓ-nald jad a farm' },
      { en: 'E-I-E-I-O!', es: '¡I-A-I-A-O!', ph: 'i ai i ai óu' },
      { en: 'And on his farm he had a cow,', es: 'Y en su granja tenía una vaca,', ph: 'and on jis farm ji jad a káu' },
      { en: 'With a moo-moo here and a moo-moo there.', es: 'Con un mu-mu aquí y un mu-mu allá.', ph: 'uíz a mu-mu jíar and a mu-mu déar' },
    ],
  },
  {
    id: 'baabaa', title: 'Baa, Baa, Black Sheep', level: 'A1',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 104, notes: [['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['B4',1],['C5',1],['A4',1],['G4',2]] },
    lines: [
      { en: 'Baa, baa, black sheep, have you any wool?', es: 'Bee, bee, oveja negra, ¿tienes lana?', ph: 'ba ba blak shíp, jav yu É-ni wul' },
      { en: 'Yes sir, yes sir, three bags full.', es: 'Sí señor, sí señor, tres bolsas llenas.', ph: 'yes ser, yes ser, zri bags ful' },
      { en: 'One for the master, one for the dame,', es: 'Una para el amo, una para la dama,', ph: 'uán for de MÁS-ter, uán for de deim' },
      { en: 'And one for the little boy who lives down the lane.', es: 'Y una para el niño que vive al final del camino.', ph: 'and uán for de LÍ-tel boi ju livs daun de lein' },
    ],
  },
  {
    id: 'bingo', title: 'BINGO', level: 'A1',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 120, notes: [['G4',1],['G4',1],['C5',1],['C5',1],['D5',1],['D5',1],['E5',2],['E5',1],['C5',1],['C5',1],['D5',1],['E5',2]] },
    lines: [
      { en: 'There was a farmer had a dog,', es: 'Había un granjero que tenía un perro,', ph: 'der uós a FÁR-mer jad a dog' },
      { en: 'And Bingo was his name-o.', es: 'Y Bingo era su nombre.', ph: 'and BÍN-gou uós jis NÉIM-o' },
      { en: 'B-I-N-G-O!', es: '¡B-I-N-G-O!', ph: 'bi ai en yi óu' },
    ],
  },
  {
    id: 'marylamb', title: 'Mary Had a Little Lamb', level: 'A1',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 110, notes: [['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['E4',1],['E4',2],['D4',1],['D4',1],['D4',2],['E4',1],['G4',1],['G4',2]] },
    lines: [
      { en: 'Mary had a little lamb,', es: 'María tenía un corderito,', ph: 'MÉ-ri jad a LÍ-tel lamb' },
      { en: 'Its fleece was white as snow.', es: 'Su lana era blanca como la nieve.', ph: 'its flis uós juáit as snóu' },
      { en: 'And everywhere that Mary went,', es: 'Y a todas partes donde María iba,', ph: 'and ÉV-ri-uer dat MÉ-ri uént' },
      { en: 'The lamb was sure to go.', es: 'El corderito seguro iba.', ph: 'de lamb uós shur tu góu' },
    ],
  },
  {
    id: 'itsyspider', title: 'The Itsy Bitsy Spider', level: 'A1',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 120, notes: [['G4',1],['C5',1],['C5',1],['C5',1],['D5',1],['E5',1],['E5',1],['D5',1],['C5',1],['D5',1],['E5',1],['C5',2]] },
    lines: [
      { en: 'The itsy bitsy spider climbed up the water spout.', es: 'La arañita subió por el caño.', ph: 'de ÍT-si BÍT-si SPÁI-der klaimd op de UÓ-ter spaut' },
      { en: 'Down came the rain and washed the spider out.', es: 'Bajó la lluvia y arrastró a la araña.', ph: 'daun keim de rein and uósht de SPÁI-der aut' },
      { en: 'Out came the sun and dried up all the rain.', es: 'Salió el sol y secó toda la lluvia.', ph: 'aut keim de san and draid op ol de rein' },
      { en: 'And the itsy bitsy spider climbed up again.', es: 'Y la arañita subió otra vez.', ph: 'and de ÍT-si BÍT-si SPÁI-der klaimd op a-GUÉN' },
    ],
  },
  {
    id: 'areyousleeping', title: 'Are You Sleeping? (Brother John)', level: 'A1',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 120, notes: [['C4',1],['D4',1],['E4',1],['C4',1],['C4',1],['D4',1],['E4',1],['C4',1],['E4',1],['F4',1],['G4',2],['E4',1],['F4',1],['G4',2]] },
    lines: [
      { en: 'Are you sleeping, are you sleeping?', es: '¿Estás durmiendo, estás durmiendo?', ph: 'ar yu SLÍ-ping, ar yu SLÍ-ping' },
      { en: 'Brother John, Brother John?', es: '¿Hermano Juan, hermano Juan?', ph: 'BRÁ-der chon, BRÁ-der chon' },
      { en: 'Morning bells are ringing!', es: '¡Las campanas de la mañana suenan!', ph: 'MÓR-ning bels ar RÍN-ging' },
      { en: 'Ding, dang, dong.', es: 'Din, dan, don.', ph: 'ding dang dong' },
    ],
  },
  {
    id: 'thisoldman', title: 'This Old Man', level: 'A1',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 118, notes: [['G4',1],['E4',1],['G4',2],['G4',1],['E4',1],['G4',2],['A4',1],['G4',1],['F4',1],['E4',1],['D4',2]] },
    lines: [
      { en: 'This old man, he played one,', es: 'Este viejito, tocó el uno,', ph: 'dis óuld man, ji pleid uán' },
      { en: 'He played knick-knack on my thumb.', es: 'Tocó tris-tras en mi pulgar.', ph: 'ji pleid nik-nak on mai zamb' },
      { en: 'With a knick-knack paddy whack, give a dog a bone,', es: 'Con un tris-tras, dale un hueso al perro,', ph: 'uíz a nik-nak PÁ-di uak, guiv a dog a bóun' },
      { en: 'This old man came rolling home.', es: 'Este viejito volvió rodando a casa.', ph: 'dis óuld man keim RÓU-ling jóum' },
    ],
  },
  {
    id: 'cominground', title: "She'll Be Coming 'Round the Mountain", level: 'A2',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 120, notes: [['C4',1],['C4',1],['C4',1],['E4',1],['G4',2],['G4',1],['E4',1],['G4',1],['E4',1],['C4',2]] },
    lines: [
      { en: "She'll be coming 'round the mountain when she comes.", es: 'Ella vendrá por la montaña cuando venga.', ph: 'shil bi KÁ-ming raund de MÁUN-ten uén shi kams' },
      { en: 'We will all go out to meet her when she comes.', es: 'Todos saldremos a recibirla cuando venga.', ph: 'ui uil ol góu aut tu mit jer uén shi kams' },
      { en: "And we'll all be glad to see her when she comes.", es: 'Y todos estaremos felices de verla cuando venga.', ph: 'and uil ol bi glad tu si jer uén shi kams' },
    ],
  },
  {
    id: 'mybonnie', title: 'My Bonnie Lies Over the Ocean', level: 'A2',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 108, notes: [['G4',1],['C5',2],['E5',1],['D5',1],['C5',1],['D5',2],['E5',1],['C5',3]] },
    lines: [
      { en: 'My Bonnie lies over the ocean,', es: 'Mi Bonnie está sobre el océano,', ph: 'mai BÓ-ni lais ÓU-ver de ÓU-shan' },
      { en: 'My Bonnie lies over the sea.', es: 'Mi Bonnie está sobre el mar.', ph: 'mai BÓ-ni lais ÓU-ver de si' },
      { en: 'Bring back, bring back,', es: 'Trae de vuelta, trae de vuelta,', ph: 'bring bak, bring bak' },
      { en: 'Bring back my Bonnie to me.', es: 'Tráeme de vuelta a mi Bonnie.', ph: 'bring bak mai BÓ-ni tu mi' },
    ],
  },
  {
    id: 'saints', title: 'When the Saints Go Marching In', level: 'A2',
    origin: 'Tradicional (dominio público)',
    melody: { bpm: 110, notes: [['C4',1],['E4',1],['F4',1],['G4',3],['C4',1],['E4',1],['F4',1],['G4',3],['C4',1],['E4',1],['F4',1],['G4',2],['E4',1],['C4',1],['E4',1],['D4',3]] },
    lines: [
      { en: 'Oh, when the saints go marching in,', es: 'Oh, cuando los santos marchen,', ph: 'ou, uén de seints góu MÁR-ching in' },
      { en: 'Oh, when the saints go marching in,', es: 'Oh, cuando los santos marchen,', ph: 'ou, uén de seints góu MÁR-ching in' },
      { en: 'Oh, how I want to be in that number,', es: 'Oh, cómo quiero estar en ese grupo,', ph: 'ou, jáu ai uánt tu bi in dat NÁM-ber' },
      { en: 'When the saints go marching in.', es: 'Cuando los santos marchen.', ph: 'uén de seints góu MÁR-ching in' },
    ],
  },
  {
    id: 'amazinggrace', title: 'Amazing Grace', level: 'B1',
    origin: 'Tradicional (dominio público, 1779)',
    melody: { bpm: 90, notes: [['G4',1],['C5',2],['E5',1],['C5',1],['E5',2],['D5',1],['C5',2],['A4',1],['G4',3]] },
    lines: [
      { en: 'Amazing grace, how sweet the sound,', es: 'Sublime gracia, qué dulce el sonido,', ph: 'a-MÉI-sing greis, jáu suít de saund' },
      { en: 'That saved a wretch like me.', es: 'Que salvó a un desdichado como yo.', ph: 'dat seivd a rech laik mi' },
      { en: 'I once was lost, but now am found,', es: 'Una vez estuve perdido, mas hoy me hallo,', ph: 'ai uáns uós lost, bat náu am faund' },
      { en: 'Was blind, but now I see.', es: 'Estaba ciego, mas hoy veo.', ph: 'uós blaind, bat náu ai si' },
    ],
  },
  {
    id: 'homerange', title: 'Home on the Range', level: 'B1',
    origin: 'Tradicional (dominio público, 1873)',
    melody: { bpm: 100, notes: [['G4',1],['C5',2],['C5',1],['E5',1],['D5',1],['C5',2],['A4',1],['G4',3]] },
    lines: [
      { en: 'Oh, give me a home where the buffalo roam,', es: 'Oh, dame un hogar donde el búfalo vague,', ph: 'ou, guiv mi a jóum uér de BÁ-fa-lou róum' },
      { en: 'Where the deer and the antelope play.', es: 'Donde el venado y el antílope juegan.', ph: 'uér de díar and de ÁN-te-loup plei' },
      { en: 'Where seldom is heard a discouraging word,', es: 'Donde rara vez se oye una palabra desalentadora,', ph: 'uér SÉL-dom is jerd a dis-KÁ-ri-ching uerd' },
      { en: 'And the skies are not cloudy all day.', es: 'Y los cielos no están nublados todo el día.', ph: 'and de skais ar not KLÁU-di ol déi' },
    ],
  },
  {
    id: 'auldlang', title: 'Auld Lang Syne', level: 'B1',
    origin: 'Tradicional (dominio público, 1788)',
    melody: { bpm: 92, notes: [['C4',1],['F4',2],['F4',1],['F4',1],['A4',2],['G4',1],['F4',2],['G4',1],['A4',3]] },
    lines: [
      { en: 'Should old acquaintance be forgot,', es: '¿Deberían olvidarse las viejas amistades,', ph: 'shud óuld a-KUÉIN-tans bi for-GÓT' },
      { en: 'And never brought to mind?', es: 'y nunca recordarse?', ph: 'and NÉ-ver brot tu maind' },
      { en: "We'll take a cup of kindness yet,", es: 'Brindaremos por la bondad,', ph: 'uil teik a kap of KÁIND-nes yet' },
      { en: 'For auld lang syne.', es: 'por los viejos tiempos.', ph: 'for old lang sain' },
    ],
  },
  {
    id: 'findmyvoice', title: 'Find My Voice (original)', level: 'B1',
    origin: 'Original de Soundcheck',
    melody: { bpm: 108, notes: [['G4',1],['A4',1],['G4',1],['E4',1],['C4',1],['D4',1],['E4',2],['E4',1],['D4',1],['C4',1],['D4',1],['G4',2]] },
    lines: [
      { en: 'Word by word, I say what I mean,', es: 'Palabra por palabra, digo lo que quiero,', ph: 'uerd bai uerd, ai sei uát ai min' },
      { en: "Building dreams I've never seen.", es: 'Construyendo sueños que nunca vi.', ph: 'BÍL-ding drims aiv NÉ-ver sin' },
      { en: 'Every mistake just makes me strong,', es: 'Cada error solo me hace fuerte,', ph: 'ÉV-ri mis-TÉIK chast meiks mi strong' },
      { en: 'This is where I belong.', es: 'Aquí es donde pertenezco.', ph: 'dis is uér ai bi-LÓNG' },
    ],
  },
  {
    id: 'worldiswide', title: 'The World Is Wide (original)', level: 'B2',
    origin: 'Original de Soundcheck',
    melody: { bpm: 104, notes: [['C4',1],['D4',1],['E4',1],['G4',2],['E4',1],['D4',1],['C4',2],['E4',1],['G4',1],['A4',1],['G4',2]] },
    lines: [
      { en: 'The world is wide and full of doors,', es: 'El mundo es amplio y lleno de puertas,', ph: 'de uerld is uaid and ful of dors' },
      { en: 'Each new word can open more.', es: 'Cada palabra nueva puede abrir más.', ph: 'ich nyu uerd kan ÓU-pen mor' },
      { en: 'So I speak up, I take my chance,', es: 'Así que hablo, tomo mi oportunidad,', ph: 'so ai spik op, ai teik mai chans' },
      { en: 'And I join the dance.', es: 'Y me uno al baile.', ph: 'and ai chóin de dans' },
    ],
  },
];

export function songById(id) {
  return SONGS.find((s) => s.id === id) || null;
}
