import { useState } from 'react';
import { BarChart3, Table } from 'lucide-react';
import { ErrorDeCarga, Esqueleto, SinDatos } from '../../../components/estado/Estados';
import { hoyIso, ultimosMeses } from '../../../lib/fechas';
import { useGananciasDeMeses } from '../hooks';
import { GraficoIngresos } from './GraficoIngresos';
import { TablaIngresos } from './TablaIngresos';

const CANTIDAD_DE_MESES = 12;

/**
 * La tarjeta de ingresos del último año: título, los cuatro estados (cargando,
 * error, vacío, con datos) y el cambio entre gráfico y tabla.
 */
export const IngresosUltimosMeses = () => {
  const [comoTabla, setComoTabla] = useState(false);
  const { datos, cargando, error, reintentar } = useGananciasDeMeses(
    ultimosMeses(CANTIDAD_DE_MESES, hoyIso()),
  );

  const sinCobros = datos?.every((m) => m.totalGanancias === 0);

  return (
    <div className="bg-gym-card border border-gym-border/80 rounded-2xl shadow-card-dark overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-6 pb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white">Ingresos por mes</h2>
          <p className="text-xs text-gym-muted">
            Últimos {CANTIDAD_DE_MESES} meses, sin los pagos anulados. Tocá un mes para ver sus pagos.
          </p>
        </div>
        {datos && !sinCobros && (
          <button
            type="button"
            onClick={() => setComoTabla((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-gym-muted hover:text-white hover:bg-gym-hover border border-gym-border transition-colors"
          >
            {comoTabla ? <BarChart3 className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
            {comoTabla ? 'Ver gráfico' : 'Ver como tabla'}
          </button>
        )}
      </div>

      {error ? (
        <ErrorDeCarga error={error} onReintentar={reintentar} />
      ) : cargando || !datos ? (
        <div className="px-6 pb-6">
          <Esqueleto className="w-full h-56" />
        </div>
      ) : sinCobros ? (
        <SinDatos titulo={`No hubo cobros en los últimos ${CANTIDAD_DE_MESES} meses`} />
      ) : comoTabla ? (
        <TablaIngresos meses={datos} />
      ) : (
        // Con un ancho mínimo, para que el texto del eje no quede ilegible en el celular.
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="min-w-[560px]">
            <GraficoIngresos meses={datos} />
          </div>
        </div>
      )}
    </div>
  );
};
