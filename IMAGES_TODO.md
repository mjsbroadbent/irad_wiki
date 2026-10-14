# Irad Wiki images: status and handoff

This file is the working to-do list for illustrating the wiki. Anyone picking the project up (person or Claude session) should start here. Update it whenever an image is added or a decision is made.

Planning documents (Claude Docs, owner's account):
- Image plan: counts by type and phasing — https://claude.ai/code/artifact/4756f71f-a38b-4a3c-8505-dd2e54610ede
- Real photo list: 165 photos with search links and save-as names — https://claude.ai/code/artifact/0f2e9267-ad7c-4706-b08a-73d8b73ab030
- Generated image prompts and character bibles: house style, proposed looks for 17 recurring people, 68 prompts with file names and placements — https://claude.ai/code/artifact/d64d2473-bb04-40ce-8393-b5e8b0f5ce00

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
- **Media gallery and file pages** (added 2026-10-14). `#Special.Media` shows every file in the manifest as a Commons-style gallery, filterable by type, portal and text; `#File:<name>` is each file's description page (preview, size, caption, alt text, source, author, licence, the articles that use it). Article thumbnails link to the file page rather than the raw file.
  - Type is worked out from the entry: a credit or notice mentioning a screenshot → Screenshots; a logo → Logos; an SVG with Natural Earth in the credit or "map" in the name → Maps; other SVGs → Charts and diagrams; everything else → Photographs. Add `"type": "Maps"` (or `Photographs`, `Charts and diagrams`, `Logos`, `Screenshots`) to an entry to override it.
  - Gallery thumbnails (`images/thumb/320px-<name>.jpg|png`, at most 320×240) and `images/thumb/files.json` (pixel size, byte size, MIME type) come from `tools/maps/thumbs.py`. **Run `python3 tools/maps/thumbs.py` after adding or replacing any image**, photos included, or the new file shows without its size and loads the full file as its gallery thumbnail.

## Rebuilding the drawn images

```
tools/maps/build.sh
```

Needs Node 18+ and ffmpeg with librsvg (`ffmpeg -decoders | grep svg`). Everything else is in `tools/maps/`:

| Path | What it is |
|---|---|
| `src/common.mjs` | Irad's outline, ISEZ districts, ATR zones, place coordinates (`PLACES`, `FEATURES`), hand-traced rivers, and the routes and sites of the thematic maps (`HIGHWAY_SR1`, `RAIL`, `ROADS`, `PIPELINES`, `TRANSPORT_POINTS`, `RESOURCE_AREAS`, `RESOURCE_POINTS`, `HV_LINES`). Every map reads this, so a change here updates all maps |
| `src/svg.mjs` | Helpers: Wikipedia map palette, labels with halos, path simplification |
| `src/globe.mjs` | `Irad_(orthographic_projection).svg` |
| `src/base.mjs` | `makeMap()`: the shared projection, base layers (neighbours, Irad, water, border, Qara-Chik line), place markers, labels, scale bar and legend box used by every regional and thematic map |
| `src/regional.mjs` | `Map_of_Irad.svg`, `Irad_administrative_divisions.svg`; prints all areas |
| `src/thematic.mjs` | The thematic maps: Qara-Chik line, Naryn corridor, transport, energy and resources, 1992 and 2007 wars, rivers and drainage basins, the Iradi SSR in Soviet Central Asia, the Russian conquest of Kokand. Run one with `node src/thematic.mjs naryn` (names: `qarachik`, `naryn`, `transport`, `energy`, `war2007`, `war1992`, `rivers`, `ssr`, `kokand`) |
| `src/charts.mjs` | Mejlis seat diagram, ethnic groups and religion charts, Toktarov election results, Toktarov family tree, government structure diagram, Toktogul complex layout (schematic) |
| `src/cityplans.mjs` | City plans, drawn in a local kilometre grid (not geographic data): `Talas_city_map.svg` so far. Run one with `node src/cityplans.mjs talas` |
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
| Tulpar | `tulpar_icon_original.svg` (the app icon, `favicon.svg` in the tulpar repo) | `Tulpar_logo.svg` at the top of *Tulpar (app)* | `tools/logos/tulpar_lockup.py`: the icon with "tulpar" beside it, as in the Tulpar site's header, lettering outlined from Unbounded Bold. Colours: tile gradient #00b4b7 to #00628a, wordmark #054a60 |
| Jılmay | `noto_emoji_u1f60a.svg` (Noto Emoji's 😊, Apache 2.0) | `Jilmay_logo.svg` at the top of *Jılmay* | `tools/logos/jilmay_lockup.py`: the face with "jılmay" beside it, as in the Jılmay site's header, lettering outlined from Nunito Black. Wordmark #16b350 |

## Map canon (decisions made while drawing)

These are now the basis of every map. Change them in `src/common.mjs`, then rebuild.

- **Outline:** all of Kyrgyzstan's Talas and Jalal-Abad regions; Kazakhstan's Jambyl and Turkistan regions inside a mask that keeps Shymkent, Turkistan and Kentau out; the rural rim of Uzbekistan's Namangan and Andijan regions (not the cities); clipped to 68–75° E. Hand-drawn edges have an irregular, surveyed-looking line.
- **Areas as drawn vs official** (official = ISEZ statistical office figures in *Administrative divisions of Irad*):

  | Unit | Drawn km² | Official km² |
  |---|---|---|
  | Irad | 196,347 | 196,754 |
  | ISEZ | 50,930 | about 64,000 |
  | Talas District | 5,676 | 9,800 |
  | Kara-Buura District | 13,781 | 11,400 |
  | Chu District | 25,294 | 24,600 |
  | Sary-Bulak District | 2,574 | 10,900 |
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
  - Kara-Buura District: the lower and western valley, down the Talas past Taraz, plus a corridor (about 25 km wide) along the Turksib line and the Trans-Talas Highway west to the Kazakh frontier facing Shymkent, where the Talas North Terminal stands. Added 2026-10-11 so the lore's crossing and highway reach the frontier on the ISEZ side (see open questions). District seat: Kyzyl-Adyr (71.57, 42.60).
  - Chu District: the irrigated Chu lowlands around Nurzhan (the line crosses the river north-west of the city) and the Kyrgyz Range piedmont west to the Talas valley. The northern line runs along the edge of the irrigated plains, facing the Moiynkum and Betpak-Dala.
  - Sary-Bulak District: the foothills south of Talas (mine 28 km south of Talas, smelter 30 km south-west, lower Besh-Tash valley, lower Kara-Suu Canyon) plus the highway strip through the Otmek tunnel to the Fergana Gateway. The Talas Alatau crest, the Besh-Tash lake and the upper Kara-Suu stay tribal.
  - Lower Naryn District: the salient from the Fergana Gateway down the Naryn below the Toktogul dam to Tash-Kömür, surrounding the city of Iyık Janyl.
  - On the tribal side: Toktogul town, the Toktogul dam (Kara-Köl), Mailuu-Suu, Sary-Chelek.
- **City positions (lon, lat):**
  - Talas 72.24, 42.52 (canon).
  - Nurzhan 74.15, 43.30 (lower Chu, north bank; Kazakh border to the east).
  - Boz-Korgon 74.64, 43.30 (40 km east of Nurzhan).
  - Iyık Janyl 72.43, 41.44: Fergana Range foothills on the east side of the Naryn gorge, about 20 km north-east of Tash-Kömür, inside the Lower Naryn salient. Moved there by lore change on 2026-10-11; it was previously in the Talas Alatau. The branch road leaves State Route 1 in the gorge above Tash-Kömür.
- **Toktogul complex:** the dam is at the reservoir outlet (72.652, 41.668), on the tribal side; the switchyard is just downstream (72.62, 41.618), in the ISEZ. State Route 1 follows the Naryn from there down to Tash-Kömür, and the four cascade stations sit on the river.
- **Transport (Transport in Irad):** railway Talas – Kyzyl-Adyr – Taraz, then west on the Turksib to the Talas North Terminal (69.96, 42.63) and east on the lowland route round the Kyrgyz Range to Nurzhan and a rail border station north-east of the city (about 580 km, the lore figure since 2026-10-11). Kök-Bel Pass at 72.45, 42.72. Chu Gate 74.97, 43.33 and Kum-Shagyl 74.97, 43.95, both on the eastern frontier. Talas Air Base 12 km west of Talas. Chu oil fields along the Chu north-west of Nurzhan, with the collection station at 73.25, 43.78.
- **Rivers:** Naryn and Syr Darya from Natural Earth. The Chu, Talas and Chatkal are not in Natural Earth at this scale and are traced by hand, approximately.
- **Party colours** on the seat diagram are placeholders: DPI #1f4e9a, independents #9a9a9a, Russo-aligned #c0392b.

## Open lore questions (the maps had to pick something)

- [x] **Qara-Chik line length** (settled 2026-10-14: the lore now follows the Kartalar map, with a line of about 1,810 km, ISEZ about 30,700 km² and Irad 218,430 km²; the SVG maps above still need redrawing to that line). Old note: the lore said 420 km. The ISEZ the lore describes (Talas valley, Chu lowlands, a corridor over the Fergana Gateway to the Naryn salient) gives a line of about 1,170 km. Either change the length in the lore or say 420 km is one sector of the line.
- [x] **District areas** (settled 2026-10-14: the lore now uses the Kartalar areas, Chu 13,480, Kara-Buura 6,750, Talas 5,980, Lower Naryn 4,060, Sary-Bulak 435 km²). Old note: Talas (9,800 km²) and Sary-Bulak (10,900 km²) cannot reach their official areas without taking the Talas Alatau crest and the upper Besh-Tash and Kara-Suu valleys, which the lore puts on the tribal side; they are drawn at 5,676 and 2,584 km². Options: lower the official figures in the lore, or explain in-world that the ISEZ's published areas include land it claims beyond the line.
- [ ] **Neighbour to the west.** The lore says Uzbekistan borders Irad to the west. With Shymkent and Turkistan outside Irad, the west is Kazakhstan; Uzbekistan touches only the south-west and south.
- [ ] **Northern frontier held by the ISEZ.** The lore has the ISEZ holding about 285 km of frontier with Kazakhstan in the lower Chu and lower Talas valleys, and Kara-Buura District running "as far as the Kazakh border". As drawn, the ISEZ reaches the frontier only east of Nurzhan; the lower Talas is surrounded by ATR land.
- [ ] **Real cities inside Irad that the lore never mentions:** Taraz (inside Kara-Buura District), Shu (Chu District), Jalal-Abad (Fergana Rim), Arslanbob (Toktogul–Naryn zone). Decide whether they exist in Irad, under another name, or not at all.
- [ ] **Coat of arms.** The lore has no national emblem. Real country infoboxes show one beside the flag. Decide whether Irad has one before it is drawn.
- [ ] **Party colours** for the DPI and others, if the lore should fix them.
- [x] **Northern Export Feeder direction, railway length, oil pipeline length** (settled 2026-10-11 in favour of the maps): the feeder runs north-east to the eastern frontier, the railway is about 580 km and the Nurzhan Petroleum Pipeline about 90 km. The lore and the volumes were updated to match (skill repo `newlore.md`, "Map Alignment").
- [x] **Kara-Buura corridor** to the frontier facing Shymkent, for the Talas North Terminal: confirmed 2026-10-11 and recorded in the lore.

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
- [ ] Generated photos (prompt sheet linked above). All 15 generated photos were redone on 2026-10-14 with FLUX.1 Krea Dev on the owner's PC (see `tools/comfyui/README.md`; exact prompts and seeds in `tools/comfyui/prompts_used.json`), replacing the earlier Gemini and FLUX.2 Klein versions under the same file names, with captions and alt text checked against the lore: `Talas_skyline_2022.jpg`, `Nurzhan_central_square.jpg` (now shows the constructivist House of Soviets the lore describes; no flags to repaint), `Nurzhan_Refinery_No_1.jpg`, `Koryo-saram_Kobozev_1937.jpg`, `Urkun_1916.jpg`, `Church_of_St_Janyl.jpg` (redrawn as the grand cathedral and pilgrimage site of the lore, on the feast day), `Iyik_Janyl_valley.jpg` (now a city of 310,000 with Cathedral Hill), `Old_Talas_Citadel.jpg` (Kalan Darwaza gate), `Bazar-i_Kalan.jpg`, `Talas_Air_Base.jpg`, `Boz-Korgon_compound.jpg`, `Caravanserai_of_Rabat-i-Safed.jpg`, `Talas_Solar_Park.jpg`, `Iradi_feast_table.jpg`, `Ulak_tartysh_Hippodrome.jpg`. `The_White_Rider_Shows_the_Way.jpg` is a painting and was left as it is. Later the same day the 13 contemporary photos were redone again with the Amateur Photography LoRA and off-centre compositions (see the README); `Koryo-saram_Kobozev_1937.jpg` and `Urkun_1916.jpg` kept the plain Krea versions until period LoRAs are found. Still to do: `Chongtor_horse.jpg` and `Kok-Tash_Kariz.jpg` (both failed with FLUX.2 Klein; not yet tried with Krea), the events and history prompts (14–23) and the culture prompts 27–30, 32–34, 37–38 in `tools/gemini_handoff/Gemini_prompts_no_characters.txt`; rewrite them in the snapshot style first (see the README)
- [x] **New generated photos, 2026-10-14 (unattended batches, no named characters).** Batch 1, all with the Amateur Photography LoRA, as article leads: `Qara-Chik_Border_Checkpoint.jpg`, `Kara-Oi_UNMI_headquarters.jpg` (*United Nations Mission in Irad*), `Feast_of_St_Janyl.jpg`, `Kumoch_bread.jpg` (*Kümöch Sacramental Bread*), `Eagle_hunter.jpg` (*Burkut Saluu*), `Kok-Tash_Kariz.jpg`, `Diz_Film_Festival.jpg`. Rejected and redone: ak-kalpak (wrong hat shape; redone as a market stall), kymyz (faces looked Middle Eastern; redone with Kyrgyz features), Semiz Day of the Dead (the horse had a rider; queued again). The Chongtor redo still drew a saddle ("no saddle" does not work; negatives are ignored), so the batch-1 Chongtor was used. Batch 2: `Chongtor_horse.jpg`, `Ak-kalpak.jpg`, `Kymyz_herder.jpg` (*Kymyz*, Customs), `Hunters_Vigil.jpg`, `Border_clashes_2018.jpg`, `Talas_student_protests_2023.jpg`, `Iradi_election_2023.jpg` (*2023 Iradi gubernatorial election*). Period photos: `March_of_the_Thousand_Saddles.jpg` (*Winter Uprising of 1992*) and `Siege_of_Talas_1992.jpg` (*First Iradi Civil War*) with the 1990s Analog HD LoRA, which works well for 1992 press photos; `Talas_riots_1956.jpg` and `Kobozev_oil_1949.jpg` (*Nurzhan Oil Discovery (1949)*) in black and white with plain Krea. The 2025 "Irad is not for sale" protest came out full of hammer-and-sickle flags (asking for "crimson flags" pulls in Soviet banners) and was queued again without flags. Flags were recoloured and plates blurred; edits are noted per photo in `prompts_used.json`.
- Generated JPGs are 1152×864, quality 85 (about 150–260 KB); credit `AI-generated image for Irad Wiki`
- [x] Historical maps in the History section: Kokand conquest, Iradi SSR, 1992 war, 2007 war (2026-10-11); also the rivers, energy and transport maps in Hydrology, Energy and mining, and Transport and communications
- [ ] Economy chart (GDP by sector) once the lore gives sector figures

## Later phases (from the image plan)

- [ ] **Phase 2, GA and B-class articles.** Done 2026-10-11:
  - [x] `Qara-Chik_Demarcation_Line_map.svg`: line, four UNMI sectors, 12 km restricted-weapons zone (*Qara-Chik Demarcation Line*, Course)
  - [x] `Naryn_corridor_map.svg`: State Route 1, Toktogul complex, Naryn cascade (*Qara-Chik Demarcation Line*, *Fergana Mountain Transit Highway*, *Toktogul Hydroelectric Complex*)
  - [x] `Transport_in_Irad_map.svg` (lead of *Transport in Irad*)
  - [x] `Energy_and_resources_of_Irad_map.svg` (lead of *Energy in Irad*; *Economy of Irad*, Sectors)
  - [x] `Second_Iradi_Civil_War_map.svg`: late May 2007 control, storming of Talas, summer advances, ceasefire line (*Second Iradi Civil War*, Course of the war)
  - [x] `Toktarov_gubernatorial_results.svg` (*Elections in Irad*; *Politics of Irad*)
  - [x] `Toktarov_family_tree.svg` (*Erlan Toktarov*, Family)
  - [x] `First_Iradi_Civil_War_map.svg`: March 1992 control, SRI offensive, siege of Talas, US airlift, advance to Kobozev (*First Iradi Civil War*; lead of *Battle of Kobozev Railhead (1992)*)
  - [x] `Rivers_of_Irad_map.svg`: Chu, Talas and Syr Darya basins and closed deserts; divides hand-drawn along the ranges, so approximate (*Geography of Irad*, *Naryn River*, *Talas River*, *Chu River Basin*)
  - [x] `Government_of_Irad_diagram.svg`: ISEZ, ATR and UNMI institutions (*Politics of Irad*, Constitutional framework)
  - [x] Existing maps also placed on *Bishkek Ceasefire Agreement (2007)*, *Naryn Water and Power Protocol*, *Fergana Gateway*, *Tash-Kömür*, *Northern Border Demarcation Protocol*, *Northern Export Feeder*, *Irad Special Economic Zone*, *Autonomous Tribal Regions*, *Geography of Irad*, *Storming of Talas (2007)*
  - [x] `Russian_conquest_of_Kokand_map.svg`: khanate about 1850, Russian advances 1860–1876, Turkestan oblasts 1876–1917; khanate extent and oblast lines approximate, after standard atlases (lead of *Siege of Kokand (1876)*; *Semirechye Revolt (Irad)*; *Irad*)
  - [x] `Iradi_SSR_location_map.svg`: the republic among the Soviet Central Asian SSRs, Soviet-era capital names, Aral Sea at about its 1960 extent (lead of *Iradi Soviet Socialist Republic*; *Irad*)
  - [x] `Toktogul_complex_layout.svg`: schematic plan, not to scale (*Toktogul Hydroelectric Complex*, Engineering)
  - [ ] `Talas_city_map.svg`: first attempt rejected by the owner as too cartoony (2026-10-11); taken off the site, file and script kept for reference. The owner decided to skip city plans; `cityplans.mjs` is no longer run by `build.sh`. Placement decisions: the river runs west through the city with the Old City on the terrace south of it and Shahr-i Kabud between; the Soviet center and central square east of the Old City along Central Avenue (the city section of the Trans-Talas Highway); the railway station and northern industrial district north of the river; the western district, Nuevo Talas, the cattle mart and the Agribusiness Export Zone along the highway west toward the air base; the Hippodrome and Talas State University in the east; wellfields on the alluvial fan to the south
  - [ ] Still to do: religion and language by district (needs figures by district in the lore), state, party and company emblems (city plans dropped by the owner)
- [ ] **Phase 3, C-class:** remaining logos and seals, further charts (Attelkom, IradOne, Irad Palace of Art and FreeIrad.org logos supplied and placed 2026-10-11; the other Iradi company logos are still to make)
- [ ] **Phase 4, start and stubs:** a gazetteer of coordinates for the 220 place articles, then "Location within Irad" dot maps generated from it (one base map, a dot per article)
- [ ] **Photos:** work through the real photo list. The generated-image prompt sheet is written (2026-10-11); the character looks in it need owner approval before generating
- [ ] **Credits page:** a page on the site listing every image's author and licence (required for CC BY and CC BY-SA photos)

## Added outside the phases
- 2026-10-12: `Iradi_cross.svg`, lead image of "Iradi Cross" (Vol2 4.148), drawn by hand (not from tools/maps). Same file is `iradi_cross.svg` in the irad-persona skill.
- 2026-10-12: `The_White_Rider_Shows_the_Way.jpg` (supplied by the owner), lead of "Yusup Ayyubov" and in the Irad article's Etymology section.

## Real photos from Wikimedia Commons (October 2026)

- 42 photos placed (44 manifest entries) from the first picker batch, with visible credit lines (author, licence link, Commons page) under each caption. Manifest fields: `source`, `author`, `license`, `license_url`, `commons_file`.
- Second batch: 57 more photos placed (61 entries), so 99 Commons photos are now on the wiki.
- Held back: `Talas_River_barbel.jpg` (shows a marinka, *Schizothorax*, but the article is about the Turkestan barbel, *Luciobarbus capito*), plus the James Baker and Donald Trump portraits (real living people on articles about invented events; waiting for the user's decision).
- Commons rows the user skipped (63) still have no photo.
