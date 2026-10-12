/* Irad Wiki app: loading, routing and rendering. Depends on core.js and markdown-it. */
(function () {
  'use strict';
  const BASE = './';                 // folder that holds the volume files and webflag.svg
  const FLAG = BASE + 'webflag.svg';
  // Images are listed in images/images.json (file, article, section or placement, width, caption, alt).
  // As on Wikipedia, articles show PNG thumbnails at 1x and 2x and link to the full file.
  const IMAGES = BASE + 'images/';
  const THEME_KEY = 'iradwiki-theme';
  const $ = s => document.querySelector(s);
  const main = $('#main'), side = $('#side'), foot = $('#foot'), menuPanel = $('#menuPanel');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const href = slug => '#' + encodeURIComponent(slug).replace(/%2C/g, ',').replace(/%3A/g, ':');
  const classOf = id => CLASSES.find(c => c.id === id);
  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  const sortKey = t => t.replace(/^the\s+/i, '');
  const byTitle = (a, b) => collator.compare(sortKey(a.title), sortKey(b.title));
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plural = (n, one, many) => `${n.toLocaleString('en')} ${n === 1 ? one : (many || one + 's')}`;

  let wiki = null, md = null, infobox = null, query = '', searchIndex = null, images = [];
  const ledeCache = new Map();
  const ledeOf = a => { if (!ledeCache.has(a)) ledeCache.set(a, lede(a.src)); return ledeCache.get(a); };

  /* ---------- icons ---------- */
  const ICON = {
    FA: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="var(--fa)" stroke="var(--fa)" stroke-width="1" stroke-linejoin="round" d="m10 1.8 2.5 5.3 5.7.7-4.2 4 1.1 5.7L10 14.7l-5.1 2.8L6 11.8 1.8 7.8l5.7-.7z"/></svg>',
    GA: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="var(--ga)"/><path d="M10 5.5v9M5.5 10h9" stroke="var(--bg)" stroke-width="2.4" stroke-linecap="round"/></svg>',
    dot: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="var(--border)"/></svg>',
    moon: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z"/></svg>',
    sun: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.5"/><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M4 16l1.4-1.4M14.6 5.4 16 4"/></svg>',
    search: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m17 17-4.5-4.5"/></svg>',
    stub: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
  };

  /* ---------- theme ---------- */
  const themeBtn = $('#themeBtn');
  function currentTheme() { return document.documentElement.getAttribute('data-wiki-theme') === 'dark' ? 'dark' : 'light'; }
  function paintThemeBtn() {
    const dark = currentTheme() === 'dark';
    themeBtn.innerHTML = dark ? `${ICON.sun}<span>Light</span>` : `${ICON.moon}<span>Dark</span>`;
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeBtn.title = themeBtn.getAttribute('aria-label');
  }
  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (next === 'dark') document.documentElement.setAttribute('data-wiki-theme', 'dark');
    else document.documentElement.removeAttribute('data-wiki-theme');
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable: the choice lasts for this visit */ }
    paintThemeBtn();
  });
  paintThemeBtn();

  /* ---------- loading ---------- */
  async function load() {
    if (!window.markdownit) return fail('The Markdown library did not load. Check your internet connection, then reload the page.');
    md = window.markdownit({ html: true, linkify: false, typographer: false });
    let done = 0;
    const bar = $('#loadBar'), msg = $('#loadMsg');
    // The image list is optional: without it, articles simply show no images.
    const imageList = fetch(IMAGES + 'images.json').then(r => (r.ok ? r.json() : [])).catch(() => []);
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
    images = await imageList;
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
    wiki.subjectOrder = [...wiki.subjects.keys()].sort((a, b) => subjectSize(b) - subjectSize(a));
    wiki.catBySlug = new Map([...wiki.categories.keys()].map(c => [categorySlug(c), c]));
    wiki.subjBySlug = new Map([...wiki.subjects.keys()].map(s => [categorySlug(s), s]));
    // irad.wiki/?search=Talas (the address search engines use for a site search box) opens the results page.
    const q = new URLSearchParams(location.search).get('search');
    if (q) {
      query = q.trim();
      history.replaceState(null, '', location.pathname + '#Special.Search');
    }
    route();
  }
  function subjectSize(s) { return [...wiki.subjects.get(s).values()].reduce((n, l) => n + l.length, 0); }
  function classCount(id) { return wiki.articles.filter(a => a.cls === id).length; }

  function fail(html) {
    main.innerHTML = `<div class="status err"><img src="${FLAG}" alt=""><h1>The wiki couldn't load</h1><p>${html}</p></div>`;
  }

  /* ---------- routing ---------- */
  let byClick = false, current = null;
  const scrolls = new Map();
  addEventListener('scroll', () => { if (current !== null) scrolls.set(current, scrollY); spy(); }, { passive: true });
  document.addEventListener('click', e => { if (e.target.closest('a[href^="#"]')) byClick = true; });
  addEventListener('hashchange', route);

  function route() {
    if (!wiki) return;
    let key = '';
    try { key = decodeURIComponent(location.hash.slice(1)); } catch { key = location.hash.slice(1); }
    const fresh = byClick; byClick = false;
    current = key;
    closeSuggest(); closeMenu();
    headings = [];

    if (key === 'Special.Random') {
      const a = wiki.articles[Math.floor(Math.random() * wiki.articles.length)];
      location.replace(href(a.slug));
      return;
    }
    let title, article = null;
    const art = k => wiki.bySlug.get(k) || resolve(wiki, k.replace(/_/g, ' '));
    if (!key) title = renderHome();
    else if (key === 'Special.All') title = renderIndex();
    else if (key === 'Special.Search') title = renderSearch();
    else if (key.startsWith('Class.') && classOf(key.slice(6))) title = renderClass(key.slice(6));
    else if (key.startsWith('Category.') && wiki.catBySlug.has(key.slice(9))) title = renderCategory(wiki.catBySlug.get(key.slice(9)));
    else if (key.startsWith('Subject.') && wiki.subjBySlug.has(key.slice(8))) title = renderSubject(wiki.subjBySlug.get(key.slice(8)));
    else if (key.endsWith('~source') && (article = art(key.slice(0, -7)))) title = renderSource(article);
    else if ((article = art(key))) title = renderArticle(article);
    else title = renderMissing(key);

    document.title = title ? `${title} – Irad Wiki` : 'Irad Wiki, the free encyclopedia';
    setMeta(key, title, article && !key.endsWith('~source') ? article : null);
    if (!headings.length) side.innerHTML = `<div class="nav-h">Main menu</div>${menuHtml(key)}`;
    renderFooter(article && !key.endsWith('~source') ? article : null);
    const y = !fresh && scrolls.has(key) ? scrolls.get(key) : 0;
    requestAnimationFrame(() => { scrollTo(0, y); spy(); });
  }

  /* ---------- page metadata ----------
     Keeps the description, canonical address and social-preview tags in the
     <head> in step with the page shown, for search engines that run scripts.
     The values set at build time (see build.sh) describe the site as a whole. */
  const SITE = 'https://irad.wiki/';
  const siteDescription = document.querySelector('meta[name="description"]')?.content || '';
  function setMeta(key, title, article) {
    const full = document.title;
    const desc = article ? ledeOf(article) : siteDescription;
    const url = SITE + (key ? href(key) : '');
    const set = (sel, value) => { const el = document.querySelector(sel); if (el) el.content = value; };
    set('meta[name="description"]', desc);
    set('meta[property="og:title"]', full);
    set('meta[property="og:description"]', desc);
    set('meta[property="og:url"]', url);
    set('meta[property="og:type"]', article ? 'article' : 'website');
    set('meta[name="twitter:title"]', full);
    set('meta[name="twitter:description"]', desc);
    const canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = url;
  }

  /* ---------- main menu ---------- */
  function menuHtml(key) {
    const here = k => (k === key ? ' class="here" aria-current="page"' : '');
    return `
      <ul class="nav-list">
        <li><a href="#"${here('')}>Main page</a></li>
        <li><a href="#Special.All"${here('Special.All')}>All pages</a></li>
        <li><a href="#Special.Random">Random article</a></li>
      </ul>
      <div class="nav-sub">Article quality</div>
      <ul class="nav-list">${CLASSES.map(c => `<li><a href="#Class.${c.id}"${here('Class.' + c.id)}>${esc(c.name)}</a><span class="n">${classCount(c.id)}</span></li>`).join('')}</ul>
      <div class="nav-sub">Portals</div>
      <ul class="nav-list">${wiki.subjectOrder.map(s => `<li><a href="#Subject.${categorySlug(s)}"${here('Subject.' + categorySlug(s))}>${esc(s)}</a><span class="n">${subjectSize(s)}</span></li>`).join('')}</ul>`;
  }
  const menuBtn = $('#menuBtn');
  function closeMenu() { menuPanel.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (!wiki) return;
    if (!menuPanel.hidden) return closeMenu();
    menuPanel.innerHTML = `<div class="nav-h">Main menu</div>${menuHtml(current)}`;
    menuPanel.hidden = false; menuBtn.setAttribute('aria-expanded', 'true');
  });
  document.addEventListener('click', e => { if (!menuPanel.hidden && !e.target.closest('#menuPanel')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); closeSuggest(); } });

  /* ---------- contents (scroll-spy) ---------- */
  let headings = [];
  function renderToc(list) {
    headings = list;
    side.innerHTML = `<div class="nav-h">Contents</div>
      <nav class="toc" aria-label="Contents"><ol>
        <li><a href="#" data-to="top">(Top)</a></li>
        ${list.map(h => `<li><a href="#" data-to="${h.id}">${esc(h.text)}</a></li>`).join('')}
      </ol></nav>`;
  }
  side.addEventListener('click', e => {
    const a = e.target.closest('a[data-to]'); if (!a) return;
    e.preventDefault();
    if (a.dataset.to === 'top') scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    else document.getElementById(a.dataset.to)?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
  });
  function spy() {
    if (!headings.length) return;
    let active = 'top';
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el && el.getBoundingClientRect().top < 90) active = h.id;
    }
    side.querySelectorAll('.toc a').forEach(a => a.classList.toggle('active', a.dataset.to === active));
  }

  /* ---------- markdown ---------- */
  const STUB_WORDS = {
    geo: 'the geography of Irad', culture: 'Iradi culture', bio: 'an Iradi person', org: 'an Iradi organization',
    settlement: 'a settlement in Irad', plant: 'a plant of Irad', fauna: 'the animals of Irad', mountain: 'a mountain in Irad',
    craft: 'an Iradi craft', lake: 'a lake in Irad', river: 'a river in Irad', history: 'the history of Irad',
    horse: 'Iradi horses', sport: 'sport in Irad', glacier: 'a glacier in Irad',
  };

  function toHtml(src) {
    // links first, so templates such as {{Hatnote|… see [[Talas River]]}} keep working links
    const pre = src
      .replace(WIKILINK, (_, t, label) => {
        if (WP_PREFIX.test(t)) {
          const name = t.replace(WP_PREFIX, '').trim();
          return `<a class="ext" href="${wpUrl(name)}" target="_blank" rel="noopener" title="${esc(name)} (Wikipedia)">${esc(label || name)}</a>`;
        }
        const target = resolve(wiki, t);
        const text = label || t;
        return target
          ? `<a class="wl" href="${href(target.slug)}" title="${esc(target.title)}">${esc(text)}</a>`
          : `<a class="red" href="${href(slugOf(t.trim()))}" title="${esc(t)} (page does not exist)">${esc(text)}</a>`;
      })
      .replace(STUB_TEMPLATE, (_, body) => {
        const [name, ...args] = body.split('|');
        if (/^hatnote$/i.test(name.trim())) return `<div class="hatnote" role="note">${args.join('|')}</div>`;
        const m = name.match(/^Irad-(\w+)-stub$/i);
        if (m || /^Irad-stub$/i.test(name)) {
          const about = m ? (STUB_WORDS[m[1].toLowerCase()] || m[1].toLowerCase() + ' in Irad') : 'Irad';
          return `<div class="stub-note">${ICON.stub}<span>This article about ${about} is a stub. You can help Irad Wiki by expanding it.</span></div>`;
        }
        return `<div class="stub-note">${esc(name)}${args.length ? ': ' + args.join(' | ') : ''}</div>`;
      });
    return md.render(pre);
  }

  /* Wraps tables and makes citation markers clickable. */
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
    li.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
    li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash');
    setTimeout(() => li.classList.remove('flash'), 2000);
  }

  /* ---------- article ---------- */
  function indicators(a) {
    if (a.cls === 'FA') return `<a href="#Class.FA" title="This is a featured article. Click here for more information.">${ICON.FA}</a>`;
    if (a.cls === 'GA') return `<a href="#Class.GA" title="This is a good article. Click here for more information.">${ICON.GA}</a>`;
    return '';
  }
  function articleHead(a, view) {
    return `
      <div class="title-row"><h1 class="firstHeading">${view === 'source' ? `View source for ${esc(a.title)}` : esc(a.title)}</h1><div class="indicators">${indicators(a)}</div></div>
      <div class="tabs">
        <nav aria-label="Namespaces"><a class="sel" href="${href(a.slug)}">Article</a></nav>
        <nav aria-label="Views"><a ${view === 'read' ? 'class="sel" aria-current="page"' : ''} href="${href(a.slug)}">Read</a><a ${view === 'source' ? 'class="sel" aria-current="page"' : ''} href="${href(a.slug + '~source')}">View source</a></nav>
      </div>`;
  }
  function catlinks(a) {
    const c = classOf(a.cls);
    const stub = a.stubType ? (a.stubType.match(/^Irad-(\w+)-stub$/i) || [])[1] : null;
    return `<div class="catlinks"><a href="#Special.All">Categories</a>: <ul>
      <li><a href="#Category.${categorySlug(a.category)}">${esc(a.category)}</a></li>
      <li><a href="#Class.${a.cls}">${esc(c ? c.name : a.cls)}</a></li>
      <li><a href="#Subject.${categorySlug(subjectOf(a.category))}">Portal: ${esc(subjectOf(a.category))}</a></li>
      ${stub ? `<li>${esc(stub[0].toUpperCase() + stub.slice(1))} stubs</li>` : ''}
    </ul></div>`;
  }

  /* ---------- images ---------- */
  const imagesFor = a => images.filter(e => e.article === a.title);
  function thumbImg(e) {
    const stem = e.file.replace(/\.svg$/i, '');
    const isSvg = /\.svg$/i.test(e.file);
    const src = isSvg ? `${IMAGES}thumb/${e.width}px-${stem}.png` : IMAGES + e.file;
    const srcset = isSvg ? ` srcset="${IMAGES}thumb/${e.width * 2}px-${stem}.png 2x"` : '';
    return `<a href="${IMAGES}${encodeURI(e.file)}" target="_blank" rel="noopener" title="Open the full-size image"><img src="${src}"${srcset} width="${e.width}" alt="${esc(e.alt || e.caption || '')}" loading="lazy"></a>`;
  }
  // Puts each image after its section heading (and after a "Main article" note, as Wikipedia does).
  // "placement": "lead" puts it at the top right of the article instead, as for a company logo.
  function placeImages(body, a) {
    for (const e of imagesFor(a).filter(x => x.placement === 'lead').reverse()) {
      const fig = document.createElement('figure');
      fig.className = 'thumb lead';
      fig.style.width = (e.width + 8) + 'px';
      fig.innerHTML = thumbImg(e) + (e.caption ? `<figcaption>${esc(e.caption)}</figcaption>` : '');
      // After any hatnotes at the top, before the first paragraph.
      let at = null;
      for (const el of body.children) { if (el.classList.contains('hatnote')) at = el; else break; }
      if (at) at.after(fig); else body.prepend(fig);
    }
    for (const e of imagesFor(a)) {
      if (!e.section) continue;
      const h = [...body.querySelectorAll('h2, h3, h4')].find(x => x.textContent.trim() === e.section);
      if (!h) { console.warn(`Irad Wiki: no section "${e.section}" in ${a.title} for ${e.file}`); continue; }
      const fig = document.createElement('figure');
      fig.className = 'thumb';
      fig.style.width = (e.width + 8) + 'px';
      fig.innerHTML = thumbImg(e) + (e.caption ? `<figcaption>${esc(e.caption)}</figcaption>` : '');
      let at = h;
      const next = h.nextElementSibling;
      if (next && /^Main articles?:/i.test(next.textContent.trim())) at = next;
      at.after(fig);
    }
  }

  function renderArticle(a) {
    const body = document.createElement('div');
    body.className = 'prose';
    body.innerHTML = toHtml(a.src);
    enhance(body);
    placeImages(body, a);
    const hs = [...body.querySelectorAll('h2')];
    hs.forEach((h, i) => { h.id = 'sec-' + (i + 1); });
    if (hs.length >= 2) {
      const t = document.createElement('details');
      t.className = 'inline-toc';
      t.innerHTML = `<summary>Contents</summary><ol>${hs.map(h => `<li><a href="#" data-to="${h.id}">${esc(h.textContent)}</a></li>`).join('')}</ol>`;
      t.addEventListener('click', e => { const l = e.target.closest('a[data-to]'); if (l) { e.preventDefault(); document.getElementById(l.dataset.to)?.scrollIntoView(); } });
      hs[0].before(t);
    }
    if (a.slug === 'Irad' && infobox) body.prepend(renderInfobox(infobox));

    const back = [...(wiki.backlinks.get(a.slug) || [])].sort(byTitle);
    main.innerHTML = `
      <article>
        ${articleHead(a, 'read')}
        <div class="siteSub">From Irad Wiki, the free encyclopedia</div>
        <div id="body"></div>
        ${back.length ? `<details class="backlinks"><summary>What links here (${back.length})</summary><ul>${back.map(b => `<li><a href="${href(b.slug)}">${esc(b.title)}</a></li>`).join('')}</ul></details>` : ''}
        ${catlinks(a)}
      </article>`;
    $('#body').replaceWith(body);
    renderToc(hs.map(h => ({ id: h.id, text: h.textContent })));
    return a.title;
  }

  function renderSource(a) {
    const vol = VOLUMES[a.vol];
    main.innerHTML = `
      ${articleHead(a, 'source')}
      <div class="siteSub">From Irad Wiki, the free encyclopedia</div>
      <p class="source-note">This article's text is in <code>${esc(vol.file)}</code>, under the heading on line ${a.line}${a.number ? ` (§${esc(a.number)})` : ''}. To change it, edit that file.</p>
      <pre class="source-view">${esc(a.src)}</pre>
      <p><a href="${href(a.slug)}">Return to ${esc(a.title)}.</a></p>`;
    return `View source for ${a.title}`;
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
    const locator = images.find(e => e.article === 'Irad' && e.placement === 'infobox');
    const rows = box.rows.filter(r => r !== flag);
    // As on Wikipedia, the location map sits after the flag and anthem, before the capital and the rest.
    const anthemAt = rows.findIndex(r => /^anthem/i.test(r.key));
    const top = rows.slice(0, anthemAt + 1), rest = rows.slice(anthemAt + 1);
    const dl = list => list.length ? `<dl>${list.map(r => `<dt>${esc(r.key)}</dt><dd>${r.value ? linkNames(r.value) : ''}${r.items.length ? `<ul>${r.items.map(i => `<li>${i.label ? `${esc(i.label)}: ` : ''}${linkNames(i.value)}</li>`).join('')}</ul>` : ''}</dd>`).join('')}</dl>` : '';
    el.innerHTML = `
      <div class="above">${esc(box.name)}${box.subtitle ? `<span>${esc(box.subtitle)}</span>` : ''}</div>
      <figure><img src="${FLAG}" alt="Flag of Irad">${flag ? `<figcaption>Flag: ${esc(flag.value)}</figcaption>` : ''}</figure>
      ${dl(top)}
      ${locator ? `<figure class="locator">${thumbImg(locator)}${locator.caption ? `<figcaption>${esc(locator.caption)}</figcaption>` : ''}</figure>` : ''}
      ${dl(rest)}`;
    return el;
  }

  function renderMissing(key) {
    const t = key.replace(/_/g, ' ');
    main.innerHTML = `
      <div class="title-row"><h1 class="firstHeading">${esc(t)}</h1></div>
      <div class="siteSub">From Irad Wiki, the free encyclopedia</div>
      <div class="cat-intro"><p><b>Irad Wiki does not have an article with this exact name.</b> Please <a href="#Special.Search" id="searchFor">search for <i>${esc(t)}</i> in Irad Wiki</a> to check for alternative titles or spellings.</p></div>`;
    $('#searchFor').addEventListener('click', () => { query = t; });
    return t;
  }

  /* ---------- category-style lists ---------- */
  function letterOf(title) {
    const L = (fold(sortKey(title))[0] || '#').toUpperCase();
    return /[A-Z]/.test(L) ? L : '#';
  }
  function pagesColumns(list) {
    const groups = new Map();
    [...list].sort(byTitle).forEach(a => { const L = letterOf(a.title); if (!groups.has(L)) groups.set(L, []); groups.get(L).push(a); });
    return `<div class="cat-cols">${[...groups].map(([L, as]) => `<div><h3>${L}</h3><ul>${as.map(a => `<li><a href="${href(a.slug)}">${esc(a.title)}</a></li>`).join('')}</ul></div>`).join('')}</div>`;
  }
  function listPage(title, intro, list, subcats) {
    main.innerHTML = `
      <div class="title-row"><h1 class="firstHeading">${esc(title)}</h1></div>
      <div class="tabs"><nav><a class="sel" href="${href(current)}">${title.startsWith('Portal:') ? 'Portal' : 'Category'}</a></nav><nav><a class="sel" href="${href(current)}">Read</a></nav></div>
      <div class="siteSub">From Irad Wiki, the free encyclopedia</div>
      ${intro ? `<div class="cat-intro">${intro}</div>` : ''}
      ${subcats ? `<h2 class="cat-h2">Categories</h2><p>This portal has the following ${plural(subcats.length, 'category', 'categories')}.</p><ul class="subcats">${subcats.map(([c, l]) => `<li><a href="#Category.${categorySlug(c)}">${esc(c)}</a> <small>(${l.length} P)</small></li>`).join('')}</ul>` : ''}
      <h2 class="cat-h2">Pages in ${subcats ? 'this portal' : `category "${esc(title.replace(/^Category:/, ''))}"`}</h2>
      <p>The following ${plural(list.length, 'page is', 'pages are')} in this ${subcats ? 'portal' : 'category'}, out of ${list.length.toLocaleString('en')} total.</p>
      ${pagesColumns(list)}`;
    return title;
  }
  function renderClass(id) {
    const c = classOf(id);
    return listPage(`Category:${c.name[0].toUpperCase() + c.name.slice(1)}`, `<p>${esc(c.blurb)}</p>`, wiki.articles.filter(a => a.cls === id));
  }
  function renderCategory(cat) {
    const s = subjectOf(cat);
    return listPage(`Category:${cat}`, `<p>Part of the <a href="#Subject.${categorySlug(s)}">${esc(s)}</a> portal.</p>`, wiki.categories.get(cat));
  }
  function renderSubject(s) {
    const cats = [...wiki.subjects.get(s)].sort((a, b) => b[1].length - a[1].length);
    return listPage(`Portal:${s}`, `<p>Articles on ${esc(s.toLowerCase())} in Irad, grouped from ${plural(cats.length, 'category', 'categories')}.</p>`, cats.flatMap(([, l]) => l), cats);
  }

  function renderIndex() {
    const groups = new Map();
    for (const a of wiki.sorted) { const L = letterOf(a.title); if (!groups.has(L)) groups.set(L, []); groups.get(L).push(a); }
    main.innerHTML = `
      <div class="title-row"><h1 class="firstHeading">All pages</h1></div>
      <div class="siteSub">From Irad Wiki, the free encyclopedia</div>
      <p class="cat-intro">Every article in Irad Wiki, ${wiki.articles.length.toLocaleString('en')} in total.</p>
      <div class="az-letters">${[...groups.keys()].map(L => `<button type="button" data-to="L-${L}">${L}</button>`).join('')}</div>
      ${[...groups].map(([L, list]) => `<h2 class="cat-h2 az-h" id="L-${L}">${L}</h2><div class="cat-cols"><ul>${list.map(a => `<li><a href="${href(a.slug)}">${esc(a.title)}</a></li>`).join('')}</ul></div>`).join('')}`;
    main.querySelector('.az-letters').addEventListener('click', e => {
      const b = e.target.closest('button'); if (b) document.getElementById(b.dataset.to)?.scrollIntoView();
    });
    return 'All pages';
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
    searchIndex = wiki.articles.map(a => { const text = plainText(a.src); return { a, text, f: fold(text), words: text.split(/\s+/).length }; });
  }

  function renderSearch() {
    if (!searchIndex) buildSearchIndex();
    const q = query.trim();
    const form = `<form class="search-big" id="bigSearch" role="search"><input id="q2" type="search" value="${esc(q)}" aria-label="Search Irad Wiki"><button type="submit">Search</button></form>`;
    const head = `<div class="title-row"><h1 class="firstHeading">Search results</h1></div>${form}`;
    const bind = () => $('#bigSearch').addEventListener('submit', e => { e.preventDefault(); query = $('#q2').value.trim(); route(); });
    if (!q) { main.innerHTML = head; bind(); return 'Search'; }
    const f = fold(q);
    const titleHits = new Set(titleMatches(q, 50));
    const results = [];
    for (const e of searchIndex) {
      const i = e.f.indexOf(f);
      if (i < 0 && !titleHits.has(e.a)) continue;
      let n = 0, p = i;
      while (p >= 0 && n < 50) { n++; p = e.f.indexOf(f, p + f.length); }
      results.push({ e, i, score: (titleHits.has(e.a) ? 1000 : 0) + (fold(e.a.title) === f ? 1000 : 0) + n });
    }
    results.sort((x, y) => y.score - x.score || byTitle(x.e.a, y.e.a));
    const exact = wiki.byFold.get(f);
    const snip = ({ e, i }) => {
      if (i < 0) return esc(ledeOf(e.a));
      const s = Math.max(0, e.text.lastIndexOf(' ', Math.max(0, i - 80)));
      const end = Math.min(e.text.length, i + f.length + 120);
      // fold() keeps string length for these scripts, so the indexes line up
      return `${s > 0 ? '… ' : ''}${esc(e.text.slice(s, i).trimStart())}<span class="searchmatch">${esc(e.text.slice(i, i + f.length))}</span>${esc(e.text.slice(i + f.length, end))}${end < e.text.length ? ' …' : ''}`;
    };
    const kb = e => Math.max(1, Math.round(e.a.src.length / 1024));
    main.innerHTML = `${head}
      ${exact ? `<p><b>There is a page named "<a href="${href(exact.slug)}">${esc(exact.title)}</a>" on Irad Wiki</b></p>` : ''}
      <div class="r-count">${results.length ? `Results 1 – ${Math.min(results.length, 100)} of ${results.length.toLocaleString('en')}` : `There were no results matching the query "${esc(q)}".`}</div>
      <ul class="results">${results.slice(0, 100).map(r => `
        <li><div class="r-title"><a href="${href(r.e.a.slug)}">${esc(r.e.a.title)}</a></div>
        <div class="r-snip">${snip(r)}</div>
        <div class="r-data">${kb(r.e)} KB (${r.e.words.toLocaleString('en')} words) · ${esc(classOf(r.e.a.cls)?.short || '')}</div></li>`).join('')}</ul>
      ${results.length > 100 ? `<p class="r-data">Only the first 100 results are shown. Add another word to narrow the search.</p>` : ''}`;
    bind();
    return `Search results for "${q}"`;
  }

  const input = $('#q'), sug = $('#suggest');
  let sel = -1;
  function closeSuggest() { sug.hidden = true; sel = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
  function openSuggest() {
    if (!wiki) return;
    const q = input.value.trim();
    if (!q) return closeSuggest();
    const hits = titleMatches(q, 8);
    sug.innerHTML = hits.map((a, i) => `<li role="option" id="opt${i}"><a href="${href(a.slug)}"><b>${esc(a.title)}</b><small>${esc(ledeOf(a))}</small></a></li>`).join('')
      + `<li class="all" role="option" id="opt${hits.length}"><a href="#Special.Search" data-search="1">${ICON.search}<span>Search for pages containing <b>${esc(q)}</b></span></a></li>`;
    sug.hidden = false; sel = -1; input.setAttribute('aria-expanded', 'true');
  }
  input.addEventListener('input', openSuggest);
  input.addEventListener('focus', openSuggest);
  input.addEventListener('keydown', e => {
    const items = [...sug.querySelectorAll('li')];
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !sug.hidden) {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('on', i === sel));
      input.setAttribute('aria-activedescendant', items[sel].id);
    }
  });
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const items = [...sug.querySelectorAll('li')];
    if (!sug.hidden && sel >= 0 && items[sel] && !items[sel].classList.contains('all')) { items[sel].querySelector('a').click(); return; }
    const q = input.value.trim();
    if (!q || !wiki) return;
    const exact = wiki.byFold.get(fold(q));
    closeSuggest(); input.blur(); input.value = '';
    byClick = true;
    if (exact) { location.hash = href(exact.slug); return; }   // Wikipedia's "Go" behaviour
    runSearch(q);
  });
  sug.addEventListener('mousedown', e => e.preventDefault());
  sug.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    if (a.dataset.search) { e.preventDefault(); const q = input.value.trim(); input.value = ''; closeSuggest(); input.blur(); runSearch(q); return; }
    input.value = ''; closeSuggest(); input.blur();
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) closeSuggest(); });
  function runSearch(q) {
    query = q;
    byClick = true;
    if (location.hash === '#Special.Search') route(); else location.hash = 'Special.Search';
  }

  /* ---------- main page ---------- */
  function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // Turns "X is a …." into "… that X is a …?" for the Did you know box.
  function dykFact(a) {
    const para = a.src.split(/\n\s*\n/).find(p => p.trim() && !/^\s*[#<{|]/.test(p));
    if (!para) return null;
    const text = plainText(para);
    const first = text.split(/(?<=[a-z0-9\)”"'][.!?])\s+(?=[A-Z“"])/)[0] || '';
    if (!fold(first).startsWith(fold(a.title)) || first.length > 230 || first.length < 40) return null;
    const rest = first.slice(a.title.length).replace(/\s*\(see [^()]*(\([^()]*\))?[^()]*\)/g, '').replace(/[.!]$/, '');
    if (!/^\s*(\(|,|is|was|are|were|has|had)/.test(rest)) return null;
    return `… that <b><a href="${href(a.slug)}">${esc(a.title)}</a></b>${esc(rest)}?`;
  }

  function renderHome() {
    const fa = wiki.articles.find(a => a.cls === 'FA');
    const firstPara = fa ? fa.src.split(/\n\s*\n/).find(p => p.trim() && !/^\s*[#<{|]/.test(p)) : '';
    const facts = [];
    for (const a of shuffle(wiki.articles.filter(a => a.cls === 'Start' || a.cls === 'Stub'))) {
      const f = dykFact(a);
      if (f) facts.push(f);
      if (facts.length === 6) break;
    }
    const ga = wiki.articles.filter(a => a.cls === 'GA').sort(byTitle);
    const recent = wiki.articles.filter(a => a.cls === 'B').sort(byTitle);
    const recentPick = shuffle(recent).slice(0, 3).sort(byTitle);

    main.innerHTML = `
      <h1 class="sr-only">Main Page</h1>
      <div class="mp-welcome">
        <div class="hello">Welcome to <a href="#Irad">Irad Wiki</a>,</div>
        <p>the free encyclopedia of Iradistan.</p>
        <p><a href="#Special.All">${wiki.articles.length.toLocaleString('en')}</a> articles in English</p>
      </div>
      <div class="mp-grid">
        <div class="mp-col">
          <section class="mp-box mp-green">
            <h2>From today's featured article</h2>
            ${fa ? `<div class="mp-tfa"><a href="${href(fa.slug)}"><img src="${FLAG}" alt="Flag of Irad"></a><div id="tfaText"></div><p><b>(<a href="${href(fa.slug)}">Full article…</a>)</b></p></div>
            <p class="recent">Recently featured: ${recentPick.map(a => `<a href="${href(a.slug)}">${esc(a.title)}</a>`).join(' – ')}</p>
            <div class="mp-more"><a href="#Class.FA">Featured articles</a> · <a href="#Class.GA">Good articles</a></div>` : ''}
          </section>
          <section class="mp-box mp-green">
            <h2>Did you know …</h2>
            <ul>${facts.map(f => `<li>${f}</li>`).join('')}</ul>
            <div class="mp-more"><a href="#" id="moreDyk">More facts</a> · <a href="#Special.Random">Random article</a></div>
          </section>
        </div>
        <div class="mp-col">
          <section class="mp-box mp-blue">
            <h2>Good articles</h2>
            <ul>${ga.map(a => `<li><a href="${href(a.slug)}">${esc(a.title)}</a>: ${esc(ledeOf(a).replace(new RegExp('^' + a.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '').slice(0, 110).replace(/\s+\S*$/, ''))}…</li>`).join('')}</ul>
          </section>
          <section class="mp-box mp-blue">
            <h2>Articles by quality</h2>
            <ul class="mp-classes">${CLASSES.map(c => `<li>${ICON[c.id] || ICON.dot}<a href="#Class.${c.id}">${esc(c.name)}</a><span class="n">${classCount(c.id)}</span></li>`).join('')}</ul>
          </section>
        </div>
      </div>
      <section class="mp-box mp-purple">
        <h2>Irad Wiki portals</h2>
        <div class="mp-subjects">${wiki.subjectOrder.map(s => {
          const cats = [...wiki.subjects.get(s)].sort((a, b) => b[1].length - a[1].length);
          return `<div><h3><a href="#Subject.${categorySlug(s)}">${esc(s)}</a></h3><p>${cats.slice(0, 4).map(([c]) => `<a href="#Category.${categorySlug(c)}">${esc(c)}</a>`).join(' · ')}${cats.length > 4 ? ` · <a href="#Subject.${categorySlug(s)}">more…</a>` : ''}</p></div>`;
        }).join('')}</div>
      </section>
      <div class="mp-other">
        <h2>Other areas of Irad Wiki</h2>
        <ul>
          <li><b><a href="#Special.All">All pages</a></b> – every article in the encyclopedia, A to Z.</li>
          <li><b><a href="#Special.Random">Random article</a></b> – open an article picked at random.</li>
          <li><b><a href="#Class.Stub">Stubs</a></b> – short articles waiting to be expanded.</li>
          <li><b><a href="#Irad">Irad</a></b> – the country article, with the national infobox.</li>
        </ul>
      </div>`;
    if (fa && firstPara) {
      const p = $('#tfaText');
      p.innerHTML = toHtml(firstPara);
      p.querySelectorAll('sup').forEach(s => s.remove());
    }
    $('#moreDyk').addEventListener('click', e => { e.preventDefault(); const y = scrollY; renderHome(); scrollTo(0, y); });
    return '';
  }

  /* ---------- footer ---------- */
  function renderFooter(a) {
    const vol = a ? VOLUMES[a.vol] : null;
    foot.innerHTML = `
      ${a ? `<p>This article is from ${esc(vol.label)} of the Irad Wiki (<code>${esc(vol.file)}</code>${a.number ? `, §${esc(a.number)}` : ''}, line ${a.line}).</p>` : ''}
      <p>Irad Wiki is compiled from the ${VOLUMES.length} Irad Wiki volumes: ${wiki.articles.length.toLocaleString('en')} articles in ${wiki.categories.size} categories.</p>
      <ul><li><a href="#">Main page</a></li><li><a href="#Special.All">All pages</a></li><li><a href="#Special.Random">Random article</a></li><li><a href="#Class.FA">Featured articles</a></li></ul>`;
  }

  load();
})();
