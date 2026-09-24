// Shared helpers for the public page and the editor.
const Site = {
  DRAFT_KEY: 'poster-site-draft-v1',

  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  // Tiny markdown: paragraphs, **bold**, *italic*, [text](url), line breaks.
  inline(s) {
    return Site.esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
  },
  md(s) {
    return String(s ?? '').trim().split(/\n\s*\n/).filter(Boolean)
      .map(p => `<p>${Site.inline(p.trim())}</p>`).join('');
  },

  isVideo(src) {
    return /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i.test(src || '');
  },
  mediaType(m) {
    if (m?.type === 'video' || m?.type === 'image') return m.type;
    return Site.isVideo(m?.src) ? 'video' : 'image';
  },

  get(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  },
  set(obj, path, val) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] ??= {}), obj);
    target[last] = val;
  },

  readDraft() {
    try { const s = localStorage.getItem(Site.DRAFT_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  },
  writeDraft(content) {
    try { localStorage.setItem(Site.DRAFT_KEY, JSON.stringify(content)); return true; } catch { return false; }
  },
  clearDraft() {
    try { localStorage.removeItem(Site.DRAFT_KEY); } catch {}
  },

  async loadPublished() {
    const r = await fetch('content.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(`content.json: HTTP ${r.status}`);
    return r.json();
  }
};
