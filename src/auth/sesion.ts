import { create } from 'zustand';
import type { Principal, TipoPortal } from './types';
import { guardarUltimoPortal, leerUltimoPortal } from './portales';
import { queryClient } from '../api/queryClient';

/**
 * Store de sesión, en memoria RAM.
 *
 * El accessToken NO se persiste en localStorage ni en sessionStorage: la
 * persistencia entre recargas la da la cookie HttpOnly del refresh + el silent
 * refresh del arranque. Acá tampoco se duplican datos que vienen del API: para
 * eso está react-query.
 *
 * Cuando cambia quién está sentado, se vacía el cache de react-query: en la PC
 * del mostrador, lo que leyó una persona no tiene que quedarle a la siguiente.
 */

const esLaMismaPersona = (a: Principal | null, b: Principal) =>
  a !== null && a.tipo === b.tipo && a.id === b.id;

interface EstadoSesion {
  principal: Principal | null;
  accessToken: string | null;
  /** Portal activo, o el último usado mientras se resuelve el arranque. */
  portal: TipoPortal;
  cargandoSesion: boolean;

  iniciarSesion: (portal: TipoPortal, principal: Principal, accessToken: string) => void;
  cerrarSesion: () => void;
  terminarCarga: () => void;
}

export const useSesion = create<EstadoSesion>((set, get) => ({
  principal: null,
  accessToken: null,
  portal: leerUltimoPortal(),
  cargandoSesion: true,

  iniciarSesion: (portal, principal, accessToken) => {
    // El silent refresh también pasa por acá, cada 30 minutos: ahí es la misma
    // persona y el cache se conserva.
    if (!esLaMismaPersona(get().principal, principal)) queryClient.clear();
    guardarUltimoPortal(portal);
    set({ portal, principal, accessToken, cargandoSesion: false });
  },

  cerrarSesion: () => {
    queryClient.clear();
    set({ principal: null, accessToken: null, cargandoSesion: false });
  },

  terminarCarga: () => set({ cargandoSesion: false }),
}));

/** Azúcar de lectura: el principal staff, o null si el que entró es un socio.
 *  Se llama `useStaff` y no `usarStaff` porque es un hook y React exige el prefijo. */
export const useStaff = () => {
  const principal = useSesion((s) => s.principal);
  return principal?.tipo === 'staff' ? principal : null;
};
