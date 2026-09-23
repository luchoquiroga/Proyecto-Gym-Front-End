import { CircleCheck, TriangleAlert } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { formatearFecha, formatearPesos } from '../../../lib/formato';
import { hoyIso } from '../../../lib/fechas';
import type { PagoResponse } from '../types';

interface ComprobanteCobroProps {
  pago: PagoResponse;
  onCerrar: () => void;
}

/**
 * Confirmación del cobro, armada con lo que DEVOLVIÓ el backend y no con lo
 * que se tipeó en el formulario: el vencimiento que se ve acá es el real.
 *
 * No muestra quién cobró: `PagoResponse` no lo trae, a propósito.
 */
export const ComprobanteCobro = ({ pago, onCerrar }: ComprobanteCobroProps) => {
  // Mismo criterio que el backend: el pago activa al socio solo si su período
  // termina después de hoy. Si no, está registrado pero no lo deja al día.
  const noActiva = pago.fechaVencimiento <= hoyIso();

  const filas: Array<[string, string]> = [
    ['Plan', pago.plan.nombre],
    ['Importe', formatearPesos(pago.montoAbonado)],
    ['Fecha de pago', formatearFecha(pago.fechaPago)],
    ['Cubre hasta', formatearFecha(pago.fechaVencimiento)],
  ];

  return (
    <Modal
      onCerrar={onCerrar}
      titulo="Pago registrado"
      descripcion={`${pago.cliente.nombre} ${pago.cliente.apellido} — documento ${pago.cliente.documento}`}
    >
      <div className="space-y-5">
        {noActiva ? (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/50 flex items-start gap-3">
            <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/90 leading-snug">
              El pago quedó <strong>registrado</strong>, pero su período ya terminó: no deja al
              socio al día. No lo vuelvas a cobrar.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/50 flex items-start gap-3">
            <CircleCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-200/90 leading-snug">
              Cobro registrado. El listado de socios ya muestra su estado y vencimiento actualizados.
            </p>
          </div>
        )}

        <dl className="rounded-2xl bg-gym-dark border border-gym-border divide-y divide-gym-border/60">
          {filas.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex items-center justify-between px-4 py-3 text-sm">
              <dt className="text-gym-muted">{etiqueta}</dt>
              <dd className="font-bold text-white">{valor}</dd>
            </div>
          ))}
        </dl>

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
    </Modal>
  );
};
