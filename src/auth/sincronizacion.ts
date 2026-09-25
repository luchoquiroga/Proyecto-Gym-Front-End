/**
 * Avisa a las otras pestañas del mismo navegador que se cerró la sesión.
 *
 * El access token vive en la memoria de cada pestaña, así que cerrar la sesión
 * en una no alcanza a las demás: seguirían funcionando hasta que venza su token
 * (30 minutos). En la PC compartida del mostrador, eso deja una pestaña abierta
 * con la sesión de la persona anterior.
 *
 * Solo se avisa el logout que pidió el usuario, no el que hace el interceptor
 * cuando falla un refresh: ese puede ser un problema de una sola pestaña.
 */

const CANAL = 'gym.sesion';
const CIERRE = 'cierre-de-sesion';

/** Navegadores sin BroadcastChannel (muy viejos): se pierde la sincronización, nada más. */
const abrirCanal = () => (typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CANAL));

export function avisarCierreDeSesion(): void {
  const canal = abrirCanal();
  canal?.postMessage(CIERRE);
  canal?.close();
}

/** @returns la función para dejar de escuchar. */
export function escucharCierreDeSesion(alCerrar: () => void): () => void {
  const canal = abrirCanal();
  if (!canal) return () => {};

  canal.onmessage = (evento: MessageEvent) => {
    if (evento.data === CIERRE) alCerrar();
  };
  return () => canal.close();
}
