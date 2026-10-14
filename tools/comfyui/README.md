# Local image generation (ComfyUI)

Generated photos since October 2026 are made on the owner's PC (RTX 3070, 8 GB) with ComfyUI and FLUX.2 [klein] 4B base, driven by Claude through the comfyui-mcp server.

Model files (ComfyUI `models/`): `diffusion_models/flux-2-klein-base-4b.safetensors`, `text_encoders/qwen_3_4b.safetensors` (CLIPLoader type `flux2`), `vae/flux2-vae.safetensors`.

Graph: UNETLoader → CLIPTextEncode (positive, negative) → EmptyFlux2LatentImage 1152×864 → KSampler (euler, simple, 26 steps, cfg 4) → VAEDecode → SaveImage. About 1 minute an image.

Prompts start from `tools/gemini_handoff/Gemini_prompts_no_characters.txt`; `prompts_used.json` has the exact prompt, negative prompt and seed for every image placed, so any of them can be re-rendered or varied. Output is saved as JPG, quality 85, at the native 1152×864 (not upscaled).

What this model gets wrong, so far: small horses come out as Shetland ponies with Western saddles; a kariz comes out as an open trench or as manholes; crowds of riders can get European faces unless the prompt asks for Central Asian ones; wide shots can get a fake tilt-shift blur unless the prompt asks for deep focus.
