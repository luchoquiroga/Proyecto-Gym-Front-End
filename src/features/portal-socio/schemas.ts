import { z } from 'zod';

/**
 * Validación del login y del registro del socio. Como en el resto de la web, es
 * COMODIDAD: cada regla es espejo de `ClienteLoginRequest` y
 * `ClienteRegistroRequest` del backend, que es el que decide.
 */

const LARGO_MAXIMO_EMAIL = 150;

const email = z
  .string()
  .trim()
  .min(1, 'El email es obligatorio')
  .max(LARGO_MAXIMO_EMAIL, `El email no puede superar los ${LARGO_MAXIMO_EMAIL} caracteres`)
  .pipe(z.email('El email no tiene un formato válido'));

// El login NO valida largo, igual que el backend: una cuenta creada antes de la
// Fase 9 puede tener una contraseña corta y tiene que poder seguir entrando.
const contrasenaLogin = z.string().min(1, 'La contraseña es obligatoria');

const LARGO_MINIMO_CONTRASENA = 8;
/** BCrypt solo usa los primeros 72 bytes: el backend rechaza una más larga. */
const LARGO_MAXIMO_CONTRASENA = 72;

/** Espejo del `@Size(min = 8, max = 72)` de `ClienteRegistroRequest`. */
const contrasenaNueva = z
  .string()
  .min(1, 'La contraseña es obligatoria')
  .min(
    LARGO_MINIMO_CONTRASENA,
    `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`,
  )
  .max(
    LARGO_MAXIMO_CONTRASENA,
    `La contraseña no puede superar los ${LARGO_MAXIMO_CONTRASENA} caracteres`,
  );

export const loginSocioSchema = z.object({ email, contrasena: contrasenaLogin });

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
    contrasena: contrasenaNueva,
    // Solo existe en el front: el backend no la recibe. Evita que el socio se
    // cree una cuenta con una contraseña que tipeó mal y no conoce.
    repetirContrasena: z.string(),
  })
  .refine((datos) => datos.contrasena === datos.repetirContrasena, {
    path: ['repetirContrasena'],
    message: 'Las contraseñas no coinciden',
  });

export type RegistroSocioFormulario = z.infer<typeof registroSocioSchema>;
