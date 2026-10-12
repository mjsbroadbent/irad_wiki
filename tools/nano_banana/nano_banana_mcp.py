#!/usr/bin/env python3
"""Nano Banana (Gemini image generation) as a local MCP server for Claude.

Runs on your own computer, launched by the Claude desktop app. It sends prompts
to Google's Gemini image API with YOUR API key (read from the GEMINI_API_KEY
environment variable, never written anywhere else), saves every image it gets
back into one folder, and shows Claude a preview so it can judge the result.

Tools it gives Claude:
  generate_image(prompt, file_name, reference_images=[], aspect_ratio="4:3")
  edit_image(source, instruction, file_name)
  list_images()

Setup (Windows, PowerShell):
  py -m pip install "mcp>=1.2" pillow
  then add this server to Claude's config (see README.md next to this file).

Settings (environment variables, set in the Claude config):
  GEMINI_API_KEY      required; from https://aistudio.google.com/apikey
  NANO_BANANA_OUT     folder for images (default: ./generated next to this script)
  NANO_BANANA_MODEL   default gemini-2.5-flash-image ("Nano Banana"); use a newer
                      Gemini image model name here if you have access to one
"""
import base64, io, json, os, ssl, sys, time, urllib.error, urllib.request
from pathlib import Path

try:                                     # MCP Python SDK 2.x
    from mcp.server.mcpserver import MCPServer as _Server, Image
except ImportError:                      # MCP Python SDK 1.x
    from mcp.server.fastmcp import FastMCP as _Server, Image

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
MODEL = os.environ.get("NANO_BANANA_MODEL", "gemini-2.5-flash-image").strip()
OUT = Path(os.environ.get("NANO_BANANA_OUT") or Path(__file__).with_name("generated")).expanduser()
OUT.mkdir(parents=True, exist_ok=True)
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
ASPECTS = {"1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"}
MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}


def _ssl_context():
    for make in (lambda: __import__("truststore").SSLContext(ssl.PROTOCOL_TLS_CLIENT),
                 lambda: ssl.create_default_context(cafile=__import__("certifi").where())):
        try:
            return make()
        except Exception:
            pass
    return ssl.create_default_context()


SSL = _ssl_context()
server = _Server("nano-banana")


def _resolve(path: str) -> Path:
    p = Path(path).expanduser()
    return p if p.is_absolute() else OUT / p


def _part_for_file(path: str) -> dict:
    p = _resolve(path)
    if not p.exists():
        raise FileNotFoundError(f"reference image not found: {p}")
    mime = MIME.get(p.suffix.lower())
    if not mime:
        raise ValueError(f"unsupported image type: {p.suffix}")
    return {"inline_data": {"mime_type": mime, "data": base64.b64encode(p.read_bytes()).decode()}}


def _call_gemini(parts: list, aspect_ratio: str | None) -> tuple[bytes, str, str]:
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set in the Claude config for this server.")
    config = {"responseModalities": ["IMAGE", "TEXT"]}
    if aspect_ratio:
        if aspect_ratio not in ASPECTS:
            raise ValueError(f"aspect_ratio must be one of {sorted(ASPECTS)}")
        config["imageConfig"] = {"aspectRatio": aspect_ratio}
    body = json.dumps({"contents": [{"role": "user", "parts": parts}], "generationConfig": config}).encode()
    req = urllib.request.Request(ENDPOINT.format(model=MODEL), data=body, method="POST", headers={
        "Content-Type": "application/json", "x-goog-api-key": API_KEY})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180, context=SSL) as r:
                data = json.loads(r.read().decode())
            break
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:600]
            if e.code in (429, 500, 503) and attempt < 3:
                time.sleep(8 * (attempt + 1))
                continue
            raise RuntimeError(f"Gemini API error {e.code}: {detail}")
    text, image, mime = [], None, "image/png"
    for cand in data.get("candidates", []):
        for part in (cand.get("content") or {}).get("parts", []):
            blob = part.get("inlineData") or part.get("inline_data")
            if blob and image is None:
                image, mime = base64.b64decode(blob["data"]), blob.get("mimeType") or blob.get("mime_type") or mime
            elif part.get("text"):
                text.append(part["text"])
    if image is None:
        reason = (data.get("candidates") or [{}])[0].get("finishReason") or data.get("promptFeedback")
        raise RuntimeError(f"No image returned ({reason}). Model said: {' '.join(text)[:400]}")
    return image, mime, " ".join(text)


def _save(image: bytes, mime: str, file_name: str) -> Path:
    stem = Path(file_name).stem or time.strftime("image_%Y%m%d_%H%M%S")
    ext = ".jpg" if "jpeg" in mime else ".png"
    path = OUT / f"{stem}{ext}"
    n = 2
    while path.exists():                       # never overwrite an earlier take
        path = OUT / f"{stem}_v{n}{ext}"
        n += 1
    path.write_bytes(image)
    return path


def _preview(image: bytes) -> "Image":
    """A small JPEG for Claude to look at (keeps the conversation light)."""
    try:
        from PIL import Image as PILImage
        im = PILImage.open(io.BytesIO(image)).convert("RGB")
        im.thumbnail((1024, 1024))
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=85)
        return Image(data=buf.getvalue(), format="jpeg")
    except ImportError:
        return Image(data=image, format="png")


@server.tool()
def generate_image(prompt: str, file_name: str, reference_images: list[str] | None = None,
                   aspect_ratio: str = "4:3") -> list:
    """Generate an image with Nano Banana and save it.

    prompt: the full text prompt.
    file_name: name to save under, e.g. "Church_of_St_Janyl.jpg" (a _v2, _v3 suffix is added
        instead of overwriting).
    reference_images: optional paths (absolute, or relative to the output folder) of images to
        keep consistent with, e.g. a character reference sheet.
    aspect_ratio: one of 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9.
    Returns the saved path, any text the model sent, and a preview of the image.
    """
    parts = [_part_for_file(p) for p in (reference_images or [])] + [{"text": prompt}]
    image, mime, text = _call_gemini(parts, aspect_ratio)
    path = _save(image, mime, file_name)
    return [f"Saved {path}" + (f"\nModel note: {text}" if text else ""), _preview(image)]


@server.tool()
def edit_image(source: str, instruction: str, file_name: str = "") -> list:
    """Edit an existing image (e.g. "repaint the flags plain crimson"); saves a new file.

    source: path of the image to edit (absolute, or relative to the output folder).
    instruction: what to change; say what must stay the same.
    file_name: name for the result (default: source name with a _v suffix).
    """
    image, mime, text = _call_gemini([_part_for_file(source), {"text": instruction}], None)
    path = _save(image, mime, file_name or Path(source).name)
    return [f"Saved {path}" + (f"\nModel note: {text}" if text else ""), _preview(image)]


@server.tool()
def list_images() -> str:
    """List the images in the output folder, newest first."""
    files = sorted((p for p in OUT.iterdir() if p.suffix.lower() in MIME), key=lambda p: p.stat().st_mtime, reverse=True)
    lines = [f"{p.name}\t{p.stat().st_size // 1024} KB\t{time.strftime('%Y-%m-%d %H:%M', time.localtime(p.stat().st_mtime))}" for p in files]
    return f"Folder: {OUT}\nModel: {MODEL}\n" + ("\n".join(lines) or "(no images yet)")


if __name__ == "__main__":
    server.run()
