import api from '../../api/axios';
import type { Plan } from './types';

/** No está paginado: son un puñado de filas. Lo lee cualquier autenticado. */
export const listarPlanes = () => api.get<Plan[]>('/api/v1/planes').then((r) => r.data);
