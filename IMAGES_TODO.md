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
| `src/common.mjs` | Reads the Kartalar map data (`data/kartalar/`): Irad's border, the ISEZ and ATR, the six districts, the Qara-Chik line and the restricted-weapons zone, place coordinates (`PLACES`, `FEATURES`, `place(id)`) and the routes (`HIGHWAY_SR1`, `RAIL`, `ROADS`, `MINOR_ROADS`, `PIPELINES`, `HV_LINES`, `route(id)`). Takes the seven ATR planning zones from Kartalar's `planning_zones.geojson` (clipped to the ATR); draws only the hand-traced rivers and the resource areas itself. Every map reads this, so a change here updates all maps |
| `src/svg.mjs` | Helpers: Wikipedia map palette, labels with halos, path simplification |
| `src/globe.mjs` | `Irad_(orthographic_projection).svg` |
| `src/base.mjs` | `makeMap()`: the shared projection, base layers (neighbours, Irad, water, border, Qara-Chik line), place markers, labels, scale bar and legend box used by every regional and thematic map |
| `src/regional.mjs` | `Map_of_Irad.svg`, `Irad_administrative_divisions.svg`; prints all areas |
| `src/thematic.mjs` | The thematic maps: Qara-Chik line, Naryn corridor, transport, energy and resources, 1992 and 2007 wars, rivers and drainage basins, the Iradi SSR in Soviet Central Asia, the Russian conquest of Kokand. Run one with `node src/thematic.mjs naryn` (names: `qarachik`, `naryn`, `transport`, `energy`, `war2007`, `war1992`, `rivers`, `ssr`, `kokand`) |
| `src/charts.mjs` | Mejlis seat diagram, ethnic groups and religion charts, Toktarov election results, Toktarov family tree, government structure diagram, Toktogul complex layout (schematic) |
| `thumbs.py` | PNG thumbnails for everything in the manifest |
| `data/` | Natural Earth extracts (public domain). Refresh with `extract.py` (instructions inside) |
| `data/kartalar/` | Copy of the Kartalar map data (`irad.geojson`, `zones.geojson`, `districts.geojson`, `qarachik.geojson`, `restricted_zone.geojson`, `routes.json`, `settlements.json`, `features.json`), the authoritative map of Irad. When Kartalar changes, copy the files again from the Kartalar repo's `data/` and rebuild. Its roads and railways are fitted to OpenStreetMap (ODbL), so maps that draw them say so in their credit |
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

Since 2026-10-14 the maps follow the Kartalar map data (`tools/maps/data/kartalar/`); change the geography there (in the Kartalar repo), copy it over and rebuild. What is still decided here is in `src/common.mjs`.

- **Outline, ISEZ, districts, Qara-Chik line, restricted-weapons zone:** Kartalar. The line is drawn from Kartalar's line pieces (Kartalar's pieces sum to about 1,893 km: northern 737, central 465, southern 426, western 265; the lore says about 1,890 km. The maps as last built traced about 1,851 km, before Kartalar's 2026-10-14 site fit), not from the ISEZ outline.
- **Areas** (Kartalar's figures after its 2026-10-15 Fergana border change, commit 5acda9a: the border on the Uzbek side follows the foot of the hills; the "as drawn" column is from the map build of that day, and the maps measure about 0.5% more on a spherical earth):

  | Unit | Kartalar km² | As drawn here km² |
  |---|---|---|
  | Irad | 217,590 | 218,738 |
  | ISEZ | 29,585 | 29,719 |
  | Chu District | 13,791 | 13,853 |
  | Kara-Buura District | 9,171 | 9,212 |
  | Talas District | 2,700 | 2,712 |
  | Lower Naryn District | 2,197 | 2,206 |
  | Toktogul District | 1,274 | 1,279 |
  | Sary-Bulak District | 452 | 454 |
  | ATR | 188,004 | 189,018 |
  | Northern Steppe zone | 119,400 | 120,092 |
  | Karatau zone | 24,000 | 24,112 |
  | Talas Alatau zone | 8,200 | 8,215 |
  | Chatkal Highlands zone | 17,900 | 17,941 |
  | Kyrgyz Range–Suusamyr zone | 4,100 | 4,139 |
  | Toktogul–Naryn zone | 5,100 | 5,146 |
  | Fergana Rim zone | 9,300 | 9,372 |

- **ISEZ districts** (six since 2026-10-14, from Kartalar `districts.geojson`): Talas District, the Talas valley up to the Kyrgyz Range crest; Kara-Buura District, the plain north of the range east to a stream below Merke; Chu District, the rest of the belt east of it; Sary-Bulak District; Toktogul District, the State Route 1 corridor from the Otmek Tunnel over the Ala-Bel and the Toktogul basin floor with Toktogul town, the reservoir and the dam (seat Toktogul); Lower Naryn District, everything below the dam (Kara-Köl, the gorge corridor, the Iyık Janyl and Tash-Kömür flats, the Fergana farm belt). The administrative divisions map colours all six; the Naryn corridor map shows Sary-Bulak, Toktogul and Lower Naryn separately and the other three in one colour.
- **ATR planning zones** (UN usage): from Kartalar's `planning_zones.geojson` since 2026-10-14, seven zones, clipped to the ATR. The ISEZ splits tribal land into three blocks (north of the plains belt; the mountains west of the State Route 1 corridor and the Naryn gorge; the mountains east of them), and each zone lies inside one block, split along crests and the line, so no zone reaches across ISEZ land. Northern Steppe: southern Betpak-Dala north of the Chu, the Moiynkum, the Chu–Sarysu lowland and the piedmont plain north of the ISEZ belt (including the low plain north-east of the Karatau). Karatau: the range and its foothill upland north and west of the belt along the Shymkent road, toward the Kyzylkum Fringe. Talas Alatau: only the north slope and crest above the Talas valley, Aksu-Zhabagly east to the SR1 corridor. Chatkal Highlands: everything south of the Talas Alatau crest and west of the SR1 corridor and the Naryn gorge (Chatkal valley and range, Sary-Chelek, the Uzun-Akmat valley with Ozgörüsh, the hills west of the Naryn with Boz-Adyr and Kara-Jygach). Kyrgyz Range–Suusamyr: the high Kyrgyz Range east of the Kök-Bel road and the Suusamyr side east of the corridor (Toguz-Bulak, Otmek, Karakol, Ak-Kyya). Toktogul–Naryn: the mountains east of the corridor round the Toktogul basin and east of the gorge up to the Fergana Range crest. Fergana Rim: the Fergana side of the Fergana Range above the ISEZ farm belt (Mailuu-Suu, the Kara-Unkur valley, Arslanbob, Oruktu, Jangak-Bulak). Kartalar's zone areas match the lore (2026-10-14 changelog); its tribal villages carry their zone as `district`.
- **City positions:** from Kartalar `settlements.json`: Talas 72.24, 42.52; Nurzhan 73.76, 43.60; Iyık Janyl 72.215, 41.415 (on the Naryn flats by Tash-Kömür); Boz-Korgon 74.25, 43.58; Bazar-Korgon 72.746, 41.038 (ISEZ, Lower Naryn; on the reference, Naryn corridor, Qara-Chik and transport maps); Toktogul (Toktogul District) and Kara-Köl (Lower Naryn District) in the ISEZ since 2009. Jalal-Abad (73.0, 40.93) is outside Irad, cut out of the border and left with Kyrgyzstan; it is shown as a foreign city where the frame reaches it.
- **Routes:** every road, railway, pipeline and power line on the maps comes from Kartalar `routes.json`. Power lines: only the two Toktogul export lines Kartalar draws (north along the State Route 1 corridor to Talas and the Kazakh grid; south down the Naryn cascade).
- **Toktogul complex:** dam, reservoir, powerhouse, switchyard and Kara-Köl all in the ISEZ since the 2009 protocol; the Qara-Chik line runs along the slopes above the basin. `Toktogul_complex_layout.svg` shows this.
- **Historical maps:** `Second_Iradi_Civil_War_map.svg` draws the September 2007 line as it ran before the 2009 protocol, approximately: today's ISEZ without Toktogul District (the Toktogul basin and the State Route 1 corridor north of the dam) and the gorge corridor of Lower Naryn District below it (and without the Otmek valley east of 72.95° E), plus the high Kyrgyz Range east of the Kök-Bel road. The 2007 salient is the river flats at Iyık Janyl and Tash-Kömür plus the lowland farm belt round Bazar-Korgon (the lowland Chubar declared for the ISEZ in August 2007, lore changelog of 14 October 2026); the narrow corridor down the Naryn gorge below the dam came with the 2009 protocol and is drawn as tribal. `RIM_BELT_ISEZ_2007` in `thematic.mjs` switches the belt off if the lore ever moves its change of side to 2009. The 1992 map and the Soviet and Kokand maps show only the present outline.
- **Resource areas** (oil fields, gas field, uranium sandstones, placer gold) are ellipses drawn round the Kartalar sites; the oil fields lie inside the ISEZ, the field collection station and the export metering station on tribal land.
- **Rivers:** Naryn and Syr Darya from Natural Earth. The Chu, Talas and Chatkal are not in Natural Earth at this scale and are traced by hand, approximately (the Chu through Nurzhan).
- **Party colours** on the seat diagram are placeholders: DPI #1f4e9a, independents #9a9a9a, Russo-aligned #c0392b.

## Open lore questions (the maps had to pick something)

- [x] **Qara-Chik line length** (settled 2026-10-14: the lore now follows the Kartalar map, with a line of about 1,810 km, ISEZ about 30,700 km² and Irad 218,430 km²; all the SVG maps were redrawn from the Kartalar data the same day). Old note: the lore said 420 km. The ISEZ the lore describes (Talas valley, Chu lowlands, a corridor over the Fergana Gateway to the Naryn salient) gives a line of about 1,170 km. Either change the length in the lore or say 420 km is one sector of the line.
- [x] **District areas** (settled 2026-10-14: the lore now uses the Kartalar areas; since the same day there are six districts, with Toktogul District split from Lower Naryn and Talas District cut back to the Kyrgyz Range crest, so see the areas table above for the current figures). Old note: Talas (9,800 km²) and Sary-Bulak (10,900 km²) cannot reach their official areas without taking the Talas Alatau crest and the upper Besh-Tash and Kara-Suu valleys, which the lore puts on the tribal side; they are drawn at 5,676 and 2,584 km². Options: lower the official figures in the lore, or explain in-world that the ISEZ's published areas include land it claims beyond the line.
- [ ] **Neighbour to the west.** The lore says Uzbekistan borders Irad to the west. With Shymkent and Turkistan outside Irad, the west is Kazakhstan; Uzbekistan touches only the south-west and south.
- [ ] **Northern frontier held by the ISEZ.** The lore has the ISEZ holding about 285 km of frontier with Kazakhstan in the lower Chu and lower Talas valleys, and Kara-Buura District running "as far as the Kazakh border". As drawn, the ISEZ reaches the frontier only east of Nurzhan; the lower Talas is surrounded by ATR land.
- [ ] **Real cities inside Irad that the lore never mentions:** Taraz (inside Kara-Buura District), Shu (Chu District), Arslanbob (Fergana Rim zone, as in Kartalar). Decide whether they exist in Irad, under another name, or not at all. (Jalal-Abad settled 2026-10-14: Kartalar cuts it out of Irad and leaves it with Kyrgyzstan.)
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
- [x] **New generated photos, 2026-10-14 (unattended batches, no named characters).** Batch 1, all with the Amateur Photography LoRA, as article leads: `Qara-Chik_Border_Checkpoint.jpg`, `Kara-Oi_UNMI_headquarters.jpg` (*United Nations Mission in Irad*), `Feast_of_St_Janyl.jpg`, `Kumoch_bread.jpg` (*Kümöch Sacramental Bread*), `Eagle_hunter.jpg` (*Burkut Saluu*), `Kok-Tash_Kariz.jpg`, `Diz_Film_Festival.jpg`. Rejected and redone: ak-kalpak (wrong hat shape; redone as a market stall), kymyz (faces looked Middle Eastern; redone with Kyrgyz features), Semiz Day of the Dead (the horse had a rider; queued again). The Chongtor redo still drew a saddle ("no saddle" does not work; negatives are ignored), so the batch-1 Chongtor was used. Batch 2: `Chongtor_horse.jpg`, `Ak-kalpak.jpg`, `Kymyz_herder.jpg` (*Kymyz*, Customs), `Hunters_Vigil.jpg`, `Border_clashes_2018.jpg`, `Talas_student_protests_2023.jpg`, `Iradi_election_2023.jpg` (*2023 Iradi gubernatorial election*). Period photos: `March_of_the_Thousand_Saddles.jpg` (*Winter Uprising of 1992*) and `Siege_of_Talas_1992.jpg` (*First Iradi Civil War*) with the 1990s Analog HD LoRA, which works well for 1992 press photos; `Talas_riots_1956.jpg` and `Kobozev_oil_1949.jpg` (*Nurzhan Oil Discovery (1949)*) in black and white with plain Krea. The 2025 "Irad is not for sale" protest came out full of hammer-and-sickle flags (asking for "crimson flags" pulls in Soviet banners) and was queued again without flags. Flags were recoloured and plates blurred; edits are noted per photo in `prompts_used.json`. Later batches the same day: `Siege_of_Talas_1992.jpg`, `March_of_the_Thousand_Saddles.jpg`, `Talas_riots_1956.jpg`, `Kobozev_oil_1949.jpg`, `Virgin_Lands_1955.jpg` (period); `Manas_Glacier.jpg` (*Glacier retreat in Irad*), `Aksay_Plateau.jpg`, `Chatkal_Range.jpg`, `Arsha_juniper.jpg`, `Arslanbob_walnuts.jpg`, `IradOne_mast.jpg`, `State_Stud_Farm.jpg`, `Sary-Bulak_mine.jpg`, `NurGaz_wells.jpg`, `Smuggling_pack_train.jpg`, `Semiz_Day_of_the_Dead.jpg` and `Semiz_tortilleria.jpg` (*Mexicans in Irad*), `Irad_not_for_sale_2025.jpg` (*2025 Trump Remarks on Irad*), `Tunduk_hall.jpg` (*Architecture of Irad*), `Talasfilm_archive.jpg`, `Gendarmerie_patrol.jpg`, `Army_engineers_bridge.jpg` (*Armed Forces of Irad*), `Kara-Ak_derby.jpg`, `Talas_State_University.jpg`, `Wedding_yurt.jpg` (*Marriage in Irad*), `Irad_Day_race.jpg` (*Public holidays in Irad*), `East_Syriac_church.jpg` (*East Syriac Rites of Iyık Janyl*), `Chatkal_smelter.jpg`, `Fallen_Rider_horseshoe.jpg` (points-down took a second try: "hung upside down like an arch ... the shape of a capital letter n"). Placements and captions follow the lore; see `images.json`.
- [x] **Batch 4 (2026-10-14, afternoon):** `Operation_Starlight_1992.jpg`, `Talas_patrol_1993.jpg` (*Territory of Irad (1992–2006)*), `Church_grain_store_1937.jpg` (*The 1937 NKVD Clerical Purges*), `Collectivization_1932.jpg`, `Koryo_rice_1950s.jpg`, `Otmek_station.jpg`, `Hall_of_Justice.jpg` (*Supreme Court of Irad*), `Kayrak_gravestone.jpg` (*Iradi Cross*), `Good_Friday_Talas.jpg` (*Religion in Irad*), `Sumolok_cauldron.jpg` (*Public holidays*, Nooruz), `Kyzyl-Adyr_horse_fair.jpg`, `Radio_in_yurt.jpg` (*Media of Irad*), `Han_coins.jpg` (*Dayuan Heavenly Horse Heritage*), `Silk_Road_Arena.jpg` (*Football in Irad*), `Storming_of_Talas_2007.jpg`, `Kok-Bel_Pass.jpg`. Rejected: an open-air bazaar (crowd in white skullcaps and black robes again) and beshbarmak (came out with spaghetti, not flat noodles).
- [x] **Shared with the news sites (2026-10-14):** 42 contemporary photos copied into the IradOne and Talas Herald story photo pools with `tools/comfyui/share_news.py` (see the README). Re-run it after adding new contemporary photos.
- [ ] **Generated photos rejected on 2026-10-14, to retry:** stibnite specimen (twice: hexagonal prisms, then a fan of metal spikes like a toy, never real bladed stibnite); komuz (drew a mandolin and a violin, with frets); silver saddle (Western saddle both times); Talas cattle mart and an open bazaar (crowds come out as Iranian clerics in white skullcaps; try "in baseball caps, track suits and leather jackets"); tent liturgy on a pasture (Greek Orthodox monk, chef-hat-like felt hats). Kept out on purpose: anything showing the Governor, his family, Bektur or other named figures (left for the owner).
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
  - [x] `Talas_city_map.svg`: deleted 2026-10-14 with `cityplans.mjs` at the owner's request; the Kartalar map (mjsbroadbent.github.io/kartalar) is now the city map of Talas
  - [ ] Still to do: religion and language by district (needs figures by district in the lore), state, party and company emblems (city plans dropped by the owner)
- [ ] **Phase 3, C-class:** remaining logos and seals, further charts (Attelkom, IradOne, Irad Palace of Art and FreeIrad.org logos supplied and placed 2026-10-11; the other Iradi company logos are still to make)
- [ ] **Phase 4, start and stubs:** a gazetteer of coordinates for the 220 place articles, then "Location within Irad" dot maps generated from it (one base map, a dot per article)
- [x] **Character portraits (2026-10-15):** lead photos for 17 biographies from the approved references (see `tools/characters/README.md`); Alimbekov waits for an approved reference.
- [ ] **Photos:** work through the real photo list. The generated-image prompt sheet is written (2026-10-11); the character looks in it need owner approval before generating
- [ ] **Credits page:** a page on the site listing every image's author and licence (required for CC BY and CC BY-SA photos)

## Added outside the phases
- 2026-10-12: `Iradi_cross.svg`, lead image of "Iradi Cross" (Vol2 4.148), drawn by hand (not from tools/maps). Same file is `iradi_cross.svg` in the irad-persona skill.
- 2026-10-15: `Iradi_cross.svg` redrawn: the lotus's central petal now rises into a squat cross patonce (three-pointed ends), beads dropped; matches the irad-persona skill's `iradi_cross.svg` and canon.
- 2026-10-12: `The_White_Rider_Shows_the_Way.jpg` (supplied by the owner), lead of "Yusup Ayyubov" and in the Irad article's Etymology section.

## Real photos from Wikimedia Commons (October 2026)

- 42 photos placed (44 manifest entries) from the first picker batch, with visible credit lines (author, licence link, Commons page) under each caption. Manifest fields: `source`, `author`, `license`, `license_url`, `commons_file`.
- Second batch: 57 more photos placed (61 entries), so 99 Commons photos are now on the wiki.
- Held back: `Talas_River_barbel.jpg` (shows a marinka, *Schizothorax*, but the article is about the Turkestan barbel, *Luciobarbus capito*), plus the James Baker and Donald Trump portraits (real living people on articles about invented events; waiting for the user's decision).
- Commons rows the user skipped (63) still have no photo.
