// generate-icons.js — Generate PWA icons for Shadows Over Camelot
// Run: node generate-icons.js
// Produces icon-192.png and icon-512.png with a medieval shield + sword design

const zlib = require('zlib');
const fs   = require('fs');

function createPNG(size) {
  const bg     = [0x1A, 0x1A, 0x2E]; // dark midnight blue
  const gold   = [0xD4, 0xA8, 0x43]; // gold
  const red    = [0x8B, 0x1A, 0x1A]; // dark red
  const white  = [0xF5, 0xF0, 0xE1]; // parchment

  // Create pixel data
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const cx = size / 2, cy = size / 2;
  const shieldR = size * 0.38;

  for (let y = 0; y < size; y++) {
    const rowOff = y * (size * 4 + 1);
    raw[rowOff] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      const px = rowOff + 1 + x * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default: background
      let r = bg[0], g = bg[1], b = bg[2], a = 255;

      // Shield shape: pointed bottom oval
      const shieldTop = cy - shieldR * 0.85;
      const shieldBot = cy + shieldR * 1.1;
      if (y >= shieldTop && y <= shieldBot) {
        const t = (y - shieldTop) / (shieldBot - shieldTop);
        const halfW = shieldR * (t < 0.6 ? 0.85 : 0.85 * (1 - (t - 0.6) / 0.4));
        if (Math.abs(dx) <= halfW) {
          // Shield body (dark red)
          r = red[0]; g = red[1]; b = red[2];

          // Gold border (outer 8% of shield width)
          if (Math.abs(dx) >= halfW * 0.88 || t < 0.04 || t > 0.96) {
            r = gold[0]; g = gold[1]; b = gold[2];
          }
          // Sword blade (vertical center stripe)
          else if (Math.abs(dx) <= size * 0.02 && t > 0.15 && t < 0.75) {
            r = white[0]; g = white[1]; b = white[2];
          }
          // Crossguard (horizontal bar)
          else if (t > 0.52 && t < 0.58 && Math.abs(dx) <= shieldR * 0.35) {
            r = gold[0]; g = gold[1]; b = gold[2];
          }
          // Pommel (small circle at bottom of handle)
          else if (t > 0.78 && t < 0.85 && Math.abs(dx) <= size * 0.03) {
            r = gold[0]; g = gold[1]; b = gold[2];
          }
        }
      }

      raw[px]     = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  // Build PNG
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type);
    const body = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  }

  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    }
    return ~c;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  // IDAT
  const deflated = zlib.deflateSync(raw, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflated), chunk('IEND', iend)]);
}

fs.writeFileSync('icon-192.png', createPNG(192));
fs.writeFileSync('icon-512.png', createPNG(512));
console.log('Generated icon-192.png and icon-512.png');
