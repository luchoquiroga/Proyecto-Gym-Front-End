import { ESTADOS_SOCIO, type EstadoSocio } from '../types';

const ETIQUETAS: Record<EstadoSocio, string> = {
  ACTIVO: 'Activos',
  MOROSO: 'Morosos',
  INACTIVO: 'Inactivos',
};

interface FiltroEstadoProps {
  /** null = todos. */
  estado: EstadoSocio | null;
  onCambiar: (estado: EstadoSocio | null) => void;
  deshabilitado?: boolean;
}

/**
 * Chips para ver el padrón entero o un solo estado. El filtro lo aplica el
 * backend (`?estado=`): filtrar la página en memoria mostraría solo los morosos
 * de esas 20 filas y parecería que no hay más.
 */
export const FiltroEstado = ({ estado, onCambiar, deshabilitado }: FiltroEstadoProps) => {
  const opciones: { valor: EstadoSocio | null; etiqueta: string }[] = [
    { valor: null, etiqueta: 'Todos' },
    ...ESTADOS_SOCIO.map((valor) => ({ valor, etiqueta: ETIQUETAS[valor] })),
  ];

  return (
    <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
      {opciones.map(({ valor, etiqueta }) => {
        const activo = estado === valor;
        return (
          <button
            key={etiqueta}
            type="button"
            aria-pressed={activo}
            disabled={deshabilitado}
            onClick={() => onCambiar(valor)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              activo
                ? 'bg-gym-red-600 border-gym-red-600 text-white'
                : 'bg-gym-card border-gym-border text-gym-muted hover:text-white hover:bg-gym-hover'
            }`}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
};
