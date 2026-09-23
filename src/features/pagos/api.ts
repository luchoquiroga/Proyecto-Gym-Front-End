import api from '../../api/axios';
import type { PaginaResponse, ParametrosPagina } from '../../types/api';
import type { PagoRequest, PagoResponse } from './types';

export interface PagosQuery extends ParametrosPagina {
  /** Fechas ISO (2026-09-01), inclusive. Filtran por `fechaPago`. */
  desde?: string;
  hasta?: string;
  /** Formato de Spring: `['fechaPago,desc', 'id,desc']`. Campos de la ENTIDAD. */
  sort?: string[];
}

/**
 * Solo ADMIN. Incluye los anulados, marcados con `anulado`: el listado no
 * esconde nada.
 *
 * `indexes: null` hace que axios mande `sort=a&sort=b`, que es lo que entiende
 * Spring. Por defecto mandaría `sort[]=a&sort[]=b`, y el backend lo ignoraría
 * sin avisar.
 */
export const listarPagos = (params: PagosQuery) =>
  api
    .get<PaginaResponse<PagoResponse>>('/api/v1/pagos', {
      params,
      paramsSerializer: { indexes: null },
    })
    .then((r) => r.data);

/**
 * Cobrar. ADMIN y GERENCIA (es la única operación de pagos que GERENCIA puede
 * hacer: ninguna lectura). Responde 201. Quién cobró lo saca el backend del
 * token, así que no viaja en el cuerpo.
 */
export const registrarPago = (datos: PagoRequest) =>
  api.post<PagoResponse>('/api/v1/pagos', datos).then((r) => r.data);

/**
 * Anular un pago cargado por error. Solo ADMIN.
 *
 * Es un POST y no un DELETE: no se borra nada, el pago queda marcado y se sigue
 * listando. Quién anula sale del token. Si otro pago se encadenó a este, el
 * backend responde 400 y pide anular ese primero.
 */
export const anularPago = (id: number, motivo: string) =>
  api.post<PagoResponse>(`/api/v1/pagos/${id}/anulacion`, { motivo }).then((r) => r.data);
