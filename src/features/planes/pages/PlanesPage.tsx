import { CalendarDays, Plus, Tags } from 'lucide-react';
import { EncabezadoPagina } from '../../../components/ui/EncabezadoPagina';
import { Cargando, ErrorDeCarga, SinDatos } from '../../../components/estado/Estados';
import { formatearPesos } from '../../../lib/formato';
import { useStaff } from '../../../auth/sesion';
import { usePlanes } from '../hooks';

export const PlanesPage = () => {
  const staff = useStaff();
  const esAdmin = staff?.rol === 'ADMIN';
  const { data: planes, isLoading, isError, error, refetch } = usePlanes();

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Planes"
        descripcion="Tarifas y duración de las cuotas. La duración define el vencimiento del pago."
        icono={Tags}
      >
        {/* El precio y la tarifa son cosa de ADMIN: GERENCIA cobra, no fija precios. */}
        {esAdmin && (
          <button
            disabled
            title="La edición de planes todavía no está implementada en la web"
            className="flex items-center gap-2 px-4 py-2.5 bg-gym-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-red-glow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Nuevo plan
          </button>
        )}
      </EncabezadoPagina>

      {isLoading ? (
        <Cargando texto="Trayendo planes..." />
      ) : isError ? (
        <div className="bg-gym-card border border-gym-border rounded-2xl">
          <ErrorDeCarga error={error} onReintentar={() => refetch()} />
        </div>
      ) : !planes || planes.length === 0 ? (
        <div className="bg-gym-card border border-gym-border rounded-2xl">
          <SinDatos titulo="No hay planes cargados" detalle="Sin planes no se puede registrar un pago." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className="bg-gym-card border border-gym-border hover:border-gym-red-600/50 rounded-3xl p-6 shadow-card-dark transition-colors duration-300 flex flex-col gap-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black uppercase text-white leading-tight">
                  {plan.nombre}
                </h3>
                <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gym-dark border border-gym-border text-gym-muted">
                  <CalendarDays className="w-3.5 h-3.5 text-gym-red-500" />
                  {plan.duracion} {plan.duracion === 1 ? 'día' : 'días'}
                </span>
              </div>

              <div className="pt-4 border-t border-gym-border/60">
                <span className="text-3xl font-black text-white tracking-tight">
                  {formatearPesos(plan.precio)}
                </span>
                <p className="text-xs text-gym-muted mt-1">
                  Es el monto mínimo del cobro: el backend rechaza un pago menor.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
