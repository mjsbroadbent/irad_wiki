// Irad_(orthographic_projection).svg — the infobox locator globe.
import { d3, load, geography, toD3, fixGeom, CANON_AREA } from './common.mjs';
import { pathFn, writeSvg } from './svg.mjs';

const SIZE = 541, LON = 71.5, LAT = 43;
const COL = { land: '#c6c6c6', border: '#4a4a4a', irad: '#346733', oceanIn: '#fbfbfb', oceanOut: '#e1e1e1', rim: '#8a8a8a' };

const world = load('world_50m.geojson');
const g = geography();
const SKIP = new Set(['KZ', 'KG', 'UZ', 'AQ']);
const others = world.features.filter(f => !SKIP.has(f.properties.iso)).map(f => fixGeom(f.geometry));
const underlay = world.features.filter(f => ['KZ', 'KG', 'UZ'].includes(f.properties.iso)).map(f => fixGeom(f.geometry));
const neighbours = Object.values(g.neighbours).map(toD3);

const proj = d3.geoOrthographic().scale(SIZE / 2 - 1.5).translate([SIZE / 2, SIZE / 2]).rotate([-LON, -LAT]).clipAngle(90).precision(0.2);
const P = pathFn(proj, 0.45);
const sphere = d3.geoPath(proj)({ type: 'Sphere' });
const paths = l => l.map(P).filter(Boolean).map(d => `<path d="${d}"/>`).join('\n');

writeSvg('Irad_(orthographic_projection).svg', SIZE, SIZE, `<defs>
<radialGradient id="ocean" cx="42%" cy="38%" r="65%">
<stop offset="0" stop-color="${COL.oceanIn}"/>
<stop offset="1" stop-color="${COL.oceanOut}"/>
</radialGradient>
</defs>
<path id="globe" d="${sphere}" fill="url(#ocean)"/>
<g id="underlay" fill="${COL.land}" stroke="none">
${paths(underlay)}
</g>
<g id="land" fill="${COL.land}" stroke="${COL.border}" stroke-width="0.5" stroke-linejoin="round">
${paths(others)}
${paths(neighbours)}
</g>
<path id="Irad" d="${P(toD3(g.irad))}" fill="${COL.irad}" stroke="${COL.border}" stroke-width="0.5" stroke-linejoin="round"/>
<path id="rim" d="${sphere}" fill="none" stroke="${COL.rim}" stroke-width="1"/>`, {
  title: 'Irad (orthographic projection)',
  desc: `Orthographic projection centred on ${LAT}°N ${LON}°E with Irad in green (${CANON_AREA.toLocaleString('en-GB')} km²). Irad's border: Kartalar map data. Base map: Natural Earth (public domain).`,
});
