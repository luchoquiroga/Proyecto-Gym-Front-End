import { useQueries, useQuery } from '@tanstack/react-query';
import type { AnioMes } from '../../lib/fechas';
import { obtenerGananciasMensuales, obtenerSociosPorEstado } from './api';

export const useGananciasMensuales = (anio?: number, mes?: number) =>
  useQuery({
    queryKey: ['dashboard', 'ganancias', { anio, mes }],
    queryFn: () => obtenerGananciasMensuales(anio, mes),
    staleTime: 1000 * 60 * 5,
  });

/**
 * Las ganancias de varios meses, una petición por mes y en paralelo: el backend
 * todavía no tiene un endpoint que devuelva la serie (pedido anotado en la
 * bitácora). Usa la misma clave que `useGananciasMensuales` con ese mes, así
 * que comparte cache con el resumen del desglose de pagos.
 *
 * `combine` junta las 12 en un solo estado: si una falla, falla la serie
 * entera. Un gráfico con un mes de menos mentiría: parecería que ese mes no
 * entró plata.
 */
export const useGananciasDeMeses = (meses: AnioMes[]) =>
  useQueries({
    queries: meses.map(({ anio, mes }) => ({
      queryKey: ['dashboard', 'ganancias', { anio, mes }],
      queryFn: () => obtenerGananciasMensuales(anio, mes),
      staleTime: 1000 * 60 * 5,
    })),
    combine: (resultados) => {
      const conError = resultados.find((r) => r.isError);
      const datos = resultados.flatMap((r) => (r.data ? [r.data] : []));
      return {
        // Solo con los doce: una serie incompleta no se dibuja.
        datos: datos.length === resultados.length ? datos : undefined,
        cargando: resultados.some((r) => r.isLoading),
        error: conError?.error ?? null,
        reintentar: () => resultados.forEach((r) => r.isError && r.refetch()),
      };
    },
  });

/**
 * Cuelga de `['dashboard']` para que la invaliden las mismas escrituras que
 * cambian estados: cobrar, dar de alta y dar de baja.
 */
export const useSociosPorEstado = () =>
  useQuery({
    queryKey: ['dashboard', 'socios'],
    queryFn: obtenerSociosPorEstado,
  });
