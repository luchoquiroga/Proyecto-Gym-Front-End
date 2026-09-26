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

/**
 * Quién cerró la sesión. `usuario` es el botón (de esta pestaña o de otra);
 * `servidor` es el interceptor cuando el backend rechaza el refresh: la cuenta
 * se dio de baja, se le cambió la contraseña, o se entró al otro portal en este
 * navegador. El backend responde el mismo 401 en todos los casos, así que el
 * front no sabe cuál fue: solo que no fue el usuario.
 */
export type MotivoDeCierre = 'usuario' | 'servidor';

interface EstadoSesion {
  principal: Principal | null;
  accessToken: string | null;
  /** Portal activo, o el último usado mientras se resuelve el arranque. */
  portal: TipoPortal;
  cargandoSesion: boolean;
  /** Para que el login explique por qué apareció. Se borra al volver a entrar. */
  cerradaPorElServidor: boolean;

  iniciarSesion: (portal: TipoPortal, principal: Principal, accessToken: string) => void;
  cerrarSesion: (motivo?: MotivoDeCierre) => void;
  terminarCarga: () => void;
}

export const useSesion = create<EstadoSesion>((set, get) => ({
  principal: null,
  accessToken: null,
  portal: leerUltimoPortal(),
  cargandoSesion: true,
  cerradaPorElServidor: false,

  iniciarSesion: (portal, principal, accessToken) => {
    // El silent refresh también pasa por acá, cada 30 minutos: ahí es la misma
    // persona y el cache se conserva.
    if (!esLaMismaPersona(get().principal, principal)) queryClient.clear();
    guardarUltimoPortal(portal);
    set({ portal, principal, accessToken, cargandoSesion: false, cerradaPorElServidor: false });
  },

  cerrarSesion: (motivo = 'usuario') => {
    queryClient.clear();
    set({
      principal: null,
      accessToken: null,
      cargandoSesion: false,
      cerradaPorElServidor: motivo === 'servidor',
    });
  },

  terminarCarga: () => set({ cargandoSesion: false }),
}));

/** Azúcar de lectura: el principal staff, o null si el que entró es un socio.
 *  Se llama `useStaff` y no `usarStaff` porque es un hook y React exige el prefijo. */
export const useStaff = () => {
  const principal = useSesion((s) => s.principal);
  return principal?.tipo === 'staff' ? principal : null;
};
