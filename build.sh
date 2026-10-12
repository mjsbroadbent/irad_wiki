#!/bin/sh
# Rebuilds index.html from src/ (page.html + core.js + app.js) and the volumes.
# Run it after editing the files in src/ OR after updating the volume files:
# the plain-HTML outline pasted into index.html (for crawlers and readers
# without JavaScript) and sitemap.xml are generated from the volumes.
set -e
cd "$(dirname "$0")"
node tools/seo/static_index.js
python3 - <<'PY'
import html, json
body = open('src/page.html').read().replace('/*CORE*/', open('src/core.js').read()).replace('/*APP*/', open('src/app.js').read())
body = body.replace('<!--STATIC-->', open('src/static.html').read().rstrip('\n'))
desc = open('src/description.txt').read().strip()
body = body.replace('"description": "<!--DESCRIPTION-->"', '"description": ' + json.dumps(desc))
body = body.replace('<!--DESCRIPTION-->', html.escape(desc, quote=True))
head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
open('index.html', 'w').write(head + body.replace('<header class="vh">', '</head>\n<body>\n<header class="vh">', 1) + '\n</body>\n</html>\n')
PY
echo "index.html rebuilt"
