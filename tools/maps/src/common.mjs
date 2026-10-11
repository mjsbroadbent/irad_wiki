// Shared data and geometry for every Irad map.
//
// Irad's outline is cut from real Natural Earth regions (see IMAGES_TODO.md, "Map canon"):
//   all of Kyrgyzstan's Talas and Jalal-Abad regions,
//   Kazakhstan's Jambyl and Turkistan regions inside MASK_KZ (keeps Shymkent, Turkistan and Kentau out),
//   Uzbekistan's Namangan and Andijan regions inside MASK_UZ (the rural Fergana rim, not the two cities),
//   all clipped to the canonical extent of 68–75° E.
// The internal lines (ISEZ districts, ATR planning zones, Qara-Chik line) are drawn here too,
// so every map uses the same geometry.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import * as d3 from '../vendor/node_modules/d3-geo/src/index.js';

const require = createRequire(import.meta.url);
export const pc = require('../vendor/polygon-clipping/polygon-clipping.umd.js');
export { d3 };

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DATA = path.join(HERE, '..', 'data');
export const REPO = path.join(HERE, '..', '..', '..');
export const R_EARTH = 6371.0088;
export const CANON_AREA = 196754;

export const load = name => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));

// ---------- geometry helpers ----------
export const toPC = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates); // -> MultiPolygon coords
const ringArea = r => { let a = 0; for (let i = 0, n = r.length; i < n; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % n]; a += x1 * y2 - x2 * y1; } return Math.abs(a / 2); };
// Keep outer rings only and drop crumbs: removes the hairline seams between source regions.
export const clean = (mp, min = 0.004) => mp.filter(p => ringArea(p[0]) > min).map(p => [p[0]]);
export const unionAll = l => (l.length === 1 ? l[0] : pc.union(l[0], ...l.slice(1)));
// polygon-clipping winds rings the GeoJSON way; d3-geo wants the opposite, so reverse and check.
export function toD3(mp) {
  return {
    type: 'MultiPolygon',
    coordinates: mp.map(poly => {
      let rings = poly.map(r => r.slice().reverse());
      if (d3.geoArea({ type: 'Polygon', coordinates: rings }) > 2 * Math.PI) rings = poly.map(r => r.slice());
      return rings;
    }),
  };
}
export const fixGeom = g => toD3(toPC(g).map(p => p.map(r => r.slice().reverse())));
export const areaKm2 = mp => Math.round(d3.geoArea(toD3(mp)) * R_EARTH ** 2);
// Hand-drawn boundaries get an irregular, surveyed-looking line instead of a ruler-straight one.
// The wiggle of a segment depends only on its two endpoints (in a fixed order), so a segment shared by
// two polygons gets exactly the same line in both and no gaps open between neighbouring divisions.
function rand(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
function wiggleSeg(a, b) {
  const flip = a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
  const [p, q] = flip ? [b, a] : [a, b];
  const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
  if (len < 0.08) return [a, b];
  const rnd = rand(Math.round(p[0] * 1000) * 73856093 ^ Math.round(p[1] * 1000) * 19349663 ^ Math.round(q[0] * 1000) * 83492791 ^ Math.round(q[1] * 1000));
  let pts = [p, q];
  for (let level = 0, amp = Math.min(0.06, len * 0.05); level < 4; level++, amp *= 0.55) {
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
      const o = (rnd() * 2 - 1) * amp;
      next.push([(x0 + x1) / 2 - dy / l * o, (y0 + y1) / 2 + dx / l * o], pts[i]);
    }
    pts = next;
  }
  return flip ? pts.reverse() : pts;
}
const ring = pts => {
  const out = [];
  for (let i = 0; i < pts.length; i++) out.push(...wiggleSeg(pts[i], pts[(i + 1) % pts.length]).slice(0, -1));
  return [[...out, out[0]]];
};

// ---------- Irad's external outline ----------
const MASK_KZ = ring([[68.0, 44.95], [70.0, 45.4], [76.5, 45.68], [76.5, 41.0], [70.6, 41.0], [70.0, 41.9],
  [69.9, 42.3], [69.95, 42.65], [69.55, 43.0], [69.2, 43.35], [68.6, 43.75], [68.0, 44.0]]);
const MASK_UZ = ring([[70.3, 42.2], [70.3, 41.3], [70.9, 41.25], [71.3, 41.17], [71.67, 41.13], [72.0, 41.06], [72.3, 40.96],
  [72.5, 40.87], [72.62, 40.74], [72.66, 40.4], [73.6, 40.2], [73.6, 42.2]]);
// The canonical extent, 68–75° E; its two meridian edges are wiggled like the rest.
const EXTENT = ring([[68.0, 40.0], [75.0, 40.0], [75.0, 43.0], [75.0, 44.2], [75.0, 45.4], [75.0, 46.5], [68.0, 46.5], [68.0, 45.3], [68.0, 44.4]]);

let cache = null;
export function geography() {
  if (cache) return cache;
  const admin1 = load('admin1_kz_kg_uz_10m.geojson');
  const byId = ids => admin1.features.filter(f => ids.includes(f.properties.id)).map(f => toPC(f.geometry));
  const country = a3 => admin1.features.filter(f => f.properties.country === a3).map(f => toPC(f.geometry));

  const irad = clean(pc.intersection(unionAll([
    unionAll(byId(['KG-T', 'KG-J'])),
    pc.intersection(unionAll(byId(['KZ-ZHA', 'KZ-YUZ'])), MASK_KZ),
    pc.intersection(unionAll(byId(['UZ-NG', 'UZ-AN'])), MASK_UZ),
  ]), EXTENT), 0.02);

  // Neighbours redrawn without Irad.
  const rest = a3 => clean(pc.difference(unionAll(country(a3)), irad));
  const neighbours = { KZ: rest('KAZ'), KG: rest('KGZ'), UZ: rest('UZB') };

  // ---------- inside Irad: ISEZ districts (fictional lines, see IMAGES_TODO.md) ----------
  const inIrad = m => clean(pc.intersection(m, irad), 0.0005);
  const D = {};
  D['Talas District'] = inIrad(ring([[71.9, 42.86], [72.2, 42.85], [73.0, 42.76], [73.62, 42.62], [73.62, 42.35],
    [73.0, 42.3], [72.15, 42.32], [71.75, 42.32], [71.9, 42.5]]));
  D['Kara-Buura District'] = inIrad(pc.difference(ring([[70.85, 42.8], [70.9, 43.15], [71.6, 43.05], [71.9, 42.86],
    [71.9, 42.5], [71.75, 42.32], [71.5, 42.33], [71.0, 42.48]]), D['Talas District']));
  // Chu District: the Chu lowlands and the steppe belt south of the river (eastern Moiynkum), from the
  // Kyrgyz Range piedmont to the eastern border.
  D['Chu District'] = inIrad(pc.difference(ring([[71.6, 43.05], [71.3, 43.7], [71.05, 44.4], [71.0, 44.95],
    [71.5, 44.85], [72.3, 44.55], [72.95, 44.27], [73.4, 43.9], [73.78, 43.6], [73.85, 43.72], [74.35, 43.75],
    [75.3, 43.85], [75.3, 42.5], [73.62, 42.5], [73.62, 42.62], [73.0, 42.76], [72.2, 42.85], [71.9, 42.86]]),
    pc.union(D['Talas District'], D['Kara-Buura District'])));
  // Sary-Bulak District: the corridor south from Talas over the Talas Alatau into the Chatkal valley.
  D['Sary-Bulak District'] = inIrad(pc.difference(ring([[71.75, 42.32], [72.15, 42.32], [71.95, 42.0],
    [71.8, 41.75], [71.95, 41.5], [71.75, 41.42], [71.55, 41.6], [71.6, 41.85], [71.7, 42.05]]), D['Talas District']));
  // Lower Naryn District: the salient around Tash-Kömür and the downstream Naryn cascade.
  D['Lower Naryn District'] = inIrad(pc.difference(ring([[71.75, 41.42], [71.95, 41.5], [72.15, 41.68],
    [72.5, 41.6], [72.6, 41.45], [72.35, 41.32], [72.15, 41.12], [71.9, 41.1], [71.7, 41.28]]), D['Sary-Bulak District']));
  const isez = clean(unionAll(Object.values(D)));
  const atr = clean(pc.difference(irad, isez), 0.001);

  // ---------- ATR planning zones (UN usage) ----------
  const ZM = {
    'Northern Steppe': ring([[66, 47], [77, 47], [77, 42.9], [71.6, 43.05], [71.3, 43.7], [71.05, 44.4], [71.0, 44.9],
      [70.2, 44.6], [69.0, 44.75], [66, 44.75]]),
    'Karatau': ring([[66, 44.75], [69.0, 44.75], [70.2, 44.6], [71.0, 44.9], [71.05, 44.4], [71.3, 43.7], [71.6, 43.05],
      [70.9, 42.9], [70.9, 42.8], [70.45, 42.45], [69.9, 42.15], [66, 42.15]]),
    'Talas Alatau': ring([[66, 42.15], [69.9, 42.15], [70.45, 42.45], [70.9, 42.8], [70.9, 42.9], [77, 42.9], [77, 42.0],
      [73.3, 42.0], [72.3, 42.05], [71.7, 42.05], [71.0, 42.0], [70.3, 42.05], [66, 41.9]]),
    'Chatkal Highlands': ring([[66, 41.9], [70.3, 42.05], [71.0, 42.0], [71.7, 42.05], [72.3, 42.05], [72.3, 41.75],
      [72.1, 41.65], [71.6, 41.3], [71.2, 41.15], [66, 41.2]]),
    'Toktogul–Naryn': ring([[72.3, 42.05], [77, 42.0], [77, 41.3], [73.3, 41.25], [72.75, 41.25], [72.5, 41.3],
      [72.1, 41.65], [72.3, 41.75]]),
    'Fergana Rim': ring([[66, 41.2], [71.2, 41.15], [71.6, 41.3], [72.1, 41.65], [72.5, 41.3], [72.75, 41.25],
      [73.3, 41.25], [77, 41.3], [77, 39], [66, 39]]),
  };
  const Z = {};
  let left = atr;
  for (const [name, mask] of Object.entries(ZM)) {
    Z[name] = clean(pc.intersection(left, mask), 0.001);
    left = pc.difference(left, mask);
  }

  // Fold crumbs (< 100 km²) left where zone lines meet into the zone with the nearest vertex.
  const crumbs = [];
  for (const name of Object.keys(Z)) {
    const keep = [];
    for (const p of Z[name]) (areaKm2([p]) < 100 ? crumbs : keep).push(p);
    Z[name] = keep;
  }
  for (const c of crumbs) {
    const [cx, cy] = c[0].reduce((a, q) => [a[0] + q[0] / c[0].length, a[1] + q[1] / c[0].length], [0, 0]);
    let best = null, bd = Infinity;
    for (const [name, mp] of Object.entries(Z)) for (const p of mp) for (const q of p[0]) {
      const d = (q[0] - cx) ** 2 + (q[1] - cy) ** 2;
      if (d < bd) { bd = d; best = name; }
    }
    Z[best] = clean(pc.union(Z[best], [c]), 0.001);
  }

  cache = { irad, neighbours, districts: D, isez, atr, zones: Z };
  return cache;
}

// ---------- places (lon, lat) ----------
// Real towns at their real positions; Irad's fictional cities placed from the lore (see IMAGES_TODO.md).
export const PLACES = [
  { name: 'Talas', lon: 72.24, lat: 42.52, kind: 'capital' },               // 42°31′N 72°14′E (canon)
  { name: 'Nurzhan', lon: 74.15, lat: 43.3, kind: 'city' },                 // lower Chu, 740 m; Kazakh border to the east
  { name: 'Iyık Janyl', lon: 72.55, lat: 42.36, kind: 'city' },             // side valley of the Talas Alatau, 65 km SE of Talas by road
  { name: 'Boz-Korgon', lon: 74.64, lat: 43.3, kind: 'seat' },               // 40 km east of Nurzhan
  { name: 'Tash-Kömür', lon: 72.22, lat: 41.35, kind: 'town' },
  { name: 'Toktogul', lon: 72.94, lat: 41.87, kind: 'town' },
  { name: 'Kara-Buura', lon: 71.57, lat: 42.6, kind: 'town' },
  { name: 'Mailuu-Suu', lon: 72.45, lat: 41.27, kind: 'town' },
];
// Nearby real cities outside Irad, for orientation.
export const FOREIGN_CITIES = [
  { name: 'Bishkek', lon: 74.59, lat: 42.87 },
  { name: 'Shymkent', lon: 69.6, lat: 42.32 },
  { name: 'Tashkent', lon: 69.24, lat: 41.3 },
  { name: 'Namangan', lon: 71.67, lat: 41.0 },
  { name: 'Andijan', lon: 72.34, lat: 40.78 },
  { name: 'Turkistan', lon: 68.25, lat: 43.3 },
];

// Rivers Natural Earth lacks at this scale, traced by hand (approximate).
export const TRACED_RIVERS = {
  Talas: [[73.45, 42.42], [73.1, 42.45], [72.7, 42.48], [72.24, 42.5], [71.9, 42.55], [71.6, 42.66], [71.42, 42.85],
    [71.25, 43.08], [70.98, 43.38], [70.65, 43.72], [70.3, 44.05], [69.95, 44.35]],
  Chu: [[75.3, 42.82], [75.0, 42.92], [74.6, 43.1], [74.15, 43.27], [73.95, 43.4], [73.78, 43.6], [73.4, 43.9],
    [72.95, 44.27], [72.3, 44.55], [71.5, 44.85], [70.6, 45.05], [69.6, 45.12], [68.8, 45.02]],
  Chatkal: [[71.95, 41.98], [71.65, 41.88], [71.35, 41.78], [71.0, 41.72], [70.6, 41.66], [70.25, 41.6], [70.05, 41.58]],
};
