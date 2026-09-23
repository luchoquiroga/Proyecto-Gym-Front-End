import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { EncabezadoPagina } from '../../../components/ui/EncabezadoPagina';
import { Paginador } from '../../../components/ui/Paginador';
import { Cargando, ErrorDeCarga, SinDatos } from '../../../components/estado/Estados';
import { hoyIso, rangoDelMes } from '../../../lib/fechas';
import { nombreDeMes } from '../../../lib/formato';
import { usePagos } from '../hooks';
import { ConfirmarAnulacion } from '../components/ConfirmarAnulacion';
import { ResumenDelMes } from '../components/ResumenDelMes';
import { SelectorDeMes } from '../components/SelectorDeMes';
import { TablaPagos } from '../components/TablaPagos';
import type { PagoResponse } from '../types';

/** Lo más nuevo arriba; el id desempata los cobros del mismo día. */
const ORDEN = ['fechaPago,desc', 'id,desc'];

const leerEntero = (valor: string | null, min: number, max: number): number | null => {
  const numero = Number(valor);
  return valor !== null && Number.isInteger(numero) && numero >= min && numero <= max ? numero : null;
};

/**
 * Desglose de un mes: los pagos que componen el total del dashboard (W13), con
 * la anulación en cada fila (W12). Solo ADMIN.
 *
 * El mes y la página viven en la URL (`?anio=2026&mes=9&pagina=0`): así la
 * tarjeta del dashboard puede abrir un mes en particular, y un F5 no te
 * devuelve al mes en curso.
 */
export const PagosPage = () => {
  const [parametros, setParametros] = useSearchParams();
  const [pagoAAnular, setPagoAAnular] = useState<PagoResponse | null>(null);

  const [anioActual, mesActual] = hoyIso().split('-').map(Number);
  const anio = leerEntero(parametros.get('anio'), 2000, 2100) ?? anioActual;
  const mes = leerEntero(parametros.get('mes'), 1, 12) ?? mesActual;
  const pagina = leerEntero(parametros.get('pagina'), 0, Number.MAX_SAFE_INTEGER) ?? 0;

  const { desde, hasta } = rangoDelMes(anio, mes);
  const { data, isLoading, isError, error, refetch } = usePagos({
    page: pagina,
    desde,
    hasta,
    sort: ORDEN,
  });

  const irA = (nuevoAnio: number, nuevoMes: number, nuevaPagina = 0) =>
    setParametros({
      anio: String(nuevoAnio),
      mes: String(nuevoMes),
      pagina: String(nuevaPagina),
    });

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Pagos"
        descripcion="Los cobros de cada mes, uno por uno. Se cobra desde el listado de socios."
        icono={CreditCard}
      >
        <SelectorDeMes
          anio={anio}
          mes={mes}
          anioActual={anioActual}
          mesActual={mesActual}
          onCambiar={irA}
        />
      </EncabezadoPagina>

      <div className="bg-gym-card border border-gym-border rounded-2xl overflow-hidden shadow-card-dark">
        <ResumenDelMes anio={anio} mes={mes} />

        {isLoading ? (
          <Cargando texto="Trayendo pagos..." />
        ) : isError ? (
          <ErrorDeCarga error={error} onReintentar={() => refetch()} />
        ) : !data || data.contenido.length === 0 ? (
          <SinDatos titulo={`No hay cobros en ${nombreDeMes(mes)} de ${anio}`} />
        ) : (
          <>
            <TablaPagos pagos={data.contenido} onAnular={setPagoAAnular} />
            <Paginador
              pagina={data.pagina}
              totalPaginas={data.totalPaginas}
              totalElementos={data.totalElementos}
              onCambiar={(nueva) => irA(anio, mes, nueva)}
            />
          </>
        )}
      </div>

      {pagoAAnular && (
        <ConfirmarAnulacion pago={pagoAAnular} onCerrar={() => setPagoAAnular(null)} />
      )}
    </div>
  );
};
