import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useSesion } from '../auth/sesion';
import { logout } from '../auth/api';

/**
 * Pantalla para un principal autenticado que no tiene ningún área asignada.
 *
 * Ya NO es el destino de GERENCIA: gerencia entra a la web y opera el mostrador
 * (socios y cobro). El bloqueo anterior venía del diseño viejo, donde el
 * escritorio Swing era el único lugar donde gerencia podía trabajar.
 */
export const AccesoRestringido = () => {
  const { principal, portal, cerrarSesion } = useSesion();
  const navigate = useNavigate();

  const salir = async () => {
    await logout(portal);
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gym-black flex items-center justify-center p-4 text-gym-white">
      <div className="max-w-md w-full bg-gym-card border border-gym-border rounded-3xl p-8 shadow-card-dark text-center space-y-6 animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-gym-dark border border-gym-red-600/40 mx-auto flex items-center justify-center text-gym-red-500 shadow-red-glow">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-wide text-white">
            Tu cuenta no tiene un área asignada
          </h1>
          <p className="text-sm text-gym-muted leading-relaxed">
            Entraste correctamente, pero esta cuenta no corresponde a ninguna de las áreas de la
            web. Pedile a un administrador que revise el rol de tu usuario.
          </p>
          {principal && (
            <p className="text-[11px] font-mono text-gym-subtle">
              {principal.tipo === 'staff' ? `rol ${principal.rol}` : 'socio'} · id {principal.id}
            </p>
          )}
        </div>

        <button
          onClick={salir}
          className="w-full py-3 px-4 bg-gym-red-600 hover:bg-gym-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-red-glow flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Volver al login
        </button>
      </div>
    </div>
  );
};
