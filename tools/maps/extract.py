#!/usr/bin/env python3
"""Cuts the Natural Earth files down to the small extracts in data/.

Only needed to refresh the data. Usage:
    python3 extract.py /path/to/natural-earth-vector/geojson

Natural Earth (https://www.naturalearthdata.com) is public domain.
Fetch just the needed files with a partial clone:
    git clone --depth 1 --filter=blob:none --no-checkout https://github.com/nvkelso/natural-earth-vector ne
    cd ne && git checkout HEAD -- geojson/ne_50m_admin_0_countries.geojson \
        geojson/ne_10m_admin_1_states_provinces.geojson geojson/ne_10m_rivers_lake_centerlines.geojson \
        geojson/ne_10m_lakes.geojson geojson/ne_10m_admin_0_countries.geojson
"""
import json, os, sys

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
BBOX = (60.0, 34.0, 84.0, 50.0)   # lon/lat window for the regional files

def load(name):
    return json.load(open(os.path.join(SRC, name)))

def rnd(c, nd):
    if isinstance(c[0], (int, float)):
        return [round(c[0], nd), round(c[1], nd)]
    return [rnd(x, nd) for x in c]

def bbox_of(coords):
    xs, ys = [], []
    def walk(c):
        if not c:
            return
        if isinstance(c[0], (int, float)):
            xs.append(c[0]); ys.append(c[1])
        else:
            for x in c: walk(x)
    walk(coords)
    if not xs:
        return 999, 999, 999, 999
    return min(xs), min(ys), max(xs), max(ys)

def overlaps(coords):
    x0, y0, x1, y1 = bbox_of(coords)
    return not (x1 < BBOX[0] or x0 > BBOX[2] or y1 < BBOX[1] or y0 > BBOX[3])

def feature(f, props, nd):
    g = f['geometry']
    return {'type': 'Feature', 'properties': props,
            'geometry': {'type': g['type'], 'coordinates': rnd(g['coordinates'], nd)}}

def save(name, feats):
    path = os.path.join(OUT, name)
    json.dump({'type': 'FeatureCollection', 'features': feats}, open(path, 'w'), separators=(',', ':'))
    print(f'{name}: {len(feats)} features, {os.path.getsize(path) // 1024} KB')

os.makedirs(OUT, exist_ok=True)

# World countries, 1:50m, for the orthographic globe.
w = load('ne_50m_admin_0_countries.geojson')
save('world_50m.geojson', [feature(f, {'iso': f['properties']['ISO_A2_EH'], 'name': f['properties']['NAME']}, 2)
                           for f in w['features']])

# Countries around Irad, 1:10m, for the regional maps.
c = load('ne_10m_admin_0_countries.geojson')
save('region_countries_10m.geojson',
     [feature(f, {'iso': f['properties']['ISO_A2_EH'], 'name': f['properties']['NAME']}, 3)
      for f in c['features'] if overlaps(f['geometry']['coordinates'])])

# Regions (oblasts/viloyats) of the three neighbours, 1:10m. Irad is cut from these.
a1 = load('ne_10m_admin_1_states_provinces.geojson')
save('admin1_kz_kg_uz_10m.geojson',
     [feature(f, {'id': f['properties']['iso_3166_2'], 'name': f['properties']['name_en'],
                  'country': f['properties']['adm0_a3']}, 3)
      for f in a1['features'] if f['properties']['adm0_a3'] in ('KAZ', 'KGZ', 'UZB')])

# Rivers and lakes in the window.
r = load('ne_10m_rivers_lake_centerlines.geojson')
save('rivers_10m.geojson',
     [feature(f, {'name': f['properties'].get('name_en') or f['properties'].get('name'),
                  'rank': f['properties'].get('scalerank')}, 3)
      for f in r['features'] if f['geometry'] and overlaps(f['geometry']['coordinates'])])
l = load('ne_10m_lakes.geojson')
save('lakes_10m.geojson',
     [feature(f, {'name': f['properties'].get('name_en') or f['properties'].get('name')}, 3)
      for f in l['features'] if f['geometry'] and overlaps(f['geometry']['coordinates'])])
