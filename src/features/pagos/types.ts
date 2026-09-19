/** `/pagos` (CONTRATO-API §3). Toda LECTURA de pagos es solo de ADMIN. */

export interface PagoResponse {
  id: number;
  montoAbonado: number;
  fechaPago: string;
  fechaVencimiento: string;
  /** El documento está acá para distinguir a dos socios homónimos. */
  cliente: { id: number; nombre: string; apellido: string; documento: string };
  plan: { id: number; nombre: string };
  /** Un pago no se borra ni se edita: se anula, y se sigue mostrando. */
  anulado: boolean;
}

/** `registradoPor` NO va: el backend lo saca del token. */
export interface PagoRequest {
  clienteId: number;
  planId: number;
  montoAbonado: number;
  /** Opcional: si no va, el backend usa hoy. */
  fechaPago?: string;
}
