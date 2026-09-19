import type { TipoPortal } from './types';

/**
 * Endpoints de cada portal. El store y el interceptor leen de acá según el
 * principal activo, en vez de tener el refresh de staff quemado en una
 * constante (que es lo que hacía que la sesión de un socio no se pudiera
 * restaurar nunca).
 */
export const PORTALES: Record<TipoPortal, { login: string; refresh: string; logout: string }> = {
  staff: {
    login: '/api/v1/usuarios/login',
    refresh: '/api/v1/usuarios/refresh',
    logout: '/api/v1/usuarios/logout',
  },
  socio: {
    login: '/api/v1/clientes/login',
    refresh: '/api/v1/clientes/refresh',
    logout: '/api/v1/clientes/logout',
  },
};

export const RUTAS_DE_AUTH = Object.values(PORTALES).flatMap((p) => [p.login, p.refresh]);

const CLAVE_ULTIMO_PORTAL = 'gym.ultimoPortal';

/**
 * En el arranque en frío no sabemos quién es hasta que el refresh responde, y
 * las dos cookies son HttpOnly (el JS no las ve). Guardar el último portal
 * usado evita disparar dos refresh en cada carga.
 *
 * Esto NO es una credencial: es el string 'staff' o 'socio'. El token sigue
 * viviendo solo en memoria.
 */
export function leerUltimoPortal(): TipoPortal {
  try {
    return localStorage.getItem(CLAVE_ULTIMO_PORTAL) === 'socio' ? 'socio' : 'staff';
  } catch {
    return 'staff';
  }
}

export function guardarUltimoPortal(portal: TipoPortal): void {
  try {
    localStorage.setItem(CLAVE_ULTIMO_PORTAL, portal);
  } catch {
    // Navegador con el almacenamiento bloqueado: se pierde la optimización, nada más.
  }
}
