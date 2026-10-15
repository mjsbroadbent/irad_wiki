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

Approved 2026-10-14 (round 4): `Ref_Bekzat_Toktarov.png` and `Ref_Zara_Toktarova.png` (Klein "adult son/daughter of the woman in the reference photo" from the younger Anara portrait, so they share her face; text-only versions came out fully East Asian), `Ref_Bakyt_Orozbekov.png`, `Ref_Kuban_Mamytov.png` (1992), `Ref_Vasily_Chernov.png` (1991), `Ref_David_Sterling.png` (1992; fake name tape blurred). Alimbekov was redone with a thick moustache and no beard; `Ref_Amanbek_Alimbekov.png` (round p) approved.

## Article portraits, 2026-10-15

Lead photos for 17 biographies, each made from the person's approved reference with FLUX.2 Klein (`flux-2-klein-base-4b`, `qwen_3_4b`, `flux2-vae`): LoadImage (the `Ref_` file in ComfyUI `input/`) → VAEEncode → ReferenceLatent on both conditionings → 896×1152, cfg 4, 26 steps, two per job. Prompt: "The same man/woman as in the reference photo, same face, same eyes, nose and mouth, same build, aged N." plus the scene from the image brief (prompts in `portrait_prompts.py`). Likeness held for everyone. Then cropped to 4:5 (896×1120) with light grain; the 1990 portrait is converted to greyscale and the 1992 ones get a warm, lifted-black film cast. Sterling's garbled name tape is blurred.

Files: `Erlan_Toktarov_2019`, `Anara_Toktarova_2015`, `Ruslan_Toktarov_2021`, `Alikhan_Toktarov_2019`, `Timur_Toktarov_2016`, `Adil_Toktarov_2017`, `Bekzat_Toktarov_2018`, `Zara_Toktarova_2022`, `Aidar_Maksat_2024`, `Bektur_Zhumabek_uulu_2022`, `Kamran_Bekzatov_2019`, `Jason_Ilyasov_2025`, `Mar_Ephrem_2024` (the brief's 2012 enthronement swapped for 2024 to match the reference's age), `Bakyt_Orozbekov_2006`, `Vasily_Chernov_1990`, `Kuban_Mamytov_1992`, `David_Sterling_1992` (all `.jpg` in `images/`, placement lead).

Notes:
- Only Erlan's and Mar Ephrem's references were in ComfyUI's `input/` folder; the others were staged there from their original outputs in `output/chars/` (matched by file size) with `upload_image` action "stage" under the `Ref_` names. Sterling's reference is the blurred edit, so the unblurred original `David_Sterling_00002_.png` was staged instead.
- With a batch sweep, every node that has an input of the swept name is overwritten: sweeping `image` also hit ImageScaleToTotalPixels (crash "'str' object has no attribute 'movedim'"), and sweeping `text` would hit the empty negative. So the scale node is dropped (the references are already ~1 MP) and the prompt comes from a PrimitiveStringMultiline node swept as `value`.
- "Moustache streaked with grey" turned Bektur's moustache fully grey; "still black with only two or three grey hairs" kept it black.
- Klein will not draw an ak-kalpak (it gives a white fur hat or a tall white cylinder); Mamytov's 1992 photo keeps the rounded white felt hat.
- Alimbekov's reference was approved (the round-p candidate); his 1992 photo was added in the second round.
