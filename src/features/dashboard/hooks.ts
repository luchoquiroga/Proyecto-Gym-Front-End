import { useQuery } from '@tanstack/react-query';
import { obtenerGananciasMensuales } from './api';

export const useGananciasMensuales = (anio?: number, mes?: number) =>
  useQuery({
    queryKey: ['dashboard', 'ganancias', { anio, mes }],
    queryFn: () => obtenerGananciasMensuales(anio, mes),
    staleTime: 1000 * 60 * 5,
  });
