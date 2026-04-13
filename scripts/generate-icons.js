/**
 * generate-icons.js
 * Generates PWA icons as PNGs using pure Node.js (no dependencies).
 * Creates a dark-themed icon with "JR" monogram.
 * Run: node scripts/generate-icons.js
 */
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size) {
  // Colors
  const BG_R = 0x0d, BG_G = 0x0f, BG_B = 0x14;       // #0d0f14
  const FG_R = 0x4a, FG_G = 0x7c, FG_B = 0xf7;       // #4a7cf7 (accent blue)
  const GRAD_R = 0xa8, GRAD_G = 0x55, GRAD_B = 0xf7; // #a855f7 (purple)

  const width  = size;
  const height = size;

  // Raw pixel data: RGBA
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const cx = width / 2, cy = height / 2;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const radius = size * 0.42;

      // Rounded rect mask (approximate circle for simplicity)
      const inCircle = dist <= radius;

      if (inCircle) {
        // Gradient: blue to purple diagonally
        const t = (x / width + y / height) / 2;
        const r = Math.round(FG_R + t * (GRAD_R - FG_R));
        const g = Math.round(FG_G + t * (GRAD_G - FG_G));
        const b = Math.round(FG_B + t * (GRAD_B - FG_B));

        // Draw "JR" letters
        const nx = x / size; // normalized [0,1]
        const ny = y / size;
        const inLetter = drawJR(nx, ny);

        if (inLetter) {
          pixels[idx]   = 0xff;
          pixels[idx+1] = 0xff;
          pixels[idx+2] = 0xff;
          pixels[idx+3] = 0xff;
        } else {
          pixels[idx]   = r;
          pixels[idx+1] = g;
          pixels[idx+2] = b;
          pixels[idx+3] = 0xff;
        }
      } else {
        // Background
        pixels[idx]   = BG_R;
        pixels[idx+1] = BG_G;
        pixels[idx+2] = BG_B;
        pixels[idx+3] = 0xff;
      }
    }
  }

  // Build PNG binary
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8]  = 8;  // bit depth
  ihdrData[9]  = 2;  // color type: RGB (no alpha for simplicity)
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace

  // Build scanlines (filter byte 0 = None + RGB data)
  const scanlines = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    scanlines[row] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = row + 1 + x * 3;
      scanlines[dst]   = pixels[src];
      scanlines[dst+1] = pixels[src+1];
      scanlines[dst+2] = pixels[src+2];
    }
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB  = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([typeB, data]);
    const crc    = crc32(crcBuf);
    const crcOut = Buffer.alloc(4);
    crcOut.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeB, data, crcOut]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw "JR" pixel-art monogram in normalized coords [0,1]
function drawJR(nx, ny) {
  const thick = 0.06;

  // "J" — left half of icon (0.15..0.42 x, 0.2..0.8 y)
  const jx1 = 0.15, jx2 = 0.42;
  const jy1 = 0.2,  jy2 = 0.8;

  // J: vertical bar on right side of J
  const jBar = nx >= jx2 - thick && nx <= jx2 && ny >= jy1 && ny <= jy2;
  // J: bottom curve (horizontal bar)
  const jBot = nx >= jx1 && nx <= jx2 && ny >= jy2 - thick && ny <= jy2;
  // J: bottom left curve (simplified as corner)
  const jCurve = nx >= jx1 && nx <= jx1 + thick*1.5 && ny >= jy2 - thick*2.5 && ny <= jy2;
  // J: top bar
  const jTop = nx >= jx1 && nx <= jx2 && ny >= jy1 && ny <= jy1 + thick;

  // "R" — right half of icon (0.55..0.85 x, 0.2..0.8 y)
  const rx1 = 0.55, rx2 = 0.85;
  const ry1 = 0.2,  ry2 = 0.8;
  const rMid = (ry1 + ry2) / 2;

  // R: vertical bar on left
  const rBar = nx >= rx1 && nx <= rx1 + thick && ny >= ry1 && ny <= ry2;
  // R: top horizontal
  const rTop = nx >= rx1 && nx <= rx2 && ny >= ry1 && ny <= ry1 + thick;
  // R: middle horizontal
  const rMidBar = nx >= rx1 && nx <= rx2 - thick && ny >= rMid - thick/2 && ny <= rMid + thick/2;
  // R: top right curve (right vertical of bump)
  const rBump = nx >= rx2 - thick && nx <= rx2 && ny >= ry1 && ny <= rMid;
  // R: diagonal leg
  const rLegT = ny - rMid;
  const rLegX = rx1 + thick + rLegT * ((rx2 - rx1 - thick) / (ry2 - rMid));
  const rLeg = ny >= rMid && ny <= ry2 &&
               nx >= rLegX - thick/2 && nx <= rLegX + thick/2;

  return jBar || jBot || jCurve || jTop ||
         rBar || rTop || rMidBar || rBump || rLeg;
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xFFFFFFFF) | 0;
}

// Generate icons
const outDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

[192, 512].forEach(size => {
  const png  = createPNG(size);
  const dest = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(dest, png);
  console.log(`Created: icons/icon-${size}.png (${png.length} bytes)`);
});

console.log('Icons generated successfully!');
