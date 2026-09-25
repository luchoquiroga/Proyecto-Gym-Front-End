import { z } from 'zod';

/**
 * Espejo de `PlanRequest` del backend. Comodidad: el que decide es el 400.
 *
 * Los `<input type="number">` se registran con `valueAsNumber`, así que vacío
 * llega como NaN y cae en el mensaje de obligatorio.
 */
/** Topes de cordura del backend, no de negocio: evitan un Infinity o una fecha fuera de rango. */
const PRECIO_MAXIMO = 1_000_000_000;
/** Diez años. */
const DURACION_MAXIMA = 3660;
const LARGO_MAXIMO_NOMBRE = 100;

export const planSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre del plan es obligatorio')
    .max(LARGO_MAXIMO_NOMBRE, `El nombre del plan no puede superar los ${LARGO_MAXIMO_NOMBRE} caracteres`),
  precio: z
    .number({ error: 'El precio es obligatorio' })
    .positive('El precio debe ser mayor a cero')
    .max(PRECIO_MAXIMO, 'El precio no puede superar los 1.000.000.000'),
  duracion: z
    .number({ error: 'La duración es obligatoria' })
    .int('La duración es en días enteros')
    .positive('La duración debe ser mayor a cero')
    .max(DURACION_MAXIMA, `La duración no puede superar los ${DURACION_MAXIMA} días`),
});

export type PlanFormulario = z.infer<typeof planSchema>;
