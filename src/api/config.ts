/**
 * Base del API. Todo lo que empieza con VITE_ termina en el bundle y es público.
 *
 * En producción es VACÍA a propósito: la web pide `/api/...` a su propio
 * dominio y el hosting lo reenvía al backend en Render (`vercel.json`). Así la
 * cookie de refresh es del mismo sitio que la web y no una cookie de tercero,
 * que Safari bloquea: sin esto, un socio con iPhone perdería la sesión con
 * cada F5. Por eso `??` y no `||`: el string vacío es un valor, no "no definido".
 *
 * Los `.env` no se suben al repo, así que el build de producción puede correr
 * sin ninguna variable (por ejemplo en Vercel): el valor por defecto depende
 * del modo, para que un build de producción nunca apunte a `localhost`.
 */
export const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8080');

export const ENTORNO: string =
  import.meta.env.VITE_ENV_NAME || (import.meta.env.PROD ? 'production' : 'local');

export const ES_PRODUCCION = ENTORNO === 'production';

/**
 * Tope de espera de cada petición. Generoso a propósito: el arranque en frío de
 * Render tardó más de 90 s la primera vez (24/09), y cortar antes haría fallar
 * justo la petición que lo despierta. Sin tope, en cambio, un backend colgado
 * deja los spinners girando para siempre.
 */
export const TIMEOUT_MS = 100_000;
