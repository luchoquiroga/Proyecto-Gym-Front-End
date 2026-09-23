import { z } from 'zod';

/**
 * Espejo de `UsuarioRequest` y `ResetContrasenaRequest` del backend. Comodidad:
 * el que decide es el 400.
 */

const LARGO_MINIMO_CONTRASENA = 8;

const contrasenaNueva = z
  .string()
  .min(1, 'La contraseña es obligatoria')
  .min(LARGO_MINIMO_CONTRASENA, `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`);

export const cuentaSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre de usuario es obligatorio'),
    rol: z.enum(['ADMIN', 'GERENCIA'], { error: 'Elegí un rol' }),
    contrasena: contrasenaNueva,
    repetirContrasena: z.string(),
  })
  .refine((datos) => datos.contrasena === datos.repetirContrasena, {
    path: ['repetirContrasena'],
    message: 'Las contraseñas no coinciden',
  });

export type CuentaFormulario = z.infer<typeof cuentaSchema>;

// El campo se llama como en el DTO (`nuevaContrasena`) para que el 400 de
// validación del backend caiga en él.
export const resetContrasenaSchema = z
  .object({ nuevaContrasena: contrasenaNueva, repetirContrasena: z.string() })
  .refine((datos) => datos.nuevaContrasena === datos.repetirContrasena, {
    path: ['repetirContrasena'],
    message: 'Las contraseñas no coinciden',
  });

export type ResetContrasenaFormulario = z.infer<typeof resetContrasenaSchema>;
