#!/usr/bin/env python3
"""Download candidate photos for the Irad Wiki from Wikimedia Commons.

Each row of the "Irad Wiki Real Photo List" has a search query and a save-as
name. For every row this script searches Commons, downloads the best few
matches at web size (1600 px) and records the author and licence of each, so
you can pick one and credit it.

Usage (Python 3.8+, no extra packages):

    python3 download_commons_photos.py                     # all 165 rows
    python3 download_commons_photos.py --only Talas_River  # rows whose save-as contains this text
    python3 download_commons_photos.py --group "Historical"  # one group of the list
    python3 download_commons_photos.py --candidates 6      # more choices per row (default 4)
    python3 download_commons_photos.py --list              # print the rows and exit

Output, in ./commons_photos/ (or --out DIR):

    <Save_as>.jpg                  the top match, already under its wiki name
    _candidates/<Save_as stem>/    every match for that row: 1.jpg, 2.jpg, ...
    credits.json                   author, licence and Commons page for every file downloaded
    review.html                    open in a browser: all candidates side by side with credits

To use a different candidate, copy it over <Save_as>.jpg and change that row's
"chosen" number in credits.json (or just tell Claude which number you picked).
Re-running skips files that already exist unless you pass --overwrite.

Please set CONTACT below: Wikimedia asks automated tools to identify themselves.
"""
import argparse, html, json, os, re, sys, time, urllib.parse, urllib.request, urllib.error

CONTACT = "set-your-email@example.com"   # Wikimedia User-Agent policy: a way to reach you
USER_AGENT = f"IradWikiPhotoFetcher/1.0 (personal wiki project; {CONTACT}) python-urllib"
API = "https://commons.wikimedia.org/w/api.php"
WIDTH = 1600          # px, long side of the downloaded thumbnail
PAUSE = 1.0           # seconds between requests, to be polite to Commons

# group, photo wanted, wiki articles, Commons search, save as, notes
ROWS = [
    ["Mountain and valley landscapes", "Talas valley floor with the Talas Alatau behind", "Geography of Irad; Talas", "Talas Valley Kyrgyzstan", "Talas_valley_and_Talas_Alatau.jpg", ""],
    ["Mountain and valley landscapes", "Talas Alatau main ridge", "Talas Alatau", "Talas Ala-Too range", "Talas_Alatau_ridge.jpg", ""],
    ["Mountain and valley landscapes", "Talas River in its valley", "Talas River; Talas River Hydrological Monitoring Service", "Talas River", "Talas_River.jpg", ""],
    ["Mountain and valley landscapes", "Chatkal Range from a distance", "Chatkal Range; Tien Shan Marches", "Chatkal Range", "Chatkal_Range.jpg", ""],
    ["Mountain and valley landscapes", "Chatkal River valley", "Chatkal River", "Chatkal River", "Chatkal_River.jpg", ""],
    ["Mountain and valley landscapes", "Narrow gorge on the Chatkal", "Chatkal Gorge", "Chatkal gorge", "Chatkal_Gorge.jpg", ""],
    ["Mountain and valley landscapes", "Upper Chatkal valley pastures", "Aksay Plateau; Aksay Plateau Pastoral Cooperative", "Chatkal valley pasture", "Aksay_Plateau.jpg", ""],
    ["Mountain and valley landscapes", "Besh-Tash valley", "Besh-Tash Ecological Conservation Area; Besh-Tash National Park; Besh-Tash Ranger Headquarters", "Besh-Tash National Park", "Besh-Tash_valley.jpg", ""],
    ["Mountain and valley landscapes", "Besh-Tash lake", "Besh-Tash Upper Lake; Besh-Tash Lower Tarn", "Besh-Tash lake", "Besh-Tash_Upper_Lake.jpg", ""],
    ["Mountain and valley landscapes", "Sary-Chelek lake and forest", "Sary-Chelek Biosphere Reserve", "Sary-Chelek lake", "Sary-Chelek_lake.jpg", ""],
    ["Mountain and valley landscapes", "Arslanbob village", "Arslanbob", "Arslanbob village", "Arslanbob.jpg", "Avoid mosques in frame; the lore has a Christian majority"],
    ["Mountain and valley landscapes", "Arslanbob waterfall", "Arslanbob Falls", "Arslanbob waterfall", "Arslanbob_Falls.jpg", ""],
    ["Mountain and valley landscapes", "Arslanbob walnut forest", "Wild Walnut (Juglans regia); Carved Walnut Tobacco Box", "Arslanbob walnut forest", "Arslanbob_walnut_forest.jpg", ""],
    ["Mountain and valley landscapes", "Naryn River in its gorge", "Naryn River", "Naryn River gorge", "Naryn_River_gorge.jpg", ""],
    ["Mountain and valley landscapes", "Toktogul town", "Toktogul (town)", "Toktogul town", "Toktogul_town.jpg", ""],
    ["Mountain and valley landscapes", "Tash-Kömür town", "Tash-Kömür", "Tash-Kumyr", "Tash-Komur.jpg", ""],
    ["Mountain and valley landscapes", "Mailuu-Suu town", "Mailuu-Suu", "Mailuu-Suu", "Mailuu-Suu.jpg", ""],
    ["Mountain and valley landscapes", "Kenkol valley", "Kenkol Pass; Chong-Kenkol; Kenkol Mountain Meteorological Post", "Kenkol valley", "Kenkol_valley.jpg", ""],
    ["Mountain and valley landscapes", "Suusamyr valley", "Suusamyr", "Suusamyr Valley", "Suusamyr_valley.jpg", ""],
    ["Mountain and valley landscapes", "Suusamyr River", "Suusamyr River", "Suusamyr river", "Suusamyr_River.jpg", ""],
    ["Mountain and valley landscapes", "Uzun-Akmat river and terraces", "Uzun-Akmat River; Uzun-Akmat Terraces", "Uzun-Akmat", "Uzun-Akmat_River.jpg", ""],
    ["Mountain and valley landscapes", "Urmaral valley", "Urmaral River; Urmaral Tarns", "Urmaral valley", "Urmaral_valley.jpg", ""],
    ["Mountain and valley landscapes", "Manas Peak, Talas Alatau", "Manas Peak (Irad); Manas Peak Glaciological Observatory", "Manas Peak Talas", "Manas_Peak.jpg", ""],
    ["Mountain and valley landscapes", "Glacier below Manas Peak", "Manas Glacier", "Manas peak glacier Talas", "Manas_Glacier.jpg", ""],
    ["Mountain and valley landscapes", "Kara-Buura valley", "Kara-Buura", "Kara-Buura", "Kara-Buura_valley.jpg", ""],
    ["Mountain and valley landscapes", "Chychkan gorge", "Kara-Koyun Valley", "Chychkan gorge", "Kara-Koyun_Valley.jpg", ""],
    ["Mountain and valley landscapes", "Steep-walled canyon with a river", "Kara-Suu Canyon", "Kyrgyzstan canyon river", "Kara-Suu_Canyon.jpg", ""],
    ["Mountain and valley landscapes", "Ala-Bel Pass road", "Kök-Art Pass; Tuyuk-Suu Pass", "Ala-Bel Pass", "Kok-Art_Pass.jpg", ""],
    ["Mountain and valley landscapes", "Ötmök Pass road", "Kyzyl-Bel Pass; Kök-Bel Pass; Kök-Jar Pass", "Otmok Pass", "Kyzyl-Bel_Pass.jpg", ""],
    ["Mountain and valley landscapes", "Mountain road switchbacks", "Temir-Kapka Gate; Kapka-Bel; Karakoyun Pass", "Kyrgyzstan mountain road serpentine", "Temir-Kapka_Gate.jpg", ""],
    ["Mountain and valley landscapes", "Glacier tongue in the western Tian Shan", "Karakol Glacier", "Tian Shan glacier Kyrgyzstan", "Karakol_Glacier.jpg", "Not Karakol on Issyk-Kul; any Talas or Chatkal glacier"],
    ["Mountain and valley landscapes", "Glacier field on a ridge", "Besh-Köl Glaciers; Kashka-Suu Glaciers", "Ala Archa glacier", "Besh-Kol_Glaciers.jpg", ""],
    ["Mountain and valley landscapes", "Glacial cirque", "Kara-Kazan Cirque", "Ala Archa cirque", "Kara-Kazan_Cirque.jpg", ""],
    ["Mountain and valley landscapes", "Small alpine tarn", "Tegerek-Köl; Achuu-Köl; Kaz-Köl", "Kyrgyzstan alpine lake", "Tegerek-Kol.jpg", ""],
    ["Mountain and valley landscapes", "Lake with spruce forest", "Kyzyl-Köl; Besh-Köl", "Kyrgyzstan mountain lake spruce", "Kyzyl-Kol.jpg", ""],
    ["Mountain and valley landscapes", "Narrow river gorge", "Ichke-Suu Gorge; Kök-Kamar Gorge; Sary-Bulak Gorge", "Kyrgyzstan gorge", "Ichke-Suu_Gorge.jpg", ""],
    ["Mountain and valley landscapes", "River rapids", "Uch-Terek Rapids; Kara-Suu Rapids", "Chatkal river rapids", "Uch-Terek_Rapids.jpg", ""],
    ["Mountain and valley landscapes", "Mineral spring with travertine", "Ak-Suu Mineral Springs; Sarchashma Springs; Isyk-Bulak", "Kyrgyzstan mineral spring", "Ak-Suu_Mineral_Springs.jpg", ""],
    ["Mountain and valley landscapes", "Cave entrance in limestone", "Kara-Unkur Cave; Kyrk-Kazyk Caves", "Kyrgyzstan cave", "Kara-Unkur_Cave.jpg", ""],
    ["Mountain and valley landscapes", "Snow peak above a valley", "Kök-Suu Peak; Ak-Muz; Muz-Suu", "Tian Shan peak snow Kyrgyzstan", "Kok-Suu_Peak.jpg", ""],
    ["Mountain and valley landscapes", "Juniper on a dry slope", "Mazar-Too; Ak-Bash; Mountain Juniper (Arsha)", "juniper Kyrgyzstan mountains", "Mazar-Too.jpg", ""],
    ["Mountain and valley landscapes", "Spruce forest on a slope", "Tian Shan Spruce; Besh-Tash Timber Concession", "Picea schrenkiana forest", "Tian_Shan_spruce_forest.jpg", ""],
    ["Mountain and valley landscapes", "Summer pasture (jailoo) with herds", "Central Asian Pastoral Migration System; Keng-Talaa", "jailoo Kyrgyzstan", "Jailoo_summer_pasture.jpg", ""],
    ["Mountain and valley landscapes", "Alluvial fan below a range", "Kum-Say Fan; Chopo-Jar", "alluvial fan Tian Shan", "Kum-Say_Fan.jpg", ""],
    ["Mountain and valley landscapes", "Red sandstone hills", "Kyzyl-Adyr Hills; Kyzyl-Adyr", "Kyzyl-Adyr Talas", "Kyzyl-Adyr_Hills.jpg", "Kyzyl-Adyr is a real village in Talas Region"],
    ["Mountain and valley landscapes", "Eroded red badlands", "Kyzyl-Jar; Kök-Moinok", "Kyrgyzstan red canyon badlands", "Kok-Moinok_canyons.jpg", ""],
    ["Mountain and valley landscapes", "Dry gully (say) in foothills", "Chakmak-Say; Tuura-Say; Kuru-Say; Altyn-Say", "dry gully foothills Kyrgyzstan", "Chakmak-Say.jpg", ""],
    ["Mountain and valley landscapes", "Rocky ridge and scree", "Uzun-Kyr; Kylych-Kyr; Sary-Kyr; Ak-Kyr", "Tian Shan scree ridge", "Uzun-Kyr.jpg", ""],
    ["Mountain and valley landscapes", "Village with poplars below mountains", "Ak-Tash; Besh-Terek; Kara-Bulak and other start-class villages", "Talas Region village", "Talas_valley_village.jpg", ""],
    ["Mountain and valley landscapes", "Village street in a mountain valley", "Minor settlements (stubs)", "Kyrgyz village street", "Mountain_village_street.jpg", "Pick one with no shop signs in Cyrillic"],
    ["Mountain and valley landscapes", "Village in the Jalal-Abad hills", "Bazar-Korgon; Kashka-Suu; Toguz-Bulak", "Jalal-Abad Region village", "Jalal-Abad_hill_village.jpg", ""],
    ["Mountain and valley landscapes", "Fergana Valley foothills", "Fergana Gateway; Fergana Rim settlements", "Fergana Valley foothills", "Fergana_rim_foothills.jpg", ""],
    ["Mountain and valley landscapes", "Chatkal Nature Reserve landscape", "Chatkal Snow Leopard Sanctuary; Chatkal Wildlife Protection Post", "Chatkal Nature Reserve", "Chatkal_reserve.jpg", ""],
    ["Mountain and valley landscapes", "Mountain creek with boulders", "Ak-Balyk Creek; Dastgoh Creek; Khunuk Creek", "mountain creek Kyrgyzstan", "Ak-Balyk_Creek.jpg", ""],
    ["Mountain and valley landscapes", "Irrigation channel through orchards", "Eski-Aryk; Kashkar-Aryk; Jangy-Aryk", "aryk irrigation canal Kyrgyzstan", "Eski-Aryk.jpg", ""],
    ["Lowland steppe and desert", "Moiynkum dunes with saxaul", "Moiynkum Desert", "Moiynkum desert", "Moiynkum_Desert.jpg", ""],
    ["Lowland steppe and desert", "Betpak-Dala clay plain", "Betpak-Dala", "Betpak-Dala", "Betpak-Dala.jpg", ""],
    ["Lowland steppe and desert", "Karatau ridge", "Karakyr Range; Karatau", "Karatau mountains Kazakhstan", "Karatau_range.jpg", ""],
    ["Lowland steppe and desert", "Karatau foothill steppe", "Kulan-Talaa; Teshik-Talaa", "Karatau steppe", "Kulan-Talaa.jpg", ""],
    ["Lowland steppe and desert", "Chu River on the plain", "Chu River Basin", "Chu River Kazakhstan", "Chu_River.jpg", ""],
    ["Lowland steppe and desert", "Irrigated fields in the Chu valley", "Agriculture in Irad; Chu Valley Irrigation Inspectorate; Talas Basin Agricultural Directorate", "Chuy Valley fields", "Chu_valley_fields.jpg", ""],
    ["Lowland steppe and desert", "Takyr salt pan", "Kulan-Sor; Akzhaykyn Depression", "takyr Kazakhstan", "Takyr_salt_pan.jpg", ""],
    ["Lowland steppe and desert", "Akzhaykyn lake", "Akzhaykyn Depression", "Akzhaykyn lake", "Akzhaykyn_lake.jpg", ""],
    ["Lowland steppe and desert", "Kyzylkum desert edge", "Kyzylkum Fringe", "Kyzylkum desert", "Kyzylkum_Fringe.jpg", ""],
    ["Lowland steppe and desert", "Syr Darya", "Oxus River in Iradi historiography; Fergana Gateway", "Syr Darya river", "Syr_Darya.jpg", ""],
    ["Lowland steppe and desert", "Aksu-Zhabagly valley (Talas Alatau, north side)", "Tien Shan Marches; Besh-Tash Ecological Conservation Area", "Aksu-Zhabagly", "Aksu-Zhabagly.jpg", ""],
    ["Lowland steppe and desert", "Spring steppe in bloom", "Geography of Irad; Public holidays in Irad", "spring steppe Kazakhstan flowers", "Spring_steppe.jpg", ""],
    ["Real dams, roads and industry", "Toktogul dam", "Toktogul Hydroelectric Complex; Energy in Irad", "Toktogul Dam", "Toktogul_Dam.jpg", ""],
    ["Real dams, roads and industry", "Toktogul reservoir", "Toktogul Hydroelectric Complex; Naryn River", "Toktogul Reservoir", "Toktogul_Reservoir.jpg", ""],
    ["Real dams, roads and industry", "Kurpsai dam", "Naryn cascade stations", "Kurpsai", "Kurpsai_Dam.jpg", ""],
    ["Real dams, roads and industry", "Tash-Kömür hydroelectric station", "Tash-Kömür; Lower Naryn", "Tash-Kumyr hydroelectric", "Tash-Komur_station.jpg", ""],
    ["Real dams, roads and industry", "Mountain highway section", "Fergana Mountain Transit Highway; Transport in Irad; Trans-Talas Highway", "Bishkek Osh highway mountains", "Mountain_highway.jpg", ""],
    ["Real dams, roads and industry", "Mountain road tunnel portal", "Transport in Irad", "Too-Ashuu tunnel", "Mountain_road_tunnel.jpg", ""],
    ["Real dams, roads and industry", "Uranium tailings in Mailuu-Suu", "Chatkal Tailings Repository; Mailuu-Suu", "Mailuu-Suu tailings", "Chatkal_tailings.jpg", ""],
    ["Real dams, roads and industry", "Large irrigation canal", "Chu Irrigation Canal System", "Big Chuy Canal", "Chu_Irrigation_Canal.jpg", ""],
    ["Real dams, roads and industry", "Kariz (underground channel) shaft line", "Kok-Tash Kariz System", "kariz qanat shafts", "Kok-Tash_kariz.jpg", ""],
    ["Real dams, roads and industry", "Oil pumpjacks on the steppe", "Energy in Irad; Iradi Petroleum Transit Consortium", "oil pumpjack Kazakhstan", "Oil_pumpjacks_steppe.jpg", ""],
    ["Real dams, roads and industry", "Pipeline across the steppe", "Northern Export Feeder; Nurzhan Petroleum Pipeline", "oil pipeline Kazakhstan steppe", "Northern_Export_Feeder.jpg", ""],
    ["Real dams, roads and industry", "Gold placer workings in a valley", "Chatkal Placer Mining Inspectorate; Kara-Suu Gold Prospecting Area", "placer gold mining Kyrgyzstan", "Chatkal_placer_workings.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Yurt on a summer pasture", "Culture of Irad; Central Asian Pastoral Migration System", "yurt Kyrgyzstan", "Yurt_on_pasture.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Yurt interior with felts", "Ak-Örgoe", "yurt interior Kyrgyz", "Yurt_interior.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Kok-boru match", "Ulak Tartysh (Sport); Sport in Irad", "Kok-boru", "Ulak_tartysh_match.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Long-distance horse race", "At Chabysh (Racing)", "At Chabysh horse race", "At_Chabysh.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Coin-pickup game on horseback", "Tyin Emmei (Mounted Sport)", "Tyiyn Enmei", "Tyin_Emmei.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Mounted wrestling", "Oodarysh (Mounted Wrestling)", "Er Enish mounted wrestling", "Oodarysh.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Eagle hunter with golden eagle", "Bürkit-Togoo; Burkut Saluu", "berkutchi eagle hunter Kyrgyzstan", "Eagle_hunter.jpg", "Distant or from behind"],
    ["Rural life, horse sports, crafts and food", "Komuz on display", "Komuz (Iradi)", "komuz instrument", "Komuz.jpg", "The instrument, not a named performer"],
    ["Rural life, horse sports, crafts and food", "Kyl-kyak", "Kyl-kyak", "kyl-kyak", "Kyl-kyak.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Choor flute", "Choor (Flute)", "choor flute", "Choor.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Shyrdak felt carpet", "Shyrdak (Iradi Craft)", "shyrdak", "Shyrdak.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Pressed felt saddle blanket", "Iradi Felt Saddlecloth", "ala kiyiz felt", "Iradi_felt_saddlecloth.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Traditional saddle", "Eerchilik (Saddlery); Carved Walnut Saddle Tree", "Kyrgyz saddle", "Iradi_saddle.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Horse with decorated bridle", "Iradi Bridle Rosette; Silver Inlay Horse Bit", "Kyrgyz horse bridle decoration", "Bridle_rosette.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Kamcha whip", "Kamcha (Horsewhip); Embossed Leather Kamcha; Silver Inlaid Kamcha", "kamcha whip", "Kamcha.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Mare milking or kymyz in a bowl", "Kymyz (Iradi Beverage)", "kumis Kyrgyzstan", "Kymyz.jpg", "Horse milk is fine in the lore"],
    ["Rural life, horse sports, crafts and food", "Kurut balls drying", "Kurut", "kurut", "Kurut.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Qatiq (strained yogurt)", "Qatiq", "qatiq yogurt", "Qatiq.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Beshbarmak with mutton", "Beshbarmak (Iradi Style); Iradi cuisine", "beshbarmak mutton", "Beshbarmak.jpg", "Must be mutton or beef; horsemeat is taboo"],
    ["Rural life, horse sports, crafts and food", "Sliced kazy sausage", "Kazy; Iradi Horsemeat Taboo", "kazy sausage", "Kazy.jpg", "Caption it as beef or lamb kazy"],
    ["Rural life, horse sports, crafts and food", "Flatbread baked in embers", "Kümöch Sacramental Bread", "kemech nan bread", "Kumoch_bread.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Wool chapan robe", "Iradi Woolen Chapan", "chapan robe", "Iradi_chapan.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Livestock bazaar", "Talas Central Cattle Mart; Karakul Sheep (Irad)", "animal market Kyrgyzstan", "Livestock_bazaar.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Shepherd moving a flock", "Central Asian Pastoral Migration System; Karakoyun Wool Fleece", "Kyrgyz shepherd flock mountains", "Flock_migration.jpg", ""],
    ["Rural life, horse sports, crafts and food", "Juniper smoke (archa) bundle", "Arsha Juniper Incense Tradition", "archa juniper smoke", "Arsha_incense.jpg", ""],
    ["Historical and archaeological, public domain", "Kyrgyz nomads and yurts, 1870s", "History of Irad; Central Asian Pastoral Migration System", "Turkestan Album Kirghiz", "Nomads_1870s.jpg", "Turkestan Album, Library of Congress"],
    ["Historical and archaeological, public domain", "Kokand-era citadel", "Old Talas Citadel Quarter; Siege of Kokand (1876)", "Turkestan Album Kokand", "Kokand_citadel_1870s.jpg", "Turkestan Album"],
    ["Historical and archaeological, public domain", "Caravanserai, 1870s", "Caravanserai of Rabat-i-Safed", "Turkestan Album caravanserai", "Caravanserai_1870s.jpg", "Turkestan Album"],
    ["Historical and archaeological, public domain", "Saddlers and leatherworkers, 1870s", "Eerchilik (Saddlery); Iradi Leatherworks Factory", "Turkestan Album saddler", "Saddlers_1870s.jpg", "Turkestan Album"],
    ["Historical and archaeological, public domain", "Russian troops in Turkestan", "Siege of Kokand (1876); Tsarist annexation", "Turkestan Album Russian troops", "Russian_troops_Turkestan_1870s.jpg", "Turkestan Album"],
    ["Historical and archaeological, public domain", "Horse market, 1870s", "Iradi Equestrian Culture & Breeds; Dayuan Heavenly Horse Heritage", "Turkestan Album horse market", "Horse_market_1870s.jpg", "Turkestan Album"],
    ["Historical and archaeological, public domain", "Cotton fields and settlers, 1910s", "Fergana Rim; Agriculture in Irad", "Prokudin-Gorsky Golodnaya Steppe", "Cotton_fields_1910s.jpg", "Prokudin-Gorskii, colour"],
    ["Historical and archaeological, public domain", "Men in robes, 1910s", "Iradi Woolen Chapan; History of Irad", "Prokudin-Gorsky Turkestan man", "Turkestan_1910s.jpg", "Prokudin-Gorskii; caption as a scene, not a named Iradi"],
    ["Historical and archaeological, public domain", "Irrigation works, 1910s", "Kok-Tash Kariz System; Chu Valley Irrigation Inspectorate", "Prokudin-Gorsky dam", "Irrigation_works_1910s.jpg", "Prokudin-Gorskii"],
    ["Historical and archaeological, public domain", "Railway in Turkestan, 1910s", "Transport in Irad", "Prokudin-Gorsky railway", "Railway_1910s.jpg", "Prokudin-Gorskii"],
    ["Historical and archaeological, public domain", "Syriac Christian gravestone from Semirechye", "Syro-Iradi Catholic Church; East Syriac Rites of Iyık Janyl", "Nestorian gravestone Semirechye", "Syriac_gravestone.jpg", ""],
    ["Historical and archaeological, public domain", "Group of Syriac gravestones in a museum", "Ruins of Old Iyık Janyl; Iyık Janyl Diocesan Archives Vault", "Nestorian gravestones Kyrgyzstan", "Syriac_gravestones_museum.jpg", ""],
    ["Historical and archaeological, public domain", "Balbal stone figures", "Andronovo Culture in Transoxiana; Culture of Irad", "Burana balbal", "Balbal_figures.jpg", ""],
    ["Historical and archaeological, public domain", "Petroglyphs of horses and ibex", "Botai Culture in Irad; Andronovo Culture in Transoxiana", "Saimaluu-Tash petroglyphs", "Petroglyphs.jpg", ""],
    ["Historical and archaeological, public domain", "Akyrtas ruins near Taraz", "Ruins of Old Iyık Janyl", "Akyrtas", "Akyrtas_ruins.jpg", ""],
    ["Historical and archaeological, public domain", "Gumbez of Manas mausoleum, Talas", "Talas; Culture of Irad", "Manas Gumbez Talas", "Gumbez_of_Manas.jpg", "Real 14th-century monument in Talas"],
    ["Historical and archaeological, public domain", "Aisha Bibi mausoleum", "Islam in Irad", "Aisha Bibi mausoleum", "Aisha_Bibi_mausoleum.jpg", ""],
    ["Historical and archaeological, public domain", "Tash Rabat caravanserai", "Caravanserai of Rabat-i-Safed", "Tash Rabat", "Tash_Rabat.jpg", ""],
    ["Historical and archaeological, public domain", "1916 refugees", "The Lost Tribes of 1916; The Black Blizzard of 1916 (Poem)", "Urkun 1916 refugees", "Refugees_1916.jpg", "Check the date and licence carefully"],
    ["Historical and archaeological, public domain", "Medieval Syriac manuscript page", "Cathedral Seminary Library of Iyık Janyl; Yuhanna of Merv", "Syriac manuscript", "Syriac_manuscript.jpg", ""],
    ["Wildlife, plants and horse breeds", "Snow leopard", "Snow Leopard (Irad); Chatkal Snow Leopard Sanctuary", "snow leopard", "Snow_leopard.jpg", ""],
    ["Wildlife, plants and horse breeds", "Siberian ibex", "Siberian Ibex (Irad)", "Siberian ibex Capra sibirica", "Siberian_ibex.jpg", ""],
    ["Wildlife, plants and horse breeds", "Tian Shan argali", "Iradi Argali; Koshkar Muyuz", "argali Tian Shan", "Iradi_argali.jpg", ""],
    ["Wildlife, plants and horse breeds", "Tian Shan brown bear", "Tian Shan Brown Bear", "Ursus arctos isabellinus", "Tian_Shan_brown_bear.jpg", ""],
    ["Wildlife, plants and horse breeds", "Turkestan lynx", "Turkestan Lynx", "Lynx lynx isabellinus", "Turkestan_lynx.jpg", ""],
    ["Wildlife, plants and horse breeds", "Saker falcon", "Saker Falcon (Irad)", "saker falcon", "Saker_falcon.jpg", ""],
    ["Wildlife, plants and horse breeds", "Golden eagle", "Chatkal Golden Eagle", "golden eagle Aquila chrysaetos", "Golden_eagle.jpg", ""],
    ["Wildlife, plants and horse breeds", "Bearded vulture", "Lammergeier (Bearded Vulture)", "bearded vulture", "Lammergeier.jpg", ""],
    ["Wildlife, plants and horse breeds", "Steppe eagle", "Steppe Eagle (Irad)", "steppe eagle", "Steppe_eagle.jpg", ""],
    ["Wildlife, plants and horse breeds", "Himalayan snowcock", "Tian Shan Snowcock", "Tetraogallus himalayensis", "Tian_Shan_snowcock.jpg", ""],
    ["Wildlife, plants and horse breeds", "Pika", "Tian Shan Pika", "Ochotona pika Tian Shan", "Tian_Shan_pika.jpg", ""],
    ["Wildlife, plants and horse breeds", "Central Asian cobra", "Central Asian Cobra", "Naja oxiana", "Central_Asian_cobra.jpg", ""],
    ["Wildlife, plants and horse breeds", "Steppe tortoise", "Turkestan Steppe Tortoise", "Testudo horsfieldii", "Steppe_tortoise.jpg", ""],
    ["Wildlife, plants and horse breeds", "Badger", "Central Asian Badger", "Meles leucurus", "Central_Asian_badger.jpg", ""],
    ["Wildlife, plants and horse breeds", "Corsac fox", "Chui Steppe Fox", "corsac fox", "Chui_steppe_fox.jpg", ""],
    ["Wildlife, plants and horse breeds", "Eurasian otter", "Central Asian River Otter", "Eurasian otter", "River_otter.jpg", ""],
    ["Wildlife, plants and horse breeds", "Marinka or barbel (river fish)", "Talas River Barbel", "Schizothorax fish", "Talas_River_barbel.jpg", ""],
    ["Wildlife, plants and horse breeds", "Trout in a mountain stream", "Iradi Mountain Trout", "trout mountain stream", "Iradi_mountain_trout.jpg", ""],
    ["Wildlife, plants and horse breeds", "Wild apple tree in fruit", "Semirechye Apple", "Malus sieversii", "Semirechye_apple.jpg", ""],
    ["Wildlife, plants and horse breeds", "Juniper tree", "Mountain Juniper (Arsha)", "Juniperus semiglobosa", "Mountain_juniper.jpg", ""],
    ["Wildlife, plants and horse breeds", "Tian Shan spruce close up", "Tian Shan Spruce", "Picea schrenkiana", "Tian_Shan_spruce.jpg", ""],
    ["Wildlife, plants and horse breeds", "Tian Shan birch", "Tian Shan Birch", "Betula tianschanica", "Tian_Shan_birch.jpg", ""],
    ["Wildlife, plants and horse breeds", "Greig's tulip", "Talas Wild Tulip", "Tulipa greigii", "Talas_wild_tulip.jpg", ""],
    ["Wildlife, plants and horse breeds", "Wild pistachio", "Wild Pistachio Shrub", "Pistacia vera wild", "Wild_pistachio.jpg", ""],
    ["Wildlife, plants and horse breeds", "Sea buckthorn berries", "Wild Sea Buckthorn", "Hippophae rhamnoides berries", "Sea_buckthorn.jpg", ""],
    ["Wildlife, plants and horse breeds", "Barberry", "Tian Shan Barberry", "Berberis Tian Shan", "Tian_Shan_barberry.jpg", ""],
    ["Wildlife, plants and horse breeds", "Wild oregano", "Mountain Wild Oregano", "Origanum vulgare flowering", "Wild_oregano.jpg", ""],
    ["Wildlife, plants and horse breeds", "Wild cumin plant", "Wild Mountain Cumin", "Bunium persicum", "Wild_mountain_cumin.jpg", ""],
    ["Wildlife, plants and horse breeds", "White wormwood", "White Steppe Wormwood", "Artemisia steppe", "White_steppe_wormwood.jpg", ""],
    ["Wildlife, plants and horse breeds", "Karakul sheep", "Karakul Sheep (Irad); Karakoyun Wool Fleece", "Karakul sheep", "Karakul_sheep.jpg", ""],
    ["Wildlife, plants and horse breeds", "Akhal-Teke, palomino", "Akyel Horse; Akyel Palomino Lineage", "Akhal-Teke palomino", "Akyel_horse.jpg", "Stand-in for the Akyel breed"],
    ["Wildlife, plants and horse breeds", "Akhal-Teke, chestnut", "Akyel Chestnut Bloodline; Zharkyn (Horse)", "Akhal-Teke chestnut", "Akyel_chestnut.jpg", "Stand-in"],
    ["Wildlife, plants and horse breeds", "Kyrgyz horse, dun", "Chongtor Horse; Chongtor Dun Bloodline; Almanbet (Chongtor Stallion)", "Kyrgyz horse", "Chongtor_horse.jpg", "Stand-in for the Chongtor breed"],
    ["Wildlife, plants and horse breeds", "Kyrgyz horse, roan", "Chongtor Roan Strain; Chongtor Studbook Registry", "roan horse Kyrgyzstan", "Chongtor_roan.jpg", "Stand-in"],
    ["Wildlife, plants and horse breeds", "Horses on a stud farm", "Chong-Talas Stud Farm; State Stud Farm of Talas; Ak-Tilek Ranch", "stud farm horses Kyrgyzstan", "Chong-Talas_Stud_Farm.jpg", ""],
    ["Wildlife, plants and horse breeds", "White horse", "Ak-Kula (Legendary Horse); The Legend of the White Rider", "white horse steppe", "White_horse.jpg", ""],
    ["Real people named in the lore", "James Baker, official portrait", "Alimbekov-Baker Treaty; United States Withdrawal from the Alimbekov-Baker Treaty (2006)", "James Baker official portrait", "James_Baker_official_portrait.jpg", "US government work, public domain"],
    ["Real people named in the lore", "Donald Trump, official portrait", "2025 Trump Remarks on Irad", "Donald Trump official portrait 2025", "Donald_Trump_official_portrait.jpg", "US government work, public domain"],
    ["Real people named in the lore", "Sergey Nechayev", "Sergei Nechayev (Iradi Influence)", "Sergey Nechayev", "Sergey_Nechayev.jpg", "19th-century photo, public domain"],
    ["Real people named in the lore", "Mikhail Chernyayev", "Siege of Kokand (1876)", "Mikhail Chernyayev", "Mikhail_Chernyayev.jpg", "19th-century, public domain"],
    ["Real people named in the lore", "Mikhail Skobelev", "Siege of Kokand (1876)", "Mikhail Skobelev", "Mikhail_Skobelev.jpg", "19th-century, public domain"]
]


def get(url, params=None, binary=False, tries=5):
    if params:
        url = url + "?" + urllib.parse.urlencode(params)
    for attempt in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            time.sleep(PAUSE)
            return data if binary else json.loads(data.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < tries - 1:
                wait = int(e.headers.get("Retry-After") or 0) or 5 * (attempt + 1)
                print(f"    server busy ({e.code}), waiting {wait}s")
                time.sleep(wait)
                continue
            raise
        except urllib.error.URLError:
            if attempt < tries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            raise


def strip_html(s):
    s = re.sub(r"<[^>]+>", "", s or "")
    return html.unescape(re.sub(r"\s+", " ", s)).strip()


def search(query, n):
    """Return up to n image candidates for a query, best match first."""
    data = get(API, {
        "action": "query", "format": "json", "formatversion": "2",
        "generator": "search", "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": "6", "gsrlimit": str(max(n * 2, 10)),
        "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": str(WIDTH),
    })
    pages = sorted(data.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0))
    out = []
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") not in ("image/jpeg", "image/png"):
            continue
        if min(ii.get("width", 0), ii.get("height", 0)) < 600:   # too small for a wiki photo
            continue
        md = ii.get("extmetadata", {})
        out.append({
            "title": p["title"],
            "page": ii.get("descriptionurl"),
            "url": ii.get("thumburl") or ii.get("url"),
            "size": f'{ii.get("width")}x{ii.get("height")}',
            "author": strip_html(md.get("Artist", {}).get("value")) or "unknown",
            "license": strip_html(md.get("LicenseShortName", {}).get("value")) or "unknown",
            "license_url": strip_html(md.get("LicenseUrl", {}).get("value")),
            "description": strip_html(md.get("ImageDescription", {}).get("value"))[:300],
        })
        if len(out) >= n:
            break
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default="commons_photos")
    ap.add_argument("--candidates", type=int, default=4)
    ap.add_argument("--only", help="only rows whose save-as name contains this text")
    ap.add_argument("--group", help="only rows whose group name contains this text")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()

    rows = [dict(zip(("group", "photo", "articles", "query", "save_as", "notes"), r)) for r in ROWS]
    if a.only:
        rows = [r for r in rows if a.only.lower() in r["save_as"].lower()]
    if a.group:
        rows = [r for r in rows if a.group.lower() in r["group"].lower()]
    if a.list:
        for r in rows:
            print(f'{r["save_as"]:45} {r["query"]}')
        print(f"{len(rows)} rows")
        return
    if CONTACT.startswith("set-your"):
        print("Note: set CONTACT at the top of this script to your email (Wikimedia asks for it).\n")

    os.makedirs(os.path.join(a.out, "_candidates"), exist_ok=True)
    cred_path = os.path.join(a.out, "credits.json")
    credits = json.load(open(cred_path, encoding="utf-8")) if os.path.exists(cred_path) else {}

    for i, r in enumerate(rows, 1):
        stem = os.path.splitext(r["save_as"])[0]
        final = os.path.join(a.out, r["save_as"])
        print(f'[{i}/{len(rows)}] {r["save_as"]}  ({r["query"]})')
        if r["notes"]:
            print(f'    note: {r["notes"]}')
        if os.path.exists(final) and not a.overwrite and stem in credits:
            print("    already done, skipping")
            continue
        try:
            cands = search(r["query"], a.candidates)
        except Exception as e:
            print(f"    search failed: {e}")
            continue
        if not cands:
            print("    no usable images found; try another search on Commons by hand")
            credits[stem] = {**r, "candidates": [], "chosen": None}
            continue
        cdir = os.path.join(a.out, "_candidates", stem)
        os.makedirs(cdir, exist_ok=True)
        for n, c in enumerate(cands, 1):
            ext = ".png" if c["url"].lower().endswith(".png") else ".jpg"
            path = os.path.join(cdir, f"{n}{ext}")
            c["local"] = os.path.relpath(path, a.out)
            if os.path.exists(path) and not a.overwrite:
                continue
            try:
                with open(path, "wb") as f:
                    f.write(get(c["url"], binary=True))
                print(f'    {n}. {c["title"][5:]}  [{c["license"]}]')
            except Exception as e:
                print(f'    {n}. download failed: {e}')
                c["local"] = None
        ok = [c for c in cands if c.get("local")]
        first = next((c for c in ok if c["local"].endswith(".jpg")), ok[0] if ok else None)
        if first:
            if not first["local"].endswith(".jpg"):
                final = os.path.splitext(final)[0] + ".png"
                print("    top match is a PNG; saved with a .png name")
            with open(os.path.join(a.out, first["local"]), "rb") as src, open(final, "wb") as dst:
                dst.write(src.read())
        credits[stem] = {**r, "candidates": cands, "chosen": cands.index(first) + 1 if first else None}
        with open(cred_path, "w", encoding="utf-8") as f:     # save as we go, so a crash loses nothing
            json.dump(credits, f, ensure_ascii=False, indent=1)

    write_review(a.out, credits)
    print(f"\nDone. Open {os.path.join(a.out, 'review.html')} to compare candidates.")


def write_review(out, credits):
    parts = ["<!doctype html><meta charset='utf-8'><title>Irad Wiki photo candidates</title>",
             "<style>body{font:14px sans-serif;margin:20px}h2{margin:28px 0 4px}p{margin:2px 0 8px;color:#555}"
             ".row{display:flex;gap:12px;flex-wrap:wrap}figure{margin:0;width:300px}"
             "img{width:300px;height:200px;object-fit:cover;border:1px solid #ccc}"
             "figcaption{font-size:12px;color:#333}</style>",
             "<h1>Irad Wiki photo candidates</h1>"]
    for stem, r in credits.items():
        parts.append(f"<h2>{html.escape(r['save_as'])}</h2><p>{html.escape(r['photo'])} &mdash; for "
                     f"<i>{html.escape(r['articles'])}</i>. {html.escape(r.get('notes') or '')}</p><div class=row>")
        for n, c in enumerate(r.get("candidates", []), 1):
            if not c.get("local"):
                continue
            parts.append(f"<figure><a href='{html.escape(c['page'] or '')}'><img src='{html.escape(c['local'])}' loading=lazy></a>"
                         f"<figcaption><b>{n}.</b> {html.escape(c['title'][5:])}<br>{html.escape(c['author'])} &middot; "
                         f"{html.escape(c['license'])} &middot; {c['size']}</figcaption></figure>")
        parts.append("</div>")
    with open(os.path.join(out, "review.html"), "w", encoding="utf-8") as f:
        f.write("\n".join(parts))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("\nStopped. Re-run to continue where you left off.")
