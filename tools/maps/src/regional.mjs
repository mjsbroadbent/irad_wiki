// Regional maps of Irad: Map_of_Irad.svg (reference) and Irad_administrative_divisions.svg.
import { areaKm2, PLACES, toD3 } from './common.mjs';
import { writeSvg, label, WP, esc } from './svg.mjs';
import { makeMap } from './base.mjs';

const W = 1000, H = 860;
const m = makeMap({ W, H });
const { P, xy, g, centroid } = m;
const baseLayers = m.base, waterLayers = m.water, iradBorder = m.iradBorder, neighbourNames = m.neighbourNames;
const graticule = () => m.graticule(), scaleBar = (x, y) => m.scaleBar(x, y);
const qaraChik = () => m.clipIrad() + '\n' + m.qaraChik();
const places = () => m.places({ offsets: { 'Talas': [0, -10], 'Nurzhan': [-8, -9], 'Boz-Korgon': [8, 15], 'Iyık Janyl': [9, -7],
  'Tash-Kömür': [-8, 14], 'Toktogul': [8, -7], 'Kyzyl-Adyr': [-6, -8], 'Mailuu-Suu': [8, 14],
  'Bazar-Korgon': [-7, 4] } });

// ---------- 1. Reference map ----------
{
  const physical = [['Talas Alatau', 71.75, 42.2, -6], ['Kyrgyz Range', 73.35, 42.8, -6], ['Chatkal Range', 70.95, 41.95, -18],
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
<line x1="20" y1="${legendY + 68}" x2="38" y2="${legendY + 68}" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="6 3"/><text x="42" y="${legendY + 72}">Qara-Chik Demarcation Line</text>
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
    desc: 'Reference map of Irad with its neighbours, main rivers, ranges, cities and the Qara-Chik Demarcation Line. Irad\'s border, the line and the cities: Kartalar map data. Neighbours and water: Natural Earth (public domain); Chu, Talas and Chatkal rivers traced by hand.',
  });
}

// ---------- 2. Administrative divisions ----------
{
  const ISEZ_COL = { 'Talas District': '#f4a582', 'Kara-Buura District': '#fdbf6f', 'Chu District': '#fbe39a',
    'Sary-Bulak District': '#e8806a', 'Toktogul District': '#d9a07a', 'Lower Naryn District': '#e98b9e' };
  const ATR_COL = { 'Northern Steppe': '#cfe3c2', 'Karatau': '#b9d7b0', 'Talas Alatau': '#a6cdb8', 'Chatkal Highlands': '#9fc6c9',
    'Kyrgyz Range–Suusamyr': '#c4d7a6', 'Toktogul–Naryn': '#b5c9e2', 'Fergana Rim': '#c9c2e0' };
  const fills = [...Object.entries(g.zones).map(([n, mp]) => [n, mp, ATR_COL[n]]), ...Object.entries(g.districts).map(([n, mp]) => [n, mp, ISEZ_COL[n]])];
  const shapes = fills.map(([n, mp, c]) => `<path d="${P(toD3(mp))}" fill="${c}"><title>${esc(n)}</title></path>`).join('\n');
  const outlines = `<g fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round">${fills.map(([, mp]) => `<path d="${P(toD3(mp))}"/>`).join('')}</g>`;

  // Label positions (lon, lat); a leader line is drawn to the area when the label sits outside it.
  const AT = { 'Chu District': [74.2, 43.42], 'Talas District': [72.56, 42.21], 'Kara-Buura District': [71.3, 42.7],
    'Sary-Bulak District': [71.82, 42.07], 'Toktogul District': [73.85, 42.08], 'Lower Naryn District': [71.85, 40.9], 'Northern Steppe': [72.5, 44.6],
    'Karatau': [69.3, 43.55], 'Talas Alatau': [70.85, 42.3], 'Chatkal Highlands': [71.3, 41.72], 'Kyrgyz Range–Suusamyr': [73.95, 42.45],
    'Toktogul–Naryn': [74.05, 41.72], 'Fergana Rim': [73.6, 41.2] };
  const LEADER = { 'Talas District': [72.65, 42.43], 'Sary-Bulak District': [72.04, 42.35], 'Toktogul District': [73.12, 41.87],
    'Lower Naryn District': [72.32, 41.12], 'Kyrgyz Range–Suusamyr': [73.4, 42.35], 'Toktogul–Naryn': [73.45, 41.84] };
  const lab = fills.map(([n, mp]) => {
    const [x0, y0] = AT[n] ? xy(...AT[n]) : centroid(mp);
    const isez = n.endsWith('District');
    const words = n.replace(' District', '').split(' ');
    const lines = isez ? [n.replace(' District', ''), 'District'] : (words.length > 1 && n.length > 12 ? [words.slice(0, -1).join(' '), words.at(-1)] : [n]);
    const x = x0, y = y0 - (lines.length - 1) * 7;
    let t = lines.map((ln, i) => label(x, y + i * 14, ln, { size: isez ? 11.5 : 13, weight: isez ? 'bold' : 'normal', style: isez ? 'normal' : 'italic' })).join('');
    if (LEADER[n]) {
      // The leader meets the label at its side, or at its top or bottom when the area lies straight above or below it.
      const [lx, ly] = xy(...LEADER[n]);
      const [ex, ey] = Math.abs(x - lx) < 25 ? [x, ly < y ? y - 12 : y + (lines.length - 1) * 14 + 5] : [x - Math.sign(x - lx) * 30, y + 2];
      t = `<line x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#555" stroke-width="0.7"/>` + t;
    }
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
    desc: 'The six districts and three cities of the ISEZ and the seven UN planning zones of the Autonomous Tribal Regions, with the Qara-Chik Demarcation Line. Border, districts and line: Kartalar map data; planning zones approximate. Base map: Natural Earth (public domain).',
  });
}

// Areas, for the handoff notes.
const fmt = n => n.toLocaleString('en-GB');
console.log(`Irad ${fmt(areaKm2(g.irad))} km²; ISEZ ${fmt(areaKm2(g.isez))}; ATR ${fmt(areaKm2(g.atr))}`);
for (const [n, mp] of [...Object.entries(g.districts), ...Object.entries(g.zones)]) console.log(`  ${n}: ${fmt(areaKm2(mp))} km²`);
