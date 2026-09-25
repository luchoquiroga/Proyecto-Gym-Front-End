import api from '../../api/axios';
import type { GananciasMensuales, SociosPorEstado } from './types';

/** Sin parámetros devuelve el mes en curso. */
export const obtenerGananciasMensuales = (anio?: number, mes?: number) =>
  api
    .get<GananciasMensuales>('/api/v1/dashboard/ganancias-mensuales', {
      params: anio && mes ? { anio, mes } : undefined,
    })
    .then((r) => r.data);

/**
 * Un elemento por mes de `desde` a `hasta` (`AAAA-MM`, los dos inclusive), del
 * más viejo al más nuevo y también los meses sin cobros. Tope de 24 meses.
 */
export const obtenerGananciasPorMes = (desde: string, hasta: string) =>
  api
    .get<GananciasMensuales[]>('/api/v1/dashboard/ganancias-por-mes', {
      params: { desde, hasta },
    })
    .then((r) => r.data);

/** Cuántos socios hay hoy en cada estado. Lo cuenta el backend, nunca el navegador. */
export const obtenerSociosPorEstado = () =>
  api.get<SociosPorEstado>('/api/v1/dashboard/socios').then((r) => r.data);
