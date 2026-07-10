import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function insideRoundedRect(x, y, size, radius) {
  const left = radius;
  const right = size - radius;
  const top = radius;
  const bottom = size - radius;
  if (x >= left && x <= right) return true;
  if (y >= top && y <= bottom) return true;
  const cx = x < left ? left : right;
  const cy = y < top ? top : bottom;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSquared = abx * abx + aby * aby;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSquared));
  const dx = px - (ax + t * abx);
  const dy = py - (ay + t * aby);
  return Math.hypot(dx, dy);
}

function makeIcon(size) {
  const rows = [];
  const radius = size * 0.225;
  const white = [255, 255, 255, 255];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x += 1) {
      const p = 1 + x * 4;
      const gradient = (x + y) / (size * 2);
      const bg = [Math.round(35 - gradient * 25), Math.round(146 - gradient * 65), Math.round(125 - gradient * 56), 255];
      let color = insideRoundedRect(x, y, size, radius) ? bg : [20, 103, 88, 255];

      const left = size * 0.20;
      const right = size * 0.80;
      const top = size * 0.235;
      const bottom = size * 0.79;
      const stroke = size * 0.065;
      const calendarEdge =
        (x >= left && x <= right && (Math.abs(y - top) < stroke / 2 || Math.abs(y - bottom) < stroke / 2)) ||
        (y >= top && y <= bottom && (Math.abs(x - left) < stroke / 2 || Math.abs(x - right) < stroke / 2)) ||
        (x >= left && x <= right && Math.abs(y - size * 0.405) < stroke / 2) ||
        (Math.abs(x - size * 0.355) < stroke / 2 && y >= size * 0.16 && y <= size * 0.30) ||
        (Math.abs(x - size * 0.645) < stroke / 2 && y >= size * 0.16 && y <= size * 0.30);

      const checkStroke = size * 0.075;
      const check =
        distanceToSegment(x, y, size * 0.34, size * 0.59, size * 0.45, size * 0.70) < checkStroke / 2 ||
        distanceToSegment(x, y, size * 0.45, size * 0.70, size * 0.68, size * 0.48) < checkStroke / 2;
      if (calendarEdge || check) color = white;
      row[p] = color[0];
      row[p + 1] = color[1];
      row[p + 2] = color[2];
      row[p + 3] = color[3];
    }
    rows.push(row);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

const publicDir = join(import.meta.dirname, "..", "public");
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  writeFileSync(join(publicDir, name), makeIcon(size));
}
