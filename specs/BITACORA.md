# Bitácora de la web

Dónde va el trabajo del front, para retomar entre sesiones sin releer todo el
repo. **Es un índice, no una copia**: el detalle de cada tramo vive en
`TICKETS.md`, en `STACK.md` y en los mensajes de commit. Si esto y esos archivos
no coinciden, mandan ellos.

Se actualiza **al terminar cada tramo**, no al final de todo.

## Estado al 2026-09-19

- **El backend está terminado** para el alcance definido: ocho fases de
  replanteo cerradas, sin superficie de más, desplegado en Render desde `master`
  (migraciones V3–V7 ya corrieron). **No bloquea nada del front.**
- **La web ya no miente ni le cierra la puerta a GERENCIA.** Las cuatro lecturas
  están contra el contrato vigente (paginación, `documento`, `fechaVencimiento`,
  estados reales), no hay un solo `catch` con datos inventados, y el staff entra
  por dos áreas: mostrador (GERENCIA) y administración (ADMIN).
- **Ya hay escrituras**: alta, edición y baja de socios (W6). Lo que falta para
  cubrir el mostrador es **cobrar** (W5).
- **El stack quedó decidido** el 2026-09-18 (`STACK.md`): se conserva lo que ya
  existe y se agrega de a una pieza por ticket. Los pasos 1 y 2 no agregaron
  ninguna dependencia, como estaba previsto.
- **El escritorio no empezó** y no debería empezar hasta que la web cubra lo que
  hoy hace la app Swing (o sea: hasta que GERENCIA pueda operar).

## Pasos

El orden sale de `STACK.md` §7. Los dos primeros no agregan ninguna dependencia
y son los que más deuda sacan.

| Paso | Qué cierra | Estado |
|---|---|---|
| 0 | `git init` + commit de la maqueta tal cual está, y los repos creados | `git init` y `remote` hechos por el dueño el 19/09; **falta el primer commit** |
| 1 | **W1**: sacar los mocks de los `catch` + normalizar el error del backend | **hecho** (19/09), junto con W11 |
| 2 | Los dos principals (`STACK.md` §5) + habilitar el área de GERENCIA | **hecho** (19/09), junto con W2, W3 y W4 |
| 3 | Socios: crear / editar / inhabilitar | **hecho** (19/09) — W6, con `react-hook-form` + `zod` |
| 4 | Listados paginados y búsqueda contra el servidor | pendiente |
| 5 | Cobrar, y portal del socio con los días restantes | pendiente |
| 6 | Dashboard de ADMIN | pendiente |
| 7 | Tests del interceptor y de los guards | pendiente |
| 8 | Shell de escritorio (repo aparte) | pendiente |

## Abierto al 2026-09-19

- **Falta el primer commit.** El repo tiene `git init` y `origin`, pero ningún
  commit: hoy no hay a dónde volver si algo sale mal.
- **Falta ver el área de GERENCIA con ojos.** El backend ya confirmó los
  permisos, pero nadie entró todavía a la web con esa cuenta: hay que mirar que
  la navegación no muestre Dashboard ni Pagos, y que entrar a `/staff/pagos` a
  mano redirija en vez de romper.
- **Falta probar la expiración del token** (esperar los 30 minutos o forzar un
  401) para ver la cola del interceptor trabajando de verdad.
- **Datos que quedaron en la base de pruebas** (`gym_api_local`), puestos el
  19/09 para poder probar: el socio Charles Quiroga quedó **ACTIVO** con un pago
  de $35.000 (Pase Mensual, vence el 19/10/2026), y existe una cuenta de staff
  `gerencia` con rol GERENCIA. Son datos de una base descartable.
- **`sort` en los listados.** `TICKETS.md` W2 dice que los parámetros son
  `?page=&size=&sort=nombre,asc`; `CONTRATO-API.md` §3 solo documenta `page` y
  `size`. Por ahora **no se manda `sort`** y el orden es el que da el backend.
  Verificar contra Swagger y corregir el documento que esté mal.
- **La cantidad de socios activos sigue sin endpoint** (W9). La tarjeta no está,
  y no se calcula en el navegador.
- Se borró `src/pages/Home.tsx`: era código muerto de un tema anterior (ninguna
  ruta lo usaba y usaba colores que ya no existen en `tailwind.config.js`).

## Decisiones cerradas (no reabrir sin volver al documento que las fijó)

- **El access token vive en RAM**, nunca en `localStorage`. La sesión la sostiene
  la cookie HttpOnly + silent refresh.
- **La web tiene tres áreas, no dos**: staff-gerencia, staff-admin y socio. El
  bloqueo actual a GERENCIA es del diseño viejo y se saca en el paso 2.
- **El front no decide permisos.** Esconde por rol; autoriza el backend con 403.
- **El escritorio es un envoltorio de la web** que carga la URL desplegada, no
  un consumidor propio del API y no un bundle local (si empaqueta el SPA, la
  cookie de refresh pasa a ser de tercero y se pierde el silent refresh).
- **Nada se borra**: socios y staff se dan de baja con `PATCH`, los pagos se
  anulan. Si una pantalla parece necesitar un `DELETE`, el que se discute es el
  backend.

## Trampas conocidas

- **La pantalla que miente.** Es el patrón que ya mordió acá: un `catch` que
  devuelve datos inventados hace que un backend caído se vea como un dashboard
  sano. Cualquier dato en pantalla tiene que venir del API o decir que falló.
- **Invalidar de menos.** Cobrar cambia el estado y el vencimiento del socio,
  no solo la lista de pagos. Ver `CHECKLIST-PANTALLA-NUEVA.md` paso 7.
- **Los ids se solapan.** El socio 4 y el empleado 4 no tienen nada que ver:
  `usuarios` y `clientes` son secuencias distintas. Nunca compares un id sin
  saber de qué tabla salió.
- **`codigoActivacion` se ve una sola vez**, en la respuesta del alta del socio.
  No hay endpoint para recuperarlo.

## Historial

- **2026-09-19 (segundo tramo)** — Paso 3: **W6, alta / edición / baja de
  socios**. Es la primera escritura de la web. Dependencias nuevas, las que
  `STACK.md` §7 ya tenía previstas para este paso y ninguna más:
  `react-hook-form`, `zod` y `@hookform/resolvers`.
  - **Antes de escribir el formulario se leyó el backend**, no solo el contrato,
    y confirmó tres cosas: el `PUT` **ignora `email` y `contrasena` a propósito**
    (así que el front directamente no los manda), el documento se normaliza y
    necesita **6 caracteres como mínimo** sin puntos, y el duplicado es un
    **409 con el documento en el mensaje**. Las reglas de `zod` son el espejo de
    las del backend, y están como comodidad: la que manda es la del servidor.
  - **El error del servidor cae en el campo que lo causó.** El 400 de validación
    trae `errores: { campo: mensaje }` y se pinta campo por campo
    (`lib/erroresFormulario.ts`); lo que no se puede mapear —el 409, un 403— se
    muestra arriba del formulario con el texto del backend tal cual.
  - **El `codigoActivacion` tiene pantalla propia**, con el código grande,
    copiable, y un cartel que dice que se ve una sola vez. No se cierra solo: si
    se pierde, el socio no puede crearse la cuenta del portal y no hay endpoint
    para recuperarlo.
  - **La baja dice "dar de baja", no "eliminar"**, y explica que no se borra
    nada. Va por `PATCH .../estado?nuevoEstado=INACTIVO` (query param, no body),
    y no se ofrece sobre un socio que ya está inactivo.
  - Las tres mutaciones invalidan `['socios']` entero, no solo la página que
    tocaron: el alta cambia el total del padrón y la edición puede tocar una
    fila que está en otra página o en la búsqueda.
  - Los modales **se montan cuando hacen falta** en vez de esconderse con un
    flag, así el formulario nace con los datos del socio a editar y no hay un
    efecto que lo reinicie (era lo que marcaba `oxlint` con `set-state-in-effect`).
  - Verificado: `pnpm build` y `pnpm lint` en verde; contra el backend local
    levantado, el 401 sin token devuelve `{mensaje, status}` como esperaba el
    normalizador, y el preflight de CORS desde `http://localhost:5173` habilita
    `POST`, `PUT` y `PATCH` con credenciales.
  - **Probado a mano por el dueño en la UI**: el alta muestra el código y deja
    al socio inactivo, el documento repetido se rechaza, el documento de menos
    de 6 caracteres no pasa, y el F5 mantiene la sesión.
  - **Contrato verificado contra la base de pruebas** (`gym_api_local`), con
    `curl` y la cuenta de admin. Las cuatro formas coinciden exactamente con los
    tipos del front: `PaginaResponse`, `ClienteResponse`, `PlanResponse`
    (`duracion`, no `duracionDias`) y `PagoResponse`. Los tres errores que las
    pantallas tienen que mostrar salen como se esperaba:
    - 400 de regla de negocio → solo `mensaje` ("El monto abonado (1000.0) es
      menor al precio del plan..."), va arriba del formulario;
    - 400 de validación → `errores: { "planId": "El plan es obligatorio" }`, va
      pintado en el campo;
    - 409 → solo `mensaje`, con el documento adentro.
  - **La matriz de permisos también se verificó**, creando una cuenta GERENCIA
    en la base de pruebas: `/clientes` y `/planes` responden 200, y `/pagos` y
    `/dashboard/ganancias-mensuales` responden **403 con `mensaje`**, que es
    exactamente lo que `RutaProtegida` esconde y lo que `ErrorDeCarga` muestra
    aparte del resto de los errores.
  - Detalle menor del backend: los errores que salen de la cadena de Spring
    Security (401 y 403) vienen en `ISO-8859-1` y los del
    `GlobalExceptionHandler` en UTF-8. Axios usa XHR, que respeta el charset del
    header, así que en el navegador se ven bien; queda anotado porque es una
    inconsistencia y porque con el adapter `fetch` los acentos se romperían.

- **2026-09-19** — Pasos 1 y 2, sin agregar ninguna dependencia. Cierran **W1,
  W2, W3, W4 y W11**, y dejan hecha la mitad de lectura de W9 y de W10.
  - **W1** — No queda un solo `catch` con datos inventados. El interceptor ahora
    rechaza siempre con un `ErrorApi` normalizado (`lib/errores.ts`), así que la
    pantalla muestra el `mensaje` del backend y no "Request failed with status
    code 400". Los cuatro estados (cargando, vacío, error, con datos) se
    resuelven con componentes compartidos (`components/estado/Estados.tsx`), y
    el 403 se muestra distinto del resto a propósito: no es "algo salió mal",
    es que la pantalla y los permisos se desincronizaron.
  - **W11** — `LoginResponse` con sus tres formas a la vez se borró. Cada portal
    tipa su propia respuesta (`usuario` en staff, `cliente` en socio) y no hay
    ramas de compatibilidad en ningún lado.
  - **Dos principals (`STACK.md` §5)** — `Principal` es una unión discriminada
    (`staff` con rol, `socio` sin rol); `RolUsuario` con `CLIENTE` adentro ya no
    existe. Los endpoints de login/refresh/logout salen de `auth/portales.ts`
    según el principal, no de `VITE_REFRESH_ENDPOINT` (que se borró de los
    `.env`). El último portal usado se guarda en `localStorage` —el string
    `staff` o `socio`, nunca el token— para no disparar dos refresh en cada
    carga. **La sesión de un socio ya se puede restaurar.**
  - **W4** — GERENCIA entra. Las rutas son `/staff/*` y no `/admin/*`; socios y
    planes los ven los dos roles, dashboard y pagos solo ADMIN, y la navegación
    esconde lo que el rol no puede usar. `/acceso-restringido` quedó para un
    principal sin área.
  - **W2 y W3** — Los dos listados leen `PaginaResponse` con su paginador contra
    el servidor, y el buscador de socios le pega a `/clientes/buscar` en vez de
    filtrar la página que tiene a mano. El socio muestra `documento`,
    `fechaVencimiento` y `planVigente`, y los estados son los tres reales
    (`ACTIVO`, `MOROSO`, `INACTIVO`): `VENCIDO` no existe más en el código.
  - **Dashboard** — El total de socios sale de `totalElementos`. La tarjeta de
    "socios activos" **se sacó**, no se calcula mal (W9), y la de "estado del
    sistema: en línea" también, porque no la respondía nadie.
  - **Portal del socio** — Dejó de estar hardcodeado: lee su ficha de
    `GET /clientes/{id}`. **Todavía no se puede alcanzar**, porque falta el
    login de socio (W10).
  - **Estructura** — Se pasó a `features/<área>/{api,hooks,types,pages}` como
    dice `STACK.md` §3.1. Ningún componente llama a axios.
  - Verificado: `pnpm build` y `pnpm lint` en verde; el dev server quedó fijo en
    el puerto 5173 (`strictPort`), porque si Vite se corre en otro puerto el
    backend le rechaza el CORS y no funciona ni el login.

- **2026-09-18** — Se armó el SDD de este repo (`specs/`, `AGENTS.md`, los dos
  skills) y se fijó el stack. El contrato del API quedó resumido en
  `CONTRATO-API.md` para no tener que abrir el repo del backend en cada duda.
  Al escribirlo aparecieron dos cosas del código actual que no son tickets de
  pantalla sino deuda de base, y por eso son el paso 2: el front mezcla
  `CLIENTE` con los roles de staff en un solo tipo (`RolUsuario`), y el refresh
  está fijo al endpoint de `usuarios`, así que **la sesión de un socio no se
  puede restaurar nunca**.
