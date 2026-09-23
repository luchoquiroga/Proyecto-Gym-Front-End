import { Link } from 'react-router-dom';
import { formatearPesos, nombreDeMes } from '../../../lib/formato';
import type { GananciasMensuales } from '../types';

/**
 * La misma serie que el gráfico, como tabla. No es un extra: es lo que hace que
 * ningún valor dependa de pasar el mouse (lectores de pantalla, teclado,
 * impresión). Lo más nuevo arriba, que es como se lee una tabla.
 */
export const TablaIngresos = ({ meses }: { meses: GananciasMensuales[] }) => {
  const enCurso = meses[meses.length - 1];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-y border-gym-border text-xs uppercase tracking-wider text-gym-muted bg-gym-dark/50">
            <th className="py-3 px-6 font-semibold">Mes</th>
            <th className="py-3 px-6 font-semibold text-right">Cobros</th>
            <th className="py-3 px-6 font-semibold text-right">Ingresos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gym-border/50">
          {[...meses].reverse().map((m) => (
            <tr key={`${m.anio}-${m.mes}`} className="hover:bg-gym-dark/40 transition-colors">
              <td className="py-3 px-6 text-white whitespace-nowrap">
                <Link
                  to={`/staff/pagos?anio=${m.anio}&mes=${m.mes}`}
                  className="capitalize hover:text-gym-red-400 transition-colors"
                >
                  {nombreDeMes(m.mes)} {m.anio}
                </Link>
                {m === enCurso && <span className="ml-2 text-[11px] text-gym-subtle">(en curso)</span>}
              </td>
              <td className="py-3 px-6 text-right text-gym-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {m.cantidadPagos}
              </td>
              <td className="py-3 px-6 text-right font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatearPesos(m.totalGanancias)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
