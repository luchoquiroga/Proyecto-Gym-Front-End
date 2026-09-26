// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { delay, http, HttpResponse } from 'msw';
import api from './axios';
import { BASE_URL } from './config';
import { useSesion } from '../auth/sesion';
import { ErrorApi } from '../lib/errores';
import type { Principal, TipoPortal } from '../auth/types';

/**
 * El interceptor de axios (STACK.md §2.6, punto 1). Es lo que si se rompe no se
 * ve mirando la pantalla: la web anda perfecto durante 30 minutos, y recién
 * cuando vence el token aparecen los refresh duplicados o el logout de golpe.
 *
 * `msw` intercepta a nivel red, así que se ejercita el axios de verdad con su
 * interceptor, no un axios falso.
 */

const url = (ruta: string) => `${BASE_URL}${ruta}`;
const servidor = setupServer();

const STAFF: Principal = { tipo: 'staff', id: 1, nombre: 'admin', rol: 'ADMIN' };
const SOCIO: Principal = { tipo: 'socio', id: 4, nombre: 'Ana', apellido: 'Pérez' };

let refreshesStaff = 0;
let refreshesSocio = 0;

/** Un recurso que solo responde con el token nuevo: con el viejo da 401, como el backend. */
const recursoProtegido = (ruta: string) =>
  http.get(url(ruta), ({ request }) =>
    request.headers.get('Authorization') === 'Bearer nuevo'
      ? HttpResponse.json({ ruta })
      : HttpResponse.json({ status: 401, mensaje: 'Sesión expirada' }, { status: 401 }),
  );

const refreshStaffOk = http.post(url('/api/v1/usuarios/refresh'), async () => {
  refreshesStaff += 1;
  // Con demora, para que las peticiones concurrentes lleguen mientras está en vuelo.
  await delay(30);
  return HttpResponse.json({
    accessToken: 'nuevo',
    usuario: { id: 1, nombre: 'admin', rol: 'ADMIN', activo: true },
  });
});

const refreshStaffFalla = http.post(url('/api/v1/usuarios/refresh'), async () => {
  refreshesStaff += 1;
  await delay(30);
  return HttpResponse.json({ mensaje: 'Refresh token expirado o inválido' }, { status: 401 });
});

const iniciarCon = (portal: TipoPortal, principal: Principal) =>
  useSesion.setState({ portal, principal, accessToken: 'viejo', cargandoSesion: false, cerradaPorElServidor: false });

beforeAll(() => servidor.listen({ onUnhandledRequest: 'error' }));
afterEach(() => servidor.resetHandlers());
afterAll(() => servidor.close());

beforeEach(() => {
  refreshesStaff = 0;
  refreshesSocio = 0;
});

describe('interceptor de axios', () => {
  it('pone el access token de la sesión en cada petición', async () => {
    servidor.use(recursoProtegido('/api/v1/planes'));
    useSesion.setState({ portal: 'staff', principal: STAFF, accessToken: 'nuevo', cargandoSesion: false });

    await expect(api.get('/api/v1/planes')).resolves.toMatchObject({ status: 200 });
    expect(refreshesStaff).toBe(0);
  });

  it('ante un 401 hace el refresh, guarda el token nuevo y reintenta la petición', async () => {
    servidor.use(recursoProtegido('/api/v1/planes'), refreshStaffOk);
    iniciarCon('staff', STAFF);

    const respuesta = await api.get('/api/v1/planes');

    expect(respuesta.data).toEqual({ ruta: '/api/v1/planes' });
    expect(refreshesStaff).toBe(1);
    expect(useSesion.getState().accessToken).toBe('nuevo');
  });

  it('con tres 401 simultáneos hace UN SOLO refresh y reintenta las tres', async () => {
    // Es la razón de la cola: `/refresh` rota la cookie, así que dos refresh
    // en paralelo hacen fallar al segundo y la sesión se cae sin motivo.
    servidor.use(
      recursoProtegido('/api/v1/planes'),
      recursoProtegido('/api/v1/clientes'),
      recursoProtegido('/api/v1/pagos'),
      refreshStaffOk,
    );
    iniciarCon('staff', STAFF);

    const respuestas = await Promise.all([
      api.get('/api/v1/planes'),
      api.get('/api/v1/clientes'),
      api.get('/api/v1/pagos'),
    ]);

    expect(respuestas.map((r) => r.data.ruta)).toEqual([
      '/api/v1/planes',
      '/api/v1/clientes',
      '/api/v1/pagos',
    ]);
    expect(refreshesStaff).toBe(1);
  });

  it('si el refresh falla, rechaza todas las encoladas y limpia la sesión', async () => {
    servidor.use(recursoProtegido('/api/v1/planes'), recursoProtegido('/api/v1/clientes'), refreshStaffFalla);
    iniciarCon('staff', STAFF);

    const resultados = await Promise.allSettled([api.get('/api/v1/planes'), api.get('/api/v1/clientes')]);

    for (const resultado of resultados) {
      expect(resultado.status).toBe('rejected');
      const { reason } = resultado as PromiseRejectedResult;
      expect(reason).toBeInstanceOf(ErrorApi);
      expect((reason as ErrorApi).status).toBe(401);
    }
    expect(refreshesStaff).toBe(1);
    expect(useSesion.getState().principal).toBeNull();
    expect(useSesion.getState().accessToken).toBeNull();
    // El login tiene que poder decir que la cerró el servidor, no el usuario.
    expect(useSesion.getState().cerradaPorElServidor).toBe(true);
  });

  it('si el refresh no llega (503 del proxy), rechaza con su mensaje pero NO cierra la sesión', async () => {
    // Arranque en frío de Render o un corte: la cookie puede seguir siendo
    // válida. Cerrar la sesión acá sacaba al usuario sin motivo.
    servidor.use(
      recursoProtegido('/api/v1/planes'),
      http.post(url('/api/v1/usuarios/refresh'), () => new HttpResponse('Service Unavailable', { status: 503 })),
    );
    iniciarCon('staff', STAFF);

    const error = await api.get('/api/v1/planes').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).status).toBe(503);
    expect((error as ErrorApi).mensaje).toMatch(/no está disponible/);
    expect(useSesion.getState().principal).toEqual(STAFF);
    expect(useSesion.getState().cerradaPorElServidor).toBe(false);
  });

  it('si la petición reintentada vuelve a dar 401, cierra la sesión sin un segundo refresh', async () => {
    // El refresh "anda" pero el token nuevo tampoco sirve: sin el tope, esto
    // sería un bucle infinito de refresh.
    servidor.use(
      http.get(url('/api/v1/planes'), () =>
        HttpResponse.json({ mensaje: 'Sesión expirada' }, { status: 401 }),
      ),
      refreshStaffOk,
    );
    iniciarCon('staff', STAFF);

    await expect(api.get('/api/v1/planes')).rejects.toMatchObject({ status: 401 });
    expect(refreshesStaff).toBe(1);
    expect(useSesion.getState().principal).toBeNull();
  });

  it('un 401 en el propio login es la respuesta, no algo que reintentar', async () => {
    servidor.use(
      http.post(url('/api/v1/usuarios/login'), () =>
        HttpResponse.json({ status: 401, mensaje: 'Credenciales incorrectas' }, { status: 401 }),
      ),
      refreshStaffOk,
    );
    iniciarCon('staff', STAFF);

    await expect(api.post('/api/v1/usuarios/login', {})).rejects.toMatchObject({
      status: 401,
      mensaje: 'Credenciales incorrectas',
    });
    expect(refreshesStaff).toBe(0);
  });

  it('con la sesión de un socio, refresca contra el endpoint de socios', async () => {
    // Era el bug original: el refresh estaba fijo al de staff y la sesión de
    // un socio no se podía restaurar nunca.
    servidor.use(
      recursoProtegido('/api/v1/clientes/4'),
      http.post(url('/api/v1/clientes/refresh'), () => {
        refreshesSocio += 1;
        return HttpResponse.json({
          accessToken: 'nuevo',
          cliente: { id: 4, nombre: 'Ana', apellido: 'Pérez' },
        });
      }),
      refreshStaffOk,
    );
    iniciarCon('socio', SOCIO);

    await expect(api.get('/api/v1/clientes/4')).resolves.toMatchObject({ status: 200 });
    expect(refreshesSocio).toBe(1);
    expect(refreshesStaff).toBe(0);
    expect(useSesion.getState().principal).toEqual(SOCIO);
  });

  it('un error que no es 401 sale normalizado, con el mensaje y los errores del backend', async () => {
    servidor.use(
      http.post(url('/api/v1/clientes'), () =>
        HttpResponse.json(
          { status: 400, mensaje: 'Datos inválidos', errores: { documento: 'El documento es obligatorio' } },
          { status: 400 },
        ),
      ),
    );
    iniciarCon('staff', STAFF);

    await expect(api.post('/api/v1/clientes', {})).rejects.toMatchObject({
      status: 400,
      mensaje: 'Datos inválidos',
      errores: { documento: 'El documento es obligatorio' },
    });
    expect(refreshesStaff).toBe(0);
    // Un 400 no es una sesión vencida: la sesión sigue.
    expect(useSesion.getState().principal).toEqual(STAFF);
  });

  it('con el backend caído dice que no pudo conectar, con status null', async () => {
    servidor.use(http.get(url('/api/v1/planes'), () => HttpResponse.error()));
    iniciarCon('staff', STAFF);

    await expect(api.get('/api/v1/planes')).rejects.toMatchObject({
      status: null,
      mensaje: expect.stringContaining('No se pudo conectar'),
    });
  });
});
