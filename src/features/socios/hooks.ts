import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TAMANIO_PAGINA } from '../../types/api';
import {
  actualizarSocio,
  buscarSocios,
  crearSocio,
  darDeBajaSocio,
  listarSocios,
  obtenerSocio,
} from './api';
import type { SocioRequest } from './types';

/**
 * Claves de cache: recurso → parámetros. Invalidar `['socios']` alcanza para
 * todas (listado, búsqueda y ficha), que es lo que hay que hacer después de
 * cobrar o de dar de baja.
 */

export const useSocios = (pagina: number, tamanio = TAMANIO_PAGINA) =>
  useQuery({
    queryKey: ['socios', { page: pagina, size: tamanio }],
    queryFn: () => listarSocios({ page: pagina, size: tamanio }),
  });

export const useBuscarSocios = (nombre: string) => {
  const termino = nombre.trim();
  return useQuery({
    queryKey: ['socios', 'buscar', termino],
    queryFn: () => buscarSocios(termino),
    enabled: termino.length > 0,
  });
};

export const useSocio = (id: number | null) =>
  useQuery({
    queryKey: ['socios', id],
    queryFn: () => obtenerSocio(id as number),
    enabled: id !== null,
  });

/**
 * Mutaciones.
 *
 * Las tres invalidan `['socios']` entero, no solo la página que tocaron: el
 * alta cambia el total del padrón, la edición cambia una fila que puede estar
 * en cualquier página y en la búsqueda, y la baja cambia el estado.
 */

export const useCrearSocio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearSocio,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socios'] }),
  });
};

export const useActualizarSocio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: SocioRequest }) => actualizarSocio(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socios'] }),
  });
};

export const useDarDeBajaSocio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: darDeBajaSocio,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socios'] }),
  });
};
