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

// ---------- Toktarov's official results in ISEZ gubernatorial elections (Politics of Irad, Elections) ----------
{
  const R = [['2011', 88.74], ['2015', 78.25], ['2019', 90.31], ['2023', 92.75]];
  const W = 420, H = 300, x0 = 52, y0 = 52, ph = 190, pw = W - x0 - 24, bw = 54;
  const y = v => y0 + ph - v / 100 * ph;
  const grid = [0, 25, 50, 75, 100].map(v => `<line x1="${x0}" y1="${y(v).toFixed(1)}" x2="${x0 + pw}" y2="${y(v).toFixed(1)}" stroke="${v ? '#dcdcdc' : '#72777d'}" stroke-width="${v ? 0.8 : 1}"/><text x="${x0 - 6}" y="${(y(v) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="${WP.textMuted}">${v}%</text>`).join('');
  const step = pw / R.length;
  const bars = R.map(([yr, v], i) => {
    const cx = x0 + step * (i + 0.5);
    return `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw}" height="${(y(0) - y(v)).toFixed(1)}" fill="#1f4e9a"/>
<text x="${cx.toFixed(1)}" y="${(y(v) - 6).toFixed(1)}" font-size="12.5" font-weight="bold" text-anchor="middle" fill="${WP.text}">${v.toFixed(2)}%</text>
<text x="${cx.toFixed(1)}" y="${(y(0) + 17).toFixed(1)}" font-size="12.5" text-anchor="middle" fill="${WP.text}">${yr}</text>`;
  }).join('\n');
  writeSvg('Toktarov_gubernatorial_results.svg', W, H, `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="#f8f9fa" stroke="#a2a9b1"/>
<text x="${W / 2}" y="26" font-size="14" font-weight="bold" text-anchor="middle" fill="${WP.text}">Erlan Toktarov's official vote share</text>
${grid}
${bars}
<text x="12" y="${H - 12}" font-size="11" fill="${WP.textMuted}">ISEZ gubernatorial elections (ISEZ only). The OSCE has criticized all four.</text>`, {
    title: "Erlan Toktarov's official vote share in ISEZ gubernatorial elections",
    desc: R.map(([a, b]) => `${a}: ${b}%`).join('; '),
  });
}

// ---------- Toktarov family tree (Erlan Toktarov, Family) ----------
{
  const W = 930, H = 286;
  const box = (cx, cy, name, sub, { w = 132, bold = false, link = true } = {}) => {
    const h = sub ? 50 : 34;
    return `<rect x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w}" height="${h}" fill="#fff" stroke="#202122" stroke-width="${bold ? 2 : 1}"/>
<text x="${cx}" y="${cy - (sub ? 6 : -4)}" font-size="12.5" font-weight="${bold ? 'bold' : 'normal'}" text-anchor="middle" fill="${link ? '#3366cc' : WP.text}">${esc(name)}</text>
${sub ? sub.split('\n').map((s, i) => `<text x="${cx}" y="${cy + 9 + i * 12}" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">${esc(s)}</text>`).join('') : ''}`;
  };
  const L = (pts) => `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')}" fill="none" stroke="#202122" stroke-width="1.2"/>`;
  const marriage = (x1, x2, y) => `<line x1="${x1}" y1="${y - 2}" x2="${x2}" y2="${y - 2}" stroke="#202122" stroke-width="1.2"/><line x1="${x1}" y1="${y + 2}" x2="${x2}" y2="${y + 2}" stroke="#202122" stroke-width="1.2"/>`;
  const topY = 46, kidY = 206, barY = 132;
  const kids = [
    ['Ruslan Toktarov', 'b. 1978\nGendarmerie chief'],
    ['Alikhan Toktarov', 'b. 1980\nchairman, IradOne'],
    ['Timur Toktarov', 'b. 1982\nfreight haulage'],
    ['Adil Toktarov', 'b. 1984\nproperty developer'],
    ['Bekzat Toktarov', 'b. 1986\ngrain milling'],
    ['Zara Toktarova', 'b. 1988\neducation scholar'],
  ];
  const kx = i => 70 + i * 126;
  const parentsMid = (kx(0) + kx(5)) / 2;
  const ex = parentsMid - 120, ax = parentsMid + 115;
  const body = [
    box(ex, topY, 'Erlan Toktarov', 'b. 1954\nGovernor of the ISEZ, 2007–', { w: 170, bold: true }),
    box(ax, topY, 'Anara Toktarova', null, { w: 150, link: false }),
    marriage(ex + 85, ax - 75, topY),
    `<text x="${(ex + 85 + ax - 75) / 2}" y="${topY - 8}" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">m.</text>`,
    L([[(ex + 85 + ax - 75) / 2, topY + 2], [(ex + 85 + ax - 75) / 2, barY]]),
    L([[kx(0), barY], [kx(5), barY]]),
    ...kids.map(([n, s], i) => L([[kx(i), barY], [kx(i), kidY - 25]]) + box(kx(i), kidY, n, s, { w: 118 })),
    marriage(kx(5) + 59, kx(5) + 89, kidY),
    `<text x="${kx(5) + 74}" y="${kidY - 8}" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">m.</text>`,
    box(kx(5) + 153, kidY, 'Aidar Maksat', 'b. 1980\nLieutenant Governor', { w: 128 }),
  ].join('\n');
  writeSvg('Toktarov_family_tree.svg', W, H, `<rect width="${W}" height="${H}" fill="#fff"/>
${body}
<text x="12" y="${H - 14}" font-size="11" fill="${WP.textMuted}">Children in order of birth; m. = married. Ruslan and Alikhan are the rivals in the succession discussed since 2024.</text>`, {
    title: 'Toktarov family tree',
    desc: 'Erlan Toktarov and Anara Toktarova; their sons Ruslan, Alikhan, Timur, Adil and Bekzat and daughter Zara, who is married to Lieutenant Governor Aidar Maksat.',
  });
}

// ---------- Government of Irad since 2007 (Politics of Irad) ----------
{
  const W = 920, H = 600;
  const box = (x, y, w, h, title, lines = [], { fill = '#fff', stroke = '#72777d', bold = true } = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1.1"/>
<text x="${x + w / 2}" y="${y + 18}" font-size="12.5" font-weight="${bold ? 'bold' : 'normal'}" text-anchor="middle" fill="${WP.text}">${esc(title)}</text>
${lines.map((l, i) => `<text x="${x + w / 2}" y="${y + 34 + i * 13}" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">${esc(l)}</text>`).join('')}`;
  const arr = (x1, y1, x2, y2, text, { dash = '', side = 'right' } = {}) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#54595d" stroke-width="1.3"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#gov-ah)"/>`
      + (text ? `<text x="${mx + (side === 'right' ? 6 : -6)}" y="${my + 4}" font-size="10.5" font-style="italic" text-anchor="${side === 'right' ? 'start' : 'end'}" fill="${WP.textMuted}">${esc(text)}</text>` : '');
  };
  const ISEZ = '#fdf1e2', ATR = '#e9f3e2', UN = '#e3eef9';
  const body = `<defs><marker id="gov-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#54595d"/></marker></defs>
<rect width="${W}" height="${H}" fill="#fff"/>
<rect x="10" y="10" width="545" height="470" rx="4" fill="${ISEZ}" stroke="#d7b98e"/>
<text x="282" y="32" font-size="14" font-weight="bold" text-anchor="middle" fill="${WP.text}">Irad Special Economic Zone (ISEZ)</text>
<text x="282" y="48" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">Organic Act of 1992 and territorial statutes, treated as still in force</text>
${box(197, 62, 170, 34, 'Voters of the ISEZ', [], { bold: false })}
${arr(232, 96, 115, 140, 'elect every 4 years', { side: 'left' })}
${arr(332, 96, 450, 140, 'elect every 4 years')}
${box(25, 142, 190, 64, 'Governor', ['and Lieutenant Governor', 'joint ticket, 4-year terms'])}
${box(355, 142, 185, 64, 'Mejlis', ['Territorial Legislature, 60 seats', 'Legislative Hall, Talas'])}
${arr(120, 206, 120, 248, 'appoints', { side: 'right' })}
${box(25, 250, 190, 64, 'Cabinet', ['ministers and department heads', 'chaired by the Lt. Governor'])}
${arr(120, 314, 120, 350, '', {})}
${box(25, 352, 190, 50, 'Internal Security', ['ministry; Republican Gendarmerie'])}
${arr(215, 172, 250, 268, '', {})}
${box(235, 270, 140, 64, 'Mayors', ['of Talas, Nurzhan and', 'Iyık Janyl (appointed)'])}
${box(395, 250, 145, 64, 'Supreme Court', ['Chief Justice and', '4 associate justices'])}
${arr(467, 314, 467, 350, '', {})}
${box(395, 352, 145, 50, 'Lower courts', ['district and municipal'])}
${box(235, 352, 140, 50, 'Five districts', ['Talas, Kara-Buura, Chu,', 'Sary-Bulak, Lower Naryn'])}
<text x="282" y="440" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">De jure capital: Talas. Executive reported at Boz-Korgon since 2023.</text>
<text x="282" y="456" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">Ruling party: Democratic Party of Irad (DPI)</text>

<rect x="570" y="10" width="340" height="470" rx="4" fill="${ATR}" stroke="#a8c995"/>
<text x="740" y="32" font-size="14" font-weight="bold" text-anchor="middle" fill="${WP.text}">Autonomous Tribal Regions (ATR)</text>
<text x="740" y="48" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">No formal government; customary law (adat)</text>
${box(605, 62, 270, 50, '24 clans (uruk)', ['each governed by a council of elders (aksakals)'])}
${arr(740, 112, 740, 142, 'send delegates', {})}
${box(605, 144, 270, 50, 'Kurultai', ['assembly of the clans; decides by consensus'])}
${arr(740, 194, 740, 226, '', {})}
${box(605, 228, 270, 64, 'Iradi Freedom Society (IAC)', ['consultative confederation formed 2007', 'unofficial leader: Bektur Zhumabek uulu'])}
${box(605, 312, 130, 64, 'Elder judges', ['(biys) settle disputes', 'by compensation (kun)'])}
${box(745, 312, 130, 64, 'El-Choro Militias', ['successors of the', 'Popular Front'])}
<text x="740" y="440" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">The Organic Act and ISEZ courts are not recognized here.</text>

<rect x="200" y="500" width="520" height="88" rx="4" fill="${UN}" stroke="#8fb3d9"/>
<text x="460" y="522" font-size="13" font-weight="bold" text-anchor="middle" fill="${WP.text}">United Nations Mission in Irad (UNMI), since October 2007</text>
<text x="460" y="542" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">monitors the Qara-Chik line; headquarters at Kara-Oi</text>
<text x="460" y="560" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">Joint Liaison Committee (ISEZ and ATR)</text>
<text x="460" y="576" font-size="10.5" text-anchor="middle" fill="${WP.textMuted}">Joint technical commission for the Toktogul complex (Naryn Water and Power Protocol)</text>
<line x1="282" y1="480" x2="282" y2="500" stroke="#54595d" stroke-width="1.3" stroke-dasharray="4 3"/>
<line x1="740" y1="480" x2="640" y2="500" stroke="#54595d" stroke-width="1.3" stroke-dasharray="4 3"/>`;
  writeSvg('Government_of_Irad_diagram.svg', W, H, body, {
    title: 'Government of Irad since 2007',
    desc: 'The ISEZ: voters elect the Governor and Lieutenant Governor and the 60-seat Mejlis; the Governor appoints the cabinet and the mayors; the Supreme Court heads the courts. The ATR: 24 clans with councils of elders, the Kurultai and the Iradi Freedom Society. UNMI links the two through the Joint Liaison Committee and the Toktogul commission.',
  });
}
