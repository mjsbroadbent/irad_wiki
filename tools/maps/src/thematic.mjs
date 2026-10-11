// Thematic maps of Irad. Each block writes one SVG into images/. Facts come from the wiki articles named
// in each block's comment; positions of invented features are in common.mjs (FEATURES, PLACES).
import { d3, toD3, FEATURES, PLACES } from './common.mjs';
import { writeSvg, label, WP, esc } from './svg.mjs';
import { makeMap, SW } from './base.mjs';

const ISEZ_FILL = '#fbe2c4', ATR_FILL = '#dbe9d2', LINE = '#c0392b';
const only = process.argv.slice(2);
const want = name => !only.length || only.includes(name);

// Small symbols.
const sym = {
  checkpoint: (x, y) => `<rect x="${(x - 4).toFixed(1)}" y="${(y - 4).toFixed(1)}" width="8" height="8" fill="${LINE}" stroke="#fff" stroke-width="1" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})"/>`,
  un: (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="#4b92db" stroke="#fff" stroke-width="1.2"/><text x="${x.toFixed(1)}" y="${(y + 2.6).toFixed(1)}" font-size="6.5" font-weight="bold" text-anchor="middle" fill="#fff">UN</text>`,
  pass: (x, y) => `<path d="M${(x - 5).toFixed(1)},${(y + 3).toFixed(1)} L${x.toFixed(1)},${(y - 4).toFixed(1)} L${(x + 5).toFixed(1)},${(y + 3).toFixed(1)}" fill="none" stroke="${WP.text}" stroke-width="1.6"/>`,
  dam: (x, y) => `<rect x="${(x - 6).toFixed(1)}" y="${(y - 2).toFixed(1)}" width="12" height="4" fill="${WP.text}"/>`,
  power: (x, y, fill = '#f2b705') => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${fill}" stroke="${WP.text}" stroke-width="1"/><path d="M${(x + 0.8).toFixed(1)},${(y - 3.4).toFixed(1)} L${(x - 1.8).toFixed(1)},${(y + 0.6).toFixed(1)} L${(x + 0.2).toFixed(1)},${(y + 0.6).toFixed(1)} L${(x - 0.8).toFixed(1)},${(y + 3.4).toFixed(1)} L${(x + 1.8).toFixed(1)},${(y - 0.6).toFixed(1)} L${(x - 0.2).toFixed(1)},${(y - 0.6).toFixed(1)}Z" fill="${WP.text}"/>`,
};
const at = (m, name) => m.xy(...FEATURES[name]);
const callout = (x, y, dx, dy, text, opts = {}) => {
  const tx = x + dx, ty = y + dy;
  const anchor = dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle';
  return (Math.hypot(dx, dy) > 18 ? `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(tx - Math.sign(dx) * 2).toFixed(1)}" y2="${(ty - 4).toFixed(1)}" stroke="#555" stroke-width="0.7"/>` : '')
    + label(tx, ty, text, { size: 11.5, anchor, ...opts });
};
const zoneFills = m => `<path d="${m.P(toD3(m.g.atr))}" fill="${ATR_FILL}"/><path d="${m.P(toD3(m.g.isez))}" fill="${ISEZ_FILL}"/>`;

// ---------- Qara-Chik Demarcation Line (Qara-Chik Demarcation Line; Bishkek Ceasefire Agreement) ----------
if (want('qarachik')) {
  const W = 1000, H = 960;
  const m = makeMap({ W, H, frame: [[69.55, 40.95], [75.35, 44.85]] });
  const zonePx = 24 / m.kmPerPx;   // 12 km on each side of the line
  const feat = [];
  const [cx, cy] = at(m, 'Qara-Chik checkpoint'); feat.push(sym.checkpoint(cx, cy), callout(cx, cy, 40, 30, 'Qara-Chik checkpoint', { weight: 'bold' }));
  const [kx, ky] = at(m, 'Kara-Oi'); feat.push(sym.un(kx, ky), callout(kx, ky, -20, -96, 'Kara-Oi: UNMI HQ and Joint Liaison Committee'));
  const [tx, ty] = m.xy(72.22, 41.35); feat.push(sym.un(tx + 10, ty), callout(tx + 10, ty, -60, 40, 'UNMI Naryn sector HQ'));
  const [px, py] = at(m, 'Kenkol Pass'); feat.push(sym.pass(px, py), callout(px, py, -30, 24, 'Kenkol Pass'));
  const [gx, gy] = at(m, 'Fergana Gateway'); feat.push(sym.pass(gx, gy), callout(gx, gy, 44, -6, 'Fergana Gateway (2,480 m)'));
  const [dx, dy] = at(m, 'Toktogul dam'); feat.push(sym.dam(dx, dy), callout(dx, dy, 60, -18, 'Toktogul dam (tribal side)'));
  const [sx, sy] = at(m, 'Toktogul switchyard'); feat.push(sym.power(sx, sy), callout(sx, sy, 64, 14, 'Switchyard and dispatch (ISEZ)'));

  const sectors = [['Western sector', 70.75, 43.35, -70], ['Central sector', 71.75, 42.18, -4], ['Southern (Naryn) sector', 72.0, 41.8, -62],
    ['Northern sector', 72.9, 43.95, -24]].map(([t, lon, lat, rot]) => m.tilted(t, lon, lat, rot, { size: 12.5, weight: 'bold', fill: LINE, spacing: 0.5 })).join('');
  const zones = [['ISEZ', 73.6, 43.2], ['ATR', 72.3, 44.55], ['ATR', 70.3, 43.15], ['ATR', 73.3, 42.05], ['ATR', 73.15, 41.25]]
    .map(([t, lon, lat]) => { const [x, y] = m.xy(lon, lat); return label(x, y, t, { size: 16, weight: 'bold', fill: '#7a7a7a', spacing: 3 }); }).join('');

  const legend = m.legend(14, 14, 316, [
    [SW.box(ISEZ_FILL), 'Irad Special Economic Zone (ISEZ)'],
    [SW.box(ATR_FILL), 'Autonomous Tribal Regions (ATR)'],
    [SW.line(LINE, 1.8, '6 3'), 'Qara-Chik Demarcation Line'],
    [`<rect x="0" y="0" width="20" height="12" fill="${LINE}" fill-opacity="0.16"/>`, 'Restricted-weapons zone (12 km each side)'],
    [`<g transform="translate(10 6)">${sym.checkpoint(0, 0)}</g>`, 'Main crossing (one of 12 checkpoints)'],
    [`<g transform="translate(10 6)">${sym.un(0, 0)}</g>`, 'UNMI headquarters'],
    [`<g transform="translate(10 7)">${sym.pass(0, 0)}</g>`, 'Mountain pass'],
    [`<g transform="translate(10 6)">${sym.dam(0, 0)}</g>`, 'Dam'],
    [SW.line(WP.border, 1.8), 'International boundary'],
  ], 'Qara-Chik Demarcation Line');

  writeSvg('Qara-Chik_Demarcation_Line_map.svg', W, H, `${m.base()}
${zoneFills(m)}
${m.graticule()}
${m.water()}
${m.clipIrad()}
<path id="restricted-zone" d="${m.P(m.qaraChikLine())}" fill="none" stroke="${LINE}" stroke-opacity="0.16" stroke-width="${zonePx.toFixed(1)}" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#inside-irad)"/>
${m.qaraChik({ width: 1.9 })}
${m.iradBorder()}
<g id="zones">${zones}</g>
<g id="sectors">${sectors}</g>
${m.neighbourNames([['Kazakhstan', 74.3, 44.6], ['Kyrgyzstan', 74.3, 42.35], ['Kyrgyzstan', 73.9, 41.05], ['Uzbekistan', 70.6, 41.05], ['Kazakhstan', 69.95, 42.05]])}
${m.places({ only: ['Talas', 'Nurzhan', 'Boz-Korgon', 'Iyık Janyl', 'Tash-Kömür', 'Toktogul', 'Mailuu-Suu'],
    offsets: { 'Talas': [0, -11], 'Nurzhan': [-8, -9], 'Boz-Korgon': [0, 17], 'Iyık Janyl': [10, -7], 'Tash-Kömür': [-8, 14],
    'Toktogul': [8, -8], 'Mailuu-Suu': [8, 14] } })}
<g id="features">${feat.join('')}</g>
${legend}
${m.scaleBar(30, H - 26, 50)}`, {
    title: 'Qara-Chik Demarcation Line',
    desc: 'The 2007 ceasefire line between the ISEZ and the Autonomous Tribal Regions, with its four UNMI sectors, the 12 km restricted-weapons zone, the main crossing and UN headquarters. Base map: Natural Earth (public domain).',
  });
}

// ---------- The Naryn corridor (Toktogul Hydroelectric Complex; Naryn Water and Power Protocol;
// Fergana Mountain Transit Highway; Fergana Gateway; Tash-Kömür) ----------
if (want('naryn')) {
  const { HIGHWAY_SR1, BRANCH_IYIK_JANYL } = await import('./common.mjs');
  const W = 900, H = 1000;
  const m = makeMap({ W, H, frame: [[71.55, 40.98], [73.35, 42.62]], tol: 0.25 });
  const ROAD = '#b5541b';
  const D = m.g.districts;
  const fills = `<path d="${m.P(toD3(m.g.atr))}" fill="${ATR_FILL}"/>
<path d="${m.P(toD3(m.g.isez))}" fill="#f8d3b0"/><path d="${m.P(toD3(D['Talas District']))}" fill="#f8d3b0"/><path d="${m.P(toD3(D['Kara-Buura District']))}" fill="#f8d3b0"/>
<path d="${m.P(toD3(D['Sary-Bulak District']))}" fill="#f5c09a"/><path d="${m.P(toD3(D['Lower Naryn District']))}" fill="#f3b5a8"/>`;
  const road = `<path d="${m.P({ type: 'LineString', coordinates: HIGHWAY_SR1 })}" fill="none" stroke="#fff" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
<path d="${m.P({ type: 'LineString', coordinates: HIGHWAY_SR1 })}" fill="none" stroke="${ROAD}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
<path d="${m.P({ type: 'LineString', coordinates: BRANCH_IYIK_JANYL })}" fill="none" stroke="${ROAD}" stroke-width="1.8" stroke-dasharray="4 2" stroke-linecap="round"/>`;
  const f = [];
  const put = (name, s, dx, dy, text, opts) => { const [x, y] = at(m, name); f.push(s(x, y), callout(x, y, dx, dy, text ?? name, opts)); };
  put('Toktogul dam', sym.dam, 46, -40, 'Toktogul dam, 1,200 MW (tribal side)', { weight: 'bold' });
  put('Toktogul switchyard', (x, y) => sym.power(x, y, '#fff'), 40, 34, 'Switchyard and dispatch center (ISEZ)', { weight: 'bold' });
  put('Kurpsai station', sym.power, -30, -26, 'Kurpsai station');
  put('Tash-Kömür station', sym.power, -50, -16, 'Tash-Kömür station');
  put('Shamaldy-Say station', sym.power, 60, 16, 'Shamaldy-Say station');
  put('Uch-Kurgan station', sym.power, 60, 22, 'Uch-Kurgan station');
  put('Fergana Gateway', sym.pass, 60, -4, 'Fergana Gateway, 2,480 m');
  put('Otmek Tunnel', (x, y) => `<rect x="${(x - 5).toFixed(1)}" y="${(y - 2.5).toFixed(1)}" width="10" height="5" fill="#555" transform="rotate(-50 ${x.toFixed(1)} ${y.toFixed(1)})"/>`, 60, -10, 'Otmek Tunnel (2.2 km)');
  put('Kara-Suu Canyon', () => '', 56, 4, 'Kara-Suu Canyon', { style: 'italic' });
  put('Sary-Bulak mine', (x, y) => `<path d="M${x - 4},${y - 4}L${x + 4},${y + 4}M${x + 4},${y - 4}L${x - 4},${y + 4}" stroke="${WP.text}" stroke-width="2"/>`, -40, 26, 'Sary-Bulak Antimony Works');
  put('Chatkal smelter', (x, y) => `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" fill="${WP.text}"/>`, -30, -18, 'Chatkal smelter');
  put('Qara-Chik checkpoint', sym.checkpoint, 54, -16, 'Qara-Chik checkpoint');
  put('Kara-Köl', (x, y) => m.marker(x, y, 'town'), 30, 4, 'Kara-Köl');
  const [ux, uy] = m.xy(72.22, 41.35); f.push(sym.un(ux - 12, uy + 4), callout(ux - 12, uy + 4, -40, 30, 'UNMI Naryn sector HQ'));
  const [kx, ky] = at(m, 'Kara-Oi'); f.push(sym.un(kx, ky), callout(kx, ky, -40, -22, 'Kara-Oi (UNMI HQ)'));

  const names = [['Talas Alatau', 72.95, 42.2, -10], ['Chatkal Range', 71.85, 41.95, -35], ['Fergana Range', 73.05, 41.3, -55],
    ['Fergana Valley', 71.95, 41.03, 0], ['Toktogul basin', 73.0, 41.95, 0]].map(([t, lon, lat, r]) => m.tilted(t, lon, lat, r, { size: 13, style: 'italic', fill: '#6b4f2a', spacing: 1.5 })).join('');
  const water = [['Naryn', 72.9, 41.66, 20], ['Toktogul Reservoir', 72.93, 41.8, -18], ['Talas', 72.75, 42.47, -2]]
    .map(([t, lon, lat, r]) => m.tilted(t, lon, lat, r, { size: 11.5, style: 'italic', fill: WP.waterLine })).join('');
  const dist = [['Sary-Bulak District', 72.0, 42.26], ['Lower Naryn District', 71.93, 41.24], ['Talas District', 72.75, 42.62]]
    .map(([t, lon, lat]) => { const [x, y] = m.xy(lon, lat); return label(x, y, t, { size: 12, weight: 'bold', fill: '#7a3b2e' }); }).join('');
  const zl = [['ATR', 72.9, 42.08], ['ATR', 71.62, 41.3], ['ATR', 73.15, 41.42], ['ATR', 72.85, 41.15]]
    .map(([t, lon, lat]) => { const [x, y] = m.xy(lon, lat); return label(x, y, t, { size: 15, weight: 'bold', fill: '#7a7a7a', spacing: 3 }); }).join('');

  const legend = m.legend(14, 430, 290, [
    [SW.box('#f5c09a'), 'Sary-Bulak District (ISEZ)'],
    [SW.box('#f3b5a8'), 'Lower Naryn District (ISEZ)'],
    [SW.box(ATR_FILL), 'Autonomous Tribal Regions'],
    [SW.line(LINE, 1.8, '6 3'), 'Qara-Chik Demarcation Line'],
    [SW.line(ROAD, 3), 'Fergana Mountain Transit Highway'],
    [SW.line(ROAD, 1.8, '4 2'), 'Branch road to Iyık Janyl'],
    [`<g transform="translate(10 6)">${sym.power(0, 0)}</g>`, 'Power station'],
    [`<g transform="translate(10 6)">${sym.dam(0, 0)}</g>`, 'Dam'],
    [`<g transform="translate(10 7)">${sym.pass(0, 0)}</g>`, 'Pass'],
    [`<g transform="translate(10 6)">${sym.checkpoint(0, 0)}</g>`, 'Checkpoint'],
    [`<g transform="translate(10 6)">${sym.un(0, 0)}</g>`, 'UNMI headquarters'],
  ], 'The Naryn corridor');

  writeSvg('Naryn_corridor_map.svg', W, H, `${m.base()}
${fills}
${m.graticule(0.5)}
${m.water({ width: 1.6 })}
${m.clipIrad()}
${m.qaraChik({ width: 1.9 })}
${m.iradBorder()}
${road}
<g id="names">${names}${water}${dist}${zl}</g>
${m.neighbourNames([['Kyrgyzstan', 73.15, 42.5], ['Uzbekistan', 71.3, 41.08]], 14)}
${m.places({ only: ['Talas', 'Iyık Janyl', 'Tash-Kömür', 'Toktogul', 'Mailuu-Suu'], size: 1.05,
    offsets: { 'Talas': [0, -12], 'Iyık Janyl': [10, 14], 'Tash-Kömür': [10, 12], 'Toktogul': [10, -6], 'Mailuu-Suu': [10, 14] } })}
<g id="features">${f.join('')}</g>
${legend}
${m.scaleBar(W - 250, H - 26, 20)}`, {
    title: 'The Naryn corridor',
    desc: 'The ISEZ corridor from Talas over the Fergana Gateway to the Lower Naryn salient: the Fergana Mountain Transit Highway, the divided Toktogul complex, the downstream Naryn cascade, Tash-Kömür and Iyık Janyl. Base map: Natural Earth (public domain).',
  });
}

// Shared line styles for the transport and resource maps.
const ROAD_C = '#b5541b', RAIL_C = '#3a3a3a', PIPE_C = '#7b3fa0';
const line = (m, c) => m.P({ type: 'LineString', coordinates: c });
const roadPath = (m, c, w = 2.8) => `<path d="${line(m, c)}" fill="none" stroke="#fff" stroke-width="${w + 2.4}" stroke-linejoin="round" stroke-linecap="round"/><path d="${line(m, c)}" fill="none" stroke="${ROAD_C}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const railPath = (m, c) => `<path d="${line(m, c)}" fill="none" stroke="${RAIL_C}" stroke-width="3.4" stroke-linejoin="round"/><path d="${line(m, c)}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 5" stroke-linejoin="round"/>`;
const pipePath = (m, c, col = PIPE_C) => `<path d="${line(m, c)}" fill="none" stroke="${col}" stroke-width="1.8" stroke-dasharray="7 2 1.5 2" stroke-linejoin="round"/>`;
sym.crossing = (x, y) => `<rect x="${(x - 5.5).toFixed(1)}" y="${(y - 5.5).toFixed(1)}" width="11" height="11" fill="#1f4e9a" stroke="#fff" stroke-width="1.2"/><path d="M${(x - 3).toFixed(1)},${y.toFixed(1)} h6 M${(x + 1).toFixed(1)},${(y - 2.5).toFixed(1)} l2,2.5 l-2,2.5" fill="none" stroke="#fff" stroke-width="1.2"/>`;
sym.plane = (x, y) => `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="7" fill="#fff" stroke="${WP.text}" stroke-width="1"/><path d="M0,-5 L0.9,-1.5 L5,0.6 L5,1.6 L0.9,0.6 L0.6,3.4 L1.9,4.4 L1.9,5 L0,4.4 L-1.9,5 L-1.9,4.4 L-0.6,3.4 L-0.9,0.6 L-5,1.6 L-5,0.6 L-0.9,-1.5 Z" fill="${WP.text}"/></g>`;
sym.square = (x, y, fill = WP.text) => `<rect x="${(x - 3.5).toFixed(1)}" y="${(y - 3.5).toFixed(1)}" width="7" height="7" fill="${fill}" stroke="#fff" stroke-width="0.8"/>`;
const arrowText = (x, y, text, dir = 'right', opts = {}) => label(x, y, dir === 'right' ? `${text} →` : `← ${text}`, { size: 11, anchor: dir === 'right' ? 'start' : 'end', style: 'italic', fill: '#444', ...opts });

// ---------- Transport (Transport in Irad; Trans-Talas Highway; Northern Border Demarcation Protocol) ----------
if (want('transport')) {
  const { HIGHWAY_SR1, BRANCH_IYIK_JANYL, RAIL, ROADS, PIPELINES, TRANSPORT_POINTS: T } = await import('./common.mjs');
  const W = 1000, H = 800;
  const m = makeMap({ W, H, frame: [[69.3, 41.0], [75.75, 44.15]] });
  const p = name => m.xy(...T[name]);
  const f = [];
  // International crossings (2008 protocol).
  { const [x, y] = p('Talas North Terminal'); f.push(sym.crossing(x, y), callout(x, y, 10, -40, 'Talas North Terminal (rail and road)', { weight: 'bold' })); }
  { const [x, y] = p('Chu Gate'); f.push(sym.crossing(x, y), callout(x, y, 24, 14, 'Chu Gate', { weight: 'bold' })); }
  { const [x, y] = p('Kum-Shagyl'); f.push(sym.crossing(x, y), callout(x, y, 22, 4, 'Kum-Shagyl', { weight: 'bold' })); }
  { const [x, y] = p('Rail border station'); f.push(sym.square(x, y), callout(x, y, 22, 10, 'Rail border station')); }
  // Qara-Chik crossing, passes, airfields, pipeline ends.
  { const [x, y] = at(m, 'Qara-Chik checkpoint'); f.push(sym.checkpoint(x, y), callout(x, y, 40, 12, 'Qara-Chik checkpoint')); }
  { const [x, y] = p('Kök-Bel Pass'); f.push(sym.pass(x, y), callout(x, y, 30, -4, 'Kök-Bel Pass (2,375 m, summer)')); }
  { const [x, y] = at(m, 'Fergana Gateway'); f.push(sym.pass(x, y), callout(x, y, 36, -2, 'Fergana Gateway (2,480 m)')); }
  { const [x, y] = at(m, 'Otmek Tunnel'); f.push(`<rect x="${(x - 4).toFixed(1)}" y="${(y - 1.6).toFixed(1)}" width="8" height="3.2" fill="${WP.text}" transform="rotate(60 ${x.toFixed(1)} ${y.toFixed(1)})"/>`, callout(x, y, 36, 6, 'Otmek Tunnel')); }
  { const [x, y] = at(m, 'Talas Air Base'); f.push(sym.plane(x, y), callout(x, y, -26, 28, 'Talas Air Base', { weight: 'bold' })); }
  { const [x, y] = p('Tash-Kömür airstrip'); f.push(sym.plane(x - 12, y + 4), callout(x - 12, y + 4, -26, 18, 'Tash-Kömür airstrip')); }
  { const [x, y] = p('Feeder metering station'); f.push(sym.square(x, y, PIPE_C), callout(x, y, 22, -6, 'Metering station')); }
  { const [x, y] = p('Oil field collection station'); f.push(sym.square(x, y, PIPE_C), callout(x, y, -18, -16, 'Chu oil fields')); }
  { const [x, y] = at(m, 'Nurzhan Refinery No. 1'); f.push(sym.square(x, y, PIPE_C)); }
  { const [x, y] = at(m, 'Sary-Bulak mine'); f.push(sym.square(x, y, '#777'), callout(x, y, 30, 6, 'Sary-Bulak Antimony Works', { size: 10.5 })); }
  { const [x, y] = at(m, 'Chatkal smelter'); f.push(sym.square(x, y, '#777'), callout(x, y, -24, 18, 'Chatkal smelter', { size: 10.5 })); }

  // Route names.
  const names = [
    ['Trans-Talas Highway', 70.75, 42.55, -6], ['Turksib', 70.55, 42.72, 8],
    ['Talas–Nurzhan railway and road', 72.95, 43.13, 7],
    ['State Route 1', 72.25, 42.06, 66],
    ['Northern Export Feeder', 74.48, 43.6, -22], ['Nurzhan Petroleum Pipeline', 73.35, 43.58, 12],
    ['jet fuel line', 72.9, 42.88, 22],
  ].map(([t, lon, lat, rot]) => m.tilted(t, lon, lat, rot, { size: 11, style: 'italic', fill: t.includes('ipe') || t.includes('Feeder') || t.includes('fuel') ? PIPE_C : t === 'Turksib' || t.includes('railway') ? RAIL_C : ROAD_C })).join('');
  const zl = [['ISEZ', 73.9, 43.75], ['ATR', 72.5, 43.9], ['ATR', 70.5, 43.3], ['ATR', 71.2, 41.9], ['ATR', 73.6, 41.62], ['ATR', 70.4, 42.25]]
    .map(([t, lon, lat]) => { const [x, y] = m.xy(lon, lat); return label(x, y, t, { size: 15, weight: 'bold', fill: '#7a7a7a', spacing: 3 }); }).join('');
  // Off-map destinations.
  const [shx, shy] = m.xy(69.6, 42.55), [ex, ey] = m.xy(75.05, 43.48), [bx, by] = m.xy(74.59, 42.87), [ux, uy] = m.xy(72.1, 41.07);
  const [ax, ay] = m.xy(75.02, 43.56); const dest = arrowText(ax + 22, ay + 26, 'to Almaty', 'right')
    + label(ux - 30, uy + 16, 'to Uzbek Fergana Valley ↓', { size: 11, style: 'italic', fill: '#444' });

  const legend = m.legend(W - 276, H - 300, 262, [
    [SW.box(ISEZ_FILL), 'ISEZ'],
    [SW.box(ATR_FILL), 'Autonomous Tribal Regions'],
    [SW.line(LINE, 1.6, '6 3'), 'Qara-Chik Demarcation Line'],
    [`<path d="M0,6 H20" stroke="${RAIL_C}" stroke-width="3.4"/><path d="M0,6 H20" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 5"/>`, 'Railway (1,520 mm)'],
    [`<path d="M0,6 H20" stroke="#fff" stroke-width="5.2"/><path d="M0,6 H20" stroke="${ROAD_C}" stroke-width="2.8"/>`, 'Main highway'],
    [SW.line(ROAD_C, 1.6, '4 2'), 'Other road or track'],
    [SW.line(PIPE_C, 1.8, '7 2 1.5 2'), 'Oil or fuel pipeline'],
    [`<g transform="translate(10 6)">${sym.crossing(0, 0)}</g>`, 'Crossing to Kazakhstan (2008)'],
    [`<g transform="translate(10 6)">${sym.checkpoint(0, 0)}</g>`, 'Main Qara-Chik crossing'],
    [`<g transform="translate(10 6)">${sym.plane(0, 0)}</g>`, 'Airfield'],
    [`<g transform="translate(10 7)">${sym.pass(0, 0)}</g>`, 'Mountain pass'],
    [`<g transform="translate(10 6)">${sym.square(0, 0, PIPE_C)}</g>`, 'Oil facility'],
    [`<g transform="translate(10 6)">${sym.square(0, 0, '#777')}</g>`, 'Mine or plant with rail spur'],
  ], 'Transport in Irad');

  writeSvg('Transport_in_Irad_map.svg', W, H, `${m.base()}
${zoneFills(m)}
${m.graticule()}
${m.water()}
${m.qaraChik({ width: 1.6 })}
${m.iradBorder()}
<g id="zones">${zl}</g>
<g id="pipelines">${Object.values(PIPELINES).map(c => pipePath(m, c)).join('')}</g>
<g id="minor-roads" fill="none" stroke="${ROAD_C}" stroke-width="1.6" stroke-dasharray="4 2">
<path d="${line(m, ROADS['Trans-Talas track'])}"/><path d="${line(m, BRANCH_IYIK_JANYL)}"/><path d="${line(m, ROADS['Kök-Bel road'])}"/></g>
<g id="roads">${['Trans-Talas Highway', 'Talas–Nurzhan road', 'Chu highway'].map(k => roadPath(m, ROADS[k])).join('')}${roadPath(m, HIGHWAY_SR1)}</g>
<g id="railways">${Object.values(RAIL).map(c => railPath(m, c)).join('')}</g>
<g id="route-names">${names}</g>
${m.neighbourNames([['Kazakhstan', 75.35, 44.0], ['Kazakhstan', 69.6, 42.95], ['Kyrgyzstan', 74.4, 42.4], ['Uzbekistan', 70.3, 41.2]])}
${m.places({ foreign: ['Shymkent', 'Bishkek', 'Namangan', 'Andijan'], only: ['Talas', 'Nurzhan', 'Boz-Korgon', 'Iyık Janyl', 'Tash-Kömür', 'Kyzyl-Adyr', 'Toktogul'],
    offsets: { 'Talas': [10, -9], 'Nurzhan': [-6, -11], 'Boz-Korgon': [0, 17], 'Iyık Janyl': [10, 4], 'Tash-Kömür': [-10, 4],
    'Kyzyl-Adyr': [-2, 16], 'Toktogul': [8, -7] } })}
<g id="features">${f.join('')}</g>
${dest}
${legend}
${m.scaleBar(30, H - 22, 50)}`, {
    title: 'Transport in Irad',
    desc: 'Railways, main highways, pipelines, airfields and the three crossings into Kazakhstan set up by the 2008 Northern Border Demarcation Protocol. Base map: Natural Earth (public domain).',
  });
}

// ---------- Energy and resources (Energy in Irad; Economy of Irad) ----------
if (want('energy')) {
  const { HIGHWAY_SR1, RESOURCE_AREAS: RA, RESOURCE_POINTS: RP, GAS_LINE_MUYUNKUM, HV_LINES, PIPELINES, TRANSPORT_POINTS: T } = await import('./common.mjs');
  const W = 1000, H = 880;
  const m = makeMap({ W, H, frame: [[69.3, 41.0], [75.75, 44.85]] });
  const OIL = '#5b3a1a', GAS = '#d9822b', URAN = '#c9b200', GOLD = '#d4a017', HV = '#8e44ad', HYDRO = '#2a7fc1';
  const ellipse = ([lon, lat, rx, ry, rot]) => {
    const k = Math.cos(lat * Math.PI / 180), r = rot * Math.PI / 180, ring = [];
    for (let i = 0; i <= 48; i++) {
      const a = 2 * Math.PI * i / 48, x = rx * Math.cos(a), y = ry * Math.sin(a);
      ring.push([lon + (x * Math.cos(r) - y * Math.sin(r)) / k, lat + x * Math.sin(r) + y * Math.cos(r)]);
    }
    return m.P({ type: 'Polygon', coordinates: [ring.reverse()] });
  };
  const pts = n => m.xy(...RP[n]);
  const defs = `<defs>
<pattern id="hatch-u" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${URAN}" fill-opacity="0.12"/><line x1="0" y1="0" x2="0" y2="6" stroke="${URAN}" stroke-width="1.6"/></pattern>
<pattern id="dots-g" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="${GOLD}" fill-opacity="0.15"/><circle cx="3.5" cy="3.5" r="1.3" fill="${GOLD}"/></pattern></defs>`;
  const areas = [
    ...['Main Chu oil field (1949)', 'Western oil fields', 'Northern oil fields'].map(n => `<path d="${ellipse(RA[n])}" fill="${OIL}" fill-opacity="0.55" stroke="${OIL}" stroke-width="1"/>`),
    `<path d="${ellipse(RA['Muyunkum gas field'])}" fill="${GAS}" fill-opacity="0.25" stroke="${GAS}" stroke-width="1.4" stroke-dasharray="5 3"/>`,
    `<path d="${ellipse(RA['Uranium-bearing sandstones'])}" fill="url(#hatch-u)" stroke="${URAN}" stroke-width="1" stroke-dasharray="5 3"/>`,
    `<path d="${ellipse(RA['Chatkal placer gold'])}" fill="url(#dots-g)" stroke="${GOLD}" stroke-width="1" stroke-dasharray="5 3"/>`,
  ].join('');
  const lab = (n, dx, dy, text, opts = {}) => { const [x, y] = m.xy(RA[n][0], RA[n][1]); return label(x + dx, y + dy, text, { size: 11.5, ...opts }); };
  const areaLabels = [
    lab('Main Chu oil field (1949)', -70, -22, 'Chu oil fields', { weight: 'bold', fill: OIL }),
    lab('Muyunkum gas field', 0, -18, 'Muyunkum gas field (undeveloped)', { weight: 'bold', fill: '#a35a14' }),
    lab('Uranium-bearing sandstones', 0, 4, 'Uranium-bearing sandstones (unworked)', { style: 'italic', fill: '#6b5f00' }),
    lab('Chatkal placer gold', 0, 24, 'Chatkal valley: placer gold (unworked)', { style: 'italic', fill: '#8a6500' }),
  ].join('');

  const f = [];
  // Hydro.
  { const [x, y] = at(m, 'Toktogul dam'); f.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${HYDRO}" stroke="#fff" stroke-width="1.4"/>`, sym.dam(x, y), callout(x, y, 26, 6, 'Toktogul dam, 1,200 MW (ATR)', { weight: 'bold', size: 11 })); }
  for (const n of ['Kurpsai station', 'Tash-Kömür station', 'Shamaldy-Say station', 'Uch-Kurgan station']) {
    const [x, y] = at(m, n); f.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${HYDRO}" stroke="#fff" stroke-width="1"/>`);
  }
  { const [x, y] = at(m, 'Shamaldy-Say station'); f.push(callout(x, y, -40, 26, 'Naryn cascade (4 stations)', { size: 10.5 })); }
  { const [x, y] = at(m, 'Toktogul switchyard'); f.push(sym.power(x, y, '#fff'), callout(x, y, 40, 24, 'Switchyard and dispatch (ISEZ)')); }
  { const [x, y] = pts('Kara-Suu station'); f.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${HYDRO}" stroke="#fff" stroke-width="1"/>`, callout(x, y, 34, 8, 'Kara-Suu, 18 MW', { size: 10.5 })); }
  // Solar and thermal.
  { const [x, y] = pts('Talas Solar Park'); f.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="#f2b705" stroke="${WP.text}" stroke-width="1"/>`, callout(x, y, 30, -24, 'Talas Solar Park, 50 MW', { size: 10.5 })); }
  { const [x, y] = pts('Lihua gas-fired plant'); f.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${GAS}" stroke="${WP.text}" stroke-width="1"/>`); }
  // Oil and gas plant.
  { const [x, y] = at(m, 'Nurzhan Refinery No. 1'); f.push(sym.square(x + 6, y + 2, OIL), callout(x + 6, y + 2, 34, 30, 'Nurzhan Refinery No. 1', { size: 10.5 })); }
  { const [x, y] = pts('Nurzhan Gas Compressor Station'); f.push(sym.square(x, y, GAS)); }
  { const [x, y] = m.xy(...T['Feeder metering station']); f.push(sym.square(x, y, OIL), callout(x, y, 22, -6, 'Metering station', { size: 10.5 })); }
  // Mining.
  const pick = (x, y, fill) => `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="6" fill="${fill}" stroke="${WP.text}" stroke-width="1"/><path d="M-3.2,-1.8 Q0,-4.2 3.2,-1.8 M0,-3 L0,3.6" fill="none" stroke="#fff" stroke-width="1.3"/></g>`;
  { const [x, y] = at(m, 'Sary-Bulak mine'); f.push(pick(x, y, '#6d6d6d'), callout(x, y, 34, 10, 'Sary-Bulak antimony mine', { size: 10.5 })); }
  { const [x, y] = at(m, 'Chatkal smelter'); f.push(sym.square(x, y, '#6d6d6d'), callout(x, y, -26, 14, 'Chatkal smelter', { size: 10.5 })); }
  { const [x, y] = pts('Tash-Kömür coal mines'); f.push(pick(x - 10, y - 2, '#222'), callout(x - 10, y - 2, -40, -22, 'Coal mines', { size: 10.5 })); }
  { const [x, y] = pts('Mailuu-Suu tailings'); f.push(`<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><path d="M0,-7 L6.5,5 L-6.5,5 Z" fill="${URAN}" stroke="${WP.text}" stroke-width="1"/><text y="3.6" font-size="8" font-weight="bold" text-anchor="middle" fill="${WP.text}">!</text></g>`, callout(x, y, 34, 22, 'Mailuu-Suu uranium tailings', { size: 10.5 })); }

  const legend = m.legend(W - 244, H - 386, 232, [
    [SW.box(ISEZ_FILL), 'ISEZ'], [SW.box(ATR_FILL), 'Autonomous Tribal Regions'],
    [SW.line(LINE, 1.6, '6 3'), 'Qara-Chik Demarcation Line'],
    [null, 'Resources'],
    [SW.box(OIL, OIL).replace('fill="' + OIL + '"', `fill="${OIL}" fill-opacity="0.55"`), 'Oil field (NurGaz)'],
    [`<rect width="20" height="12" fill="${GAS}" fill-opacity="0.25" stroke="${GAS}" stroke-dasharray="4 2"/>`, 'Gas field, undeveloped'],
    [`<rect width="20" height="12" fill="url(#hatch-u)" stroke="${URAN}"/>`, 'Uranium deposits, unworked'],
    [`<rect width="20" height="12" fill="url(#dots-g)" stroke="${GOLD}"/>`, 'Placer gold'],
    [`<g transform="translate(10 6)">${pick(0, 0, '#6d6d6d')}</g>`, 'Mine (black: coal)'],
    [`<g transform="translate(10 6)">${sym.square(0, 0, OIL)}</g>`, 'Oil or gas plant'],
    [null, 'Power'],
    [`<circle cx="10" cy="6" r="5" fill="${HYDRO}" stroke="#fff"/>`, 'Hydroelectric station'],
    [`<circle cx="10" cy="6" r="5" fill="#f2b705" stroke="${WP.text}"/>`, 'Solar park'],
    [`<circle cx="10" cy="6" r="4" fill="${GAS}" stroke="${WP.text}"/>`, 'Gas-fired plant'],
    [SW.line(HV, 1.6), 'Main high-voltage line'],
    [SW.line(OIL, 1.8, '7 2 1.5 2'), 'Oil pipeline'],
    [SW.line(GAS, 1.6, '3 2'), 'Gas line'],
    [`<g transform="translate(10 6)"><path d="M0,-6 L5.5,4.5 L-5.5,4.5 Z" fill="${URAN}" stroke="${WP.text}"/></g>`, 'Radioactive waste hazard'],
  ], 'Energy and resources');

  const zl = [['ISEZ', 74.6, 43.95], ['ATR', 70.5, 43.4], ['ATR', 70.4, 42.25], ['ATR', 73.75, 41.42], ['ATR', 74.6, 44.6]]
    .map(([t, lon, lat]) => { const [x, y] = m.xy(lon, lat); return label(x, y, t, { size: 15, weight: 'bold', fill: '#7a7a7a', spacing: 3 }); }).join('');

  writeSvg('Energy_and_resources_of_Irad_map.svg', W, H, `${defs}
${m.base()}
${zoneFills(m)}
${m.graticule()}
<g id="resource-areas">${areas}</g>
${m.water()}
${m.qaraChik({ width: 1.6 })}
${m.iradBorder()}
<g id="zones">${zl}</g>
<g id="power-lines" fill="none" stroke="${HV}" stroke-width="1.6" stroke-linejoin="round">${Object.values(HV_LINES).map(c => `<path d="${line(m, c)}"/>`).join('')}</g>
<g id="pipelines">${pipePath(m, PIPELINES['Northern Export Feeder'], OIL)}${pipePath(m, PIPELINES['Nurzhan Petroleum Pipeline'], OIL)}
<path d="${line(m, GAS_LINE_MUYUNKUM)}" fill="none" stroke="${GAS}" stroke-width="1.6" stroke-dasharray="3 2"/></g>
<g id="area-labels">${areaLabels}</g>
${m.neighbourNames([['Kazakhstan', 75.35, 44.3], ['Kazakhstan', 69.6, 42.95], ['Kyrgyzstan', 73.65, 42.47], ['Uzbekistan', 70.3, 41.2]])}
${m.places({ foreign: ['Shymkent', 'Bishkek', 'Namangan', 'Andijan'], only: ['Talas', 'Nurzhan', 'Iyık Janyl', 'Tash-Kömür', 'Toktogul', 'Kyzyl-Adyr'],
    offsets: { 'Talas': [-10, -9], 'Nurzhan': [-8, -9], 'Iyık Janyl': [10, 4], 'Tash-Kömür': [-12, 2], 'Kyzyl-Adyr': [-2, 16], 'Toktogul': [8, -7] } })}
<g id="features">${f.join('')}</g>
${legend}
${m.scaleBar(30, H - 22, 50)}`, {
    title: 'Energy and resources of Irad',
    desc: 'Oil and gas fields, mines, power stations, high-voltage lines and pipelines, showing which side of the Qara-Chik line each lies on. Base map: Natural Earth (public domain).',
  });
}

// ---------- Second Iradi Civil War, 2007 (Second Iradi Civil War; Storming of Talas (2007)) ----------
if (want('war2007')) {
  const { pc, clean, RAIL, HIGHWAY_SR1 } = await import('./common.mjs');
  const W = 1000, H = 800;
  const m = makeMap({ W, H, frame: [[69.3, 41.0], [75.75, 44.15]] });
  const FRONT = '#c7dfa4', TOK = '#a9c8ea', DRI = '#f6c08a', FRONT_A = '#3f7d20', TOK_A = '#1f4e9a';
  const poly = c => [[[...c, c[0]]]];
  const circle = ([lon, lat], km) => { const k = Math.cos(lat * Math.PI / 180), r = []; for (let i = 0; i < 40; i++) { const a = -2 * Math.PI * i / 40; r.push([lon + km / 111 / k * Math.cos(a), lat + km / 111 * Math.sin(a)]); } return poly(r); };
  const irad = m.g.irad;
  // Late May 2007: Toktarov holds Nurzhan, the oil fields and the export pipeline; the DRI is confined to Talas.
  const tok = clean(pc.intersection(irad, poly([[73.15, 43.83], [73.6, 44.02], [74.2, 43.98], [75.1, 43.85], [75.1, 43.1], [74.6, 43.08],
    [74.2, 43.12], [73.8, 43.25], [73.3, 43.48]])), 0.001);
  const dri = clean(pc.intersection(irad, circle([72.24, 42.52], 16)), 0.001);
  const front = clean(pc.difference(irad, tok, dri), 0.001);
  const fills = `<path d="${m.P(toD3(front))}" fill="${FRONT}"/><path d="${m.P(toD3(tok))}" fill="${TOK}" stroke="${TOK_A}" stroke-width="1"/>
<path d="${m.P(toD3(dri))}" fill="${DRI}" stroke="#b5651d" stroke-width="1"/>`;

  // Arrows: a smooth path through the points with an arrowhead.
  const defs = `<defs>${[['f', FRONT_A], ['t', TOK_A]].map(([id, c]) => `<marker id="ah-${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="${c}"/></marker>`).join('')}</defs>`;
  const arrow = (pts, col, id, { w = 4, dash = '' } = {}) => {
    const p = pts.map(q => m.xy(...q));
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 1; i < p.length; i++) {
      if (i < p.length - 1) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; d += ` Q${p[i][0].toFixed(1)},${p[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`; }
      else d += ` L${p[i][0].toFixed(1)},${p[i][1].toFixed(1)}`;
    }
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="0.9" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#ah-${id})"/>`;
  };
  const arrows = [
    // Front columns invest Talas (from 22 April) and storm it on 4 June.
    arrow([[72.3, 42.2], [72.28, 42.33], [72.25, 42.44]], FRONT_A, 'f'),
    arrow([[72.85, 42.4], [72.55, 42.47], [72.36, 42.5]], FRONT_A, 'f'),
    arrow([[71.75, 42.38], [71.95, 42.45], [72.11, 42.5]], FRONT_A, 'f'),
    // Front withdraws to the countryside after the fall of the DRI.
    arrow([[72.18, 42.43], [71.9, 42.2], [71.6, 42.0]], FRONT_A, 'f', { w: 2.4, dash: '6 4' }),
    arrow([[72.4, 42.42], [72.75, 42.25], [73.05, 42.1]], FRONT_A, 'f', { w: 2.4, dash: '6 4' }),
    // DPI advances over the summer: Nurzhan to Talas, down the valley, over the Gateway to the Naryn salient.
    arrow([[74.0, 43.22], [73.3, 43.05], [72.75, 42.92], [72.42, 42.68]], TOK_A, 't'),
    arrow([[72.15, 42.6], [71.85, 42.62], [71.62, 42.66]], TOK_A, 't', { w: 3.2 }),
    arrow([[72.3, 42.3], [72.45, 42.15], [72.55, 41.95], [72.57, 41.72]], TOK_A, 't', { w: 3.2 }),
    arrow([[72.56, 41.6], [72.45, 41.52], [72.32, 41.45]], TOK_A, 't', { w: 3.2 }),
  ].join('');
  const cut = ([lon, lat]) => { const [x, y] = m.xy(lon, lat); return `<path d="M${x - 5},${y - 5} L${x + 5},${y + 5} M${x - 5},${y + 5} L${x + 5},${y - 5}" stroke="#b00" stroke-width="2.6"/>`; };
  const burst = ([lon, lat]) => { const [x, y] = m.xy(lon, lat); let d = ''; for (let i = 0; i < 16; i++) { const a = Math.PI * i / 8, r = i % 2 ? 4 : 9; d += `${i ? 'L' : 'M'}${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`; } return `<path d="${d}Z" fill="#e8b10b" stroke="#7a3d00" stroke-width="1"/>`; };
  const ev = [];
  { const [x, y] = m.xy(72.24, 42.52); ev.push(burst([72.24, 42.52]), callout(x, y, 96, 36, 'Storming of Talas, 4 June', { weight: 'bold' }), label(x + 96, y + 50, 'invested by the Front from 22 April', { size: 10.5, anchor: 'start', style: 'italic' })); }
  { const [x, y] = m.xy(74.15, 43.3); ev.push(callout(x, y, 30, 40, 'ISEZ proclaimed here, 25 February', { weight: 'bold' })); }
  { const [x, y] = at(m, 'Fergana Gateway'); ev.push(sym.pass(x, y), callout(x, y, 44, -4, 'Gateway blocked by the Front, May–July')); }
  { const [x, y] = at(m, 'Toktogul dam'); ev.push(burst(FEATURES['Toktogul dam']), callout(x, y, 50, 14, 'Toktogul: dam held by the Front,', {}), label(x + 50, y + 28, 'switchyard by the DPI', { size: 11.5, anchor: 'start' })); }
  const cuts = [[72.5, 42.98], [71.45, 42.75], [74.6, 43.47]].map(cut).join('');
  { const [x, y] = m.xy(72.5, 42.98); ev.push(label(x, y - 10, 'railway cut', { size: 10.5, style: 'italic', fill: '#b00' })); }

  const legend = m.legend(14, H - 262, 286, [
    [null, 'Late May 2007'],
    [SW.box(FRONT), 'Popular Front (Bektur)'],
    [SW.box(TOK, TOK_A), 'ISEZ emergency administration (Toktarov)'],
    [SW.box(DRI, '#b5651d'), 'DRI government (Orozbekov)'],
    [null, 'Movements'],
    [`<path d="M0,6 H14" stroke="${FRONT_A}" stroke-width="3.4"/><path d="M13,1 L20,6 L13,11 Z" fill="${FRONT_A}"/>`, 'Front attack, April–June'],
    [`<path d="M0,6 H14" stroke="${FRONT_A}" stroke-width="2.2" stroke-dasharray="4 3"/><path d="M13,2 L20,6 L13,10 Z" fill="${FRONT_A}"/>`, 'Front withdrawal, June–July'],
    [`<path d="M0,6 H14" stroke="${TOK_A}" stroke-width="3.4"/><path d="M13,1 L20,6 L13,11 Z" fill="${TOK_A}"/>`, 'DPI advance, summer'],
    [`<g transform="translate(10 6)">${burst([0, 0]).replace(/M[^Z]*Z/, '')}</g>` + `<path d="M4,1 L16,11 M4,11 L16,1" stroke="#fff" stroke-width="0"/>` + `<circle cx="10" cy="6" r="5" fill="#e8b10b" stroke="#7a3d00"/>`, 'Battle'],
    [`<path d="M5,1 L15,11 M5,11 L15,1" stroke="#b00" stroke-width="2.4"/>`, 'Railway cut by strikers and the Front'],
    [SW.line(LINE, 1.8, '6 3'), 'Ceasefire line, September 2007'],
    [SW.line(WP.border, 1.8), 'International boundary'],
  ], 'Second Iradi Civil War, 2007');

  writeSvg('Second_Iradi_Civil_War_map.svg', W, H, `${defs}
${m.base()}
${fills}
${m.graticule()}
${m.water()}
<g id="railways" opacity="0.7">${Object.values(RAIL).slice(0, 4).map(c => railPath(m, c)).join('')}</g>
<path d="${line(m, HIGHWAY_SR1)}" fill="none" stroke="#8a6d55" stroke-width="1.4"/>
${m.qaraChik({ width: 1.8 })}
${m.iradBorder()}
<g id="cuts">${cuts}</g>
<g id="arrows">${arrows}</g>
${m.neighbourNames([['Kazakhstan', 75.35, 44.0], ['Kazakhstan', 69.6, 42.95], ['Kyrgyzstan', 74.5, 42.5], ['Uzbekistan', 71.95, 41.04]])}
${m.places({ foreign: ['Shymkent', 'Bishkek'], only: ['Talas', 'Nurzhan', 'Iyık Janyl', 'Tash-Kömür', 'Kyzyl-Adyr'],
    offsets: { 'Talas': [-12, -10], 'Nurzhan': [-8, -10], 'Iyık Janyl': [10, 4], 'Tash-Kömür': [-10, 4], 'Kyzyl-Adyr': [-2, 16] } })}
<g id="events">${ev.join('')}</g>
${(() => { const [x, y] = m.xy(71.2, 43.75); return label(x, y, 'POPULAR FRONT', { size: 15, weight: 'bold', fill: FRONT_A, spacing: 2 }) + label(x, y + 17, 'rural interior, about two-thirds of the country', { size: 11, style: 'italic', fill: FRONT_A }); })()}
${legend}
${m.scaleBar(W - 250, H - 22, 50)}`, {
    title: 'Second Iradi Civil War, 2007',
    desc: 'The situation in late May 2007, the Storming of Talas on 4 June, the DPI takeover of the cities over the summer and the September 2007 ceasefire line. Base map: Natural Earth (public domain).',
  });
}

// ---------- First Iradi Civil War, 1992 (First Iradi Civil War; Battle of Kobozev Railhead (1992)) ----------
if (want('war1992')) {
  const { pc, clean, RAIL } = await import('./common.mjs');
  const W = 1000, H = 800;
  const m = makeMap({ W, H, frame: [[69.3, 41.0], [75.75, 44.15]] });
  const SRI = '#f1a9a0', PROV = '#a9c8ea', CLAN = '#c7dfa4', SRI_A = '#b03a2e', PROV_A = '#1f4e9a', CLAN_A = '#3f7d20';
  const poly = c => [[[...c, c[0]]]];
  const irad = m.g.irad;
  // Opening phase, March 1992. The SRI holds Kobozev, the Chu lowlands, the oil fields and the main railway; the
  // Provisional Government holds Talas and most of the Talas valley; clan horsemen hold the Talas Alatau and Chatkal valleys.
  const sri = clean(pc.intersection(irad, pc.union(
    poly([[71.1, 42.75], [71.0, 43.05], [71.5, 43.18], [72.3, 43.28], [73.0, 43.48], [73.5, 43.78], [74.1, 43.98], [75.1, 43.9], [75.1, 42.9],
      [74.4, 42.97], [73.8, 42.97], [73.2, 42.88], [72.5, 42.88], [71.9, 42.84], [71.5, 42.78]]),
    poly([[71.1, 42.75], [70.4, 42.55], [69.85, 42.55], [69.85, 42.8], [70.4, 42.82], [71.0, 42.97]]))), 0.001);
  const prov = clean(pc.difference(pc.intersection(irad, poly([[71.5, 42.78], [71.9, 42.84], [72.5, 42.88], [73.2, 42.85], [73.65, 42.62],
    [73.65, 42.4], [73.0, 42.38], [72.5, 42.33], [72.0, 42.36], [71.6, 42.45], [71.35, 42.62]])), sri), 0.001);
  const clan = clean(pc.difference(pc.intersection(irad, poly([[70.4, 42.5], [71.35, 42.62], [71.6, 42.45], [72.0, 42.36], [72.5, 42.33],
    [73.0, 42.38], [73.65, 42.4], [74.05, 42.25], [74.05, 41.85], [72.9, 41.78], [72.35, 41.62], [71.7, 41.3], [70.3, 41.35], [70.0, 41.9]])), pc.union(sri, prov)), 0.001);
  const fills = `<path d="${m.P(toD3(irad))}" fill="#fefee9"/><path d="${m.P(toD3(clan))}" fill="${CLAN}"/>
<path d="${m.P(toD3(sri))}" fill="${SRI}" stroke="${SRI_A}" stroke-width="0.8"/><path d="${m.P(toD3(prov))}" fill="${PROV}" stroke="${PROV_A}" stroke-width="0.8"/>`;
  const defs = `<defs>${[['s', SRI_A], ['p', PROV_A], ['c', CLAN_A], ['g', '#666']].map(([id, c]) => `<marker id="ah-${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="${c}"/></marker>`).join('')}</defs>`;
  const arrow = (pts, col, id, { w = 4, dash = '' } = {}) => {
    const p = pts.map(q => m.xy(...q));
    let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 1; i < p.length; i++) {
      if (i < p.length - 1) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; d += ` Q${p[i][0].toFixed(1)},${p[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`; }
      else d += ` L${p[i][0].toFixed(1)},${p[i][1].toFixed(1)}`;
    }
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="0.9" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#ah-${id})"/>`;
  };
  const arrows = [
    arrow([[74.0, 43.2], [73.2, 42.99], [72.4, 42.94], [71.6, 42.88], [71.52, 42.72], [71.85, 42.6], [72.1, 42.55]], SRI_A, 's', { w: 4.5 }),
    arrow([[71.95, 42.66], [71.6, 42.8], [72.2, 43.07], [73.0, 43.12], [73.45, 43.2]], SRI_A, 's', { w: 2.4, dash: '6 4' }),
    arrow([[72.1, 42.6], [71.72, 42.68], [71.68, 42.98], [72.4, 43.15], [73.2, 43.22], [73.75, 43.3]], PROV_A, 'p', { w: 4.5 }),
    arrow([[72.65, 42.62], [72.62, 42.8], [72.6, 42.9]], CLAN_A, 'c', { w: 2.6 }),
    arrow([[73.45, 42.68], [73.4, 42.85], [73.38, 42.95]], CLAN_A, 'c', { w: 2.6 }),
    arrow([[72.3, 42.42], [72.42, 42.15], [72.53, 41.85], [72.45, 41.5]], '#666', 'g', { w: 2.2, dash: '3 3' }),
  ].join('');
  const burst = ([lon, lat], r = 9) => { const [x, y] = m.xy(lon, lat); let d = ''; for (let i = 0; i < 16; i++) { const a = Math.PI * i / 8, rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`; } return `<path d="${d}Z" fill="#e8b10b" stroke="#7a3d00" stroke-width="1"/>`; };
  const ev = [];
  { const [x, y] = m.xy(72.24, 42.52); ev.push(burst([72.24, 42.52], 11), callout(x, y, 70, 46, 'Siege of Talas, 10 April – 18 June', { weight: 'bold' })); }
  { const [x, y] = at(m, 'Talas Air Base'); ev.push(sym.plane(x - 4, y + 2), callout(x - 4, y + 2, -30, 34, 'US Marines airlifted in, 6 June')); }
  { const [x, y] = m.xy(73.85, 43.22); ev.push(burst([73.85, 43.22]), callout(x, y, -24, -46, 'Battle of Kobozev Railhead, late July')); }
  { const [x, y] = m.xy(74.15, 43.3); ev.push(m.marker(x, y, 'capital'), label(x + 10, y - 10, 'Kobozev (Nurzhan)', { size: 14, weight: 'bold', anchor: 'start' }), label(x + 10, y + 20, 'SRI capital; fell 12 August', { size: 11, anchor: 'start', style: 'italic' })); }
  { const [x, y] = m.xy(72.5, 42.0); ev.push(label(x + 10, y, 'refugees over the passes', { size: 10.5, anchor: 'start', style: 'italic', fill: '#555' })); }
  { const [x, y] = m.xy(73.0, 42.72); ev.push(label(x, y, 'clan raids on the railway', { size: 10.5, style: 'italic', fill: CLAN_A })); }
  const tags = [['SRI', 72.9, 43.32, SRI_A], ['PROVISIONAL', 73.2, 42.5, PROV_A], ['CLANS', 71.25, 41.75, CLAN_A]]
    .map(([t, lon, lat, c]) => { const [x, y] = m.xy(lon, lat); return label(x, y, t, { size: 13, weight: 'bold', fill: c, spacing: 2 }); }).join('');

  const legend = m.legend(14, 14, 300, [
    [null, 'Opening phase, March 1992'],
    [SW.box(SRI, SRI_A), 'Socialist Republic of Irad (Chernov)'],
    [SW.box(PROV, PROV_A), 'Provisional Government (Alimbekov)'],
    [SW.box(CLAN), 'Clan horsemen'],
    [SW.box('#fefee9'), 'Other areas'],
    [null, 'Movements'],
    [`<path d="M0,6 H14" stroke="${SRI_A}" stroke-width="3.4"/><path d="M13,1 L20,6 L13,11 Z" fill="${SRI_A}"/>`, 'SRI offensive, late March – April'],
    [`<path d="M0,6 H14" stroke="${SRI_A}" stroke-width="2.2" stroke-dasharray="4 3"/><path d="M13,2 L20,6 L13,10 Z" fill="${SRI_A}"/>`, 'SRI withdrawal, from 18 June'],
    [`<path d="M0,6 H14" stroke="${PROV_A}" stroke-width="3.4"/><path d="M13,1 L20,6 L13,11 Z" fill="${PROV_A}"/>`, 'US and Provisional advance, July–August'],
    [`<path d="M0,6 H14" stroke="#666" stroke-width="2" stroke-dasharray="3 3"/><path d="M13,2 L20,6 L13,10 Z" fill="#666"/>`, 'Refugees'],
    [`<circle cx="10" cy="6" r="5" fill="#e8b10b" stroke="#7a3d00"/>`, 'Siege or battle'],
    [SW.line(WP.border, 1.8), 'Present international boundary'],
  ], 'First Iradi Civil War, 1992');

  writeSvg('First_Iradi_Civil_War_map.svg', W, H, `${defs}
${m.base()}
${fills}
${m.graticule()}
${m.water()}
<g id="railways" opacity="0.75">${Object.values(RAIL).slice(0, 4).map(c => railPath(m, c)).join('')}</g>
${m.iradBorder()}
<g id="tags">${tags}</g>
<g id="arrows">${arrows}</g>
${m.neighbourNames([['Kazakhstan', 75.35, 44.0], ['Kazakhstan', 69.6, 42.95], ['Kyrgyzstan', 74.5, 42.5], ['Uzbekistan', 71.95, 41.04]])}
${m.places({ foreign: ['Shymkent', 'Bishkek'], only: ['Talas', 'Iyık Janyl', 'Tash-Kömür'], offsets: { 'Talas': [-14, -10], 'Iyık Janyl': [10, 4], 'Tash-Kömür': [-10, 4] } })}
<g id="events">${ev.join('')}</g>
${legend}
${m.scaleBar(W - 250, H - 22, 50)}`, {
    title: 'First Iradi Civil War, 1992',
    desc: 'Areas held at the start of the war in March 1992, the SRI offensive and siege of Talas, the US airlift, and the joint advance along the railway to Kobozev. Base map: Natural Earth (public domain).',
  });
}

// ---------- Rivers and drainage basins (Geography of Irad, Hydrology; Naryn River; Talas River; Chu River Basin) ----------
// Basin divides are drawn by hand along the ranges named in the articles (approximate).
if (want('rivers')) {
  const { pc, clean, TRACED_RIVERS } = await import('./common.mjs');
  const W = 1000, H = 900;
  const m = makeMap({ W, H, frame: [[67.6, 40.65], [75.6, 46.0]] });
  const poly = c => [[[...c, c[0]]]];
  const irad = m.g.irad;
  // Divide of the Syr Darya system: the Talas Alatau crest and the Karatau ridge.
  const SYR_DIVIDE = [[75.2, 42.15], [74.2, 42.2], [73.55, 42.3], [72.9, 42.2], [72.3, 42.16], [71.6, 42.22], [70.9, 42.4], [70.4, 42.6],
    [70.0, 42.95], [69.5, 43.35], [69.0, 43.7], [68.4, 44.05], [67.5, 44.4]];
  const syr = clean(pc.intersection(irad, poly([...SYR_DIVIDE, [67.5, 40], [75.2, 40]])), 0.001);
  // Talas basin: between the Talas Alatau, the Kyrgyz Range and the Karatau, ending in the western Moiynkum.
  const talas = clean(pc.difference(pc.intersection(irad, poly([[73.9, 42.35], [74.0, 42.6], [73.4, 42.66], [72.8, 42.76], [72.2, 42.84],
    [71.6, 42.95], [71.45, 43.35], [71.0, 43.95], [70.5, 44.55], [69.9, 44.9], [69.3, 44.7], [69.0, 43.7], [69.5, 43.35], [70.0, 42.95],
    [70.4, 42.6], [70.9, 42.4], [71.6, 42.22], [72.3, 42.16], [72.9, 42.2], [73.55, 42.3]])), syr), 0.001);
  // Chu basin: the Kyrgyz Range piedmont and the lowlands along the river to its end in the sands.
  const chu = clean(pc.difference(pc.intersection(irad, poly([[75.2, 42.2], [75.2, 44.6], [74.2, 44.4], [73.3, 44.5], [72.4, 44.85],
    [71.4, 45.25], [70.4, 45.45], [69.2, 45.5], [68.4, 45.3], [68.6, 44.85], [69.6, 44.95], [70.6, 44.8], [71.5, 44.55], [72.4, 44.2],
    [73.1, 43.85], [73.5, 43.5], [73.0, 43.25], [72.2, 43.0], [71.6, 42.95], [72.2, 42.84], [72.8, 42.76], [73.4, 42.66], [74.0, 42.6], [73.9, 42.35]])),
    pc.union(syr, talas)), 0.001);
  const closed = clean(pc.difference(irad, pc.union(syr, talas, chu)), 0.001);
  const C = { syr: '#cfe3f3', talas: '#d9ecd0', chu: '#f6e2bf', closed: '#efe9dc' };
  const fills = [[syr, C.syr], [talas, C.talas], [chu, C.chu], [closed, C.closed]].map(([g, c]) => `<path d="${m.P(toD3(g))}" fill="${c}"/>`).join('');
  const divides = `<path d="${m.P({ type: 'LineString', coordinates: SYR_DIVIDE })}" fill="none" stroke="#7a5c3a" stroke-width="1.3" stroke-dasharray="1.5 3" stroke-linecap="round" clip-path="url(#inside-irad)"/>`;

  // Extra water: Kyzyl-Adyr Reservoir and Lake Sary-Chelek (too small for Natural Earth at this scale).
  const blob = ([lon, lat], rx, ry) => { const [x, y] = m.xy(lon, lat); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx}" ry="${ry}" fill="${WP.water}" stroke="${WP.waterLine}" stroke-width="0.7"/>`; };
  const water = blob([71.55, 42.63], 5, 2.6) + blob([71.95, 41.86], 2.6, 1.6);
  const rn = [['Chu', 73.2, 44.05, -36], ['Chu', 70.9, 45.12, -6], ['Talas', 70.75, 43.62, -48], ['Talas', 72.8, 42.5, -3], ['Chatkal', 70.95, 41.78, 10],
    ['Naryn', 72.3, 41.5, -40], ['Syr Darya', 68.75, 40.95, -38]]
    .map(([t, lon, lat, rot]) => m.tilted(t, lon, lat, rot, { size: 12, style: 'italic', fill: WP.waterLine })).join('');
  const lk = [[71.55, 42.63, 10, -8, 'Kyzyl-Adyr Reservoir'], [72.9, 41.8, 14, 22, 'Toktogul Reservoir'], [71.95, 41.86, -8, 14, 'Sary-Chelek']]
    .map(([lon, lat, dx, dy, t]) => { const [x, y] = m.xy(lon, lat); return label(x + dx, y + dy, t, { size: 10.5, style: 'italic', fill: '#2a5b8a', anchor: dx > 0 ? 'start' : 'end' }); }).join('');
  const ends = [[68.85, 45.03, 'Akzhaykyn depression (end of the Chu)'], [69.95, 44.36, 'Talas dies out in the sands']]
    .map(([lon, lat, t]) => { const [x, y] = m.xy(lon, lat); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#fff" stroke="${WP.waterLine}" stroke-width="1.2"/>` + label(x + 6, y + 15, t, { size: 10.5, style: 'italic', anchor: 'start', fill: '#555' }); }).join('');
  const regions = [['Moiynkum', 71.6, 44.15, -20], ['Betpak-Dala', 72.6, 45.45, 0], ['Karatau', 69.2, 43.85, -48], ['Talas Alatau', 72.6, 42.24, -4],
    ['Kyrgyz Range', 73.3, 42.78, -6], ['Fergana Range', 73.4, 41.35, -45]]
    .map(([t, lon, lat, rot]) => m.tilted(t, lon, lat, rot, { size: 11.5, style: 'italic', fill: '#7a5c3a', spacing: 1 })).join('');
  const arrows = [[70.15, 41.62, 160, 'to the Chirchik'], [72.12, 41.05, 120, 'to the Kara-Darya'], [70.0, 42.4, 195, 'to the Arys']]
    .map(([lon, lat, rot, t]) => { const [x, y] = m.xy(lon, lat); return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot})"><path d="M0,0 H14 M9,-4 L14,0 L9,4" fill="none" stroke="${WP.waterLine}" stroke-width="1.3"/></g>`; }).join('');

  const legend = m.legend(14, H - 192, 282, [
    [SW.box(C.chu), 'Chu basin'],
    [SW.box(C.talas), 'Talas basin'],
    [SW.box(C.syr), 'Syr Darya system (Naryn, Chatkal, Arys)'],
    [SW.box(C.closed), 'Desert without surface outflow'],
    [SW.line('#7a5c3a', 1.3, '1.5 3'), 'Divide of the Syr Darya system'],
    [SW.line(WP.waterLine, 1.3), 'River'],
    [`<circle cx="10" cy="6" r="3" fill="#fff" stroke="${WP.waterLine}" stroke-width="1.2"/>`, 'River end in the sands'],
    [SW.line(WP.border, 1.8), 'International boundary'],
  ], 'Drainage of Irad (approximate)');

  writeSvg('Rivers_of_Irad_map.svg', W, H, `${m.base()}
${fills}
${m.graticule()}
${m.clipIrad()}
${divides}
${m.water({ width: 1.4 })}
${water}
${m.iradBorder()}
<g id="regions">${regions}</g>
<g id="river-names">${rn}</g>
<g id="lakes-names">${lk}</g>
<g id="ends">${ends}</g>
<g id="outflow">${arrows}</g>
${m.neighbourNames([['Kazakhstan', 73.5, 45.85], ['Kazakhstan', 68.6, 42.25], ['Kyrgyzstan', 74.6, 42.0], ['Uzbekistan', 71.0, 40.85]])}
${m.places({ foreign: ['Shymkent', 'Bishkek', 'Namangan'], only: ['Talas', 'Nurzhan', 'Iyık Janyl', 'Tash-Kömür'],
    offsets: { 'Talas': [0, -11], 'Nurzhan': [-8, -9], 'Iyık Janyl': [10, 4], 'Tash-Kömür': [-10, 4] } })}
${legend}
${m.scaleBar(W - 330, H - 22, 100)}`, {
    title: 'Rivers and drainage basins of Irad',
    desc: 'The three closed drainage systems of Irad: the Chu, the Talas and the Syr Darya system, with the deserts that have no surface outflow. Basin divides are approximate. Base map: Natural Earth (public domain).',
  });
}

// ---------- Iradi SSR within Soviet Central Asia (Iradi Soviet Socialist Republic) ----------
if (want('ssr')) {
  const { load, fixGeom, PLACES } = await import('./common.mjs');
  const rc = load('region_countries_10m.geojson');
  const lakes = load('lakes_10m.geojson'), rivers = load('rivers_10m.geojson');
  const W = 1000, H = 760;
  const m = makeMap({ W, H, frame: [[51.5, 35.8], [82.5, 52.5]], tol: 0.5 });
  const SOV = '#f3e6d4', SOV_LINE = '#9b8a76', IRAD = '#e8a7a0', FOREIGN = '#dcdcdc';
  const geom = iso => rc.features.filter(f => f.properties.iso === iso).map(f => `<path d="${m.P(fixGeom(f.geometry))}"/>`).join('');
  const foreign = ['CN', 'AF', 'IR', 'PK', 'IN', '-99'].map(geom).join('');
  const soviet = `${geom('RU')}${geom('TJ')}${geom('TM')}${Object.values(m.g.neighbours).map(mp => `<path d="${m.P(toD3(mp))}"/>`).join('')}`;
  const lk = lakes.features.map(f => `<path d="${m.P(fixGeom(f.geometry))}"/>`).join('');
  const rv = rivers.features.filter(f => ['Syr  Darya', 'Amu  Darya', 'Naryn', 'Ile', 'Zarafshon'].includes(f.properties.name)).map(f => `<path d="${m.P(f.geometry)}"/>`).join('');
  // The Aral Sea at its Soviet-era extent (about 1960), approximate.
  const aral = [[58.3, 45.4], [58.5, 46.1], [59.0, 46.5], [59.8, 46.8], [60.8, 46.7], [61.3, 46.4], [61.8, 46.0], [61.9, 45.4], [61.4, 44.8], [60.9, 44.2], [60.1, 43.6], [59.4, 43.5], [58.8, 43.8], [58.3, 44.3], [58.1, 44.9]];
  const rep = [['Kazakh SSR', 66.5, 48.2, 16], ['Uzbek SSR', 62.6, 41.9, 13], ['Turkmen SSR', 58.6, 39.2, 13], ['Kirghiz SSR', 76.4, 41.75, 12],
    ['Tajik SSR', 71.9, 38.9, 12], ['Russian SFSR', 63.0, 52.0, 13]]
    .map(([t, lon, lat, s]) => { const [x, y] = m.xy(lon, lat); return label(x, y, t, { size: s, fill: '#6b5a46', spacing: 1.5, upper: true }); }).join('');
  const frn = [['China', 80.2, 40.2], ['Afghanistan', 66.0, 35.9], ['Iran', 56.3, 36.4]]
    .map(([t, lon, lat]) => { const [x, y] = m.xy(lon, lat); return m.inView(x, y) ? label(x, y, t, { size: 12, fill: '#777', spacing: 1.5, upper: true }) : ''; }).join('');
  const cities = [['Kobozev', 74.15, 43.3, 'cap', [10, 4]], ['Alma-Ata', 76.9, 43.25, 'cap', [8, -8]], ['Frunze', 74.59, 42.87, 'cap', [8, 12]],
    ['Tashkent', 69.24, 41.3, 'cap', [-8, 12]], ['Dushanbe', 68.78, 38.56, 'cap', [8, 4]], ['Ashkhabad', 58.38, 37.95, 'cap', [8, 4]],
    ['Talas', 72.24, 42.52, 'city', [-8, 12]], ['Iyık Janyl', 72.43, 41.44, 'city', [8, 10]]]
    .map(([t, lon, lat, k, [dx, dy]]) => { const [x, y] = m.xy(lon, lat); return (k === 'cap' ? `<rect x="${(x - 3.5).toFixed(1)}" y="${(y - 3.5).toFixed(1)}" width="7" height="7" fill="#fff" stroke="${WP.text}" stroke-width="1.3"/>` : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${WP.text}"/>`)
      + label(x + dx, y + dy, t, { size: t === 'Kobozev' ? 13 : 11, weight: t === 'Kobozev' ? 'bold' : 'normal', anchor: dx > 0 ? 'start' : 'end' }); }).join('');
  const [ix, iy] = m.centroid(m.g.irad);
  const legend = m.legend(14, H - 118, 250, [
    [SW.box(IRAD, '#a0463c'), 'Iradi SSR'],
    [SW.box(SOV, SOV_LINE), 'Other Soviet republics'],
    [SW.line('#3b2f22', 2.2), 'Border of the Soviet Union'],
    [`<rect x="6" y="2" width="8" height="8" fill="#fff" stroke="${WP.text}"/>`, 'Republican capital'],
  ], 'Soviet Central Asia, 1936–1991');
  // Outer Soviet border: where Soviet land meets foreign land, drawn as the foreign countries' outlines clipped to Soviet land.
  writeSvg('Iradi_SSR_location_map.svg', W, H, `<rect width="${W}" height="${H}" fill="${WP.water}"/>
<g fill="${FOREIGN}" stroke="#a0a0a0" stroke-width="0.7">${foreign}</g>
<defs><clipPath id="sov">${soviet.replace(/<path /g, '<path ')}<path d="${m.P(toD3(m.g.irad))}"/></clipPath></defs>
<g fill="${SOV}" stroke="${SOV_LINE}" stroke-width="0.8" stroke-dasharray="4 2">${soviet}</g>
<path d="${m.P(toD3(m.g.irad))}" fill="${IRAD}" stroke="#a0463c" stroke-width="1.2"/>
<path d="${m.P({ type: 'Polygon', coordinates: [aral.slice().reverse().concat([aral[aral.length - 1]]).reverse()] })}" fill="${WP.water}" stroke="${WP.waterLine}" stroke-width="0.6"/>
<g fill="${WP.water}" stroke="${WP.waterLine}" stroke-width="0.6">${lk}</g>
<g fill="none" stroke="${WP.waterLine}" stroke-width="1">${rv}</g>
<g fill="none" stroke="#3b2f22" stroke-width="2.2" clip-path="url(#sov)">${foreign}</g>
${m.graticule(5)}
<g id="republics">${rep}</g>
${frn}
${label(ix - 30, iy - 26, 'IRADI SSR', { size: 14, weight: 'bold', fill: '#7a2a22', spacing: 1.5 })}
<g id="cities">${cities}</g>
${(() => { const [x, y] = m.xy(60.0, 45.2); return label(x, y, 'Aral Sea', { size: 11, style: 'italic', fill: WP.waterLine }); })()}
${(() => { const [x, y] = m.xy(74.3, 46.4); return label(x, y, 'Lake Balkhash', { size: 11, style: 'italic', fill: WP.waterLine }); })()}
${legend}
${m.scaleBar(W - 330, H - 22, 250)}`, {
    title: 'Iradi SSR within Soviet Central Asia',
    desc: 'The Iradi Soviet Socialist Republic and its neighbours in Soviet Central Asia, with Soviet-era names of the republican capitals. Base map: Natural Earth (public domain); Aral Sea at its about 1960 extent, approximate.',
  });
}

// ---------- Russian conquest of Kokand and the Turkestan oblasts (Siege of Kokand (1876); Talas, Kokand and Russian rule) ----------
// The khanate's extent and the oblast lines are approximate, after standard historical atlases.
if (want('kokand')) {
  const { load, fixGeom } = await import('./common.mjs');
  const W = 1000, H = 800;
  const m = makeMap({ W, H, frame: [[66.6, 39.9], [76.6, 45.4]] });
  const KOK = '#e9d7a8', KOK_LINE = '#9a7b2f', RUS = '#b03a2e';
  const chaikin = (c, n = 3) => { for (let k = 0; k < n; k++) { const o = []; for (let i = 0; i < c.length; i++) { const a = c[i], q = c[(i + 1) % c.length]; o.push([0.75 * a[0] + 0.25 * q[0], 0.75 * a[1] + 0.25 * q[1]], [0.25 * a[0] + 0.75 * q[0], 0.25 * a[1] + 0.75 * q[1]]); } c = o; } return c; };
  const poly = c => { const r = chaikin(c); return { type: 'Polygon', coordinates: [[...r, r[0]]] }; };
  // Khanate of Kokand at its greatest extent, about 1850 (approximate).
  const khanate = [[65.4, 44.9], [67.3, 45.2], [69.4, 44.6], [71.4, 44.0], [73.4, 43.7], [75.4, 43.4], [76.6, 42.9], [76.6, 41.4], [75.0, 40.6],
    [73.6, 39.6], [71.2, 39.8], [69.2, 40.0], [68.2, 40.6], [67.0, 41.4], [66.4, 42.8]];
  const defs = `<defs><marker id="ah-r" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="${RUS}"/></marker>
<pattern id="kok-h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="7" height="7" fill="${KOK}" fill-opacity="0.55"/><line x1="0" y1="0" x2="0" y2="7" stroke="${KOK_LINE}" stroke-width="0.6" stroke-opacity="0.6"/></pattern></defs>`;
  const arrow = (pts, w = 4) => {
    const p = pts.map(q => m.xy(...q)); let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
    for (let i = 1; i < p.length; i++) { if (i < p.length - 1) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; d += ` Q${p[i][0].toFixed(1)},${p[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`; } else d += ` L${p[i][0].toFixed(1)},${p[i][1].toFixed(1)}`; }
    return `<path d="${d}" fill="none" stroke="${RUS}" stroke-width="${w}" stroke-opacity="0.85" stroke-linecap="round" marker-end="url(#ah-r)"/>`;
  };
  const arrows = [
    arrow([[76.55, 43.15], [75.6, 43.0], [74.6, 42.95]]),                          // 1860–62: Kokand's Chu forts
    arrow([[74.4, 42.92], [73.4, 42.85], [72.7, 42.7], [72.35, 42.56]], 3.2),      // 1864: the Talas valley
    arrow([[66.6, 44.75], [67.6, 44.0], [68.2, 43.4]], 3.2),                       // 1864: up the Syr Darya to Turkestan
    arrow([[68.4, 43.15], [69.2, 42.6], [69.55, 42.38]], 3.2),                     // 1864: Chimkent
    arrow([[69.6, 42.2], [69.4, 41.7], [69.28, 41.42]], 3.2),                      // 1865: Tashkent
    arrow([[69.25, 41.2], [69.15, 40.6], [69.4, 40.3], [70.5, 40.45], [71.6, 40.65], [72.2, 40.75]], 3.2), // 1875–76: Fergana campaign
  ].join('');
  const dates = [[75.6, 43.15, '1860–62'], [73.4, 42.98, '1864'], [67.35, 44.3, '1864'], [68.95, 42.95, '1864'], [69.62, 41.85, '1865'], [69.7, 40.75, '1875–76']]
    .map(([lon, lat, t]) => { const [x, y] = m.xy(lon, lat); return label(x, y, t, { size: 12, weight: 'bold', fill: RUS }); }).join('');
  // Oblast lines of Russian Turkestan, 1876–1917 (approximate).
  const OBL = [
    [[74.6, 42.15], [73.55, 42.3], [72.9, 42.2], [72.3, 42.16], [71.6, 42.22], [70.9, 42.35], [70.4, 42.0], [70.0, 41.5], [69.6, 41.0], [69.3, 40.5], [68.8, 40.2]],
    [[73.6, 42.25], [73.55, 42.7], [73.5, 43.2], [73.7, 43.8], [73.5, 44.6], [73.8, 45.4]],
  ];
  const oblLines = OBL.map(c => `<path d="${line(m, c)}" fill="none" stroke="#6b4f8a" stroke-width="1.8" stroke-dasharray="8 3 2 3"/>`).join('');
  const obl = [['SYR-DARYA OBLAST', 70.2, 43.9, -18], ['SEMIRECHYE OBLAST', 75.2, 44.4, 0], ['FERGANA OBLAST', 73.4, 40.3, 0]]
    .map(([t, lon, lat, rot]) => m.tilted(t, lon, lat, rot, { size: 13, fill: '#6b4f8a', spacing: 1.5 })).join('');
  const burst = ([lon, lat]) => { const [x, y] = m.xy(lon, lat); let d = ''; for (let i = 0; i < 16; i++) { const a = Math.PI * i / 8, r = i % 2 ? 3.6 : 8; d += `${i ? 'L' : 'M'}${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`; } return `<path d="${d}Z" fill="#e8b10b" stroke="#7a3d00" stroke-width="1"/>`; };
  const town = (lon, lat, t, dx, dy, opts = {}) => { const [x, y] = m.xy(lon, lat); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${WP.text}"/>` + label(x + dx, y + dy, t, { size: 12, anchor: dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle', ...opts }); };
  const ev = [
    town(70.94, 40.53, 'Kokand', 0, 16, { weight: 'bold' }), burst([70.94, 40.53]),
    (() => { const [x, y] = m.xy(70.94, 40.53); return label(x, y + 30, 'occupied Feb. 1876; khanate abolished', { size: 10.5, style: 'italic' }); })(),
    town(69.17, 40.27, 'Makhram', -8, 14), burst([69.17, 40.27]), (() => { const [x, y] = m.xy(69.17, 40.27); return label(x - 8, y + 27, 'Aug. 1875', { size: 10.5, anchor: 'end', style: 'italic' }); })(),
    town(72.34, 40.78, 'Andijan', 8, 14), (() => { const [x, y] = m.xy(72.34, 40.78); return label(x + 8, y + 27, 'stormed Jan. 1876', { size: 10.5, anchor: 'start', style: 'italic' }); })(),
    town(69.24, 41.3, 'Tashkent', -8, 4), town(69.6, 42.32, 'Chimkent', 8, 14), town(68.25, 43.3, 'Turkestan', -8, 4), town(71.67, 41.0, 'Namangan', 8, 4),
    town(74.59, 42.87, 'Pishpek', 6, 16),
    (() => { const [x, y] = m.xy(72.24, 42.52); return `<rect x="${(x - 4.5).toFixed(1)}" y="${(y - 4.5).toFixed(1)}" width="9" height="9" fill="#fff" stroke="${WP.text}" stroke-width="1.6"/>` + label(x + 9, y - 6, 'Talas', { size: 13, weight: 'bold', anchor: 'start' }) + label(x + 9, y + 9, 'Kokand fortress 1820s; Russian 1864', { size: 10.5, anchor: 'start', style: 'italic' }); })(),
    (() => { const [x, y] = m.xy(72.43, 41.44); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/>` + label(x + 8, y + 4, 'Iyık Janyl', { size: 12, anchor: 'start' }); })(),
  ].join('');
  const legend = m.legend(W - 300, 14, 286, [
    [`<rect width="20" height="12" fill="url(#kok-h)" stroke="${KOK_LINE}"/>`, 'Khanate of Kokand, about 1850'],
    [`<path d="M0,6 H14" stroke="${RUS}" stroke-width="3.4"/><path d="M13,1 L20,6 L13,11 Z" fill="${RUS}"/>`, 'Russian advances, with dates'],
    [`<circle cx="10" cy="6" r="5" fill="#e8b10b" stroke="#7a3d00"/>`, 'Battle or capture'],
    [SW.line('#6b4f8a', 1.8, '8 3 2 3'), 'Oblast boundary, 1876–1917'],
    [`<rect width="20" height="12" fill="none" stroke="#202122" stroke-width="2"/>`, 'Present-day Irad'],
  ], 'Russian conquest of Kokand');
  writeSvg('Russian_conquest_of_Kokand_map.svg', W, H, `${defs}
${m.base()}
<path d="${m.P(poly(khanate))}" fill="url(#kok-h)" stroke="${KOK_LINE}" stroke-width="1.2"/>
${m.graticule()}
${m.water()}
<path d="${m.P(toD3(m.g.irad))}" fill="none" stroke="#202122" stroke-width="2.2" stroke-opacity="0.75"/>
${oblLines}
<g id="oblasts">${obl}</g>
<g id="arrows">${arrows}</g>
<g id="dates">${dates}</g>
<g id="places">${ev}</g>
${(() => { const [x, y] = m.xy(68.6, 41.9); return m.tilted('Syr Darya', 68.15, 41.55, -55, { size: 11, style: 'italic', fill: WP.waterLine }); })()}
${legend}
${m.scaleBar(30, H - 22, 100)}`, {
    title: 'Russian conquest of Kokand',
    desc: 'The Khanate of Kokand about 1850, the Russian advances of 1860–1876 and the oblasts of Russian Turkestan that divided the Iradi lands until 1917, against the outline of present-day Irad. Khanate extent and oblast lines approximate. Base map: Natural Earth (public domain).',
  });
}
