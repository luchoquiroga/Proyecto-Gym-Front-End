# specs/

Acá vive el spec-driven development de la web, igual que en el repo del backend
(`C:\Users\lucia\IdeaProjects\api\specs\`). La idea es que **trabajar en el front
no obligue a ir hasta el backend a leer qué hay que hacer, ni a volver para
anotar qué se hizo**: las tareas, el contrato y la bitácora están acá.

El backend sigue siendo la fuente de verdad del contrato y de los permisos. Lo
que hay acá es un resumen derivado, y cuando se desincroniza, el que está mal es
el resumen.

## Contenido

- **`CONTRATO-API.md`** — todo lo que el front necesita saber del API: las dos
  autenticaciones, la forma de los errores, la superficie completa con roles y
  DTOs, y lo que deliberadamente no existe. **Es el primer archivo a leer.**
- **`STACK.md`** — con qué está hecha la web y el futuro shell de escritorio,
  cómo se usa cada pieza y por qué. Leerlo antes de agregar una dependencia.
- **`TICKETS.md`** — el backlog, ordenado. Lo que está roto primero, lo que
  falta después. De acá sale la próxima tarea.
- **`BITACORA.md`** — qué se hizo, en qué orden y qué quedó abierto. Se
  actualiza al terminar cada tramo de trabajo, no al final de todo.
- **`CHECKLIST-PANTALLA-NUEVA.md`** — los pasos a seguir antes de escribir una
  pantalla que muestre datos de alguien, escriba algo, o dependa de un rol. Es
  la fuente única que referencian los dos skills (ver abajo).
- **`TEMPLATE.md`** — la plantilla a copiar para especificar una pantalla o un
  flujo nuevo antes de implementarlo.

## Cuándo escribir un spec antes de codear

Sí, siempre:
- Una pantalla nueva que escribe algo (alta, edición, cobro, baja).
- Un cambio en cómo se resuelve la sesión o en qué ve cada rol.
- Cualquier cosa que toque plata: dashboard, cobro, anulación.

Para el resto (un fix de estilo, renombrar un componente, ajustar un texto) no
hace falta: alcanza con las reglas de `AGENTS.md`.

Flujo:

1. Copiar `TEMPLATE.md` a `specs/<fecha>-<nombre>.md`.
2. Completar "Datos y permisos" **antes** de escribir el componente, mirando
   `CONTRATO-API.md`.
3. Implementar siguiendo `CHECKLIST-PANTALLA-NUEVA.md`.
4. Anotar en `BITACORA.md` qué quedó hecho y qué quedó abierto.

## Dos agentes, un solo checklist

Este repo se trabaja tanto con Claude Code (`.claude/skills/nueva-pantalla/`)
como con Antigravity/Gemini (`.agents/skills/nueva-pantalla/`). Ninguno de los
dos `SKILL.md` contiene el checklist: los dos son punteros delgados a
`specs/CHECKLIST-PANTALLA-NUEVA.md`. **Si el proceso cambia, se edita solo ese
archivo**; nunca un `SKILL.md` con un paso que no esté ahí primero.

Es la misma convención que usa el backend, a propósito: dos repos, un solo
hábito.

## El repo del backend

`C:\Users\lucia\IdeaProjects\api`. Ir hasta allá hace falta solo para:

- **`specs/AUTHZ-MATRIX.md`** — la verdad sobre quién puede llamar a qué.
- **`specs/ARQUITECTURA-APPS.md`** — el alcance de producto de cada app (§2.1) y
  por qué el escritorio es un shell de la web.
- **`specs/DESPLIEGUE.md`** — variables de entorno, Render y Neon.
- El **Swagger** del backend corriendo: `http://localhost:8080/swagger-ui/index.html`.

Si algo del contrato no coincide con `CONTRATO-API.md`, gana el backend: se
corrige acá y se anota en `BITACORA.md`.
