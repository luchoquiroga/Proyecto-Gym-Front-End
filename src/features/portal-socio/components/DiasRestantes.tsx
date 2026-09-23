import { diasEntre, hoyIso } from '../../../lib/fechas';
import type { Socio } from '../../socios/types';

/**
 * Cuántos días le quedan al socio hasta el vencimiento, que es la pregunta que
 * trae al portal. Se resta con `date-fns` (en `lib/fechas`) y no con `Date`, por
 * el off-by-one de las fechas ISO en UTC-3 (`STACK.md` §2.3).
 *
 * El vencimiento lo calcula el backend; acá solo se cuenta hasta él.
 */
export const DiasRestantes = ({ socio }: { socio: Socio }) => {
  // Dado de baja: una cuenta regresiva contradiría el estado, aunque le queden
  // días del último pago.
  if (socio.estado === 'INACTIVO') {
    return (
      <Recuadro tono="neutro" titulo="Membresía dada de baja">
        Si querés volver, acercate al mostrador y se reactiva con el pago.
      </Recuadro>
    );
  }

  if (!socio.fechaVencimiento) {
    return (
      <Recuadro tono="neutro" titulo="Todavía no hay pagos registrados">
        Tu membresía empieza a correr con el primer pago en el mostrador.
      </Recuadro>
    );
  }

  const dias = diasEntre(hoyIso(), socio.fechaVencimiento);

  if (dias < 0) {
    const atraso = -dias;
    return (
      <Recuadro tono="alerta" titulo={`Venció hace ${atraso} ${atraso === 1 ? 'día' : 'días'}`}>
        Renová tu cuota en el mostrador para seguir entrenando.
      </Recuadro>
    );
  }

  if (dias === 0) {
    return (
      <Recuadro tono="alerta" titulo="Vence hoy">
        Renová tu cuota en el mostrador para no cortar.
      </Recuadro>
    );
  }

  return (
    <Recuadro
      tono={dias <= 5 ? 'alerta' : 'ok'}
      titulo={`Te ${dias === 1 ? 'queda 1 día' : `quedan ${dias} días`}`}
    >
      {dias <= 5 ? 'Se acerca el vencimiento: podés renovar en el mostrador.' : 'Estás al día.'}
    </Recuadro>
  );
};

const TONOS = {
  ok: 'bg-emerald-950/30 border-emerald-700/50 text-emerald-300',
  alerta: 'bg-amber-950/30 border-amber-700/50 text-amber-300',
  neutro: 'bg-gym-dark border-gym-border text-white',
} as const;

const Recuadro = ({
  tono,
  titulo,
  children,
}: {
  tono: keyof typeof TONOS;
  titulo: string;
  children: React.ReactNode;
}) => (
  <div className={`p-5 rounded-2xl border ${TONOS[tono]}`}>
    <p className="text-2xl font-black uppercase tracking-wide">{titulo}</p>
    <p className="text-sm text-gym-muted mt-1">{children}</p>
  </div>
);
