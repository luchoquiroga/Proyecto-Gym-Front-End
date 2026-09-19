import axios from 'axios';
import type { ErrorResponse } from '../types/api';

/**
 * Error del API ya normalizado.
 *
 * Existe para que una pantalla no tenga que mostrar
 * "Request failed with status code 400", sino el `mensaje` que escribió el
 * backend. El interceptor de axios rechaza siempre con esto.
 */
export class ErrorApi extends Error {
  /** null cuando la petición nunca llegó al servidor (red caída, CORS, API apagada). */
  readonly status: number | null;
  readonly mensaje: string;
  /** Mapa campo → mensaje de los 400 de validación. Sirve para pintar el formulario. */
  readonly errores: Record<string, string> | null;

  constructor(mensaje: string, status: number | null, errores: Record<string, string> | null = null) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.mensaje = mensaje;
    this.status = status;
    this.errores = errores;
  }
}

const SIN_CONEXION =
  'No se pudo conectar con el servidor. Verificá que el API esté levantada.';

/** Último recurso: el backend casi siempre manda `mensaje`, esto es para cuando no. */
const MENSAJE_POR_STATUS: Record<number, string> = {
  400: 'Los datos enviados no son válidos.',
  401: 'La sesión expiró. Volvé a iniciar sesión.',
  403: 'Tu rol no tiene permiso para esta operación.',
  404: 'No se encontró lo que se pidió.',
  409: 'El dato ya existe o no se puede modificar.',
  429: 'Demasiados intentos, esperá un minuto.',
  500: 'El servidor tuvo un error inesperado.',
};

/**
 * Convierte cualquier cosa que tire axios en un `ErrorApi`.
 * No inventa datos: si no hay mensaje del backend, dice que no lo hay.
 */
export function normalizarError(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ErrorApi(SIN_CONEXION, null);
    }

    const status = error.response.status;
    const cuerpo = error.response.data as Partial<ErrorResponse> | undefined;
    const mensaje =
      cuerpo?.mensaje ?? MENSAJE_POR_STATUS[status] ?? `El servidor respondió ${status}.`;

    return new ErrorApi(mensaje, status, cuerpo?.errores ?? null);
  }

  if (error instanceof Error) return new ErrorApi(error.message, null);

  return new ErrorApi('Ocurrió un error inesperado.', null);
}

/** Texto listo para mostrar en pantalla. */
export function mensajeDeError(error: unknown): string {
  return normalizarError(error).mensaje;
}
