/** Formato de plata y fechas, en un solo lugar para que toda la web se vea igual. */

const PESOS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const formatearPesos = (monto: number): string => PESOS.format(monto);

const UN_DECIMAL = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/**
 * Para ejes de gráficos, donde no entra el número entero: "$35 mil", "$1,2 M".
 * A mano y no con `notation: 'compact'` de Intl, que en es-AR mezcla "K" y "k"
 * y a veces mete un espacio: en un eje se ve desprolijo.
 */
export function formatearPesosCompacto(monto: number): string {
  if (Math.abs(monto) >= 1_000_000) return `$${UN_DECIMAL.format(monto / 1_000_000)} M`;
  if (Math.abs(monto) >= 1_000) return `$${UN_DECIMAL.format(monto / 1_000)} mil`;
  return `$${UN_DECIMAL.format(monto)}`;
}

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

/** "sep", "oct": para etiquetas cortas, como el eje de un gráfico. */
export const mesAbreviado = (mes: number): string => nombreDeMes(mes).slice(0, 3);
