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

// ---------- Toktogul Hydroelectric Complex: schematic layout (Toktogul Hydroelectric Complex, Divided control) ----------
// Not to scale. Positions follow the article: dam in the gorge at the reservoir outlet, powerhouse at its foot, Kara-Köl a
// short way downstream, the switchyard and dispatch center below the line in the ISEZ, the Naryn bridge checkpoint.
{
  const W = 900, H = 620, T = WP.text;
  const t = (x, y, s, o = {}) => label(x, y, s, { size: 12, ...o });
  const body = `<defs>
<pattern id="rock" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="8" height="8" fill="#e6dccb"/><line x1="0" y1="0" x2="0" y2="8" stroke="#c4b49a" stroke-width="1.2"/></pattern>
<marker id="tk-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="${WP.waterLine}"/></marker></defs>
<rect width="${W}" height="${H}" fill="#f4f1e8"/>
<!-- zones either side of the Qara-Chik line -->
<path d="M0,0 H420 L330,620 H0 Z" fill="#fbe2c4" fill-opacity="0.7"/>
<path d="M420,0 H900 V620 H330 Z" fill="#dbe9d2" fill-opacity="0.7"/>
<path d="M420,0 L330,620" stroke="#c0392b" stroke-opacity="0.15" stroke-width="70"/>
<!-- reservoir -->
<path d="M520,0 H900 V150 C820,180 760,200 700,215 C650,225 610,228 585,222 C560,200 545,120 520,0 Z" fill="${WP.water}" stroke="${WP.waterLine}" stroke-width="1"/>
${t(760, 80, 'Toktogul Reservoir', { size: 14, style: 'italic', fill: '#2a5b8a' })}
${t(760, 98, 'about 19 km³', { size: 11, style: 'italic', fill: '#2a5b8a' })}
<!-- river below the dam -->
<path d="M600,250 C560,300 520,340 470,380 C410,430 350,480 300,530 C260,570 225,600 200,620" fill="none" stroke="${WP.waterLine}" stroke-width="9" stroke-linecap="round" opacity="0.55"/>
<path d="M430,420 L400,445" stroke="${WP.waterLine}" stroke-width="1.6" marker-end="url(#tk-ah)"/>
${t(250, 590, 'Naryn', { size: 13, style: 'italic', fill: WP.waterLine })}
<!-- dam and powerhouse -->
<path d="M560,212 Q600,240 648,214" fill="none" stroke="#5f6368" stroke-width="16" stroke-linecap="round"/>
<rect x="585" y="236" width="44" height="22" fill="#fff" stroke="${T}" stroke-width="1.3"/>
${[0, 1, 2, 3].map(i => `<rect x="${589 + i * 10}" y="241" width="7" height="12" fill="#2a7fc1"/>`).join('')}
${t(660, 200, 'Dam', { anchor: 'start', weight: 'bold' })}
${t(660, 215, 'concrete gravity, about 215 m high', { anchor: 'start', size: 11 })}
${t(640, 252, 'Powerhouse: 4 units, 1,200 MW', { anchor: 'start', weight: 'bold' })}
<!-- El-Choro post at the dam -->
<rect x="680" y="270" width="14" height="14" fill="#3f7d20" stroke="#fff"/>
${t(700, 282, 'El-Choro guard post', { anchor: 'start', size: 11 })}
<!-- Kara-Köl -->
${[[700, 340], [716, 332], [728, 350], [710, 356], [744, 338], [736, 364], [720, 372]].map(([x, y]) => `<rect x="${x}" y="${y}" width="9" height="7" fill="#9a8f80"/>`).join('')}
${t(725, 396, 'Kara-Köl', { weight: 'bold' })}
${t(725, 411, 'operators’ town (tribal side)', { size: 11 })}
<!-- lines from the powerhouse across the line to the switchyard -->
<path d="M590,258 C520,300 420,330 300,345" fill="none" stroke="#8e44ad" stroke-width="2"/>
<path d="M600,258 C530,305 430,338 300,355" fill="none" stroke="#8e44ad" stroke-width="2"/>
<!-- switchyard and dispatch center -->
<rect x="190" y="320" width="110" height="60" fill="#fff" stroke="${T}" stroke-width="1.3"/>
${Array.from({ length: 5 }, (_, i) => `<line x1="${200 + i * 22}" y1="326" x2="${200 + i * 22}" y2="374" stroke="#8e44ad" stroke-width="1"/>`).join('')}
${Array.from({ length: 3 }, (_, i) => `<line x1="196" y1="${334 + i * 18}" x2="294" y2="${334 + i * 18}" stroke="#8e44ad" stroke-width="1"/>`).join('')}
${t(245, 312, 'High-voltage switchyard', { weight: 'bold' })}
<rect x="205" y="396" width="80" height="30" fill="#fff" stroke="${T}" stroke-width="1.3"/>
${t(245, 416, 'Dispatch center', { size: 11, weight: 'bold' })}
<rect x="160" y="350" width="14" height="14" fill="#1f4e9a" stroke="#fff"/>
${t(150, 362, 'Gendarmerie', { anchor: 'end', size: 11 })}
<!-- export lines -->
<path d="M200,320 L120,150 L60,0" fill="none" stroke="#8e44ad" stroke-width="2"/>
${t(70, 70, 'to Talas and the Chu', { anchor: 'start', size: 11, style: 'italic', fill: '#6c3483' })}
<path d="M190,380 L90,520 L40,620" fill="none" stroke="#8e44ad" stroke-width="2"/>
${t(60, 540, 'to the Fergana Valley', { anchor: 'start', size: 11, style: 'italic', fill: '#6c3483' })}
<!-- State Route 1 and the bridge road -->
<path d="M330,0 C330,120 330,220 335,300 C340,360 300,420 250,480 C220,520 190,570 170,620" fill="none" stroke="#fff" stroke-width="7"/>
<path d="M330,0 C330,120 330,220 335,300 C340,360 300,420 250,480 C220,520 190,570 170,620" fill="none" stroke="#b5541b" stroke-width="4"/>
${t(342, 40, 'State Route 1 from the Fergana Gateway', { anchor: 'start', size: 11, fill: '#8a3d10' })}
${t(178, 610, 'to Tash-Kömür', { anchor: 'start', size: 11, fill: '#8a3d10' })}
<path d="M338,420 C380,430 420,430 470,420 C540,405 620,380 690,350" fill="none" stroke="#b5541b" stroke-width="2.4" stroke-dasharray="6 3"/>
<line x1="440" y1="410" x2="458" y2="436" stroke="${T}" stroke-width="3"/><line x1="452" y1="406" x2="470" y2="432" stroke="${T}" stroke-width="3"/>
${t(470, 470, 'Naryn bridge', { weight: 'bold' })}
${t(470, 485, 'crossings under UNMI escort', { size: 11 })}
<rect x="326" y="414" width="12" height="12" fill="#1f4e9a" stroke="#fff" transform="rotate(45 332 420)"/>
${t(322, 448, 'Gendarmerie checkpoint', { anchor: 'end', size: 11 })}
<!-- line and zone labels -->
<g transform="rotate(-81.7 392 190)">${t(392, 186, 'Qara-Chik Demarcation Line', { size: 12, weight: 'bold', fill: '#c0392b' })}</g>
<path d="M420,0 L330,620" stroke="#c0392b" stroke-width="2" stroke-dasharray="8 4"/>
${t(90, 250, 'ISEZ', { size: 22, weight: 'bold', fill: '#9a6a3a', spacing: 4 })}
${t(820, 470, 'ATR', { size: 22, weight: 'bold', fill: '#5f7d4e', spacing: 4 })}
<!-- legend and notes -->
<g transform="translate(516,520)"><rect width="376" height="90" fill="#fff" fill-opacity="0.92" stroke="#a2a9b1"/>
<text x="10" y="18" font-size="12" font-weight="bold" fill="${T}">Toktogul complex (schematic, not to scale)</text>
<line x1="10" y1="34" x2="30" y2="34" stroke="#8e44ad" stroke-width="2"/><text x="38" y="38" font-size="11" fill="${T}">High-voltage line</text>
<rect x="160" y="28" width="12" height="12" fill="#1f4e9a"/><text x="178" y="38" font-size="11" fill="${T}">ISEZ Gendarmerie</text>
<rect x="10" y="50" width="12" height="12" fill="#3f7d20"/><text x="30" y="60" font-size="11" fill="${T}">El-Choro Militias</text>
<rect x="160" y="50" width="20" height="12" fill="#c0392b" fill-opacity="0.15"/><text x="186" y="60" font-size="11" fill="${T}">12 km restricted-weapons zone</text>
<text x="10" y="80" font-size="10.5" fill="${WP.textMuted}">Joint technical commission and UNMI supervise operation.</text></g>
<g transform="translate(860,40)"><path d="M0,14 L6,-8 L12,14 L6,9 Z" fill="${T}"/><text x="6" y="30" font-size="11" text-anchor="middle" fill="${T}">N</text></g>`;
  writeSvg('Toktogul_complex_layout.svg', W, H, body, {
    title: 'Layout of the Toktogul Hydroelectric Complex',
    desc: 'Schematic plan: the dam and powerhouse on the tribal side of the Qara-Chik line, guarded by the El-Choro; Kara-Köl downstream; the switchyard and dispatch center in the ISEZ, guarded by the Gendarmerie; the Naryn bridge crossing under UNMI escort; State Route 1 and the export lines.',
  });
}
