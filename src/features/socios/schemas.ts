import { z } from 'zod';

/**
 * Validación del formulario de socio.
 *
 * Esto es COMODIDAD, no seguridad: la fuente de verdad es el backend y se
 * asume que puede rechazar algo que el front dio por bueno. Cada regla de acá
 * es un espejo de una que el backend ya aplica (`ClienteRequest` +
 * `normalizarDocumento`), para avisar antes de gastar un viaje al servidor.
 */

/** El backend guarda el documento sin puntos, guiones ni espacios, en mayúsculas. */
export const normalizarDocumento = (documento: string) =>
  documento.replace(/[.\-\s]/g, '').toUpperCase();

const LARGO_MINIMO_DOCUMENTO = 6;
/** Los largos de las columnas: más largo, el backend responde 400 con el campo. */
const LARGO_MAXIMO_NOMBRE = 100;
const LARGO_MAXIMO_TELEFONO = 50;
const LARGO_MAXIMO_DOCUMENTO = 20;

export const socioSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(LARGO_MAXIMO_NOMBRE, `El nombre no puede superar los ${LARGO_MAXIMO_NOMBRE} caracteres`),
  apellido: z
    .string()
    .min(1, 'El apellido es obligatorio')
    .max(LARGO_MAXIMO_NOMBRE, `El apellido no puede superar los ${LARGO_MAXIMO_NOMBRE} caracteres`),
  telefono: z
    .string()
    .max(LARGO_MAXIMO_TELEFONO, `El teléfono no puede superar los ${LARGO_MAXIMO_TELEFONO} caracteres`),
  documento: z
    .string()
    .min(1, 'El documento es obligatorio')
    .max(LARGO_MAXIMO_DOCUMENTO, `El documento no puede superar los ${LARGO_MAXIMO_DOCUMENTO} caracteres`)
    .regex(
      /^[A-Za-z0-9.\- ]+$/,
      'El documento solo puede tener letras, números, puntos, espacios y guiones',
    )
    .refine(
      (documento) => normalizarDocumento(documento).length >= LARGO_MINIMO_DOCUMENTO,
      `El documento necesita al menos ${LARGO_MINIMO_DOCUMENTO} caracteres sin contar puntos ni guiones`,
    ),
});

export type SocioFormulario = z.infer<typeof socioSchema>;

export const FORMULARIO_VACIO: SocioFormulario = {
  nombre: '',
  apellido: '',
  telefono: '',
  documento: '',
};
