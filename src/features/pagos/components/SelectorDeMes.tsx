import { ChevronLeft, ChevronRight } from 'lucide-react';
import { nombreDeMes } from '../../../lib/formato';

interface SelectorDeMesProps {
  anio: number;
  /** De 1 a 12, como lo espera el backend. */
  mes: number;
  /** El mes en curso: no se puede avanzar más allá (no hay cobros del futuro que mirar). */
  anioActual: number;
  mesActual: number;
  onCambiar: (anio: number, mes: number) => void;
}

export const SelectorDeMes = ({ anio, mes, anioActual, mesActual, onCambiar }: SelectorDeMesProps) => {
  const anterior = mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
  const siguiente = mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
  const esElActual = anio > anioActual || (anio === anioActual && mes >= mesActual);

  const claseBoton =
    'p-2 rounded-lg border border-gym-border text-gym-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gym-hover enabled:hover:text-white';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onCambiar(anterior.anio, anterior.mes)}
        aria-label="Mes anterior"
        className={claseBoton}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="min-w-40 text-center text-sm font-black uppercase tracking-wider text-white">
        {nombreDeMes(mes)} {anio}
      </span>
      <button
        type="button"
        onClick={() => onCambiar(siguiente.anio, siguiente.mes)}
        disabled={esElActual}
        aria-label="Mes siguiente"
        className={claseBoton}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
