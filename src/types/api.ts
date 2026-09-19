/**
 * Formas del API que no son de un recurso en particular.
 * Fuente: specs/CONTRATO-API.md §2 y §3 ("Paginación").
 */

/**
 * Respuesta paginada de `/clientes`, `/pagos` y `/usuarios`.
 *
 * Los nombres son en castellano y NO son los de Spring
 * (`content` / `number` / `size`): el backend serializa un DTO propio.
 * `pagina` arranca en 0.
 */
export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}

/** Cuerpo de error del GlobalExceptionHandler del backend. */
export interface ErrorResponse {
  status: number;
  mensaje: string;
  /** Mapa campo → mensaje, con el nombre exacto del campo del DTO. Solo en los 400 de validación. */
  errores?: Record<string, string>;
  timestamp?: string;
}

/** Parámetros de paginación que entiende el backend. */
export interface ParametrosPagina {
  page: number;
  size: number;
}

export const TAMANIO_PAGINA = 20;
