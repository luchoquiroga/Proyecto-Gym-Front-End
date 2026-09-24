import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { Direccion } from '../../lib/useOrden';

interface EncabezadoOrdenableProps {
  etiqueta: string;
  /** La dirección si esta columna es la que ordena; null si no. */
  direccion: Direccion | null;
  onOrdenar: () => void;
  /** Por ejemplo, en la búsqueda de socios, que el backend no ordena. */
  deshabilitado?: boolean;
}

const claseTh = 'py-4 px-6 font-semibold whitespace-nowrap';

/** El `<th>` de una columna que se puede ordenar, con `aria-sort` para lectores de pantalla. */
export const EncabezadoOrdenable = ({
  etiqueta,
  direccion,
  onOrdenar,
  deshabilitado = false,
}: EncabezadoOrdenableProps) => {
  if (deshabilitado) return <th className={claseTh}>{etiqueta}</th>;

  const Icono = direccion === 'asc' ? ArrowUp : direccion === 'desc' ? ArrowDown : ArrowUpDown;

  return (
    <th
      className={claseTh}
      aria-sort={direccion === 'asc' ? 'ascending' : direccion === 'desc' ? 'descending' : 'none'}
    >
      <button
        type="button"
        onClick={onOrdenar}
        className={`inline-flex items-center gap-1.5 uppercase tracking-wider transition-colors hover:text-white ${
          direccion ? 'text-white' : ''
        }`}
      >
        {etiqueta}
        <Icono className={`w-3.5 h-3.5 ${direccion ? 'text-gym-red-500' : 'opacity-50'}`} />
      </button>
    </th>
  );
};

/** El `<th>` de una columna que no se ordena, con el mismo estilo. */
export const Encabezado = ({ etiqueta }: { etiqueta: string }) => <th className={claseTh}>{etiqueta}</th>;
