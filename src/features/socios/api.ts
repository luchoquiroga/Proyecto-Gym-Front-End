import api from '../../api/axios';
import type { PaginaResponse, ParametrosPagina } from '../../types/api';
import type { Socio, SocioAltaResponse, SocioRequest } from './types';

/** Único lugar del front que conoce las rutas y los DTOs de socios. */

export const listarSocios = (params: ParametrosPagina) =>
  api.get<PaginaResponse<Socio>>('/api/v1/clientes', { params }).then((r) => r.data);

/** Coincidencia parcial insensible a mayúsculas. Devuelve lista plana, sin paginar. */
export const buscarSocios = (nombre: string) =>
  api.get<Socio[]>('/api/v1/clientes/buscar', { params: { nombre } }).then((r) => r.data);

/** ADMIN, GERENCIA, o el propio socio pidiendo su id. */
export const obtenerSocio = (id: number) =>
  api.get<Socio>(`/api/v1/clientes/${id}`).then((r) => r.data);

/** 201 con el `codigoActivacion`, que viaja una sola vez. */
export const crearSocio = (datos: SocioRequest) =>
  api.post<SocioAltaResponse>('/api/v1/clientes', datos).then((r) => r.data);

/**
 * Edita los datos de contacto y el documento.
 * El email y la contraseña no se mandan: el backend los ignora a propósito
 * (el email es la identidad de login del socio en el portal).
 */
export const actualizarSocio = (id: number, datos: SocioRequest) =>
  api.put<Socio>(`/api/v1/clientes/${id}`, datos).then((r) => r.data);

/**
 * Baja del socio. Nunca borra la fila: no hay ningún DELETE que llamar.
 * Va por QUERY PARAM, no por body, y el backend solo acepta INACTIVO
 * (ACTIVO y MOROSO los determina el sistema a partir de los pagos).
 */
export const darDeBajaSocio = (id: number) =>
  api
    .patch<Socio>(`/api/v1/clientes/${id}/estado`, null, { params: { nuevoEstado: 'INACTIVO' } })
    .then((r) => r.data);
