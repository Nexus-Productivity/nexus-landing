/**
 * ═══════════════════════════════════════════════════════════
 * COPY DE LA LANDING — fuente única de verdad
 * ═══════════════════════════════════════════════════════════
 * El texto vive acá, no en los componentes. Si cambia una frase,
 * se cambia en un lugar y se actualiza la página entera.
 *
 * Voz: sobria, directa, sin humo. Se habla de resultados y del
 * dolor del cliente, nunca de la arquitectura interna.
 */

/**
 * Marca visible. Decidido el 2-oct-2026: NEXUS THRIVE.
 *
 * "Nexus" sola estaba saturadísimo (ya verificado: hay marca
 * registrada y miles de negocios con el nombre). "Thrive" ancla
 * el crecimiento y se lee igual en español, inglés y francés.
 *
 * Este string alimenta title, og:site_name, footer y el wordmark
 * del logo. Cambiar la marca es cambiar ESTA línea, no media web.
 *
 * OJO: la razón social registrada sigue siendo NEXUS; esta es la
 * marca comercial del sitio. La formalización llega a los 18.
 */
export const marca = 'NEXUS THRIVE';
export const promesa =
  'La organización que le quita a los negocios el trabajo de darse a conocer y de ordenarse.';

/**
 * Frases que rotan en la ranura dorada del hero.
 *
 * Dos reglas importan y no son estéticas:
 *
 * 1. Todas miden parecido (13–16 caracteres). Si una es mucho más larga,
 *    el título crece y el hero "rueda" al rotar.
 * 2. El héroe reserva la altura de la más alta, así que una frase que
 *   .parta en dos líneas no rompe nada: simplemente ocupa dos líneas para
 *    siempre. Igual conviene que quepan en 320px.
 */
export const frasesRotativas = [
  'darse a conocer',
  'que te encuentren',
  'que te elijan',
  'ganar clientes',
];

export const descripcionLarga =
  'Empezamos por lo que más duele: que no te encuentren. Después ayudamos a atraer clientes de forma constante y, más adelante, a tener tus cuentas y tus clientes en un solo lugar.';

export const sinPromesas = [
  'No vendemos herramientas, vendemos trabajo quitado.',
  'Detrás hay software que construimos nosotros, pero tú no tienes que entenderlo.',
  'Solo ves que tu negocio se conoce más y se maneja con menos esfuerzo.',
];

/** El método en 4 pasos. Es lo que reemplazaba al “manifiesto”. */
export const metodo: { paso: string; titulo: string; texto: string }[] = [
  {
    paso: '01',
    titulo: 'Gratis',
    texto:
      'Te armamos tu ficha de Google para que aparezcas en el mapa. Es el primer paso y no cuesta nada.',
  },
  {
    paso: '02',
    titulo: 'Conversamos',
    texto:
      'Te hacemos las preguntas que nos permiten proponerte lo justo. No es un catálogo: es entender qué te pasa.',
  },
  {
    paso: '03',
    titulo: 'Propuesta cerrada',
    texto:
      'Dos opciones con precio fijo, una para arrancar y otra más completa, para que la revises tranquilo.',
  },
  {
    paso: '04',
    titulo: 'Pago en dos partes',
    texto: '50% al iniciar y 50% al entregar. Sin anticipos de un año ni surprises.',
  },
];

/** Por qué Nexus y no otra opción. */
export const diferenciadores: { titulo: string; texto: string }[] = [
  {
    titulo: 'Entendemos antes de construir',
    texto: 'No te vendemos una plantilla. Primero vemos qué te está costando tiempo.',
  },
  {
    titulo: 'Hablamos de resultados',
    texto: 'No de tecnología. Si no se nota en tu negocio, no lo hacemos.',
  },
  {
    titulo: 'Un solo equipo',
    texto:
      'Tu página, tus redes y más adelante tu orden interno. Sin coordinar tres proveedores que no se hablan.',
  },
  {
    titulo: 'Corregimos rápido',
    texto: 'Si algo no cuadra, lo decís y se ajusta. Lo dijiste, lo arreglamos.',
  },
  {
    titulo: 'Entrada accesible, camino largo',
    texto: 'Puedes empezar pequeño y crecer a tu ritmo, sin comprar de más.',
  },
];

/**
 * El argumento que más pesa y que antes no estaba en la web:
 * para quien vive de recomendaciones, las redes no son un canal de
 * captación — son la prueba de que existís.
 */
export const argumentoBocaABoca = {
  titulo: 'Si tu negocio vive de recomendaciones, las redes no son un canal: son una prueba.',
  texto:
    'Cuando alguien te recomienda, lo primero que hace es buscarte. Si encuentra información vieja, redes sin movimiento o nada, la recomendación se pierde. Por eso ordenar tu presencia no es publicity: es lo que convierte a un referido en un cliente.',
};

/** Las dudas que casi siempre aparecen. */
export const faq: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: '¿Es caro?',
    respuesta:
      'Empiezas por lo gratis, y la etapa Visible está pensada para que sea el primer paso, no el único. Además cada adicional se cobra aparte: si no lo necesitas, no lo pagas.',
  },
  {
    pregunta: 'No tengo tiempo.',
    respuesta:
      'Justamente por eso existe NEXUS: tú nos pasas el material y nosotros armamos y publicamos. Tu trabajo es contarnos qué querés lograr.',
  },
  {
    pregunta: 'Ya tengo Instagram.',
    respuesta:
      'Perfecto, lo ordenamos y le damos un calendario. El problema casi nunca es no tener redes, sino que no cuenten lo que hacés.',
  },
  {
    pregunta: 'No sé nada de tecnología.',
    respuesta:
      'No tenés que saber. Nosotros nos encargamos de todo y vos nos decís lo que querés lograr.',
  },
  {
    pregunta: '¿Puedo comprar solo una etapa?',
    respuesta:
      'Sí. Cada etapa incluye la anterior y si subés de nivel solo pagás la diferencia. Empezás por lo que necesitás.',
  },
  {
    pregunta: '¿Qué pasa si después quiero seguir?',
    respuesta:
      'La etapa Ordenado —tener clientes, caja y reportes en un solo lugar— está en construcción. No la vendemos hasta que exista. Cuando exista, se suma a lo que ya tenés.',
  },
];

/**
 * Lo que no prometemos. Sostiene la credibilidad y evita el
 * “contenido diario” que es insostenible.
 */
export const loQueNoPrometemos = [
  'No prometemos contenido diario. Proponemos un número que se cumpla.',
  'No entregamos todo de una. Primero lo que falta existir, después lo demás.',
  'No inventamos casos de éxito. Cuando entregues el primero, va aquí.',
];