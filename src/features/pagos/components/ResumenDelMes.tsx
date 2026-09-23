import { Esqueleto } from '../../../components/estado/Estados';
import { mensajeDeError } from '../../../lib/errores';
import { formatearPesos } from '../../../lib/formato';
import { useGananciasMensuales } from '../../dashboard/hooks';

/**
 * El total del mes, el MISMO número que muestra el dashboard: sale del mismo
 * endpoint con el mismo mes. No se suma la tabla en el navegador: la tabla
 * está paginada, y sumar 20 filas daría otro número y el usuario no sabría a
 * cuál de los dos creerle.
 *
 * Coinciden por construcción: los dos filtran por `fechaPago` entre el primer y
 * el último día del mes. La única diferencia es que el total excluye los
 * anulados y la tabla los muestra tachados.
 */
export const ResumenDelMes = ({ anio, mes }: { anio: number; mes: number }) => {
  const { data, isLoading, isError, error } = useGananciasMensuales(anio, mes);

  return (
    <div className="px-6 py-5 border-b border-gym-border bg-gym-dark/40">
      {isLoading ? (
        <Esqueleto className="w-64 h-7" />
      ) : isError ? (
        <p className="text-sm text-gym-red-400">
          No se pudo traer el total del mes: {mensajeDeError(error)}
        </p>
      ) : data ? (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-2xl font-black text-white tracking-tight">
            {formatearPesos(data.totalGanancias)}
          </p>
          <p className="text-xs text-gym-muted">
            en <strong className="text-white">{data.cantidadPagos}</strong>{' '}
            {data.cantidadPagos === 1 ? 'cobro válido' : 'cobros válidos'}. Los anulados se listan
            tachados y no suman.
          </p>
        </div>
      ) : null}
    </div>
  );
};
