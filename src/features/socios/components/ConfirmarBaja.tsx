import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { mensajeDeError } from '../../../lib/errores';
import { useDarDeBajaSocio } from '../hooks';
import type { Socio } from '../types';

interface ConfirmarBajaProps {
  socio: Socio;
  onCerrar: () => void;
}

/**
 * Baja de un socio. No es un borrado y la UI no debe sugerir que lo sea: la
 * fila no desaparece nunca, el socio queda INACTIVO y su historial de pagos
 * sigue estando. No existe ningún DELETE de socios en el API.
 *
 * Volver a ACTIVO no se ofrece porque no se puede: eso lo determina un pago.
 */
export const ConfirmarBaja = ({ socio, onCerrar }: ConfirmarBajaProps) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const baja = useDarDeBajaSocio();

  const confirmar = async () => {
    setMensajeServidor(null);
    try {
      await baja.mutateAsync(socio.id);
      onCerrar();
    } catch (error) {
      setMensajeServidor(mensajeDeError(error));
    }
  };

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={baja.isPending}
      titulo="Dar de baja"
      descripcion={`${socio.nombre} ${socio.apellido} — documento ${socio.documento}`}
    >
      <div className="space-y-5">
        {mensajeServidor && (
          <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
          </div>
        )}

        <p className="text-sm text-gym-muted leading-relaxed">
          El socio pasa a <strong className="text-white">inactivo</strong> y deja de figurar como
          vigente. <strong className="text-white">No se borra nada</strong>: su ficha y sus pagos
          quedan igual, y si vuelve al gimnasio se reactiva cobrándole.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={baja.isPending}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={baja.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors disabled:opacity-50"
          >
            {baja.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Dar de baja
          </button>
        </div>
      </div>
    </Modal>
  );
};
