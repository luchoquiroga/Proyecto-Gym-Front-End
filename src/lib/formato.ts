/** Formato de plata y fechas, en un solo lugar para que toda la web se vea igual. */

const PESOS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const formatearPesos = (monto: number): string => PESOS.format(monto);

/**
 * El backend manda fechas ISO sin hora (`2026-09-30`).
 * `new Date('2026-09-30')` se interpreta en UTC y en Argentina (UTC-3) muestra
 * el día anterior, así que la partimos a mano en vez de dejársela a `Date`.
 */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  if (!anio || !mes || !dia) return iso;
  return `${dia}/${mes}/${anio}`;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const nombreDeMes = (mes: number): string => MESES[mes - 1] ?? String(mes);
