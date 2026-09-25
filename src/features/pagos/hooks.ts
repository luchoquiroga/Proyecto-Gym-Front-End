import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TAMANIO_PAGINA } from '../../types/api';
import { anularPago, listarPagos, registrarPago, type PagosQuery } from './api';
import { resultadoIncierto } from '../../lib/errores';

export const usePagos = (params: Omit<PagosQuery, 'size'> & { size?: number }) => {
  const consulta: PagosQuery = { size: TAMANIO_PAGINA, ...params };
  return useQuery({
    queryKey: ['pagos', consulta],
    queryFn: () => listarPagos(consulta),
  });
};

/**
 * Cobrar y anular cambian mucho más que la lista de pagos: cambian el estado,
 * el vencimiento y el plan vigente del socio, y las ganancias del mes. Si solo
 * se invalidara `['pagos']`, el listado de socios seguiría mostrando MOROSO a
 * alguien a quien se le acaba de cobrar, y se le cobraría dos veces.
 */
const invalidarLoQueCambiaUnPago = (queryClient: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['socios'] }),
    queryClient.invalidateQueries({ queryKey: ['pagos'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);

/**
 * Si el resultado es incierto (sin respuesta, o un 5xx), el cobro pudo haberse
 * guardado igual: se refresca también, para que el listado muestre el
 * vencimiento real antes de que alguien vuelva a cobrar.
 */
export const useRegistrarPago = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registrarPago,
    onSuccess: () => invalidarLoQueCambiaUnPago(queryClient),
    onError: (error) => {
      if (resultadoIncierto(error)) void invalidarLoQueCambiaUnPago(queryClient);
    },
  });
};

/** Anular puede devolver al socio al vencimiento del pago anterior, o dejarlo MOROSO. */
export const useAnularPago = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => anularPago(id, motivo),
    onSuccess: () => invalidarLoQueCambiaUnPago(queryClient),
  });
};
