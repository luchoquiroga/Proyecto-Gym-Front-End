import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ES_PRODUCCION } from '../../api/config';

interface Props {
  children: ReactNode;
}

interface Estado {
  error: Error | null;
}

/**
 * Lo que se ve si React se cae mientras dibuja.
 *
 * Sin esto, React 19 desmonta la app entera y queda solo el fondo del `body`,
 * sin ninguna pista: es lo que pasaba en el celular cuando Chrome traducía la
 * página (bitácora del 24/10).
 *
 * **Es la única clase de la web, a propósito** (`AGENTS.md` §6 dice "nada de
 * clases"): React solo deja atrapar errores de render con `componentDidCatch`,
 * que no tiene equivalente en hooks. Se eligió esto antes que sumar
 * `react-error-boundary` por unas pocas líneas.
 *
 * No atrapa los errores del API: esos ya los muestra cada pantalla con
 * `ErrorDeCarga`. Esto es para un bug nuestro o del navegador.
 */
export class ErrorDeLaApp extends Component<Props, Estado> {
  state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('La app se cayó al dibujar:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-gym-black flex items-center justify-center p-6">
        <div
          role="alert"
          className="max-w-md w-full bg-gym-card border border-gym-border rounded-3xl p-8 shadow-card-dark text-center space-y-5"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gym-dark border border-gym-red-600/40 flex items-center justify-center text-gym-red-500">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-black uppercase tracking-wider text-white">
              Algo falló en la pantalla
            </h1>
            <p className="text-sm text-gym-muted leading-relaxed">
              Recargá la página: la sesión se mantiene.
            </p>
            {/* El detalle técnico es para nosotros, no para el dueño. */}
            {!ES_PRODUCCION && (
              <p className="text-xs font-mono text-gym-red-400 break-words">{error.message}</p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-gym-red-600 hover:bg-gym-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-red-glow flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
