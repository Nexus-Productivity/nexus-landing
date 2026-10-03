/**
 * ═══════════════════════════════════════════════════════════
 * PRECIOS — fuente única de verdad
 * ═══════════════════════════════════════════════════════════
 * Estos son los números de la propuesta NX-001 (2-oct-2026), que
 * es el documento que ya tiene un cliente. Si en la web se
 * publica otra cifra, el PDF y la página quedan contradiciéndose.
 *
 * ⚠️  PENDIENTE — el CEO tiene dos versiones de los precios:
 *     · NX-001 (lo que está en el PDF):  900.000 / 1.700.000
 *     · Un borrador de pitch:          1.500.000 / 2.500.000
 *     Acá están los de NX-001 porque son los únicos que ya
 *     salieron de la organización. Cambiar acá si decide otra cosa.
 *
 * ⚠️  El Cuidado trimestral promete horas reales (hosting, copias,
 *     cambios menores, soporte) y todavía no hay horas medidas por
 *     proyecto. Es el número más probable que se mueva.
 */

export type Etapa = {
  id: string;
  nombre: string;
  resultado: string;
  incluye: string[];
  /** Precio de instalación, pesos colombianos. null = sin precio. */
  precio: number | null;
  /** Precio del Cuidado trimestral opcional, o null si no aplica. */
  cuidado: number | null;
  entrega: string;
  estado: 'disponible' | 'en-construccion';
};

export const etapas: Etapa[] = [
  {
    id: 'visible',
    nombre: 'Visible',
    resultado: 'Que te encuentren y te conozcan',
    incluye: [
      'Página propia con tu tarifario, tu misión y tu historia',
      'Botón de WhatsApp y formulario de contacto',
      'Ajustes para aparecer en Google',
      'Un idioma extra',
    ],
    precio: 900_000,
    cuidado: 100_000,
    entrega: '10 días hábiles',
    estado: 'disponible',
  },
  {
    id: 'conectado',
    nombre: 'Conectado',
    resultado: 'Que tus clientes te escriban sin esfuerzo',
    incluye: [
      'Todo lo de la etapa Visible',
      'Una página por cada servicio, con “solicitar cotización”',
      'Perfiles de redes ordenados',
      'Un calendario de contenido',
    ],
    precio: 1_700_000,
    cuidado: 200_000,
    entrega: '15 días hábiles',
    estado: 'disponible',
  },
  {
    id: 'ordenado',
    nombre: 'Ordenado',
    resultado: 'Que sepas cuánto ganas y a quién le vendes',
    incluye: [
      'Clientes, caja y reportes mensuales en un solo lugar',
      'Historial de efectivo y gráficas',
    ],
    precio: null, // sin precio a propósito: todavía no existe
    cuidado: null,
    entrega: 'Sin fecha',
    estado: 'en-construccion',
  },
];

/** Lo que se puede sumar o quitar, cada cosa por su lado. */
export const adicionales: { nombre: string; detalle: string }[] = [
  { nombre: 'Idiomas adicionales', detalle: 'Cada idioma extra se cotiza aparte.' },
  { nombre: 'Páginas por servicio', detalle: 'Cada página adicional, aparte.' },
  { nombre: 'Contenido de redes', detalle: '8 o 12 piezas al mes.' },
  {
    nombre: 'Cuidado trimestral',
    detalle: 'Hosting, copias de seguridad, cambios menores y soporte.',
  },
];

/** Forma 900000 → "$900.000" (es-CO) */
export function formatCOP(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`;
}

/** Precio "desde" para el hero y la ruta. */
export const precioDesde = etapas.find((e) => e.precio !== null)?.precio ?? null;