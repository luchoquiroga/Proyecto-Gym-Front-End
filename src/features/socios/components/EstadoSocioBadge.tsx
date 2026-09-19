import { CheckCircle, Clock, MinusCircle } from 'lucide-react';
import type { EstadoSocio } from '../types';

const ESTILOS: Record<EstadoSocio, { clase: string; Icono: typeof CheckCircle; texto: string }> = {
  ACTIVO: {
    clase: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/70',
    Icono: CheckCircle,
    texto: 'Activo',
  },
  MOROSO: {
    clase: 'bg-amber-950/70 text-amber-400 border-amber-700/70',
    Icono: Clock,
    texto: 'Moroso',
  },
  INACTIVO: {
    clase: 'bg-zinc-800/70 text-zinc-400 border-zinc-700/70',
    Icono: MinusCircle,
    texto: 'Inactivo',
  },
};

export const EstadoSocioBadge = ({ estado }: { estado: EstadoSocio }) => {
  const estilo = ESTILOS[estado];

  // Si el backend agrega un estado nuevo, se muestra tal cual en vez de caer en
  // un estilo por defecto que lo haga parecer otra cosa.
  if (!estilo) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gym-dark text-gym-muted border border-gym-border">
        {estado}
      </span>
    );
  }

  const { clase, Icono, texto } = estilo;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${clase}`}
    >
      <Icono className="w-3.5 h-3.5" />
      {texto}
    </span>
  );
};
