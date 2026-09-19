# AGENTS.md

## 1. Contexto del proyecto

Esta es la **web del gimnasio**: una SPA en React 19 + TypeScript + Vite que
consume el API de `C:\Users\lucia\IdeaProjects\api` (Spring Boot, desplegado en
Render). Es el frontend de tres áreas —staff-gerencia, staff-admin y el portal
del socio— y a futuro el escritorio va a ser un envoltorio de esta misma web,
así que lo que se construya acá lo van a usar las dos.

El objetivo es mantener un código:
- claro;
- mantenible;
- modular;
- fácil de comprender para otro desarrollador.

La prioridad es la calidad y la coherencia antes que soluciones complejas.

---

## 2. Antes de escribir código: leer `specs/`

Este repo trabaja con spec-driven development, igual que el backend.

| Si vas a... | Leé primero |
|---|---|
| llamar al API | `specs/CONTRATO-API.md` |
| agregar una dependencia | `specs/STACK.md` |
| saber qué toca hacer | `specs/TICKETS.md` y `specs/BITACORA.md` |
| escribir una pantalla o una llamada nueva | `specs/CHECKLIST-PANTALLA-NUEVA.md` |

**No adivines la forma de una respuesta del API ni quién puede llamarlo: está
escrito.** Y si lo que está escrito no coincide con el backend, el que está mal
es el documento: corregilo en el mismo trabajo y anotalo en `specs/BITACORA.md`.

Al terminar un tramo de trabajo, **actualizá `specs/BITACORA.md`**. Es lo que
hace que la próxima sesión no tenga que reconstruir el estado.

---

## 3. Reglas generales

- Antes de modificar código, analizá primero la implementación existente.
- Respetá la arquitectura actual del proyecto.
- No introduzcas cambios que no estén relacionados con la tarea solicitada.
- No modifiques archivos innecesarios.
- No elimines funcionalidades existentes sin autorización explícita.
- **No agregues dependencias sin justificarlas contra `specs/STACK.md`.** Ese
  documento ya decidió qué entra, cuándo y por qué, y qué queda afuera.
- Priorizá soluciones simples. Evitá sobreingeniería y duplicación.
- Nombres descriptivos, responsabilidades separadas.

---

## 4. Comportamiento del agente

Para tareas simples:

1. Analizá el código relevante.
2. Explicá brevemente qué vas a cambiar.
3. Hacé el cambio.
4. Verificá que compile y que el lint pase.

Para tareas complejas:

1. Analizá la arquitectura y los archivos involucrados.
2. Identificá dependencias y posibles impactos.
3. Explicá el problema.
4. Proponé un plan.
5. Esperá confirmación antes de cambios importantes.
6. Implementá.
7. Verificá.
8. Resumí lo hecho y actualizá `specs/BITACORA.md`.

---

## 5. Seguridad de los cambios

Nunca:

- borres archivos sin autorización;
- modifiques el historial de Git;
- hagas `git push` automáticamente;
- hagas `git reset --hard` sin autorización;
- sobrescribas configuraciones importantes sin explicarlo;
- desactives tests para ocultar errores.

Antes de operaciones potencialmente destructivas, pedí confirmación.

---

## 6. React y TypeScript

- Componentes funcionales con hooks. Nada de clases.
- **TypeScript en serio: no uses `any`.** Los tipos del contrato viven en el
  módulo de su feature y salen de `specs/CONTRATO-API.md`.
- Un componente no llama a `axios`: usa un hook, que usa el módulo `api.ts` de
  su feature. Ver `specs/STACK.md` §3.2.
- El estado del servidor es de react-query. `zustand` es **solo** para la
  sesión: no dupliques ahí datos que vienen del API.
- Los efectos son para sincronizar con algo externo, no para pedir datos.
- Evitá componentes de 400 líneas: si una pantalla tiene formulario, tabla y
  modal, son cuatro archivos.

---

## 7. Datos y errores

- **Prohibido el `catch` que devuelve datos inventados.** Un error se ve como un
  error, con el `mensaje` que devolvió el backend. Si hace falta una maqueta sin
  backend, va detrás de `VITE_USE_MOCKS`.
- Todo dato en pantalla viene del API o dice que falló. No hay tercera opción.
- Los estados de una pantalla son cuatro y hay que resolverlos: cargando, vacío,
  error, con datos.

---

## 8. Seguridad

- **El access token vive en memoria (zustand), nunca en `localStorage`.** La
  sesión la sostiene la cookie HttpOnly + silent refresh. No lo cambies.
- El front **no decide permisos**: esconde por rol y el backend autoriza con
  403. Un 403 inesperado se muestra, no se traga.
- Todo lo que empieza con `VITE_` termina en el bundle y es público: ahí no va
  ninguna credencial.
- No toques el interceptor de `src/api/axios.ts` sin leer `specs/STACK.md` §5:
  la cola de peticiones y el refresh único están así por una razón.

---

## 9. Verificación

Después de cambios relevantes:

- `pnpm build` (compila TypeScript) y `pnpm lint`.
- Probá el caso de error de verdad: con el backend caído, la pantalla tiene que
  decir que falló.
- Si tocaste sesión o roles: login, F5 (silent refresh) y expiración.
- Informá cualquier cosa que falle. Nunca desactives un test para que pase.

---

## 10. Git

- No hagas commits automáticamente.
- No hagas push automáticamente.
- No modifiques el historial.
- Antes de cambios importantes: `git status`.

---

## 11. Comunicación

No ocultes problemas. Si detectás un bug, una vulnerabilidad, una mala decisión
de arquitectura, código duplicado, una dependencia innecesaria o una posible
regresión, decilo claramente.

Si una solución propuesta por el usuario puede traer problemas, explicá por qué
y proponé una alternativa.

---

## 12. Regla educativa

El usuario está aprendiendo. Cuando haya una decisión técnica relevante:

- explicá brevemente por qué se tomó;
- indicá qué concepto está involucrado (por qué el token no va en
  `localStorage`, por qué el cache se invalida, por qué el rol esconde pero no
  protege);
- no escondas el razonamiento detrás de la implementación.

El objetivo no es solo código que funciona, sino que el usuario pueda mantenerlo.
