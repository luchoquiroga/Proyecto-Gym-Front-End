import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from './RutaProtegida';
import { useSesion } from './sesion';
import type { Principal } from './types';

/**
 * Los guards de rol (STACK.md §2.6, punto 2). Esconden, no protegen: el que
 * autoriza es el backend con 403. Lo que se prueba es que nadie llegue a una
 * pantalla que le va a fallar entera, y que cada uno termine en SU inicio.
 */

const ADMIN: Principal = { tipo: 'staff', id: 1, nombre: 'admin', rol: 'ADMIN' };
const GERENCIA: Principal = { tipo: 'staff', id: 2, nombre: 'gerencia', rol: 'GERENCIA' };
const SOCIO: Principal = { tipo: 'socio', id: 4, nombre: 'Ana', apellido: 'Pérez' };

/** Las mismas reglas que App.tsx, con un texto por pantalla para saber dónde se terminó. */
const renderizarEn = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<p>login del staff</p>} />
        <Route path="/socio/ingresar" element={<p>login del socio</p>} />
        <Route
          path="/staff/socios"
          element={
            <RutaProtegida portal="staff">
              <p>socios</p>
            </RutaProtegida>
          }
        />
        <Route
          path="/staff/dashboard"
          element={
            <RutaProtegida portal="staff" roles={['ADMIN']}>
              <p>dashboard</p>
            </RutaProtegida>
          }
        />
        <Route
          path="/staff/pagos"
          element={
            <RutaProtegida portal="staff" roles={['ADMIN']}>
              <p>pagos</p>
            </RutaProtegida>
          }
        />
        <Route
          path="/socio/resumen"
          element={
            <RutaProtegida portal="socio">
              <p>portal del socio</p>
            </RutaProtegida>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const conSesion = (principal: Principal | null) =>
  useSesion.setState({
    principal,
    accessToken: principal ? 'token' : null,
    portal: principal?.tipo ?? 'staff',
    cargandoSesion: false,
  });

beforeEach(() => conSesion(null));

describe('RutaProtegida', () => {
  it('ADMIN entra al dashboard', () => {
    conSesion(ADMIN);
    renderizarEn('/staff/dashboard');
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it.each(['/staff/dashboard', '/staff/pagos'])(
    'GERENCIA no entra a %s: va a socios, su inicio',
    (ruta) => {
      conSesion(GERENCIA);
      renderizarEn(ruta);
      expect(screen.getByText('socios')).toBeInTheDocument();
      expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('pagos')).not.toBeInTheDocument();
    },
  );

  it('GERENCIA entra a socios', () => {
    conSesion(GERENCIA);
    renderizarEn('/staff/socios');
    expect(screen.getByText('socios')).toBeInTheDocument();
  });

  it.each(['/staff/socios', '/staff/dashboard', '/staff/pagos'])(
    'un socio no entra a %s: va a su portal',
    (ruta) => {
      conSesion(SOCIO);
      renderizarEn(ruta);
      expect(screen.getByText('portal del socio')).toBeInTheDocument();
    },
  );

  it('el staff no entra al portal del socio: son principals de tablas distintas', () => {
    conSesion(ADMIN);
    renderizarEn('/socio/resumen');
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('sin sesión, un área de staff manda al login del staff', () => {
    renderizarEn('/staff/socios');
    expect(screen.getByText('login del staff')).toBeInTheDocument();
  });

  it('sin sesión, el portal del socio manda al login del socio', () => {
    renderizarEn('/socio/resumen');
    expect(screen.getByText('login del socio')).toBeInTheDocument();
  });

  it('mientras se resuelve la sesión no muestra nada ni redirige', () => {
    // Si redirigiera acá, un F5 mandaría al login a alguien con sesión válida
    // antes de que el silent refresh llegue a responder.
    useSesion.setState({ principal: null, accessToken: null, cargandoSesion: true });
    const { container } = renderizarEn('/staff/dashboard');
    expect(container).toBeEmptyDOMElement();
  });
});
