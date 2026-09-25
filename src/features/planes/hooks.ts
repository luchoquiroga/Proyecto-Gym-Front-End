import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actualizarPlan, crearPlan, eliminarPlan, listarPlanes } from './api';
import type { PlanRequest } from './types';

export const usePlanes = () =>
  useQuery({
    queryKey: ['planes'],
    queryFn: listarPlanes,
    // Los planes cambian muy de vez en cuando.
    staleTime: 1000 * 60 * 5,
  });

/**
 * Invalidar `['planes']` es lo que hace que el formulario de cobro tome el
 * precio nuevo: sin esto, el `staleTime` de arriba lo dejaría cobrando con el
 * precio viejo hasta cinco minutos.
 */
export const useCrearPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planes'] }),
  });
};

/**
 * Editar cambia además el nombre que muestran el plan vigente de cada socio y
 * las filas de pagos, que lo leen del plan.
 */
export const useActualizarPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: PlanRequest }) => actualizarPlan(id, datos),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['planes'] }),
        queryClient.invalidateQueries({ queryKey: ['socios'] }),
        queryClient.invalidateQueries({ queryKey: ['pagos'] }),
      ]),
  });
};

/** Solo se puede borrar un plan sin pagos, así que ningún socio ni pago lo nombra. */
export const useEliminarPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eliminarPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planes'] }),
  });
};
