import { TriangleAlert } from 'lucide-react';
import { useSesion } from './sesion';
import type { TipoPortal } from './types';

/**
 * Explica por qué apareció el login cuando la sesión la cerró el servidor, no
 * el usuario. Sin esto, a un empleado dado de baja la web lo tira al login sin
 * decir nada, y al volver a entrar recibe "credenciales incorrectas": cree que
 * se olvidó la contraseña y reintenta hasta que lo frena el rate limit.
 *
 * El backend responde el mismo 401 para una baja, un cambio de contraseña o una
 * sesión cerrada desde otro portal, así que el texto no puede decir cuál fue.
 */
const TEXTOS: Record<TipoPortal, string> = {
  staff:
    'Tu sesión se cerró desde el servidor. Volvé a ingresar; si tu usuario y tu contraseña ya no funcionan, consultá con un administrador: la cuenta puede haberse dado de baja o su contraseña, cambiado.',
  socio: 'Tu sesión se cerró. Volvé a ingresar con tu email y tu contraseña.',
};

export const AvisoSesionCerrada = ({ portal }: { portal: TipoPortal }) => {
  const visible = useSesion((s) => s.cerradaPorElServidor && s.portal === portal);
  if (!visible) return null;

  return (
    <div
      role="status"
      className="mb-6 p-4 rounded-xl bg-amber-950/30 border border-amber-700/50 flex items-start gap-3 animate-fade-in"
    >
      <TriangleAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-200/90 leading-snug">{TEXTOS[portal]}</p>
    </div>
  );
};
