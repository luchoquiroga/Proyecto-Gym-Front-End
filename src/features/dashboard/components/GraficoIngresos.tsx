import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatearPesos, formatearPesosCompacto, mesAbreviado, nombreDeMes } from '../../../lib/formato';
import type { GananciasMensuales } from '../types';

/**
 * Colores del gráfico. El azul es el de una sola serie de la paleta de
 * referencia de dataviz, validado con su script contra la superficie de las
 * tarjetas (`#16161b`): contraste 4.95:1, dentro de la banda de luminosidad. El
 * rojo de la marca NO se usa para datos: en esta UI el rojo significa error.
 * Los grises son los de `tailwind.config.js` (gym-border, gym-border-light,
 * gym-muted).
 */
const COLOR = {
  serie: '#3987e5',
  serieResaltada: '#5598e7',
  grilla: '#27272a',
  base: '#3f3f46',
  textoSecundario: '#a1a1aa',
  textoPrincipal: '#f4f4f5',
};

const ANCHO = 720;
const ALTO = 260;
const MARGEN = { arriba: 28, derecha: 12, abajo: 44, izquierda: 64 };
const ANCHO_PLOT = ANCHO - MARGEN.izquierda - MARGEN.derecha;
const ALTO_PLOT = ALTO - MARGEN.arriba - MARGEN.abajo;
const BASE_Y = MARGEN.arriba + ALTO_PLOT;
/** Barras finas: nunca llenan el lugar, el resto es aire. */
const ANCHO_BARRA_MAX = 24;
const RADIO = 4;
/**
 * Un mes con $1.000 al lado de uno con $1,5 M mide un tercio de píxel y se ve
 * igual que un mes en cero. Todo valor mayor a cero se dibuja con al menos esto,
 * para que "poco" no parezca "nada"; el valor exacto está en el tooltip y en la tabla.
 */
const ALTO_MINIMO_VISIBLE = 2;
const DIVISIONES = 4;

/** El tope del eje, redondeado a un número limpio (1, 2, 2,5 o 5 por potencia de 10). */
function topeDelEje(maximo: number): number {
  if (maximo <= 0) return 1;
  const paso = maximo / DIVISIONES;
  const magnitud = 10 ** Math.floor(Math.log10(paso));
  const n = paso / magnitud;
  const limpio = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return limpio * magnitud * DIVISIONES;
}

/** Columna con el extremo de datos redondeado y la base recta, apoyada en la línea de base. */
function trazoColumna(x: number, y: number, ancho: number, alto: number): string {
  const r = Math.min(RADIO, alto, ancho / 2);
  return [
    `M${x},${y + alto}`,
    `V${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    `H${x + ancho - r}`,
    `A${r},${r} 0 0 1 ${x + ancho},${y + r}`,
    `V${y + alto}`,
    'Z',
  ].join(' ');
}

interface GraficoIngresosProps {
  /** Del más viejo al más nuevo. El último es el mes en curso. */
  meses: GananciasMensuales[];
}

/**
 * Ingresos por mes, en columnas. Una sola serie: no lleva leyenda, el título de
 * la tarjeta dice qué es. El mes en curso va rayado y con "en curso", porque
 * todavía está sumando: sin eso parecería que la facturación se cayó.
 *
 * Cada mes es un blanco de hover y de foco más grande que la barra (toda su
 * franja), con tooltip, y al hacer clic abre su desglose en Pagos (W13).
 */
export const GraficoIngresos = ({ meses }: GraficoIngresosProps) => {
  const [activo, setActivo] = useState<number | null>(null);
  const navigate = useNavigate();
  // useId trae caracteres que no sirven dentro de `url(#...)`.
  const idRayado = `rayado-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const tope = topeDelEje(Math.max(...meses.map((m) => m.totalGanancias)));
  const escalaY = (valor: number) => (valor / tope) * ALTO_PLOT;
  const franja = ANCHO_PLOT / meses.length;
  const anchoBarra = Math.min(ANCHO_BARRA_MAX, franja * 0.6);
  const indiceEnCurso = meses.length - 1;
  const indiceMaximo = meses.reduce(
    (mejor, m, i) => (m.totalGanancias > meses[mejor].totalGanancias ? i : mejor),
    0,
  );

  const abrirDesglose = ({ anio, mes }: GananciasMensuales) =>
    navigate(`/staff/pagos?anio=${anio}&mes=${mes}`);

  const mesActivo = activo === null ? null : meses[activo];
  const xCentro = (i: number) => MARGEN.izquierda + franja * i + franja / 2;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full h-auto select-none"
        role="group"
        aria-label="Ingresos de los últimos 12 meses. Cada mes se puede enfocar para ver el valor."
      >
        <defs>
          {/* Rayado a 45°: marca un estado (mes incompleto), no decora. */}
          <pattern id={idRayado} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={COLOR.serie} opacity="0.3" />
            <rect width="2.5" height="6" fill={COLOR.serie} />
          </pattern>
        </defs>

        {/* Grilla y eje Y: recesivos, hairline, sólidos. */}
        {Array.from({ length: DIVISIONES + 1 }, (_, i) => {
          const valor = (tope / DIVISIONES) * i;
          const y = BASE_Y - escalaY(valor);
          return (
            <g key={i}>
              {i > 0 && (
                <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y} y2={y} stroke={COLOR.grilla} strokeWidth="1" />
              )}
              <text x={MARGEN.izquierda - 10} y={y} dy="0.35em" textAnchor="end" fontSize="12" fill={COLOR.textoSecundario} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatearPesosCompacto(valor)}
              </text>
            </g>
          );
        })}

        {meses.map((m, i) => {
          const alto = m.totalGanancias > 0 ? Math.max(ALTO_MINIMO_VISIBLE, escalaY(m.totalGanancias)) : 0;
          const x = xCentro(i) - anchoBarra / 2;
          const enCurso = i === indiceEnCurso;
          return (
            <g key={`${m.anio}-${m.mes}`}>
              {alto > 0 && (
                <path
                  d={trazoColumna(x, BASE_Y - alto, anchoBarra, alto)}
                  fill={enCurso ? `url(#${idRayado})` : activo === i ? COLOR.serieResaltada : COLOR.serie}
                />
              )}
              <text x={xCentro(i)} y={BASE_Y + 18} textAnchor="middle" fontSize="12" fill={COLOR.textoSecundario}>
                {mesAbreviado(m.mes)}
              </text>
              {(enCurso || i === 0 || m.mes === 1) && (
                <text x={xCentro(i)} y={BASE_Y + 34} textAnchor="middle" fontSize="11" fill={COLOR.textoSecundario} opacity="0.8">
                  {enCurso ? 'en curso' : m.anio}
                </text>
              )}
            </g>
          );
        })}

        {/* Una sola etiqueta directa, en el extremo: el resto lo dicen el eje y el tooltip. */}
        {meses[indiceMaximo].totalGanancias > 0 && (
          <text
            x={xCentro(indiceMaximo)}
            y={BASE_Y - escalaY(meses[indiceMaximo].totalGanancias) - 8}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill={COLOR.textoPrincipal}
          >
            {formatearPesosCompacto(meses[indiceMaximo].totalGanancias)}
          </text>
        )}

        <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={BASE_Y} y2={BASE_Y} stroke={COLOR.base} strokeWidth="1" />

        {/* Los blancos de hover y foco: toda la franja del mes, no solo la barra. */}
        {meses.map((m, i) => (
          <rect
            key={`blanco-${m.anio}-${m.mes}`}
            x={MARGEN.izquierda + franja * i}
            y={MARGEN.arriba}
            width={franja}
            height={ALTO_PLOT}
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={`${nombreDeMes(m.mes)} de ${m.anio}${i === indiceEnCurso ? ' (en curso)' : ''}: ${formatearPesos(m.totalGanancias)} en ${m.cantidadPagos} cobros. Abrir el desglose.`}
            className="cursor-pointer outline-none focus-visible:stroke-gym-red-500"
            strokeWidth="2"
            onPointerEnter={() => setActivo(i)}
            onPointerLeave={() => setActivo(null)}
            onFocus={() => setActivo(i)}
            onBlur={() => setActivo(null)}
            onClick={() => abrirDesglose(m)}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                abrirDesglose(m);
              }
            }}
          />
        ))}
      </svg>

      {mesActivo && activo !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 px-3 py-2 rounded-lg bg-gym-black/95 border border-gym-border-light shadow-card-dark whitespace-nowrap"
          style={{
            left: `${(xCentro(activo) / ANCHO) * 100}%`,
            top: `${((BASE_Y - escalaY(mesActivo.totalGanancias)) / ALTO) * 100}%`,
            // En los bordes se corre hacia adentro para no salirse de la tarjeta.
            transform: `translate(${activo < 2 ? '-15%' : activo > meses.length - 3 ? '-85%' : '-50%'}, calc(-100% - 10px))`,
          }}
        >
          {/* El valor manda; el mes y los cobros acompañan. */}
          <p className="text-sm font-black text-white">{formatearPesos(mesActivo.totalGanancias)}</p>
          <p className="text-[11px] text-gym-muted">
            {nombreDeMes(mesActivo.mes)} de {mesActivo.anio} · {mesActivo.cantidadPagos}{' '}
            {mesActivo.cantidadPagos === 1 ? 'cobro' : 'cobros'}
          </p>
          {activo === indiceEnCurso && <p className="text-[11px] text-gym-muted">Mes en curso: todavía suma.</p>}
        </div>
      )}
    </div>
  );
};
