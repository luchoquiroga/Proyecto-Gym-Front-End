import { useEffect, useState } from 'react';

/**
 * Retrasa un valor para no pegarle al API en cada tecla.
 * Se usa en el buscador de socios, que consulta al servidor (no filtra en memoria).
 */
export function useDebounce<T>(valor: T, milisegundos = 350): T {
  const [retrasado, setRetrasado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setRetrasado(valor), milisegundos);
    return () => clearTimeout(id);
  }, [valor, milisegundos]);

  return retrasado;
}
