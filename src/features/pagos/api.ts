import api from '../../api/axios';
import type { PaginaResponse, ParametrosPagina } from '../../types/api';
import type { PagoResponse } from './types';

export interface PagosQuery extends ParametrosPagina {
  /** Fechas ISO (2026-09-01). Opcionales. */
  desde?: string;
  hasta?: string;
}

export const listarPagos = (params: PagosQuery) =>
  api.get<PaginaResponse<PagoResponse>>('/api/v1/pagos', { params }).then((r) => r.data);
