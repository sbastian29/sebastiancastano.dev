// ── Ilustraciones line art del carrusel ─────────────────────────────
// Genera assets/ilustraciones/{ia,data,desarrollo,automatizacion}.svg
// y ilustraciones-preview.html (autocontenido, con los SVG en línea).
// Uso: node tools/build-illustrations.mjs
//
// Contrato de cada SVG:
//   - Se anima solo al cargarse (dibujo con stroke-dashoffset, luego bucle).
//   - data-state="espera" en el <svg> lo deja en pausa en el fotograma 0;
//     quitar el atributo lo dispara (viewport, slide activo).
//   - data-trazo="hilo" cambia al trazo fino uniforme; sin atributo, "tinta".
//   - prefers-reduced-motion: dibujo completo y quieto.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'ilustraciones');

// ── Utilidades ──────────────────────────────────────────────────────
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + (b - a) * rnd();
const f = n => +n.toFixed(1);
const lerp = (a, b, u) => a + (b - a) * u;

// Tramos más gruesos sobre la misma línea: simulan la presión de la mano.
const pesoDash = () => {
  const v = [0, R(.04, .1), R(.08, .16), R(.14, .26), R(.05, .1), R(.2, .3), R(.1, .18)];
  return v.map(n => n.toFixed(2)).join(' ') + ' 1';
};

const line = (id, d, { t = 0, dur = 2, cls = '', peso = false, lin = false } = {}) => {
  let s = `<path id="${id}" class="l d${cls ? ' ' + cls : ''}" d="${d}" pathLength="1" style="--t:${f(t)}s;--d:${f(dur)}s${lin ? ';animation-timing-function:linear' : ''}"/>`;
  if (peso) s += `\n<path class="l peso" d="${d}" pathLength="1" stroke-dasharray="${pesoDash()}" style="--t:${f(t + dur * .7)}s"/>`;
  return s;
};

const baseCss = ID => `
#${ID} .l{fill:none;stroke:#fff;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
#${ID} .f{stroke-width:1.05}
#${ID} .d{stroke-dasharray:1 3;animation:${ID}-draw var(--d,2s) cubic-bezier(.45,0,.2,1) var(--t,0s) both}
#${ID} .peso{stroke-width:2.7;animation:${ID}-fade 1.8s ease var(--t,0s) both}
#${ID} .ap{animation:${ID}-fade 1.4s ease var(--t,0s) both}
#${ID} .luz{fill:#fff;stroke:none}
#${ID} .mano{filter:url(#${ID}-tinta)}
#${ID}[data-trazo="hilo"] .mano{filter:url(#${ID}-hilo)}
#${ID}[data-trazo="hilo"] .l{stroke-width:1.2}
#${ID}[data-trazo="hilo"] .peso{display:none}
@keyframes ${ID}-draw{from{stroke-dashoffset:1.15}to{stroke-dashoffset:0}}
@keyframes ${ID}-fade{from{opacity:0}}`;

const tailCss = ID => `
#${ID}[data-state="espera"] *{animation-play-state:paused!important}
@media (prefers-reduced-motion:reduce){#${ID} *{animation:none!important}}`;

const svg = (name, title, desc, css, body) => {
  const ID = `ill-${name}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" id="${ID}" class="ill" viewBox="0 0 1200 800" role="img" aria-labelledby="${ID}-t ${ID}-d">
<title id="${ID}-t">${title}</title>
<desc id="${ID}-d">${desc}</desc>
<defs>
<style>${baseCss(ID)}${css.replaceAll('ID', ID)}${tailCss(ID)}
</style>
<filter id="${ID}-tinta" filterUnits="userSpaceOnUse" x="0" y="0" width="1200" height="800">
<feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="1" seed="4" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
<feGaussianBlur stdDeviation="0.35"/>
</filter>
<filter id="${ID}-hilo" filterUnits="userSpaceOnUse" x="0" y="0" width="1200" height="800">
<feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="1" seed="4"/>
<feDisplacementMap in="SourceGraphic" scale="4" xChannelSelector="R" yChannelSelector="G"/>
<feGaussianBlur stdDeviation="0.3"/>
</filter>
</defs>
<rect id="${name}-fondo" width="1200" height="800" fill="#000"/>
${body}
</svg>
`;
};

// ── 1. IA · Multitud que piensa ─────────────────────────────────────
function ia() {
  const figs = [];
  for (let i = 0; i < 46; i++) figs.push({ x: R(60, 1140), y: R(672, 750) });
  figs.sort((a, b) => a.y - b.y);

  const crowd = figs.map((p, i) => {
    const s = f(0.8 + (p.y - 672) / 78 * 0.6);
    const t = f(R(0, 2.4)), sw = f(R(.9, 1.3));
    const st = `style="--t:${t}s;--d:.9s"`;
    return `<g id="ia-figura-${i + 1}" transform="translate(${f(p.x)} ${f(p.y)}) scale(${s})">
<g class="anda" style="--px:${f(R(-46, 46))}px;--py:${f(R(-5, 5))}px;--pd:${f(R(7, 13))}s;--pt:${f(R(8.5, 10.5))}s">
<path class="l d" pathLength="1" ${st} d="M0 -17.6a3.1 3.3 0 1 1 -.1 0"/>
<path class="l d" pathLength="1" ${st} d="M0 -14.2C.8 -10 -.6 -5 0 0M0 -12.4l${rnd() > .5 ? 3 : -3} 6.4"/>
<g class="pierna" style="--sw:${sw}s"><path class="l d" pathLength="1" ${st} d="M0 0L-2.4 10.6"/></g>
<g class="pierna b" style="--sw:${sw}s"><path class="l d" pathLength="1" ${st} d="M0 0L2.4 10.6"/></g>
</g></g>`;
  }).join('\n');

  // Trayectorias: del suelo al cuello y de ahí se abren dentro del cráneo.
  const byX = [...figs].sort((a, b) => a.x - b.x);
  const n = 13;
  const tr = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const p = byX[Math.round(lerp(1, byX.length - 2, u))];
    const sx = p.x, sy = p.y + 13;
    const xe = lerp(516, 632, u), dir = xe > sx ? 1 : -1;
    const mx = sx + dir * 58, my = sy - 4;
    const xm = lerp(528, 624, u) + R(-5, 5), j = R(-7, 7);
    const a = lerp(172, 14, u) * Math.PI / 180, r = lerp(104, 96, Math.abs(u - .5) * 2);
    const tx = 590 + r * Math.cos(a), ty = 302 - r * Math.sin(a);
    const d = `M${f(sx)} ${f(sy)}c${dir * 18} -7 ${dir * 38} 5 ${dir * 58} -4`
      + `C${f(lerp(mx, xe, .55))} ${f(my - 22)} ${f(xe - dir * 34)} 694 ${f(xe)} 604`
      + `C${f(xe + j)} 556 ${f(xm - j)} 524 ${f(xm)} ${f(484 + j)}`
      + `C${f(xm + j)} 430 ${f(590 + (r - 56) * Math.cos(a))} ${f(312 - (r - 56) * Math.sin(a))} ${f(tx)} ${f(ty)}`;
    const t = 2.6 + R(0, 1.6), dur = R(4, 5);
    tr.push(line(`ia-trayectoria-${i + 1}`, d, { t, dur, cls: 'f' })
      + `\n<path class="l pulso" pathLength="1" d="${d}" style="--t:${f(13 + R(0, 6))}s;--d:${f(R(5, 8))}s"/>`
      + `\n<circle id="ia-idea-${i + 1}" class="luz ap" cx="${f(tx)}" cy="${f(ty)}" r="2.3" style="--t:${f(t + dur - .4)}s"/>`);
  }

  const perfil = 'M505 612C500 562 520 522 500 470C470 420 440 370 452 300C464 200 540 140 620 140'
    + 'C680 140 722 175 728 230C730 255 722 268 728 285C738 310 762 335 772 352C776 362 760 368 744 370'
    + 'C740 378 752 384 750 392C748 398 740 400 744 406C750 414 748 422 740 428C734 440 752 452 742 468'
    + 'C732 486 690 492 660 484C640 480 632 520 640 612';

  const css = `
#ID .anda{animation:ID-anda var(--pd) ease-in-out var(--pt) infinite alternate}
#ID .pierna{animation:ID-paso var(--sw) linear 3.4s infinite}
#ID .pierna.b{animation-direction:reverse}
#ID .pulso{stroke-width:2.4;stroke-dasharray:.025 1;opacity:0;animation:ID-pulso var(--d) cubic-bezier(.5,0,.6,1) var(--t) infinite}
#ID #ia-ojo{animation:ID-draw 1.4s ease 12.2s both}
@keyframes ID-anda{to{transform:translate(var(--px),var(--py))}}
@keyframes ID-paso{0%,100%{transform:rotate(0)}25%{transform:rotate(15deg)}75%{transform:rotate(-15deg)}}
@keyframes ID-pulso{from{opacity:1;stroke-dashoffset:.025}to{opacity:1;stroke-dashoffset:-1}}`;

  return svg('ia', 'Multitud que piensa',
    'Decenas de figuras diminutas caminan; sus trayectorias suben, se juntan y dibujan el perfil sereno de una cabeza.',
    css, `<g class="mano">
<g id="ia-multitud">
${crowd}
</g>
<g id="ia-trayectorias">
${tr.join('\n')}
</g>
<g id="ia-cabeza">
${line('ia-perfil', perfil, { t: 7.4, dur: 5.2, peso: true })}
<path id="ia-ojo" class="l d f" pathLength="1" d="M693 301C700 308 711 308 719 300"/>
</g>
</g>`);
}

// ── 2. DATA · Constelación ──────────────────────────────────────────
function data() {
  const FX = 372, FY = 607, FS = 1.05;
  const hand = [FX + 42 * FS, FY - 188 * FS];
  // La constelación ya unida es una ballena que cruza el cielo.
  const P = {
    1: [1070, 235], 2: [1010, 170], 3: [900, 130], 4: [780, 150], 5: [670, 215], 6: [610, 262], 7: [548, 215],
    8: [572, 268], 9: [540, 318], 10: [700, 285], 11: [830, 300], 12: [960, 290], 13: [800, 352],
  };
  const route = [9, 8, 7, 6, 5, 4, 3, 2, 1, 12, 11, 13, 11, 10, 6, 9];
  let d = `M${f(hand[0])} ${f(hand[1])}C${f(hand[0] + 6)} ${f(hand[1] - 62)} ${P[9][0] - 72} ${P[9][1] + 52} ${P[9][0]} ${P[9][1]}`;
  const seg = [Math.hypot(P[9][0] - hand[0], P[9][1] - hand[1]) * 1.1];
  for (let i = 1; i < route.length; i++) {
    const [ax, ay] = P[route[i - 1]], [bx, by] = P[route[i]];
    const len = Math.hypot(bx - ax, by - ay), k = (i % 2 ? 5 : -4) / len;
    d += `Q${f((ax + bx) / 2 - (by - ay) * k)} ${f((ay + by) / 2 + (bx - ax) * k)} ${bx} ${by}`;
    seg.push(len);
  }
  const total = seg.reduce((a, b) => a + b, 0), T0 = 5.8, TD = 9.5, LOOP = f(T0 + TD + .6);
  const reach = {};
  let acc = 0;
  route.forEach((id, i) => { acc += seg[i]; if (!(id in reach)) reach[id] = T0 + TD * acc / total - .15; });
  const spark = r => `M0 ${-r}Q0 0 ${r} 0Q0 0 0 ${r}Q0 0 ${-r} 0Q0 0 0 ${-r}Z`;
  const cons = Object.entries(P).map(([id, [x, y]]) =>
    `<g class="ap" transform="translate(${x} ${y})" style="--t:${f(R(.8, 3.6))}s"><path id="data-estrella-${id}" class="luz enciende" d="${spark([1, 3, 7].includes(+id) ? 11 : 7.5)}" style="--t:${f(reach[id])}s"/></g>`).join('\n');

  // Caos: polvo de estrellas por todo el cielo, lejos de la colina y de la figura.
  const loose = [];
  while (loose.length < 78) {
    const x = R(20, 1180), y = R(20, 640);
    if (y > (x < 620 ? 540 : 650) || (x > 310 && x < 480 && y > 380)) continue;
    const i = loose.length, big = i % 9 === 0;
    loose.push(`<g class="ap" style="--t:${f(R(.3, 5))}s;opacity:${f(R(.45, 1))}"><${big
      ? `path transform="translate(${f(x)} ${f(y)})" d="${spark(R(4, 6.5).toFixed(1))}"`
      : `circle cx="${f(x)}" cy="${f(y)}" r="${R(.6, 1.9).toFixed(1)}"`} id="data-suelta-${i + 1}" class="luz titila" style="--t:${f(R(5, 9))}s;--d:${f(R(2.2, 5))}s"/></g>`);
  }
  const spout = [[1040, 72], [984, 70], [1062, 120]].map(([x, y], i) =>
    `<g class="ap" style="--t:${f(2 + i)}s"><circle id="data-soplo-${i + 1}" class="luz titila" cx="${x}" cy="${y}" r="1.8" style="--t:${6 + i}s;--d:3s"/></g>`).join('\n');

  const css = `
#ID .enciende{animation:ID-enciende .9s cubic-bezier(.2,.8,.3,1) var(--t) both}
#ID .titila{animation:ID-titila var(--d) ease-in-out var(--t) infinite alternate}
#ID #data-hilo-nuevo{stroke-dasharray:1 3;animation:ID-nuevo 10s cubic-bezier(.45,0,.2,1) ${LOOP}s infinite backwards}
#ID #data-estrella-nueva{animation:ID-nueva 10s ease-in-out ${LOOP}s infinite backwards}
#ID #data-abrigo{transform-origin:-6px -128px;animation:ID-viento 5s ease-in-out 6s infinite alternate}
@keyframes ID-enciende{from{opacity:.35;transform:scale(.45)}60%{transform:scale(1.25)}}
@keyframes ID-titila{to{opacity:.2}}
@keyframes ID-nuevo{0%{stroke-dashoffset:1.15;opacity:1}32%,72%{stroke-dashoffset:0;opacity:1}88%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:1.15;opacity:0}}
@keyframes ID-nueva{0%,26%{opacity:.4;transform:scale(.5)}36%{opacity:1;transform:scale(1.3)}42%,72%{opacity:1;transform:scale(1)}90%,100%{opacity:.4;transform:scale(.5)}}
@keyframes ID-viento{to{transform:skewX(5deg) scaleX(1.06)}}`;

  return svg('data', 'Constelación',
    'Una figura sola sobre una colina alza el brazo y une con un hilo fino puntos de luz sueltos hasta dibujar una ballena en el cielo.',
    css, `<g id="data-cielo">
${loose.join('\n')}
${spout}
${cons}
<g class="ap" transform="translate(1000 222)" style="--t:${f(reach[1])}s"><circle id="data-ojo" class="luz" r="2.2"/></g>
<g class="ap" transform="translate(1012 104)" style="--t:3s"><path id="data-estrella-nueva" class="luz" d="${spark(7.5)}"/></g>
</g>
<g class="mano">
${line('data-colina', 'M-20 700C90 690 190 640 290 618C340 607 380 604 420 612C470 624 500 668 560 700C640 738 800 742 1220 730', { t: 0, dur: 3.6, peso: true })}
${line('data-horizonte', 'M700 762C860 750 1040 764 1220 754', { t: 1.6, dur: 2.4, cls: 'f' })}
${line('data-hierba', 'M340 609l-5 -11M346 608l0 -13M352 607l5 -10M398 609l-3 -11M404 610l3 -12M452 622l-2 -10M458 625l4 -10', { t: 3, dur: 1.4, cls: 'f' })}
<g id="data-figura" transform="translate(${FX} ${FY}) scale(${FS})">
${line('data-figura-abrigo', 'M13 -122C8 -131 1 -131 -4 -126C-10 -104 -12 -70 -20 -34C-10 -30 4 -30 14 -34C14 -66 16 -96 13 -122', { t: 2.8, dur: 2.4, peso: true })}
${line('data-figura-manga', 'M13 -124C20 -134 28 -150 40 -184l3 -5l-7 3C26 -160 16 -140 6 -128', { t: 3.8, dur: 1.5 })}
${line('data-figura-piernas', 'M-8 -32L-9 0l9 1M6 -32L7 0l10 0', { t: 4.2, dur: 1 })}
${line('data-figura-cabeza', 'M8 -139a9.5 10.5 -20 1 0 -3 6', { t: 4.5, dur: 1 })}
<g id="data-abrigo">
${line('data-figura-bufanda', 'M-6 -130C-18 -134 -28 -124 -42 -130M-6 -127C-16 -124 -24 -118 -34 -118', { t: 4.9, dur: 1, cls: 'f' })}
</g>
</g>
<g id="data-constelacion">
${line('data-hilo', d, { t: T0, dur: TD, cls: 'f', lin: true })}
<path id="data-hilo-nuevo" class="l f" pathLength="1" d="M1010 170Q1002 136 1012 104"/>
</g>
</g>`);
}

// ── 3. DESARROLLO · Arquitecto en obra ──────────────────────────────
function desarrollo() {
  const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const panels = [562, 662, 762].map((x, i) =>
    line(`dev-panel-${i + 1}`, `${rect(x, 608, 76, 64)}M${x} 624h76M${x + 10} 640h${[40, 52, 30][i]}M${x + 10} 654h${[54, 28, 44][i]}`, { t: 2 + i * .5, dur: 1.8, cls: 'f' })).join('\n');

  const css = `
#ID #dev-figura{transform-origin:474px 459px;animation:ID-coloca 9s cubic-bezier(.45,0,.2,1) 12.4s infinite backwards}
#ID #dev-cursor{animation:ID-cursor 1.1s steps(1) 11s infinite backwards}
#ID #dev-texto-3{animation:ID-draw 1.6s ease 9.6s both,ID-teclea 9s ease 12.4s infinite}
@keyframes ID-coloca{0%,100%{transform:rotate(-7deg)}38%,78%{transform:rotate(0)}}
@keyframes ID-cursor{0%{opacity:0}50%{opacity:1}}
@keyframes ID-teclea{0%,30%{stroke-dashoffset:1.15}55%,100%{stroke-dashoffset:0}}`;

  return svg('desarrollo', 'Arquitecto en obra',
    'Una figura sobre un andamio coloca la última pieza de una estructura que es mitad edificio y mitad interfaz, precisa abajo y abocetada arriba.',
    css, `<g id="dev-acabado">
${line('dev-planta-1', 'M540 700V580H860V700', { t: 1, dur: 2.2 })}
${panels}
${line('dev-planta-2', 'M540 580V460H860V580', { t: 3.4, dur: 2.2 })}
${line('dev-rejilla', 'M620 460V580M700 460V580M780 460V580M540 520H860', { t: 4.4, dur: 2.2, cls: 'f' })}
</g>
<g class="mano">
${line('dev-suelo', 'M60 703C300 697 700 707 1140 700', { t: 0, dur: 2.4, peso: true })}
<g id="dev-andamio">
${line('dev-poste-1', 'M420 701C423 560 417 440 421 318', { t: 2, dur: 2.4 })}
${line('dev-poste-2', 'M508 701C506 560 511 440 507 330', { t: 2.5, dur: 2.4 })}
${line('dev-tablon-1', 'M406 581L522 580M410 587L518 586', { t: 3.6, dur: 1.2 })}
${line('dev-tablon-2', 'M402 460L526 459M406 466L522 465', { t: 4.6, dur: 1.2 })}
${line('dev-riostras', 'M421 700L507 581M507 580L421 461M421 460L507 350', { t: 5, dur: 2.6, cls: 'f' })}
</g>
<g id="dev-boceto">
${line('dev-planta-3', 'M541 463C537 420 545 380 538 330M526 343C640 335 760 348 874 338M861 465C865 420 856 380 863 326', { t: 6, dur: 2.4, peso: true })}
${line('dev-planta-3-tanteo', 'M546 458C543 410 549 372 545 340M534 349C650 343 770 353 866 345', { t: 6.8, dur: 2, cls: 'f' })}
${line('dev-hueco', 'M547 351C572 347 600 350 623 348M623 348C625 368 621 392 624 410M547 410C572 413 600 408 624 410', { t: 7.2, dur: 1.6, cls: 'f' })}
${line('dev-panel-boceto-1', 'M648 366C676 362 706 368 734 363C737 384 732 404 736 424C706 428 676 422 646 427C650 404 645 386 648 366M652 382L728 379', { t: 7.4, dur: 2, cls: 'f' })}
${line('dev-panel-boceto-2', 'M760 370C786 366 812 371 838 367M840 362C842 388 837 408 841 430M762 424C788 428 812 422 836 426', { t: 7.9, dur: 1.8, cls: 'f' })}
${line('dev-pantalla', 'M606 339C599 300 603 252 606 222C660 213 750 216 798 220C803 260 800 300 797 337', { t: 8.4, dur: 2.2, peso: true })}
${line('dev-pantalla-tanteo', 'M612 334C607 296 609 256 611 229C664 222 744 223 792 227', { t: 9, dur: 1.8, cls: 'f' })}
${line('dev-pantalla-barra', 'M621 237l.5 0M633 237l.5 0M645 237l.5 0M609 250C670 247 740 251 798 248', { t: 9.4, dur: 1.2, cls: 'f' })}
${line('dev-texto-1', 'M626 270C650 268 680 271 706 269', { t: 9.6, dur: .9 })}
${line('dev-texto-2', 'M626 290C670 288 720 291 764 289', { t: 9.9, dur: 1.1 })}
<path id="dev-texto-3" class="l" pathLength="1" stroke-dasharray="1 3" d="M626 310C644 308 664 311 684 309"/>
<path id="dev-cursor" class="l" d="M692 302V317"/>
</g>
<g id="dev-figura">
<g transform="translate(474 459) scale(1.3)">
${line('dev-figura-espalda', 'M6 -92C-2 -78 -6 -62 -5 -48C-6 -30 -10 -14 -12 0l-6 1', { t: 9.8, dur: 1.5, peso: true })}
${line('dev-figura-frente', 'M14 -88C12 -74 8 -60 5 -48C8 -32 8 -14 10 0l7 0M-5 -48Q0 -44 5 -48', { t: 10.2, dur: 1.4 })}
${line('dev-figura-brazos', 'M12 -87C26 -86 42 -79 56 -68M11 -84C24 -77 40 -64 55 -54', { t: 10.6, dur: 1.1 })}
${line('dev-figura-cabeza', 'M22 -98a8 8.6 12 1 0 -2 3.4', { t: 11, dur: .9 })}
${line('dev-figura-casco', 'M5 -104C8 -115 22 -116 25 -105l6 1', { t: 11.3, dur: .7 })}
${line('dev-pieza', `${rect(56, -84, 58, 46)}M56 -72h58M64 -60h30M64 -50h20`, { t: 11.4, dur: 1.6 })}
</g>
</g>
</g>`);
}

// ── 4. AUTOMATIZACIÓN · Engranajes y pájaro ─────────────────────────
function automatizacion() {
  const M = 6.6, H = 14, rad = a => a * Math.PI / 180;
  const gearPath = N => {
    const rp = N * M, rr = rp - H * .55, rt = rp + H * .45, p = 360 / N;
    const pt = (r, a) => `${f(r * Math.cos(rad(a)))} ${f(r * Math.sin(rad(a)))}`;
    let d = `M${pt(rr, -p / 2)}`;
    for (let k = 0; k < N; k++) {
      const c = k * p;
      d += `A${f(rr)} ${f(rr)} 0 0 1 ${pt(rr, c - p * .27)}L${pt(rt, c - p * .15)}A${f(rt)} ${f(rt)} 0 0 1 ${pt(rt, c + p * .15)}L${pt(rr, c + p * .27)}A${f(rr)} ${f(rr)} 0 0 1 ${pt(rr, c + p / 2)}`;
    }
    return d + 'Z';
  };
  const ring = r => `M${r} 0A${r} ${r} 0 1 1 ${r} -.1`;
  // Engrane real: cada rueda encaja su hueco en el diente de la anterior.
  const A = { n: 16, x: 215, y: 545, th: 0 };
  const phi1 = -45, B = { n: 10, x: A.x + (16 + 10) * M * Math.cos(rad(phi1)), y: A.y + (16 + 10) * M * Math.sin(rad(phi1)), th: phi1 + 180 - 18 };
  const phi2 = B.th - 4 * 36, C = { n: 6, x: B.x + (10 + 6) * M * Math.cos(rad(phi2)), y: B.y + (10 + 6) * M * Math.sin(rad(phi2)), th: phi2 + 180 - 30 };
  const gear = (g, name, t, dur, secs, extra) => `<g id="auto-engranaje-${name}" transform="translate(${f(g.x)} ${f(g.y)})">
<g class="gira" style="--g:${secs}s"><g transform="rotate(${f(g.th)})">
${line(`auto-engranaje-${name}-dientes`, gearPath(g.n), { t, dur, peso: true })}
${line(`auto-engranaje-${name}-eje`, extra, { t: t + dur * .6, dur: 1.6, cls: 'f' })}
</g></g></g>`;
  const spokes = (r0, r1, n) => Array.from({ length: n }, (_, i) => {
    const a = rad(i * 360 / n + 20);
    return `M${f(r0 * Math.cos(a))} ${f(r0 * Math.sin(a))}L${f(r1 * Math.cos(a))} ${f(r1 * Math.sin(a))}`;
  }).join('');

  const BX = 965, BY = 190, BS = 1.55, ba = rad(-28);
  const tail = [BX + BS * (-50 * Math.cos(ba) - 8 * Math.sin(ba)), BY + BS * (-50 * Math.sin(ba) + 8 * Math.cos(ba))];
  // Hilo: enrollado en la rueda pequeña, se suelta, hace un bucle y sube.
  const w = 50, p0 = [C.x + w * Math.cos(rad(165)), C.y + w * Math.sin(rad(165))], p1 = [C.x + w * Math.cos(rad(-50)), C.y + w * Math.sin(rad(-50))];
  const hilo = `M${f(p0[0])} ${f(p0[1])}A${w} ${w} 0 0 1 ${f(p1[0])} ${f(p1[1])}`
    + `C${f(p1[0] + 40)} ${f(p1[1] + 34)} 560 428 612 404C664 380 670 318 632 316C594 314 588 374 640 394`
    + `C720 424 812 380 846 318C862 288 ${f(tail[0] - 40)} ${f(tail[1] + 21)} ${f(tail[0])} ${f(tail[1])}`;

  const css = `
#ID .gira{animation:ID-gira var(--g) linear infinite}
#ID .ala{transform-origin:4px -3px;animation:ID-aleteo 1.5s ease-in-out 13.2s infinite alternate}
#ID .ala.b{transform-origin:12px -4px;animation-delay:13.32s}
#ID #auto-pajaro-vuelo{animation:ID-planea 6s ease-in-out 13.2s infinite alternate}
@keyframes ID-gira{to{transform:rotate(360deg)}}
@keyframes ID-aleteo{to{transform:scaleY(.12)}}
@keyframes ID-planea{to{transform:translate(1.5px,-3px)}}`;

  return svg('automatizacion', 'Engranajes y pájaro',
    'Unos engranajes giran a la izquierda; del último sale una línea que se desenrolla y se convierte en un pájaro que levanta el vuelo.',
    css, `<g class="mano">
<g id="auto-engranajes">
${gear(A, 'grande', 0, 3.6, 64, ring(62) + ring(20) + spokes(20, 62, 5))}
${gear(B, 'medio', 1.6, 3, -40, ring(36) + ring(11) + spokes(11, 36, 4))}
${gear(C, 'pequeno', 3.2, 2.4, 24, ring(9))}
</g>
${line('auto-hilo', hilo, { t: 5.6, dur: 5.6, peso: true })}
<g id="auto-pajaro" transform="translate(${BX} ${BY}) rotate(-28) scale(${BS})">
<g id="auto-pajaro-vuelo">
${line('auto-pajaro-cuerpo', 'M-50 8C-30 2 -10 -5 10 -5C24 -5 34 -9 44 -7L57 -3L44 -1C30 7 0 13 -22 11C-34 10 -44 9 -50 8', { t: 10.9, dur: 1.5 })}
${line('auto-pajaro-cola', 'M-48 9L-70 15M-49 8L-73 5', { t: 11.6, dur: .7, cls: 'f' })}
<g class="ala b">${line('auto-pajaro-ala-lejana', 'M12 -4C22 -36 20 -68 6 -96C-6 -70 -10 -40 -8 -4', { t: 11.6, dur: 1.2, cls: 'f' })}</g>
<g class="ala">${line('auto-pajaro-ala', 'M4 -3C0 -34 -18 -62 -52 -86C-56 -64 -52 -38 -34 7', { t: 12, dur: 1.2, peso: true })}</g>
<circle id="auto-pajaro-ojo" class="luz ap" cx="42" cy="-4.4" r="1" style="--t:12.6s"/>
</g>
</g>
</g>`);
}

// ── Salida ──────────────────────────────────────────────────────────
const scenes = [
  ['ia', 'IA', 'Multitud que piensa', 'El movimiento de muchos se convierte en un pensamiento.', ia()],
  ['data', 'DATA', 'Constelación', 'Encontrar sentido en el caos, estrella a estrella.', data()],
  ['desarrollo', 'DESARROLLO', 'Arquitecto en obra', 'Acabado y preciso abajo, todavía en boceto arriba.', desarrollo()],
  ['automatizacion', 'AUTOMATIZACIÓN', 'Engranajes y pájaro', 'La máquina devuelve tiempo y libertad.', automatizacion()],
];

mkdirSync(OUT, { recursive: true });
for (const [name, , , , s] of scenes) writeFileSync(join(OUT, `${name}.svg`), s);

const preview = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Ilustraciones del carrusel · preview</title>
<style>
*{box-sizing:border-box}
html{background:#000;color:#fff;font:16px/1.5 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
body{margin:0;padding:0 16px 96px}
.mono{font:12px/1.4 "JetBrains Mono",ui-monospace,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;color:#8a8a8a}
header{max-width:1200px;margin:0 auto;padding:56px 0 24px;display:flex;flex-wrap:wrap;gap:24px;align-items:end;justify-content:space-between}
h1{font:500 clamp(28px,4vw,44px)/1.05 "Space Grotesk",system-ui,sans-serif;margin:8px 0 0;letter-spacing:-.02em;text-wrap:balance}
.barra{display:flex;gap:8px;align-items:center}
button{font:inherit;font-size:13px;color:#fff;background:none;border:1px solid #3a3a3a;border-radius:999px;padding:8px 16px;cursor:pointer;transition:background-color .2s,border-color .2s,color .2s}
button:hover{border-color:#fff}
button:focus-visible{outline:2px solid #fff;outline-offset:3px}
button[aria-pressed="true"]{background:#fff;color:#000;border-color:#fff}
section{max-width:1200px;margin:72px auto 0}
.pie{display:flex;flex-wrap:wrap;gap:8px 24px;align-items:baseline;justify-content:space-between;padding:12px 0}
h2{font:500 20px/1.2 "Space Grotesk",system-ui,sans-serif;margin:0}
.pie p{margin:0;color:#8a8a8a;font-size:14px}
.ill{display:block;width:100%;height:auto;border:1px solid #1c1c1c}
</style>
</head>
<body>
<header>
  <div>
    <div class="mono">Carrusel · 4 escenas · preview</div>
    <h1>Ilustraciones en línea</h1>
  </div>
  <div class="barra" role="group" aria-label="Estilo de trazo">
    <span class="mono">Trazo</span>
    <button type="button" data-trazo="tinta" aria-pressed="true">Tinta</button>
    <button type="button" data-trazo="hilo" aria-pressed="false">Hilo</button>
    <button type="button" id="todo">Repetir todo</button>
  </div>
</header>
${scenes.map(([name, cat, title, line2, s], i) => `<section data-escena="${name}">
<div class="pie"><div><div class="mono">0${i + 1} · ${cat}</div><h2>${title}</h2></div><p>${line2}</p><button type="button" class="repetir">Repetir</button></div>
${s.replace('<svg ', '<svg data-state="espera" ')}</section>`).join('\n')}
<script>
// Dispara cada escena al entrar en el viewport; "Repetir" la reinicia clonando el nodo.
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.removeAttribute('data-state'); io.unobserve(e.target); }
}), { threshold: .35 });
document.querySelectorAll('.ill').forEach(s => io.observe(s));
const replay = sec => {
  const old = sec.querySelector('.ill'), neu = old.cloneNode(true);
  neu.removeAttribute('data-state');
  old.replaceWith(neu);
};
document.querySelectorAll('.repetir').forEach(b => b.onclick = () => replay(b.closest('section')));
document.getElementById('todo').onclick = () => document.querySelectorAll('section').forEach(replay);
document.querySelectorAll('[data-trazo]').forEach(b => b.tagName === 'BUTTON' && (b.onclick = () => {
  document.querySelectorAll('button[data-trazo]').forEach(o => o.setAttribute('aria-pressed', o === b));
  document.querySelectorAll('.ill').forEach(s => b.dataset.trazo === 'hilo' ? s.setAttribute('data-trazo', 'hilo') : s.removeAttribute('data-trazo'));
}));
</script>
</body>
</html>
`;
writeFileSync(join(ROOT, 'ilustraciones-preview.html'), preview);
console.log('ok:', scenes.map(s => s[0] + '.svg').join(', '), '+ ilustraciones-preview.html');
