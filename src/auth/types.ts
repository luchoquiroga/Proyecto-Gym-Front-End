/**
 * El backend tiene DOS tipos de principal deliberadamente separados
 * (CONTRATO-API §1): `Usuario` (staff: ADMIN / GERENCIA) y `Cliente` (socio).
 * Dos logins, dos refresh, dos cookies.
 *
 * Por eso acá NO existe un `RolUsuario = 'ADMIN' | 'CLIENTE' | 'GERENCIA'`:
 * esa mezcla es justamente la que el backend se cuidó de no hacer. `CLIENTE`
 * no es un rol de staff, es un claim de un token de otra tabla.
 */

export type RolStaff = 'ADMIN' | 'GERENCIA';

/** Qué puerta usó el principal para entrar. Decide login, refresh y logout. */
export type TipoPortal = 'staff' | 'socio';

export type Principal =
  | { tipo: 'staff'; id: number; nombre: string; rol: RolStaff }
  | { tipo: 'socio'; id: number; nombre: string; apellido: string };

/** `POST /usuarios/login` y `/usuarios/refresh` devuelven el principal acá. */
export interface UsuarioResponse {
  id: number;
  nombre: string;
  rol: RolStaff;
  activo: boolean;
}

export interface LoginStaffResponse {
  mensaje?: string;
  accessToken: string;
  usuario: UsuarioResponse;
}

/**
 * `POST /clientes/login` y `/clientes/refresh` devuelven un `ClienteResponse`
 * completo bajo la clave `cliente` (asimetría real del backend: en staff la
 * clave es `usuario`). Acá solo se tipa lo que hace falta para armar el
 * principal; la ficha completa la lee la feature del portal con `GET /clientes/{id}`.
 */
export interface LoginSocioResponse {
  mensaje?: string;
  accessToken: string;
  cliente: { id: number; nombre: string; apellido: string };
}

export interface CredencialesStaff {
  nombre: string;
  contrasena: string;
}

export interface CredencialesSocio {
  email: string;
  contrasena: string;
}
