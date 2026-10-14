"""Copy chosen wiki AI photos into the IradOne and Talas Herald photo pools."""
import json, shutil, sys
from pathlib import Path
WIKI = Path("/home/claude/irad_wiki")
man = {e["file"]: e for e in json.load(open(WIKI/"images/images.json"))}
# wiki file -> (site name, iradone categories, herald categories)
PICK = {
 "Talas_skyline_2022.jpg": ("talas-skyline", None, None),            # refresh old versions only
 "Nurzhan_central_square.jpg": ("nurzhan-square", None, None),
 "Nurzhan_Refinery_No_1.jpg": ("nurzhan-refinery", None, None),
 "Iradi_election_2023.jpg": ("polling-station", ["politics"], ["politics"]),
 "Talas_student_protests_2023.jpg": ("talas-protest", [], ["politics", "courts"]),
 "Irad_not_for_sale_2025.jpg": ("talas-demonstration", ["politics"], ["politics"]),
 "Qara-Chik_Border_Checkpoint.jpg": ("qara-chik-checkpoint", ["politics", "regional", "infrastructure"], ["politics", "regional", "courts"]),
 "Kara-Oi_UNMI_headquarters.jpg": ("unmi-kara-oi", ["politics", "regional"], ["politics", "regional"]),
 "Boz-Korgon_compound.jpg": ("boz-korgon", ["politics"], ["politics"]),
 "Gendarmerie_patrol.jpg": ("gendarmerie-patrol", ["regional"], ["regional", "courts"]),
 "Border_clashes_2018.jpg": ("desert-borehole", ["regional"], ["regional"]),
 "Smuggling_pack_train.jpg": ("pack-horses-dusk", ["regional"], ["regional", "courts"]),
 "Army_engineers_bridge.jpg": ("army-engineers", ["infrastructure", "regional"], ["infrastructure", "regional"]),
 "Talas_Air_Base.jpg": ("talas-air-base", ["regional"], ["regional"]),
 "Bazar-i_Kalan.jpg": ("bazar-i-kalan", ["economy", "city"], ["economy", "city"]),
 "Semiz_tortilleria.jpg": ("semiz-tortilleria", ["economy", "culture"], ["economy", "culture"]),
 "NurGaz_wells.jpg": ("nurgaz-wells", ["energy", "economy"], ["energy", "economy"]),
 "Talas_Solar_Park.jpg": ("talas-solar-park", ["energy", "technology"], ["energy", "technology"]),
 "Chatkal_smelter.jpg": ("chatkal-smelter", ["energy", "environment", "economy"], ["energy", "environment", "economy"]),
 "Sary-Bulak_mine.jpg": ("sary-bulak-mine", ["economy", "infrastructure"], ["economy", "infrastructure"]),
 "State_Stud_Farm.jpg": ("stud-farm", ["agriculture"], ["agriculture"]),
 "Chongtor_horse.jpg": ("chongtor-pasture", ["agriculture"], ["agriculture"]),
 "Kymyz_herder.jpg": ("kymyz-yurt", ["agriculture", "culture"], ["agriculture", "culture"]),
 "Aksay_Plateau.jpg": ("aksay-plateau", ["agriculture", "environment"], ["agriculture", "environment"]),
 "Kok-Tash_Kariz.jpg": ("kariz-shafts", ["agriculture", "environment"], ["agriculture", "environment"]),
 "IradOne_mast.jpg": ("tv-mast", ["technology", "infrastructure"], ["technology", "infrastructure"]),
 "Talas_State_University.jpg": ("talas-university", ["city", "technology"], ["city", "technology"]),
 "Tunduk_hall.jpg": ("philharmonic-hall", ["city", "culture"], ["city", "culture"]),
 "Hunters_Vigil.jpg": ("hunters-vigil", ["city", "culture"], ["city", "culture"]),
 "Old_Talas_Citadel.jpg": ("old-talas-gate", ["city", "culture"], ["city", "culture"]),
 "Manas_Glacier.jpg": ("glacier-snout", ["environment"], ["environment"]),
 "Chatkal_Range.jpg": ("chatkal-valley", ["environment"], ["environment"]),
 "Arsha_juniper.jpg": ("juniper-slope", ["environment"], ["environment"]),
 "Feast_of_St_Janyl.jpg": ("feast-blessing", ["culture"], ["culture"]),
 "Church_of_St_Janyl.jpg": ("st-janyl-cathedral", ["culture"], ["culture"]),
 "East_Syriac_church.jpg": ("church-liturgy", ["culture"], ["culture"]),
 "Eagle_hunter.jpg": ("eagle-hunter", ["culture", "sport"], ["culture", "sport"]),
 "Ak-kalpak.jpg": ("kalpak-stall", ["culture", "economy"], ["culture", "economy"]),
 "Diz_Film_Festival.jpg": ("film-screening", ["culture"], ["culture"]),
 "Talasfilm_archive.jpg": ("film-archive", ["culture"], ["culture"]),
 "Wedding_yurt.jpg": ("wedding-yurt", ["culture"], ["culture"]),
 "Semiz_Day_of_the_Dead.jpg": ("semiz-procession", ["culture"], ["culture"]),
 "Kara-Ak_derby.jpg": ("derby-floodlights", ["sport"], ["sport"]),
 "Ulak_tartysh_Hippodrome.jpg": ("hippodrome-ulak", ["sport"], ["sport"]),
 "Irad_Day_race.jpg": ("steppe-race", ["sport", "culture"], ["sport", "culture"]),
}
for repo, idx in (("iradone", 1), ("talas_herald", 2)):
    root = Path("/home/claude")/repo
    cred = json.load(open(root/"photos/credits.json"))
    pools = json.load(open(root/"newsroom/images.json"))
    for f, spec in PICK.items():
        name, cats = spec[0], spec[idx]
        key = f"photos/{name}.jpg"
        shutil.copy(WIKI/"images"/f, root/key)
        e = man[f]
        cred[key] = {"alt": e["caption"], "kind": "ai", "author": "Irad Wiki", "licence": "AI-generated illustration",
                     "licence_url": "", "source": "https://irad.wiki", "title": e["caption"]}
        for c in cats or []:
            pools.setdefault(c, [])
            if key not in pools[c]: pools[c].append(key)
    json.dump(dict(sorted(cred.items())), open(root/"photos/credits.json", "w"), indent=2, ensure_ascii=False); open(root/"photos/credits.json","a").write("\n")
    json.dump(pools, open(root/"newsroom/images.json", "w"), indent=2, ensure_ascii=False); open(root/"newsroom/images.json","a").write("\n")
    print(repo, {k: len(v) for k, v in pools.items() if k[0] != "_"})
