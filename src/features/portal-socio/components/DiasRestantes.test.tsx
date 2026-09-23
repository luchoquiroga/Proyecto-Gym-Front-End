import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiasRestantes } from './DiasRestantes';
import type { Socio } from '../../socios/types';

/**
 * Los días hasta el vencimiento (STACK.md §2.6, punto 3): hoy, ayer y el cambio
 * de mes. Es aritmética de fechas ISO, donde vive el off-by-one: el backend
 * manda `2026-09-30` sin hora, y `new Date('2026-09-30')` lo toma en UTC, que en
 * Argentina es el 29 a las 21:00.
 *
 * La zona está fijada a Argentina en `vite.config.ts` (test.env.TZ).
 */

const socio = (cambios: Partial<Socio>): Socio => ({
  id: 4,
  nombre: 'Ana',
  apellido: 'Pérez',
  telefono: null,
  documento: '12345678',
  email: 'ana@mail.com',
  estado: 'ACTIVO',
  fechaVencimiento: null,
  planVigente: { id: 1, nombre: 'Pase Mensual' },
  ...cambios,
});

/** Fija el "ahora" en hora de Argentina: `(2026, 9, 30, 23, 30)` es el 30/09 a las 23:30. */
const ahoraEs = (anio: number, mes: number, dia: number, hora = 12, minuto = 0) =>
  vi.setSystemTime(new Date(anio, mes - 1, dia, hora, minuto));

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

describe('DiasRestantes', () => {
  it('corre en la zona del gimnasio (si esto falla, los demás no significan nada)', () => {
    expect(new Date(2026, 8, 30).getTimezoneOffset()).toBe(180);
  });

  it('vence hoy', () => {
    ahoraEs(2026, 9, 30);
    render(<DiasRestantes socio={socio({ fechaVencimiento: '2026-09-30' })} />);
    expect(screen.getByText('Vence hoy')).toBeInTheDocument();
  });

  it('vence hoy también a las 23:30, cuando en UTC ya es el día siguiente', () => {
    ahoraEs(2026, 9, 30, 23, 30);
    render(<DiasRestantes socio={socio({ fechaVencimiento: '2026-09-30' })} />);
    expect(screen.getByText('Vence hoy')).toBeInTheDocument();
  });

  it('venció ayer', () => {
    ahoraEs(2026, 9, 30);
    render(<DiasRestantes socio={socio({ estado: 'MOROSO', fechaVencimiento: '2026-09-29' })} />);
    expect(screen.getByText('Venció hace 1 día')).toBeInTheDocument();
  });

  it('venció hace varios días (en plural)', () => {
    ahoraEs(2026, 9, 30);
    render(<DiasRestantes socio={socio({ estado: 'MOROSO', fechaVencimiento: '2026-09-27' })} />);
    expect(screen.getByText('Venció hace 3 días')).toBeInTheDocument();
  });

  it('cambio de mes: el 30/09 le queda 1 día si vence el 01/10', () => {
    ahoraEs(2026, 9, 30);
    render(<DiasRestantes socio={socio({ fechaVencimiento: '2026-10-01' })} />);
    expect(screen.getByText('Te queda 1 día')).toBeInTheDocument();
  });

  it('cambio de mes hacia atrás: el 01/10 venció hace 1 día si vencía el 30/09', () => {
    ahoraEs(2026, 10, 1, 0, 30);
    render(<DiasRestantes socio={socio({ estado: 'MOROSO', fechaVencimiento: '2026-09-30' })} />);
    expect(screen.getByText('Venció hace 1 día')).toBeInTheDocument();
  });

  it('un mes entero por delante', () => {
    ahoraEs(2026, 9, 23);
    render(<DiasRestantes socio={socio({ fechaVencimiento: '2026-10-23' })} />);
    expect(screen.getByText('Te quedan 30 días')).toBeInTheDocument();
    expect(screen.getByText('Estás al día.')).toBeInTheDocument();
  });

  it('avisa que se acerca cuando quedan 5 días o menos', () => {
    ahoraEs(2026, 9, 23);
    render(<DiasRestantes socio={socio({ fechaVencimiento: '2026-09-28' })} />);
    expect(screen.getByText('Te quedan 5 días')).toBeInTheDocument();
    expect(screen.getByText(/Se acerca el vencimiento/)).toBeInTheDocument();
  });

  it('dado de baja no muestra cuenta regresiva, aunque le queden días', () => {
    ahoraEs(2026, 9, 23);
    render(<DiasRestantes socio={socio({ estado: 'INACTIVO', fechaVencimiento: '2026-10-23' })} />);
    expect(screen.getByText('Membresía dada de baja')).toBeInTheDocument();
    expect(screen.queryByText(/Te quedan/)).not.toBeInTheDocument();
  });

  it('sin pagos no inventa un vencimiento', () => {
    ahoraEs(2026, 9, 23);
    render(<DiasRestantes socio={socio({ fechaVencimiento: null, planVigente: null })} />);
    expect(screen.getByText('Todavía no hay pagos registrados')).toBeInTheDocument();
  });
});
