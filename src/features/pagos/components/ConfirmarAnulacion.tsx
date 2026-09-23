import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CampoAreaTexto } from '../../../components/ui/CampoAreaTexto';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { formatearFecha, formatearPesos } from '../../../lib/formato';
import { useAnularPago } from '../hooks';
import { anulacionSchema, type AnulacionFormulario } from '../schemas';
import type { PagoResponse } from '../types';

const CAMPOS = ['motivo'] as const;

interface ConfirmarAnulacionProps {
  pago: PagoResponse;
  onCerrar: () => void;
}

/**
 * Anular un pago cargado por error. Solo ADMIN.
 *
 * No es un "eliminar" y la UI no lo tiene que sugerir: el pago se sigue viendo,
 * tachado, con quién y cuándo lo anuló guardado en el backend. Tampoco hay
 * "editar": corregir un importe es anular este y volver a cobrar.
 */
export const ConfirmarAnulacion = ({ pago, onCerrar }: ConfirmarAnulacionProps) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const anulacion = useAnularPago();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AnulacionFormulario>({
    resolver: zodResolver(anulacionSchema),
    defaultValues: { motivo: '' },
  });

  const anular = handleSubmit(async ({ motivo }) => {
    setMensajeServidor(null);
    try {
      await anulacion.mutateAsync({ id: pago.id, motivo });
      onCerrar();
    } catch (error) {
      // El caso que más va a aparecer: otro pago se encadenó a este y hay que
      // anular ese primero. Es un 400 solo con `mensaje`, que ya nombra al
      // pago posterior: va arriba, tal cual.
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  const detalle: Array<[string, string]> = [
    ['Socio', `${pago.cliente.nombre} ${pago.cliente.apellido} — ${pago.cliente.documento}`],
    ['Plan', pago.plan.nombre],
    ['Fecha de pago', formatearFecha(pago.fechaPago)],
    ['Monto', formatearPesos(pago.montoAbonado)],
  ];

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={anulacion.isPending}
      titulo={`Anular el pago #${pago.id}`}
      descripcion="Para pagos cargados por error. No se borra nada."
    >
      <form onSubmit={anular} className="space-y-5" noValidate>
        {mensajeServidor && (
          <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
          </div>
        )}

        <dl className="rounded-2xl bg-gym-dark border border-gym-border divide-y divide-gym-border/60">
          {detalle.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
              <dt className="text-gym-muted">{etiqueta}</dt>
              <dd className="font-bold text-white text-right">{valor}</dd>
            </div>
          ))}
        </dl>

        <p className="text-sm text-gym-muted leading-relaxed">
          El pago queda en el listado <strong className="text-white">tachado</strong>, deja de
          sumar en las ganancias y deja de contar para el vencimiento del socio, que puede volver
          al de su pago anterior. Si el importe estaba mal, después se cobra el correcto.
        </p>

        <CampoAreaTexto
          etiqueta="Motivo"
          autoFocus
          maxLength={300}
          disabled={anulacion.isPending}
          error={errors.motivo?.message}
          ayuda="Obligatorio. Queda guardado junto con quién anuló y cuándo."
          {...register('motivo')}
        />

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={anulacion.isPending}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={anulacion.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors disabled:opacity-50"
          >
            {anulacion.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Anular pago
          </button>
        </div>
      </form>
    </Modal>
  );
};
