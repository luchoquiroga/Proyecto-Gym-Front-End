import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CircleCheck, Loader2 } from 'lucide-react';
import { PantallaAuth, claseLinkAuth } from '../../../components/layout/PantallaAuth';
import { CampoTexto } from '../../../components/ui/CampoTexto';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { useSesion } from '../../../auth/sesion';
import { AvisoSesionCerrada } from '../../../auth/AvisoSesionCerrada';
import { RUTAS_LOGIN, rutaInicial } from '../../../auth/rutas';
import { useLoginSocio } from '../hooks';
import { logout } from '../../../auth/api';
import { loginSocioSchema, type LoginSocioFormulario } from '../schemas';

const CAMPOS = ['email', 'contrasena'] as const;

/** Lo que puede traer la navegación hasta acá. */
interface EstadoNavegacion {
  /** Lo deja `RutaProtegida` cuando manda a loguearse. */
  from?: { pathname: string };
  /** Lo deja el registro recién completado, para no hacer tipear el email de nuevo. */
  emailRegistrado?: string;
}

/**
 * Login del socio, contra `/clientes/login`. Es otra puerta que la del staff, no
 * una variante: se identifica con el EMAIL, deja otra cookie
 * (`clienteRefreshToken`) y después refresca contra otro endpoint.
 */
export const LoginSocioPage = () => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const iniciarSesion = useSesion((s) => s.iniciarSesion);
  const navigate = useNavigate();
  const estado = (useLocation().state ?? {}) as EstadoNavegacion;

  const ingreso = useLoginSocio();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginSocioFormulario>({
    resolver: zodResolver(loginSocioSchema),
    defaultValues: { email: estado.emailRegistrado ?? '', contrasena: '' },
  });

  const ingresar = handleSubmit(async (valores) => {
    setMensajeServidor(null);
    try {
      const { principal, accessToken } = await ingreso.mutateAsync(valores);
      iniciarSesion('socio', principal, accessToken);
      // Si en esta PC quedó abierta la sesión de un empleado (el socio entra
      // desde el mostrador), se cierra: si no, su cookie seguiría viva y
      // bastaría volver al portal de staff para entrar como ese empleado.
      void logout('staff').catch(() => undefined);

      const origen = estado.from?.pathname;
      navigate(origen?.startsWith('/socio/') ? origen : rutaInicial(principal), { replace: true });
    } catch (error) {
      // 401 "Credenciales incorrectas" y 429 del rate limit van arriba, con el
      // texto del backend: no son "algo salió mal".
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  return (
    <PantallaAuth
      subtitulo="Portal del socio"
      pie={
        <>
          <span>
            ¿Primera vez?{' '}
            <Link to="/socio/registro" className={claseLinkAuth}>
              Activá tu cuenta
            </Link>
          </span>
          <span className="mb-2">
            ¿Sos del personal?{' '}
            <Link to={RUTAS_LOGIN.staff} className={claseLinkAuth}>
              Ingresá acá
            </Link>
          </span>
        </>
      }
    >
      <AvisoSesionCerrada portal="socio" />

      {estado.emailRegistrado && !mensajeServidor && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/50 flex items-start gap-3 animate-fade-in">
          <CircleCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-200/90 leading-snug">
            Tu cuenta quedó activada. Ingresá con tu email y la contraseña que elegiste.
          </p>
        </div>
      )}

      {mensajeServidor && (
        <div className="mb-6 p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
        </div>
      )}

      <form onSubmit={ingresar} className="space-y-5" noValidate>
        <CampoTexto
          etiqueta="Email"
          type="email"
          autoComplete="email"
          autoFocus={!estado.emailRegistrado}
          disabled={ingreso.isPending}
          error={errors.email?.message}
          {...register('email')}
        />
        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          autoFocus={Boolean(estado.emailRegistrado)}
          disabled={ingreso.isPending}
          error={errors.contrasena?.message}
          {...register('contrasena')}
        />

        <button
          type="submit"
          disabled={ingreso.isPending}
          className="w-full py-3.5 px-4 bg-gym-red-600 hover:bg-gym-red-500 active:bg-gym-red-700 disabled:opacity-50 text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-colors shadow-red-glow hover:shadow-red-glow-lg flex items-center justify-center gap-2 mt-2"
        >
          {ingreso.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {ingreso.isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </PantallaAuth>
  );
};
