import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { mensajeDeError } from '../../../lib/errores';
import { useCambiarActivoCuenta } from '../hooks';
import type { CuentaStaff } from '../types';

interface ConfirmarCambioActivoProps {
  cuenta: CuentaStaff;
  onCerrar: () => void;
}

/**
 * Dar de baja o reactivar una cuenta de staff: el mismo endpoint, en las dos
 * direcciones. Nunca se borra: la fila queda, y con ella el rastro de lo que
 * esa persona cobró y anuló.
 *
 * "No podés darte de baja" y "es el último administrador" los decide el
 * backend: si pasan, se muestra su 400 tal cual, sin adivinarlos acá.
 */
export const ConfirmarCambioActivo = ({ cuenta, onCerrar }: ConfirmarCambioActivoProps) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const cambio = useCambiarActivoCuenta();
  const reactivar = !cuenta.activo;

  const confirmar = async () => {
    setMensajeServidor(null);
    try {
      await cambio.mutateAsync({ id: cuenta.id, activo: reactivar });
      onCerrar();
    } catch (error) {
      setMensajeServidor(mensajeDeError(error));
    }
  };

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={cambio.isPending}
      titulo={reactivar ? 'Reactivar cuenta' : 'Dar de baja la cuenta'}
      descripcion={`${cuenta.nombre} — ${cuenta.rol}`}
    >
      <div className="space-y-5">
        {mensajeServidor && (
          <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
          </div>
        )}

        <p className="text-sm text-gym-muted leading-relaxed">
          {reactivar ? (
            <>
              La cuenta vuelve a poder ingresar con <strong className="text-white">su misma
              contraseña</strong>. Si no la recuerda, después reseteásela.
            </>
          ) : (
            <>
              La cuenta deja de poder ingresar y{' '}
              <strong className="text-white">se cierran sus sesiones abiertas</strong>.{' '}
              <strong className="text-white">No se borra nada</strong>: sus cobros siguen
              registrados a su nombre, y se puede reactivar cuando haga falta.
            </>
          )}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cambio.isPending}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={cambio.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors disabled:opacity-50"
          >
            {cambio.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {reactivar ? 'Reactivar' : 'Dar de baja'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
