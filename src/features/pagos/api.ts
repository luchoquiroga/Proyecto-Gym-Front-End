import api from '../../api/axios';
import type { PaginaResponse, ParametrosPagina } from '../../types/api';
import type { PagoRequest, PagoResponse } from './types';

export interface PagosQuery extends ParametrosPagina {
  /** Fechas ISO (2026-09-01). Opcionales. */
  desde?: string;
  hasta?: string;
}

export const listarPagos = (params: PagosQuery) =>
  api.get<PaginaResponse<PagoResponse>>('/api/v1/pagos', { params }).then((r) => r.data);

/**
 * Cobrar. ADMIN y GERENCIA (es la única operación de pagos que GERENCIA puede
 * hacer: ninguna lectura). Responde 201. Quién cobró lo saca el backend del
 * token, así que no viaja en el cuerpo.
 */
export const registrarPago = (datos: PagoRequest) =>
  api.post<PagoResponse>('/api/v1/pagos', datos).then((r) => r.data);
