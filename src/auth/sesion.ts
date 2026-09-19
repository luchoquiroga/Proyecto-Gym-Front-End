import { create } from 'zustand';
import type { Principal, TipoPortal } from './types';
import { guardarUltimoPortal, leerUltimoPortal } from './portales';

/**
 * Store de sesión, en memoria RAM.
 *
 * El accessToken NO se persiste en localStorage ni en sessionStorage: la
 * persistencia entre recargas la da la cookie HttpOnly del refresh + el silent
 * refresh del arranque. Acá tampoco se duplican datos que vienen del API: para
 * eso está react-query.
 */
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

export const useSesion = create<EstadoSesion>((set) => ({
  principal: null,
  accessToken: null,
  portal: leerUltimoPortal(),
  cargandoSesion: true,

  iniciarSesion: (portal, principal, accessToken) => {
    guardarUltimoPortal(portal);
    set({ portal, principal, accessToken, cargandoSesion: false });
  },

  cerrarSesion: () => set({ principal: null, accessToken: null, cargandoSesion: false }),

  terminarCarga: () => set({ cargandoSesion: false }),
}));

/** Azúcar de lectura: el principal staff, o null si el que entró es un socio.
 *  Se llama `useStaff` y no `usarStaff` porque es un hook y React exige el prefijo. */
export const useStaff = () => {
  const principal = useSesion((s) => s.principal);
  return principal?.tipo === 'staff' ? principal : null;
};
