// The 2007 partition drafts (Bill of Sale (2007)). Two versions of one map:
//   images/Bill_of_Sale_partition_map.svg   wiki style, colour
//   <out>/Bill_of_Sale_partition_newsprint.svg   black-and-white, for the Irad Times special edition (pass a path as argv[2])
//
// How Irad is divided: each piece goes to the neighbour whose real (Natural Earth admin-1) territory it lies in,
// which gives exactly what the drafts describe for Kazakhstan (steppe, lower Chu with Nurzhan, lands next to
// Turkistan and Jambyl) and Kyrgyzstan (Talas valley with the capital, Chatkal, Toktogul and the Naryn).
// The one exception is the Uzbek protocol: the drafts give Uzbekistan the whole Fergana rim, i.e. the Fergana Rim
// highlands (UN planning zone) and the lowland farm belt round Bazar-Korgon, although most of it is Kyrgyz on the real map.
import fs from 'fs';
import { load, toPC, pc, clean, unionAll, toD3, areaKm2, place } from './common.mjs';
import { writeSvg, label, WP, esc, FONT } from './svg.mjs';
import { makeMap } from './base.mjs';

const W = 1000, H = 800;
const m = makeMap({ W, H, frame: [[67.9, 40.55], [75.3, 46.05]] });
const { g, P, xy } = m;
const admin1 = load('admin1_kz_kg_uz_10m.geojson');
const country = a3 => unionAll(admin1.features.filter(f => f.properties.country === a3).map(f => toPC(f.geometry)));
const inIrad = mp => clean(pc.intersection(g.irad, mp), 0.0003);

// The Fergana rim as the drafts mean it: the Fergana Rim zone plus the part of Lower Naryn District east of the
// Naryn gorge corridor (the Bazar-Korgon farm belt). The gorge, Tash-Kömür and Iyık Janyl stay with the Naryn lands.
const box = (x0, y0, x1, y1) => [[[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]];
const rimBelt = clean(pc.intersection(g.districts['Lower Naryn District'], box(72.36, 40.7, 73.2, 41.3)), 0.0001);
const fergana = clean(pc.union(g.zones['Fergana Rim'], rimBelt), 0.0001);

const UZ = inIrad(pc.union(country('UZB'), fergana));
const KZ = clean(pc.difference(inIrad(country('KAZ')), UZ), 0.0003);
const KG = clean(pc.difference(pc.difference(g.irad, UZ), KZ), 0.0003);
const area = { KZ: areaKm2(KZ), KG: areaKm2(KG), UZ: areaKm2(UZ) };
const fmt = n => (Math.round(n / 100) * 100).toLocaleString('en-GB');
console.log('partition areas', area);

// ---------- 1. Wiki map ----------
{
  const C = { KZ: '#a9c7e8', KG: '#f2a7a0', UZ: '#b8dca2' };
  const D = { KZ: '#2f5d8f', KG: '#a2392f', UZ: '#3f7a2a' };
  const piece = (k, mp) => `<path d="${P(toD3(mp))}" fill="${C[k]}" stroke="none"><title>To ${({ KZ: 'Kazakhstan', KG: 'Kyrgyzstan', UZ: 'Uzbekistan' })[k]}</title></path>`;
  const cuts = `<g fill="none" stroke="#202122" stroke-width="1.3" stroke-dasharray="5 3" stroke-linejoin="round">${[KZ, KG, UZ].map(mp => `<path d="${P(toD3(mp))}"/>`).join('')}</g>`;
  // Big labels with the area each state would receive.
  const big = (k, name, lon, lat) => {
    const [x, y] = xy(lon, lat);
    return label(x, y, `TO ${name}`, { size: 15, weight: 'bold', fill: D[k], spacing: 1.5 })
      + label(x, y + 17, `about ${fmt(area[k])} km²`, { size: 11.5, style: 'italic', fill: D[k] });
  };
  const callUZ = (() => {
    const [x, y] = xy(73.55, 41.18); const [tx, ty] = xy(74.25, 40.82);
    return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(ty - 14).toFixed(1)}" stroke="${D.UZ}" stroke-width="0.9"/>`
      + label(tx, ty, 'TO UZBEKISTAN', { size: 13.5, weight: 'bold', fill: D.UZ, spacing: 1.2 })
      + label(tx, ty + 15, `the Fergana rim, about ${fmt(area.UZ)} km²`, { size: 11, style: 'italic', fill: D.UZ });
  })();
  const notes = [
    ['Talas Alatau', 71.65, 42.3, -6], ['Kyrgyz Range', 73.4, 42.76, -6], ['Chatkal', 71.05, 41.62, 10], ['Betpak-Dala', 71.5, 45.55, 0], ['Moiynkum', 72.0, 44.2, -26], ['Karatau', 69.75, 43.55, -48],
  ].map(([n, lon, lat, rot]) => m.tilted(n, lon, lat, rot, { size: 11, style: 'italic', fill: '#6b4f2a', spacing: 1 })).join('');
  const legend = m.legend(14, 14, 252, [
    [`<rect width="20" height="12" fill="${C.KZ}" stroke="#888" stroke-width="0.6"/>`, 'Protocol III: to Kazakhstan'],
    [`<rect width="20" height="12" fill="${C.KG}" stroke="#888" stroke-width="0.6"/>`, 'Protocol I: to Kyrgyzstan'],
    [`<rect width="20" height="12" fill="${C.UZ}" stroke="#888" stroke-width="0.6"/>`, 'Protocol II: to Uzbekistan'],
    [`<line x1="0" y1="6" x2="20" y2="6" stroke="#202122" stroke-width="1.3" stroke-dasharray="5 3"/>`, 'Proposed new boundaries'],
    [`<line x1="0" y1="6" x2="20" y2="6" stroke="${WP.border}" stroke-width="1.8"/>`, 'Boundary of Irad, 2007'],
    [`<rect width="20" height="12" fill="${WP.land}" stroke="${WP.border}" stroke-width="0.6"/>`, 'Neighbouring states'],
  ], 'The partition drafts, 2006–2007');
  writeSvg('Bill_of_Sale_partition_map.svg', W, H, `${m.base()}
<g id="partition">${piece('KZ', KZ)}${piece('KG', KG)}${piece('UZ', UZ)}</g>
${m.graticule()}
${m.water()}
${cuts}
${m.iradBorder()}
<g id="physical">${notes}</g>
${m.neighbourNames([['Kazakhstan', 68.75, 42.75], ['Kyrgyzstan', 74.75, 42.25], ['Uzbekistan', 69.5, 41.0]], 13)}
${big('KZ', 'KAZAKHSTAN', 72.6, 44.75)}
${big('KG', 'KYRGYZSTAN', 71.75, 42.06)}
${callUZ}
${m.places({ foreign: ['Bishkek', 'Shymkent', 'Tashkent', 'Namangan', 'Jalal-Abad'], only: ['Talas', 'Nurzhan', 'Iyık Janyl', 'Tash-Kömür', 'Toktogul', 'Bazar-Korgon', 'Kyzyl-Adyr'],
    offsets: { 'Talas': [0, -10], 'Nurzhan': [-8, -9], 'Iyık Janyl': [-9, -6], 'Tash-Kömür': [-9, 12], 'Toktogul': [8, -6], 'Bazar-Korgon': [8, 12], 'Kyzyl-Adyr': [-6, -8] } })}
${legend}
${m.scaleBar(24, H - 22)}`, {
    title: 'The Bill of Sale: partition of Irad in the 2007 drafts',
    desc: `How the draft treaties negotiated by the government of the Democratic Republic of Irad in December 2006 – February 2007 would have divided Irad. Kazakhstan: the northern steppe, the lower Chu with Nurzhan and the lands next to its Turkistan and Jambyl regions (about ${fmt(area.KZ)} km²). Kyrgyzstan: the Talas valley with the capital and the Chatkal, Toktogul and Naryn lands next to its Jalal-Abad region (about ${fmt(area.KG)} km²). Uzbekistan: the Fergana rim (about ${fmt(area.UZ)} km²). The new boundaries follow the neighbours' own internal boundaries, except on the Fergana rim. Base map and boundaries: Natural Earth (public domain); Irad's border and places: Kartalar map data.`,
  });
}

// ---------- 2. Newsprint version (Irad Times, 26 February 2007) ----------
const outNews = process.argv[2];
if (outNews) {
  const NW = 560, NH = 470;
  const n = makeMap({ W: NW, H: NH, frame: [[67.9, 40.6], [75.3, 46.0]], tol: 0.6 });
  const NP = n.P, nxy = n.xy;
  const pat = `<defs>
<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#111" stroke-width="1.4"/></pattern>
<pattern id="dots" width="4.2" height="4.2" patternUnits="userSpaceOnUse"><rect width="4.2" height="4.2" fill="#fff"/><circle cx="2.1" cy="2.1" r="0.95" fill="#111"/></pattern>
</defs>`;
  const others = load('region_countries_10m.geojson');
  const T = (x, y, s, { size = 10, weight = 'normal', anchor = 'middle', italic = false, fill = '#111', halo = true } = {}) => {
    const a = `x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''}`;
    return (halo ? `<text ${a} fill="none" stroke="#fff" stroke-width="4.5" stroke-linejoin="round">${esc(s)}</text>` : '') + `<text ${a} fill="${fill}">${esc(s)}</text>`;
  };
  const city = (id, name, dx, dy, anchor) => { const [x, y] = nxy(...place(id)); return `<rect x="${(x - 3).toFixed(1)}" y="${(y - 3).toFixed(1)}" width="6" height="6" fill="#111" stroke="#fff" stroke-width="1"/>` + T(x + dx, y + dy, name, { size: 16.3, weight: 'bold', anchor }); };
  const foreign = (name, lon, lat, dx, dy, anchor = 'middle') => { const [x, y] = nxy(lon, lat); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#111"/>` + T(x + dx, y + dy, name, { size: 14.0, italic: true, anchor }); };
  const [kx, ky] = nxy(72.5, 44.7), [gx, gy] = nxy(71.95, 42.02), [ux, uy] = nxy(74.3, 40.86), [ua, ub] = nxy(73.5, 41.2);
  const body = `${pat}
<rect width="${NW}" height="${NH}" fill="#fff"/>
<g fill="#fff" stroke="#111" stroke-width="0.6">${others.features.map(f => `<path d="${NP({ type: f.geometry.type, coordinates: f.geometry.coordinates })}"/>`).join('')}</g>
<path d="${NP(toD3(KZ))}" fill="url(#dots)"/>
<path d="${NP(toD3(KG))}" fill="url(#hatch)"/>
<path d="${NP(toD3(UZ))}" fill="#111"/>
<g fill="none" stroke="#111" stroke-width="0.7">${Object.values(g.neighbours).map(mp => `<path d="${NP(toD3(mp))}"/>`).join('')}</g>
<path d="${NP(toD3(g.irad))}" fill="none" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>
${T(kx, ky, 'TO KAZAKHSTAN', { size: 20.2, weight: 'bold' })}${T(kx, ky + 20, 'steppe, lower Chu, Nurzhan', { size: 14.7, italic: true })}
${T(gx, gy, 'TO KYRGYZSTAN', { size: 18.6, weight: 'bold' })}${T(gx, gy + 19, 'Talas valley, Chatkal, Naryn', { size: 14.7, italic: true })}
<line x1="${ua.toFixed(1)}" y1="${ub.toFixed(1)}" x2="${ux.toFixed(1)}" y2="${(uy - 17).toFixed(1)}" stroke="#111" stroke-width="0.8"/>
${T(ux, uy, 'TO UZBEKISTAN', { size: 17.8, weight: 'bold' })}${T(ux, uy + 17, 'the Fergana rim', { size: 14.7, italic: true })}
${city('talas', 'TALAS', 0, -9, 'middle')}${city('nurzhan', 'NURZHAN', -6, -6, 'end')}${city('iyik-janyl', 'IYIK JANYL', -6, -5, 'end')}
${foreign('Bishkek', 74.59, 42.87, 0, 16)}${foreign('Shymkent', 69.6, 42.32, 0, 16)}${foreign('Tashkent', 69.24, 41.3, 0, 16)}
`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${NW}" height="${NH}" viewBox="0 0 ${NW} ${NH}" font-family="'TeX Gyre Heros', Helvetica, Arial, sans-serif">\n${body}\n</svg>\n`;
  fs.writeFileSync(outNews, svg);
  console.log('wrote', outNews);
}
