import { z } from 'zod';

/**
 * Validación del login y del registro del socio. Como en el resto de la web, es
 * COMODIDAD: cada regla es espejo de `ClienteLoginRequest` y
 * `ClienteRegistroRequest` del backend, que es el que decide.
 */

const email = z
  .string()
  .trim()
  .min(1, 'El email es obligatorio')
  .pipe(z.email('El email no tiene un formato válido'));

// El backend solo exige que no esté vacía. No se inventa acá una regla más
// estricta que el servidor no aplica (ver BITACORA, "abierto").
const contrasena = z.string().min(1, 'La contraseña es obligatoria');

export const loginSocioSchema = z.object({ email, contrasena });

export type LoginSocioFormulario = z.infer<typeof loginSocioSchema>;

/**
 * El código se dicta en persona o por teléfono. El backend lo busca exacto y lo
 * genera en mayúsculas, así que se normaliza: sin espacios ni guiones (por si se
 * anotó en grupos) y en mayúsculas.
 */
export const normalizarCodigoActivacion = (codigo: string) =>
  codigo.replace(/[\s-]/g, '').toUpperCase();

export const registroSocioSchema = z
  .object({
    codigoActivacion: z
      .string()
      .refine((codigo) => normalizarCodigoActivacion(codigo).length > 0, {
        message: 'El código de activación es obligatorio',
      }),
    email,
    contrasena,
    // Solo existe en el front: el backend no la recibe. Evita que el socio se
    // cree una cuenta con una contraseña que tipeó mal y no conoce.
    repetirContrasena: z.string(),
  })
  .refine((datos) => datos.contrasena === datos.repetirContrasena, {
    path: ['repetirContrasena'],
    message: 'Las contraseñas no coinciden',
  });

export type RegistroSocioFormulario = z.infer<typeof registroSocioSchema>;
