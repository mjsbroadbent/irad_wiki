// Shared data and geometry for every Irad map.
//
// Irad's border, the ISEZ and ATR, the five ISEZ districts, the Qara-Chik line, the restricted-weapons zone,
// the routes (roads, railways, pipelines, power lines) and the positions of places all come from the Kartalar
// map data (the authoritative map of Irad), copied into data/kartalar/ so this build is self-contained.
// Only the six UN planning zones of the ATR are drawn here: rough masks clipped to the ATR so they tile it.
// Neighbouring countries, lakes and the big rivers are Natural Earth (data/*.geojson).

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
export const CANON_AREA = 218205;   // Kartalar, irad.geojson area_km2
export const KDATA = path.join(DATA, 'kartalar');

export const load = name => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
export const loadK = name => JSON.parse(fs.readFileSync(path.join(KDATA, name), 'utf8'));

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

// ---------- Kartalar geometry ----------
// polygon-clipping's union normalises winding and drops any slivers; every map then reads the same shapes.
const norm = g => clean(pc.union(toPC(g)), 0.0002);

// Join line pieces that meet end to end into longer chains, so dash patterns run on unbroken.
function chain(pieces) {
  const key = p => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
  const left = pieces.map(c => c.slice());
  const out = [];
  while (left.length) {
    let cur = left.shift(), grown = true;
    while (grown) {
      grown = false;
      for (let i = 0; i < left.length; i++) {
        const c = left[i], a = key(cur[0]), b = key(cur.at(-1));
        if (key(c[0]) === b) cur = cur.concat(c.slice(1));
        else if (key(c.at(-1)) === b) cur = cur.concat(c.slice().reverse().slice(1));
        else if (key(c.at(-1)) === a) cur = c.concat(cur.slice(1));
        else if (key(c[0]) === a) cur = c.slice().reverse().concat(cur.slice(1));
        else continue;
        left.splice(i, 1); grown = true; break;
      }
    }
    out.push(cur);
  }
  return out;
}

let cache = null;
export function geography() {
  if (cache) return cache;
  const admin1 = load('admin1_kz_kg_uz_10m.geojson');
  const country = a3 => admin1.features.filter(f => f.properties.country === a3).map(f => toPC(f.geometry));

  const irad = norm(loadK('irad.geojson').features[0].geometry);
  // Neighbours redrawn without Irad.
  const rest = a3 => clean(pc.difference(unionAll(country(a3)), irad));
  const neighbours = { KZ: rest('KAZ'), KG: rest('KGZ'), UZ: rest('UZB') };

  const zf = loadK('zones.geojson').features;
  const isez = norm(zf.find(f => f.properties.zone === 'ISEZ').geometry);
  const atr = norm(zf.find(f => f.properties.zone === 'ATR').geometry);
  const D = {};
  for (const name of ['Talas', 'Kara-Buura', 'Chu', 'Sary-Bulak', 'Lower Naryn']) {
    const f = loadK('districts.geojson').features.find(q => q.properties.district === name);
    D[`${name} District`] = norm(f.geometry);
  }

  // ---------- ATR planning zones (UN usage; Kartalar does not draw them) ----------
  // Rough masks, applied in order to whatever ATR land is still unassigned, so the zones tile the ATR with no
  // gaps or overlaps. Talas Alatau takes the high ranges south of the Talas valley and, since the 2009 protocol,
  // the high Kyrgyz Range east of the Kök-Bel road; Toktogul–Naryn is the mountain rim of the Toktogul basin
  // and the mountains either side of the Naryn gorge (the basin floor, the State Route 1 corridor, the gorge corridor and
  // the Fergana farm belt are ISEZ, Lower Naryn District); Fergana Rim is the hill country above that farm belt.
  const ZM = {
    // Northern Steppe: the Betpak-Dala north of the Chu and the Moiynkum sands between the Chu and the Talas,
    // with the piedmont plain north of the Kyrgyz Range.
    'Northern Steppe': ring([[66, 47], [77, 47], [77, 43.0], [74.0, 43.0], [73.0, 43.0], [72.0, 43.0], [71.2, 43.05], [70.9, 43.3],
      [70.6, 43.85], [70.3, 44.15], [70.8, 44.55], [70.9, 44.95], [69.6, 45.1], [69.4, 45.5], [66, 45.5]]),
    // Karatau: the Karatau range and its foothills toward the Kyzylkum Fringe, west of the lower Talas, and the low hills
    // north of the Kara-Buura corridor.
    'Karatau': ring([[66, 45.5], [69.4, 45.5], [69.6, 45.1], [70.9, 44.95], [70.8, 44.55], [70.3, 44.15], [70.6, 43.85],
      [71.3, 43.3], [71.7, 42.9], [71.4, 42.62], [70.6, 42.55], [70.3, 42.5], [69.9, 42.15], [66, 42.15]]),
    // Talas Alatau: the ranges south of the Talas valley and, since 2009, the high Kyrgyz Range north of it.
    'Talas Alatau': ring([[66, 42.15], [69.9, 42.15], [70.45, 42.45], [70.75, 42.8], [70.9, 43.3], [71.2, 43.05], [72.0, 43.0],
      [73.0, 43.0], [74.0, 43.0], [77, 43.0], [77, 42.08], [73.3, 42.08], [72.6, 42.08], [72.15, 42.1], [71.7, 42.1], [71.0, 42.0],
      [70.3, 42.05], [66, 41.9]]),
    'Chatkal Highlands': ring([[66, 41.9], [70.3, 42.05], [71.0, 42.0], [71.7, 42.1], [72.15, 42.1], [72.3, 42.08], [72.3, 41.75],
      [72.1, 41.65], [71.6, 41.3], [71.2, 41.15], [66, 41.2]]),
    // Toktogul–Naryn: the highlands round the Toktogul basin and the roadless mountains either side of the Naryn gorge
    // down to the hills above Iyık Janyl and Tash-Kömür (the gorge floor itself is the Lower Naryn corridor).
    'Toktogul–Naryn': ring([[72.3, 42.08], [72.6, 42.08], [73.3, 42.08], [77, 42.08], [77, 41.3], [73.5, 41.3], [73.2, 41.45],
      [72.8, 41.45], [72.55, 41.42], [72.4, 41.4], [72.3, 41.43], [72.2, 41.47], [72.05, 41.47], [71.88, 41.5], [72.1, 41.65],
      [72.3, 41.75]]),
    // Fergana Rim: the hill country above the northern Fergana farm belt (Mailuu-Suu, the Kara-Unkur valley, Arslanbob and
    // its walnut forest, Oruktu, Jangak-Bulak) and its western part beyond the Naryn (Boz-Adyr, Kara-Jygach). The lowland
    // belt from Tash-Kömür past Bazar-Korgon to the Uzbek frontier is ISEZ (Lower Naryn District).
    'Fergana Rim': ring([[66, 41.2], [71.2, 41.15], [71.6, 41.3], [71.88, 41.5], [72.05, 41.47], [72.2, 41.47], [72.3, 41.43],
      [72.4, 41.4], [72.55, 41.42], [72.8, 41.45], [73.2, 41.45], [73.5, 41.3], [77, 41.3], [77, 39], [66, 39]]),
  };
  const Z = {};
  let left = atr;
  for (const [name, mask] of Object.entries(ZM)) {
    Z[name] = clean(pc.intersection(left, mask), 1e-7);
    left = pc.difference(left, mask);
  }

  // Fold crumbs (< 100 km²) left where zone lines meet, and any tribal land no mask caught, into the zone
  // with the nearest vertex, so a boundary edit can never leave an unassigned hole.
  const crumbs = clean(left, 1e-7);
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
    Z[best] = clean(pc.union(Z[best], [c]), 1e-7);
  }

  // The Qara-Chik line (LineStrings tagged by sector) and the 12 km restricted-weapons zone.
  const qf = loadK('qarachik.geojson').features;
  const qaraChik = { type: 'MultiLineString', coordinates: chain(qf.map(f => f.geometry.coordinates)) };
  const sectors = {};
  for (const f of qf) (sectors[f.properties.sector] ||= []).push(f.geometry.coordinates);
  const lineKm = Math.round(qf.reduce((a, f) => a + f.properties.km, 0));
  const restricted = norm(loadK('restricted_zone.geojson').features[0].geometry);

  cache = { irad, neighbours, districts: D, isez, atr, zones: Z, qaraChik, sectors, lineKm, restricted };
  return cache;
}

// ---------- places (lon, lat) from Kartalar ----------
const SETTLEMENTS = loadK('settlements.json');
const KFEATURES = loadK('features.json');
// Settlements win over features of the same id (Boz-Korgon is both a town and a compound).
const byId = new Map([...KFEATURES, ...SETTLEMENTS].map(p => [p.id, p]));
export const place = id => { const p = byId.get(id); if (!p) throw new Error(`Kartalar place not found: ${id}`); return [p.lon, p.lat]; };
export const KPLACE = id => byId.get(id);

const pl = (id, kind) => { const p = byId.get(id); return { name: p.name, lon: p.lon, lat: p.lat, kind: kind || p.kind }; };
export const PLACES = [
  pl('talas', 'capital'), pl('nurzhan', 'city'), pl('iyik-janyl', 'city'), pl('boz-korgon', 'seat'),
  pl('tash-komur', 'town'), pl('toktogul', 'town'), pl('kyzyl-adyr', 'town'), pl('mailuu-suu', 'town'),
  pl('bazar-korgon', 'town'),
];
// Nearby real cities outside Irad, for orientation.
export const FOREIGN_CITIES = [
  { name: 'Bishkek', lon: 74.59, lat: 42.87 },
  { name: 'Shymkent', lon: 69.6, lat: 42.32 },
  { name: 'Tashkent', lon: 69.24, lat: 41.3 },
  { name: 'Namangan', lon: 71.67, lat: 41.0 },
  { name: 'Andijan', lon: 72.34, lat: 40.78 },
  { name: 'Jalal-Abad', lon: 73.0, lat: 40.93 },   // Kyrgyz; Irad's border runs round it
  { name: 'Turkistan', lon: 68.25, lat: 43.3 },
];

// Rivers Natural Earth lacks at this scale, traced by hand (approximate).
export const TRACED_RIVERS = {
  Talas: [[73.45, 42.42], [73.1, 42.45], [72.7, 42.48], [72.24, 42.5], [71.9, 42.55], [71.6, 42.66], [71.42, 42.85],
    [71.25, 43.08], [70.98, 43.38], [70.65, 43.72], [70.3, 44.05], [69.95, 44.35]],
  Chu: [[75.3, 42.82], [75.0, 42.92], [74.6, 43.1], [74.45, 43.4], [74.15, 43.5], [73.95, 43.56], [73.78, 43.6], [73.4, 43.9],
    [72.95, 44.27], [72.3, 44.55], [71.5, 44.85], [70.6, 45.05], [69.6, 45.12], [68.8, 45.02]],
  Chatkal: [[71.95, 41.98], [71.65, 41.88], [71.35, 41.78], [71.0, 41.72], [70.6, 41.66], [70.25, 41.6], [70.05, 41.58]],
};

// Named features for thematic maps: name used in the map scripts -> Kartalar id.
const FEATURE_IDS = {
  'Qara-Chik checkpoint': 'qara-chik-border-checkpoint',
  'Kara-Oi': 'unmi-hq-kara-oi',
  'UNMI Lower Naryn HQ': 'unmi-lower-naryn-sector-hq',
  'Kenkol Pass': 'kenkol-pass',
  'Fergana Gateway': 'fergana-gateway',
  'Toktogul dam': 'toktogul-dam',
  'Toktogul switchyard': 'toktogul-switchyard',
  'Naryn bridge checkpoint': 'naryn-bridge-checkpoint',
  'Kara-Köl': 'kara-kol',
  'Kurpsai station': 'kurpsai-hps',
  'Tash-Kömür station': 'tash-komur-hps',
  'Shamaldy-Say station': 'shamaldy-sai-hps',
  'Uch-Kurgan station': 'uch-kurgan-hps',
  'Otmek Tunnel': 'otmek-tunnel',
  'Kara-Suu Canyon': 'kara-suu-canyon',
  'Chu Gate': 'chu-gate',
  'Sary-Bulak mine': 'sary-bulak-antimony-works',
  'Chatkal smelter': 'chatkal-smelting-complex',
  'Talas Air Base': 'talas-air-base',
  'Nurzhan Refinery No. 1': 'nurzhan-refinery-1',
  'Toktogul Reservoir': 'toktogul-reservoir',
};
export const FEATURES = Object.fromEntries(Object.entries(FEATURE_IDS).map(([k, id]) => [k, place(id)]));

// ---------- routes (Kartalar routes.json) ----------
const ROUTES = loadK('routes.json');
export const route = id => { const r = ROUTES.find(q => q.id === id); if (!r) throw new Error(`Kartalar route not found: ${id}`); return r.coords; };
export const ROUTE_INFO = id => ROUTES.find(q => q.id === id);
export const routesOfKind = kind => ROUTES.filter(r => r.kind === kind);

// Fergana Mountain Transit Highway (State Route 1), Talas to Tash-Kömür; and the Cathedral Hill road in Iyık Janyl.
export const HIGHWAY_SR1 = route('fergana-mountain-transit-highway');
export const BRANCH_IYIK_JANYL = route('iyik-janyl-branch-road');

// ---------- transport (Transport in Irad) ----------
// Irad Temir Jolu, 1,520 mm. The first four are the main lines (used on the historical maps).
export const RAIL = {
  'Talas branch': route('irad-temir-jolu-talas-branch'),
  'Kara-Buura corridor line': route('irad-temir-jolu-kara-buura-line'),
  'Chu line': route('irad-temir-jolu-chu-line'),
  'Nurzhan north line': route('irad-temir-jolu-north-line'),
  'East line to Boz-Korgon': route('irad-temir-jolu-east-line'),
  'Sary-Bulak spur': route('irad-temir-jolu-sary-bulak-spur'),
  'Chatkal spur': route('irad-temir-jolu-chatkal-spur'),
};
export const ROADS = {
  'Trans-Talas Highway': route('trans-talas-highway'),
  'Talas–Nurzhan road': route('talas-nurzhan-road'),
  'Kök-Bel road': route('kok-bel-road'),
  'Chu highway': route('chu-highway'),
};
export const MINOR_ROADS = ['boz-korgon-branch', 'sary-bulak-road', 'chatkal-smelter-road', 'qara-chik-road', 'kenkol-military-road',
  'karakol-road', 'lower-naryn-uzbek-road', 'iyik-janyl-branch-road', 'fergana-rim-road', 'mailuu-suu-road', 'arslanbob-road'].map(route);
export const PIPELINES = {
  'Northern Export Feeder': route('northern-export-feeder'),
  'Nurzhan Petroleum Pipeline': route('nurzhan-petroleum-pipeline'),
  'Jet fuel line to Talas Air Base': route('talas-air-base-products-pipeline'),
};
export const TRANSPORT_POINTS = {
  'Talas North Terminal': place('talas-north-terminal'),
  'Rail border station': place('nurzhan-rail-border-station'),
  'Chu Gate': place('chu-gate'),
  'Kum-Shagyl': place('kum-shagyl-crossing'),
  'Kök-Bel Pass': place('kok-bel-pass'),
  'Feeder metering station': place('northern-export-feeder-metering'),
  'Oil field collection station': place('nurgaz-field-collection-station'),
  'Tash-Kömür airstrip': place('tash-komur-airstrip'),
  'Kyzyl-Adyr Reservoir': place('kyzyl-adyr-reservoir'),
};

// ---------- energy and resources (Energy in Irad; Economy of Irad) ----------
// Areas are drawn as ellipses: [lon, lat, rx°, ry°, rotation°], placed round the Kartalar sites. The oil fields lie
// inside the ISEZ (Energy in Irad); the field collection station and the export metering station stand on tribal land.
export const RESOURCE_AREAS = {
  'Main Chu oil field (1949)': [73.36, 43.715, 0.11, 0.028, -4],   // along the Uzun-Kyr anticline NW of Nurzhan
  'Southern oil fields': [73.45, 43.66, 0.05, 0.02, 0],
  'Northern oil fields': [73.66, 43.83, 0.06, 0.025, -20],
  'Muyunkum gas field': [72.8, 43.98, 0.42, 0.13, -20],
  'Uranium-bearing sandstones': [71.55, 44.6, 0.8, 0.2, -12],
  'Chatkal placer gold': [71.15, 41.76, 0.42, 0.08, -10],
};
export const RESOURCE_POINTS = {
  'Nurzhan Gas Compressor Station': place('nurzhan-gas-compressor'),
  'Lihua gas-fired plant': place('lihua-spinning-complex'),
  'Kara-Suu station': place('kara-suu-hps'),
  'Talas Solar Park': place('talas-solar-park'),
  'Tash-Kömür coal mines': place('tash-komur-coal-mines'),
  'Mailuu-Suu tailings': place('mailuu-suu-tailings'),
};
export const GAS_LINE_MUYUNKUM = route('muyunkum-gas-line');
// High-voltage export lines from the Toktogul switchyard (Kartalar: north along the State Route 1 corridor to Talas
// and the Kazakh grid, south down the Naryn cascade toward Uzbekistan).
export const HV_LINES = {
  north: route('toktogul-north-export-line'),
  south: route('toktogul-south-export-line'),
};
