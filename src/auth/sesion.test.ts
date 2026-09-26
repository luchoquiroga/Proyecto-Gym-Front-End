import { beforeEach, describe, expect, it } from 'vitest';
import { useSesion } from './sesion';
import { queryClient } from '../api/queryClient';
import type { Principal } from './types';

/**
 * En la PC del mostrador se turnan varias personas: lo que leyó una no tiene
 * que quedarle en el cache a la siguiente.
 */

const ADMIN: Principal = { tipo: 'staff', id: 1, nombre: 'admin', rol: 'ADMIN' };
const GERENTE: Principal = { tipo: 'staff', id: 2, nombre: 'gerente', rol: 'GERENCIA' };
// Mismo id que el ADMIN, pero de la tabla de socios: es otra persona.
const SOCIO: Principal = { tipo: 'socio', id: 1, nombre: 'Ana', apellido: 'Pérez' };

const hayDatosEnCache = () => queryClient.getQueryData(['pagos']) !== undefined;

beforeEach(() => {
  useSesion.setState({
    principal: ADMIN,
    accessToken: 'a',
    portal: 'staff',
    cargandoSesion: false,
    cerradaPorElServidor: false,
  });
  queryClient.setQueryData(['pagos'], [{ id: 1 }]);
});

describe('sesión y cache', () => {
  it('cerrar la sesión vacía el cache', () => {
    useSesion.getState().cerrarSesion();
    expect(hayDatosEnCache()).toBe(false);
  });

  it('entrar como otra persona vacía el cache', () => {
    useSesion.getState().iniciarSesion('staff', GERENTE, 'b');
    expect(hayDatosEnCache()).toBe(false);
  });

  it('un socio con el mismo id que el staff es otra persona', () => {
    useSesion.getState().iniciarSesion('socio', SOCIO, 'b');
    expect(hayDatosEnCache()).toBe(false);
  });

  it('el silent refresh de la misma persona conserva el cache', () => {
    useSesion.getState().iniciarSesion('staff', ADMIN, 'renovado');
    expect(hayDatosEnCache()).toBe(true);
  });
});

describe('quién cerró la sesión', () => {
  it('el cierre del usuario no deja aviso', () => {
    useSesion.getState().cerrarSesion();
    expect(useSesion.getState().cerradaPorElServidor).toBe(false);
  });

  it('el cierre del servidor deja el aviso para el login', () => {
    useSesion.getState().cerrarSesion('servidor');
    expect(useSesion.getState().cerradaPorElServidor).toBe(true);
  });

  it('volver a entrar borra el aviso', () => {
    useSesion.getState().cerrarSesion('servidor');
    useSesion.getState().iniciarSesion('staff', ADMIN, 'b');
    expect(useSesion.getState().cerradaPorElServidor).toBe(false);
  });
});
