// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { logout, logoutDeTodo } from './api';
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
