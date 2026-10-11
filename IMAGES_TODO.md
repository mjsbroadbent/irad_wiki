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
  - `section`: heading text the image goes after (any level); or `"placement": "infobox"` for the Irad infobox locator; or `"placement": "lead"` for an image at the top right of the article (company logos)
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

## Logos supplied by the owner

Originals are kept in `tools/logos/src/`; the files in `images/` are made from them.

| Logo | Original | On the site | How it was made |
|---|---|---|---|
| Attelkom | `attelkom_white_original.png` (white on transparent) | `Attelkom_logo.png` at the top of *Attelkom* | `tools/logos/attelkom_on_green.py`: the white logo on forest green #228B22 (company colours are white and forest green). `Attelkom_logo_white.png` is kept for dark backgrounds |
| Irad Palace of Art | `irad_palace_of_art_original.gif` (from the gallery's website) | `Irad_Palace_of_Art_logo.png` at the top of *Irad Palace of Art* | Trimmed to the artwork with a 12 px white margin and saved as PNG |
| FreeIrad.org | `freeirad_logo_screencap.png` (screen capture of the site's header logo); `freeirad_logo_original.png` is the horse alone | `FreeIrad.org_logo.png` at the top of *FreeIrad.org* | Screen capture used as supplied |
| IradOne | `iradone_original.svg` (Inkscape, live Montserrat text) | `IradOne_logo.svg` at the top of *IradOne* | `tools/logos/outline_iradone.py`: lettering converted to outlines from Montserrat Medium so it renders the same without the font installed. Colours: blue #00a3ff, black |

## Map canon (decisions made while drawing)

These are now the basis of every map. Change them in `src/common.mjs`, then rebuild.

- **Outline:** all of Kyrgyzstan's Talas and Jalal-Abad regions; Kazakhstan's Jambyl and Turkistan regions inside a mask that keeps Shymkent, Turkistan and Kentau out; the rural rim of Uzbekistan's Namangan and Andijan regions (not the cities); clipped to 68–75° E. Hand-drawn edges have an irregular, surveyed-looking line.
- **Areas as drawn vs official** (official = ISEZ statistical office figures in *Administrative divisions of Irad*):

  | Unit | Drawn km² | Official km² |
  |---|---|---|
  | Irad | 196,347 | 196,754 |
  | ISEZ | 50,930 | about 64,000 |
  | Talas District | 5,676 | 9,800 |
  | Kara-Buura District | 11,654 | 11,400 |
  | Chu District | 25,294 | 24,600 |
  | Sary-Bulak District | 2,584 | 10,900 |
  | Lower Naryn District | 5,702 | 6,300 |
  | Northern Steppe zone (ATR) | 55,445 | about 52,000 |
  | Karatau zone | 52,332 | not given |
  | Chatkal Highlands zone | 11,887 | not given |
  | Toktogul–Naryn zone | 10,826 | not given |
  | Talas Alatau zone | 8,274 | not given |
  | Fergana Rim zone | 6,638 | not given |

  Where the lore's area figures and its geography disagree, the geography won (see open questions).
- **ISEZ layout (follows the lore's own descriptions):**
  - Talas District: the middle Talas valley floor.
  - Kara-Buura District: the lower and western valley, down the Talas past Taraz.
  - Chu District: the irrigated Chu lowlands around Nurzhan (the line crosses the river north-west of the city) and the Kyrgyz Range piedmont west to the Talas valley. The northern line runs along the edge of the irrigated plains, facing the Moiynkum and Betpak-Dala.
  - Sary-Bulak District: the foothills south of Talas (mine 28 km south of Talas, smelter 30 km south-west, lower Besh-Tash valley, lower Kara-Suu Canyon) plus the highway strip through the Otmek tunnel to the Fergana Gateway. The Talas Alatau crest, the Besh-Tash lake and the upper Kara-Suu stay tribal.
  - Lower Naryn District: the salient from the Fergana Gateway down the Naryn below the Toktogul dam to Tash-Kömür, surrounding the city of Iyık Janyl.
  - On the tribal side: Toktogul town, the Toktogul dam (Kara-Köl), Mailuu-Suu, Sary-Chelek.
- **City positions (lon, lat):**
  - Talas 72.24, 42.52 (canon).
  - Nurzhan 74.15, 43.30 (lower Chu, north bank; Kazakh border to the east).
  - Boz-Korgon 74.64, 43.30 (40 km east of Nurzhan).
  - Iyık Janyl 72.38, 41.47: Fergana Range foothills, 18 km north-east of Tash-Kömür, inside the Lower Naryn salient. Moved there by lore change on 2026-10-11; it was previously in the Talas Alatau.
- **Rivers:** Naryn and Syr Darya from Natural Earth. The Chu, Talas and Chatkal are not in Natural Earth at this scale and are traced by hand, approximately.
- **Party colours** on the seat diagram are placeholders: DPI #1f4e9a, independents #9a9a9a, Russo-aligned #c0392b.

## Open lore questions (the maps had to pick something)

- [ ] **Qara-Chik line length.** The lore says 420 km. The ISEZ the lore describes (Talas valley, Chu lowlands, a corridor over the Fergana Gateway to the Naryn salient) gives a line of about 1,170 km. Either change the length in the lore or say 420 km is one sector of the line.
- [ ] **District areas.** Talas (9,800 km²) and Sary-Bulak (10,900 km²) cannot reach their official areas without taking the Talas Alatau crest and the upper Besh-Tash and Kara-Suu valleys, which the lore puts on the tribal side; they are drawn at 5,676 and 2,584 km². Options: lower the official figures in the lore, or explain in-world that the ISEZ's published areas include land it claims beyond the line.
- [ ] **Neighbour to the west.** The lore says Uzbekistan borders Irad to the west. With Shymkent and Turkistan outside Irad, the west is Kazakhstan; Uzbekistan touches only the south-west and south.
- [ ] **Northern frontier held by the ISEZ.** The lore has the ISEZ holding about 285 km of frontier with Kazakhstan in the lower Chu and lower Talas valleys, and Kara-Buura District running "as far as the Kazakh border". As drawn, the ISEZ reaches the frontier only east of Nurzhan; the lower Talas is surrounded by ATR land.
- [ ] **Real cities inside Irad that the lore never mentions:** Taraz (inside Kara-Buura District), Shu (Chu District), Jalal-Abad (Fergana Rim), Arslanbob (Toktogul–Naryn zone). Decide whether they exist in Irad, under another name, or not at all.
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
- [x] Lore change: Iyık Janyl moved to the Fergana foothills in the Lower Naryn salient (2026-10-11); districts redrawn to the lore's descriptions at the same time
- [ ] Owner review of the map canon and open questions above

## Still to do for the Irad article (other image types)

- [ ] Coat of arms, once decided (SVG, Claude)
- [ ] Photos in the Geography, Economy and Culture sections from the real photo list (owner downloads; add to manifest with credits)
- [ ] Generated photos: Talas city, Nurzhan refinery, Church of St. Janyl, ulak tartysh at the Hippodrome (prompt sheet not yet written)
- [ ] Historical maps for the History section (Kokand era, Iradi SSR, 1992 war, 2007 partition)
- [ ] Economy chart (GDP by sector) once the lore gives sector figures

## Later phases (from the image plan)

- [ ] **Phase 2, GA and B-class articles:** thematic maps (Qara-Chik line in detail, river basins, resources, transport, UNMI sectors, religion and language by district), city plans of Talas, Nurzhan and Iyık Janyl, Toktogul complex layout, government structure and Toktarov family tree diagrams, state, party and company emblems
- [ ] **Phase 3, C-class:** remaining logos and seals, further charts (Attelkom, IradOne, Irad Palace of Art and FreeIrad.org logos supplied and placed 2026-10-11; the other Iradi company logos are still to make)
- [ ] **Phase 4, start and stubs:** a gazetteer of coordinates for the 220 place articles, then "Location within Irad" dot maps generated from it (one base map, a dot per article)
- [ ] **Photos:** work through the real photo list; then write the prompt sheet for generated photos (portraits, buildings, events, culture, artefacts)
- [ ] **Credits page:** a page on the site listing every image's author and licence (required for CC BY and CC BY-SA photos)
