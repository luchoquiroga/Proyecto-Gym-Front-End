import { CalendarCheck, History } from 'lucide-react';
import { formatearFecha } from '../../../lib/formato';
import type { PrevisionCobro } from '../schemas';

/**
 * Lo que va a pasar con el socio si se confirma el cobro, dicho ANTES de
 * confirmarlo. Desde la Fase 9 del backend el cobro anticipado se encadena, así
 * que ya no hay días que se pierdan: el único caso que pide atención es el
 * cobro con fecha pasada, cuyo vencimiento el front no puede anticipar.
 */
export const AvisoPrevisionCobro = ({ prevision }: { prevision: PrevisionCobro }) => {
  if (prevision.tipo === 'retroactivo') {
    return (
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/50 flex items-start gap-3">
        <History className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/90 leading-snug">
          Es un cobro con <strong>fecha pasada</strong>. El vencimiento se calcula con lo que el
          socio tenía pago en esa fecha, así que lo vas a ver en el comprobante. Si ese período ya
          terminó, el pago se registra pero no lo deja al día.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gym-dark border border-gym-border flex items-start gap-3">
      <CalendarCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      <p className="text-sm text-gym-muted leading-snug">
        {prevision.tipo === 'encadenado' && (
          <>
            Ya tiene pago hasta el {formatearFecha(prevision.desde)}: el período nuevo arranca ahí,
            sin perder días.{' '}
          </>
        )}
        Queda al día hasta el <strong className="text-white">{formatearFecha(prevision.vence)}</strong>.
      </p>
    </div>
  );
};
