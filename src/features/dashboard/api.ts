import api from '../../api/axios';
import type { GananciasMensuales } from './types';

/** Sin parámetros devuelve el mes en curso. */
export const obtenerGananciasMensuales = (anio?: number, mes?: number) =>
  api
    .get<GananciasMensuales>('/api/v1/dashboard/ganancias-mensuales', {
      params: anio && mes ? { anio, mes } : undefined,
    })
    .then((r) => r.data);
