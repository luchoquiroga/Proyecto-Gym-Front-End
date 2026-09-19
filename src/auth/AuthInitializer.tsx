import { useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { useSesion } from './sesion';
import { refrescarSesion } from './api';

/**
 * Silent refresh del arranque en frío.
 *
 * El access token vive en RAM, así que después de un F5 no hay nada: la sesión
 * se recupera con la cookie HttpOnly. Como hay dos portales con dos cookies
 * distintas, se intenta el del último portal usado (ver `portales.ts`).
 */
export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const cargandoSesion = useSesion((s) => s.cargandoSesion);

  useEffect(() => {
    let montado = true;
    const { portal, iniciarSesion, terminarCarga } = useSesion.getState();

    refrescarSesion(portal)
      .then(({ principal, accessToken }) => {
        if (montado) iniciarSesion(portal, principal, accessToken);
      })
      .catch(() => {
        // Sin cookie válida no hay sesión que restaurar: se muestra el login.
        // No es un error que haya que mostrar en pantalla.
        if (montado) terminarCarga();
      });

    return () => {
      montado = false;
    };
  }, []);

  if (cargandoSesion) {
    return (
      <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 select-none">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-gym-red-600/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gym-dark border border-gym-border flex items-center justify-center shadow-red-glow">
            <Dumbbell className="w-8 h-8 text-gym-red-500 animate-bounce" />
          </div>
        </div>
        <p className="mt-6 text-sm font-semibold tracking-widest uppercase text-gym-muted animate-pulse">
          Verificando sesión segura...
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
