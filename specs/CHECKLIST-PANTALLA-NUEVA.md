# Checklist: pantalla nueva o llamada nueva al API

Fuente única de este checklist. Tanto el agente de Claude Code
(`.claude/skills/nueva-pantalla/SKILL.md`) como el de Antigravity/Gemini
(`.agents/skills/nueva-pantalla/SKILL.md`) apuntan acá en vez de duplicar estos
pasos — si se ajusta el proceso, se edita **solo este archivo**.

Existe por la misma razón que su hermano del backend: los errores que duelen no
son los de sintaxis, son los de suponer. En el backend el patrón fue "un supuesto
tácito que deja de valer cuando cambia quién llega hasta ahí". Acá el patrón es
otro y ya mordió una vez: **la pantalla que muestra algo que no es cierto.** La
maqueta actual devuelve datos inventados desde el `catch` de cada query, así que
cuando el backend falla, el dashboard muestra ganancias falsas y parece que
funciona (ticket W1).

## Cuándo usar esto

Antes de tocar código, si el pedido:
- agrega una pantalla o una ruta nueva;
- agrega una llamada al API (lectura o escritura);
- toca la sesión, el interceptor, o los guards de rol;
- toca cualquier cosa que muestre plata.

Para el resto (estilos, textos, renombrar un componente) no hace falta.

## Pasos

1. **Leer `specs/CONTRATO-API.md`** — al menos la sección del recurso que vas a
   tocar, y siempre la §1 (las dos autenticaciones) y la §2 (forma de los
   errores). No adivines la forma de una respuesta: está escrita.

2. **Confirmar el rol.** ¿Quién entra a esta pantalla: GERENCIA, ADMIN, o el
   socio? Si la respuesta es "staff", no alcanza: **GERENCIA y ADMIN ven cosas
   distintas.** La regla es `operar vs ver`: GERENCIA opera socios y cobra;
   ADMIN además ve plata (dashboard, listado de pagos, anulaciones) y cuentas de
   staff.

3. **Pregunta de sanity check:** "¿qué ve el principal con menos privilegios
   (un socio) si llega a esta pantalla o a este dato?" Si la respuesta no es
   "nada" o "solo lo suyo", el diseño está incompleto.

4. **Esconder por rol, nunca proteger por rol.** El botón se oculta con
   `principal.rol`, pero el que autoriza es el backend con 403. Un 403
   inesperado **se muestra**, no se traga: es la señal de que la pantalla y los
   permisos se desincronizaron.

5. **Nada de datos inventados.** Prohibido el `catch` que devuelve un mock. Se
   usan los estados de react-query (`isLoading`, `isError`, `error`) y se
   muestra el `mensaje` que devolvió el backend. Si hace falta una maqueta sin
   backend, va detrás de `VITE_USE_MOCKS`, nunca de un `catch`.

6. **Si es una escritura (formulario):**
   - `react-hook-form` + `zod`; la validación del cliente es comodidad, la que
     manda es la del backend.
   - Mapear el 400 al campo: la respuesta trae `errores: { campo: mensaje }` con
     el nombre exacto del DTO → `setError(campo, { message })`. Si el 400 no
     trae `errores`, mostrar `mensaje` arriba del formulario.
   - No mandar campos que el backend toma del token (`registrado_por`) ni
     campos que no están en el DTO de request.

7. **Invalidar el cache de lo que la escritura cambió, no solo de lo que
   escribió.** Es el error más fácil de cometer acá:
   - Cobrar y anular un pago cambian **el estado y el vencimiento del socio** →
     invalidar `['pagos']`, `['socios']` y `['dashboard']`.
   - Dar de baja un socio → `['socios']`.
   - Si esto se hace mal, la pantalla muestra en MOROSO a alguien a quien le
     acabás de cobrar, y se cobra dos veces.

8. **Respetar lo que el backend decidió que no existe** (§4 de
   `CONTRATO-API.md`): no hay borrado de socios, de staff ni de pagos; un pago
   se anula; un socio no edita nada. Si la pantalla parece necesitar algo de
   eso, **no se resuelve en el front**: se discute en el repo del backend.

9. **Antes de terminar:**
   - `pnpm build` (compila TS) y `pnpm lint` en verde.
   - Probar el caso de error de verdad: bajar el backend y mirar que la pantalla
     diga que falló en vez de mostrar algo.
   - Si tocaste sesión, interceptor o guards: probar login, F5 (silent refresh),
     y expiración (esperar el 401 o forzarlo).
   - Anotar en `specs/BITACORA.md` qué quedó hecho y qué quedó abierto.
