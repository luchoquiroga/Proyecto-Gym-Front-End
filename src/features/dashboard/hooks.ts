import { useQuery } from '@tanstack/react-query';
import { obtenerGananciasMensuales, obtenerSociosPorEstado } from './api';

export const useGananciasMensuales = (anio?: number, mes?: number) =>
  useQuery({
    queryKey: ['dashboard', 'ganancias', { anio, mes }],
    queryFn: () => obtenerGananciasMensuales(anio, mes),
    staleTime: 1000 * 60 * 5,
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
