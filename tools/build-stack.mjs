/* ──────────────────────────────────────────────────────────────────────────
   build-stack.mjs — genera el bento de "Habilidades técnicas" como HTML
   estático dentro de index.html, a partir de assets/data/stack.json.

   El HTML va escrito en el markup para que la sección se lea entera con
   JavaScript desactivado y para los rastreadores. assets/js/stack.js solo
   añade el contexto al pasar/enfocar y el interruptor de logos.

   Uso:  node tools/build-stack.mjs
   ────────────────────────────────────────────────────────────────────────── */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const data  = JSON.parse(readFileSync(join(ROOT, 'assets/data/stack.json'), 'utf8'));
const LOGOS = JSON.parse(readFileSync(join(ROOT, 'tools/logos.json'), 'utf8'));

const START = '<!-- stack:start — generado por tools/build-stack.mjs, no editar a mano -->';
const END   = '<!-- stack:end -->';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const byKey  = Object.fromEntries(data.tools.map(t => [t.key, t]));
const stage  = id => data.stages.find(s => s.id === id);
const tier   = n  => data.tools.filter(t => t.tier === n);

// ── Logos ─────────────────────────────────────────────────────────────────
// Los que existen como marca se emiten una vez en un sprite <symbol> y se
// referencian con <use>. Los que no, caen en un lettermark mono encuadrado.

const usedIcons = [...new Set(data.tools.map(t => t.icon).filter(Boolean))];

function sprite() {
  const symbols = usedIcons.map(slug =>
    `      <symbol id="lg-${slug}" viewBox="0 0 24 24"><path d="${LOGOS[slug].path}"/></symbol>`
  ).join('\n');
  return `    <svg class="bn-sprite" aria-hidden="true" focusable="false">\n${symbols}\n    </svg>`;
}

function logo(key, size) {
  const t = byKey[key];
  if (!t.icon) {
    return `<span class="bn-lg bn-lg--mark" style="--lg:${size}px" aria-hidden="true">${esc(t.mark || t.name.slice(0, 2))}</span>`;
  }
  const { hex, dark } = LOGOS[t.icon];
  // Las marcas casi negras se pintan con el color de texto para seguir
  // siendo visibles en modo oscuro y sobre las piezas invertidas.
  const style = dark ? `--lg:${size}px` : `--lg:${size}px;--c:${hex}`;
  return `<span class="bn-lg" style="${style}" aria-hidden="true"><svg${dark ? ' data-dark' : ''}><use href="#lg-${t.icon}"/></svg></span>`;
}

// ── Piezas ────────────────────────────────────────────────────────────────

function coreTile(key, area, size = '') {
  const t = byKey[key];
  const s = stage(t.stage);
  const mod = size === 'hero' ? ' bn-tile--hero' : size === 'tall' ? ' bn-tile--tall' : '';
  const hero = size === 'hero';
  // Dos medidas alimentan el ajuste tipográfico en CSS:
  //   --ch  · caracteres del nombre, para las piezas que van en una línea
  //   --wch · caracteres de la palabra más larga, para las que pueden partir
  // Se mide sobre los grupos que no pueden partirse: si el nombre trae
  // `display`, los &nbsp; marcan qué trozos viajan juntos.
  const wch = Math.max(...(t.display || t.name)
    .replace(/<br\s*\/?>/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/&nbsp;/g, ' ').length));
  return `      <article class="bn-tile bn-tile--core${mod}" style="grid-area:${area};--ch:${t.name.length};--wch:${wch}" tabindex="0" data-tool="${t.key}">
        <span class="bn-corner">${logo(key, hero ? 76 : 44)}</span>
        <span class="bn-k" data-i18n="stack.stage.${t.stage}">${esc(s.es)}</span>
        <h3 class="bn-name" data-i18n="stack.${t.key}.name">${t.display || esc(t.name)}</h3>
        <p class="bn-txt"><span data-i18n="stack.${t.key}.ctx">${esc(t.ctx.es)}</span><br><span class="bn-mono" data-i18n="stack.${t.key}.where">${esc(t.where.es)}</span></p>
      </article>`;
}

function statTile(area) {
  const n = tier(1).length;
  return `      <article class="bn-tile bn-tile--stat" style="grid-area:${area}">
        <span class="bn-k" data-i18n="stack.stat.label">${esc(data.copy.statLabel.es)}</span>
        <p class="bn-num">${n}</p>
        <p class="bn-txt bn-mono" data-i18n="stack.stat.foot">${esc(data.copy.statFoot.es)}</p>
      </article>`;
}

function puvTile(area) {
  const links = data.chain
    .map(k => `<span class="bn-chain-item">${logo(k, 14)}${esc(byKey[k].short || byKey[k].name)}</span>`)
    .join('<i aria-hidden="true">›</i>');
  return `      <article class="bn-tile bn-tile--puv" style="grid-area:${area}">
        <span class="bn-k" data-i18n="stack.puv.label">${esc(data.copy.puvLabel.es)}</span>
        <p class="bn-line" data-i18n="stack.puv.line">${esc(data.copy.puvLine.es)}</p>
        <p class="bn-chain">${links}<i aria-hidden="true">›</i><span class="bn-chain-item" data-i18n="stack.puv.end">${esc(data.copy.puvEnd.es)}</span></p>
      </article>`;
}

function focusTile(area) {
  return `      <article class="bn-tile bn-tile--focus" style="grid-area:${area}">
        <span class="bn-k" data-i18n="stack.focus.label">${esc(data.copy.focusLabel.es)}</span>
        <p class="bn-focus-line" data-i18n="stack.focus.line">${esc(data.copy.focusLine.es)}</p>
      </article>`;
}

function listTile(n, area, exclude = []) {
  const items = data.tools
    .filter(t => t.tier === n && !exclude.includes(t.key))
    .map(t => `          <li><button type="button" class="bn-item" data-tool="${t.key}">${logo(t.key, n === 2 ? 20 : 16)}<span data-i18n="stack.${t.key}.name">${esc(t.name)}</span><span class="bn-sr">. <span data-i18n="stack.${t.key}.ctx">${esc(t.ctx.es)}</span> (<span data-i18n="stack.${t.key}.where">${esc(t.where.es)}</span>)</span></button></li>`)
    .join('\n');
  return `      <article class="bn-tile bn-tile--list bn-tier-${n}" style="grid-area:${area}">
        <h3 class="bn-k" data-i18n="stack.tier.${n}">${esc(data.tiers[n].es)}</h3>
        <ul class="bn-names">
${items}
        </ul>
        <p class="bn-foot bn-mono" aria-hidden="true"></p>
      </article>`;
}

// ── Composición ───────────────────────────────────────────────────────────
// Rejilla de 6 columnas. grid-area: fila-inicio / col-inicio / fila-fin / col-fin

const grid = [
  coreTile(data.layout.hero, '1 / 1 / 3 / 4', 'hero'),
  coreTile('python',       '1 / 4 / 3 / 6', 'tall'),
  statTile(                '1 / 6 / 3 / 7'),
  coreTile('dbt',          '3 / 1 / 4 / 3'),
  coreTile('dremio',       '3 / 3 / 4 / 5'),
  coreTile('sql',          '3 / 5 / 4 / 7'),
  coreTile('as400',        '4 / 1 / 6 / 3', 'tall'),
  puvTile(                 '4 / 3 / 5 / 7'),
  focusTile(               '5 / 3 / 6 / 5'),
  coreTile('openmetadata', '5 / 5 / 6 / 7'),
  listTile(2,              '6 / 1 / 8 / 5', ['openmetadata']),
  listTile(3,              '6 / 5 / 8 / 7')
].join('\n');

const block = `${START}
${sprite()}

    <div class="bn-switch">
      <span class="bn-mono bn-switch-label" data-i18n="stack.logos.label">${esc(data.copy.logosLabel.es)}</span>
      <button type="button" id="bnLogoColor" aria-pressed="true" data-i18n="stack.logos.color">${esc(data.copy.logosColor.es)}</button>
      <button type="button" id="bnLogoMono" aria-pressed="false" data-i18n="stack.logos.mono">${esc(data.copy.logosMono.es)}</button>
    </div>

    <div class="bn-bento" id="stackBento" data-logo="color">
${grid}
    </div>
    ${END}`;

// ── Escritura ─────────────────────────────────────────────────────────────

const file = join(ROOT, 'index.html');
const html = readFileSync(file, 'utf8');
const i = html.indexOf(START);
const j = html.indexOf(END);
if (i === -1 || j === -1) {
  console.error('No encuentro los marcadores stack:start / stack:end en index.html');
  process.exit(1);
}
writeFileSync(file, html.slice(0, i) + block + html.slice(j + END.length), 'utf8');

const marks = data.tools.filter(t => !t.icon).map(t => t.name);
console.log(`bento regenerado — ${data.tools.length} herramientas (${tier(1).length}/${tier(2).length}/${tier(3).length})`);
console.log(`logos de marca: ${usedIcons.length} · lettermarks: ${marks.length} (${marks.join(', ')})`);
