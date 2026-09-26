import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, CircleCheck, Eye, EyeOff, Lock, User } from 'lucide-react';
import { loginStaff, logout } from '../auth/api';
import { useSesion } from '../auth/sesion';
import { AvisoSesionCerrada } from '../auth/AvisoSesionCerrada';
import { RUTAS_LOGIN, rutaInicial } from '../auth/rutas';
import { mensajeDeError } from '../lib/errores';
import { PantallaAuth, claseLinkAuth } from '../components/layout/PantallaAuth';
import type { AvisoDeLogin } from '../features/cuenta/components/CambiarContrasena';

/**
 * Login del staff (`/usuarios/login`, se identifica con el NOMBRE de usuario).
 * El socio tiene su propia puerta, `LoginSocioPage`, contra `/clientes/login`.
 */
/** Lo que puede traer la navegación hasta acá. */
type EstadoNavegacion = { from?: { pathname: string } } & Partial<AvisoDeLogin>;

export const Login = () => {
  const location = useLocation();
  const estado = (location.state ?? {}) as EstadoNavegacion;

  // Después de cambiar la contraseña se llega con el usuario ya escrito.
  const [nombre, setNombre] = useState(estado.nombre ?? '');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const iniciarSesion = useSesion((s) => s.iniciarSesion);
  const navigate = useNavigate();

  const ingreso = useMutation({
    mutationFn: loginStaff,
    onSuccess: ({ principal, accessToken }) => {
      iniciarSesion('staff', principal, accessToken);
      // Si en este navegador quedó abierta la sesión de un socio, se cierra:
      // si no, su cookie seguiría viva y bastaría volver a ese portal para usarla.
      void logout('socio').catch(() => undefined);

      const origen = estado.from?.pathname;
      const destino = origen?.startsWith('/staff') ? origen : rutaInicial(principal);
      navigate(destino, { replace: true });
    },
  });

  // El mensaje es el que devolvió el backend (incluido el 429 del rate limit),
  // no un texto genérico nuestro.
  const mensajeError = errorLocal ?? (ingreso.isError ? mensajeDeError(ingreso.error) : null);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    ingreso.reset();

    if (!nombre.trim() || !contrasena) {
      setErrorLocal('Ingresá tu usuario y tu contraseña.');
      return;
    }

    setErrorLocal(null);
    ingreso.mutate({ nombre: nombre.trim(), contrasena });
  };

  return (
    <PantallaAuth
      subtitulo="Acceso del personal"
      pie={
        <span>
          ¿Sos socio?{' '}
          <Link to={RUTAS_LOGIN.socio} className={claseLinkAuth}>
            Entrá a tu portal
          </Link>
        </span>
      }
    >
      <AvisoSesionCerrada portal="staff" />

      {estado.aviso && !mensajeError && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/50 flex items-start gap-3 animate-fade-in">
          <CircleCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200/90 leading-snug">{estado.aviso}</p>
        </div>
      )}

      {mensajeError && (
        <div className="mb-6 p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gym-red-400 leading-snug">{mensajeError}</p>
        </div>
      )}

      <form onSubmit={enviar} className="space-y-5">
        <div>
          <label
            htmlFor="nombre"
            className="block text-xs font-semibold uppercase tracking-wider text-gym-muted mb-2"
          >
            Usuario
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gym-subtle">
              <User className="w-5 h-5" />
            </div>
            <input
              id="nombre"
              type="text"
              autoComplete="username"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={ingreso.isPending}
              className="w-full pl-11 pr-4 py-3 bg-gym-dark border border-gym-border rounded-xl text-gym-white placeholder-gym-subtle text-sm focus:outline-none focus:border-gym-red-500 focus:ring-1 focus:ring-gym-red-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contrasena"
            className="block text-xs font-semibold uppercase tracking-wider text-gym-muted mb-2"
          >
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gym-subtle">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="contrasena"
              type={verContrasena ? 'text' : 'password'}
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={ingreso.isPending}
              className="w-full pl-11 pr-11 py-3 bg-gym-dark border border-gym-border rounded-xl text-gym-white placeholder-gym-subtle text-sm focus:outline-none focus:border-gym-red-500 focus:ring-1 focus:ring-gym-red-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setVerContrasena((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gym-subtle hover:text-gym-muted transition-colors"
              aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verContrasena ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={ingreso.isPending}
          className="w-full py-3.5 px-4 bg-gym-red-600 hover:bg-gym-red-500 active:bg-gym-red-700 disabled:opacity-50 text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-colors shadow-red-glow hover:shadow-red-glow-lg flex items-center justify-center gap-2 mt-2"
        >
          {ingreso.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Ingresando...
            </>
          ) : (
            'Iniciar sesión'
          )}
        </button>
      </form>
    </PantallaAuth>
  );
};
