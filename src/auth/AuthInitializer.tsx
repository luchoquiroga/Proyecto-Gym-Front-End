import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useSesion } from './sesion';
import { refrescarSesion } from './api';
import { escucharCierreDeSesion } from './sincronizacion';
import { mensajeDeError, sesionRechazada } from '../lib/errores';
import { LogoGimnasio } from '../components/ui/LogoGimnasio';

/** A partir de acá se avisa que el servidor puede estar arrancando. */
const ESPERA_LARGA_MS = 8_000;

/**
 * Silent refresh del arranque en frío.
 *
 * El access token vive en RAM, así que después de un F5 no hay nada: la sesión
 * se recupera con la cookie HttpOnly. Como hay dos portales con dos cookies
 * distintas, se intenta el del último portal usado (ver `portales.ts`).
 *
 * Tres resultados, no dos: hay sesión, no hay sesión (el servidor respondió 401
 * o 403, y se muestra el login), o **no se sabe** porque el servidor no
 * respondió. En ese último caso mandar al login sería mentir —la cookie puede
 * ser válida— y en Render gratis pasa todas las mañanas: se muestra el error con
 * un botón para reintentar.
 */
export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const cargandoSesion = useSesion((s) => s.cargandoSesion);
  const [errorDeArranque, setErrorDeArranque] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [esperaLarga, setEsperaLarga] = useState(false);

  useEffect(() => {
    let montado = true;
    const { portal, iniciarSesion, terminarCarga } = useSesion.getState();

    refrescarSesion(portal)
      .then(({ principal, accessToken }) => {
        if (montado) iniciarSesion(portal, principal, accessToken);
      })
      .catch((error: unknown) => {
        if (!montado) return;
        // Sin cookie válida no hay sesión que restaurar: se muestra el login.
        if (sesionRechazada(error)) terminarCarga();
        else setErrorDeArranque(mensajeDeError(error));
      });

    return () => {
      montado = false;
    };
  }, [intento]);

  // Un temporizador es sincronizar con algo externo: es el uso legítimo de un efecto.
  useEffect(() => {
    if (!cargandoSesion || errorDeArranque) return;
    const temporizador = setTimeout(() => setEsperaLarga(true), ESPERA_LARGA_MS);
    return () => clearTimeout(temporizador);
  }, [cargandoSesion, errorDeArranque, intento]);

  // Otra pestaña cerró la sesión: esta también, así no queda una abierta en la PC.
  useEffect(() => escucharCierreDeSesion(() => useSesion.getState().cerrarSesion()), []);

  const reintentar = () => {
    setErrorDeArranque(null);
    setEsperaLarga(false);
    setIntento((n) => n + 1);
  };

  if (cargandoSesion && errorDeArranque) {
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
              No se pudo verificar la sesión
            </h1>
            <p className="text-sm text-gym-muted leading-relaxed">{errorDeArranque}</p>
          </div>
          <button
            onClick={reintentar}
            className="w-full py-3 px-4 bg-gym-red-600 hover:bg-gym-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-red-glow flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (cargandoSesion) {
    return (
      <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 select-none">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-40 h-20 rounded-full bg-gym-red-600/20 blur-xl animate-pulse" />
          <LogoGimnasio className="relative w-36 animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-semibold tracking-widest uppercase text-gym-muted animate-pulse">
          Verificando sesión segura...
        </p>
        {esperaLarga && (
          <p className="mt-3 max-w-sm text-center text-xs text-gym-subtle leading-relaxed">
            Está tardando más de lo normal. Si es la primera vez en el día, el servidor puede estar
            arrancando: puede tardar hasta un minuto.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
