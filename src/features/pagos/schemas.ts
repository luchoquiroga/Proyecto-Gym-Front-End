import { z } from 'zod';
import { formatearPesos } from '../../lib/formato';
import { sumarDias } from '../../lib/fechas';
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

const LARGO_MAXIMO_MOTIVO = 300;

/**
 * Espejo de `AnulacionPagoRequest`. El motivo es obligatorio porque es lo que
 * hace que conservar el pago anulado sirva como auditoría.
 */
export const anulacionSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, 'El motivo de la anulación es obligatorio')
    .max(LARGO_MAXIMO_MOTIVO, `El motivo no puede superar los ${LARGO_MAXIMO_MOTIVO} caracteres`),
});

export type AnulacionFormulario = z.infer<typeof anulacionSchema>;

/**
 * Qué va a pasar con el socio si se registra este cobro, con la misma regla que
 * el backend (Fase 9, B2). Sirve para AVISAR antes de confirmar, no para
 * decidir nada: el vencimiento real es el que devuelve la respuesta.
 *
 * La regla: el período nuevo arranca en el vencimiento vigente si el socio
 * todavía tiene días pagos, o en `fechaPago` si no. Se encadena sea cual sea el
 * plan, así que cobrar por adelantado ya no hace perder días.
 *
 * - `desdeElPago`: no tenía días pagos; corre desde la fecha del cobro.
 * - `encadenado`: tenía días pagos; el período nuevo arranca cuando terminan.
 * - `retroactivo`: la fecha es pasada, y el backend encadena con lo que el
 *   socio tenía pago EN ESA FECHA. Eso sale de sus pagos, que GERENCIA no puede
 *   leer, así que el front no lo adivina: lo dice el comprobante.
 */
export type PrevisionCobro =
  | { tipo: 'desdeElPago'; vence: string }
  | { tipo: 'encadenado'; desde: string; vence: string }
  | { tipo: 'retroactivo' };

export const preverCobro = (
  fechaPago: string,
  plan: Plan,
  vencimientoActual: string | null,
  hoy: string,
): PrevisionCobro => {
  // Las fechas ISO se comparan bien como texto: `2026-10-19` > `2026-09-30`.
  if (fechaPago < hoy) return { tipo: 'retroactivo' };

  // Con fecha de hoy (o futura), lo vigente a esa fecha es el vencimiento del
  // socio, que el backend ya calcula como el mayor entre sus pagos válidos.
  if (vencimientoActual && vencimientoActual > fechaPago) {
    return {
      tipo: 'encadenado',
      desde: vencimientoActual,
      vence: sumarDias(vencimientoActual, plan.duracion),
    };
  }

  return { tipo: 'desdeElPago', vence: sumarDias(fechaPago, plan.duracion) };
};
