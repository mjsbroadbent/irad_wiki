# Local image generation (ComfyUI)

The generated photos on the wiki are made on the owner's PC (RTX 3070, 8 GB, ComfyUI Desktop) with **FLUX.1 Krea Dev**, driven by Claude through the comfyui-mcp server. All 15 earlier generated photos (the Gemini ones and a first local batch made with FLUX.2 Klein 4B) were redone this way on 2026-10-14.

## Models (ComfyUI `models/`)

- `unet/flux1-krea-dev-Q4_K_S.gguf` (QuantStack/FLUX.1-Krea-dev-GGUF), loaded with `UnetLoaderGGUF` from the ComfyUI-GGUF node pack
- `text_encoders/clip_l.safetensors` and `text_encoders/t5xxl_fp8_e4m3fn.safetensors` (DualCLIPLoader, type `flux`)
- `vae/ae.safetensors`

## Graph

UnetLoaderGGUF + DualCLIPLoader + VAELoader → CLIPTextEncode → FluxGuidance 3.5 (positive) and ConditioningZeroOut (negative) → EmptySD3LatentImage 1152×864, batch of 2 → KSampler (euler, simple, 28 steps, cfg 1) → VAEDecode → SaveImage. About 1 minute an image. Krea ignores negative prompts at cfg 1, so everything goes in the positive prompt.

`prompts_used.json` has the exact prompt, seed and which image of the batch was kept, for every photo on the wiki.

## Post-processing

`camera_look.py in.png out.jpg --strength 0.5` adds lens softness, slight chromatic aberration, vignetting, a gentle desaturation, sensor noise and JPEG compression (quality 85). Used on the contemporary photos; the 1916 and 1937 photos are saved straight to JPG because their prompts already ask for the period look.

## Prompting that works

- Describe an ordinary photograph, not a beautiful one: "snapshot", "overcast flat light", "slightly crooked framing", everyday clutter (wires, parked cars, gas pipes). Stock-photo words ("golden hour", "shallow depth of field") make it look generated.
- Say what period camera it was: "black and white Soviet press photograph from autumn 1937, 35mm film, heavy grain"; "three-colour survey process" for 1916.
- Name the region ("in Kyrgyzstan", "Central Asian") or it drifts to Italy or Iran; "cypress" trees and Renaissance portals are the tell.
- "compact camera" gives a heavy toy-camera vignette; "digital photograph, even exposure" avoids it.
- Ask for one dome explicitly, or churches sprout extra domes. For St. Janyl, "like the Timurid and Kokand brick monuments of Turkestan but a Christian church" gave the right look; without it the church came out Italian baroque.
- Anything lettered (rail cars, signs) gets readable words like "KOREA": ask for "plain unmarked" objects.
- Animals in sport scenes can come out alive ("the limp headless body of a dead goat") and sports scenes can drift to black and white ("colour sports agency photograph").
