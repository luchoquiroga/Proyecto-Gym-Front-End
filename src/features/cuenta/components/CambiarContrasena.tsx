import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CampoTexto } from '../../../components/ui/CampoTexto';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { logout } from '../../../auth/api';
import { useSesion } from '../../../auth/sesion';
import { RUTAS_LOGIN } from '../../../auth/rutas';
import { useCambiarContrasena } from '../hooks';
import { cambioContrasenaSchema, type CambioContrasenaFormulario } from '../schemas';

/** Los que viajan al backend. `repetirContrasena` es solo del front. */
const CAMPOS = ['contrasenaActual', 'nuevaContrasena'] as const;

/** Lo que le deja al login para que no parezca que la sesión se cayó sola. */
export interface AvisoDeLogin {
  aviso: string;
  nombre: string;
}

/**
 * Cambiar la propia contraseña. ADMIN y GERENCIA.
 *
 * Al cambiarla, el backend revoca todas las sesiones de la cuenta: el access
 * token actual sigue sirviendo hasta 30 minutos, pero el próximo refresh va a
 * fallar. En vez de esperar a que el interceptor lo descubra y te saque en medio
 * de un cobro, se cierra la sesión acá y se manda al login con un aviso claro.
 */
export const CambiarContrasena = ({ onCerrar }: { onCerrar: () => void }) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const principal = useSesion((s) => s.principal);
  const cerrarSesion = useSesion((s) => s.cerrarSesion);
  const navigate = useNavigate();
  const cambio = useCambiarContrasena();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CambioContrasenaFormulario>({
    resolver: zodResolver(cambioContrasenaSchema),
    defaultValues: { contrasenaActual: '', nuevaContrasena: '', repetirContrasena: '' },
  });

  const guardar = handleSubmit(async ({ contrasenaActual, nuevaContrasena }) => {
    setMensajeServidor(null);
    try {
      await cambio.mutateAsync({ contrasenaActual, nuevaContrasena });
    } catch (error) {
      // "La contraseña actual no es correcta" y "tiene que ser distinta" son
      // 400 solo con `mensaje`: van arriba, tal cual.
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
      return;
    }

    // La cookie ya fue revocada por el cambio; el logout es para prolijidad.
    await logout('staff');
    const estado: AvisoDeLogin = {
      aviso: 'Tu contraseña se cambió y se cerraron todas tus sesiones. Ingresá con la nueva.',
      nombre: principal?.nombre ?? '',
    };
    // Primero navegar y después cerrar la sesión: si fuera al revés, el guard
    // de la ruta mandaría al login sin el aviso.
    navigate(RUTAS_LOGIN.staff, { replace: true, state: estado });
    cerrarSesion();
  });

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={cambio.isPending}
      titulo="Cambiar contraseña"
      descripcion="Al cambiarla se cierran todas tus sesiones, incluida esta."
    >
      <form onSubmit={guardar} className="space-y-5" noValidate>
        {mensajeServidor && (
          <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
          </div>
        )}

        <CampoTexto
          etiqueta="Contraseña actual"
          type="password"
          autoComplete="current-password"
          autoFocus
          disabled={cambio.isPending}
          error={errors.contrasenaActual?.message}
          {...register('contrasenaActual')}
        />
        <CampoTexto
          etiqueta="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          disabled={cambio.isPending}
          error={errors.nuevaContrasena?.message}
          ayuda="Al menos 8 caracteres."
          {...register('nuevaContrasena')}
        />
        <CampoTexto
          etiqueta="Repetí la nueva contraseña"
          type="password"
          autoComplete="new-password"
          disabled={cambio.isPending}
          error={errors.repetirContrasena?.message}
          {...register('repetirContrasena')}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cambio.isPending}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cambio.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors disabled:opacity-50"
          >
            {cambio.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Cambiar y cerrar sesión
          </button>
        </div>
      </form>
    </Modal>
  );
};
