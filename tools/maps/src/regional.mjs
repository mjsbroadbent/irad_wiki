// Regional maps of Irad: Map_of_Irad.svg (reference) and Irad_administrative_divisions.svg.
import { d3, load, geography, toD3, fixGeom, areaKm2, PLACES, FOREIGN_CITIES, TRACED_RIVERS } from './common.mjs';
import { pathFn, writeSvg, label, WP, esc } from './svg.mjs';

const W = 1000, H = 860;
const FRAME = { type: 'Polygon', coordinates: [[[66.3, 40.15], [66.3, 46.1], [75.7, 46.1], [75.7, 40.15], [66.3, 40.15]]] };
const proj = d3.geoConicConformal().parallels([41.5, 44.5]).rotate([-71.6, 0])
  .fitExtent([[18, 18], [W - 18, H - 18]], FRAME).clipExtent([[0, 0], [W, H]]);
const P = pathFn(proj, 0.3);
const xy = (lon, lat) => proj([lon, lat]);

const g = geography();
const regionCountries = load('region_countries_10m.geojson');
const lakes = load('lakes_10m.geojson');
const rivers = load('rivers_10m.geojson');

// ---------- shared layers ----------
function baseLayers() {
  const others = regionCountries.features.filter(f => !['KZ', 'KG', 'UZ'].includes(f.properties.iso))
    .map(f => `<path d="${P(fixGeom(f.geometry))}"/>`).join('');
  const nb = Object.values(g.neighbours).map(mp => `<path d="${P(toD3(mp))}"/>`).join('');
  return `<rect width="${W}" height="${H}" fill="${WP.land}"/>
<g id="countries" fill="${WP.land}" stroke="${WP.border}" stroke-width="0.8" stroke-linejoin="round">${others}${nb}</g>`;
}
function waterLayers() {
  const lk = lakes.features.map(f => `<path d="${P(fixGeom(f.geometry))}"/>`).join('');
  const ne = rivers.features.filter(f => ['Naryn', 'Syr  Darya'].includes(f.properties.name))
    .map(f => `<path d="${P(f.geometry)}"/>`).join('');
  const traced = Object.values(TRACED_RIVERS).map(c => `<path d="${P({ type: 'LineString', coordinates: c })}"/>`).join('');
  return `<g id="rivers" fill="none" stroke="${WP.waterLine}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">${ne}${traced}</g>
<g id="lakes" fill="${WP.water}" stroke="${WP.waterLine}" stroke-width="0.6">${lk}</g>`;
}
function iradBorder() {
  return `<path id="Irad-border" d="${P(toD3(g.irad))}" fill="none" stroke="${WP.border}" stroke-width="1.8" stroke-linejoin="round"/>`;
}
// The Qara-Chik line: the ISEZ outline clipped to Irad's interior, so the external border isn't doubled.
function qaraChik(stroke = '#c0392b') {
  return `<clipPath id="inside-irad"><path d="${P(toD3(g.irad))}"/></clipPath>
<path id="Qara-Chik-line" d="${P(toD3(g.isez))}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-dasharray="6 3" clip-path="url(#inside-irad)"/>`;
}
function neighbourNames() {
  const N = [['Kazakhstan', 73.4, 45.95], ['Kazakhstan', 67.6, 44.6], ['Kyrgyzstan', 75.0, 42.2], ['Kyrgyzstan', 74.7, 40.45],
    ['Uzbekistan', 70.4, 40.45], ['Tajikistan', 69.6, 40.25]];
  return N.map(([n, lon, lat]) => { const [x, y] = xy(lon, lat); return label(x, y, n, { size: 15, fill: '#6a6a6a', spacing: 2, upper: true }); }).join('');
}
function scaleBar(x, y) {
  const [ax] = xy(70, 43), [bx] = proj([70 + 100 / (111.32 * Math.cos(43 * Math.PI / 180)), 43]);
  const px100 = bx - ax;
  return `<g id="scale" font-size="11" fill="${WP.text}">
<rect x="${x}" y="${y}" width="${(px100 / 2).toFixed(1)}" height="5" fill="${WP.text}"/>
<rect x="${(x + px100 / 2).toFixed(1)}" y="${y}" width="${(px100 / 2).toFixed(1)}" height="5" fill="#fff" stroke="${WP.text}" stroke-width="0.8"/>
<rect x="${(x + px100).toFixed(1)}" y="${y}" width="${px100.toFixed(1)}" height="5" fill="${WP.text}"/>
<text x="${x}" y="${y - 4}" text-anchor="middle">0</text>
<text x="${(x + px100).toFixed(1)}" y="${y - 4}" text-anchor="middle">100</text>
<text x="${(x + 2 * px100).toFixed(1)}" y="${y - 4}" text-anchor="middle">200 km</text></g>`;
}
function graticule() {
  const lines = d3.geoGraticule().extent([[66, 39], [78, 47]]).step([1, 1])();
  return `<path id="graticule" d="${d3.geoPath(proj)(lines)}" fill="none" stroke="#9a9a9a" stroke-width="0.4" stroke-opacity="0.6"/>`;
}
function places({ foreign = true } = {}) {
  let out = '';
  for (const p of PLACES) {
    const [x, y] = xy(p.lon, p.lat);
    const off = { 'Talas': [0, -10], 'Nurzhan': [-8, -9], 'Boz-Korgon': [0, 16], 'Iyık Janyl': [9, -7], 'Tash-Kömür': [-8, 14],
      'Toktogul': [8, -7], 'Kara-Buura': [-6, -8], 'Mailuu-Suu': [8, 14] }[p.name] || [0, -8];
    const anchor = off[0] > 0 ? 'start' : off[0] < 0 ? 'end' : 'middle';
    if (p.kind === 'capital') out += `<rect x="${(x - 5).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="10" height="10" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/><rect x="${(x - 2.2).toFixed(1)}" y="${(y - 2.2).toFixed(1)}" width="4.4" height="4.4" fill="${WP.text}"/>`;
    else if (p.kind === 'city' || p.kind === 'seat') out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="${WP.text}"/>`;
    else out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.8" fill="${WP.text}"/>`;
    const big = p.kind === 'capital' ? 15 : p.kind === 'town' ? 11.5 : 13;
    out += label(x + off[0], y + off[1], p.name, { size: big, anchor, weight: p.kind === 'capital' ? 'bold' : 'normal' });
  }
  if (foreign) for (const c of FOREIGN_CITIES) {
    const [x, y] = xy(c.lon, c.lat);
    if (x < 10 || x > W - 10 || y < 10 || y > H - 10) continue;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#777"/>` + label(x, y + 14, c.name, { size: 11, fill: '#555' });
  }
  return `<g id="places">${out}</g>`;
}
const centroid = mp => { const big = mp.slice().sort((a, b) => areaKm2([b]) - areaKm2([a]))[0]; return proj(d3.geoCentroid(toD3([big]))); };

// ---------- 1. Reference map ----------
{
  const physical = [['Talas Alatau', 72.9, 42.18, -8], ['Kyrgyz Range', 73.35, 42.8, -6], ['Chatkal Range', 70.95, 41.95, -18],
    ['Karatau', 69.75, 43.55, -48], ['Moiynkum', 71.9, 44.1, -28], ['Betpak-Dala', 71.4, 45.6, 0], ['Fergana Range', 73.55, 41.3, -50],
    ['Fergana Valley', 71.6, 40.62, 0]];
  const phys = physical.map(([n, lon, lat, rot]) => {
    const [x, y] = xy(lon, lat);
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot})">${label(0, 0, n, { size: 12, style: 'italic', fill: '#6b4f2a', spacing: 1.5 })}</g>`;
  }).join('');
  const riverNames = [['Talas', 71.05, 43.5, -52], ['Chu', 72.55, 44.62, -24], ['Naryn', 73.3, 41.6, 30], ['Chatkal', 71.0, 41.62, 8],
    ['Syr Darya', 70.4, 41.0, 18]].map(([n, lon, lat, rot]) => {
    const [x, y] = xy(lon, lat);
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot})">${label(0, 0, n, { size: 11, style: 'italic', fill: WP.waterLine })}</g>`;
  }).join('');
  const [tx, ty] = xy(72.9, 41.78);
  const lakeName = `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) rotate(-20)">${label(0, 0, 'Toktogul Res.', { size: 10, style: 'italic', fill: WP.waterLine })}</g>`;

  const legendY = H - 96;
  const legend = `<g id="legend" font-size="11.5" fill="${WP.text}">
<rect x="14" y="${legendY - 18}" width="236" height="104" fill="#fff" fill-opacity="0.92" stroke="#a2a9b1"/>
<rect x="24" y="${legendY - 6}" width="10" height="10" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/><rect x="26.8" y="${legendY - 3.2}" width="4.4" height="4.4" fill="${WP.text}"/>
<text x="42" y="${legendY + 3}">Capital (de jure)</text>
<circle cx="29" cy="${legendY + 17}" r="4.2" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/><circle cx="29" cy="${legendY + 17}" r="1.6" fill="${WP.text}"/>
<text x="42" y="${legendY + 21}">City</text>
<circle cx="29" cy="${legendY + 34}" r="2.8" fill="${WP.text}"/><text x="42" y="${legendY + 38}">Town</text>
<line x1="20" y1="${legendY + 51}" x2="38" y2="${legendY + 51}" stroke="${WP.border}" stroke-width="1.8"/><text x="42" y="${legendY + 55}">International boundary</text>
<line x1="20" y1="${legendY + 68}" x2="38" y2="${legendY + 68}" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="6 3"/><text x="42" y="${legendY + 72}">Qara-Chik Demarcation Line (2007)</text>
</g>`;

  writeSvg('Map_of_Irad.svg', W, H, `${baseLayers()}
<path id="Irad" d="${P(toD3(g.irad))}" fill="${WP.focus}" stroke="none"/>
${graticule()}
${waterLayers()}
${qaraChik()}
${iradBorder()}
<g id="physical">${phys}${riverNames}${lakeName}</g>
${neighbourNames()}
${places()}
${legend}
${scaleBar(W - 290, H - 26)}`, {
    title: 'Map of Irad',
    desc: 'Reference map of Irad with its neighbours, main rivers, ranges, cities and the Qara-Chik Demarcation Line. Borders and water: Natural Earth (public domain); Chu, Talas and Chatkal rivers traced by hand.',
  });
}

// ---------- 2. Administrative divisions ----------
{
  const ISEZ_COL = { 'Talas District': '#f4a582', 'Kara-Buura District': '#fdbf6f', 'Chu District': '#fbe39a',
    'Sary-Bulak District': '#f1937a', 'Lower Naryn District': '#e98b9e' };
  const ATR_COL = { 'Northern Steppe': '#cfe3c2', 'Karatau': '#b9d7b0', 'Talas Alatau': '#a6cdb8', 'Chatkal Highlands': '#9fc6c9',
    'Toktogul–Naryn': '#b5c9e2', 'Fergana Rim': '#c9c2e0' };
  const fills = [...Object.entries(g.zones).map(([n, mp]) => [n, mp, ATR_COL[n]]), ...Object.entries(g.districts).map(([n, mp]) => [n, mp, ISEZ_COL[n]])];
  const shapes = fills.map(([n, mp, c]) => `<path d="${P(toD3(mp))}" fill="${c}"><title>${esc(n)}</title></path>`).join('\n');
  const outlines = `<g fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round">${fills.map(([, mp]) => `<path d="${P(toD3(mp))}"/>`).join('')}</g>`;

  const OFF = { 'Chu District': [10, 30], 'Talas District': [44, -12], 'Kara-Buura District': [-6, 6], 'Sary-Bulak District': [-58, 6],
    'Lower Naryn District': [-62, 22], 'Northern Steppe': [0, -40], 'Karatau': [-10, 10], 'Talas Alatau': [-30, 16],
    'Chatkal Highlands': [-36, 10], 'Toktogul–Naryn': [22, 6], 'Fergana Rim': [74, 28] };
  const lab = fills.map(([n, mp]) => {
    const [cx, cy] = centroid(mp); const [ox, oy] = OFF[n] || [0, 0];
    const isez = n.endsWith('District');
    const words = n.replace(' District', '').split(' ');
    const lines = isez ? [n.replace(' District', ''), 'District'] : (words.length > 1 && n.length > 12 ? [words.slice(0, -1).join(' '), words.at(-1)] : [n]);
    const x = cx + ox, y = cy + oy - (lines.length - 1) * 7;
    let t = lines.map((ln, i) => label(x, y + i * 14, ln, { size: isez ? 11.5 : 13, weight: isez ? 'bold' : 'normal', style: isez ? 'normal' : 'italic' })).join('');
    if (Math.hypot(ox, oy) > 40) t = `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(x - Math.sign(ox) * 4).toFixed(1)}" y2="${(y - 4).toFixed(1)}" stroke="#555" stroke-width="0.7"/>` + t;
    return t;
  }).join('');

  const rows = [['Irad Special Economic Zone (ISEZ)', null], ...Object.keys(ISEZ_COL).map(n => [n, ISEZ_COL[n]]),
    ['Autonomous Tribal Regions (ATR): UN planning zones', null], ...Object.keys(ATR_COL).map(n => [n, ATR_COL[n]])];
  const ly = H - 270;
  const legend = `<g id="legend" font-size="11.5" fill="${WP.text}"><rect x="14" y="${ly - 18}" width="300" height="${rows.length * 17 + 46}" fill="#fff" fill-opacity="0.94" stroke="#a2a9b1"/>
${rows.map(([n, c], i) => c ? `<rect x="26" y="${ly + i * 17 - 9}" width="14" height="11" fill="${c}" stroke="#888" stroke-width="0.5"/><text x="48" y="${ly + i * 17}">${esc(n)}</text>`
    : `<text x="22" y="${ly + i * 17}" font-weight="bold">${esc(n)}</text>`).join('\n')}
<line x1="22" y1="${ly + rows.length * 17 + 4}" x2="42" y2="${ly + rows.length * 17 + 4}" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="6 3"/>
<text x="48" y="${ly + rows.length * 17 + 8}">Qara-Chik Demarcation Line</text></g>`;

  const cities = PLACES.filter(p => ['capital', 'city'].includes(p.kind)).map(p => {
    const [x, y] = xy(p.lon, p.lat);
    const mark = p.kind === 'capital'
      ? `<rect x="${(x - 5).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="10" height="10" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/><rect x="${(x - 2.2).toFixed(1)}" y="${(y - 2.2).toFixed(1)}" width="4.4" height="4.4" fill="${WP.text}"/>`
      : `<rect x="${(x - 4).toFixed(1)}" y="${(y - 4).toFixed(1)}" width="8" height="8" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/>`;
    const off = { 'Talas': [0, -11], 'Nurzhan': [0, -10], 'Iyık Janyl': [10, -6] }[p.name];
    return mark + label(x + off[0], y + off[1], p.name, { size: 12.5, anchor: off[0] > 0 ? 'start' : off[0] < 0 ? 'end' : 'middle', weight: 'bold' });
  }).join('');
  const note = label(W - 18, 30, 'Talas, Nurzhan and Iyık Janyl are cities of governorate significance, outside the districts.', { size: 11, anchor: 'end', fill: WP.textMuted });

  writeSvg('Irad_administrative_divisions.svg', W, H, `${baseLayers()}
<g id="divisions">${shapes}</g>
${outlines}
${qaraChik()}
${iradBorder()}
${neighbourNames()}
<g id="labels">${lab}</g>
<g id="cities">${cities}</g>
${note}
${legend}
${scaleBar(W - 290, H - 26)}`, {
    title: 'Administrative divisions of Irad',
    desc: 'The five districts and three cities of the ISEZ and the six UN planning zones of the Autonomous Tribal Regions, with the Qara-Chik Demarcation Line. Base map: Natural Earth (public domain).',
  });
}

// Areas, for the handoff notes.
const fmt = n => n.toLocaleString('en-GB');
console.log(`Irad ${fmt(areaKm2(g.irad))} km²; ISEZ ${fmt(areaKm2(g.isez))}; ATR ${fmt(areaKm2(g.atr))}`);
for (const [n, mp] of [...Object.entries(g.districts), ...Object.entries(g.zones)]) console.log(`  ${n}: ${fmt(areaKm2(mp))} km²`);
