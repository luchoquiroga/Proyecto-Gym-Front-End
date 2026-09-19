import type { Principal } from './types';

/**
 * A dónde va cada principal cuando entra, o cuando pide una ruta que no le
 * corresponde. Vive acá para que el login, el guard y la redirección de la raíz
 * no se contradigan entre sí.
 */
export function rutaInicial(principal: Principal): string {
  if (principal.tipo === 'socio') return '/socio/resumen';
  return principal.rol === 'ADMIN' ? '/staff/dashboard' : '/staff/socios';
}
