import { useQuery } from '@tanstack/react-query';
import { TAMANIO_PAGINA } from '../../types/api';
import { listarPagos, type PagosQuery } from './api';

export const usePagos = (params: Omit<PagosQuery, 'size'> & { size?: number }) => {
  const consulta: PagosQuery = { size: TAMANIO_PAGINA, ...params };
  return useQuery({
    queryKey: ['pagos', consulta],
    queryFn: () => listarPagos(consulta),
  });
};
