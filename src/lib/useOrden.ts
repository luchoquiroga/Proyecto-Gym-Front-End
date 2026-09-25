import { useState } from 'react';

export type Direccion = 'asc' | 'desc';

export interface Orden<C extends string> {
  columna: C;
  direccion: Direccion;
}

/**
 * Orden de un listado paginado, que lo ordena el SERVIDOR (`?sort=` de Spring).
 *
 * Por qué no ordena en memoria: la tabla tiene una página de 20 filas, y
 * ordenar esas 20 parecería ordenar todo el padrón. Por qué no usa
 * `@tanstack/react-table`: con todo del lado del servidor, lo único que haría
 * es guardar esta columna y esta dirección (ver `STACK.md` §2.2).
 *
 * `columnas` es la lista cerrada de lo que se puede ordenar, y a qué campos de
 * la ENTIDAD corresponde cada una (no del DTO: `fechaVencimiento` del socio,
 * por ejemplo, se calcula y no se puede ordenar). Es cerrada a propósito: un
 * campo que no existe hace que el backend responda 400.
 *
 * @param desempate se agrega al final para que dos filas iguales no cambien de
 *   lugar entre una página y la otra (sin él, un socio puede aparecer en la
 *   página 1 y en la 2, o en ninguna).
 */
export function useOrden<C extends string>(
  columnas: Record<C, readonly string[]>,
  // NoInfer: las columnas salen del mapa, no del orden inicial (si no, con
  // `{ columna: 'fecha' }` TypeScript creería que 'fecha' es la única).
  inicial: Orden<NoInfer<C>>,
  desempate: readonly string[] = ['id,asc'],
) {
  const [orden, setOrden] = useState<Orden<C>>(inicial);

  const sort = [
    ...columnas[orden.columna].map((campo) => `${campo},${orden.direccion}`),
    ...desempate,
  ];

  /** Misma columna: invierte. Otra columna: arranca ascendente. */
  const alternar = (columna: C) =>
    setOrden((actual) =>
      actual.columna === columna
        ? { columna, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { columna, direccion: 'asc' },
    );

  /** La dirección de esa columna si es la activa, o null. Para pintar el encabezado. */
  const direccionDe = (columna: C): Direccion | null =>
    orden.columna === columna ? orden.direccion : null;

  return { orden, sort, alternar, direccionDe };
}
