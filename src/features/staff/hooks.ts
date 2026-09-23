import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TAMANIO_PAGINA } from '../../types/api';
import { cambiarActivoCuenta, crearCuenta, listarCuentas, resetearContrasenaCuenta } from './api';

/** Activas primero, y las dadas de baja juntas al final, donde se reactivan. */
const ORDEN = ['activo,desc', 'nombre,asc'];

export const useCuentas = (pagina: number) =>
  useQuery({
    queryKey: ['staff', { page: pagina }],
    queryFn: () => listarCuentas({ page: pagina, size: TAMANIO_PAGINA, sort: ORDEN }),
  });

/** El alta y la baja/reactivación cambian el listado; el reset de contraseña no. */

export const useCrearCuenta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearCuenta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
};

export const useCambiarActivoCuenta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => cambiarActivoCuenta(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });
};

export const useResetearContrasenaCuenta = () =>
  useMutation({
    mutationFn: ({ id, nuevaContrasena }: { id: number; nuevaContrasena: string }) =>
      resetearContrasenaCuenta(id, nuevaContrasena),
  });
