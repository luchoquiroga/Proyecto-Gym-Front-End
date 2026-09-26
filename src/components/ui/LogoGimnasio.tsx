/**
 * El símbolo del gimnasio (la A atravesada por la barra), sin el nombre: el
 * nombre lo escribe cada pantalla con `NOMBRE_GIMNASIO`, así se ve nítido y con
 * la tipografía de la web. Es ancho (casi 3 a 1): se le da el ancho con
 * `className` y el alto sale solo.
 *
 * Decorativo por defecto (`alt` vacío), porque casi siempre tiene el nombre al
 * lado y un lector de pantalla lo diría dos veces.
 */
export const LogoGimnasio = ({ className = '', alt = '' }: { className?: string; alt?: string }) => (
  <img src="/logo-athletics.svg" alt={alt} className={`h-auto select-none ${className}`} draggable={false} />
);
