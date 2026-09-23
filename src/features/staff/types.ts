import type { RolStaff } from '../../auth/types';

/** Cuentas de staff (CONTRATO-API §3, "Staff — /usuarios"). Todo es solo ADMIN. */

export type { UsuarioResponse as CuentaStaff } from '../../auth/types';

/** `POST /usuarios`. La contraseña pide al menos 8 caracteres. */
export interface CuentaRequest {
  nombre: string;
  contrasena: string;
  rol: RolStaff;
}
