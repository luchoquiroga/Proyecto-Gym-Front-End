import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutDeTodo } from './api';
import { RUTAS_LOGIN } from './rutas';
import { useSesion } from './sesion';
import { avisarCierreDeSesion } from './sincronizacion';
import { mensajeDeError } from '../lib/errores';

/**
 * El botón "Cerrar sesión" de toda la web.
 *
 * Solo manda al login cuando el servidor confirmó que la sesión se cerró. Si
 * falla (red, arranque en frío de Render), lo dice y deja reintentar: mostrar
 * el login igual haría creer que se salió, con la cookie todavía viva, y el
 * siguiente en esa PC entraría como esta persona con solo apretar F5.
 */
export function useCerrarSesion() {
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const salir = async () => {
    const { portal, cerrarSesion } = useSesion.getState();
    setSaliendo(true);
    setError(null);
    try {
      await logoutDeTodo();
    } catch (causa) {
      setError(`No se pudo cerrar la sesión: ${mensajeDeError(causa)}`);
      setSaliendo(false);
      return;
    }
    cerrarSesion();
    avisarCierreDeSesion();
    navigate(RUTAS_LOGIN[portal], { replace: true });
  };

  return { salir, saliendo, error };
}
