import { AlertTriangle, Inbox, Loader2, RefreshCw, ShieldX } from 'lucide-react';
import { normalizarError } from '../../lib/errores';

/**
 * Los cuatro estados de una pantalla son cargando, vacío, error y con datos.
 * Acá viven los tres primeros para que se vean igual en toda la web y para que
 * ninguna pantalla tenga la tentación de inventar datos cuando el API falla.
 */

export const Cargando = ({ texto = 'Cargando...' }: { texto?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-gym-muted">
    <Loader2 className="w-6 h-6 animate-spin text-gym-red-500" />
    <p className="text-xs font-bold uppercase tracking-widest">{texto}</p>
  </div>
);

export const SinDatos = ({ titulo, detalle }: { titulo: string; detalle?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="w-12 h-12 rounded-2xl bg-gym-dark border border-gym-border flex items-center justify-center text-gym-subtle">
      <Inbox className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-bold text-white">{titulo}</p>
      {detalle && <p className="text-xs text-gym-muted mt-1">{detalle}</p>}
    </div>
  </div>
);

interface ErrorDeCargaProps {
  error: unknown;
  onReintentar?: () => void;
}

/**
 * Muestra el `mensaje` que devolvió el backend, tal cual.
 *
 * El 403 se trata aparte a propósito: no es "algo salió mal", es que la
 * pantalla y los permisos se desincronizaron, y hay que poder verlo.
 */
export const ErrorDeCarga = ({ error, onReintentar }: ErrorDeCargaProps) => {
  const { mensaje, status } = normalizarError(error);
  const esProhibido = status === 403;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
      <div
        className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
          esProhibido
            ? 'bg-amber-950/40 border-amber-700/50 text-amber-400'
            : 'bg-gym-red-900/20 border-gym-red-700/50 text-gym-red-500'
        }`}
      >
        {esProhibido ? <ShieldX className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
      </div>

      <div className="max-w-md space-y-1">
        <p className="text-sm font-black uppercase tracking-wider text-white">
          {esProhibido ? 'Sin permiso para esta operación' : 'No se pudieron traer los datos'}
        </p>
        <p className="text-sm text-gym-muted leading-snug">{mensaje}</p>
        {status !== null && (
          <p className="text-[11px] font-mono text-gym-subtle">HTTP {status}</p>
        )}
      </div>

      {onReintentar && (
        <button
          onClick={onReintentar}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gym-card hover:bg-gym-hover border border-gym-border text-xs font-bold uppercase tracking-wider text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      )}
    </div>
  );
};

/** Barra gris con pulso, para las tarjetas del dashboard mientras cargan. */
export const Esqueleto = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gym-hover/70 rounded animate-pulse ${className}`} />
);
