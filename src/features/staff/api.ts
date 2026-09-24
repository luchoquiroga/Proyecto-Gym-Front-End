import api from '../../api/axios';
import type { PaginaResponse, ParametrosPagina } from '../../types/api';
import type { CuentaRequest, CuentaStaff } from './types';

/** Único lugar del front que conoce las rutas de cuentas de staff. Todas son solo ADMIN. */

/** Por qué se puede ordenar, y a qué campos de la ENTIDAD `Usuario`. Lista cerrada. */
export const ORDENABLES_CUENTAS = {
  usuario: ['nombre'],
  rol: ['rol', 'nombre'],
  estado: ['activo', 'nombre'],
} as const;

export type ColumnaCuenta = keyof typeof ORDENABLES_CUENTAS;

export interface CuentasQuery extends ParametrosPagina {
  sort?: readonly string[];
}

/**
 * Incluye las cuentas dadas de baja (`activo: false`): son las que hay que ver
 * para poder reactivarlas. `indexes: null` manda `sort=a&sort=b`, que es lo que
 * entiende Spring (con `sort[]=` lo ignora sin avisar).
 */
export const listarCuentas = (params: CuentasQuery) =>
  api
    .get<PaginaResponse<CuentaStaff>>('/api/v1/usuarios', { params, paramsSerializer: { indexes: null } })
    .then((r) => r.data);

/**
 * 201. El nombre repetido es un 400, no un 409, y tiene dos mensajes: "ya
 * existe" si la cuenta está activa, o "reactivala en vez de crear una nueva" si
 * está dada de baja (el nombre sigue ocupado).
 */
export const crearCuenta = (datos: CuentaRequest) =>
  api.post<CuentaStaff>('/api/v1/usuarios', datos).then((r) => r.data);

/**
 * La baja Y la reactivación: un solo endpoint. No borra nada. La baja revoca
 * las sesiones de esa cuenta. El backend rechaza darse de baja a uno mismo y
 * dar de baja al último ADMIN activo (400 con mensaje).
 */
export const cambiarActivoCuenta = (id: number, activo: boolean) =>
  api.patch<CuentaStaff>(`/api/v1/usuarios/${id}/activo`, { activo }).then((r) => r.data);

/**
 * Reset de la contraseña de OTRA cuenta ("se olvidó la clave"). No pide la
 * actual: el ADMIN no la sabe. Contra uno mismo, el backend lo rechaza. Revoca
 * las sesiones de esa cuenta.
 */
export const resetearContrasenaCuenta = (id: number, nuevaContrasena: string) =>
  api
    .put<CuentaStaff>(`/api/v1/usuarios/${id}/contrasena`, { nuevaContrasena })
    .then((r) => r.data);
