import { Link } from 'react-router-dom';
import { ArrowUpRight, CreditCard, DollarSign, LayoutDashboard, UserCheck, Users } from 'lucide-react';
import { EncabezadoPagina } from '../../../components/ui/EncabezadoPagina';
import { Cargando, ErrorDeCarga, SinDatos } from '../../../components/estado/Estados';
import { formatearFecha, formatearPesos, nombreDeMes } from '../../../lib/formato';
import { useSesion } from '../../../auth/sesion';
import { useSocios } from '../../socios/hooks';
import { EstadoSocioBadge } from '../../socios/components/EstadoSocioBadge';
import { TarjetaKpi } from '../components/TarjetaKpi';
import { IngresosUltimosMeses } from '../components/IngresosUltimosMeses';
import { useGananciasMensuales, useSociosPorEstado } from '../hooks';

export const DashboardPage = () => {
  const principal = useSesion((s) => s.principal);
  const ganancias = useGananciasMensuales();

  // Una sola consulta da las dos cosas: el total de socios (totalElementos) y
  // las primeras filas. Contar en el navegador trayendo la lista entera dejó de
  // ser posible cuando el listado pasó a estar paginado.
  const socios = useSocios(0, 5);
  const porEstado = useSociosPorEstado();

  const mesEnCurso = ganancias.data
    ? `${nombreDeMes(ganancias.data.mes)} de ${ganancias.data.anio}`
    : undefined;

  return (
    <div className="space-y-8">
      <EncabezadoPagina
        titulo={`Hola, ${principal?.nombre ?? ''}`}
        descripcion="Resumen del mes en curso y estado del padrón."
        icono={LayoutDashboard}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <TarjetaKpi
          titulo="Ingresos del mes"
          icono={DollarSign}
          cargando={ganancias.isLoading}
          error={ganancias.isError ? ganancias.error : undefined}
          valor={ganancias.data ? formatearPesos(ganancias.data.totalGanancias) : null}
          detalle={mesEnCurso}
          // El mes lo toma de la respuesta, no del reloj del navegador: el
          // desglose abre exactamente el mes que el backend sumó.
          enlace={
            ganancias.data
              ? {
                  a: `/staff/pagos?anio=${ganancias.data.anio}&mes=${ganancias.data.mes}`,
                  texto: 'Ver los pagos',
                }
              : undefined
          }
        />
        <TarjetaKpi
          titulo="Cobros del mes"
          icono={CreditCard}
          cargando={ganancias.isLoading}
          error={ganancias.isError ? ganancias.error : undefined}
          valor={ganancias.data?.cantidadPagos ?? null}
          detalle="Pagos registrados en el período"
        />
        <TarjetaKpi
          titulo="Socios registrados"
          icono={Users}
          cargando={socios.isLoading}
          error={socios.isError ? socios.error : undefined}
          valor={socios.data?.totalElementos ?? null}
          detalle="Total del padrón, activos e inactivos"
        />
        {/* Sale de GET /dashboard/socios: contar los activos de una página en el
            navegador daría un número equivocado (ticket W9). */}
        <TarjetaKpi
          titulo="Socios activos"
          icono={UserCheck}
          cargando={porEstado.isLoading}
          error={porEstado.isError ? porEstado.error : undefined}
          valor={porEstado.data?.activos ?? null}
          detalle={
            porEstado.data
              ? `${porEstado.data.morosos} morosos · ${porEstado.data.inactivos} inactivos`
              : undefined
          }
        />
      </div>

      <IngresosUltimosMeses />

      <div className="bg-gym-card border border-gym-border/80 rounded-2xl shadow-card-dark overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-6 pb-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">Socios</h2>
            <p className="text-xs text-gym-muted">Primeras filas del padrón</p>
          </div>
          <Link
            to="/staff/socios"
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gym-red-500 hover:text-gym-red-400 transition-colors"
          >
            Ver todos
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {socios.isLoading ? (
          <Cargando />
        ) : socios.isError ? (
          <ErrorDeCarga error={socios.error} onReintentar={() => socios.refetch()} />
        ) : !socios.data || socios.data.contenido.length === 0 ? (
          <SinDatos titulo="Todavía no hay socios cargados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y border-gym-border text-xs uppercase tracking-wider text-gym-muted bg-gym-dark/50">
                  <th className="py-3 px-6 font-semibold">Socio</th>
                  <th className="py-3 px-6 font-semibold">Documento</th>
                  <th className="py-3 px-6 font-semibold">Estado</th>
                  <th className="py-3 px-6 font-semibold">Vence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border/50">
                {socios.data.contenido.map((socio) => (
                  <tr key={socio.id} className="hover:bg-gym-dark/40 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white whitespace-nowrap">
                      {socio.nombre} {socio.apellido}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs text-gym-muted">
                      {socio.documento}
                    </td>
                    <td className="py-3.5 px-6">
                      <EstadoSocioBadge estado={socio.estado} />
                    </td>
                    <td className="py-3.5 px-6 text-gym-muted whitespace-nowrap">
                      {formatearFecha(socio.fechaVencimiento)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
