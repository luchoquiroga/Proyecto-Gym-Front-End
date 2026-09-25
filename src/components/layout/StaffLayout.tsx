import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  CreditCard,
  Dumbbell,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Shield,
  Tags,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useSesion } from '../../auth/sesion';
import { useCerrarSesion } from '../../auth/useCerrarSesion';
import { ES_PRODUCCION } from '../../api/config';
import type { RolStaff } from '../../auth/types';
import { CambiarContrasena } from '../../features/cuenta/components/CambiarContrasena';

/**
 * Shell de las dos áreas de staff.
 *
 * La navegación esconde lo que el rol no puede usar, para que GERENCIA no vea
 * ítems que la llevan a un 403. Esconder no es proteger: el que autoriza sigue
 * siendo el backend.
 */
const ITEMS = [
  { nombre: 'Dashboard', ruta: '/staff/dashboard', icono: LayoutDashboard, roles: ['ADMIN'] },
  { nombre: 'Socios', ruta: '/staff/socios', icono: Users, roles: ['ADMIN', 'GERENCIA'] },
  { nombre: 'Planes', ruta: '/staff/planes', icono: Tags, roles: ['ADMIN', 'GERENCIA'] },
  { nombre: 'Pagos', ruta: '/staff/pagos', icono: CreditCard, roles: ['ADMIN'] },
  { nombre: 'Staff', ruta: '/staff/cuentas', icono: UserCog, roles: ['ADMIN'] },
] satisfies ReadonlyArray<{
  nombre: string;
  ruta: string;
  icono: typeof Users;
  roles: RolStaff[];
}>;

export const StaffLayout = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
  const principal = useSesion((s) => s.principal);
  const { salir, saliendo, error: errorAlSalir } = useCerrarSesion();

  const rol: RolStaff = principal?.tipo === 'staff' ? principal.rol : 'GERENCIA';
  const items = ITEMS.filter((item) => item.roles.includes(rol));

  return (
    <div className="min-h-screen bg-gym-black flex flex-col md:flex-row text-gym-white">
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside
        className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 w-72 shrink-0 bg-gym-dark border-r border-gym-border flex flex-col transition-transform duration-300 ease-in-out ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-gym-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gym-card border border-gym-border flex items-center justify-center shadow-red-glow">
              <Dumbbell className="w-6 h-6 text-gym-red-500" />
            </div>
            <div>
              <span className="font-black tracking-wider text-xl uppercase">
                IRON<span className="text-gym-red-500">GYM</span>
              </span>
              <span className="block text-[10px] text-gym-muted font-bold tracking-widest uppercase">
                {rol === 'ADMIN' ? 'Administración' : 'Mostrador'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMenuAbierto(false)}
            className="md:hidden text-gym-muted hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {items.map(({ nombre, ruta, icono: Icono }) => (
            <NavLink
              key={ruta}
              to={ruta}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors duration-200 group ${
                  isActive
                    ? 'bg-gym-red-600 text-white shadow-red-glow font-bold'
                    : 'text-gym-muted hover:bg-gym-hover hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icono
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-white' : 'text-gym-subtle group-hover:text-gym-red-500'
                    }`}
                  />
                  <span>{nombre}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gym-border/60 bg-gym-black/40 space-y-3">
          <div className="flex items-center gap-3 px-2 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gym-card border border-gym-border flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-gym-red-500" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-white truncate">{principal?.nombre}</p>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gym-red-900/40 text-gym-red-400 border border-gym-red-800/50">
                {rol}
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-gym-black/70 border border-gym-border/60 text-[10px] flex items-center justify-between">
            <span className="text-gym-muted font-bold uppercase tracking-wider">API</span>
            <span
              className={`font-mono font-black ${ES_PRODUCCION ? 'text-gym-red-400' : 'text-emerald-400'}`}
            >
              {ES_PRODUCCION ? 'Producción' : 'Local'}
            </span>
          </div>

          <button
            onClick={() => setCambiandoContrasena(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            Cambiar contraseña
          </button>

          {errorAlSalir && (
            <p role="alert" className="px-2 text-[11px] text-gym-red-400 leading-snug">
              {errorAlSalir}
            </p>
          )}

          <button
            onClick={salir}
            disabled={saliendo}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-red-600/20 text-gym-muted hover:text-gym-red-400 border border-gym-border hover:border-gym-red-600/40 transition-colors disabled:opacity-50"
          >
            {saliendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {saliendo ? 'Cerrando…' : errorAlSalir ? 'Reintentar' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:hidden bg-gym-dark border-b border-gym-border flex items-center justify-between px-4">
          <button
            onClick={() => setMenuAbierto(true)}
            className="p-2 rounded-lg bg-gym-card text-gym-muted hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-gym-red-500" />
            <span className="font-extrabold text-sm uppercase tracking-wider">
              IRON<span className="text-gym-red-500">GYM</span>
            </span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {cambiandoContrasena && <CambiarContrasena onCerrar={() => setCambiandoContrasena(false)} />}
    </div>
  );
};
