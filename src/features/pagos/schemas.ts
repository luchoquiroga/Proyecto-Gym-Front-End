import { z } from 'zod';
import { formatearPesos } from '../../lib/formato';
import { diasEntre, sumarDias } from '../../lib/fechas';
import type { Plan } from '../planes/types';

/**
 * Validación del cobro. Igual que en socios, es COMODIDAD: cada regla es el
 * espejo de una que el backend ya aplica (`PagoRequest` + `registrarPago`), y
 * el que decide es él.
 *
 * Se arma con los planes porque la regla que más importa depende del plan
 * elegido: no hay pago parcial, un importe menor al precio se rechaza entero.
 */
export const crearCobroSchema = (planes: Plan[]) =>
  z
    .object({
      // Los <select> e <input type="number"> se registran con `valueAsNumber`,
      // así que vacío llega como NaN y cae en este mensaje.
      planId: z.number({ error: 'Elegí un plan' }),
      montoAbonado: z
        .number({ error: 'El importe es obligatorio' })
        .positive('El importe debe ser mayor a cero'),
      fechaPago: z.iso.date({ error: 'La fecha de pago es obligatoria' }),
    })
    .superRefine(({ planId, montoAbonado }, ctx) => {
      const plan = planes.find((p) => p.id === planId);
      if (plan && montoAbonado < plan.precio) {
        ctx.addIssue({
          code: 'custom',
          path: ['montoAbonado'],
          message: `No se admiten pagos parciales: el plan ${plan.nombre} cuesta ${formatearPesos(plan.precio)}.`,
        });
      }
    });

export type CobroFormulario = z.infer<ReturnType<typeof crearCobroSchema>>;

/**
 * Qué va a pasar con el socio si se registra este cobro, calculado con las
 * mismas reglas del backend. Sirve para AVISAR antes de confirmar, no para
 * decidir nada: el vencimiento real es el que devuelve la respuesta.
 *
 * - El período nuevo arranca en `fechaPago`, NO a continuación del vigente.
 * - El vencimiento del socio es el mayor entre sus pagos válidos.
 * - El pago solo activa al socio si su período termina después de hoy.
 */
export interface PrevisionCobro {
  vencimientoDelPago: string;
  /** Días del período nuevo que se pisan con lo que el socio ya tenía pago. */
  diasSuperpuestos: number;
  /** El pago nuevo vence antes que el vigente: el vencimiento del socio no se mueve. */
  noCambiaElVencimiento: boolean;
  /** Pago retroactivo cuyo período ya terminó: se registra pero no deja al día. */
  yaVencido: boolean;
}

export const preverCobro = (
  fechaPago: string,
  plan: Plan,
  vencimientoActual: string | null,
  hoy: string,
): PrevisionCobro => {
  const vencimientoDelPago = sumarDias(fechaPago, plan.duracion);

  const finDeLaSuperposicion =
    vencimientoActual && vencimientoActual < vencimientoDelPago ? vencimientoActual : vencimientoDelPago;
  const diasSuperpuestos =
    vencimientoActual && vencimientoActual > fechaPago
      ? diasEntre(fechaPago, finDeLaSuperposicion)
      : 0;

  // Las fechas ISO se comparan bien como texto: `2026-10-19` > `2026-09-30`.
  return {
    vencimientoDelPago,
    diasSuperpuestos,
    noCambiaElVencimiento: vencimientoActual !== null && vencimientoActual >= vencimientoDelPago,
    yaVencido: vencimientoDelPago <= hoy,
  };
};
