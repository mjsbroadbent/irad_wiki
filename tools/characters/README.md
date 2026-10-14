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
