# Character references

Approved faces for recurring people. Every generated photo of these people starts from the reference image here (fed to an edit model as a reference), so the face stays the same across photos and ages. Descriptions and looks by year are in `tools/gemini_handoff/Irad_image_brief.md` (Character bibles).

| File | Person | Approved | Notes |
|---|---|---|---|
| `Ref_Erlan_Toktarov.png` | Erlan Toktarov, aged 64 (2018) | 2026-10-14 | Iranic (Uzbek/Tajik-like) features. (The eyebrow scar was dropped from the canon on 2026-10-14.) Moustache in 1992, clean-shaven from 2007 |
| `Ref_Mar_Ephrem.png` | Mar Ephrem, aged 69 (2024) | 2026-10-14 | Iranic features; plain flared cross with no figure |

Made with FLUX.1 Krea Dev on the owner's PC; the copies also live in ComfyUI's `input/` folder under the same names.

## Head-turn sheets

A head-turn sheet shows the approved master portrait from seven angles: both profiles, both three-quarter views, the front, looking down and looking up. Each angle is a separate FLUX.2 Klein render, using the master portrait as a reference image (LoadImage → ImageScaleToTotalPixels 1 MP → VAEEncode → ReferenceLatent on both conditionings; 1024×1024, cfg 4, 26 steps). The prompt starts "The same man as in the reference photo, same face, same age, same hair, same clothes" and then names the angle. Asking for the whole sheet in one image gives a different person in each panel. Two seeds per angle, keep the better one; adding words like "heavy-set" or "jowly" to steer a thin result made it worse. The single angles are kept in `angles/` for use as references in scene work.

| Sheet | Status |
|---|---|
| `Ref_Erlan_Toktarov_turnaround.jpg` | Made 2026-10-14, awaiting owner approval. The three-quarter view facing left is the weakest likeness (face slightly thinner) |

## Front portraits approved 2026-10-14 (round 1)

Made with FLUX.1 Krea Dev (no LoRA), 896×1152, from text descriptions; prompts in `/home/claude/wikigen/chars` style: "Studio portrait photograph, head and shoulders, looking at the camera, plain mid-grey background..." plus the brief's description. Making the sons from Erlan's photo with Klein ("the son of the man in the reference photo") failed: it drew Erlan himself or a cartoonish face, so the family resemblance is written into the text instead.

| File | Person |
|---|---|
| `Ref_Ruslan_Toktarov.png` | Ruslan, about 40, Gendarmerie general's tunic |
| `Ref_Timur_Toktarov.png` | Timur, about 36 |
| `Ref_Adil_Toktarov.png` | Adil, about 34 (looks a little younger) |
| `Ref_Aidar_Maksat.png` | Aidar Maksat, about 39 |
| `Ref_Kamran_Bekzatov.png` | Kamran Bekzatov, about 67, Turkic–Russian mix |

Approved 2026-10-14 (round 3):

| File | Person | How it was made |
|---|---|---|
| `Ref_Anara_Toktarova.png` | Anara, mid-to-late fifties | Krea portrait at about 40, aged up with a Klein edit (text prompts alone gave either 35 or 75) |
| `Ref_Alikhan_Toktarov.png` | Alikhan, about 38 | Krea, "average-looking ... neither handsome nor fat" (earlier tries were model-handsome or heavy) |
| `Ref_Jason_Ilyasov.png` | Jason, about 30 | Krea mixed-race portrait, Klein edit for a squarer jaw and more East Asian eyes |
| `Ref_Bektur_Zhumabek_uulu.png` | Bektur, about 50 | Krea portrait, Klein edit swapping the felt hat for his battered brown cowboy hat |

Notes: Klein edits are good for swapping clothes or hats and for ageing up, but barely change weight, attractiveness or eye shape. Krea makes Central Asian women look 70+ whenever grey hair or "late fifties" is in the prompt; describe a younger woman and age her with Klein.
