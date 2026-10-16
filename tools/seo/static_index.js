#!/usr/bin/env node
/* Generates the crawlable fallback for index.html and the sitemap.
   Run by ./build.sh. Uses the same parser as the site (src/core.js), so the
   links it writes are exactly the ones the app understands.

   Output:
     src/static.html  — a plain-HTML outline of the wiki (description, portals,
                        categories, every article with a short lead for the
                        better ones). build.sh pastes it into index.html where
                        <!--STATIC--> sits. Readers without JavaScript see it;
                        readers with JavaScript never do, because the app
                        replaces it as soon as it has loaded.
     (sitemap.xml and the article pages under wiki/ come from pages.js.)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const core = require(path.join(root, 'src', 'core.js'));

const SITE = 'https://irad.wiki/';
const texts = core.VOLUMES.map(v => fs.readFileSync(path.join(root, v.file), 'utf8'));
const wiki = core.buildWiki(texts);

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const href = slug => core.pagePath(slug);
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
const sortKey = t => t.replace(/^the\s+/i, '');
const byTitle = (a, b) => collator.compare(sortKey(a.title), sortKey(b.title));

// Group categories into the same portals the app shows.
const subjects = new Map();
for (const [cat, list] of wiki.categories) {
  const s = core.subjectOf(cat);
  if (!subjects.has(s)) subjects.set(s, new Map());
  subjects.get(s).set(cat, list);
}
const subjectSize = s => [...subjects.get(s).values()].reduce((n, l) => n + l.length, 0);
const subjectOrder = [...subjects.keys()].sort((a, b) => subjectSize(b) - subjectSize(a));

const fa = wiki.articles.find(a => a.cls === 'FA');
const notable = wiki.articles.filter(a => ['FA', 'GA', 'B'].includes(a.cls)).sort(byTitle);
const sorted = [...wiki.articles].sort(byTitle);
const count = wiki.articles.length.toLocaleString('en');

const li = a => `<li><a href="${href(a.slug)}">${esc(a.title)}</a></li>`;
const liLede = a => `<li><a href="${href(a.slug)}">${esc(a.title)}</a> – ${esc(core.lede(a.src, 170))}</li>`;

let html = `<div class="static-index" id="staticIndex">
<h1>Irad Wiki</h1>
<p>Irad Wiki is the free encyclopedia of <a href="/wiki/Irad">Irad</a> (Iradistan), with ${count} articles on its history, regions, people, politics, economy, culture and language. It is a worldbuilding project: Irad is a constructed Central Asian nation, written up in the style and detail of a real one.</p>
<p>This page is the outline for readers without JavaScript. The full site, with search and formatted articles, needs JavaScript turned on.</p>
${fa ? `<h2>Featured article</h2>
<p><a href="${href(fa.slug)}">${esc(fa.title)}</a> – ${esc(core.lede(fa.src, 300))}</p>` : ''}
<h2>Principal articles</h2>
<ul>
${notable.map(liLede).join('\n')}
</ul>
<h2>Portals</h2>
`;
for (const s of subjectOrder) {
  const cats = [...subjects.get(s)].sort((a, b) => b[1].length - a[1].length);
  html += `<h3><a href="/#Subject.${core.categorySlug(s)}">${esc(s)}</a> (${subjectSize(s)})</h3>\n<ul>\n`;
  for (const [cat, list] of cats) html += `<li><a href="/#Category.${core.categorySlug(cat)}">${esc(cat)}</a> (${list.length})</li>\n`;
  html += '</ul>\n';
}
html += `<h2>Articles by quality</h2>
<ul>
${core.CLASSES.map(c => `<li><a href="/#Class.${c.id}">${esc(c.name)}</a> (${wiki.articles.filter(a => a.cls === c.id).length}) – ${esc(c.blurb)}</li>`).join('\n')}
</ul>
<h2>All articles, A to Z</h2>
<ul class="static-all">
${sorted.map(li).join('\n')}
</ul>
<p><a href="/#Special.All">All pages</a> · <a href="/#Special.Random">Random article</a></p>
</div>
`;

fs.writeFileSync(path.join(root, 'src', 'static.html'), html);

// sitemap.xml is written by pages.js, which knows every article address.

// Short description of the site for the <meta> tags, written next to the
// fragment so page.html can stay hand-editable.
const description = fa
  ? `The free encyclopedia of Irad (Iradistan), a constructed Central Asian nation: ${count} articles on its history, regions, people, politics and culture.`
  : `The free encyclopedia of Irad (Iradistan): ${count} articles.`;
fs.writeFileSync(path.join(root, 'src', 'description.txt'), description + '\n');

console.log(`static.html: ${wiki.articles.length} articles, ${wiki.categories.size} categories, ${(html.length / 1024).toFixed(0)} KB`);
