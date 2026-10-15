import json
NEWS="Contemporary news agency photograph, full-frame digital camera, 35mm lens, natural light, realistic colour, realistic skin texture, shallow depth of field, slightly off-centre framing, vertical portrait. "
F92="1992 news photograph on colour negative film, heavy grain, muted colours, handheld, overcast light, wire-service look, vertical portrait. "
P={
"Erlan_Toktarov_2019":("Ref_Erlan_Toktarov.png","man",65,NEWS+"Official government portrait, head and shoulders, navy suit, white shirt, dark tie, small enamel lapel pin, plain dark blue backdrop, studio light, composed stern expression."),
"Anara_Toktarova_2015":("Ref_Anara_Toktarova.png","woman",59,NEWS+"Portrait at a children's charity event, head and shoulders, dark teal tailored dress, small gold earrings, grey-streaked hair in a low bun, warm indoor light, colourful children's drawings blurred on the wall behind, gentle smile."),
"Ruslan_Toktarov_2021":("Ref_Ruslan_Toktarov.png","man",43,NEWS+"Portrait at a military ceremony, dark olive gendarmerie general's uniform with gold shoulder boards and a peaked cap, parade ground and ranks of soldiers blurred behind, overcast day, stern unsmiling expression."),
"Alikhan_Toktarov_2019":("Ref_Alikhan_Toktarov.png","man",39,NEWS+"Portrait at a television studio launch event, slim dark suit, open-collar white shirt, large steel wristwatch, studio lights and screens blurred behind, faint smirk."),
"Timur_Toktarov_2016":("Ref_Timur_Toktarov.png","man",34,NEWS+"Portrait at a truck depot, plain grey suit, rimless glasses, rows of white articulated trucks blurred behind, overcast daylight, reserved expression."),
"Adil_Toktarov_2017":("Ref_Adil_Toktarov.png","man",33,NEWS+"Portrait at a construction site, white hard hat, navy blazer over an open shirt, no tie, cranes and a half-built glass office tower behind, bright daylight."),
"Bekzat_Toktarov_2018":("Ref_Bekzat_Toktarov.png","man",32,NEWS+"Portrait in front of tall concrete grain silos, quilted navy gilet over a checked shirt, clear blue sky, shy friendly expression."),
"Zara_Toktarova_2022":("Ref_Zara_Toktarova.png","woman",34,NEWS+"Candid portrait at a village library event, holding a children's picture book, long black hair in a ponytail, round tortoiseshell glasses, grey cardigan, rows of bookshelves blurred behind, natural window light, warm reserved smile."),
"Aidar_Maksat_2024":("Ref_Aidar_Maksat.png","man",44,NEWS+"Portrait at a lectern addressing an audience, dark suit and narrow tie, thin rectangular steel glasses, first grey at the temples, holding papers, conference room behind."),
"Bektur_Zhumabek_uulu_2022":("Ref_Bektur_Zhumabek_uulu.png","man",54,NEWS+"Outdoor portrait on a high summer mountain pasture, battered old brown felt cowboy hat, dark green quilted coat, long drooping moustache streaked with grey, the head of a dun mountain horse at the edge of the frame, white yurts and snowy peaks blurred behind."),
"Kamran_Bekzatov_2019":("Ref_Kamran_Bekzatov.png","man",68,NEWS+"Portrait at a business forum podium, expensive charcoal suit, a heavy gold ring visible on the hand gripping the lectern, blurred stage lights behind."),
"Jason_Ilyasov_2025":("Ref_Jason_Ilyasov.png","man",37,NEWS+"Portrait on stage at a tech product launch, plain black crewneck sweater, holding a wireless microphone, mid-sentence, large blurred blue screen and dark audience behind, stage lighting."),
"Mar_Ephrem_2024":("Ref_Mar_Ephrem.png","man",69,NEWS+"Portrait in a candlelit church interior, white beard, black cassock, tall black cylindrical hat with a black veil, plain silver pectoral cross without any figure, old brick vault and icons blurred behind."),
"Bakyt_Orozbekov_2006":("Ref_Bakyt_Orozbekov.png","man",44,"2006 press photograph from a compact digital camera, on-camera flash, slightly warm cast, vertical portrait. Formal portrait in a wood-panelled legislative office, dark double-breasted suit, wire-rimmed glasses, shelves of law books behind, composed expression."),
"Vasily_Chernov_1990":("Ref_Vasily_Chernov.png","man",55,"Soviet official press photograph from 1990, black and white 35mm film, visible grain, soft mid-grey tones, vertical portrait. Official party portrait, head and shoulders, Soviet grey suit with a small party badge on the lapel, plain studio backdrop."),
"Kuban_Mamytov_1992":("Ref_Kuban_Mamytov.png","man",43,F92+"Portrait on horseback in a mountain pass, white felt kalpak hat, old Soviet army greatcoat over a quilted coat, rifle slung on the shoulder, snow patches and rocky slopes behind."),
"David_Sterling_1992":("Ref_David_Sterling.png","man",46,F92+"Portrait at a military airfield, US Army woodland camouflage uniform, sandy-grey crew cut, a grey transport aircraft blurred behind, squinting into the wind."),
}
base=json.load(open('/home/claude/wikigen/chars/r4.json'))[0]
jobs=[]
for i,(n,(ref,g,age,scene)) in enumerate(P.items()):
    w=json.loads(json.dumps(base))
    w["4"]["inputs"]["image"]=ref
    pron="man" if g=="man" else "woman"
    w["7"]["inputs"]["text"]=f"The same {pron} as in the reference photo, same face, same eyes, nose and mouth, same build, aged {age}. {scene} No text, no logos, no flags."
    w["12"]["inputs"]["seed"]=9300+i
    w["14"]["inputs"]["filename_prefix"]="portraits/"+n
    jobs.append(w)
json.dump(jobs,open('jobs.json','w'))
print(len(jobs))
