/**
 * ═══════════════════════════════════════════════════════════
 * CONTACTO — fuente única de verdad
 * ═══════════════════════════════════════════════════════════
 * Todo lo que cambia acá se refleja en el navbar, el hero, la
 * sección de contacto y el footer. No hay números Repetidos.
 *
 * ⚠️  PENDIENTE — el CEO va a confirmar estos datos.
 *     · WhatsApp: hoy está el número que ya figura como contacto
 *       comercial en la propuesta NX-001. Cambiar acá si es otro.
 *     · Instagram: vacío a propósito. While esté vacío, el ícono
 *       no se renderiza (mejor que un link roto).
 *     · Email: vacío a propósito. El dominio no tiene MX/SPF/DMARC,
 *       así que hoy no llega correo a ningún lado. No publicar un
 *       email que no recibe.
 */

export const whatsappNumero = '573237453913'; // formato E.164: país + número, sin + ni espacios

export const whatsappMensaje =
  'Hola, te escribo desde la web de NEXUS. Quiero contarte cómo funciona la etapa Visible.';

export const whatsappUrl = `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(
  whatsappMensaje
)}`;

export const whatsappTextoBoton = 'Escríbenos por WhatsApp';

export const instagramHandle = ''; // ej: 'nexusthrive'

export const instagramUrl = instagramHandle
  ? `https://instagram.com/${instagramHandle.replace(/^@/, '')}`
  : null;

export const instagramTexto = 'Instagram';

export const email = ''; // sin MX el correo no llega: no publicar hasta tener dominio con correo

export const githubUrl = 'https://github.com/Nexus-Productivity';

/** Texto corto para el footer y el aviso legal. */
export const ciudad = 'Cartagena, Colombia';