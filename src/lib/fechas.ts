import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

/**
 * Aritmética de fechas ISO sin hora (`2026-09-30`), que es como las manda y
 * las recibe el backend.
 *
 * Pasa por `date-fns` y no por `new Date('2026-09-30')` porque este último la
 * interpreta en UTC, y en Argentina (UTC-3) cae en el día anterior: es el
 * off-by-one de `STACK.md` §2.3. `parseISO` la toma como medianoche local.
 */

const FORMATO_ISO = 'yyyy-MM-dd';

/** Hoy en la zona del navegador, en el formato que espera el backend. */
export const hoyIso = (): string => format(new Date(), FORMATO_ISO);

export const sumarDias = (iso: string, dias: number): string =>
  format(addDays(parseISO(iso), dias), FORMATO_ISO);

/** Días de calendario de `desde` a `hasta`. Negativo si `hasta` es anterior. */
export const diasEntre = (desde: string, hasta: string): number =>
  differenceInCalendarDays(parseISO(hasta), parseISO(desde));
