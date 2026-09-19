# Spec: <nombre de la pantalla o del flujo>

Fecha: <YYYY-MM-DD>
Estado: borrador | en revisión | implementado
Ticket: <W? de TICKETS.md, si corresponde>

## 1. Qué resuelve

2-3 líneas: qué necesita hacer el usuario que hoy no puede, y quién lo pidió.

## 2. Alcance

Qué incluye y, explícito, qué NO incluye. Si algo queda afuera a propósito,
decirlo acá evita que alguien lo agregue "de paso".

## 3. Quién entra

- **Principal:** staff (ADMIN / GERENCIA) o socio.
- **Diferencia entre ADMIN y GERENCIA en esta pantalla:** qué ve o puede hacer
  uno que el otro no. Si la respuesta es "nada", decirlo explícitamente.
- **Qué pasa si entra el principal con menos privilegios** (un socio) a esta
  ruta o a este dato: escribir la respuesta esperada.
- **Qué se esconde por rol** y con qué condición.

## 4. Datos

Del contrato (`CONTRATO-API.md`), no de memoria:

- **Endpoints que consume:** método + ruta + rol requerido.
- **Query params / body exactos**, con los nombres del DTO.
- **Qué campos de la respuesta usa la pantalla**, y cuáles pueden venir `null`
  (`fechaVencimiento`, `planVigente`, `email`).
- **`queryKey` de cada lectura** y **qué invalida cada escritura** (acordarse de
  lo que la escritura cambia indirectamente).

## 5. Estados de la pantalla

Los cuatro, siempre:

- **Cargando:** qué se muestra.
- **Vacío:** no hay socios / no hay pagos en el rango. No es un error.
- **Error:** qué mensaje. Por defecto, el `mensaje` que devolvió el backend.
- **Con datos:** el caso feliz.

## 6. Errores del backend a contemplar

Listar los que esta pantalla puede provocar de verdad, con qué mensaje y dónde
se muestra: 400 de validación (¿qué campos?), 400 de regla de negocio (monto
insuficiente, estado no aceptado), 409 (documento/email/nombre duplicado), 403,
404, 429 si es login.

## 7. Qué se prueba

- El cálculo o la transformación que tenga (fechas, totales).
- El caso de error, con el backend caído.
- Si toca sesión o roles: login, F5, expiración, y el rol que NO debería entrar.

## 8. Checklist antes de dar por terminado

- [ ] `CHECKLIST-PANTALLA-NUEVA.md` seguido.
- [ ] `pnpm build` y `pnpm lint` en verde.
- [ ] Probado con el backend caído: la pantalla dice que falló.
- [ ] `BITACORA.md` actualizada.
- [ ] Si apareció una diferencia con el contrato: `CONTRATO-API.md` corregido.
