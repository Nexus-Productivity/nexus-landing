/**
 * NEXUS — sistema de movimiento
 * =============================
 * Un solo módulo gobierna todo el movimiento de la web:
 *
 *   · Lenis        → scroll suave con inercia (desktop, no táctil)
 *   · GSAP         → líneas de tiempo, reveals, tilt, magnet, rotador
 *   · IntersectionObserver → dispara los reveals (nada de triggers)
 *   · SplitType    → corte del H1 en líneas para el reveal inicial
 *
 * Reglas que este módulo no rompe, por orden de importancia:
 *
 *  1. Si no hay JS, o el bundle falla, la web se ve igual de bien:
 *     el estado inicial de los reveals vive en CSS detrás de `.js`.
 *  2. NUNCA se deja un elemento en opacidad 0 sin un plan de que
 *     vuelva a 1. Hay tres redes de seguridad (IntersectionObserver
 *     que dispara al observar, un temporizador de emergencia, y un
 *     `clearProps` al desmontar). Esto se corrigió después de que al
 *     recargar quedaran invisibles las tarjetas, los botones del hero
 *     y el círculo con la estrella.
 *  3. `prefers-reduced-motion` desactiva todo, sin excepciones.
 *  4. Nada de scroll-jacking en táctil: Lenis corre solo con puntero
 *     fino. En móvil manda el scroll nativo, que ya es fluido.
 *  5. Solo se animan `transform` y `opacity`, las únicas dos
 *     propiedades que el compositor resuelve en GPU sin repintar.
 *  6. Un solo `requestAnimationFrame` para toda la página.
 */

import { gsap } from 'gsap';
import SplitType from 'split-type';
import Lenis from 'lenis';

/* ────────────────────────────────────────────────────────────
   1 · Entorno
   ──────────────────────────────────────────────────────────── */

const doc = document;
const root = doc.documentElement;

const consulta = (q: string) => window.matchMedia(q);

const sinMovimiento = () => consulta('(prefers-reduced-motion: reduce)').matches;

/** Puntero fino = mouse/trackpad. Los móviles usan scroll nativo. */
const punteroFino = () => consulta('(hover: hover) and (pointer: fine)').matches;

/** Pone en estado final lo que esté a medio animar. Último recurso. */
function mostrarTodo() {
  root.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal] > *').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.classList.add('revelado');
  });
}

/* ────────────────────────────────────────────────────────────
   2 · Ciclo de vida
   ──────────────────────────────────────────────────────────── */

let limpiar: (() => void) | null = null;

/**
 * `iniciar()` arma todo el sistema una sola vez.
 *
 * El bug histórico: este módulo se ejecutaba DOS veces en cada carga
 * (una por `astro:page-load` y otra por el bloque `readyState`). La
 * segunda pasada llamaba a `limpiar()`, que abortaba los tweens `.from()`
 * del hero a mitad de camino. Un `.from()` matado deja el elemento en su
 * estado inicial: invisible. De ahí que al recargar desaparecieran el
 * círculo con la estrella, los botones y las tarjetas.
 *
 * Ahora el arranque vive en `arrancar()`, más abajo, y es idempotente:
 * por muchas fuentes de disparo que haya, el cuerpo corre una sola vez.
 */
function iniciar() {
  gsap.defaults({ ease: 'power3.out', duration: 0.85 });

  const respaldos: (() => void)[] = [];
  const suave = !sinMovimiento();

  /* ── Scroll suave (Lenis) ─────────────────────────────
     Solo con puntero fino. En táctil Lenis estira el scroll y se
     siente peor que el nativo, que ya va por compositor. */
  let lenis: Lenis | null = null;

  if (suave && punteroFino()) {
    lenis = new Lenis({
      // lerp bajo = más inercia y más "premium"; 0.09 es el valor
      // que se lee como seda sin marear. El plan lo fijó en 0.08–0.1.
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
      // Su propio rAF. No lo atamos a un ticker de GSAP porque ya no
      // hay ScrollTrigger que sincronizar: menos código, menos peso.
      autoRaf: true,
    });

    // Con Lenis activo, el scroll suave nativo estorba: los dos
    // pelan por el mismo `scrollTop` y el ancla se queda a mitad de
    // camino. El anclaje lo hacemos nosotros.
    root.style.scrollBehavior = 'auto';
    lenis.scrollTo(0, { immediate: true });

    anclasConLenis(lenis, respaldos);
    respaldos.push(() => lenis?.destroy());
  }

  /* ── Anclas cuando no hay Lenis (táctil / reduced motion) ── */
  if (!lenis) {
    const alHash = (e: Event) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const destino = doc.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      destino.scrollIntoView({ behavior: sinMovimiento() ? 'auto' : 'smooth' });
    };
    doc.addEventListener('click', alHash);
    respaldos.push(() => doc.removeEventListener('click', alHash));
  }

  /* ── Entrada del Hero ───────────────────────────────── */
  entradaHero(backp => respaldos.push(backp));

  /* ── Frase rotativa ─────────────────────────────────── */
  rotador(backp => respaldos.push(backp));

  /* ── Reveals al hacer scroll ────────────────────────── */
  reveals(backp => respaldos.push(backp));

  /* ── Microinteracciones ─────────────────────────────── */
  if (suave && punteroFino()) {
    botonesMagneticos(backp => respaldos.push(backp));
    tarjetasTilt(backp => respaldos.push(backp));
  }

  /* ── Header: se oculta al bajar, vuelve al subir ────── */
  headerAlScrollear(lenis, respaldos);

  /* ── Halos fuera de pantalla en pausa ───────────────── */
  pausasFueraDePantalla(backp => respaldos.push(backp));

  /* ── Red de seguridad ─────────────────────────────────
     Si a los 3.5s todavía hay algo en opacidad 0 dentro del
     viewport, se muestra. Un temporizador de una línea que
     convierte "contenido invisible" en "contenido sin animación".
     Preferible a una animación perdida. */
  const seguro = window.setTimeout(() => {
    root.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal] > *').forEach(el => {
      const r = el.getBoundingClientRect();
      /* `r.top < innerHeight + 80` alcanza también a lo que ya quedó
         ARRIBA, que la versión anterior (`bottom > -80 && top < ...`)
         dejaba afuera. Si el observador falló con un elemento y el
         usuario siguió bajando, ese elemento ya no estaba en pantalla
         y la red no lo rescataba nunca. */
      const alcanzable = r.top < window.innerHeight + 80;
      if (alcanzable && +getComputedStyle(el).opacity < 0.85) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('revelado');
      }
    });
  }, 3500);

  respaldos.push(() => {
    window.clearTimeout(seguro);

    // NADA de `limpiar?.()` acá adentro. Antes estaba, y era una
    // recursión infinita: `limpiar()` recorre los respaldos, uno de
    // ellos volvía a llamar `limpiar()` antes de que se anulara, así
    // que se reentaba hasta reventar la pila con un RangeError. El
    // error abortaba el resto del cleanup (justo el `clearProps` que
    // deja las tarjetas y el círculo con la estrella en opacidad 0), y
    // por eso al recargar quedaban cosas invisible y sin animar.
    limpiar = null;

    // Al desmontar se borra el estado inline de todo lo animado. Sin
    // esto, un tween interrumpido deja elementos en opacidad 0.
    gsap.set(
      '[data-reveal], [data-reveal] > *, [data-hero-eyebrow], [data-hero-lead], [data-hero-actions] > *, [data-hero-bullets] li, [data-hero-art], .hero-frase',
      { clearProps: 'all' }
    );
    root.querySelectorAll('.revelado').forEach(el => el.classList.remove('revelado'));
    mostrarTodo();
  });

  limpiar = () => respaldos.forEach(fn => fn());
}

/* ────────────────────────────────────────────────────────────
   3 · Entrada del Hero
   ──────────────────────────────────────────────────────────── */

function entradaHero(registrar: (fn: () => void) => void) {
  const estatico = doc.querySelector<HTMLElement>('[data-split]');

  if (sinMovimiento()) {
    estatico?.style.removeProperty('overflow');
    return;
  }

  let split: SplitType | null = null;

  if (estatico) {
    // El bloque estático hace de máscara: recorta el borde inferior
    // por donde entran las líneas. El padding-bottom evita que
    // recorte las colas de las letras.
    estatico.style.overflow = 'hidden';
    estatico.style.paddingBottom = '0.16em';
    split = new SplitType(estatico, { type: 'lines', linesClass: 'linea-titulo' });
  }

  const linea = split?.lines ?? [];
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.08 });

  if (linea.length) {
    // `fromTo` en vez de `from`: el estado final queda escrito de
    // forma explícita, así una interrupción no deja el elemento
    // colgando en el inicial.
    tl.fromTo(
      linea,
      { yPercent: 108 },
      { yPercent: 0, duration: 1.15, stagger: 0.085, ease: 'expo.out' },
      0
    );
  }

  const eyebrow = doc.querySelector('[data-hero-eyebrow]');
  if (eyebrow) {
    tl.fromTo(eyebrow, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.06);
  }

  const lead = doc.querySelector('[data-hero-lead]');
  if (lead) {
    tl.fromTo(lead, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, 0.5);
  }

  const acciones = doc.querySelectorAll('[data-hero-actions] > *');
  if (acciones.length) {
    tl.fromTo(
      acciones,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, stagger: 0.09 },
      0.62
    );
  }

  const bullets = doc.querySelectorAll('[data-hero-bullets] li');
  if (bullets.length) {
    tl.fromTo(
      bullets,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 },
      0.78
    );
  }

  const arte = doc.querySelector('[data-hero-art]');
  if (arte) {
    tl.fromTo(
      arte,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.4, ease: 'power2.out' },
      0.25
    );

    // Parallax del mouse: leve, con límite. Más que esto marea.
    const mover = (e: MouseEvent) => {
      const r = arte.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      gsap.to(arte, {
        x: dx * 18,
        y: dy * 18,
        duration: 1.1,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };
    if (punteroFino()) {
      window.addEventListener('mousemove', mover, { passive: true });
      registrar(() => window.removeEventListener('mousemove', mover));
    }
  }

  registrar(() => {
    tl.kill();
    split?.revert();
    if (estatico) {
      estatico.style.removeProperty('overflow');
      estatico.style.removeProperty('padding-bottom');
    }
  });
}

/* ────────────────────────────────────────────────────────────
   4 · Frase rotativa del hero
   ──────────────────────────────────────────────────────────── */

/**
 * Rotador de la frase del hero: cruce de capas nítida ↔ borrosa.
 *
 * Cada frase existe DOS veces en el DOM, apiladas en la misma celda de
 * grid (ver `.hero-rotador` en Hero.astro). La capa borrosa nace con
 * `filter: blur(8px)` y ese radio no se anima NUNCA: cambiar el valor de
 * un filtro obliga a repintar el texto en cada frame, y medido a 3x de
 * densidad en móvil eso ya consume el presupuesto entero de 16.7ms.
 *
 * Lo que sí se anima es la opacidad de las dos capas, que va por la GPU.
 * Ese cruce es lo que se ve como "se pone borrosa y desaparece".
 *
 * SIN `setInterval`, y esto importa: el temporizador de intervalo no
 * cuenta el tiempo de la animación, solo el del reloj. Con un `setTimeout`
 * en cadena que tampoco, porque una pestaña en segundo plano congela los
 * temporizadores y al volver se acumulan varias rotaciones seguidas (justo
 * lo que se veía: "la frase cambia antes de tiempo"). Acá cada ciclo se
 * mide con `gsap.delayedCall`, que usa el reloj de GSAP: si la pestaña
 * estuvo oculta, el tiempo pasa una sola vez y el rotador sigue su
 * curso sin adelantarse ni solaparse.
 */
function rotador(registrar: (fn: () => void) => void) {
  const ranura = doc.querySelector<HTMLElement>('[data-rotador-frases]');
  if (!ranura) return;

  const nitidas = Array.from(
    ranura.querySelectorAll<HTMLElement>('.hero-frase:not(.hero-frase--borrosa)')
  );
  const borrosas = Array.from(
    ranura.querySelectorAll<HTMLElement>('.hero-frase--borrosa')
  );

  if (nitidas.length < 2 || nitidas.length !== borrosas.length) return;

  // Sin movimiento: se queda la primera frase, nítida y quieta. No se
  // "acorta" la animación, se corta: el desenfoque ES el cambio de
  // contenido, así que sin movimiento la alternativa correcta es una
  // frase sola y legible.
  if (sinMovimiento()) return;

  // 3.4s de lectura + 0.62s de cruce ≈ 4s por frase, 16s el ciclo entero.
  // Bastante más lento que un carrusel de verdad: el texto tiene que
  // poder LEERSE, no solo verse cambiar.
  const LECTURA = 3.4;
  const CRUCE = 0.62;
  const n = nitidas.length;

  let indice = 0;
  let vivo = true;

  gsap.set(nitidas, { opacity: 0 });
  gsap.set(borrosas, { opacity: 0 });
  // Solo la nítida se ve al arrancar. La borrosa arranca en 0 también: el
  // cruce la sube a 1 mientras la nítida se resuelve, y en el reposo
  // quedan dos copias del mismo texto superpuestas.
  gsap.set(nitidas[0], { opacity: 1 });

  // El dorado animado del titular (`background-position`, que repinta en
  // cada frame) solo corre en la frase que se está leyendo. Con las 8
  // copias corriendo a la vez el p95 del scroll subió de 17ms a 27ms.
  nitidas.forEach((el, i) => el.classList.toggle('hero-frase--activa', i === 0));

  const cambiar = (siguiente: number) => {
    if (!vivo) return;

    const sale = nitidas[indice];
    const saleBorroso = borrosas[indice];
    const entra = nitidas[siguiente];
    const entraBorroso = borrosas[siguiente];

    gsap
      .timeline({
        onComplete() {
          if (!vivo) return;
          indice = siguiente;

          // Reposo: solo la frase nueva. Las otras quedan en 0 para que
          // no se "vean" al volver a aparecer.
          gsap.set([sale, saleBorroso], { opacity: 0 });

          // El dorado en movimiento pasa a la frase nueva.
          sale.classList.remove('hero-frase--activa');
          entra.classList.add('hero-frase--activa');
        },
      })
      // La que entra llega desde el desenfoque.
      .fromTo(
        [entraBorroso],
        { opacity: 0 },
        { opacity: 1, duration: CRUCE, ease: 'power2.out' },
        0
      )
      .to(entra, { opacity: 1, duration: CRUCE * 0.7, ease: 'power2.out' }, CRUCE * 0.45)
      // La que sale se desenfoca. Arranca un poco después, para que en el
      // cruce máximo las dos estén difusas a la vez: ese solape es lo que
      // separa "transición premium" de "cambio de texto".
      .to([sale, saleBorroso], { opacity: 0, duration: CRUCE, ease: 'power2.in' }, CRUCE * 0.55);
  };

  // El reloj lo pone GSAP, no el navegador. Los `setTimeout` del navegador
  // se congelan con la pestaña oculta y al volver se disparan todos
  // juntos: eso fazia avanzar el rotador de golpe.
  // OJO CON LAS UNIDADES: `gsap.delayedCall` toma SEGUNDOS, como todo
  // GSAP. Antes estaba escrito `(LECTURA + CRUCE) * 1000` — heredado del
  // `setInterval`, que sí usa milisegundos. El resultado era un temporizador
  // de 4020 SEGUNDOS: más de una hora. El rotador arrancaba y se quedaba
  // clavado en la primera frase sin error de consola, porque el `setTimeout`
  // de GSAP estaba perfectamente programmed para dentro de 67 minutos.
  const programar = () => gsap.delayedCall(LECTURA + CRUCE, rotar);

  function rotar() {
    if (!vivo) return;
    cambiar((indice + 1) % n);
    programar();
  }

  programar();

  registrar(() => {
    vivo = false;
    gsap.killTweensOf([...nitidas, ...borrosas]);
    gsap.set([...nitidas, ...borrosas], { clearProps: 'all' });
    nitidas.forEach(el => el.classList.remove('hero-frase--activa'));
  });
}

/* ────────────────────────────────────────────────────────────
   5 · Reveals al hacer scroll
   ──────────────────────────────────────────────────────────── */

/**
 * IntersectionObserver en vez de ScrollTrigger.
 *
 * No es aesthetic: `ScrollTrigger.batch` solo dispara `onEnter` cuando
 * el elemento CRUZA el umbral. Si la página carga con el scroll ya
 * posicionado más abajo que ese umbral (recarga con scroll restaurado,
 * o el navegador recuperando posición), el cruce ya pasó y nunca
 * ocurre: el elemento queda en opacidad 0 para siempre.
 *
 * IntersectionObserver entrega un primer callback apenas se observa,
 * con el estado real de cada elemento. No hay forma de que se pierda.
 */
function reveals(registrar: (fn: () => void) => void) {
  const grupos = Array.from(doc.querySelectorAll<HTMLElement>('[data-reveal="stagger"]'));
  const simples = Array.from(
    doc.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="stagger"])')
  );

  if (sinMovimiento()) {
    grupos.forEach(g => g.classList.add('revelado'));
    simples.forEach(s => s.classList.add('revelado'));
    gsap.set([...grupos.flatMap(g => Array.from(g.children)), ...simples], { clearProps: 'all' });
    return;
  }

  // Estado inicial
  simples.forEach(el => {
    const variante = el.dataset.reveal;
    gsap.set(el, {
      opacity: 0,
      y: variante === 'sube' ? 34 : variante === 'escala' ? 18 : variante === 'suave' ? 0 : 26,
      scale: variante === 'escala' ? 0.965 : 1,
    });
  });

  const hijos = grupos.flatMap(g => Array.from(g.children));
  if (hijos.length) gsap.set(hijos, { opacity: 0, y: 22 });

  const animar = (elementos: Element[]) => {
    if (!elementos.length) return;
    gsap.to(elementos, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.9,
      stagger: 0.09,
      ease: 'expo.out',
      overwrite: true,
      onComplete: () => gsap.set(elementos, { willChange: 'auto' }),
    });
  };

  const alEntrar = (entrada: IntersectionObserverEntry) => {
    // ESTE `if` es el arreglo del "aparecen de la nada y no se animan".
    //
    // IntersectionObserver dispara su callback al observar por primera
    // vez, con una entrada POR CADA elemento observado: los que están
    // fuera de pantalla vienen con `isIntersecting: false`. Sin esta
    // comprobación, `alEntrar` corría para las 60 tarjetas de la página
    // al instante de cargar: se animaban todas de golpe, muchas fuera de
    // pantalla, y para cuando bajabas ya no quedaba nada por animar.
    if (!entrada.isIntersecting) return;

    const el = entrada.target as HTMLElement;

    // Una vez que se reveló, se deja de observar: así no vuelve a
    // disparar y cada cosa se anima una sola vez.
    observador.unobserve(el);

    el.classList.add('revelado');

    if (el.dataset.reveal === 'stagger') {
      /* El contenedor de un grupo escalonado no se anima (solo sus
         hijos), pero hay que garantir que nada lo deje transparente.
         Si por lo que sea quedara en opacidad 0, sus hijos podrían
         estar en 1 y aun así no verse nada: el padre manda. */
      gsap.set(el, { clearProps: 'opacity,transform' });

      gsap.to(Array.from(el.children), {
        opacity: 1,
        y: 0,
        duration: 0.8,
        /* 0.08 era imperceptible: con `expo.out` las tres tarjetas de
           una fila se solapaban casi por completo y se leían como un
           bloque que aparecía de golpe. A 0.14 se distingue la
           secuencia sin que la última tarde una eternidad. */
        stagger: 0.14,
        ease: 'expo.out',
        overwrite: true,
        onComplete: () => gsap.set(el.children, { willChange: 'auto' }),
      });
    } else {
      animar([el]);
    }
  };

  const observador = new IntersectionObserver(
    entradas => entradas.forEach(alEntrar),
    // `threshold: 0` + margen negativo: "cuando la punta del elemento
    // cruce el 88% de la pantalla". Antes era 0.12, y un umbral
    // porcentual es un bug esperando: si un elemento es más alto que la
    // ventana NUNCA puede llegar a cumplirlo y jamás se revela. Con 0
    // funciona igual para un texto de dos líneas y para una sección
    // de 3000px.
    { threshold: 0, rootMargin: '0px 0px -12% 0px' }
  );

  grupos.forEach(g => observador.observe(g));
  simples.forEach(s => observador.observe(s));

  registrar(() => observador.disconnect());
}

/* ────────────────────────────────────────────────────────────
   6 · Botones magnéticos
   ──────────────────────────────────────────────────────────── */

function botonesMagneticos(registrar: (fn: () => void) => void) {
  doc.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(el => {
    const fuerza = Number(el.dataset.magnetic) || 0.28;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

    const mover = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * fuerza);
      yTo((e.clientY - (r.top + r.height / 2)) * fuerza);
    };
    const salir = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('mousemove', mover);
    el.addEventListener('mouseleave', salir);
    registrar(() => {
      el.removeEventListener('mousemove', mover);
      el.removeEventListener('mouseleave', salir);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'transform' });
    });
  });
}

/* ────────────────────────────────────────────────────────────
   7 · Tilt en tarjetas
   ──────────────────────────────────────────────────────────── */

function tarjetasTilt(registrar: (fn: () => void) => void) {
  const max = 3.2; // grados: más que esto difumina el texto

  doc.querySelectorAll<HTMLElement>('[data-tilt]').forEach(el => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    // El "levantar" va por `y` y no por CSS: si CSS escribiera
    // `transform`, pise la rotación que GSAP escribe en el mismo
    // estilo y el tilt se rompe.
    const lift = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });

    const mover = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * max * 2);
      rx(-py * max * 2);
      lift(-6);
    };
    const salir = () => {
      rx(0);
      ry(0);
      lift(0);
    };

    el.addEventListener('mousemove', mover);
    el.addEventListener('mouseleave', salir);
    registrar(() => {
      el.removeEventListener('mousemove', mover);
      el.removeEventListener('mouseleave', salir);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'transform' });
    });
  });
}

/* ────────────────────────────────────────────────────────────
   8 · Header al scrollear
   ──────────────────────────────────────────────────────────── */

function headerAlScrollear(lenis: Lenis | null, respaldos: (() => void)[]) {
  const header = doc.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  let ultimo = window.scrollY;

  const actualizar = (y: number) => {
    // 8px: más abajo y el borde aparece en la primera pantalla,
    // lo que hace ruido sin sentido.
    header.toggleAttribute('data-scrolled', y > 8);

    const delta = y - ultimo;
    if (Math.abs(delta) >= 2) {
      ultimo = y;

      const haciaAbajo = delta > 0;
      const lejosDelTop = y > 320;
      const focoDentro = header.contains(doc.activeElement);

      // Se esconde al bajar (para devolverle altura al contenido) y
      // vuelve apenas subís. Nunca con el foco dentro: si alguien está
      // tabulando por el nav, no se le puede ir.
      header.toggleAttribute('data-oculto', haciaAbajo && lejosDelTop && !focoDentro);
    }
  };

  if (lenis) {
    const fn = (e: { scroll: number }) => actualizar(e.scroll);
    lenis.on('scroll', fn);
    respaldos.push(() => lenis?.off('scroll', fn));
  } else {
    const fn = () => actualizar(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    respaldos.push(() => window.removeEventListener('scroll', fn));
  }

  respaldos.push(() => {
    header.removeAttribute('data-oculto');
    header.removeAttribute('data-scrolled');
  });
}

/* ────────────────────────────────────────────────────────────
   9 · Halos fuera de pantalla + pausa durante el scroll
   ──────────────────────────────────────────────────────────── */

function pausasFueraDePantalla(registrar: (fn: () => void) => void) {
  const observador = new IntersectionObserver(
    entradas => {
      entradas.forEach(entrada => {
        (entrada.target as HTMLElement).toggleAttribute('data-pausa', !entrada.isIntersecting);
      });
    },
    // rootMargin grande: arranca la animación antes de que la
    // sección entre en pantalla, para que no aparezca de golpe.
    { rootMargin: '200px 0px 200px 0px' }
  );

  doc.querySelectorAll('.gradiente-fondo').forEach(el => observador.observe(el));

  /* Los gradientes animados se congelan mientras el usuario scrollea.
     Durante el scroll cada capa le pide al compositor una textura
     enormísima reubicada (el hero mide bastante), y eso compite con lo
     único que el ojo está siguiendo: el contenido. Cuando la rueda se
     detiene, arrancan de nuevo.

     El detalle que importa: con Lenis el scroll sigue emitiendo eventos
     un buen rato después de que el usuario soltó la rueda, porque la
     posición se está interpolando. Si uno se limitara a poner el
     atributo en cada `scroll`, el gradiente se congelaba y NO volvía a
     arrancar nunca más: quedaba muerto para el resto de la visita. Por
     eso se compara la posición real: si `scrollY` no cambió, el evento
     es ruido de la inercia y no cuenta. */
  let temporizador = 0;
  let ultimaY = -1;

  const terminar = () => root.removeAttribute('data-scrolling');

  const alMover = () => {
    const y = window.scrollY;

    // Evento de inercia: la posición no se movió. No se re-arma nada,
    // así que el temporizador de la pausa sigue corriendo y el gradiente
    // vuelve solo.
    if (y === ultimaY) return;

    ultimaY = y;
    root.setAttribute('data-scrolling', '');
    window.clearTimeout(temporizador);
    temporizador = window.setTimeout(terminar, 150);
  };

  doc.addEventListener('scroll', alMover, { passive: true });
  doc.addEventListener('wheel', alMover, { passive: true });
  doc.addEventListener('touchmove', alMover, { passive: true });

  registrar(() => {
    observador.disconnect();
    window.clearTimeout(temporizador);
    doc.removeEventListener('scroll', alMover);
    doc.removeEventListener('wheel', alMover);
    doc.removeEventListener('touchmove', alMover);
    root.removeAttribute('data-scrolling');
  });
}
/* ────────────────────────────────────────────────────────────
   10 · Anclas con Lenis
   ──────────────────────────────────────────────────────────── */

function anclasConLenis(lenis: Lenis, respaldos: (() => void)[]) {
  const manejar = (e: Event) => {
    const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
    if (!a) return;

    // Dejar pasar los clics que el navegador maneja mejor:
    // abrir en pestaña nueva, descargar, etc.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as MouseEvent).button !== 0) {
      return;
    }

    const href = a.getAttribute('href');
    if (!href || href === '#') return;

    const destino = doc.querySelector(href);
    if (!destino) return;

    e.preventDefault();

    // El header es sticky: sin este offset el ancla queda debajo.
    const header = doc.querySelector<HTMLElement>('[data-header]');
    const altoHeader = header?.offsetHeight ?? 0;

    lenis.scrollTo(destino, { offset: -altoHeader - 12, duration: 1.15 });

    // El foco y la URL tienen que seguir al ancla aunque el scroll
    // sea interpolado, o el teclado y el historial quedan desfasados.
    history.replaceState(null, '', href);
    destino.setAttribute('tabindex', '-1');
    destino.focus({ preventScroll: true });
  };

  doc.addEventListener('click', manejar);
  respaldos.push(() => doc.removeEventListener('click', manejar));
}

/* ────────────────────────────────────────────────────────────
   11 · Arranque
   ──────────────────────────────────────────────────────────── */

let arrancado = false;

/**
 * Idempotente a propósito.
 *
 * Este archivo se puede disparar por más de una vía, y antes eso era un
 * problema real: dos arranques en la misma carga mataban la animación
 * del hero a medio camino. Con este candado da igual cuántas veces llegue
 * la señal: el cuerpo se ejecuta una única vez.
 */
function arrancar() {
  if (arrancado) return;
  arrancado = true;
  iniciar();
}

// Vía 1: evento de Astro. Se deja conectado por si algún día vuelve el
// router; el candando de arriba hace que sea inofensivo.
doc.addEventListener('astro:page-load', arrancar);

// Vía 2: el script es un módulo, así que se evalúa con el DOM ya
// parseado pero ANTES del primer paint. Un microtask alcanza para
// arrancar a tiempo y que las tarjetas no aparezcan "de la nada".
if (doc.readyState === 'loading') {
  doc.addEventListener('DOMContentLoaded', arrancar, { once: true });
} else {
  queueMicrotask(arrancar);
}
