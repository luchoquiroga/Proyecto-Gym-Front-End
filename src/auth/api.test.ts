// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { delay, http, HttpResponse } from 'msw';
import { logout, logoutDeTodo, refrescarSesion } from './api';
import { useSesion } from './sesion';
import { BASE_URL } from '../api/config';
import { ErrorApi } from '../lib/errores';

/**
 * El logout es lo único que borra la cookie HttpOnly del refresh. Si falla sin
 * avisar, la pantalla dice que se salió y el siguiente en esa PC entra con la
 * sesión anterior apretando F5.
 */

const url = (ruta: string) => `${BASE_URL}${ruta}`;
const servidor = setupServer();

beforeAll(() => servidor.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidor.resetHandlers());
afterAll(() => servidor.close());

describe('logout', () => {
  it('no manda Authorization aunque haya un access token (vencido) en memoria', async () => {
    // Con el Bearer vencido, el filtro JWT del backend respondía 401 antes de
    // llegar al logout y la cookie sobrevivía.
    let authorizationRecibido: string | null = 'sin llamar';
    servidor.use(
      http.post(url('/api/v1/usuarios/logout'), ({ request }) => {
        authorizationRecibido = request.headers.get('Authorization');
        return HttpResponse.json({ mensaje: 'Sesión cerrada correctamente' });
      }),
    );
    useSesion.setState({ accessToken: 'vencido' });

    await logout('staff');

    expect(authorizationRecibido).toBeNull();
  });

  it('si el servidor falla, tira el error en vez de tragarlo', async () => {
    servidor.use(
      http.post(url('/api/v1/usuarios/logout'), () => new HttpResponse('Bad Gateway', { status: 502 })),
    );

    await expect(logout('staff')).rejects.toBeInstanceOf(ErrorApi);
  });

  it('logoutDeTodo cierra las dos sesiones, la de staff y la de socio', async () => {
    const cerrados: string[] = [];
    servidor.use(
      http.post(url('/api/v1/usuarios/logout'), () => {
        cerrados.push('staff');
        return HttpResponse.json({ mensaje: 'ok' });
      }),
      http.post(url('/api/v1/clientes/logout'), () => {
        cerrados.push('socio');
        return HttpResponse.json({ mensaje: 'ok' });
      }),
    );

    await logoutDeTodo();

    expect(cerrados.sort()).toEqual(['socio', 'staff']);
  });

  it('logoutDeTodo falla si falla cualquiera de los dos', async () => {
    servidor.use(
      http.post(url('/api/v1/usuarios/logout'), () => HttpResponse.json({ mensaje: 'ok' })),
      http.post(url('/api/v1/clientes/logout'), () => HttpResponse.error()),
    );

    await expect(logoutDeTodo()).rejects.toMatchObject({ status: null });
  });
});

/**
 * Un LockManager mínimo: ordena las tareas que piden el mismo nombre, como el
 * del navegador, y deja correr en paralelo las de nombres distintos.
 */
const candadosFalsos = () => {
  const colas = new Map<string, Promise<unknown>>();
  return {
    request: (nombre: string, tarea: () => Promise<unknown>) => {
      const resultado = (colas.get(nombre) ?? Promise.resolve()).then(tarea);
      colas.set(nombre, resultado.catch(() => undefined));
      return resultado;
    },
  };
};

const RESPUESTA_REFRESH_STAFF = {
  accessToken: 'nuevo',
  usuario: { id: 1, nombre: 'admin', rol: 'ADMIN', activo: true },
};

describe('candado entre pestañas', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('dos refresh del mismo portal no viajan a la vez', async () => {
    // Cada pestaña tiene su propia cola en el interceptor, pero la cookie es
    // una sola: dos refresh juntos mandan la misma, y `/refresh` la rota.
    vi.stubGlobal('navigator', { locks: candadosFalsos() });
    let enVuelo = 0;
    let maximoEnVuelo = 0;
    servidor.use(
      http.post(url('/api/v1/usuarios/refresh'), async () => {
        enVuelo += 1;
        maximoEnVuelo = Math.max(maximoEnVuelo, enVuelo);
        await delay(20);
        enVuelo -= 1;
        return HttpResponse.json(RESPUESTA_REFRESH_STAFF);
      }),
    );

    await Promise.all([refrescarSesion('staff'), refrescarSesion('staff')]);

    expect(maximoEnVuelo).toBe(1);
  });

  it('el logout espera al refresh en vuelo, así no queda una cookie viva después', async () => {
    vi.stubGlobal('navigator', { locks: candadosFalsos() });
    const orden: string[] = [];
    servidor.use(
      http.post(url('/api/v1/usuarios/refresh'), async () => {
        orden.push('refresh empieza');
        await delay(20);
        orden.push('refresh termina');
        return HttpResponse.json(RESPUESTA_REFRESH_STAFF);
      }),
      http.post(url('/api/v1/usuarios/logout'), () => {
        orden.push('logout');
        return HttpResponse.json({ mensaje: 'ok' });
      }),
    );

    await Promise.all([refrescarSesion('staff'), logout('staff')]);

    expect(orden).toEqual(['refresh empieza', 'refresh termina', 'logout']);
  });

  it('sin Web Locks refresca igual', async () => {
    vi.stubGlobal('navigator', {});
    servidor.use(http.post(url('/api/v1/usuarios/refresh'), () => HttpResponse.json(RESPUESTA_REFRESH_STAFF)));

    await expect(refrescarSesion('staff')).resolves.toMatchObject({ accessToken: 'nuevo' });
  });
});
