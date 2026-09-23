import type { Principal, TipoPortal } from './types';

/**
 * A dónde va cada principal cuando entra, o cuando pide una ruta que no le
 * corresponde. Vive acá para que el login, el guard y la redirección de la raíz
 * no se contradigan entre sí.
 */
/**
 * Cada portal tiene su propia puerta: el staff entra con su nombre de usuario y
 * el socio con su email, contra endpoints distintos. Sin sesión, cada área
 * manda a la suya.
 */
export const RUTAS_LOGIN: Record<TipoPortal, string> = {
  staff: '/login',
  socio: '/socio/ingresar',
};

export function rutaInicial(principal: Principal): string {
  if (principal.tipo === 'socio') return '/socio/resumen';
  return principal.rol === 'ADMIN' ? '/staff/dashboard' : '/staff/socios';
}
