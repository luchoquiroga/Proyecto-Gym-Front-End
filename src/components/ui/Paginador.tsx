import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginadorProps {
  /** Página actual, arranca en 0 (como la del backend). */
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
  onCambiar: (pagina: number) => void;
}

export const Paginador = ({ pagina, totalPaginas, totalElementos, onCambiar }: PaginadorProps) => {
  const primera = pagina <= 0;
  const ultima = pagina >= totalPaginas - 1;

  const claseBoton =
    'flex items-center gap-1 px-3 py-2 rounded-lg border border-gym-border text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gym-hover enabled:hover:text-white text-gym-muted';

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-gym-border bg-gym-dark/40">
      <p className="text-xs text-gym-muted">
        <span className="font-bold text-white">{totalElementos}</span>{' '}
        {totalElementos === 1 ? 'registro' : 'registros'}
        {totalPaginas > 1 && (
          <>
            {' · página '}
            <span className="font-bold text-white">{pagina + 1}</span> de {totalPaginas}
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <button className={claseBoton} disabled={primera} onClick={() => onCambiar(pagina - 1)}>
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <button className={claseBoton} disabled={ultima} onClick={() => onCambiar(pagina + 1)}>
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
