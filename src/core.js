/* Irad Wiki core: splits the volume files into articles. No DOM access, so it
   also runs in Node for testing. Edit VOLUMES if file names or layout change. */

const VOLUMES = [
  {
    file: 'Irad_Wiki_Vol1_Core.md',
    label: 'Volume 1',
    // "### 2.1. Talas" — the featured article is plain "### Irad"
    article: /^### (?:(\d+\.\d+)\.\s+)?(.+?)\s*$/,
  },
  {
    file: 'Irad_Wiki_Vol2_C_Class.md',
    label: 'Volume 2',
    article: /^### (\d+\.\d+)\.\s+(.+?)\s*$/,
  },
  {
    file: 'Irad_Wiki_Vol3_Start_Stub.md',
    label: 'Volume 3',
    // "### 5.Category: Biographies & Leadership (36 articles)"
    category: /^### \d+\.Category:\s*(.+?)\s*\(\d+ articles?\)\s*$/,
    // "#### 1. Mar Timotheos Alimbekov"
    article: /^#### (\d+)\.\s+(.+?)\s*$/,
  },
];

// "## 3. B-Class Articles (43 Entries)" starts a quality class section.
const CLASS_HEADING = /^## \d+\.\s+(.+?)\s*$/;
const META_LINE = /^\*Quality(?: Assessment)?:\s*(.+?)\s*\|\s*Category:\s*(.+?)\s*\*\s*$/;
const STUB_TEMPLATE = /\{\{\s*([^}]+?)\s*\}\}/g;
const WIKILINK = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

const CLASSES = [
  { id: 'FA', name: 'Featured articles', short: 'Featured', blurb: 'The best articles in the wiki, reviewed for completeness, sourcing and prose.' },
  { id: 'GA', name: 'Good articles', short: 'Good', blurb: 'Well-written, broad and properly sourced articles that meet the good-article criteria.' },
  { id: 'B', name: 'B-Class articles', short: 'B-Class', blurb: 'Mostly complete articles on the principal people, places and institutions of Irad.' },
  { id: 'C', name: 'C-Class articles', short: 'C-Class', blurb: 'Substantial articles that still have gaps in coverage or sourcing.' },
  { id: 'Start', name: 'Start-Class articles', short: 'Start', blurb: 'Developing articles with a basic outline and some sources.' },
  { id: 'Stub', name: 'Stub articles', short: 'Stub', blurb: 'Short entries of a paragraph or two, mostly terms, places and minor figures.' },
];

function classFromHeading(text) {
  if (/featured/i.test(text)) return 'FA';
  if (/good/i.test(text)) return 'GA';
  if (/\bB-Class/i.test(text)) return 'B';
  if (/\bC-Class/i.test(text)) return 'C';
  if (/start/i.test(text)) return 'Start';
  if (/stub/i.test(text)) return 'Stub';
  return null;
}

/* Broad subject for a category name, used to group the many category names
   on the main page. Keyed on the first word of the category. */
const SUBJECTS = {
  Biographies: 'People', Biography: 'People', Historical: 'People',
  History: 'History',
  Culture: 'Culture & arts', Cultural: 'Culture & arts', Arts: 'Culture & arts', Language: 'Culture & arts',
  Media: 'Culture & arts', National: 'Culture & arts',
  Religion: 'Religion',
  Politics: 'Politics & law', Regions: 'Politics & law', Security: 'Politics & law', Military: 'Politics & law',
  Institutions: 'Politics & law', Public: 'Politics & law',
  Economy: 'Economy', Agriculture: 'Economy', Education: 'Economy',
  Infrastructure: 'Infrastructure', Transport: 'Infrastructure',
  Geography: 'Places', Cities: 'Places', Minor: 'Places', Nation: 'Places', Demographics: 'Places',
  Physical: 'Nature', Nature: 'Nature', Wildlife: 'Nature', Equines: 'Nature', Science: 'Nature',
};
function subjectOf(category) {
  const w = category.split(/[\s,&]+/)[0];
  return SUBJECTS[w] || 'Other';
}

function slugOf(title) { return title.replace(/\s+/g, '_'); }
function categorySlug(name) { return name.replace(/&/g, 'and').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, ''); }
function fold(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[’‘]/g, "'").toLowerCase();
}

function parseVolume(text, cfg, volIndex) {
  const lines = text.split(/\r?\n/);
  const articles = [];
  const pre = [];
  let cls = null, cat = null, cur = null, inFence = false;

  const close = () => {
    if (!cur) return;
    finishArticle(cur);
    articles.push(cur);
    cur = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence) {
      let m = line.match(CLASS_HEADING);
      if (m && classFromHeading(m[1])) { close(); cls = classFromHeading(m[1]); cat = null; continue; }
      if (cfg.category && (m = line.match(cfg.category))) { close(); cat = m[1]; continue; }
      if ((m = line.match(cfg.article))) {
        close();
        cur = { title: m[2], number: m[1] || '', cls, heading: cat, vol: volIndex, line: i + 1, lines: [] };
        continue;
      }
    }
    (cur ? cur.lines : pre).push(line);
  }
  close();
  return { articles, pre: pre.join('\n') };
}

function finishArticle(a) {
  const ls = a.lines;
  // quality / category line near the top
  for (let i = 0; i < Math.min(ls.length, 4); i++) {
    const m = ls[i].match(META_LINE);
    if (m) { a.category = m[2]; ls.splice(i, 1); break; }
  }
  if (!a.category) a.category = a.heading || 'Uncategorized';
  while (ls.length && /^\s*(---)?\s*$/.test(ls[ls.length - 1])) ls.pop();
  while (ls.length && /^\s*$/.test(ls[0])) ls.shift();
  a.src = ls.join('\n');
  delete a.lines;
  const stub = a.src.match(/\{\{\s*([^}]*?stub[^}]*?)\s*\}\}/i);
  a.stubType = stub ? stub[1] : null;
  a.slug = slugOf(a.title);
  a.links = new Set();
  for (const m of a.src.matchAll(WIKILINK)) a.links.add(m[1].trim());
}

/* Plain text of an article for search and summaries. */
function plainText(src) {
  return src
    .replace(/<sup>.*?<\/sup>/g, '')
    .replace(/<ol class="references">[\s\S]*?<\/ol>/g, '')
    .replace(WIKILINK, (_, t, l) => l || t)
    .replace(STUB_TEMPLATE, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/^\|.*\|$/gm, m => m.replace(/\|/g, ' ').replace(/-{3,}/g, ''))
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function lede(src, max = 170) {
  const para = src.split(/\n\s*\n/).find(p => p.trim() && !/^\s*(#|<|\{\{|\||```)/.test(p)) || '';
  let t = plainText(para);
  if (t.length > max) {
    const cut = t.lastIndexOf(' ', max);
    t = t.slice(0, cut > 60 ? cut : max).replace(/[,;:]$/, '') + '…';
  }
  return t;
}

/* Builds the whole wiki from the volume texts (same order as VOLUMES). */
function buildWiki(texts) {
  const wiki = { articles: [], bySlug: new Map(), byFold: new Map(), categories: new Map(), backlinks: new Map(), pre: [], warnings: [] };
  texts.forEach((text, vi) => {
    const { articles, pre } = parseVolume(text, VOLUMES[vi], vi);
    wiki.pre.push(pre);
    for (const a of articles) {
      if (wiki.bySlug.has(a.slug)) wiki.warnings.push(`Duplicate title "${a.title}" (${VOLUMES[vi].file}, line ${a.line}); the first copy is shown.`);
      else { wiki.bySlug.set(a.slug, a); wiki.byFold.set(fold(a.title), a); }
      wiki.articles.push(a);
      if (!wiki.categories.has(a.category)) wiki.categories.set(a.category, []);
      wiki.categories.get(a.category).push(a);
    }
  });
  for (const a of wiki.articles) {
    for (const t of a.links) {
      const target = resolve(wiki, t);
      if (!target || target === a) continue;
      if (!wiki.backlinks.has(target.slug)) wiki.backlinks.set(target.slug, new Set());
      wiki.backlinks.get(target.slug).add(a);
    }
  }
  return wiki;
}

function resolve(wiki, title) {
  return wiki.bySlug.get(slugOf(title.trim())) || wiki.byFold.get(fold(title.trim())) || null;
}

/* Turns the "Country Overview" code block into infobox rows. */
function parseInfobox(block) {
  const parts = block.split(/^=+\s*$/m).map(s => s.replace(/^\n+|\n+$/g, '')).filter(Boolean);
  if (parts.length < 2) return null;
  const head = parts[0].split('\n');
  const box = { name: head[0].trim(), subtitle: head.slice(1).join(' ').trim(), rows: [] };
  let last = null, lastItem = null;
  const join = (prev, next) => prev + ' ' + next;
  for (const raw of parts[1].split('\n')) {
    if (!raw.trim()) continue;
    if (/^\s*•/.test(raw) && last) {
      const t = raw.replace(/^\s*•\s*/, '');
      const m = t.match(/^([^:]{1,40}):\s*(.+)$/);
      lastItem = m ? { label: m[1], value: m[2] } : { label: '', value: t };
      last.items.push(lastItem);
    } else if (/^\s/.test(raw) && last) {
      const t = raw.trim();
      if (lastItem) lastItem.value = join(lastItem.value, t); else last.value = join(last.value, t);
    } else {
      for (const seg of raw.split(/\s+\|\s+/)) {
        const m = seg.match(/^([^:]{1,70}?):\s*(.*)$/);
        if (m) { last = { key: m[1].trim(), value: m[2].trim(), items: [] }; lastItem = null; box.rows.push(last); }
        else if (last) last.value = join(last.value, seg.trim());
      }
    }
  }
  for (const r of box.rows) r.value = r.value.replace(/\s*\(webflag\.svg\)/, '');
  return box;
}

if (typeof module !== 'undefined') module.exports = { VOLUMES, CLASSES, subjectOf, buildWiki, parseInfobox, plainText, lede, fold, slugOf, categorySlug, resolve, WIKILINK, STUB_TEMPLATE };
