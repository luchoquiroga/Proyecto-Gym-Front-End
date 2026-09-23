import { Navigate, useLocation } from 'react-router-dom';
import { useSesion } from './sesion';
import { RUTAS_LOGIN, rutaInicial } from './rutas';
import type { RolStaff, TipoPortal } from './types';

interface RutaProtegidaProps {
  children?: React.ReactNode;
  /** Qué tipo de principal puede entrar. Se pregunta ANTES que el rol. */
  portal: TipoPortal;
  /** Roles de staff admitidos. Sin esto, cualquier staff autenticado entra. */
  roles?: RolStaff[];
}

/**
 * Esconde, no protege.
 *
 * Que una ruta esté acá no autoriza nada: el que autoriza es el backend con un
 * 403. Esto solo evita mostrarle a alguien una pantalla que le va a fallar.
 */
export const RutaProtegida = ({ children, portal, roles }: RutaProtegidaProps) => {
  const { principal, cargandoSesion } = useSesion();
  const location = useLocation();

  if (cargandoSesion) return null;

  if (!principal) {
    // Al login de ESTA área: a un socio con la sesión vencida no se le pide
    // un nombre de usuario de staff.
    return <Navigate to={RUTAS_LOGIN[portal]} state={{ from: location }} replace />;
  }

  // Un socio no entra a staff y viceversa: son principals de tablas distintas.
  if (principal.tipo !== portal) {
    return <Navigate to={rutaInicial(principal)} replace />;
  }

  if (principal.tipo === 'staff' && roles && !roles.includes(principal.rol)) {
    return <Navigate to={rutaInicial(principal)} replace />;
  }

  return <>{children}</>;
};
