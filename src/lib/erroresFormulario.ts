import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { normalizarError } from './errores';

/**
 * Pasa un error del backend al formulario.
 *
 * Un 400 de validación trae `errores: { campo: mensaje }` con el nombre exacto
 * del campo del DTO, así que se pinta el campo que lo causó en vez de un
 * cartel genérico. Lo que no se pueda mapear (un 409 de documento duplicado, un
 * 403) se devuelve para mostrarlo arriba del formulario, tal cual lo escribió
 * el backend.
 *
 * @returns el mensaje a mostrar arriba, o null si ya quedó pintado en los campos.
 */
export function aplicarErroresDelServidor<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  camposDelFormulario: ReadonlyArray<Path<T>>,
): string | null {
  const { mensaje, errores } = normalizarError(error);

  if (!errores) return mensaje;

  let algunoPintado = false;
  for (const [campo, detalle] of Object.entries(errores)) {
    if ((camposDelFormulario as ReadonlyArray<string>).includes(campo)) {
      setError(campo as Path<T>, { type: 'server', message: detalle });
      algunoPintado = true;
    }
  }

  // Si el 400 vino por un campo que este formulario no tiene, el cartel de
  // arriba es la única forma de que el usuario se entere.
  return algunoPintado ? null : mensaje;
}
