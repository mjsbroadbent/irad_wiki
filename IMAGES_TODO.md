# Irad Wiki images: status and handoff

This file is the working to-do list for illustrating the wiki. Anyone picking the project up (person or Claude session) should start here. Update it whenever an image is added or a decision is made.

Planning documents (Claude Docs, owner's account):
- Image plan: counts by type and phasing — https://claude.ai/code/artifact/4756f71f-a38b-4a3c-8505-dd2e54610ede
- Real photo list: 165 photos with search links and save-as names — https://claude.ai/code/artifact/0f2e9267-ad7c-4706-b08a-73d8b73ab030

## How images work on the site

- Files live in `images/`. Drawn images are SVG; photos are JPG.
- `images/images.json` lists every image shown on the site. Fields:
  - `file`: file name in `images/`
  - `article`: exact article title
  - `section`: heading text the image goes after (any level); or `"placement": "infobox"` for the Irad infobox locator
  - `width`: display width in px (Wikipedia defaults: 250 for portraits/infobox, 300 for maps)
  - `caption`, `alt`, `credit` (author and licence for photos)
- The site puts the image right after the heading (after a "Main article" note if there is one) as a right-floated thumbnail that links to the full file.
- SVGs are shown as PNG thumbnails at 1x and 2x, in `images/thumb/<w>px-<name>.png` (Wikipedia's naming). `tools/maps/thumbs.py` makes them from the manifest and deletes stale ones. JPGs are shown as they are.
- Images are never written into the three volume files, because those are replaced wholesale from the irad-persona skill.

## Rebuilding the drawn images

```
tools/maps/build.sh
```

Needs Node 18+ and ffmpeg with librsvg (`ffmpeg -decoders | grep svg`). Everything else is in `tools/maps/`:

| Path | What it is |
|---|---|
| `src/common.mjs` | Irad's outline, ISEZ districts, ATR zones, place coordinates, hand-traced rivers. Every map reads this, so a change here updates all maps |
| `src/svg.mjs` | Helpers: Wikipedia map palette, labels with halos, path simplification |
| `src/globe.mjs` | `Irad_(orthographic_projection).svg` |
| `src/regional.mjs` | `Map_of_Irad.svg`, `Irad_administrative_divisions.svg`; prints all areas |
| `src/charts.mjs` | Mejlis seat diagram, ethnic groups and religion charts |
| `thumbs.py` | PNG thumbnails for everything in the manifest |
| `data/` | Natural Earth extracts (public domain). Refresh with `extract.py` (instructions inside) |
| `vendor/` | d3-geo, d3-array, internmap (ISC) and polygon-clipping (MIT), with their licences |

After rebuilding, run `./build.sh` in the repo root only if `src/` (the site code) changed.

## Map canon (decisions made while drawing)

These are now the basis of every map. Change them in `src/common.mjs`, then rebuild.

- **Outline:** all of Kyrgyzstan's Talas and Jalal-Abad regions; Kazakhstan's Jambyl and Turkistan regions inside a mask that keeps Shymkent, Turkistan and Kentau out; the rural rim of Uzbekistan's Namangan and Andijan regions (not the cities); clipped to 68–75° E. Hand-drawn edges have an irregular, surveyed-looking line.
- **Areas as drawn:** Irad 196,347 km² (canon 196,754). ISEZ 59,898 km² (30%); ATR 136,449 km².
  - ISEZ districts: Chu 41,835; Talas 7,030; Kara-Buura 5,944; Lower Naryn 2,772; Sary-Bulak 2,316.
  - ATR planning zones: Northern Steppe 50,348 (lore: about 52,000); Karatau 46,505; Toktogul–Naryn 12,933; Chatkal Highlands 10,637; Talas Alatau 8,643; Fergana Rim 7,339.
- **ISEZ layout:** Talas and Kara-Buura districts in the Talas valley (Kara-Buura takes the lower valley into Kazakhstan); Chu District from the Kyrgyz Range piedmont to the Chu river and the eastern border, including the eastern Moiynkum ("a belt of steppe south of the Chu"); Sary-Bulak District as a corridor from Talas over the Talas Alatau into the Chatkal valley; Lower Naryn District as a salient around Tash-Kömür. Toktogul town, the Toktogul dam (Kara-Köl), Mailuu-Suu and Sary-Chelek are on the ATR side.
- **City positions (lon, lat):** Talas 72.24, 42.52 (canon); Nurzhan 74.15, 43.30 (lower Chu, north bank, Kazakh border to the east); Boz-Korgon 74.64, 43.30 (40 km east of Nurzhan); Iyık Janyl 72.55, 42.36 (side valley of the Talas Alatau, 65 km SE of Talas by road).
- **Rivers:** Naryn and Syr Darya from Natural Earth. The Chu, Talas and Chatkal are not in Natural Earth at this scale and are traced by hand, approximately.
- **Party colours** on the seat diagram are placeholders: DPI #1f4e9a, independents #9a9a9a, Russo-aligned #c0392b.

## Open lore questions (the maps had to pick something)

- [ ] **Qara-Chik line length.** The lore says 420 km. The ISEZ layout the lore describes (Talas valley + Chu lowlands + corridor to Tash-Kömür) gives a line of about 1,340 km. Either change the length in the lore or say 420 km is one sector of the line.
- [ ] **Neighbour to the west.** The lore says Uzbekistan borders Irad to the west. With Shymkent and Turkistan outside Irad, the west is Kazakhstan; Uzbekistan touches only the south-west and south.
- [ ] **Northern frontier held by the ISEZ.** The lore has the ISEZ holding about 285 km of frontier with Kazakhstan in the lower Chu and lower Talas valleys. As drawn, the ISEZ reaches the frontier only east of Nurzhan; the lower Talas is surrounded by ATR land.
- [ ] **Real cities inside Irad that the lore never mentions:** Taraz (inside Kara-Buura District), Shu (Chu District), Jalal-Abad (Fergana Rim). Decide whether they exist in Irad, under another name, or not at all.
- [ ] **Coat of arms.** The lore has no national emblem. Real country infoboxes show one beside the flag. Decide whether Irad has one before it is drawn.
- [ ] **Party colours** for the DPI and others, if the lore should fix them.
- [ ] **Talas airfield and Talas Air Base,** Chu Gate crossing, Talas North Terminal: positions not yet fixed; needed for the transport map.

## Phase 1: Irad article (done 2026-10-11)

- [x] Locator globe in the infobox (`Irad_(orthographic_projection).svg`)
- [x] Reference map, Geography section (`Map_of_Irad.svg`)
- [x] Administrative divisions map (`Irad_administrative_divisions.svg`)
- [x] Mejlis 2023 seat diagram, Elections section (`Irad_Mejlis_2023.svg`)
- [x] Ethnic groups 2018 chart (`Irad_ethnic_groups_2018.svg`)
- [x] Religion 2018 chart (`Irad_religion_2018.svg`)
- [x] Image manifest and thumbnails on the site
- [x] Map tooling moved into the repo
- [ ] Owner review of the map canon and open questions above

## Still to do for the Irad article (other image types)

- [ ] Coat of arms, once decided (SVG, Claude)
- [ ] Photos in the Geography, Economy and Culture sections from the real photo list (owner downloads; add to manifest with credits)
- [ ] Generated photos: Talas city, Nurzhan refinery, Church of St. Janyl, ulak tartysh at the Hippodrome (prompt sheet not yet written)
- [ ] Historical maps for the History section (Kokand era, Iradi SSR, 1992 war, 2007 partition)
- [ ] Economy chart (GDP by sector) once the lore gives sector figures

## Later phases (from the image plan)

- [ ] **Phase 2, GA and B-class articles:** thematic maps (Qara-Chik line in detail, river basins, resources, transport, UNMI sectors, religion and language by district), city plans of Talas, Nurzhan and Iyık Janyl, Toktogul complex layout, government structure and Toktarov family tree diagrams, state, party and company emblems
- [ ] **Phase 3, C-class:** remaining logos and seals, further charts
- [ ] **Phase 4, start and stubs:** a gazetteer of coordinates for the 220 place articles, then "Location within Irad" dot maps generated from it (one base map, a dot per article)
- [ ] **Photos:** work through the real photo list; then write the prompt sheet for generated photos (portraits, buildings, events, culture, artefacts)
- [ ] **Credits page:** a page on the site listing every image's author and licence (required for CC BY and CC BY-SA photos)
