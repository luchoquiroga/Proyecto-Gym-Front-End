import { useNavigate } from 'react-router-dom';
import { CalendarClock, Dumbbell, IdCard, LogOut, Tags } from 'lucide-react';
import { Cargando, ErrorDeCarga } from '../../../components/estado/Estados';
import { formatearFecha } from '../../../lib/formato';
import { useSesion } from '../../../auth/sesion';
import { logout } from '../../../auth/api';
import { useSocio } from '../../socios/hooks';
import { EstadoSocioBadge } from '../../socios/components/EstadoSocioBadge';

/**
 * Portal del socio: su propia ficha, leída de `GET /clientes/{id}`.
 *
 * No muestra comprobantes de pago y no es un olvido: desde la Fase 7 toda
 * lectura de `/pagos` es de ADMIN, así que un socio recibe 403. Si alguna vez
 * tiene que verlos, primero se reabre esa rama en el backend.
 */
export const PortalSocioPage = () => {
  const principal = useSesion((s) => s.principal);
  const cerrarSesion = useSesion((s) => s.cerrarSesion);
  const navigate = useNavigate();

  const idSocio = principal?.tipo === 'socio' ? principal.id : null;
  const { data: socio, isLoading, isError, error, refetch } = useSocio(idSocio);

  const salir = async () => {
    await logout('socio');
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gym-black text-gym-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gym-card border border-gym-border rounded-2xl shadow-card-dark">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gym-dark border border-gym-border flex items-center justify-center text-gym-red-500 shadow-red-glow">
              <Dumbbell className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gym-muted">
                Portal del socio
              </span>
              <h1 className="text-2xl font-black uppercase text-white">
                {socio ? `${socio.nombre} ${socio.apellido}` : (principal?.nombre ?? '')}
              </h1>
            </div>
          </div>

          <button
            onClick={salir}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-red-600/20 text-gym-muted hover:text-gym-red-400 border border-gym-border hover:border-gym-red-600/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </header>

        <section className="bg-gym-card border border-gym-border rounded-3xl shadow-card-dark">
          {isLoading ? (
            <Cargando texto="Trayendo tu ficha..." />
          ) : isError ? (
            <ErrorDeCarga error={error} onReintentar={() => refetch()} />
          ) : socio ? (
            <div className="p-8 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs font-bold tracking-widest uppercase text-gym-red-500">
                  Estado de tu membresía
                </span>
                <EstadoSocioBadge estado={socio.estado} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gym-border/60">
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gym-muted">
                    <Tags className="w-3.5 h-3.5" />
                    Plan vigente
                  </span>
                  <p className="text-base font-extrabold text-white">
                    {socio.planVigente?.nombre ?? 'Sin plan vigente'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gym-muted">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Vence
                  </span>
                  <p className="text-base font-extrabold text-white">
                    {socio.fechaVencimiento ? formatearFecha(socio.fechaVencimiento) : 'Sin pagos registrados'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gym-muted">
                    <IdCard className="w-3.5 h-3.5" />
                    Documento
                  </span>
                  <p className="text-base font-extrabold text-white font-mono">{socio.documento}</p>
                </div>
              </div>

              <p className="text-xs text-gym-muted leading-relaxed pt-6 border-t border-gym-border/60">
                Para renovar tu cuota acercate al mostrador. Si algún dato no coincide, el staff lo
                corrige desde el sistema.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};
