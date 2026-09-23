import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { PantallaAuth, claseLinkAuth } from '../../../components/layout/PantallaAuth';
import { CampoTexto } from '../../../components/ui/CampoTexto';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { RUTAS_LOGIN } from '../../../auth/rutas';
import { useRegistrarCuentaSocio } from '../hooks';
import {
  normalizarCodigoActivacion,
  registroSocioSchema,
  type RegistroSocioFormulario,
} from '../schemas';

/** Los que viajan al backend. `repetirContrasena` es solo del front. */
const CAMPOS = ['codigoActivacion', 'email', 'contrasena'] as const;

/**
 * El socio activa su cuenta del portal con el código que le dio el mostrador
 * al darlo de alta, y elige su email y su contraseña.
 *
 * No inicia sesión: el backend solo confirma, así que se lo manda al login con
 * el email ya escrito.
 */
export const RegistroSocioPage = () => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const navigate = useNavigate();
  const registro = useRegistrarCuentaSocio();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegistroSocioFormulario>({
    resolver: zodResolver(registroSocioSchema),
    defaultValues: { codigoActivacion: '', email: '', contrasena: '', repetirContrasena: '' },
  });

  const registrar = handleSubmit(async ({ codigoActivacion, email, contrasena }) => {
    setMensajeServidor(null);
    try {
      await registro.mutateAsync({
        codigoActivacion: normalizarCodigoActivacion(codigoActivacion),
        email,
        contrasena,
      });
      navigate(RUTAS_LOGIN.socio, { replace: true, state: { emailRegistrado: email } });
    } catch (error) {
      // "Código inválido o ya utilizado", "ya existe una cuenta", "email de otro
      // socio": son 400 sin `errores`, y el texto del backend ya dice qué hacer.
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  return (
    <PantallaAuth
      subtitulo="Activá tu cuenta"
      pie={
        <span className="mb-2">
          ¿Ya la activaste?{' '}
          <Link to={RUTAS_LOGIN.socio} className={claseLinkAuth}>
            Ingresá
          </Link>
        </span>
      }
    >
      {mensajeServidor && (
        <div className="mb-6 p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
        </div>
      )}

      <form onSubmit={registrar} className="space-y-5" noValidate>
        <CampoTexto
          etiqueta="Código de activación"
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={registro.isPending}
          error={errors.codigoActivacion?.message}
          ayuda="Te lo dieron en el mostrador cuando te anotaste. Sirve una sola vez."
          {...register('codigoActivacion')}
        />
        <CampoTexto
          etiqueta="Email"
          type="email"
          autoComplete="email"
          disabled={registro.isPending}
          error={errors.email?.message}
          ayuda="Es con lo que vas a ingresar al portal."
          {...register('email')}
        />
        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          disabled={registro.isPending}
          error={errors.contrasena?.message}
          {...register('contrasena')}
        />
        <CampoTexto
          etiqueta="Repetí la contraseña"
          type="password"
          autoComplete="new-password"
          disabled={registro.isPending}
          error={errors.repetirContrasena?.message}
          {...register('repetirContrasena')}
        />

        <button
          type="submit"
          disabled={registro.isPending}
          className="w-full py-3.5 px-4 bg-gym-red-600 hover:bg-gym-red-500 active:bg-gym-red-700 disabled:opacity-50 text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-colors shadow-red-glow hover:shadow-red-glow-lg flex items-center justify-center gap-2 mt-2"
        >
          {registro.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Activar cuenta
        </button>
      </form>
    </PantallaAuth>
  );
};
