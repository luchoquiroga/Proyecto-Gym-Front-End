import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TAMANIO_PAGINA } from '../../types/api';
import { cambiarActivoCuenta, crearCuenta, listarCuentas, resetearContrasenaCuenta } from './api';

export const useCuentas = (pagina: number, sort: readonly string[]) =>
  useQuery({
    queryKey: ['staff', { page: pagina, sort }],
    queryFn: () => listarCuentas({ page: pagina, size: TAMANIO_PAGINA, sort }),
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
