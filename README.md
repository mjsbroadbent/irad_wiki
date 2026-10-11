# Irad Wiki site

A static, client-side wiki. `index.html` downloads the three volume files when it opens, splits them into articles in the browser, and renders whichever article you're on. No build step and no server code.

## What's in the folder

| File | Purpose |
|---|---|
| `index.html` | The whole site: layout, styles and script |
| `Irad_Wiki_Vol1_Core.md`, `Irad_Wiki_Vol2_C_Class.md`, `Irad_Wiki_Vol3_Start_Stub.md` | The article volumes, read as-is |
| `webflag.svg` | Flag in the header and the Irad infobox |
| `src/`, `build.sh` | The page split into parts (`page.html`, `core.js` parser, `app.js` interface). Run `./build.sh` after editing them to regenerate `index.html` |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Updating articles

Replace the three `.md` files with the current versions from the irad-persona skill and reload. Nothing else needs to change.

The site relies on these conventions, which the volumes already follow:

- A class section starts with a numbered `##` heading, e.g. `## 3. B-Class Articles (43 Entries)`.
- In Volumes 1 and 2, an article starts with `### 4.1. Title` (the featured article can be plain `### Irad`).
- In Volume 3, categories are `### 5.Category: Name (n articles)` and articles are `#### 1. Title`.
- Sections inside an article use `##`, subsections `####`.
- The line `*Quality Assessment: … | Category: …*` right after the title sets the article's category. Stubs take it from their Volume 3 category heading.
- Links are `[[Title]]` or `[[Title|shown text]]`. A link to a title that doesn't exist shows in red.
- `{{Hatnote|…}}` and `{{Irad-…-stub}}` templates are rendered as hatnotes and stub notices.
- The code block under "Country Overview" in Volume 1 becomes the infobox on the Irad article.

If you add a fourth volume or rename a file, edit the `VOLUMES` list near the top of the first `<script>` in `index.html`.

If two articles share a title, the first one wins and a warning appears in the browser console.

## Running it

Browsers won't let a page opened straight from disk read other files, so serve the folder over HTTP.

- On your computer: run `python3 -m http.server` in this folder, then open http://localhost:8000
- On GitHub Pages: in the repository's Settings → Pages, set the source to "Deploy from a branch", branch `main`, folder `/ (root)`. The site appears at `https://<username>.github.io/irad_wiki/`.
- Anywhere else: upload the folder to any static host (Netlify, Cloudflare Pages, or plain web hosting).

The page loads markdown-it from cdnjs and the Alegreya fonts from Google Fonts, so it needs an internet connection the first time.

## Appearance

The layout follows Wikipedia's desktop skin. The Dark/Light button in the top right switches themes; light is the default, and each reader's choice is remembered in their browser.

## Addresses

Each page has its own address, so links and the back button work:

- `#Talas` is an article (spaces become underscores), and `#Talas~source` shows its Markdown source
- `#Category.Arts_and_Cinema` is a category page
- `#Subject.History` is a portal grouping related categories
- `#Class.GA` lists a quality class (FA, GA, B, C, Start, Stub)
- `#Special.All` is the A–Z index and `#Special.Random` picks a random article
