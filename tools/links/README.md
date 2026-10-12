# Link and category tools

Run from the repository root after the volumes change.

| Command | What it does |
|---|---|
| `node tools/links/audit.js . > audit.json` | Builds the wiki as the site does and reports categories with counts, red links (internal links to missing articles), orphans (articles nothing links to) and self-links |
| `python3 tools/links/linker.py int .` | Links the first mention of each existing article title in every other article. Skips headings, references, tables with piped links, Iradi-language italics, longer proper names, and river or valley uses of "Talas" |
| `python3 tools/links/linker.py wp .` | Links the first mention of real-world names to English Wikipedia (`[[wp:Title|text]]`) using `wp_map.json` (surface text → Wikipedia title) |

Both linker passes edit the volume files in place and skip anything already linked in an article, so they are safe to rerun. Review the diff before committing, and run the internal pass before the Wikipedia pass. The volumes are edited in the irad-persona skill repository first; run the linker there, then copy the volumes here and run `./build.sh`.

To link a new real-world name, add it to `wp_map.json` with its exact Wikipedia title and check that the title exists.
