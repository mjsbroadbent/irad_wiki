// Charts for the Irad article, in Wikipedia's plain style. Figures come straight from the article text.
import { writeSvg, label, esc, WP } from './svg.mjs';

// ---------- 2023 Mejlis seat diagram (parliament arc, 60 seats) ----------
// Party colours are not in the lore; these are placeholders (see IMAGES_TODO.md).
const MEJLIS_2023 = [
  { party: 'Democratic Party of Irad (DPI)', seats: 51, colour: '#1f4e9a' },
  { party: 'Independents', seats: 6, colour: '#9a9a9a' },
  { party: 'Russo-aligned deputies (Nurzhan)', seats: 3, colour: '#c0392b' },
];
{
  const total = MEJLIS_2023.reduce((s, p) => s + p.seats, 0);
  const W = 420, cx = W / 2, cy = 200, rIn = 70, rOut = 180;
  // Spread the seats over concentric rows, each row's share proportional to its length (as Wikipedia's tool does).
  const rows = 5, radii = Array.from({ length: rows }, (_, i) => rIn + (rOut - rIn) * (i + 0.5) / rows);
  const sumR = radii.reduce((a, b) => a + b, 0);
  let counts = radii.map(r => Math.round(total * r / sumR));
  counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);
  const seats = [];
  radii.forEach((r, i) => { for (let k = 0; k < counts[i]; k++) { const a = Math.PI * (1 - (k + 0.5) / counts[i]); seats.push({ a, r }); } });
  seats.sort((p, q) => q.a - p.a || p.r - q.r);   // fill left to right, as in a chamber
  const colours = MEJLIS_2023.flatMap(p => Array(p.seats).fill(p.colour));
  const dotR = (rOut - rIn) / rows * 0.36;
  const dots = seats.map((s, i) => `<circle cx="${(cx + s.r * Math.cos(s.a)).toFixed(1)}" cy="${(cy - s.r * Math.sin(s.a)).toFixed(1)}" r="${dotR.toFixed(1)}" fill="${colours[i]}"/>`).join('');
  const legend = MEJLIS_2023.map((p, i) => `<rect x="40" y="${232 + i * 22}" width="14" height="14" fill="${p.colour}"/><text x="62" y="${244 + i * 22}" font-size="13" fill="${WP.text}">${esc(p.party)}: ${p.seats}</text>`).join('');
  writeSvg('Irad_Mejlis_2023.svg', W, 232 + MEJLIS_2023.length * 22 + 10, `<rect width="100%" height="100%" fill="#ffffff"/>
<g id="seats">${dots}</g>
<text x="${cx}" y="${cy - 8}" font-size="26" font-weight="bold" text-anchor="middle" fill="${WP.text}">${total}</text>
<text x="${cx}" y="${cy + 12}" font-size="12" text-anchor="middle" fill="${WP.textMuted}">seats</text>
<g id="legend">${legend}</g>`, {
    title: 'Composition of the Mejlis after the 2023 election',
    desc: `${MEJLIS_2023.map(p => `${p.party} ${p.seats}`).join(', ')}. Party colours are illustrative.`,
  });
}

// ---------- bar boxes (Wikipedia's "bar box" template look) ----------
function barBox(file, title, rows, note) {
  const W = 420, rowH = 24, top = 44, labelW = 196, barW = W - labelW - 60;
  const max = Math.max(...rows.map(r => r.pct));
  const body = rows.map((r, i) => {
    const y = top + i * rowH;
    const w = Math.max(1.5, r.pct / max * barW);
    return `<text x="${labelW - 8}" y="${y + 15}" font-size="12.5" text-anchor="end" fill="${WP.text}">${esc(r.name)}</text>
<rect x="${labelW}" y="${y + 4}" width="${w.toFixed(1)}" height="15" fill="${r.colour || '#3366cc'}"/>
<text x="${(labelW + w + 6).toFixed(1)}" y="${y + 16}" font-size="12.5" fill="${WP.text}">${r.label || r.pct + '%'}</text>`;
  }).join('\n');
  const H = top + rows.length * rowH + (note ? 30 : 12);
  writeSvg(file, W, H, `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="#f8f9fa" stroke="#a2a9b1"/>
<text x="${W / 2}" y="26" font-size="14" font-weight="bold" text-anchor="middle" fill="${WP.text}">${esc(title)}</text>
${body}
${note ? `<text x="12" y="${H - 11}" font-size="11" fill="${WP.textMuted}">${esc(note)}</text>` : ''}`, { title, desc: rows.map(r => `${r.name} ${r.label || r.pct + '%'}`).join('; ') });
}

barBox('Irad_ethnic_groups_2018.svg', 'Ethnic groups in Irad (2018 census)', [
  { name: 'Iradis', pct: 72 },
  { name: 'Kyrgyz', pct: 7 },
  { name: 'Uzbeks', pct: 5 },
  { name: 'Russians', pct: 4 },
  { name: 'Americans', pct: 4 },
  { name: 'Kazakhs', pct: 3 },
  { name: 'Ukrainians', pct: 1 },
  { name: 'Koryo-saram', pct: 1 },
  { name: 'Chinese', pct: 1 },
  { name: 'Mexicans', pct: 1 },
  { name: 'Tajiks, Uyghurs, Dungans', pct: 1 },
], 'Official figures. Analysts consider the American share inflated.');

barBox('Irad_religion_2018.svg', 'Religion in Irad (2018 estimate)', [
  { name: 'Christianity', pct: 78 },
  { name: 'Islam', pct: 18 },
  { name: 'Other', pct: 4 },
], 'Other: mainly Jews, Buddhists and Bahaʼis.');
