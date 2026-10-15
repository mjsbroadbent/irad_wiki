# Local image generation (ComfyUI)

The generated photos on the wiki are made on the owner's PC (RTX 3070, 8 GB, ComfyUI Desktop) with **FLUX.1 Krea Dev**, driven by Claude through the comfyui-mcp server. All 15 earlier generated photos (the Gemini ones and a first local batch made with FLUX.2 Klein 4B) were redone this way on 2026-10-14.

## Models (ComfyUI `models/`)

- `unet/flux1-krea-dev-Q4_K_S.gguf` (QuantStack/FLUX.1-Krea-dev-GGUF), loaded with `UnetLoaderGGUF` from the ComfyUI-GGUF node pack
- `text_encoders/clip_l.safetensors` and `text_encoders/t5xxl_fp8_e4m3fn.safetensors` (DualCLIPLoader, type `flux`)
- `vae/ae.safetensors`

## Graph

UnetLoaderGGUF + DualCLIPLoader + VAELoader → CLIPTextEncode → FluxGuidance 3.5 (positive) and ConditioningZeroOut (negative) → EmptySD3LatentImage 1152×864, batch of 2 → KSampler (euler, simple, 28 steps, cfg 1) → VAEDecode → SaveImage. About 1 minute an image. Krea ignores negative prompts at cfg 1, so everything goes in the positive prompt.

`prompts_used.json` has the exact prompt, seed and which image of the batch was kept, for every photo on the wiki.

## LoRA and composition (since 2026-10-14)

Contemporary photos use the **Amateur Photography** LoRA (CivitAI 652699, v3, `loras/amateurphoto-v3.5-000052.safetensors`) at 0.8 through `LoraLoaderModelOnly`, with the trigger "Amateur photography, on flickr in 2007." at the start of the prompt. Also installed for later: Boreal (`boreal-v2.safetensors`, trigger "photo"; very real but ignores architectural detail), Flux Krea Realism (`Flux_Krea_Real.safetensors`, trigger "in the style of R34L"; faithful, foggy film look, maybe for the 1990s) and Old Amateur 80s (`1980s.safetensors`, trigger "1980s Photo"). For 1916 the **Prokudin-Gorskii** LoRA (CivitAI 824574, `loras/lora.safetensors`, trigger "PROKUDINGORSKII", 0.9) is used: trained on his Turkestan-era colour plates; "Vintage Color Autochrome" (`vintageautocrhome-000006.safetensors`, trigger "a vintage color autochrome of") is installed as an alternative. Also installed for 1992–2006 scenes: `model.safetensors` (1990s Analog HD camcorder look, trigger "analoghd") and `1990 style v1.safetensors`. Ask for groups to be "scattered irregularly, not in a line" or crowds come out as neat processions.

People's looks follow the brief: city people and the Toktarovs and clergy Iranic (Uzbek/Tajik-like), rural people Turkic/East Asian. For character portraits, avoid the four-view reference sheet (it makes different men in each panel) and church words like "bishop"/"veil" (they give Greek Orthodox monks with crucifixes): describe the clothes literally and ask for "a plain flat cross, no figure". Scars get drawn as paint smears; add them afterwards.

Avoiding symmetrical, centred pictures:
- Render wide (1536×864) and crop a 1152×864 frame off-centre; `prompts_used.json` records `crop_x`.
- Say where the photographer stands ("from the side of the stairs, at an oblique angle", "from the window of a car") and where the subject sits in the frame ("in the right part of the frame").
- Put something close to the camera at one edge: a lamppost, a fence post, a spectator's shoulder, a car mirror.
- Angled views of St. Janyl's made the model add bell towers and extra domes; "a massive, plain, cube-shaped building ... one single dome, the only dome on the building" fixed it. "White felt kalpak hats" avoids sailor caps.
- The LoRA reproduces real lettering and logos (car badges, number plates, price cards, tricolour flags): check every image and blur or repaint them.

## Post-processing

`camera_look.py in.png out.jpg --strength 0.35` (0.5 before the LoRA) adds lens softness, slight chromatic aberration, vignetting, a gentle desaturation, sensor noise and JPEG compression (quality 85). Used on the contemporary photos; the 1916 and 1937 photos are saved straight to JPG because their prompts already ask for the period look.

## Prompting that works

- Describe an ordinary photograph, not a beautiful one: "snapshot", "overcast flat light", "slightly crooked framing", everyday clutter (wires, parked cars, gas pipes). Stock-photo words ("golden hour", "shallow depth of field") make it look generated.
- Say what period camera it was: "black and white Soviet press photograph from autumn 1937, 35mm film, heavy grain"; "three-colour survey process" for 1916.
- Name the region ("in Kyrgyzstan", "Central Asian") or it drifts to Italy or Iran; "cypress" trees and Renaissance portals are the tell.
- "compact camera" gives a heavy toy-camera vignette; "digital photograph, even exposure" avoids it.
- Ask for one dome explicitly, or churches sprout extra domes. For St. Janyl, "like the Timurid and Kokand brick monuments of Turkestan but a Christian church" gave the right look; without it the church came out Italian baroque.
- Anything lettered (rail cars, signs) gets readable words like "KOREA": ask for "plain unmarked" objects.
- Animals in sport scenes can come out alive ("the limp headless body of a dead goat") and sports scenes can drift to black and white ("colour sports agency photograph").
- Negatives are ignored with guidance-only Flux ("no saddle" still gives a saddle; "no flags" still sometimes gives flags). Describe what is there instead, or pick the cleaner of the two batch images and fix it afterwards.
- "Crimson flags" in a crowd pulls in Soviet hammer-and-sickle banners. For demonstrations, ask for "plain white cardboard placards seen from behind" and no flags.
- Hats (lore): the white felt ak-kalpak is for elders and ceremonies only; ordinary men wear baseball caps, berets or knitted caps. Cowboy hats caught on in the 1990s and are still seen now and then. Add "a man in a cowboy hat" to a few 1990s crowds and the odd contemporary one; it also helps break up the cleric look that crowds otherwise drift into.
- Kyrgyz herders need "broad flat East Asian face" or similar, or they come out Middle Eastern. "Wind-reddened cheeks" renders as painted red patches (tone down with `process.py --desat`).
- Clergy: anything asking for a priest in close-up gives a Greek Orthodox monk (klobuk with veil, pectoral cross). Keep clergy small and distant, or seen from behind; the church interior worked with "carved white gypsum panels", "raised wooden platform in the middle of the nave", "carved walnut screen with a curtain".
- Period photos: the 1990s Analog HD LoRA (`model.safetensors` @ 0.8, prompt starting "analoghd, 1992 press photograph on colour negative film") gives convincing early-90s press film. Plain Krea with "grainy black and white archival photograph from 1956 ... scratches, faded print" works for Soviet-era scenes; convert to greyscale afterwards because it leaves a slight tint.

## Finishing a render

`process.py` does the crop, the clean-up and `camera_look.py` in one step; see its docstring. Typical use: `python3 tools/comfyui/process.py render.png images/Name.jpg --crop 192 --blur 448,618,508,640 --flag 805,420,850,505 --seed 11`. The edits made to each photo are recorded under `edits` in `prompts_used.json`.

## Sharing photos with IradOne and the Talas Herald

`share_news.py` copies chosen wiki photos into the `photos/` folders of the `iradone` and `talas_herald` repos (cloned next to this one) under news-style names, adds `"kind": "ai"` entries to their `photos/credits.json`, and lists them in the subject pools of their `newsroom/images.json`, which the daily newsroom runs pick story photos from. Edit the `PICK` table (wiki file → site name, IradOne subjects, Herald subjects), run it, then rebuild each site (`python3 newsroom/build.py` in iradone, `python3 newsroom/herald.py build` in talas_herald). IradOne, as the state broadcaster, is not given the protest photos. Historical (1916–1992) photos are not shared because news stories use contemporary pictures.

## Album cover LoRAs (since 2026-10-15)

Downloaded through the comfyui-mcp download tool (the CivitAI key is set as `CIVITAI_API_TOKEN` in the `env` block of the comfyui entry in Claude's `claude_desktop_config.json`, never in this repo):
- `punkflyers_fluxdev_punkf1y3r.safetensors` (CivitAI 797300, trigger `punkf1y3r`): photocopied punk gig flyers.
- `punk-zine-flux.safetensors` (CivitAI 2364817): photocopied zine look. Used at 0.9 for the *Jolchu* cassette cover, which came out with clean hand lettering.
- `Bad_Album_Cover_Collective.safetensors` (CivitAI 723560): cheesy real-world album covers; renders "CD in a jewel case" framing.
- `Album_Art_Actualizer_FLUX-000018.safetensors` (CivitAI 824192): a photo of a physical record sleeve, trigger sentence `Photograph of a vinyl record cover titled "(TEXT)" on a wooden table, featuring (THEME/STYLE) artwork. The cover depicts (SUBJECT/LOCATION)`.

Covers render at 1024×1024 and Krea spells short titles correctly most of the time; ask for the exact title in quotes and check the spelling. Plain Krea gave the *Swift Hooves* CD cover. Crop off any case or print border before saving to `images/`, and register the file with `"placement": "infobox"` and the `image =` line of the article's `{{Infobox album}}`.

## 2000s flash snapshots

For club and party photos from the 2000s use the **2000s Flash Portrait** LoRA (CivitAI 1711719, v2.0, `loras/2000s_Flash_Portrait.safetensors`) at 0.65–0.85, starting the prompt with its trigger "harsh flash photography, Direct flashlight on the subjects face creates a stark contrast against the dark underexposed background." It tends to add a garbled date stamp in the corner; inpaint it out and draw a clean one (the first tüntolk photo, 0.65; the final one at 0.8 had none). Ask for "no smoke, no fog, no stage lights" or it adds a haze machine and a purple spotlight.
