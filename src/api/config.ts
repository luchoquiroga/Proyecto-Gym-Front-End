/** Base del API. Todo lo que empieza con VITE_ termina en el bundle y es público. */
export const BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const ENTORNO: string = import.meta.env.VITE_ENV_NAME || 'local';

export const ES_PRODUCCION = ENTORNO === 'production';
