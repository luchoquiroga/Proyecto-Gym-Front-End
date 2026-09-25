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

/**
 * En el plan gratis de Render el backend se duerme sin tráfico y la primera
 * petición del día puede tardar más de un minuto (medido el 24/09): el que la
 * vea tiene que saber que reintentar sirve.
 */
const TIEMPO_AGOTADO =
  'El servidor tardó demasiado en responder. Si es la primera vez en el día, puede estar arrancando: reintentá en un minuto.';

const SERVIDOR_NO_DISPONIBLE =
  'El servidor no está disponible en este momento. Si recién arranca el día, puede estar despertando: reintentá en un minuto.';

/** Último recurso: el backend casi siempre manda `mensaje`, esto es para cuando no. */
const MENSAJE_POR_STATUS: Record<number, string> = {
  400: 'Los datos enviados no son válidos.',
  401: 'La sesión expiró. Volvé a iniciar sesión.',
  403: 'Tu rol no tiene permiso para esta operación.',
  404: 'No se encontró lo que se pidió.',
  409: 'El dato ya existe o no se puede modificar.',
  429: 'Demasiados intentos, esperá un minuto.',
  500: 'El servidor tuvo un error inesperado.',
  // Los tres los responde el proxy (Vercel o Render), no el backend: llegan sin `mensaje`.
  502: SERVIDOR_NO_DISPONIBLE,
  503: SERVIDOR_NO_DISPONIBLE,
  504: SERVIDOR_NO_DISPONIBLE,
};

/**
 * Convierte cualquier cosa que tire axios en un `ErrorApi`.
 * No inventa datos: si no hay mensaje del backend, dice que no lo hay.
 */
export function normalizarError(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const vencioElTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      return new ErrorApi(vencioElTimeout ? TIEMPO_AGOTADO : SIN_CONEXION, null);
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

/**
 * La petición pudo haberse guardado en el servidor aunque acá haya fallado: no
 * llegó la respuesta (red, timeout) o el proxy cortó (5xx). Distinto de un 4xx,
 * donde el backend contestó que NO la aplicó.
 *
 * Importa en las escrituras que no se pueden repetir a ciegas, como cobrar.
 */
export function resultadoIncierto(error: unknown): boolean {
  const { status } = normalizarError(error);
  return status === null || status >= 500;
}

/**
 * El servidor dijo que la sesión no vale (401) o que la cuenta ya no puede
 * entrar (403). Cualquier otra falla del refresh —red, arranque en frío, un 5xx—
 * no dice nada sobre la sesión, y cerrarla ahí saca al usuario sin motivo.
 */
export function sesionRechazada(error: unknown): boolean {
  const { status } = normalizarError(error);
  return status === 401 || status === 403;
}
