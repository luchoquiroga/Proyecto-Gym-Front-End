import { Ban } from 'lucide-react';
import { Encabezado, EncabezadoOrdenable } from '../../../components/ui/EncabezadoOrdenable';
import { formatearFecha, formatearPesos } from '../../../lib/formato';
import type { Direccion } from '../../../lib/useOrden';
import type { ColumnaPago } from '../api';
import type { PagoResponse } from '../types';

interface TablaPagosProps {
  pagos: PagoResponse[];
  onAnular: (pago: PagoResponse) => void;
  direccionDe: (columna: ColumnaPago) => Direccion | null;
  onOrdenar: (columna: ColumnaPago) => void;
}

/**
 * Filas de pagos. Los anulados se siguen mostrando, tachados: esconderlos sería
 * volver al borrado por la ventana. No hay "editar" en ninguna fila porque el
 * API no lo tiene, a propósito.
 */
export const TablaPagos = ({ pagos, onAnular, direccionDe, onOrdenar }: TablaPagosProps) => {
  const ordenable = (etiqueta: string, columna: ColumnaPago) => (
    <EncabezadoOrdenable
      etiqueta={etiqueta}
      direccion={direccionDe(columna)}
      onOrdenar={() => onOrdenar(columna)}
    />
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gym-border text-xs uppercase tracking-wider text-gym-muted bg-gym-dark/50">
            <Encabezado etiqueta="Recibo" />
            {ordenable('Socio', 'socio')}
            <Encabezado etiqueta="Documento" />
            <Encabezado etiqueta="Plan" />
            {ordenable('Fecha', 'fecha')}
            <Encabezado etiqueta="Cubre hasta" />
            {ordenable('Monto', 'monto')}
            <Encabezado etiqueta="" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gym-border/50">
          {pagos.map((pago) => (
            <tr
              key={pago.id}
              className={`transition-colors ${
                pago.anulado ? 'bg-gym-dark/60 text-gym-subtle' : 'hover:bg-gym-dark/40'
              }`}
            >
              <td className="py-4 px-6 font-mono text-xs text-gym-muted whitespace-nowrap">
                #{pago.id}
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
              {/* El documento es lo que distingue a dos homónimos: sin él, sería
                  imposible saber a cuál de los dos hay que anularle el pago. */}
              <td className="py-4 px-6 font-mono text-xs text-gym-muted whitespace-nowrap">
                {pago.cliente.documento}
              </td>
              <td className="py-4 px-6 text-gym-muted whitespace-nowrap">{pago.plan.nombre}</td>
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
              <td className="py-4 px-6 text-right">
                {!pago.anulado && (
                  <button
                    onClick={() => onAnular(pago)}
                    title="Anular un pago cargado por error (no lo borra)"
                    className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs font-bold text-gym-muted hover:text-gym-red-400 hover:bg-gym-red-600/10 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Anular
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
