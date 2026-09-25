import { useQuery } from '@tanstack/react-query';
import type { AnioMes } from '../../lib/fechas';
import { obtenerGananciasMensuales, obtenerGananciasPorMes, obtenerSociosPorEstado } from './api';

export const useGananciasMensuales = (anio?: number, mes?: number) =>
  useQuery({
    queryKey: ['dashboard', 'ganancias', { anio, mes }],
    queryFn: () => obtenerGananciasMensuales(anio, mes),
    staleTime: 1000 * 60 * 5,
  });

const aAnioMes = ({ anio, mes }: AnioMes) => `${anio}-${String(mes).padStart(2, '0')}`;

/**
 * Las ganancias de varios meses consecutivos en una sola petición
 * (`/ganancias-por-mes`, B6). El rango se manda explícito, con el primer y el
 * último mes de `meses`, para que el eje del gráfico y la respuesta salgan del
 * mismo "hoy" (el del navegador) y no del reloj del servidor.
 *
 * El backend trae también los meses en cero, así que la serie llega completa o
 * no llega: no hay que decidir qué hacer si falta uno.
 */
export const useGananciasDeMeses = (meses: AnioMes[]) => {
  const desde = meses.length ? aAnioMes(meses[0]) : '';
  const hasta = meses.length ? aAnioMes(meses[meses.length - 1]) : '';
  const consulta = useQuery({
    queryKey: ['dashboard', 'ganancias-por-mes', { desde, hasta }],
    queryFn: () => obtenerGananciasPorMes(desde, hasta),
    enabled: meses.length > 0,
    staleTime: 1000 * 60 * 5,
  });
  return {
    datos: consulta.data,
    cargando: consulta.isLoading,
    error: consulta.error,
    reintentar: () => void consulta.refetch(),
  };
};

/**
 * Cuelga de `['dashboard']` para que la invaliden las mismas escrituras que
 * cambian estados: cobrar, dar de alta y dar de baja.
 */
export const useSociosPorEstado = () =>
  useQuery({
    queryKey: ['dashboard', 'socios'],
    queryFn: obtenerSociosPorEstado,
  });
