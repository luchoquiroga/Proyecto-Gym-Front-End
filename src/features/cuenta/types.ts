/** `PUT /usuarios/cambiar-contrasena` (CONTRATO-API §3, "Staff — /usuarios"). */

/**
 * A quién se le cambia sale del TOKEN, no del cuerpo: el campo `nombre` que
 * tenía antes ya no existe, porque dejaba elegir a qué cuenta cambiarle la clave.
 */
export interface CambioContrasenaRequest {
  contrasenaActual: string;
  nuevaContrasena: string;
}
