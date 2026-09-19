import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  /** Mientras se está guardando, cerrar de golpe confunde: se bloquea el escape. */
  bloqueado?: boolean;
}

/**
 * Diálogo modal propio, con Tailwind.
 *
 * No recibe un `abierto`: si está montado, está abierto. Así el formulario que
 * vive adentro nace con los datos que le corresponden en vez de tener que
 * reiniciarse con un efecto cada vez que se abre.
 *
 * No usa una librería de componentes porque todavía no se decidió si se adopta
 * shadcn/ui (`STACK.md` §9). Lo mínimo que tiene que hacer para no ser una capa
 * de div sobre otra: cerrarse con Escape, cerrarse al hacer clic afuera, y
 * anunciarse como diálogo para el lector de pantalla.
 */
export const Modal = ({ onCerrar, titulo, descripcion, children, bloqueado = false }: ModalProps) => {
  const idTitulo = useId();

  useEffect(() => {
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !bloqueado) onCerrar();
    };

    document.addEventListener('keydown', alPresionar);
    // Sin esto, la página de atrás scrollea mientras el modal está abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [bloqueado, onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => !bloqueado && onCerrar()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="relative z-10 w-full max-w-lg my-auto bg-gym-card border border-gym-border rounded-3xl shadow-card-dark animate-slide-up"
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gym-border/60">
          <div>
            <h2 id={idTitulo} className="text-lg font-black uppercase tracking-wider text-white">
              {titulo}
            </h2>
            {descripcion && <p className="text-xs text-gym-muted mt-1">{descripcion}</p>}
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={bloqueado}
            aria-label="Cerrar"
            className="p-1 rounded-lg text-gym-subtle hover:text-white hover:bg-gym-hover transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
