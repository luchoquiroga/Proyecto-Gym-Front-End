import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { mensajeDeError } from '../../../lib/errores';
import { formatearPesos } from '../../../lib/formato';
import { useEliminarPlan } from '../hooks';
import type { Plan } from '../types';

interface ConfirmarEliminacionPlanProps {
  plan: Plan;
  onCerrar: () => void;
}

/**
 * Eliminar un plan. Es el único borrado real del API, así que la UI dice
 * "eliminar" (a diferencia de socios y staff, que se dan de baja).
 *
 * Un plan con pagos no se puede borrar: el backend responde 400 con un mensaje
 * que lo explica, y se muestra tal cual. No se intenta adivinar antes si tiene
 * pagos: ese dato es de ADMIN y lo sabe el backend.
 */
export const ConfirmarEliminacionPlan = ({ plan, onCerrar }: ConfirmarEliminacionPlanProps) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const eliminar = useEliminarPlan();

  const confirmar = async () => {
    setMensajeServidor(null);
    try {
      await eliminar.mutateAsync(plan.id);
      onCerrar();
    } catch (error) {
      setMensajeServidor(mensajeDeError(error));
    }
  };

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={eliminar.isPending}
      titulo="Eliminar plan"
      descripcion={`${plan.nombre} — ${formatearPesos(plan.precio)}, ${plan.duracion} ${plan.duracion === 1 ? 'día' : 'días'}`}
    >
      <div className="space-y-5">
        {mensajeServidor && (
          <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
          </div>
        )}

        <p className="text-sm text-gym-muted leading-relaxed">
          El plan <strong className="text-white">se borra definitivamente</strong>. Solo se puede si
          nunca se cobró con él: si ya tiene pagos, el sistema no lo deja borrar para no perder el
          historial, y el plan queda como está.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={eliminar.isPending}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={eliminar.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors disabled:opacity-50"
          >
            {eliminar.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
};
