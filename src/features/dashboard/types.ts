/** `GET /dashboard/ganancias-mensuales` (solo ADMIN). Es un agregado de UN mes. */
export interface GananciasMensuales {
  anio: number;
  mes: number;
  totalGanancias: number;
  cantidadPagos: number;
}
