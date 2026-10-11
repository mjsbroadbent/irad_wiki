/* Irad Wiki app: loading, routing and rendering. Depends on core.js and markdown-it. */
(function () {
  'use strict';
  const BASE = './';                 // folder that holds the volume files and webflag.svg
  const FLAG = BASE + 'webflag.svg';
  const $ = s => document.querySelector(s);
  const main = $('#main');
  const rail = $('#rail');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const href = slug => '#' + encodeURIComponent(slug).replace(/%2C/g, ',').replace(/%3A/g, ':');
  const classOf = id => CLASSES.find(c => c.id === id);
  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  const byTitle = (a, b) => collator.compare(a.title.replace(/^the\s+/i, ''), b.title.replace(/^the\s+/i, ''));

  let wiki = null, md = null, infobox = null, query = '', searchIndex = null;
  const ledeCache = new Map();
  const ledeOf = a => { if (!ledeCache.has(a)) ledeCache.set(a, lede(a.src)); return ledeCache.get(a); };

  /* ---------- loading ---------- */
  async function load() {
    if (!window.markdownit) return fail('The Markdown library did not load. Check your internet connection, then reload the page.');
    md = window.markdownit({ html: true, linkify: false, typographer: false });
    let done = 0;
    const bar = $('#loadBar'), msg = $('#loadMsg');
    try {
      const texts = await Promise.all(VOLUMES.map(async v => {
        const r = await fetch(BASE + v.file);
        if (!r.ok) throw new Error(`${v.file} returned ${r.status} ${r.statusText}`);
        const t = await r.text();
        done++;
        bar.style.width = (done / VOLUMES.length * 100) + '%';
        msg.textContent = `Loaded ${done} of ${VOLUMES.length} volumes`;
        return t;
      }));
      wiki = buildWiki(texts);
    } catch (e) {
      const local = location.protocol === 'file:';
      return fail(local
        ? 'Browsers block a page opened straight from disk from reading the volume files. Serve the folder over HTTP instead, for example with <code>python3 -m http.server</code> in this folder, then open <code>http://localhost:8000</code>.'
        : `Couldn't read the article volumes (${esc(e.message)}). Make sure the three <code>Irad_Wiki_Vol…md</code> files sit in the same folder as this page.`);
    }
    if (wiki.warnings.length) console.warn('Irad Wiki:\n' + wiki.warnings.join('\n'));
    const block = (wiki.pre[0] || '').match(/```\s*\n([\s\S]*?)```/);
    infobox = block ? parseInfobox(block[1]) : null;
    wiki.sorted = [...wiki.articles].sort(byTitle);
    wiki.subjects = new Map();
    for (const [cat, list] of wiki.categories) {
      const s = subjectOf(cat);
      if (!wiki.subjects.has(s)) wiki.subjects.set(s, new Map());
      wiki.subjects.get(s).set(cat, list);
    }
    wiki.catBySlug = new Map([...wiki.categories.keys()].map(c => [categorySlug(c), c]));
    wiki.subjBySlug = new Map([...wiki.subjects.keys()].map(s => [categorySlug(s), s]));
    renderRail();
    route();
  }

  function fail(html) {
    main.innerHTML = `<div class="status err"><img src="${FLAG}" alt=""><h1>The wiki couldn't load</h1><p>${html}</p></div>`;
  }

  /* ---------- routing ---------- */
  let byClick = false;
  const scrolls = new Map();
  let current = null;
  addEventListener('scroll', () => { if (current !== null) scrolls.set(current, scrollY); }, { passive: true });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (a) byClick = true;
  });
  addEventListener('hashchange', route);

  function route() {
    if (!wiki) return;
    let key = '';
    try { key = decodeURIComponent(location.hash.slice(1)); } catch { key = location.hash.slice(1); }
    const fresh = byClick; byClick = false;
    current = key;
    closeSuggest();
    rail.classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');

    if (key === 'Special.Random') {
      const a = wiki.articles[Math.floor(Math.random() * wiki.articles.length)];
      location.replace(href(a.slug));
      return;
    }
    let title;
    if (!key) title = renderHome();
    else if (key === 'Special.All') title = renderIndex();
    else if (key === 'Special.Search') title = renderSearch();
    else if (key.startsWith('Class.') && classOf(key.slice(6))) title = renderClass(key.slice(6));
    else if (key.startsWith('Category.') && wiki.catBySlug.has(key.slice(9))) title = renderCategory(wiki.catBySlug.get(key.slice(9)));
    else if (key.startsWith('Subject.') && wiki.subjBySlug.has(key.slice(8))) title = renderSubject(wiki.subjBySlug.get(key.slice(8)));
    else {
      const a = wiki.bySlug.get(key) || resolve(wiki, key.replace(/_/g, ' '));
      title = a ? renderArticle(a) : renderMissing(key);
    }
    document.title = title ? `${title} – Irad Wiki` : 'Irad Wiki';
    markRail(key);
    const y = !fresh && scrolls.has(key) ? scrolls.get(key) : 0;
    requestAnimationFrame(() => scrollTo(0, y));
  }

  /* ---------- rail ---------- */
  function renderRail() {
    const count = id => wiki.articles.filter(a => a.cls === id).length;
    const subj = [...wiki.subjects].map(([s, cats]) => [s, [...cats.values()].reduce((n, l) => n + l.length, 0)]).sort((a, b) => b[1] - a[1]);
    rail.innerHTML = `
      <h2>Navigation</h2>
      <ul>
        <li><a href="#" data-k="">Main page</a></li>
        <li><a href="#Special.All" data-k="Special.All">All articles <span class="n">${wiki.articles.length}</span></a></li>
        <li><a href="#Special.Random" data-k="Special.Random">Random article</a></li>
      </ul>
      <h2>By quality</h2>
      <ul>${CLASSES.map(c => `<li><a href="#Class.${c.id}" data-k="Class.${c.id}">${c.short} <span class="n">${count(c.id)}</span></a></li>`).join('')}</ul>
      <h2>By subject</h2>
      <ul>${subj.map(([s, n]) => `<li><a href="#Subject.${categorySlug(s)}" data-k="Subject.${categorySlug(s)}">${esc(s)} <span class="n">${n}</span></a></li>`).join('')}</ul>`;
  }
  function markRail(key) {
    rail.querySelectorAll('a').forEach(a => a.classList.toggle('here', a.dataset.k === key));
  }
  $('#menuBtn').addEventListener('click', () => {
    const open = rail.classList.toggle('open');
    $('#menuBtn').setAttribute('aria-expanded', String(open));
  });

  /* ---------- markdown ---------- */
  const STUB_WORDS = {
    geo: 'the geography of Irad', culture: 'Iradi culture', bio: 'an Iradi person', org: 'an Iradi organization',
    settlement: 'a settlement in Irad', plant: 'a plant of Irad', fauna: 'the animals of Irad', mountain: 'a mountain in Irad',
    craft: 'an Iradi craft', lake: 'a lake in Irad', river: 'a river in Irad', history: 'the history of Irad',
    horse: 'Iradi horses', sport: 'sport in Irad', glacier: 'a glacier in Irad',
  };
  const STUB_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>';

  function toHtml(src) {
    // links first, so templates such as {{Hatnote|… see [[Talas River]]}} keep working links
    const pre = src
      .replace(WIKILINK, (_, t, label) => {
        const target = resolve(wiki, t);
        const text = label || t;
        return target
          ? `<a class="wl" href="${href(target.slug)}" title="${esc(target.title)}">${esc(text)}</a>`
          : `<a class="red" href="${href(slugOf(t.trim()))}" title="${esc(t)} (page does not exist)">${esc(text)}</a>`;
      })
      .replace(STUB_TEMPLATE, (_, body) => {
        const [name, ...args] = body.split('|');
        if (/^hatnote$/i.test(name.trim())) return `<div class="hatnote">${args.join('|')}</div>`;
        const m = name.match(/^Irad-(\w+)-stub$/i);
        if (m || /^Irad-stub$/i.test(name)) {
          const about = m ? (STUB_WORDS[m[1].toLowerCase()] || m[1].toLowerCase() + ' in Irad') : 'Irad';
          return `<div class="stub-note">${STUB_ICON}<span>This article about ${about} is a stub. You can help Irad Wiki by expanding it.</span></div>`;
        }
        return `<div class="stub-note">${esc(name)}${args.length ? ': ' + args.join(' | ') : ''}</div>`;
      });
    return md.render(pre);
  }

  /* Wraps tables, numbers headings, makes citation markers clickable. */
  function enhance(root) {
    root.querySelectorAll('table').forEach(t => {
      if (t.parentElement.classList.contains('tbl')) return;
      const w = document.createElement('div'); w.className = 'tbl'; t.replaceWith(w); w.appendChild(t);
    });
    root.querySelectorAll('sup').forEach(s => {
      const m = s.textContent.trim().match(/^\[(\d+)\]$/);
      if (!m) return;
      s.classList.add('cite'); s.tabIndex = 0; s.setAttribute('role', 'link'); s.dataset.n = m[1];
      s.setAttribute('aria-label', `Reference ${m[1]}`);
    });
  }
  main.addEventListener('click', e => { const s = e.target.closest('sup.cite'); if (s) jumpCite(s); });
  main.addEventListener('keydown', e => { const s = e.target.closest('sup.cite'); if (s && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); jumpCite(s); } });
  function jumpCite(s) {
    const li = s.closest('.prose').querySelector(`[id="cite_note-${s.dataset.n}"]`);
    if (!li) return;
    li.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash');
    setTimeout(() => li.classList.remove('flash'), 1800);
  }

  /* ---------- pages ---------- */
  function chip(a) {
    const c = classOf(a.cls);
    return `<a class="chip ${a.cls}" href="#Class.${a.cls}">${a.cls === 'FA' ? '★ ' : ''}${esc(c ? c.short : a.cls)}</a>`;
  }

  function renderArticle(a) {
    const body = document.createElement('div');
    body.className = 'prose';
    body.innerHTML = toHtml(a.src);
    enhance(body);

    // table of contents for longer articles
    const hs = [...body.querySelectorAll('h2')];
    hs.forEach((h, i) => { h.id = 's' + (i + 1); });
    if (hs.length >= 4) {
      const toc = document.createElement('div');
      toc.className = 'toc';
      toc.innerHTML = `<b>Contents</b><ol>${hs.map((h, i) => `<li><button type="button" data-to="s${i + 1}">${esc(h.textContent)}</button></li>`).join('')}</ol>`;
      const first = body.querySelector('h2');
      first.before(toc);
    }
    if (a.slug === 'Irad' && infobox) { body.prepend(renderInfobox(infobox)); body.classList.add('has-ib'); }

    const back = [...(wiki.backlinks.get(a.slug) || [])].sort(byTitle);
    const vol = VOLUMES[a.vol];
    main.innerHTML = `
      <article>
        <div class="crumbs">${chip(a)}<a href="#Category.${categorySlug(a.category)}">${esc(a.category)}</a></div>
        <h1 class="title">${esc(a.title)}</h1>
        <p class="from">From Irad Wiki, the free encyclopedia of Iradistan</p>
        <div id="body"></div>
        ${back.length ? `<details class="backlinks"><summary>Linked from ${back.length} article${back.length > 1 ? 's' : ''}</summary><ul>${back.map(b => `<li><a href="${href(b.slug)}">${esc(b.title)}</a></li>`).join('')}</ul></details>` : ''}
        <p class="source">Source: <code>${esc(vol.file)}</code>${a.number ? `, §${esc(a.number)}` : ''}, line ${a.line}</p>
      </article>`;
    $('#body').replaceWith(body);
    body.addEventListener('click', e => {
      const b = e.target.closest('.toc button');
      if (b) document.getElementById(b.dataset.to)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    return a.title;
  }

  function linkNames(text) {
    // Links values in the infobox that are exactly an article title, e.g. "Talas".
    return esc(text).replace(/^([^(;,]+?)(\s*\(|$)/, (m, name, rest) => {
      const t = resolve(wiki, name.trim());
      return t ? `<a href="${href(t.slug)}">${esc(name)}</a>${rest}` : m;
    });
  }

  function renderInfobox(box) {
    const el = document.createElement('aside');
    el.className = 'infobox';
    const flag = box.rows.find(r => r.key === 'Flag');
    const rows = box.rows.filter(r => r !== flag);
    el.innerHTML = `
      <div class="ib-head"><b>${esc(box.name)}</b>${box.subtitle ? `<span>${esc(box.subtitle)}</span>` : ''}</div>
      <figure><img src="${FLAG}" alt="Flag of Irad">${flag ? `<figcaption>${esc(flag.value)}</figcaption>` : ''}</figure>
      <dl>${rows.map(r => `<dt>${esc(r.key)}</dt><dd>${r.value ? linkNames(r.value) : ''}${r.items.length ? `<ul>${r.items.map(i => `<li>${i.label ? `<i>${esc(i.label)}:</i> ` : ''}${linkNames(i.value)}</li>`).join('')}</ul>` : ''}</dd>`).join('')}</dl>`;
    return el;
  }

  function renderMissing(key) {
    const t = key.replace(/_/g, ' ');
    const near = wiki.sorted.filter(a => fold(a.title).includes(fold(t).slice(0, 6))).slice(0, 8);
    main.innerHTML = `
      <div class="page-head"><h1>${esc(t)}</h1><p>Irad Wiki does not have an article with this exact name.</p></div>
      ${near.length ? `<p>Similar titles:</p><ul class="alist">${near.map(listItem).join('')}</ul>` : ''}
      <p><a href="#Special.Search" id="searchFor">Search the full text for “${esc(t)}”</a></p>`;
    $('#searchFor').addEventListener('click', () => { query = t; });
    return t;
  }

  function listItem(a, snippet) {
    return `<li><a href="${href(a.slug)}">${esc(a.title)}</a><span class="meta">${esc(classOf(a.cls)?.short || '')} · ${esc(a.category)}</span><p>${snippet || esc(ledeOf(a))}</p></li>`;
  }

  /* A filterable list: chips filter by category; used for class and subject pages. */
  function filteredList(articles, groups) {
    const wrap = document.createElement('div');
    let active = null;
    const draw = () => {
      const list = active ? articles.filter(a => a.category === active || a.cls === active) : articles;
      wrap.querySelector('.alist').innerHTML = list.map(a => listItem(a)).join('');
      wrap.querySelectorAll('.filters button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.f || null) === active)));
    };
    wrap.innerHTML = `${groups.length > 1 ? `<div class="filters" role="group" aria-label="Filter">${[['', 'All', articles.length], ...groups].map(([k, l, n]) => `<button type="button" data-f="${esc(k)}">${esc(l)} <span>${n}</span></button>`).join('')}</div>` : ''}<ul class="alist"></ul>`;
    wrap.addEventListener('click', e => {
      const b = e.target.closest('.filters button'); if (!b) return;
      active = b.dataset.f || null; draw();
    });
    draw();
    return wrap;
  }

  function renderClass(id) {
    const c = classOf(id);
    const list = wiki.articles.filter(a => a.cls === id).sort(byTitle);
    const counts = new Map();
    list.forEach(a => counts.set(a.category, (counts.get(a.category) || 0) + 1));
    const groups = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, n]) => [k, k, n]);
    main.innerHTML = `<div class="page-head"><h1>${esc(c.name)}</h1><p>${esc(c.blurb)} ${list.length} article${list.length === 1 ? '' : 's'}.</p></div>`;
    main.append(filteredList(list, groups));
    return c.name;
  }

  function renderSubject(s) {
    const cats = wiki.subjects.get(s);
    const list = [...cats.values()].flat().sort(byTitle);
    const groups = [...cats].sort((a, b) => b[1].length - a[1].length).map(([k, l]) => [k, k, l.length]);
    main.innerHTML = `<div class="page-head"><h1>${esc(s)}</h1><p>${list.length} articles in ${cats.size} categor${cats.size === 1 ? 'y' : 'ies'}.</p></div>`;
    main.append(filteredList(list, groups));
    return s;
  }

  function renderCategory(cat) {
    const list = [...wiki.categories.get(cat)].sort(byTitle);
    const s = subjectOf(cat);
    main.innerHTML = `
      <div class="crumbs"><a href="#Subject.${categorySlug(s)}">${esc(s)}</a></div>
      <div class="page-head"><h1>Category: ${esc(cat)}</h1><p>${list.length} article${list.length === 1 ? '' : 's'} in this category.</p></div>
      <ul class="alist">${list.map(a => listItem(a)).join('')}</ul>`;
    return 'Category: ' + cat;
  }

  function renderIndex() {
    const groups = new Map();
    for (const a of wiki.sorted) {
      let L = fold(a.title.replace(/^the\s+/i, ''))[0] || '#';
      if (!/[a-z]/.test(L)) L = '#';
      L = L.toUpperCase();
      if (!groups.has(L)) groups.set(L, []);
      groups.get(L).push(a);
    }
    main.innerHTML = `
      <div class="page-head"><h1>All articles</h1><p>Every article in the three volumes, A to Z. ${wiki.articles.length} in total.</p></div>
      <div class="letters">${[...groups.keys()].map(L => `<button type="button" data-to="L-${L}">${L}</button>`).join('')}</div>
      <div class="az">${[...groups].map(([L, list]) => `<h2 id="L-${L}">${L}</h2><ul>${list.map(a => `<li><a href="${href(a.slug)}">${esc(a.title)}</a>${a.cls === 'FA' || a.cls === 'GA' ? `<small>${a.cls}</small>` : ''}</li>`).join('')}</ul>`).join('')}</div>`;
    main.querySelector('.letters').addEventListener('click', e => {
      const b = e.target.closest('button'); if (b) document.getElementById(b.dataset.to)?.scrollIntoView();
    });
    return 'All articles';
  }

  /* ---------- search ---------- */
  function titleMatches(q, limit) {
    const f = fold(q.trim());
    if (!f) return [];
    const starts = [], words = [], contains = [];
    for (const a of wiki.sorted) {
      const t = fold(a.title);
      if (t.startsWith(f)) starts.push(a);
      else if (t.includes(' ' + f) || t.includes('(' + f) || t.includes('-' + f)) words.push(a);
      else if (t.includes(f)) contains.push(a);
    }
    return [...starts, ...words, ...contains].slice(0, limit);
  }

  function buildSearchIndex() {
    searchIndex = wiki.articles.map(a => {
      const text = plainText(a.src);
      return { a, text, f: fold(text) };
    });
  }

  function renderSearch() {
    if (!searchIndex) buildSearchIndex();
    const q = query.trim();
    const head = `<div class="page-head"><h1>Search</h1>`;
    if (!q) {
      main.innerHTML = `${head}<p>Type in the search box above to search titles and the full text of every article.</p></div>`;
      return 'Search';
    }
    const f = fold(q);
    const titleHits = new Set(titleMatches(q, 50));
    const results = [];
    for (const e of searchIndex) {
      const i = e.f.indexOf(f);
      if (i < 0 && !titleHits.has(e.a)) continue;
      let n = 0, p = i;
      while (p >= 0 && n < 50) { n++; p = e.f.indexOf(f, p + f.length); }
      const score = (titleHits.has(e.a) ? 1000 : 0) + (fold(e.a.title) === f ? 1000 : 0) + n;
      results.push({ e, i, score });
    }
    results.sort((x, y) => y.score - x.score || byTitle(x.e.a, y.e.a));
    const snip = ({ e, i }) => {
      if (i < 0) return esc(ledeOf(e.a));
      const s = Math.max(0, e.text.lastIndexOf(' ', Math.max(0, i - 70)));
      const end = Math.min(e.text.length, i + f.length + 110);
      // the folded string has the same length as the original for these scripts, so indexes line up
      const before = e.text.slice(s, i), hit = e.text.slice(i, i + f.length), after = e.text.slice(i + f.length, end);
      return `${s > 0 ? '…' : ''}${esc(before.trimStart())}<mark>${esc(hit)}</mark>${esc(after)}${end < e.text.length ? '…' : ''}`;
    };
    main.innerHTML = `${head}<p>${results.length ? `${results.length} article${results.length === 1 ? '' : 's'} mention “${esc(q)}”.` : `No articles mention “${esc(q)}”. Check the spelling, or try a shorter word.`}</p></div>
      <ul class="alist">${results.slice(0, 150).map(r => listItem(r.e.a, snip(r))).join('')}</ul>
      ${results.length > 150 ? `<p class="empty">Showing the first 150 results. Add another word to narrow the search.</p>` : ''}`;
    return `Search: ${q}`;
  }

  const input = $('#q'), sug = $('#suggest');
  let sel = -1;
  function closeSuggest() { sug.hidden = true; sel = -1; input.setAttribute('aria-expanded', 'false'); }
  function openSuggest() {
    if (!wiki) return;
    const q = input.value.trim();
    if (!q) return closeSuggest();
    const hits = titleMatches(q, 8);
    sug.innerHTML = hits.map((a, i) => `<li role="option" id="opt${i}"><a href="${href(a.slug)}"><span>${esc(a.title)}</span><small>${esc(classOf(a.cls)?.short || '')}</small></a></li>`).join('')
      + `<li class="all" role="option" id="opt${hits.length}"><a href="#Special.Search" data-search="1">Search all articles for “${esc(q)}”</a></li>`;
    sug.hidden = false; sel = -1; input.setAttribute('aria-expanded', 'true');
  }
  input.addEventListener('input', openSuggest);
  input.addEventListener('focus', openSuggest);
  input.addEventListener('keydown', e => {
    const items = [...sug.querySelectorAll('li')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (sug.hidden) return;
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('on', i === sel));
      input.setAttribute('aria-activedescendant', items[sel].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (sel >= 0 && items[sel] && !items[sel].classList.contains('all')) { items[sel].querySelector('a').click(); }
      else runSearch();
    } else if (e.key === 'Escape') { closeSuggest(); }
  });
  sug.addEventListener('mousedown', e => e.preventDefault());
  sug.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    if (a.dataset.search) { e.preventDefault(); runSearch(); return; }
    input.value = ''; closeSuggest(); input.blur();
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) closeSuggest(); });
  function runSearch() {
    query = input.value.trim();
    if (!query) return;
    closeSuggest(); input.blur();
    byClick = true;
    if (location.hash === '#Special.Search') route(); else location.hash = 'Special.Search';
  }

  /* ---------- main page ---------- */
  function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function renderHome() {
    const fa = wiki.articles.find(a => a.cls === 'FA');
    const intro = (wiki.pre[0].match(/^The \*\*Irad Wiki\*\*.*$/m) || [''])[0];
    const firstPara = fa ? fa.src.split(/\n\s*\n/).find(p => p.trim() && !/^\s*[#<{|]/.test(p)) : '';
    const pool = wiki.articles.filter(a => (a.cls === 'Start' || a.cls === 'Stub') && ledeOf(a).length > 60);
    const dyk = shuffle(pool).slice(0, 5);
    const ga = wiki.articles.filter(a => a.cls === 'GA').sort(byTitle);
    const subj = [...wiki.subjects].map(([s, cats]) => [s, [...cats].sort((a, b) => b[1].length - a[1].length)]).sort((a, b) => b[1].reduce((n, c) => n + c[1].length, 0) - a[1].reduce((n, c) => n + c[1].length, 0));
    const count = id => wiki.articles.filter(a => a.cls === id).length;
    const words = Math.round(wiki.articles.reduce((n, a) => n + a.src.split(/\s+/).length, 0) / 1000);

    main.innerHTML = `
      <div class="welcome">
        <img src="${FLAG}" alt="Flag of Irad">
        <div>
          <h1>Welcome to the <em>Irad Wiki</em></h1>
          <p>${intro ? md.renderInline(intro) : 'The free encyclopedia of the Republic of Irad.'}</p>
          <div class="stats"><span><b>${wiki.articles.length}</b> articles</span><span><b>${wiki.categories.size}</b> categories</span><span>about <b>${words}k</b> words</span></div>
        </div>
      </div>
      <div class="home">
        <section>
          <div class="block feature">
            <h2>Featured article ${fa ? `<a href="${href(fa.slug)}">Read the article</a>` : ''}</h2>
            ${fa ? `<h3><a href="${href(fa.slug)}">${esc(fa.title)}</a></h3><div class="prose" id="faText"></div><a class="more" href="${href(fa.slug)}">Continue reading ${esc(fa.title)} →</a>` : ''}
          </div>
          <div class="block">
            <h2>Did you know… <a href="#" id="moreDyk">Show others</a></h2>
            <ul class="dyk">${dyk.map(a => `<li><a href="${href(a.slug)}">${esc(a.title)}</a>: ${esc(ledeOf(a).replace(new RegExp('^' + a.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), ''))}</li>`).join('')}</ul>
          </div>
        </section>
        <section>
          <div class="block">
            <h2>Good articles</h2>
            <ul class="ga">${ga.map(a => `<li><a href="${href(a.slug)}">${esc(a.title)}</a></li>`).join('')}</ul>
          </div>
          <div class="block">
            <h2>Browse by quality</h2>
            <ul class="classes">${CLASSES.map(c => `<li><a href="#Class.${c.id}"><span class="chip ${c.id}">${c.id === 'FA' ? '★ ' : ''}${esc(c.short)}</span><span>${esc(c.name)}</span><span class="n">${count(c.id)}</span></a></li>`).join('')}</ul>
          </div>
        </section>
        <section class="wide block">
          <h2>Browse by subject <a href="#Special.All">All articles A–Z</a></h2>
          <div class="subjects">${subj.map(([s, cats]) => `
            <div><h3><a href="#Subject.${categorySlug(s)}">${esc(s)}</a><span>${cats.reduce((n, c) => n + c[1].length, 0)}</span></h3>
            <ul>${cats.slice(0, 6).map(([c, l]) => `<li><a href="#Category.${categorySlug(c)}">${esc(c)}</a><span>${l.length}</span></li>`).join('')}
            ${cats.length > 6 ? `<li><a href="#Subject.${categorySlug(s)}">${cats.length - 6} more categor${cats.length - 6 === 1 ? 'y' : 'ies'}…</a></li>` : ''}</ul></div>`).join('')}
          </div>
        </section>
      </div>`;
    if (fa && firstPara) {
      const p = $('#faText');
      p.innerHTML = toHtml(firstPara);
      p.querySelectorAll('sup').forEach(s => s.remove());
    }
    $('#moreDyk').addEventListener('click', e => { e.preventDefault(); const y = scrollY; renderHome(); scrollTo(0, y); });
    return '';
  }

  load();
})();
