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
  // Official areas (ISEZ statistical office, see Administrative divisions of Irad): Talas 9,800 km²,
  // Kara-Buura 11,400, Chu 24,600, Sary-Bulak 10,900, Lower Naryn 6,300; the three cities about 1,000
  // (drawn as points, so their area sits inside the districts here).
  // Talas District: the middle Talas valley floor between the Kyrgyz Range crest and the Talas Alatau foothills.
  D['Talas District'] = inIrad(ring([[71.95, 42.88], [72.6, 42.84], [73.2, 42.78], [73.75, 42.7], [74.1, 42.6],
    [74.05, 42.42], [73.4, 42.4], [72.8, 42.42], [72.3, 42.42], [71.95, 42.42], [71.85, 42.62]]));
  // Kara-Buura District: the lower and western Talas valley, down the river past Taraz.
  // A corridor along the Turksib line and the Trans-Talas Highway runs west from Taraz to the Kazakh frontier
  // facing Shymkent, where the Talas North Terminal stands (lore: the district runs "as far as the Kazakh border").
  D['Kara-Buura District'] = inIrad(pc.difference(pc.union(ring([[71.95, 42.88], [71.6, 43.08], [71.3, 43.5], [71.0, 43.9],
    [70.6, 43.85], [70.65, 43.25], [70.75, 42.8], [71.0, 42.45], [71.45, 42.33], [71.95, 42.32], [71.95, 42.42], [71.85, 42.62]]),
    ring([[70.8, 42.78], [70.4, 42.7], [70.1, 42.72], [69.8, 42.74], [69.8, 42.44], [70.1, 42.44], [70.4, 42.47], [70.85, 42.52]])),
    D['Talas District']));
  // Chu District: the irrigated Chu lowlands around Nurzhan (the line crosses the river north-west of the
  // city) and the Kyrgyz Range piedmont west to the Talas valley.
  D['Chu District'] = inIrad(pc.difference(ring([[71.6, 43.08], [71.95, 43.4], [72.5, 43.55], [73.05, 43.7],
    [73.45, 43.9], [73.85, 44.05], [74.35, 44.1], [75.3, 44.1], [75.3, 42.5], [74.0, 42.6], [73.75, 42.7],
    [73.2, 42.78], [72.6, 42.84], [71.95, 42.88]]), pc.union(D['Talas District'], D['Kara-Buura District'])));
  // Sary-Bulak District: the mining foothills south of Talas (the Sary-Bulak mine 28 km south of Talas, the
  // Chatkal smelter 30 km south-west, the lower Besh-Tash valley) and the highway strip up the lower Kara-Suu
  // Canyon and through the Otmek tunnel to the Fergana Gateway. The crest and upper valleys stay tribal.
  D['Sary-Bulak District'] = inIrad(pc.difference(ring([[71.6, 42.42], [71.95, 42.42], [72.3, 42.42], [72.8, 42.42],
    [73.2, 42.4], [73.1, 42.27], [72.7, 42.24], [72.55, 42.17], [72.6, 42.08], [72.63, 42.02], [72.45, 42.02],
    [72.42, 42.12], [72.3, 42.2], [72.1, 42.22], [71.9, 42.25], [71.7, 42.3]]),
    pc.union(D['Talas District'], D['Kara-Buura District'])));
  // Lower Naryn District: the salient from the Fergana Gateway down the Naryn below the Toktogul dam to
  // Tash-Kömür, with the city of Iyık Janyl in the foothills east of the gorge.
  D['Lower Naryn District'] = inIrad(pc.difference(ring([[72.42, 42.02], [72.7, 42.04], [72.76, 41.88], [72.62, 41.74],
    [72.64, 41.64], [72.8, 41.55], [72.78, 41.4], [72.55, 41.36], [72.4, 41.3], [72.38, 41.2], [72.2, 41.02], [71.8, 41.0],
    [71.62, 41.25], [71.9, 41.5], [72.15, 41.68], [72.25, 41.9]]), D['Sary-Bulak District']));
  const isez = clean(unionAll(Object.values(D)));
  const atr = clean(pc.difference(irad, isez), 0.001);

  // ---------- ATR planning zones (UN usage) ----------
  const ZM = {
    // Northern Steppe: the Betpak-Dala and the Moiynkum, east of the lower Talas (lore: about 52,000 km²).
    'Northern Steppe': ring([[71.6, 47], [77, 47], [77, 42.9], [71.0, 43.9], [70.6, 43.85], [70.3, 44.15], [70.8, 44.55],
      [71.25, 45.0], [71.6, 45.6]]),
    'Karatau': ring([[66, 47], [71.6, 47], [71.6, 45.6], [71.25, 45.0], [70.8, 44.55], [70.3, 44.15], [70.6, 43.85],
      [70.65, 43.25], [70.75, 42.8], [70.45, 42.45], [69.9, 42.15], [66, 42.15]]),
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

  // Fold crumbs (< 100 km²) left where zone lines meet, and any tribal land no mask caught, into the zone
  // with the nearest vertex, so a boundary edit can never leave an unassigned hole.
  const crumbs = clean(left, 0.0005);
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
  { name: 'Iyık Janyl', lon: 72.43, lat: 41.44, kind: 'city' },             // Fergana Range foothills south-east of the Naryn gorge, about 20 km NE of Tash-Kömür, Lower Naryn salient (lore change 2026-10-11)
  { name: 'Boz-Korgon', lon: 74.64, lat: 43.3, kind: 'seat' },               // 40 km east of Nurzhan
  { name: 'Tash-Kömür', lon: 72.22, lat: 41.35, kind: 'town' },
  { name: 'Toktogul', lon: 72.94, lat: 41.87, kind: 'town' },
  { name: 'Kyzyl-Adyr', lon: 71.57, lat: 42.6, kind: 'town' },  // seat of Kara-Buura District
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

// Named features for thematic maps (lon, lat). Positions follow the lore's descriptions; see IMAGES_TODO.md.
export const FEATURES = {
  'Qara-Chik checkpoint': [72.27, 42.39],     // main crossing, foothill village south of Talas on the road into the Talas Alatau
  'Kara-Oi': [72.05, 42.47],                  // UNMI headquarters and Joint Liaison Committee, Talas District
  'Kenkol Pass': [71.38, 42.4],               // western sector; 2009 mine incident
  'Fergana Gateway': [72.55, 41.99],          // pass, 2,480 m, junction of Talas Alatau and Chatkal ranges
  'Toktogul dam': [72.652, 41.668],             // dam, reservoir and powerhouse: tribal side
  'Toktogul switchyard': [72.62, 41.618],       // switchyard and national dispatch centre: ISEZ side
  'Kara-Köl': [72.7, 41.63],                  // operators' town just downstream of the dam: tribal side
  'Kurpsai station': [72.41, 41.512],           // downstream Naryn cascade (ISEZ)
  'Tash-Kömür station': [72.233, 41.385],
  'Shamaldy-Say station': [72.19, 41.25],
  'Uch-Kurgan station': [72.1, 41.15],
  'Otmek Tunnel': [72.51, 42.12],
  'Kara-Suu Canyon': [72.32, 42.3],
  'Chu Gate': [74.95, 43.33],                 // freight crossing to Kazakhstan east of Nurzhan
  'Sary-Bulak mine': [72.24, 42.27],          // 28 km south of Talas
  'Chatkal smelter': [71.97, 42.33],          // 30 km south-west of Talas
  'Talas Air Base': [72.095, 42.535],           // west of Talas
  'Nurzhan Refinery No. 1': [74.12, 43.32],
};

// Fergana Mountain Transit Highway (State Route 1), Talas to Tash-Kömür, 236 km; and the branch to Iyık Janyl.
export const HIGHWAY_SR1 = [[72.24, 42.52], [72.27, 42.42], [72.3, 42.34], [72.36, 42.26], [72.45, 42.17], [72.51, 42.12],
  [72.55, 41.99], [72.58, 41.88], [72.57, 41.76], [72.585, 41.68], [72.615, 41.626], [72.598, 41.611], [72.562, 41.598],
  [72.41, 41.503], [72.375, 41.508], [72.325, 41.489], [72.276, 41.459], [72.246, 41.435], [72.232, 41.405], [72.226, 41.362]];
export const BRANCH_IYIK_JANYL = [[72.33, 41.49], [72.37, 41.47], [72.4, 41.452], [72.43, 41.44]];

// ---------- transport (Transport in Irad) ----------
// Railway, 1,520 mm, about 540 km: Talas down the valley to Taraz, west on the Turksib to the Talas North Terminal,
// east on the lowland route round the Kyrgyz Range to Nurzhan, and on to the rail border station north-east of Nurzhan.
export const RAIL = {
  'Talas–Taraz': [[72.24, 42.52], [72.0, 42.56], [71.75, 42.6], [71.57, 42.62], [71.45, 42.72], [71.37, 42.9]],
  'Turksib west': [[71.37, 42.9], [71.0, 42.82], [70.6, 42.72], [70.25, 42.67], [69.93, 42.65]],
  'Lowland route': [[71.37, 42.9], [71.7, 42.97], [72.1, 43.0], [72.5, 42.98], [72.76, 42.95], [73.1, 43.02], [73.5, 43.12],
    [73.85, 43.22], [74.15, 43.3]],
  'Nurzhan–frontier': [[74.15, 43.3], [74.45, 43.42], [74.75, 43.5], [74.99, 43.56]],
  'Sary-Bulak spur': [[72.24, 42.52], [72.25, 42.42], [72.24, 42.33], [72.24, 42.27]],
  'Chatkal spur': [[72.25, 42.42], [72.12, 42.38], [71.97, 42.33]],
};
export const ROADS = {
  'Trans-Talas Highway': [[69.93, 42.6], [70.25, 42.59], [70.6, 42.61], [71.0, 42.63], [71.3, 42.61], [71.57, 42.6],
    [71.9, 42.55], [72.24, 42.52], [72.55, 42.5], [72.8, 42.47]],
  'Trans-Talas track': [[72.8, 42.47], [73.1, 42.43], [73.4, 42.38], [73.7, 42.33]],
  'Talas–Nurzhan road': [[71.37, 42.9], [71.7, 42.99], [72.1, 43.03], [72.5, 43.01], [72.76, 42.98], [73.1, 43.05], [73.5, 43.15],
    [73.85, 43.25], [74.15, 43.3]],
  'Kök-Bel road': [[72.24, 42.52], [72.35, 42.62], [72.45, 42.72], [72.55, 42.82], [72.7, 42.92], [72.76, 42.98]],
  'Chu highway': [[74.15, 43.3], [74.4, 43.3], [74.64, 43.31], [74.95, 43.33], [75.0, 43.33]],
};
export const PIPELINES = {
  'Northern Export Feeder': [[74.12, 43.32], [74.4, 43.47], [74.7, 43.6], [74.99, 43.68]],
  'Nurzhan Petroleum Pipeline': [[73.25, 43.78], [73.45, 43.74], [73.62, 43.66], [73.85, 43.5], [74.0, 43.4], [74.12, 43.32]],
  'Jet fuel line to Talas Air Base': [[74.12, 43.32], [73.5, 43.08], [72.85, 42.96], [72.6, 42.84], [72.45, 42.7], [72.2, 42.58], [72.095, 42.535]],
};
export const TRANSPORT_POINTS = {
  'Talas North Terminal': [69.96, 42.625],
  'Rail border station': [74.99, 43.56],
  'Chu Gate': [74.97, 43.33],
  'Kum-Shagyl': [74.97, 43.95],
  'Kök-Bel Pass': [72.45, 42.72],
  'Feeder metering station': [74.97, 43.68],
  'Oil field collection station': [73.25, 43.78],
  'Tash-Kömür airstrip': [72.18, 41.33],
  'Kyzyl-Adyr Reservoir': [71.55, 42.63],
};

// ---------- energy and resources (Energy in Irad; Economy of Irad) ----------
// Areas are drawn as ellipses: [lon, lat, rx°, ry°, rotation°].
export const RESOURCE_AREAS = {
  'Main Chu oil field (1949)': [73.55, 43.7, 0.32, 0.1, -35],
  'Western oil fields': [73.0, 43.55, 0.18, 0.07, -10],
  'Northern oil fields': [74.05, 43.78, 0.14, 0.07, -20],
  'Muyunkum gas field': [73.15, 44.33, 0.42, 0.13, -20],
  'Uranium-bearing sandstones': [71.55, 44.6, 0.8, 0.2, -12],
  'Chatkal placer gold': [71.15, 41.76, 0.42, 0.08, -10],
};
export const RESOURCE_POINTS = {
  'Nurzhan Gas Compressor Station': [74.16, 43.37],
  'Lihua gas-fired plant': [74.0, 43.24],
  'Kara-Suu station': [72.31, 42.33],
  'Talas Solar Park': [72.5, 42.56],
  'Tash-Kömür coal mines': [72.27, 41.4],
  'Mailuu-Suu tailings': [72.45, 41.27],
};
export const GAS_LINE_MUYUNKUM = [[73.45, 44.2], [73.6, 44.03], [73.8, 43.8], [74.0, 43.55], [74.16, 43.37]];
// High-voltage lines from the Naryn switchyard (Energy in Irad: north along the Fergana highway corridor to the
// Talas valley and the Chu lowlands, and south to the Fergana Valley; exports to Kazakhstan and Uzbekistan).
export const HV_LINES = {
  north: [[72.62, 41.618], [72.6, 41.7], [72.57, 41.85], [72.53, 42.0], [72.47, 42.14], [72.37, 42.27], [72.28, 42.4], [72.24, 42.52]],
  chu: [[72.24, 42.52], [72.42, 42.68], [72.6, 42.88], [73.0, 43.05], [73.6, 43.18], [74.15, 43.3]],
  west: [[72.24, 42.52], [71.57, 42.6], [71.37, 42.88]],
  'to Kazakhstan': [[74.15, 43.3], [74.6, 43.28], [74.99, 43.3]],
  'to Uzbekistan': [[72.62, 41.618], [72.4, 41.49], [72.25, 41.38], [72.18, 41.2], [72.1, 41.04]],
};
