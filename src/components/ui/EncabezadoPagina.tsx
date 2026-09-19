import type { LucideIcon } from 'lucide-react';

interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
  /** Botones de acción de la pantalla. */
  children?: React.ReactNode;
}

export const EncabezadoPagina = ({
  titulo,
  descripcion,
  icono: Icono,
  children,
}: EncabezadoPaginaProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-start gap-3">
      {Icono && (
        <div className="w-11 h-11 shrink-0 rounded-2xl bg-gym-card border border-gym-border flex items-center justify-center text-gym-red-500">
          <Icono className="w-5 h-5" />
        </div>
      )}
      <div>
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
          {titulo}
        </h1>
        {descripcion && <p className="text-sm text-gym-muted mt-0.5">{descripcion}</p>}
      </div>
    </div>

    {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
  </div>
);
