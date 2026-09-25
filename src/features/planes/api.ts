import api from '../../api/axios';
import type { Plan, PlanRequest } from './types';

/** No está paginado: son un puñado de filas. Lo lee cualquier autenticado. */
export const listarPlanes = () => api.get<Plan[]>('/api/v1/planes').then((r) => r.data);

/** Crear, editar y eliminar son solo ADMIN: GERENCIA recibe 403. */

export const crearPlan = (datos: PlanRequest) =>
  api.post<Plan>('/api/v1/planes', datos).then((r) => r.data);

/**
 * Los pagos ya registrados no cambian: guardan su propio importe y su propio
 * vencimiento. Lo que sí se ve distinto es el nombre, porque los pagos y el
 * plan vigente del socio lo leen del plan.
 */
export const actualizarPlan = (id: number, datos: PlanRequest) =>
  api.put<Plan>(`/api/v1/planes/${id}`, datos).then((r) => r.data);

/**
 * El único borrado real del API. Si el plan ya tiene pagos (aunque estén
 * anulados), el backend responde 400 con un mensaje que lo explica, y no borra
 * nada.
 */
export const eliminarPlan = (id: number) =>
  api.delete<void>(`/api/v1/planes/${id}`).then(() => undefined);
