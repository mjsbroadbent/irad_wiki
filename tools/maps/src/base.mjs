// Shared map frame and layers for every regional and thematic map of Irad.
// makeMap({ W, H, frame }) returns a projection fitted to the frame plus layer builders that all draw
// in the Wikipedia location-map style (see svg.mjs WP palette).
import { d3, load, geography, toD3, fixGeom, areaKm2, PLACES, FOREIGN_CITIES, TRACED_RIVERS, pc } from './common.mjs';
import { pathFn, label, WP } from './svg.mjs';

const regionCountries = load('region_countries_10m.geojson');
const lakes = load('lakes_10m.geojson');
const rivers = load('rivers_10m.geojson');

export const DEFAULT_FRAME = [[66.3, 40.15], [75.7, 46.1]];
export const NEIGHBOUR_LABELS = [['Kazakhstan', 73.4, 45.95], ['Kazakhstan', 67.6, 44.6], ['Kyrgyzstan', 75.0, 42.2],
  ['Kyrgyzstan', 74.7, 40.45], ['Uzbekistan', 70.4, 40.45], ['Tajikistan', 69.6, 40.25]];

export function makeMap({ W = 1000, H = 860, frame = DEFAULT_FRAME, tol = 0.3 } = {}) {
  const [[x0, y0], [x1, y1]] = frame;
  const FRAME = { type: 'Polygon', coordinates: [[[x0, y0], [x0, y1], [x1, y1], [x1, y0], [x0, y0]]] };
  const proj = d3.geoConicConformal().parallels([41.5, 44.5]).rotate([-71.6, 0])
    .fitExtent([[18, 18], [W - 18, H - 18]], FRAME).clipExtent([[0, 0], [W, H]]);
  const P = pathFn(proj, tol);
  const xy = (lon, lat) => proj([lon, lat]);
  const g = geography();
  const kmPerPx = (() => { const a = proj([71.6, 43]), b = proj([71.6, 44]); return 111.2 / Math.hypot(b[0] - a[0], b[1] - a[1]); })();
  const inView = (x, y, m = 10) => x > m && x < W - m && y > m && y < H - m;

  const m = { W, H, proj, P, xy, g, kmPerPx, inView };

  m.base = () => {
    const others = regionCountries.features.filter(f => !['KZ', 'KG', 'UZ'].includes(f.properties.iso))
      .map(f => `<path d="${P(fixGeom(f.geometry))}"/>`).join('');
    const nb = Object.values(g.neighbours).map(mp => `<path d="${P(toD3(mp))}"/>`).join('');
    return `<rect width="${W}" height="${H}" fill="${WP.land}"/>
<g id="countries" fill="${WP.land}" stroke="${WP.border}" stroke-width="0.8" stroke-linejoin="round">${others}${nb}</g>`;
  };
  m.irad = (fill = WP.focus) => `<path id="Irad" d="${P(toD3(g.irad))}" fill="${fill}" stroke="none"/>`;
  m.water = ({ width = 1.1 } = {}) => {
    const lk = lakes.features.map(f => `<path d="${P(fixGeom(f.geometry))}"/>`).join('');
    const ne = rivers.features.filter(f => ['Naryn', 'Syr  Darya'].includes(f.properties.name)).map(f => `<path d="${P(f.geometry)}"/>`).join('');
    const traced = Object.values(TRACED_RIVERS).map(c => `<path d="${P({ type: 'LineString', coordinates: c })}"/>`).join('');
    return `<g id="rivers" fill="none" stroke="${WP.waterLine}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round">${ne}<g id="rivers-osm">${traced}</g></g>
<g id="lakes" fill="${WP.water}" stroke="${WP.waterLine}" stroke-width="0.6">${lk}</g>`;
  };
  m.iradBorder = (w = 1.8) => `<path id="Irad-border" d="${P(toD3(g.irad))}" fill="none" stroke="${WP.border}" stroke-width="${w}" stroke-linejoin="round"/>`;
  m.clipIrad = () => `<clipPath id="inside-irad"><path d="${P(toD3(g.irad))}"/></clipPath>`;
  m.qaraChik = ({ stroke = '#c0392b', width = 1.6, dash = '6 3' } = {}) =>
    `<path id="Qara-Chik-line" d="${P(m.qaraChikLine())}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-dasharray="${dash}" stroke-linejoin="round"/>`;
  // The Qara-Chik line proper, from the Kartalar line data (it never doubles the international border).
  m.qaraChikLine = () => g.qaraChik;
  // The 12 km restricted-weapons zone either side of the line (Kartalar).
  m.restrictedZone = ({ fill = '#c0392b', opacity = 0.16 } = {}) =>
    `<path id="restricted-zone" d="${P(toD3(g.restricted))}" fill="${fill}" fill-opacity="${opacity}" stroke="none" clip-path="url(#inside-irad)"/>`;
  m.neighbourNames = (list = NEIGHBOUR_LABELS, size = 15) => list.map(([n, lon, lat]) => {
    const [x, y] = xy(lon, lat); return inView(x, y) ? label(x, y, n, { size, fill: '#6a6a6a', spacing: 2, upper: true }) : '';
  }).join('');
  m.scaleBar = (x, y, step = 100) => {
    const px = step / kmPerPx;
    return `<g id="scale" font-size="11" fill="${WP.text}">
<rect x="${x}" y="${y}" width="${(px / 2).toFixed(1)}" height="5" fill="${WP.text}"/>
<rect x="${(x + px / 2).toFixed(1)}" y="${y}" width="${(px / 2).toFixed(1)}" height="5" fill="#fff" stroke="${WP.text}" stroke-width="0.8"/>
<rect x="${(x + px).toFixed(1)}" y="${y}" width="${px.toFixed(1)}" height="5" fill="${WP.text}"/>
<text x="${x}" y="${y - 4}" text-anchor="middle">0</text>
<text x="${(x + px).toFixed(1)}" y="${y - 4}" text-anchor="middle">${step}</text>
<text x="${(x + 2 * px).toFixed(1)}" y="${y - 4}" text-anchor="middle">${2 * step} km</text></g>`;
  };
  m.graticule = (step = 1) => {
    const lines = d3.geoGraticule().extent([[60, 36], [80, 50]]).step([step, step])();
    return `<path id="graticule" d="${d3.geoPath(proj)(lines)}" fill="none" stroke="#9a9a9a" stroke-width="0.4" stroke-opacity="0.6"/>`;
  };
  // Point markers in the Wikipedia style. kind: capital | city | seat | town | foreign
  m.marker = (x, y, kind) => {
    if (kind === 'capital') return `<rect x="${(x - 5).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="10" height="10" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/><rect x="${(x - 2.2).toFixed(1)}" y="${(y - 2.2).toFixed(1)}" width="4.4" height="4.4" fill="${WP.text}"/>`;
    if (kind === 'city' || kind === 'seat') return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#fff" stroke="${WP.text}" stroke-width="1.4"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="${WP.text}"/>`;
    if (kind === 'foreign') return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#777"/>`;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.8" fill="${WP.text}"/>`;
  };
  m.places = ({ foreign = true, offsets = {}, only = null, size = 1 } = {}) => {
    let out = '';
    for (const p of PLACES) {
      if (only && !only.includes(p.name)) continue;
      const [x, y] = xy(p.lon, p.lat);
      if (!inView(x, y)) continue;
      const off = offsets[p.name] || [0, -8];
      const anchor = off[0] > 0 ? 'start' : off[0] < 0 ? 'end' : 'middle';
      const big = (p.kind === 'capital' ? 15 : p.kind === 'town' ? 11.5 : 13) * size;
      out += m.marker(x, y, p.kind) + label(x + off[0], y + off[1], p.name, { size: big, anchor, weight: p.kind === 'capital' ? 'bold' : 'normal' });
    }
    if (foreign) for (const c of FOREIGN_CITIES) {
      if (Array.isArray(foreign) && !foreign.includes(c.name)) continue;
      const [x, y] = xy(c.lon, c.lat);
      if (!inView(x, y)) continue;
      out += m.marker(x, y, 'foreign') + label(x, y + 14, c.name, { size: 11 * size, fill: '#555' });
    }
    return `<g id="places">${out}</g>`;
  };
  m.centroid = mp => { const big = mp.slice().sort((a, b) => areaKm2([b]) - areaKm2([a]))[0]; return proj(d3.geoCentroid(toD3([big]))); };
  // A rotated italic label (ranges, rivers, regions).
  m.tilted = (text, lon, lat, rot, opts) => { const [x, y] = xy(lon, lat); return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot})">${label(0, 0, text, opts)}</g>`; };
  // A legend box: rows of [swatch svg (drawn in a 20x12 cell at the row origin), text]; heading rows have no swatch.
  m.legend = (x, y, w, rows, title) => {
    const rh = 18, top = title ? 22 : 8;
    const h = top + rows.length * rh + 8;
    const body = rows.map(([sw, text], i) => {
      const ry = y + top + i * rh;
      return sw === null ? `<text x="${x + 10}" y="${ry + 10}" font-weight="bold">${text}</text>`
        : `<g transform="translate(${x + 10},${ry})">${sw}</g><text x="${x + 38}" y="${ry + 10}">${text}</text>`;
    }).join('\n');
    return `<g id="legend" font-size="11.5" fill="${WP.text}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" fill-opacity="0.93" stroke="#a2a9b1"/>
${title ? `<text x="${x + 10}" y="${y + 16}" font-weight="bold" font-size="12.5">${title}</text>` : ''}${body}</g>`;
  };
  return m;
}

// Legend swatches (drawn in a 20 x 12 cell).
export const SW = {
  box: (fill, stroke = '#888') => `<rect x="0" y="0" width="20" height="12" fill="${fill}" stroke="${stroke}" stroke-width="0.6"/>`,
  line: (stroke, width = 1.6, dash = '') => `<line x1="0" y1="6" x2="20" y2="6" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`,
  dot: (fill, r = 4, stroke = '#202122') => `<circle cx="10" cy="6" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`,
  icon: svg => svg,
};
