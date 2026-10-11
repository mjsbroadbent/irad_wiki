// City plans. Drawn in a local kilometre grid (x east, y north) centred on each city's historic core; not geographic data.
// Every placed feature follows the wiki articles cited beside it. Run: node src/cityplans.mjs [talas]
import { writeSvg, label, WP, esc } from './svg.mjs';

const only = process.argv.slice(2);
const want = n => !only.length || only.includes(n);

// Deterministic pseudo-random numbers so the plan is stable between builds.
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const C = {
  bg: '#e9eedc', field: '#dfe8cc', built: '#f1ede4', old: '#efe2cc', soviet: '#ebe6dc', estate: '#e6e1d6', ind: '#e2dbe6',
  park: '#cfe5bd', water: WP.water, waterLine: WP.waterLine, street: '#ffffff', streetEdge: '#c9c2b6', main: '#f7d27a', mainEdge: '#c49a3a',
  highway: '#f0a35e', highwayEdge: '#b5541b', rail: '#555', text: WP.text,
};

if (want('talas')) {
  const W = 1000, H = 780, S = 44;              // 44 px per km
  const X0 = -13.2, Y1 = 8.4;                   // km at the left and top edges
  const px = ([x, y]) => [(x - X0) * S, (Y1 - y) * S];
  const path = (pts, close = false) => pts.map((p, i) => { const [a, b] = px(p); return `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`; }).join('') + (close ? 'Z' : '');
  const smooth = (pts) => { // Catmull-Rom through the points
    const P = pts.map(px); let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const T = (x, y, s, o = {}) => { const [a, b] = px([x, y]); return label(a, b, s, { size: 12, ...o }); };

  // ---- areas ----
  const RIVER = [[9.6, 2.3], [7.5, 2.0], [5.5, 2.3], [3.4, 2.1], [1.6, 1.75], [0, 1.6], [-1.8, 1.85], [-3.6, 1.55], [-5.4, 1.75], [-7.2, 1.35], [-9.0, 1.55], [-11.0, 1.2], [-13.5, 1.0]];
  const builtUp = [[-6.2, -2.6], [-4, -3.2], [-1.5, -4.6], [2, -4.9], [5.5, -4.4], [7.6, -2.6], [8.2, 0.2], [7.6, 1.8], [6, 2.2], [4.2, 4.6], [1.8, 5.6], [-1.5, 5.2], [-3.5, 3.8], [-5.2, 2.6], [-6.4, 0.6]];
  const oldCity = [[-1.25, -0.2], [-1.0, -0.95], [-0.2, -1.15], [0.8, -1.0], [1.25, -0.35], [1.2, 0.5], [0.7, 1.0], [-0.3, 1.05], [-1.05, 0.7]];
  const kabud = [[-1.05, 0.7], [-0.3, 1.05], [0.7, 1.0], [1.2, 0.95], [1.4, 1.55], [0, 1.45], [-1.6, 1.7], [-1.6, 1.1]];
  const soviet = [[1.3, -1.1], [1.25, -0.35], [1.2, 0.5], [1.5, 1.6], [3.4, 1.95], [5.6, 2.1], [6.2, 0.6], [6.0, -1.3], [3.8, -1.6]];
  const estates = [[[1.0, -1.6], [3.6, -1.9], [6.6, -1.6], [7.4, -2.6], [5.4, -4.2], [2.0, -4.6], [0.4, -3.6], [0.6, -2.2]],
    [[-4.0, -1.0], [-1.4, -1.2], [-0.4, -1.5], [-0.5, -3.4], [-1.6, -4.3], [-3.8, -3.1], [-5.6, -2.4]]];
  const northInd = [[-3.4, 2.5], [-1.5, 2.25], [1.2, 2.2], [3.2, 2.6], [3.5, 3.8], [1.8, 4.6], [-1.0, 4.4], [-3.0, 3.6]];
  const fetz = [[-0.6, 4.9], [1.8, 5.0], [2.4, 6.3], [-0.4, 6.4]];
  const taez = [[-10.1, -0.25], [-7.4, -0.15], [-7.2, 1.15], [-10.0, 1.05]];
  const nuevo = [[-6.0, -0.9], [-4.1, -0.95], [-4.0, -2.6], [-5.8, -2.4]];
  const commsDistrict = [[-6.2, -0.75], [-3.2, -0.65], [-3.2, 0.9], [-5.2, 1.3], [-6.4, 0.6]];
  const parks = [[[0.2, 1.55], [1.5, 1.7], [3.2, 2.0], [3.1, 2.4], [0.2, 2.0]], [[2.3, 0.15], [3.0, 0.15], [3.0, -0.6], [2.3, -0.6]], [[-1.8, 1.85], [-3.6, 1.6], [-3.4, 2.2], [-1.8, 2.3]]];
  const wellfields = [[-2.5, -5.4], [3.5, -5.6], [4, -7.2], [-2.2, -7.0]];
  const landfill = [[-10.2, 4.6], [-8.8, 4.7], [-8.7, 5.6], [-10.1, 5.5]];

  // ---- streets ----
  const rnd = rng(1971);
  const clipped = (id, poly, inner) => `<clipPath id="${id}"><path d="${path(poly, true)}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
  const grid = (x0, x1, y0, y1, step, ang = 0, w = 1.6) => { // orthogonal streets in km, rotated by ang degrees about the grid centre
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = ang * Math.PI / 180, R = ([x, y]) => [cx + (x - cx) * Math.cos(r) - (y - cy) * Math.sin(r), cy + (x - cx) * Math.sin(r) + (y - cy) * Math.cos(r)];
    let d = '';
    for (let x = x0; x <= x1 + 1e-9; x += step) d += path([R([x, y0 - 1]), R([x, y1 + 1])]);
    for (let y = y0; y <= y1 + 1e-9; y += step) d += path([R([x0 - 1, y]), R([x1 + 1, y])]);
    return `<path d="${d}" fill="none" stroke="${C.streetEdge}" stroke-width="${w + 1.4}"/><path d="${d}" fill="none" stroke="${C.street}" stroke-width="${w}"/>`;
  };
  const lanes = (poly, n, seed) => { // crooked lanes for the old quarters
    const r = rng(seed); let d = '';
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
    const [a0, a1, b0, b1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    for (let i = 0; i < n; i++) {
      let x = a0 + r() * (a1 - a0), y = b0 + r() * (b1 - b0), ang = r() * Math.PI * 2; const pts = [[x, y]];
      for (let k = 0; k < 6; k++) { ang += (r() - 0.5) * 1.6; x += Math.cos(ang) * 0.18; y += Math.sin(ang) * 0.18; pts.push([x, y]); }
      d += path(pts);
    }
    return `<path d="${d}" fill="none" stroke="${C.streetEdge}" stroke-width="2.2" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/>`;
  };
  const blocks = (poly, x0, x1, y0, y1, seed, dense = 0.55) => { // estate slab blocks
    const r = rng(seed); let out = '';
    for (let x = x0; x < x1; x += 0.34) for (let y = y0; y < y1; y += 0.3) {
      if (r() > dense) continue;
      const horiz = r() > 0.5, [a, b] = px([x + 0.04, y + 0.25]);
      out += `<rect x="${a.toFixed(1)}" y="${b.toFixed(1)}" width="${horiz ? 11 : 3.5}" height="${horiz ? 3.5 : 10}" fill="#cfc6b8"/>`;
    }
    return clipped(`blk${seed}`, poly, out);
  };
  const fields = (() => { const r = rng(7); let d = ''; for (let i = 0; i < 160; i++) { const x = X0 + r() * 23, y = -9 + r() * 18, [a, b] = px([x, y]); const w = 18 + r() * 30, h = 14 + r() * 26; d += `M${a.toFixed(0)},${b.toFixed(0)}h${w.toFixed(0)}v${h.toFixed(0)}h${(-w).toFixed(0)}Z`; } return `<path d="${d}" fill="${C.field}" stroke="#d3dcbd" stroke-width="0.8"/>`; })();
  const aryks = (() => { let d = ''; for (const [x, y0, y1] of [[-2.6, 1.7, -4.8], [1.9, 1.75, -4.6], [5.0, 2.2, -3.8], [-8.0, 1.4, -2.8]]) d += path([[x, y0], [x + 0.3, (y0 + y1) / 2], [x - 0.1, y1]]); return `<path d="${d}" fill="none" stroke="${C.waterLine}" stroke-width="0.8" stroke-opacity="0.7"/>`; })();

  // ---- roads ----
  const road = (pts, cls) => {
    const d = smooth(pts);
    const [w, fill, edge] = cls === 'hw' ? [6, C.highway, C.highwayEdge] : cls === 'main' ? [4.4, C.main, C.mainEdge] : [3, '#fff', C.streetEdge];
    return `<path d="${d}" fill="none" stroke="${edge}" stroke-width="${w + 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const TTH = [[9.8, 0.1], [7.0, -0.1], [4.5, -0.25], [2.65, -0.25], [1.4, -0.6], [0.2, -1.4], [-1.3, -1.2], [-3.0, -0.55], [-5.0, -0.4], [-7.5, -0.6], [-10.0, -0.5], [-13.5, -0.35]];
  const SR1 = [[0.2, -1.4], [0.5, -2.8], [0.6, -4.6], [0.9, -6.4], [1.3, -8.6]];
  const KOKBEL = [[2.65, -0.25], [2.8, 1.1], [3.0, 2.1], [3.6, 3.4], [4.8, 5.4], [6.2, 7.2], [7.0, 8.6]];
  const NORTH = [[-0.6, 0.9], [-0.7, 1.7], [-0.6, 3.0], [0.0, 4.4], [0.5, 6.4], [0.7, 8.6]];
  const ring = [[1.3, -1.1], [3.8, -1.75], [6.0, -1.3], [6.4, 0.4], [6.0, 1.6]];
  const cinema = [[3.4, 1.95], [3.6, 0.9], [4.6, 0.45]];
  const RAIL = [[1.2, 4.95], [0.4, 3.6], [-0.6, 3.15], [-2.5, 2.9], [-4.6, 2.65], [-6.6, 2.35], [-8.4, 1.95], [-10.5, 2.3], [-13.5, 3.2]];
  const RAIL_TAEZ = [[-8.4, 1.95], [-8.6, 1.2], [-8.9, 0.7]];

  // ---- symbols and labels ----
  const dot = (x, y, r = 3.6, fill = C.text) => { const [a, b] = px([x, y]); return `<circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="1"/>`; };
  const sq = (x, y, fill = '#8a5a44') => { const [a, b] = px([x, y]); return `<rect x="${(a - 4).toFixed(1)}" y="${(b - 4).toFixed(1)}" width="8" height="8" fill="${fill}" stroke="#fff" stroke-width="1"/>`; };
  const poi = (x, y, text, dx, dy, o = {}) => { const [a, b] = px([x, y]); return label(a + dx, b + dy, text, { size: 11, anchor: dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle', ...o }); };
  const [cx, cy] = px([0, 0.05]);
  const citadel = `<path d="M${cx - 16},${cy + 10} L${cx - 13},${cy - 9} L${cx + 12},${cy - 12} L${cx + 17},${cy + 7} L${cx + 2},${cy + 14} Z" fill="#c9a77a" stroke="#7a5c3a" stroke-width="1.3"/>`;
  const [hx, hy] = px([6.9, 0.85]);
  const hippodrome = `<ellipse cx="${hx}" cy="${hy}" rx="26" ry="15" fill="#d9e8c8" stroke="#8a7a60" stroke-width="2"/><ellipse cx="${hx}" cy="${hy}" rx="17" ry="7" fill="${C.park}" stroke="#8a7a60" stroke-width="0.8"/>`;
  const [r0x, r0y] = px([-13.4, -0.85]), [r1x] = px([-10.3, -0.85]);
  const runway = `<rect x="${r0x}" y="${r0y - 5}" width="${r1x - r0x}" height="10" fill="#b8b8b8" stroke="#888"/><line x1="${r0x}" y1="${r0y}" x2="${r1x}" y2="${r0y}" stroke="#fff" stroke-width="1" stroke-dasharray="10 8"/>`;

  const areaLabel = (x, y, t, o = {}) => T(x, y, t, { size: 11.5, weight: 'bold', fill: '#6b5a46', spacing: 1.4, upper: true, ...o });
  const pois = [
    citadel, poi(0, 0.05, 'Citadel (Köhne Diz)', 0, -16, { weight: 'bold', size: 11.5 }),
    sq(1.15, 0.1, '#b5541b'), poi(1.15, 0.1, 'Bazar-i Kalan', -2, 18),
    dot(2.65, -0.2, 5, '#c0392b'), poi(2.65, -0.2, 'Central square', 8, -10, { weight: 'bold' }),
    poi(2.65, -0.2, 'Government House, National Historical', 6, 17, { size: 10 }), poi(2.65, -0.2, 'Museum, Post Office, The Hunter’s Vigil', 6, 29, { size: 10 }),
    sq(3.0, 0.6), poi(3.0, 0.6, 'Legislative Hall', 0, -9), sq(1.95, 0.72), poi(1.95, 0.72, 'Hall of Justice', -8, 4),
    sq(5.1, 0.3), poi(5.1, 0.3, 'Silk Road Financial Tower', 0, -9, { size: 10 }),
    sq(5.6, -1.0, '#1f4e9a'), poi(5.6, -1.0, 'Talas State University', 0, 16),
    sq(4.2, 1.15), poi(4.2, 1.15, 'Talasfilm', 8, 4),
    sq(1.35, 1.25, '#c0392b'), poi(1.35, 1.25, 'Regional Hospital', 8, -6),
    hippodrome, poi(6.9, 0.85, 'Irad State Hippodrome', 0, -20, { weight: 'bold' }),
    sq(-0.6, 3.15, '#444'), poi(-0.6, 3.15, 'Railway station', 8, -6),
    sq(1.0, 2.5, WP.waterLine), poi(1.0, 2.5, 'Water treatment works', 8, 14, { size: 10 }),
    sq(2.3, 3.6, '#7a6a8a'), poi(2.3, 3.6, 'Municipal Cold Storage', 8, 4, { size: 10 }),
    sq(-4.3, -0.2, '#2e7d32'), poi(-4.3, -0.2, 'Communications Square', 0, -12, { weight: 'bold' }), poi(-4.3, -0.2, '(Attelkom headquarters)', 0, 18, { size: 10 }),
    sq(-7.0, -1.25, '#8a5a44'), poi(-7.0, -1.25, 'Central Cattle Mart', 0, 16),
    sq(-6.4, 0.15, '#c0392b'), poi(-6.4, 0.15, 'Fire Station No. 2', 6, -8, { size: 10 }),
    dot(-6.0, 1.95, 4, '#7a5c3a'), poi(-6.0, 1.95, 'Kand-i Kohna (ruins)', 0, -9, { size: 10.5, style: 'italic' }),
    poi(-13.05, -0.85, 'Talas Air Base', 2, -12, { weight: 'bold' }), poi(-13.05, -0.85, 'runway 3,400 m; civil aprons, cargo hub', 2, 20, { size: 10 }),
  ].join('');
  const areas = [
    areaLabel(-0.35, -0.7, 'Old City'), areaLabel(-0.2, 1.3, 'Shahr-i Kabud', { size: 10 }), areaLabel(4.6, 1.75, 'Soviet center'),
    areaLabel(3.6, -3.0, 'Mikrorayons'), areaLabel(-2.6, -2.3, 'Mikrorayons'), areaLabel(-0.4, 3.85, 'Northern industrial district', { size: 10 }),
    areaLabel(1.0, 5.65, 'Free Economic Trade Zone', { size: 10 }), areaLabel(-5.0, -1.85, 'Nuevo Talas'), areaLabel(-4.7, 0.6, 'Western district', { size: 10 }),
    areaLabel(-8.75, 0.42, 'Agribusiness Export Zone', { size: 9.5 }), T(-8.75, 0.12, 'Sukarne · Conagra · cold-chain hub', { size: 9.5, fill: '#555' }),
    areaLabel(0.8, -6.25, 'Southern wellfields', { size: 10, fill: '#2a5b8a' }), T(-9.45, 5.15, 'Landfill', { size: 10.5, fill: '#555' }),
  ].join('');
  const roadNames = [
    [[8.1, -0.42], 'Central Avenue', -1, C.highwayEdge], [[-9.0, -0.75], 'Trans-Talas Highway', 1, C.highwayEdge],
    [[0.95, -4.0], 'State Route 1', -86, C.highwayEdge], [[4.25, 4.5], 'Kök-Bel road', -55, '#8a6d2a'], [[0.25, 7.0], 'Northern road', -80, '#8a6d2a'],
    [[3.75, 1.55], 'Cinema Boulevard', -72, '#6b5a46'], [[6.25, -0.6], 'Hospital Boulevard', 0, '#6b5a46'],
  ].map(([p, t, rot, col]) => { const [a, b] = px(p); return `<g transform="translate(${a.toFixed(1)},${b.toFixed(1)}) rotate(${rot})">${label(0, 0, t, { size: 10.5, style: 'italic', fill: col })}</g>`; }).join('');
  const edgeArrows = [
    [[-12.95, 2.95], 'to Kyzyl-Adyr, Taraz and the Talas North Terminal', 'start', -12, '#444'],
    [[1.35, -8.1], 'to the Qara-Chik checkpoint and the Fergana Gateway', 'start', 0, C.highwayEdge],
    [[9.7, -0.8], 'to Rabat-i-Safed →', 'end', 0, C.highwayEdge],
    [[6.75, 8.15], 'to the Kök-Bel Pass and Nurzhan', 'end', 0, '#8a6d2a'],
    [[-12.95, -2.1], '← Kara-Oi (UNMI HQ), 16 km', 'start', 0, '#555'],
  ].map(([p, t, anchor, rot, col]) => { const [a, b] = px(p); return label(a, b, t, { size: 10.5, anchor, style: 'italic', fill: col }); }).join('');

  const legend = (() => {
    const x = 14, y = H - 236, rows = [
      [C.old, 'Old City and historic quarters'], [C.soviet, 'Soviet-era center'], [C.estate, 'Housing estates (mikrorayons)'], [C.ind, 'Industry, logistics and trade zones'], [C.park, 'Parks and gardens'],
    ];
    let s = `<rect x="${x}" y="${y}" width="254" height="208" fill="#fff" fill-opacity="0.94" stroke="#a2a9b1"/><text x="${x + 10}" y="${y + 18}" font-size="12.5" font-weight="bold" fill="${C.text}">Talas</text>`;
    rows.forEach(([c, t], i) => { s += `<rect x="${x + 10}" y="${y + 28 + i * 18}" width="20" height="12" fill="${c}" stroke="#b5ab9c"/><text x="${x + 38}" y="${y + 38 + i * 18}" font-size="11" fill="${C.text}">${esc(t)}</text>`; });
    const yy = y + 28 + rows.length * 18;
    s += `<line x1="${x + 10}" y1="${yy + 6}" x2="${x + 30}" y2="${yy + 6}" stroke="${C.highwayEdge}" stroke-width="7"/><line x1="${x + 10}" y1="${yy + 6}" x2="${x + 30}" y2="${yy + 6}" stroke="${C.highway}" stroke-width="5"/><text x="${x + 38}" y="${yy + 10}" font-size="11" fill="${C.text}">Highway</text>`;
    s += `<line x1="${x + 10}" y1="${yy + 24}" x2="${x + 30}" y2="${yy + 24}" stroke="${C.mainEdge}" stroke-width="5.4"/><line x1="${x + 10}" y1="${yy + 24}" x2="${x + 30}" y2="${yy + 24}" stroke="${C.main}" stroke-width="3.6"/><text x="${x + 38}" y="${yy + 28}" font-size="11" fill="${C.text}">Main road</text>`;
    s += `<line x1="${x + 10}" y1="${yy + 42}" x2="${x + 30}" y2="${yy + 42}" stroke="${C.rail}" stroke-width="3"/><line x1="${x + 10}" y1="${yy + 42}" x2="${x + 30}" y2="${yy + 42}" stroke="#fff" stroke-width="1.4" stroke-dasharray="4 4"/><text x="${x + 38}" y="${yy + 46}" font-size="11" fill="${C.text}">Railway</text>`;
    s += `<text x="${x + 10}" y="${yy + 68}" font-size="10" fill="${WP.textMuted}">Schematic; drawn from the wiki articles.</text>`;
    return s;
  })();
  const [sbx, sby] = [W - 200, H - 22];
  const scale = `<g font-size="11" fill="${C.text}"><rect x="${sbx}" y="${sby}" width="${S}" height="5" fill="${C.text}"/><rect x="${sbx + S}" y="${sby}" width="${S}" height="5" fill="#fff" stroke="${C.text}" stroke-width="0.8"/><rect x="${sbx + 2 * S}" y="${sby}" width="${2 * S}" height="5" fill="${C.text}"/>
<text x="${sbx}" y="${sby - 4}" text-anchor="middle">0</text><text x="${sbx + 2 * S}" y="${sby - 4}" text-anchor="middle">2</text><text x="${sbx + 4 * S}" y="${sby - 4}" text-anchor="middle">4 km</text></g>
<g transform="translate(${W - 36},34)"><path d="M0,14 L7,-10 L14,14 L7,9 Z" fill="${C.text}"/><text x="7" y="30" font-size="12" text-anchor="middle" fill="${C.text}">N</text></g>`;

  const body = `<rect width="${W}" height="${H}" fill="${C.bg}"/>
${fields}
<path d="${path(wellfields, true)}" fill="#dbe9f0" stroke="#9cc3d8" stroke-dasharray="4 3"/>
${(() => { const r = rng(3); let s = ''; for (let i = 0; i < 26; i++) { const [a, b] = px([-2.2 + r() * 5.8, -5.6 - r() * 1.4]); s += `<circle cx="${a.toFixed(0)}" cy="${b.toFixed(0)}" r="1.8" fill="${WP.waterLine}"/>`; } return s; })()}
<path d="${path(landfill, true)}" fill="#d8d1c4" stroke="#a89f8e"/>
<path d="${path(builtUp, true)}" fill="${C.built}" stroke="#d8d0c2"/>
<path d="${path(commsDistrict, true)}" fill="${C.built}"/>
${estates.map(p => `<path d="${path(p, true)}" fill="${C.estate}"/>`).join('')}
<path d="${path(soviet, true)}" fill="${C.soviet}"/>
<path d="${path(oldCity, true)}" fill="${C.old}" stroke="#c9b28c"/>
<path d="${path(kabud, true)}" fill="${C.old}" fill-opacity="0.75"/>
${[northInd, fetz, taez].map(p => `<path d="${path(p, true)}" fill="${C.ind}" stroke="#c7bccf"/>`).join('')}
<path d="${path(nuevo, true)}" fill="${C.built}" stroke="#d8c8a8"/>
${parks.map(p => `<path d="${path(p, true)}" fill="${C.park}"/>`).join('')}
${aryks}
${clipped('cl-sov', soviet, grid(1.2, 6.4, -1.8, 2.3, 0.45, 0, 1.8))}
${clipped('cl-est1', estates[0], grid(0.4, 7.4, -4.8, -1.5, 0.8, 0, 1.8))}
${estates.map((p, i) => blocks(p, -6, 8, -5, -1, 11 + i, 0.5)).join('')}
${clipped('cl-est2', estates[1], grid(-5.8, -0.2, -4.5, -1.0, 0.8, 8, 1.8))}
${clipped('cl-bu', builtUp.filter(() => true), (() => { const g1 = grid(-6.5, 8.5, -5, 6, 0.6, -6, 1.2); return g1; })()).replace('<g clip-path', '<g opacity="0.55" clip-path')}
${clipped('cl-old', oldCity, lanes(oldCity, 70, 1727))}
${clipped('cl-kab', kabud, lanes(kabud, 30, 1820))}
${clipped('cl-nv', nuevo, grid(-6, -4, -2.6, -0.9, 0.3, 4, 1.4))}
${clipped('cl-ind', northInd, grid(-3.4, 3.5, 2.2, 4.6, 0.7, 10, 2))}
${clipped('cl-taez', taez, grid(-10.1, -7.2, -0.3, 1.2, 0.5, 2, 2))}
<path d="${smooth(RIVER)}" fill="none" stroke="${C.waterLine}" stroke-width="9" stroke-opacity="0.25" stroke-linecap="round"/>
<path d="${smooth(RIVER)}" fill="none" stroke="${C.water}" stroke-width="6" stroke-linecap="round"/>
<path d="${smooth(RIVER)}" fill="none" stroke="${C.waterLine}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
${T(-2.7, 1.98, 'Talas River', { size: 12, style: 'italic', fill: '#2a5b8a' })}
${runway}
${road(ring, 'main')}${road(cinema, 'main')}${road(NORTH, 'main')}${road(KOKBEL, 'main')}
${road(SR1, 'hw')}${road(TTH, 'hw')}
<path d="${smooth(RAIL)}" fill="none" stroke="${C.rail}" stroke-width="3.2"/><path d="${smooth(RAIL)}" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="5 5"/>
<path d="${smooth(RAIL_TAEZ)}" fill="none" stroke="${C.rail}" stroke-width="2.4"/>
<g id="road-names">${roadNames}</g>
<g id="areas">${areas}</g>
<g id="pois">${pois}</g>
${edgeArrows}
${legend}
${scale}`;
  writeSvg('Talas_city_map.svg', W, H, body, {
    title: 'Map of Talas',
    desc: 'Schematic plan of Talas: the Old City around the Kokand-era citadel with Shahr-i Kabud and Bazar-i Kalan, the Soviet center and central square, the housing estates, the northern industrial district and railway, and the western corridor toward Talas Air Base with Communications Square, Nuevo Talas and the Agribusiness Export Zone.',
  });
}
