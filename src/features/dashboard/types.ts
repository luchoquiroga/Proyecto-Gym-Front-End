/** `GET /dashboard/ganancias-mensuales` (solo ADMIN). Es un agregado de UN mes. */
export interface GananciasMensuales {
  anio: number;
  mes: number;
  totalGanancias: number;
  cantidadPagos: number;
}

/**
 * `GET /dashboard/socios` (solo ADMIN). Es una foto de HOY, no de un período:
 * por eso es un endpoint aparte y no depende del mes que se mire.
 */
export interface SociosPorEstado {
  activos: number;
  morosos: number;
  inactivos: number;
}
