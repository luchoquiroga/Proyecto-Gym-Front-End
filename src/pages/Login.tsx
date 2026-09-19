import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Dumbbell, Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import { loginStaff } from '../auth/api';
import { useSesion } from '../auth/sesion';
import { rutaInicial } from '../auth/rutas';
import { mensajeDeError } from '../lib/errores';
import { ES_PRODUCCION } from '../api/config';

/**
 * Login del staff (`/usuarios/login`, se identifica con el NOMBRE de usuario).
 * El socio tiene su propio login contra `/clientes/login` y todavía no existe
 * en la web (ticket W10).
 */
export const Login = () => {
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const iniciarSesion = useSesion((s) => s.iniciarSesion);
  const navigate = useNavigate();
  const location = useLocation();

  const ingreso = useMutation({
    mutationFn: loginStaff,
    onSuccess: ({ principal, accessToken }) => {
      iniciarSesion('staff', principal, accessToken);

      const origen = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
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
    <div className="min-h-screen bg-gym-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gym-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gym-red-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="bg-gym-card/85 backdrop-blur-xl border border-gym-border rounded-3xl p-8 shadow-card-dark">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gym-red-600 to-gym-red-900 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-16 h-16 rounded-2xl bg-gym-dark border border-gym-border-light flex items-center justify-center shadow-red-glow">
                <Dumbbell className="w-9 h-9 text-gym-red-500 -rotate-45" />
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-wider text-gym-white uppercase">
              IRON<span className="text-gym-red-500">GYM</span>
            </h1>
            <p className="text-xs text-gym-muted mt-1 uppercase tracking-widest">
              Acceso del personal
            </p>
          </div>

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

          <div className="mt-8 pt-6 border-t border-gym-border/50 flex flex-col items-center gap-2 text-xs text-gym-subtle">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gym-red-500" />
              <span>El token de sesión vive solo en memoria</span>
            </div>
            <span className="text-[10px] font-mono text-gym-muted">
              API:{' '}
              <strong className={ES_PRODUCCION ? 'text-gym-red-400' : 'text-emerald-400'}>
                {ES_PRODUCCION ? 'Producción' : 'Local'}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
