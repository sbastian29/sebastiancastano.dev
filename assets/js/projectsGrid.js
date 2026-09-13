/**
 * Rejilla de proyectos y panel de detalle.
 *
 * La rejilla presenta cada proyecto con un icono que representa lo que HACE
 * -un cerebro para los agentes con LLM, un robot para la automatizacion, un
 * flujo para el streaming- sobre una cabecera con degradado. Ese icono existia
 * en la version anterior del portfolio y se recupero a peticion de Sebastian:
 * dice mas de un vistazo que un numero de orden.
 *
 * El identificador (IA_01) no desaparece, cambia de sitio: vive en el panel de
 * detalle, igual que el SP/ARC_01 de stewartpartners.studio, de donde viene la
 * idea.
 *
 * Contrato con filterEngine.js: cada tarjeta es un `.filterable-item` con
 * data-title, data-description, data-categories y data-tags. Si cambian esos
 * atributos, el filtrado deja de funcionar en silencio.
 */
(function (global) {
  'use strict';

  const PREFIJO = { ia: 'IA', data: 'DATA', automatizacion: 'AUTO', software: 'SOFT' };

  const ETIQUETA_POR_DEFECTO = {
    ia: 'IA', data: 'Datos', automatizacion: 'Automatización', software: 'Software',
  };

  const CLAVE_I18N = {
    data: 'port.cat.data',
    automatizacion: 'port.cat.auto',
    software: 'port.cat.soft',
    ia: 'port.cat.ia',
  };

  const ESTADO = {
    completado: 'Completado',
    'en-progreso': 'En curso',
    proximamente: 'Próximamente',
  };

  // Icono elegido por lo que hace el proyecto antes que por su categoria. Se
  // conserva de la version anterior del portfolio; usa Font Awesome, que el
  // sitio ya carga, en vez de traer otra familia de iconos.
  function iconoDe(proyecto) {
    const tags = proyecto.tags || [];
    if (tags.includes('kafka')) return 'fa-stream';
    if (tags.includes('airflow')) return 'fa-code-branch';
    if (tags.includes('powerbi')) return 'fa-chart-pie';
    if (tags.includes('uipath') || tags.includes('rpa')) return 'fa-robot';
    if (tags.includes('snowflake') || tags.includes('dbt')) return 'fa-snowflake';
    if (tags.includes('fastapi')) return 'fa-server';
    if (tags.includes('kotlin') || tags.includes('android')) return 'fa-mobile-alt';
    if (tags.includes('java') || tags.includes('swing')) return 'fa-hospital';
    if (tags.includes('llm') || tags.includes('agentes')) return 'fa-brain';
    if (tags.includes('druid-ai') || tags.includes('conversacional')) return 'fa-comments';
    const cat = (proyecto.categories || [])[0];
    if (cat === 'data') return 'fa-database';
    if (cat === 'automatizacion') return 'fa-robot';
    return 'fa-code';
  }

  function escapar(texto) {
    const d = document.createElement('div');
    d.textContent = texto == null ? '' : texto;
    return d.innerHTML;
  }

  function traducir(clave, respaldo) {
    if (!global.I18n || typeof global.I18n.t !== 'function') return respaldo;
    const valor = global.I18n.t(clave);
    // I18n devuelve la propia clave cuando no la encuentra: en ese caso vale
    // mas el texto en claro que un "port.cat.ia" suelto en pantalla.
    return !valor || valor === clave ? respaldo : valor;
  }

  const etiquetaCategoria = (cat) =>
    traducir(CLAVE_I18N[cat], ETIQUETA_POR_DEFECTO[cat] || cat);

  const areaDe = (p) => PREFIJO[(p.categories || [])[0]] || 'PRJ';
  const numeroDe = (i) => String(i + 1).padStart(2, '0');
  const identificador = (p, i) => `${areaDe(p)}_${numeroDe(i)}`;

  // --- Rejilla -------------------------------------------------------------

  function tarjeta(proyecto, indice) {
    const cats = proyecto.categories || [];
    const principal = cats[0] || 'software';

    const puntos = cats.map((c) =>
      `<span class="pj-cat" data-c="${escapar(c)}">${escapar(etiquetaCategoria(c))}</span>`
    ).join('');

    const estado = ESTADO[proyecto.status]
      ? `<span class="pj-estado">${escapar(
          traducir('port.status.' + proyecto.status, ESTADO[proyecto.status]))}</span>`
      : '';

    const destacado = proyecto.featured
      ? `<span class="pj-destacado">${escapar(traducir('port.featured', 'Destacado'))}</span>`
      : '';

    return `<article class="filterable-item pj-item"
             data-title="${escapar(proyecto.title)}"
             data-description="${escapar(proyecto.description)}"
             data-categories='${JSON.stringify(cats)}'
             data-tags='${JSON.stringify(proyecto.tags || [])}'>
        <button type="button" class="pj" data-cat="${escapar(principal)}"
                data-indice="${indice}">
          <span class="pj-portada">
            <i class="fas ${escapar(iconoDe(proyecto))}" aria-hidden="true"></i>
            ${destacado}
          </span>
          <span class="pj-cuerpo">
            <span class="pj-cats">${puntos}${estado}</span>
            <h3 class="pj-titulo">${escapar(proyecto.title)}</h3>
            <p class="pj-sub">${escapar(proyecto.description)}</p>
          </span>
        </button>
      </article>`;
  }

  // --- Panel de detalle ----------------------------------------------------

  function detalle(proyecto, indice) {
    const principal = (proyecto.categories || [])[0] || 'software';
    const diagrama = global.ProjectDiagram
      ? global.ProjectDiagram.construir(proyecto.technologies, principal)
      : '';

    const dato = (etiqueta, valor) => valor
      ? `<div class="dt-dato"><dt>${escapar(etiqueta)}</dt><dd>${escapar(valor)}</dd></div>`
      : '';

    const enlaces = [];
    if (proyecto.github) {
      enlaces.push(`<a href="${escapar(proyecto.github)}" target="_blank" rel="noopener noreferrer">
        <i class="fab fa-github" aria-hidden="true"></i> ${traducir('port.github', 'Ver código')}</a>`);
    }
    if (proyecto.demo) {
      enlaces.push(`<a href="${escapar(proyecto.demo)}" target="_blank" rel="noopener noreferrer">
        <i class="fas fa-external-link-alt" aria-hidden="true"></i> ${traducir('port.demo', 'Ver demo')}</a>`);
    }

    return `
      <div class="dt-visual" data-cat="${escapar(principal)}">
        <i class="fas ${escapar(iconoDe(proyecto))}" aria-hidden="true"></i>
      </div>
      <div class="dt-ficha">
        <div class="dt-scroll" data-lenis-prevent>
          <p class="dt-codigo">${escapar(identificador(proyecto, indice))}</p>
          <h2 class="dt-titulo" id="dt-titulo">${escapar(proyecto.title)}</h2>

          <dl class="dt-datos">
            ${dato(traducir('port.dt.year', 'Año'), proyecto.date)}
            ${dato(traducir('port.dt.area', 'Área'),
                   (proyecto.categories || []).map(etiquetaCategoria).join(' / '))}
            ${dato(traducir('port.dt.status', 'Estado'), ESTADO[proyecto.status])}
          </dl>

          ${diagrama ? `<section class="dt-bloque">
            <h3>${escapar(traducir('port.dt.flow', 'Recorrido del dato'))}</h3>
            ${diagrama}
          </section>` : ''}

          <section class="dt-bloque">
            <h3>${escapar(traducir('port.dt.about', 'Sobre el proyecto'))}</h3>
            <p class="dt-texto">${escapar(proyecto.longDescription || proyecto.description || '')}</p>
          </section>

          ${(proyecto.technologies || []).length ? `<section class="dt-bloque">
            <h3>${escapar(traducir('port.dt.stack', 'Stack'))}</h3>
            <div class="dt-stack">${(proyecto.technologies || [])
              .map((t) => `<span>${escapar(t)}</span>`).join('')}</div>
          </section>` : ''}

          ${enlaces.length ? `<div class="dt-enlaces">${enlaces.join('')}</div>` : ''}
        </div>
        <button type="button" class="dt-cerrar">
          ${escapar(traducir('port.dt.close', 'Cerrar'))} <span aria-hidden="true">&times;</span>
        </button>
      </div>`;
  }

  // --- Apertura y cierre ---------------------------------------------------

  let panel = null;
  let ultimoFoco = null;

  function asegurarPanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'dt';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'dt-titulo');
    panel.hidden = true;
    document.body.appendChild(panel);

    panel.addEventListener('click', (e) => {
      // Cierra con el boton o pulsando el fondo, fuera de la ficha.
      if (e.target.closest('.dt-cerrar') || e.target === panel) cerrar();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) cerrar();
    });
    return panel;
  }

  function abrir(proyecto, indice) {
    const p = asegurarPanel();
    ultimoFoco = document.activeElement;
    p.innerHTML = detalle(proyecto, indice);
    p.hidden = false;
    // Doble rAF: el navegador tiene que pintar el panel en su estado inicial
    // antes de que la transicion de entrada tenga desde donde animar.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => p.classList.add('is-abierto')));
    document.body.classList.add('dt-abierto');
    // Con el panel abierto, la pagina de detras no debe moverse.
    if (global.lenisPortfolio) global.lenisPortfolio.stop();
    const cerrarBtn = p.querySelector('.dt-cerrar');
    if (cerrarBtn) cerrarBtn.focus();
  }

  function cerrar() {
    if (!panel || panel.hidden) return;
    panel.classList.remove('is-abierto');
    document.body.classList.remove('dt-abierto');
    if (global.lenisPortfolio) global.lenisPortfolio.start();
    const dur = parseFloat(getComputedStyle(panel).transitionDuration) || 0;
    const ocultar = () => { panel.hidden = true; panel.innerHTML = ''; };
    if (dur > 0) setTimeout(ocultar, dur * 1000); else ocultar();
    // El foco vuelve a la tarjeta desde la que se abrio.
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  // --- Render --------------------------------------------------------------

  let datos = [];

  function render(proyectos, contenedor) {
    if (!contenedor) return;
    datos = proyectos || [];
    contenedor.innerHTML = datos.map(tarjeta).join('');

    // Un solo listener en el contenedor: la rejilla se repinta al cambiar de
    // idioma, y los listeners por tarjeta quedarian colgando en cada repintado.
    if (!contenedor.dataset.conectado) {
      contenedor.addEventListener('click', (e) => {
        const boton = e.target.closest('.pj');
        if (!boton) return;
        const i = parseInt(boton.dataset.indice, 10);
        if (datos[i]) abrir(datos[i], i);
      });
      contenedor.dataset.conectado = '1';
    }
  }

  global.ProjectsGrid = { render, tarjeta, identificador, abrir, cerrar, iconoDe };
})(window);
