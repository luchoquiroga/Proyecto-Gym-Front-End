import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TAMANIO_PAGINA } from '../../types/api';
import { listarPagos, registrarPago, type PagosQuery } from './api';

export const usePagos = (params: Omit<PagosQuery, 'size'> & { size?: number }) => {
  const consulta: PagosQuery = { size: TAMANIO_PAGINA, ...params };
  return useQuery({
    queryKey: ['pagos', consulta],
    queryFn: () => listarPagos(consulta),
  });
};

/**
 * Cobrar cambia mucho más que la lista de pagos: cambia el estado, el
 * vencimiento y el plan vigente del socio, y las ganancias del mes. Si solo se
 * invalidara `['pagos']`, el listado de socios seguiría mostrando MOROSO a
 * alguien a quien se le acaba de cobrar, y se le cobraría dos veces.
 */
export const useRegistrarPago = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registrarPago,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['socios'] }),
        queryClient.invalidateQueries({ queryKey: ['pagos'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  });
};
