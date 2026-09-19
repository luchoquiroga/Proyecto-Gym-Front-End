import { useState } from 'react';
import { Check, Copy, KeyRound, TriangleAlert } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import type { SocioAltaResponse } from '../types';

interface AvisoCodigoActivacionProps {
  alta: SocioAltaResponse;
  onCerrar: () => void;
}

/**
 * El código de activación viaja UNA sola vez, en la respuesta del alta: no hay
 * ningún endpoint para volver a consultarlo ni para reenviarlo. Si se pierde,
 * el socio no puede crearse la cuenta del portal.
 *
 * Por eso esto no es un "listo, creado" que se va solo: es una pantalla que hay
 * que cerrar a mano, con el código copiable.
 */
export const AvisoCodigoActivacion = ({ alta, onCerrar }: AvisoCodigoActivacionProps) => {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    if (!alta.codigoActivacion) return;
    try {
      await navigator.clipboard.writeText(alta.codigoActivacion);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (o sin https) queda el código en pantalla
      // para copiarlo a mano, que es lo que importa.
      setCopiado(false);
    }
  };

  return (
    <Modal
      onCerrar={onCerrar}
      titulo="Socio registrado"
      descripcion={`${alta.nombre} ${alta.apellido} — documento ${alta.documento}`}
    >
      <div className="space-y-5">
        {alta.codigoActivacion ? (
          <>
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/50 flex items-start gap-3">
              <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/90 leading-snug">
                Este código se muestra <strong>una sola vez</strong>. Entregáselo al socio: lo
                necesita para crearse la cuenta del portal. No hay forma de volver a verlo.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gym-dark border border-gym-border text-center space-y-4">
              <span className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gym-muted">
                <KeyRound className="w-3.5 h-3.5 text-gym-red-500" />
                Código de activación
              </span>

              <p className="text-3xl md:text-4xl font-black font-mono tracking-[0.35em] text-white select-all">
                {alta.codigoActivacion}
              </p>

              <button
                type="button"
                onClick={copiar}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-card hover:bg-gym-hover border border-gym-border text-white transition-colors"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar código
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gym-muted leading-relaxed">
            El socio se cargó con credenciales propias, así que no necesita código de activación.
          </p>
        )}

        <p className="text-xs text-gym-muted leading-relaxed">
          Queda <strong className="text-white">inactivo</strong> hasta su primer pago: el estado lo
          determina el cobro, no se pone a mano.
        </p>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors"
          >
            Ya se lo entregué
          </button>
        </div>
      </div>
    </Modal>
  );
};
