import { useQuery } from '@tanstack/react-query';
import { listarPlanes } from './api';

export const usePlanes = () =>
  useQuery({
    queryKey: ['planes'],
    queryFn: listarPlanes,
    // Los planes cambian muy de vez en cuando.
    staleTime: 1000 * 60 * 5,
  });
