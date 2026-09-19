import { useState } from 'react';
import { Ban, CreditCard } from 'lucide-react';
import { EncabezadoPagina } from '../../../components/ui/EncabezadoPagina';
import { Paginador } from '../../../components/ui/Paginador';
import { Cargando, ErrorDeCarga, SinDatos } from '../../../components/estado/Estados';
import { formatearFecha, formatearPesos } from '../../../lib/formato';
import { usePagos } from '../hooks';

const COLUMNAS = ['Recibo', 'Socio', 'Documento', 'Plan', 'Fecha', 'Cubre hasta', 'Monto'];

export const PagosPage = () => {
  const [pagina, setPagina] = useState(0);
  const { data, isLoading, isError, error, refetch } = usePagos({ page: pagina });

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Pagos"
        descripcion="Historial de cobros. El cobro se registra desde la ficha del socio."
        icono={CreditCard}
      />

      <div className="bg-gym-card border border-gym-border rounded-2xl overflow-hidden shadow-card-dark">
        {isLoading ? (
          <Cargando texto="Trayendo pagos..." />
        ) : isError ? (
          <ErrorDeCarga error={error} onReintentar={() => refetch()} />
        ) : !data || data.contenido.length === 0 ? (
          <SinDatos titulo="Todavía no hay pagos registrados" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gym-border text-xs uppercase tracking-wider text-gym-muted bg-gym-dark/50">
                    {COLUMNAS.map((columna) => (
                      <th key={columna} className="py-4 px-6 font-semibold whitespace-nowrap">
                        {columna}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gym-border/50">
                  {data.contenido.map((pago) => (
                    <tr
                      key={pago.id}
                      className={`transition-colors ${
                        pago.anulado ? 'bg-gym-dark/60 text-gym-subtle' : 'hover:bg-gym-dark/40'
                      }`}
                    >
                      <td className="py-4 px-6 font-mono text-xs text-gym-muted whitespace-nowrap">
                        #{pago.id}
                        {/* Un pago anulado se sigue mostrando, marcado. Esconderlo sería
                            volver al borrado por la ventana. */}
                        {pago.anulado && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gym-red-950/70 text-gym-red-400 border border-gym-red-800/70">
                            <Ban className="w-3 h-3" />
                            Anulado
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-4 px-6 font-bold whitespace-nowrap ${
                          pago.anulado ? 'line-through text-gym-muted' : 'text-white'
                        }`}
                      >
                        {pago.cliente.nombre} {pago.cliente.apellido}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-gym-muted whitespace-nowrap">
                        {pago.cliente.documento}
                      </td>
                      <td className="py-4 px-6 text-gym-muted whitespace-nowrap">
                        {pago.plan.nombre}
                      </td>
                      <td className="py-4 px-6 text-gym-muted whitespace-nowrap">
                        {formatearFecha(pago.fechaPago)}
                      </td>
                      <td className="py-4 px-6 text-gym-muted whitespace-nowrap">
                        {formatearFecha(pago.fechaVencimiento)}
                      </td>
                      <td
                        className={`py-4 px-6 font-mono font-extrabold whitespace-nowrap ${
                          pago.anulado ? 'line-through text-gym-subtle' : 'text-emerald-400'
                        }`}
                      >
                        {formatearPesos(pago.montoAbonado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Paginador
              pagina={data.pagina}
              totalPaginas={data.totalPaginas}
              totalElementos={data.totalElementos}
              onCambiar={setPagina}
            />
          </>
        )}
      </div>
    </div>
  );
};
