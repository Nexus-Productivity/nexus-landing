// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  /**
   * Sin `site`, `Astro.url` resuelve a `http://localhost` y el build
   * horneaba `<link rel="canonical" href="http://localhost:4321/">` en
   * todas las páginas. Eso se sube tal cual: cada página le decía al
   * buscador que su versión canónica era localhost, que es
   * equivalentemente/indexable. Con `site` puesto, Astro.url ya sale
   * absoluto y el canonical queda bien sin tocar el layout.
   */
  site: 'https://nexusthrive.com.co',
});
