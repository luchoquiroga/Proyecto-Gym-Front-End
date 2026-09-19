import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { BASE_URL } from './config';
import { useSesion } from '../auth/sesion';
import { refrescarSesion } from '../auth/api';
import { RUTAS_DE_AUTH } from '../auth/portales';
import { normalizarError } from '../lib/errores';

/**
 * Instancia única del API. Todo el front pasa por acá.
 *
 * Dos responsabilidades y ninguna más:
 *  1. poner el access token que vive en RAM;
 *  2. resolver el 401 con UN solo silent refresh y una cola de peticiones.
 *
 * `withCredentials` es imprescindible: el refresh token viaja en una cookie
 * HttpOnly que el JS no puede leer.
 */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Un solo refresh en vuelo: `/refresh` rota la cookie y dos en paralelo se pisan. */
let refrescando = false;
let cola: Array<{ resolver: (token: string) => void; rechazar: (error: unknown) => void }> = [];

const vaciarCola = (error: unknown, token: string | null) => {
  cola.forEach(({ resolver, rechazar }) => {
    if (token) resolver(token);
    else rechazar(error);
  });
  cola = [];
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useSesion.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _reintentada?: boolean }) | undefined;

    // Cualquier cosa que no sea un 401 recuperable sale normalizada: la pantalla
    // muestra el `mensaje` del backend, no "Request failed with status code 403".
    if (!original || error.response?.status !== 401) {
      return Promise.reject(normalizarError(error));
    }

    // Un 401 en el propio login/refresh es la respuesta, no algo que reintentar.
    if (RUTAS_DE_AUTH.some((ruta) => original.url?.includes(ruta))) {
      return Promise.reject(normalizarError(error));
    }

    if (original._reintentada) {
      useSesion.getState().cerrarSesion();
      return Promise.reject(normalizarError(error));
    }

    if (refrescando) {
      return new Promise<string>((resolver, rechazar) => {
        cola.push({ resolver, rechazar });
      }).then((token) => {
        if (original.headers) original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._reintentada = true;
    refrescando = true;

    const portal = useSesion.getState().portal;

    try {
      const { principal, accessToken } = await refrescarSesion(portal);
      useSesion.getState().iniciarSesion(portal, principal, accessToken);
      vaciarCola(null, accessToken);

      if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`;
      return await api(original);
    } catch (errorDelRefresh) {
      const normalizado = normalizarError(errorDelRefresh);
      vaciarCola(normalizado, null);
      useSesion.getState().cerrarSesion();
      return Promise.reject(normalizado);
    } finally {
      refrescando = false;
    }
  },
);

export default api;
