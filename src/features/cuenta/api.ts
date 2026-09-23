import api from '../../api/axios';
import type { UsuarioResponse } from '../../auth/types';
import type { CambioContrasenaRequest } from './types';

/**
 * Cambia la contraseña de la cuenta que está logueada. ADMIN y GERENCIA.
 *
 * La actual equivocada es un 400, no un 401: la sesión es válida, lo que está
 * mal es un dato del formulario. Por eso el interceptor no lo toma como sesión
 * vencida.
 *
 * Al cambiarla, el backend revoca TODAS las sesiones de la cuenta.
 */
export const cambiarContrasenaPropia = (datos: CambioContrasenaRequest) =>
  api.put<UsuarioResponse>('/api/v1/usuarios/cambiar-contrasena', datos).then((r) => r.data);
