import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CampoTexto } from '../../../components/ui/CampoTexto';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { useResetearContrasenaCuenta } from '../hooks';
import { resetContrasenaSchema, type ResetContrasenaFormulario } from '../schemas';
import type { CuentaStaff } from '../types';

const CAMPOS = ['nuevaContrasena'] as const;

interface ResetearContrasenaProps {
  cuenta: CuentaStaff;
  onCerrar: () => void;
}

/**
 * Para "se olvidó la clave": el staff no tiene email, así que no hay
 * recuperación automática. No pide la actual porque el ADMIN no la sabe.
 *
 * Solo sobre OTRAS cuentas: contra la propia el backend lo rechaza, y para esa
 * está "Cambiar contraseña" del menú, que sí pide la actual.
 */
export const ResetearContrasena = ({ cuenta, onCerrar }: ResetearContrasenaProps) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const reset = useResetearContrasenaCuenta();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetContrasenaFormulario>({
    resolver: zodResolver(resetContrasenaSchema),
    defaultValues: { nuevaContrasena: '', repetirContrasena: '' },
  });

  const guardar = handleSubmit(async ({ nuevaContrasena }) => {
    setMensajeServidor(null);
    try {
      await reset.mutateAsync({ id: cuenta.id, nuevaContrasena });
      setListo(true);
    } catch (error) {
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={reset.isPending}
      titulo="Resetear contraseña"
      descripcion={`${cuenta.nombre} — ${cuenta.rol}`}
    >
      {listo ? (
        <div className="space-y-5">
          <p className="text-sm text-gym-muted leading-relaxed">
            Listo. Pasale la contraseña nueva a <strong className="text-white">{cuenta.nombre}</strong>{' '}
            en persona: sus sesiones abiertas se cerraron y tiene que volver a ingresar. Conviene
            que después la cambie desde su menú.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-5" noValidate>
          {mensajeServidor && (
            <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
            </div>
          )}

          <CampoTexto
            etiqueta="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            autoFocus
            disabled={reset.isPending}
            error={errors.nuevaContrasena?.message}
            ayuda="Al menos 8 caracteres. Se cierran las sesiones abiertas de esa cuenta."
            {...register('nuevaContrasena')}
          />
          <CampoTexto
            etiqueta="Repetí la contraseña"
            type="password"
            autoComplete="new-password"
            disabled={reset.isPending}
            error={errors.repetirContrasena?.message}
            {...register('repetirContrasena')}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={reset.isPending}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={reset.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors disabled:opacity-50"
            >
              {reset.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Resetear
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
