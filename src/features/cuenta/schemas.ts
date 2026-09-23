import { z } from 'zod';

/**
 * Espejo de `CambioContrasenaRequest` y de las dos reglas de
 * `cambiarContrasenaPropia` del backend. Comodidad: el que decide es el 400.
 */

const LARGO_MINIMO_CONTRASENA = 8;

export const cambioContrasenaSchema = z
  .object({
    contrasenaActual: z.string().min(1, 'La contraseña actual es obligatoria'),
    nuevaContrasena: z
      .string()
      .min(1, 'La nueva contraseña es obligatoria')
      .min(
        LARGO_MINIMO_CONTRASENA,
        `La nueva contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`,
      ),
    // Solo del front: evita quedarse con una contraseña mal tipeada que nadie conoce.
    repetirContrasena: z.string(),
  })
  .refine((datos) => datos.nuevaContrasena === datos.repetirContrasena, {
    path: ['repetirContrasena'],
    message: 'Las contraseñas no coinciden',
  })
  .refine((datos) => datos.nuevaContrasena !== datos.contrasenaActual, {
    path: ['nuevaContrasena'],
    message: 'La nueva contraseña tiene que ser distinta de la actual',
  });

export type CambioContrasenaFormulario = z.infer<typeof cambioContrasenaSchema>;
