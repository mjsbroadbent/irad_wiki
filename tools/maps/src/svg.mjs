// Small helpers for writing clean, Wikipedia-style SVG files.
import fs from 'fs';
import path from 'path';
import { d3, REPO } from './common.mjs';

export const FONT = "'DejaVu Sans', Arial, Helvetica, sans-serif";
export const OUT = path.join(REPO, 'images');

// Wikipedia location-map palette (the convention used across its country maps).
export const WP = {
  land: '#dfdfdf',      // other countries
  focus: '#fefee9',     // the country itself
  water: '#c6ecff',
  waterLine: '#0978ab',
  border: '#646464',
  text: '#202122',
  textMuted: '#555555',
};

// Douglas–Peucker in screen space: drop detail smaller than tol px.
function dp(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
    let far = -1, fd = tol;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len; if (d > fd) { fd = d; far = i; } }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
export function simplifyPath(d, tol = 0.45) {
  if (!d) return '';
  return d.match(/M[^M]*/g).map(sub => {
    const closed = /Z\s*$/.test(sub);
    const pts = [...sub.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(m => [+m[1], +m[2]]);
    let out;
    if (closed && pts.length > 8) { const h = pts.length >> 1; out = dp(pts.slice(0, h + 1), tol).concat(dp(pts.slice(h), tol).slice(1)); }
    else out = dp(pts, tol);
    if (closed && out.length < 4) return '';
    if (!closed && out.length < 2) return '';
    return 'M' + out.map(p => p[0] + ',' + p[1]).join('L') + (closed ? 'Z' : '');
  }).join('');
}
export const pathFn = (proj, tol = 0.45, digits = 1) => {
  const p = d3.geoPath(proj).digits(digits);
  return g => simplifyPath(p(g), tol);
};

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Text with a white halo, as on Wikipedia maps.
export function label(x, y, text, { size = 12, anchor = 'middle', weight = 'normal', style = 'normal', fill = WP.text,
  halo = '#ffffff', spacing = 0, upper = false } = {}) {
  const t = esc(upper ? text.toUpperCase() : text);
  const common = `x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" font-style="${style}"${spacing ? ` letter-spacing="${spacing}"` : ''}`;
  return (halo ? `<text ${common} fill="none" stroke="${halo}" stroke-width="3" stroke-linejoin="round" opacity="0.85">${t}</text>` : '')
    + `<text ${common} fill="${fill}">${t}</text>`;
}

export function writeSvg(name, w, h, body, { title, desc }) {
  fs.mkdirSync(OUT, { recursive: true });
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}">
<title>${esc(title)}</title>
<desc>${esc(desc)}</desc>
${body}
</svg>
`;
  const file = path.join(OUT, name);
  fs.writeFileSync(file, svg);
  console.log(`wrote images/${name} (${Math.round(svg.length / 1024)} KB)`);
  return file;
}
