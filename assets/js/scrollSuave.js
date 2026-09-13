/**
 * Movimiento de la pagina de proyectos: scroll con inercia, entrada de las
 * tarjetas al bajar, y reordenacion al filtrar.
 *
 * Las tres cosas nacen de las referencias que pidio Sebastian:
 *
 * - **Scroll con inercia (Lenis).** Es lo que hace que la pagina "vaya bajando
 *   por si sola". Lo usan las dos referencias: stewartpartners.studio carga
 *   lenis@1.1.2 y el portfolio de Yiting lenis@1.1.13.
 * - **Entrada en zigzag.** Copiada del hook `useScrollEnter` de Yiting: las
 *   tarjetas impares entran desde la izquierda y las pares desde la derecha,
 *   enganchadas al PROGRESO del scroll (`scrub`), no disparadas de golpe. Esa
 *   diferencia es justo la que da la sensacion de que la pagina se monta
 *   mientras bajas.
 * - **Reordenacion con FLIP al filtrar.** Antes las tarjetas se desvanecian y
 *   las supervivientes saltaban a su nueva posicion. Ahora se deslizan.
 *
 * Todo esta supeditado a `prefers-reduced-motion`: con esa preferencia activa
 * no se inicializa nada y la pagina funciona como una pagina normal.
 */
(function (global) {
  'use strict';

  const REDUCIDO = global.matchMedia
    && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hayGsap = typeof global.gsap !== 'undefined'
    && typeof global.ScrollTrigger !== 'undefined';

  // --- Scroll con inercia --------------------------------------------------

  function iniciarScroll() {
    if (REDUCIDO || typeof global.Lenis === 'undefined') return null;

    const lenis = new global.Lenis({
      // `lerp` en vez de `duration`: con duration, Lenis planifica una animacion
      // hacia el destino y el scroll sale flotante y con retardo. Con lerp
      // responde en el primer frame.
      //
      // 0.18 y no 0.12: con 0.12 la pagina seguia corriendo demasiado despues
      // de soltar la rueda y daba la sensacion de bajar sola. Cuanto mas alto,
      // antes alcanza el destino y antes frena.
      lerp: 0.18,
      // Un tick de rueda movia poco: en Windows suele ser de 100 px y hacia
      // falta girar mucho para avanzar. 1.35 lo pone a ritmo natural.
      wheelMultiplier: 1.35,
      smoothWheel: true,
      // En tactil se deja el scroll nativo: suavizarlo ahi pelea con el gesto
      // del sistema y se siente pegajoso.
      smoothTouch: false,
    });

    if (hayGsap) {
      // Lenis se engancha al ticker de GSAP en vez de pedir su propio
      // requestAnimationFrame. Con dos bucles distintos, ScrollTrigger calcula
      // posiciones de un frame que Lenis todavia no ha pintado y la entrada de
      // las tarjetas tiembla.
      lenis.on('scroll', global.ScrollTrigger.update);
      global.gsap.ticker.add((t) => lenis.raf(t * 1000));
      global.gsap.ticker.lagSmoothing(0);
    } else {
      const bucle = (t) => { lenis.raf(t); requestAnimationFrame(bucle); };
      requestAnimationFrame(bucle);
    }
    // Se expone para que el panel de detalle pueda parar el scroll de fondo
    // mientras esta abierto, igual que hace Stewart al abrir su menu.
    global.lenisPortfolio = lenis;
    return lenis;
  }

  // --- Entrada de las tarjetas --------------------------------------------

  /**
   * La entrada en zigzag se retiro: las fichas deslizandose desde los lados
   * mientras se hacia scroll daban sensacion de que la pagina se movia sola, y
   * eso molestaba mas de lo que aportaba. Queda un fundido corto al entrar en
   * pantalla, sin desplazamiento: se nota que aparece, no que se mueve.
   */
  function animarEntrada(contenedor) {
    if (REDUCIDO || !hayGsap || !contenedor) return;
    const gsap = global.gsap;

    // La rejilla se repinta entera al cargar y al cambiar de idioma. Sin matar
    // los triggers anteriores se acumularian sobre nodos que ya no existen.
    global.ScrollTrigger.getAll().forEach((t) => t.kill());

    contenedor.querySelectorAll('.pj-item').forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: 'power1.out',
          // Sin `scrub`: se dispara una vez al entrar y se acabo. Atarlo al
          // scroll es justo lo que producia la sensacion de movimiento.
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        });
    });
  }

  // --- Reordenacion al filtrar (FLIP) -------------------------------------

  // FLIP: First, Last, Invert, Play. Se mide donde esta cada tarjeta ANTES de
  // filtrar, se deja que el filtro haga su trabajo, y se anima desde la
  // posicion vieja a la nueva. Asi las supervivientes se deslizan en vez de
  // saltar. Se implementa a mano en vez de traer el plugin Flip de GSAP: son
  // treinta lineas y evita otra dependencia.
  let posicionesPrevias = null;

  function medirAntes(contenedor) {
    if (REDUCIDO || !contenedor) return;
    posicionesPrevias = new Map();
    contenedor.querySelectorAll('.pj-item').forEach((el) => {
      posicionesPrevias.set(el, el.getBoundingClientRect());
    });
  }

  function animarDespues(contenedor) {
    if (REDUCIDO || !contenedor || !posicionesPrevias) return;
    const previas = posicionesPrevias;
    posicionesPrevias = null;

    // Se espera al siguiente frame: hasta que el navegador no recalcula el
    // layout, las posiciones nuevas son las viejas.
    requestAnimationFrame(() => {
      contenedor.querySelectorAll('.pj-item').forEach((el) => {
        const antes = previas.get(el);
        if (!antes) return;
        const ahora = el.getBoundingClientRect();
        const dx = antes.left - ahora.left;
        const dy = antes.top - ahora.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

        if (hayGsap) {
          global.gsap.fromTo(el,
            { x: dx, y: dy },
            { x: 0, y: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        } else {
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            el.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
            el.style.transform = '';
          });
        }
      });
    });
  }

  global.ScrollSuave = {
    iniciar: iniciarScroll,
    animarEntrada,
    medirAntes,
    animarDespues,
    reducido: REDUCIDO,
  };
})(window);
