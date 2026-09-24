/* ===================================================================
   stack.js — comportamiento de la rejilla de habilidades técnicas

   La rejilla y todos los nombres ya están en el markup de index.html
   (los genera tools/build-stack.mjs). Este archivo solo añade:
     · el contexto de cada herramienta al pasar o enfocar
     · el interruptor de logos en color / monocromo
     · la traducción al inglés desde assets/data/stack.json

   Sin este archivo la sección se lee entera igualmente.
   =================================================================== */

(function () {
  'use strict';

  const bento = document.getElementById('stackBento');
  if (!bento) return;

  // ── Contexto al pasar o enfocar ────────────────────────────────────
  // El texto ya vive dentro de cada botón (visible + .bn-sr), así que el
  // pie se rellena leyendo el propio botón y queda siempre en el idioma
  // que I18n haya aplicado.

  bento.querySelectorAll('.bn-tile--list').forEach(tile => {
    const foot  = tile.querySelector('.bn-foot');
    const items = tile.querySelectorAll('.bn-item');
    if (!foot || !items.length) return;

    let pinned = null;

    // El lettermark de las herramientas sin logo ("Ic", "OM") también es
    // texto, así que se descartan los nodos marcados como decorativos.
    const label = btn => [...btn.childNodes]
      .filter(n => !(n.nodeType === 1 && n.getAttribute('aria-hidden') === 'true'))
      .map(n => n.textContent)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();

    const show = btn => { foot.textContent = label(btn); };
    const rest = () => { if (pinned) show(pinned); else foot.textContent = ''; };

    items.forEach(btn => {
      btn.addEventListener('mouseenter', () => show(btn));
      btn.addEventListener('focus', () => show(btn));
      btn.addEventListener('blur', rest);

      // En táctil no hay hover: el toque fija el contexto en el pie.
      btn.addEventListener('click', () => {
        const same = pinned === btn;
        items.forEach(b => b.removeAttribute('aria-current'));
        pinned = same ? null : btn;
        if (pinned) pinned.setAttribute('aria-current', 'true');
        rest();
      });
    });

    tile.querySelector('.bn-names').addEventListener('mouseleave', rest);
  });

  // ── Interruptor de logos ───────────────────────────────────────────
  // El valor por defecto vive en data-logo del markup ("color").

  const swColor = document.getElementById('bnLogoColor');
  const swMono  = document.getElementById('bnLogoMono');

  if (swColor && swMono) {
    const setMode = (mode, persist) => {
      bento.dataset.logo = mode;
      swColor.setAttribute('aria-pressed', String(mode === 'color'));
      swMono.setAttribute('aria-pressed', String(mode === 'mono'));
      if (persist) { try { localStorage.setItem('stack_logo', mode); } catch (_) {} }
    };

    let saved = null;
    try { saved = localStorage.getItem('stack_logo'); } catch (_) {}
    if (saved === 'color' || saved === 'mono') setMode(saved, false);

    swColor.addEventListener('click', () => setMode('color', true));
    swMono.addEventListener('click', () => setMode('mono', true));
  }

  // ── Inglés ─────────────────────────────────────────────────────────
  // El markup está en español. Para el resto del mundo se cargan las
  // cadenas de stack.json y se vuelve a aplicar I18n.

  (window.i18nReady || Promise.resolve('es')).then(lang => {
    if (lang !== 'en' || !window.I18n || !window.I18n.register) return;

    fetch('assets/data/stack.json')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(data => {
        const keys = {};
        data.stages.forEach(s => { keys['stack.stage.' + s.id] = s.en; });
        Object.entries(data.tiers).forEach(([n, v]) => { keys['stack.tier.' + n] = v.en; });
        data.tools.forEach(t => {
          keys['stack.' + t.key + '.name']  = t.display || t.name;
          keys['stack.' + t.key + '.ctx']   = t.ctx.en;
          keys['stack.' + t.key + '.where'] = t.where.en;
        });
        const c = data.copy;
        Object.assign(keys, {
          'stack.logos.label': c.logosLabel.en,
          'stack.logos.color': c.logosColor.en,
          'stack.logos.mono':  c.logosMono.en,
          'stack.stat.label':  c.statLabel.en,
          'stack.stat.foot':   c.statFoot.en,
          'stack.puv.label':   c.puvLabel.en,
          'stack.puv.line':    c.puvLine.en,
          'stack.puv.end':     c.puvEnd.en,
          'stack.focus.label': c.focusLabel.en,
          'stack.focus.line':  c.focusLine.en
        });
        window.I18n.register('en', keys);
        window.I18n.apply();
      })
      .catch(err => console.warn('stack.json no disponible, se mantiene el español:', err.message));
  });

})();
