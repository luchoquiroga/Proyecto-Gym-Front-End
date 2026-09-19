/** Tipos de socios. Salen de specs/CONTRATO-API.md §3, "Socios — /clientes". */

/**
 * `VENCIDO` no existe y nunca existió en el backend: el enum es este.
 * `ACTIVO` lo determina un pago válido y `MOROSO` lo calcula el vencimiento,
 * así que ninguno de los dos se puede fijar a mano.
 */
export type EstadoSocio = 'ACTIVO' | 'MOROSO' | 'INACTIVO';

export interface PlanVigente {
  id: number;
  nombre: string;
}

export interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  /** Obligatorio y único. Vuelve normalizado (sin puntos), aunque se cargue con puntos. */
  documento: string;
  /** Null mientras el socio no haya activado su cuenta del portal. */
  email: string | null;
  estado: EstadoSocio;
  /** Calculados a partir del último pago válido. Null si nunca pagó. El front nunca los calcula. */
  fechaVencimiento: string | null;
  planVigente: PlanVigente | null;
}

/** Cuerpo del alta y de la edición (`POST /clientes`, `PUT /clientes/{id}`). */
export interface SocioRequest {
  nombre: string;
  apellido: string;
  telefono?: string;
  documento: string;
}

/**
 * Respuesta del 201 del alta. Trae el `codigoActivacion`, que viaja UNA sola
 * vez: no hay endpoint para recuperarlo.
 */
export interface SocioAltaResponse {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  documento: string;
  estado: EstadoSocio;
  /** Null solo si el socio se cargó con credenciales propias; desde el mostrador siempre viene. */
  codigoActivacion: string | null;
}
