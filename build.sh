#!/bin/sh
# Rebuilds index.html from src/ (page.html + core.js + app.js).
# Only needed if you edit the files in src/; you can also edit index.html directly.
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
body = open('src/page.html').read().replace('/*CORE*/', open('src/core.js').read()).replace('/*APP*/', open('src/app.js').read())
head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
open('index.html', 'w').write(head + body.replace('<header class="mast">', '</head>\n<body>\n<header class="mast">', 1) + '\n</body>\n</html>\n')
PY
echo "index.html rebuilt"
