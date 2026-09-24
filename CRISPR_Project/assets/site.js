// Renders content.json (or the editor's draft in preview mode) into index.html.
(function () {
  const $ = s => document.querySelector(s);
  const { esc, md, inline, mediaType } = Site;
  const isPreview = new URLSearchParams(location.search).has('preview');

  function mediaHTML(m, { eager = false } = {}) {
    const type = mediaType(m);
    const cap = m.caption ? `<figcaption>${inline(m.caption)}</figcaption>` : '';
    if (!m.src) {
      const label = type === 'video' ? 'Video coming soon' : 'Image coming soon';
      const icon = type === 'video'
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 17l4-5 3 4 2-2 3 3z"/><circle cx="16" cy="9" r="1.6"/></svg>';
      return `<figure class="media"><div class="placeholder">${icon}<span>${label}</span></div>${cap}</figure>`;
    }
    const alt = esc(m.alt || m.caption || '');
    if (type === 'video') {
      return `<figure class="media"><video src="${esc(m.src)}" controls playsinline preload="metadata" muted></video>${cap}</figure>`;
    }
    return `<figure class="media"><button class="zoom" data-src="${esc(m.src)}" data-cap="${esc(m.caption || '')}" aria-label="Enlarge image"><img src="${esc(m.src)}" alt="${alt}" ${eager ? '' : 'loading="lazy"'}></button>${cap}</figure>`;
  }

  function initials(name) {
    return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  function render(c) {
    document.querySelectorAll('[data-bind]').forEach(el => { el.textContent = Site.get(c, el.dataset.bind) ?? ''; });
    document.title = c.meta?.title || document.title;

    const hero = c.hero || {};
    $('#hero-media').outerHTML = `<div id="hero-media">${(hero.src || hero.caption) ? mediaHTML(hero, { eager: true }) : ''}</div>`;

    $('#overview-body').innerHTML = md(c.overview?.body);

    $('#methods-list').innerHTML = (c.methods || []).map((m, i) => `
      <li class="method">
        <div class="method-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="method-body">
          <h3>${esc(m.title)}</h3>
          <div class="prose">${md(m.what)}</div>
          ${m.why ? `<div class="why"><span class="why-label">Why this method?</span>${md(m.why)}</div>` : ''}
          ${(m.media || []).length ? `<div class="method-media">${m.media.map(x => mediaHTML(x)).join('')}</div>` : ''}
        </div>
      </li>`).join('');

    $('#results-intro').innerHTML = md(c.results?.intro);
    $('#gallery').innerHTML = (c.results?.media || []).map(x => mediaHTML(x)).join('');

    $('#authors').innerHTML = (c.authors || []).map(a => `
      <article class="author">
        ${a.photo ? `<img class="avatar" src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy">` : `<div class="avatar initials" aria-hidden="true">${esc(initials(a.name))}</div>`}
        <div>
          <h3>${esc(a.name)}</h3>
          ${a.role ? `<p class="role">${esc(a.role)}</p>` : ''}
          ${a.affiliation ? `<p class="aff">${esc(a.affiliation)}</p>` : ''}
          ${a.bio ? `<div class="bio">${md(a.bio)}</div>` : ''}
          ${a.email ? `<a class="mail" href="mailto:${esc(a.email)}">${esc(a.email)}</a>` : ''}
        </div>
      </article>`).join('');

    $('#ack').innerHTML = c.acknowledgements ? `<h3>Acknowledgements</h3>${md(c.acknowledgements)}` : '';

    $('#refs').innerHTML = (c.references || []).map(r => `
      <li>${inline(r.text)}${r.url ? ` <a class="ref-link" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace(/^https?:\/\/(dx\.)?/, ''))}</a>` : ''}</li>`).join('');
  }

  // Lightbox for images
  const lb = $('#lightbox');
  document.addEventListener('click', e => {
    const z = e.target.closest('.zoom');
    if (z) {
      lb.querySelector('img').src = z.dataset.src;
      lb.querySelector('.lb-cap').textContent = z.dataset.cap;
      lb.showModal();
    } else if (e.target === lb || e.target.closest('.lb-close')) {
      lb.close();
    }
  });

  // Live updates from the editor's preview iframe
  window.addEventListener('message', e => {
    if (e.origin === location.origin && e.data?.type === 'preview-content') render(e.data.content);
  });

  (async () => {
    let content = null;
    if (isPreview) {
      content = Site.readDraft();
      $('#preview-banner').hidden = !content || window.self !== window.top;
    }
    if (!content) {
      try { content = await Site.loadPublished(); }
      catch (err) {
        document.querySelector('main').innerHTML = `<p class="wrap section">Could not load content (${esc(err.message)}). If you opened this file directly, start a local server instead (see README).</p>`;
        return;
      }
    }
    render(content);
  })();
})();
