import api from '../../api/axios';
import type { GananciasMensuales, SociosPorEstado } from './types';

/** Sin parámetros devuelve el mes en curso. */
export const obtenerGananciasMensuales = (anio?: number, mes?: number) =>
  api
    .get<GananciasMensuales>('/api/v1/dashboard/ganancias-mensuales', {
      params: anio && mes ? { anio, mes } : undefined,
    })
    .then((r) => r.data);

/** Cuántos socios hay hoy en cada estado. Lo cuenta el backend, nunca el navegador. */
export const obtenerSociosPorEstado = () =>
  api.get<SociosPorEstado>('/api/v1/dashboard/socios').then((r) => r.data);
