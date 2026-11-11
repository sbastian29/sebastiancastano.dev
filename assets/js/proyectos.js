/* ── Proyectos · carrusel de categorías ───────────────────────────────
   - El scroll vertical mueve la pista en horizontal (función pura de
     scrollY: funciona igual con rueda, barra, teclado o recarga a medias).
   - Las ilustraciones (assets/ilustraciones/*.svg) se insertan en línea,
     en pausa, y se disparan al entrar en pantalla.
   - Clic en una categoría: abre sus proyectos debajo del carrusel.
   Contrato con la página: escucha `projects:loaded` (detail = proyectos)
   y llama a window.renderProjectCards(categoria).
   ─────────────────────────────────────────────────────────────────── */
(() => {
  const px = document.getElementById('px');
  if (!px) return;
  document.documentElement.classList.add('px-js');

  const stage = px.querySelector('.px-stage');
  const viewport = px.querySelector('.px-viewport');
  const track = px.querySelector('.px-track');
  const cats = [...px.querySelectorAll('.px-cat')];
  const lista = document.getElementById('pxLista');
  const listMode = window.matchMedia('(max-width: 899px), (prefers-reduced-motion: reduce)');

  // ── Textos (ES/EN) ──────────────────────────────────────────────────
  const STR = {
    es: {
      index: 'Índice · 2024 / 2026', title: 'Proyectos', sub: 'TRABAJO SELECCIONADO',
      text: 'Datos, IA, desarrollo y automatización. Del sistema origen al modelo y a la interfaz.',
      metaCats: '04 categorías', projects: 'proyectos', project: 'proyecto', see: 'Ver',
      hint: 'Desplaza ↓ para avanzar →', word: 'OBRA', ver: 'VER',
      category: 'Categoría', back: '↑ Categorías',
      ia: 'Inteligencia artificial', data: 'Data', software: 'Desarrollo', automatizacion: 'Automatización',
    },
    en: {
      index: 'Index · 2024 / 2026', title: 'Projects', sub: 'SELECTED WORK',
      text: 'Data, AI, development and automation. From the source system to the model and the interface.',
      metaCats: '04 categories', projects: 'projects', project: 'project', see: 'View',
      hint: 'Scroll ↓ to move →', word: 'WORK', ver: 'VIEW',
      category: 'Category', back: '↑ Categories',
      ia: 'Artificial intelligence', data: 'Data', software: 'Development', automatizacion: 'Automation',
    },
  };
  const s = () => STR[(window.I18n && window.I18n.getLang()) === 'en' ? 'en' : 'es'];
  let projects = [], open = null;
  const inCat = cat => projects.filter(p => (p.categories || []).includes(cat));
  const pad = n => String(n).padStart(2, '0');

  function paint() {
    const t = s();
    document.querySelectorAll('[data-px]').forEach(el => { el.textContent = t[el.dataset.px]; });
    cats.forEach(c => {
      const n = inCat(c.dataset.cat).length;
      c.querySelector('[data-count]').textContent = projects.length ? `${t.see} ${n} ${n === 1 ? t.project : t.projects}` : '';
    });
    const total = document.getElementById('pxTotal');
    if (projects.length) total.textContent = `${pad(projects.length)} ${t.projects}`;
    if (open) {
      document.getElementById('pxListaKicker').textContent = `${t.category} ${pad(cats.findIndex(c => c.dataset.cat === open) + 1)} · ${inCat(open).length} ${t.projects}`;
      document.getElementById('pxListaTitle').textContent = t[open];
    }
    measure();
  }

  // ── Scroll vertical → desplazamiento horizontal ─────────────────────
  // Todo en píxeles de pantalla (getBoundingClientRect): la sección va
  // escalada con zoom y las medidas offset* no lo tienen en cuenta igual
  // en todos los navegadores.
  const w = el => el.getBoundingClientRect().width;
  const left = cat => cat.getBoundingClientRect().left - track.getBoundingClientRect().left;
  const counter = document.getElementById('pxNow');
  let start = 0, dist = 0, z = 1;
  function measure() {
    if (listMode.matches) { px.style.height = ''; track.style.transform = ''; track.style.paddingRight = ''; return; }
    px.style.height = '';
    z = w(track) / track.offsetWidth || 1;
    const header = document.querySelector('.header');
    // La última columna acaba alineada a la izquierda, como empieza la primera.
    track.style.paddingRight = `${Math.max(32, (w(viewport) - w(cats[cats.length - 1])) / z)}px`;
    dist = Math.max(0, w(track) - w(viewport));
    start = px.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0);
    px.style.height = `${stage.getBoundingClientRect().height + dist}px`;
    update();
  }
  function update() {
    if (listMode.matches) return;
    const x = Math.min(dist, Math.max(0, window.scrollY - start));
    track.style.transform = `translate3d(${-x / z}px,0,0)`;
    px.style.setProperty('--px-p', dist ? x / dist : 0);
    // Categoría en curso: la última cuyo borde izquierdo ya cruzó el centro.
    const mid = x + w(viewport) / 2;
    const now = cats.reduce((n, c, i) => (left(c) <= mid ? i : n), 0);
    counter.textContent = `${pad(now + 1)} / ${pad(cats.length)}`;
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  listMode.addEventListener('change', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  // Con teclado: al enfocar una categoría fuera de vista, lleva el scroll hasta ella.
  track.addEventListener('focusin', e => {
    const cat = e.target.closest('.px-cat');
    // Solo con teclado: con ratón el salto movería la columna bajo el puntero y se perdería el clic.
    if (!cat || listMode.matches || !cat.matches(':focus-visible')) return;
    viewport.scrollLeft = 0;   // el navegador puede haber desplazado el contenedor al enfocar
    const r = cat.getBoundingClientRect(), v = viewport.getBoundingClientRect();
    if (r.left < v.left || r.right > v.right) window.scrollTo({ top: start + Math.min(dist, left(cat)) });
  });

  // ── Ilustraciones: en línea, en pausa hasta que la columna entra ────
  cats.forEach(cat => {
    const panel = cat.querySelector('.px-cat__panel');
    fetch(`assets/ilustraciones/${panel.dataset.ill}.svg`)
      .then(r => (r.ok ? r.text() : Promise.reject(r.status)))
      .then(svg => {
        panel.innerHTML = svg;
        const el = panel.querySelector('svg');
        el.setAttribute('data-trazo', 'hilo');
        if (!cat.dataset.seen) el.setAttribute('data-state', 'espera');
      })
      .catch(() => {});   // sin ilustración el panel queda liso; el resto funciona
  });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const cat = e.target;
    io.unobserve(cat);
    cat.classList.add('is-in');
    // El dibujo arranca cuando el panel ya ha crecido.
    setTimeout(() => {
      cat.dataset.seen = '1';
      const el = cat.querySelector('svg');
      if (el) el.removeAttribute('data-state');
    }, 700);
  }), { threshold: 0.2 });
  cats.forEach(c => io.observe(c));
  requestAnimationFrame(() => px.querySelector('.px-intro').classList.add('is-in'));

  // ── Cursor: círculo con "VER" sobre las categorías ──────────────────
  const cursor = () => document.getElementById('custom-cursor');
  cats.forEach(cat => {
    cat.addEventListener('mouseenter', () => {
      const c = cursor();
      if (c) { c.dataset.label = s().ver; c.classList.add('cursor-ver'); }
    });
    cat.addEventListener('mouseleave', () => { const c = cursor(); if (c) c.classList.remove('cursor-ver'); });
  });

  // ── Abrir los proyectos de una categoría ────────────────────────────
  cats.forEach(cat => cat.addEventListener('click', e => {
    e.preventDefault();
    open = cat.dataset.cat;
    lista.hidden = false;
    if (window.renderProjectCards) window.renderProjectCards(open);
    paint();
    lista.scrollIntoView({ behavior: listMode.matches ? 'auto' : 'smooth' });
    document.getElementById('pxListaTitle').focus({ preventScroll: true });
  }));
  document.getElementById('pxBack').addEventListener('click', () => {
    const i = cats.findIndex(c => c.dataset.cat === open);
    window.scrollTo({ top: listMode.matches ? cats[i].offsetTop : start + Math.min(dist, left(cats[i])), behavior: listMode.matches ? 'auto' : 'smooth' });
    cats[i].focus({ preventScroll: true });
  });

  document.addEventListener('projects:loaded', e => { projects = e.detail || []; paint(); });
  document.addEventListener('i18n:applied', paint);
  paint();
})();
