/**
 * Diagrama de arquitectura generado desde el stack de cada proyecto.
 *
 * Ninguno de los proyectos tiene foto, y para un perfil tecnico una imagen
 * decorativa no aporta nada: lo que un lead engineer quiere ver de un pipeline
 * es por donde pasa el dato. El diagrama se construye desde el campo
 * `technologies` que ya vive en projects.json, asi que no hay nada que
 * mantener aparte de los datos.
 *
 * Cada tecnologia se clasifica en una etapa del flujo. Las que no participan
 * en el recorrido del dato (Docker, Maven) se muestran aparte como base, para
 * no fingir un orden que no existe.
 */
(function (global) {
  'use strict';

  // Etapa de cada tecnologia dentro del flujo. La clave se compara en
  // minusculas contra el nombre tal cual aparece en projects.json.
  const ETAPAS = {
    // Origen del dato
    'sharepoint': 'fuente', 'jira api': 'fuente', 'easyvista': 'fuente',
    'apis rest': 'fuente', 'apache kafka': 'fuente', 'kafka': 'fuente',

    // Transformacion y logica
    'python': 'proceso', 'airflow': 'proceso', 'dbt': 'proceso',
    'apache spark': 'proceso', 'spark': 'proceso', 'uipath': 'proceso',
    'power automate': 'proceso', 'scikit-learn': 'proceso', 'xgboost': 'proceso',
    'druid ai': 'proceso', 'gpt': 'proceso', 'openai api': 'proceso',
    'gemini api': 'proceso', 'groq': 'proceso', 'prompt engineering': 'proceso',
    'java': 'proceso', 'kotlin': 'proceso',

    // Persistencia
    'snowflake': 'almacen', 'postgresql': 'almacen', 'mongodb': 'almacen',
    'hadoop': 'almacen', 'hive': 'almacen', 'sqlite': 'almacen',
    'sql (oracle)': 'almacen',

    // Lo que ve el usuario final
    'power bi': 'salida', 'seaborn': 'salida', 'jaspersoft': 'salida',
    'jetpack compose': 'salida', 'swing': 'salida',

    // Transversales: no van en el flujo
    'docker': 'base', 'maven': 'base'
  };

  const ORDEN = ['fuente', 'proceso', 'almacen', 'salida'];

  const NOMBRE_CORTO = {
    'apache kafka': 'Kafka', 'apache spark': 'Spark', 'openai api': 'OpenAI',
    'gemini api': 'Gemini', 'jira api': 'Jira', 'scikit-learn': 'sklearn',
    'prompt engineering': 'Prompting', 'jetpack compose': 'Compose',
    'sql (oracle)': 'Oracle', 'apis rest': 'REST', 'power automate': 'P. Automate'
  };

  function etapaDe(tecnologia) {
    return ETAPAS[tecnologia.toLowerCase()] || 'proceso';
  }

  function nombreDe(tecnologia) {
    return NOMBRE_CORTO[tecnologia.toLowerCase()] || tecnologia;
  }

  /**
   * Agrupa el stack por etapa, conservando el orden del flujo.
   * Devuelve { columnas: [[tec, ...], ...], base: [tec, ...] }
   */
  function agrupar(tecnologias) {
    const porEtapa = {};
    const base = [];

    (tecnologias || []).forEach(tec => {
      const etapa = etapaDe(tec);
      if (etapa === 'base') {
        base.push(tec);
        return;
      }
      (porEtapa[etapa] = porEtapa[etapa] || []).push(tec);
    });

    const columnas = ORDEN
      .filter(etapa => porEtapa[etapa])
      // Tres por columna como maximo: mas apila cajas ilegibles en movil.
      .map(etapa => ({ etapa, tecnologias: porEtapa[etapa].slice(0, 3) }));

    return { columnas, base };
  }

  function escapar(texto) {
    const d = document.createElement('div');
    d.textContent = texto;
    return d.innerHTML;
  }

  /**
   * Devuelve el HTML del diagrama de un proyecto.
   * @param {string[]} tecnologias  campo `technologies` de projects.json
   * @param {string}   categoria    categoria principal, para el color
   */
  function construir(tecnologias, categoria) {
    const { columnas, base } = agrupar(tecnologias);
    if (columnas.length === 0) return '';

    // Con una sola etapa no hay recorrido que dibujar. Una flecha suelta o una
    // caja aislada sugieren un flujo que no existe, asi que el stack se muestra
    // como conjunto y ya esta: el diagrama debe describir el proyecto, no
    // adornarlo.
    if (columnas.length === 1) {
      const nodos = columnas[0].tecnologias
        .map(tec => `<span class="dg-nodo">${escapar(nombreDe(tec))}</span>`)
        .join('');
      return `<div class="dg dg--conjunto" data-cat="${escapar(categoria || '')}" aria-hidden="true">
                <div class="dg-flujo">
                  <div class="dg-col" data-etapa="${columnas[0].etapa}">${nodos}</div>
                </div>
                ${base.length ? `<div class="dg-base">${base.map(tec =>
                  `<span class="dg-chip">${escapar(nombreDe(tec))}</span>`).join('')}</div>` : ''}
              </div>`;
    }

    const etapas = columnas.map(col => `
      <div class="dg-col" data-etapa="${col.etapa}">
        ${col.tecnologias.map(tec =>
          `<span class="dg-nodo">${escapar(nombreDe(tec))}</span>`
        ).join('')}
      </div>
    `).join('<span class="dg-flecha" aria-hidden="true"></span>');

    const banda = base.length
      ? `<div class="dg-base">${base.map(tec =>
           `<span class="dg-chip">${escapar(nombreDe(tec))}</span>`
         ).join('')}</div>`
      : '';

    // El diagrama es decorativo respecto al texto: el stack completo se lista
    // en la ficha, asi que aqui se oculta a los lectores de pantalla para no
    // leer dos veces lo mismo.
    return `<div class="dg" data-cat="${escapar(categoria || '')}" aria-hidden="true">
              <div class="dg-flujo">${etapas}</div>
              ${banda}
            </div>`;
  }

  global.ProjectDiagram = { construir, agrupar, etapaDe };
})(window);
