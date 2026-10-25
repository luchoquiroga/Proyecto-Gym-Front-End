import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorDeLaApp } from './ErrorDeLaApp';

/** Una caída al dibujar tiene que verse como un error, no como la pantalla vacía. */

const Rompe = (): never => {
  throw new Error('se rompió');
};

describe('ErrorDeLaApp', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra lo de adentro si no pasa nada', () => {
    render(
      <ErrorDeLaApp>
        <p>dashboard</p>
      </ErrorDeLaApp>,
    );
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('muestra el aviso con el botón de recargar si algo se cae', () => {
    // React y el componente loguean el error: se silencia para no ensuciar la salida.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorDeLaApp>
        <Rompe />
      </ErrorDeLaApp>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Algo falló en la pantalla');
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument();
  });
});
