import { CalendarCheck, TriangleAlert } from 'lucide-react';
import { formatearFecha } from '../../../lib/formato';
import type { PrevisionCobro } from '../schemas';

interface AvisoPrevisionCobroProps {
  prevision: PrevisionCobro;
  fechaPago: string;
  vencimientoActual: string | null;
}

/**
 * Lo que va a pasar con el socio si se confirma el cobro, dicho ANTES de
 * confirmarlo. El caso que más importa es el del socio que todavía está al
 * día: el backend arranca el período nuevo en la fecha del pago y no a
 * continuación del vigente, así que cobrar antes de tiempo hace perder días.
 */
export const AvisoPrevisionCobro = ({
  prevision,
  fechaPago,
  vencimientoActual,
}: AvisoPrevisionCobroProps) => {
  const { vencimientoDelPago, diasSuperpuestos, noCambiaElVencimiento, yaVencido } = prevision;
  const vence = formatearFecha(vencimientoDelPago);
  const actual = formatearFecha(vencimientoActual);

  let advertencia: string | null = null;
  if (noCambiaElVencimiento) {
    advertencia = `Ya tiene pago hasta el ${actual}, más allá de lo que cubre este cobro (hasta el ${vence}): su vencimiento no cambia.`;
  } else if (yaVencido) {
    advertencia = `Este período ya terminó el ${vence}: el pago se registra, pero no deja al socio al día.`;
  } else if (diasSuperpuestos > 0) {
    advertencia = `Ya tiene pago hasta el ${actual}. El período nuevo arranca el ${formatearFecha(fechaPago)}, no a continuación: vence el ${vence} y se pierden ${diasSuperpuestos} ${diasSuperpuestos === 1 ? 'día' : 'días'} que ya había pagado.`;
  }

  if (advertencia) {
    return (
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/50 flex items-start gap-3">
        <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/90 leading-snug">{advertencia}</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gym-dark border border-gym-border flex items-start gap-3">
      <CalendarCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      <p className="text-sm text-gym-muted leading-snug">
        Queda al día hasta el <strong className="text-white">{vence}</strong>.
      </p>
    </div>
  );
};
