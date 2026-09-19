import type { LucideIcon } from 'lucide-react';
import { Esqueleto } from '../../../components/estado/Estados';
import { mensajeDeError } from '../../../lib/errores';

interface TarjetaKpiProps {
  titulo: string;
  valor: string | number | null;
  detalle?: string;
  icono: LucideIcon;
  cargando?: boolean;
  error?: unknown;
}

/**
 * Una tarjeta del dashboard. Si la consulta falló, la tarjeta lo dice: nunca
 * muestra un cero ni un número inventado, que es lo que haría parecer que el
 * gimnasio no facturó nada cuando en realidad el API está caída.
 */
export const TarjetaKpi = ({
  titulo,
  valor,
  detalle,
  icono: Icono,
  cargando,
  error,
}: TarjetaKpiProps) => (
  <div className="bg-gym-card border border-gym-border/80 hover:border-gym-red-600/40 rounded-2xl p-6 shadow-card-dark transition-colors duration-300">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-bold uppercase tracking-widest text-gym-muted">{titulo}</span>
      <div className="w-10 h-10 rounded-xl bg-gym-dark border border-gym-border flex items-center justify-center text-gym-red-500">
        <Icono className="w-5 h-5" />
      </div>
    </div>

    {cargando ? (
      <Esqueleto className="w-28 h-8" />
    ) : error ? (
      <div className="space-y-1">
        <p className="text-sm font-black uppercase tracking-wider text-gym-red-500">Sin dato</p>
        <p className="text-xs text-gym-muted leading-snug">{mensajeDeError(error)}</p>
      </div>
    ) : (
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-white tracking-tight">{valor}</h3>
        {detalle && <p className="text-xs text-gym-muted">{detalle}</p>}
      </div>
    )}
  </div>
);
