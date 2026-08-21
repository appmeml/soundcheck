// Genera icon-192.png e icon-512.png a partir del diseño de icon.svg.
// No hay rasterizador de SVG disponible, así que dibujamos el mismo diseño
// (medidor VU sobre panel de rack) pixel a pixel y codificamos PNG con zlib.
// Correr con:  node scripts/gen-icons.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const C = {
  console: [0x14, 0x16, 0x1b],
  panel:   [0x1c, 0x20, 0x28],
  edge:    [0x2e, 0x35, 0x42],
  amber:   [0xf5, 0xb3, 0x42],
  rec:     [0xe8, 0x56, 0x4a],
  ok:      [0x7f, 0xd1, 0xae],
};

// Barras del ecualizador en coordenadas normalizadas (base 512), con el nivel
// donde cambia de color: verde -> ámbar -> rojo.
const BARS = [
  { x: 104, top: 288, amber: null, rec: null },
  { x: 168, top: 216, amber: 286, rec: null },
  { x: 232, top: 128, amber: 278, rec: 184 },
  { x: 296, top: 248, amber: 292, rec: null },
  { x: 360, top: 184, amber: 280, rec: null },
];
const BAR_W = 48;
const BAR_BOTTOM = 400;
const BAR_R = 8;

function makeIcon(size) {
  const s = size / 512;
  const buf = Buffer.alloc(size * size * 4);

  const setPx = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  };

  // Rectángulo con esquinas redondeadas.
  const roundRect = (x0, y0, w, h, rad, color) => {
    const x1 = x0 + w, y1 = y0 + h;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
        let inside = true;
        const cornerX = x < x0 + rad ? x0 + rad : (x > x1 - rad ? x1 - rad : x);
        const cornerY = y < y0 + rad ? y0 + rad : (y > y1 - rad ? y1 - rad : y);
        const dx = x - cornerX, dy = y - cornerY;
        if ((x < x0 + rad || x > x1 - rad) && (y < y0 + rad || y > y1 - rad)) {
          inside = dx * dx + dy * dy <= rad * rad;
        }
        if (inside) setPx(x, y, color);
      }
    }
  };

  // Fondo (negro de rack) con esquinas redondeadas grandes.
  roundRect(0, 0, size, size, 96 * s, C.console);
  // Panel interior.
  roundRect(56 * s, 56 * s, 400 * s, 400 * s, 40 * s, C.panel);
  // Borde del panel (marco fino).
  const bx = 56 * s, by = 56 * s, bw = 400 * s, bh = 400 * s, br = 40 * s;
  // dibujamos borde pintando panel más grande en edge y panel encima
  roundRect(bx - 2 * s, by - 2 * s, bw + 4 * s, bh + 4 * s, br, C.edge);
  roundRect(bx, by, bw, bh, br, C.panel);

  // Barras del VU.
  for (const bar of BARS) {
    const x = bar.x * s;
    const w = BAR_W * s;
    const top = bar.top * s;
    const bottom = BAR_BOTTOM * s;
    const rad = BAR_R * s;
    // verde (toda la barra)
    roundRect(x, top, w, bottom - top, rad, C.ok);
    // ámbar (parte superior)
    if (bar.amber != null) roundRect(x, top, w, bar.amber * s - top, rad, C.amber);
    // rojo (lo más alto)
    if (bar.rec != null) roundRect(x, top, w, bar.rec * s - top, rad, C.rec);
  }

  return buf;
}

// -------- Codificador PNG mínimo --------
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Filtro 0 por fila.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const rgba = makeIcon(size);
  const png = encodePNG(rgba, size);
  const out = new URL(`../icon-${size}.png`, import.meta.url);
  writeFileSync(out, png);
  console.log(`icon-${size}.png  (${png.length} bytes)`);
}
