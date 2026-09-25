# Bitácora de la web

Dónde va el trabajo del front, para retomar entre sesiones sin releer todo el
repo. **Es un índice, no una copia**: el detalle de cada tramo vive en
`TICKETS.md`, en `STACK.md` y en los mensajes de commit. Si esto y esos archivos
no coinciden, mandan ellos.

Se actualiza **al terminar cada tramo**, no al final de todo.

## Estado al 2026-09-25 (cierre del día)

- **La web está completa para el alcance definido y lista para ser el MVP.**
  El 25/09 se encontró que faltaba el ABM de planes de ADMIN (nunca había
  tenido ticket): se hizo como **W14**, probado en pantalla con ADMIN (falta la
  pasada con GERENCIA). W1–W13 están hechos y probados (el 24/09 el dueño
  recorrió la web entera contra el backend local), y los pasos 0 a 7 de
  `STACK.md` §7 también.
- **Revisión de seguridad y casos límite hecha el 25/09**, en los dos repos. La
  vulnerabilidad del logout (la sesión quedaba viva en la PC del mostrador)
  está arreglada de las dos puntas: el front ya no manda el Bearer y el
  backend ya no depende de eso (B9). `pnpm test` corre **40 tests**.
- **El backend está commiteado y pusheado** en su `RamaLuciano`: `1b53fa2`
  (B6, B7 y B8.1), `cea463b` (logout con token vencido + casos borde),
  `4f36ce8` (Swagger apagado en producción, BCrypt aunque la cuenta no exista)
  y `6a178d8`. **Swagger solo existe en local**: `http://localhost:8080/swagger-ui/index.html`.
- **Las tres áreas funcionan**: mostrador (GERENCIA: socios y cobrar),
  administración (ADMIN: además dashboard, pagos, planes y cuentas de staff) y
  el portal del socio (login, registro con código, días restantes).
- **El stack se achicó respecto de lo planeado**: `@tanstack/react-table` y
  `recharts` se descartaron (`STACK.md` §2.2 y §2.4); lo que hacían lo cubren
  `lib/useOrden.ts` y un SVG propio.
- **El escritorio (paso 8) ya puede empezar**: falta instalar Rust y las Build
  Tools de C++. **La mobile sigue congelada** (`ARQUITECTURA-APPS.md` §2.1,
  decisión 4): retomarla es reabrir esa decisión y resolver dónde vive la
  sesión fuera del navegador (§6 de ese documento).

## Pasos

El orden sale de `STACK.md` §7. Los dos primeros no agregan ninguna dependencia
y son los que más deuda sacan.

| Paso | Qué cierra | Estado |
|---|---|---|
| 0 | `git init` + commit de la maqueta tal cual está, y los repos creados | **hecho** (`489cdb9`) |
| 1 | **W1**: sacar los mocks de los `catch` + normalizar el error del backend | **hecho** (19/09), junto con W11 |
| 2 | Los dos principals (`STACK.md` §5) + habilitar el área de GERENCIA | **hecho** (19/09), junto con W2, W3 y W4 |
| 3 | Socios: crear / editar / inhabilitar | **hecho** (19/09) — W6, con `react-hook-form` + `zod` |
| 4 | Listados paginados y búsqueda contra el servidor | **hecho** (23/09) — sin `react-table`, con `useOrden` |
| 5 | Cobrar, y portal del socio con los días restantes | **hecho** (22/09) — W5 y W10 |
| 6 | Dashboard de ADMIN | **hecho** (23/09) — gráfico en SVG propio, sin `recharts` |
| 7 | Tests del interceptor y de los guards | **hecho** (23/09) — `pnpm test`, 31 tests |
| 8 | Shell de escritorio (repo aparte) | **en curso** — 8.0 (publicar la web) preparado del lado del front |

## Abierto al 2026-09-25 (cierre del día)

**Para retomar, en este orden:**

1. **Instalar Rust y las Build Tools de C++** (el dueño). Revisado el 25/09:
   WebView2 ya está (v153), winget también (v1.29); faltan las dos cosas:
   ```
   winget install --id Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
   winget install --id Rustlang.Rustup
   ```
   Piden administrador y bajan varios GB. Después, **reabrir Claude Code** (para
   el `PATH` nuevo) y confirmar con `cargo --version`.
2. **Pasada de W14 con GERENCIA**: entrar con esa cuenta y confirmar que en
   Planes no aparecen crear, editar ni eliminar.
3. **Aplicar B6 y B7 en el front** (el backend los entregó en `1b53fa2`):
   - B6: cambiar solo `useGananciasDeMeses` (`features/dashboard/hooks.ts`)
     de 12 peticiones a `GET /dashboard/ganancias-por-mes`, y sumar el
     endpoint a `CONTRATO-API.md` (leer antes el controller real).
   - B7: en `CONTRATO-API.md` §3 ("Paginación"), cambiar "un campo inexistente
     responde 500" por el 400. Sin cambios de código.
4. **Paso 8.2, el shell con Tauri**, apenas esté Rust. **No depende del
   hosting**: repo nuevo `Gym-Escritorio` al lado de este, sin UI propia;
   `devUrl` = `http://localhost:5173` (se prueba ya contra el backend local,
   cuyo CORS acepta ese origen) y la URL de producción como un valor a
   completar. La página cargada no recibe ningún permiso de Tauri. A probar:
   login, recarga, y **cerrar y reabrir la app sin perder la sesión** (la
   cookie de refresh tiene `Max-Age`, así que WebView2 la guarda en disco).
5. **Después del MVP** (casos 7, 9 y 10 de la revisión del 25/09): varias
   pestañas refrescando a la vez, el motivo del cierre de una cuenta dada de
   baja, y un `?pagina=` fuera de rango en Pagos. Sin probar en pantalla: la
   pantalla de arranque con el backend apagado y el cobro incierto.

**En manos de otros:**

- **Producción: front y back salen juntos.** El front ya espera los topes y
  los errores nuevos del backend (`cea463b`). Los puntos 2 a 4 de B8 (CORS con
  el dominio de la web, `SameSite=Lax`, cold start) esperan al hosting.
- **Hosting de la web**: la idea del dueño es empezar con **Vercel gratis** y
  pasar después a un hosting pago. Ojo: el plan Hobby de Vercel es para uso no
  comercial, sirve para probar pero no para que el gimnasio cobre con él. El
  lado del front del paso 8.0 ya está hecho (`vercel.json`, API relativa en
  producción, proxy de Vite para `pnpm dev:prod`). Si se elige otro proveedor,
  `vercel.json` se reemplaza por su equivalente de rewrite. Esperan al hosting
  **8.1** (probar la sesión en la URL publicada) y **8.3** (el instalador, que
  lleva adentro la URL de producción).
- **Push**: lo hace el dueño.

**Siguen abiertos de antes:**

- **Datos de prueba en `gym_api_local`** (base descartable), dejados a
  propósito por decisión del dueño:
  - socios 4 a 7 (documentos `PRUEBA…`, `ESTADO…`, `CADENA…`, `CADMES…`),
    creados el 23/09. Pagos anulados: #4, #5, #8 y #10. **#6 ($35.000), #7
    ($1.000) y #9 ($35.000) siguen válidos y suman a septiembre.** El socio 7
    quedó INACTIVO por el bug del estado al anular (arreglado en el backend en
    `de3a0d8`): el estado ya guardado no se corrige solo;
  - la cuenta de staff `prueba_w7` (id 5, GERENCIA), dada de baja, con
    contraseña `reseteada123`;
  - lo que el dueño cargó en la prueba en pantalla del 24/09 (un socio con
    cuenta del portal, cobros y alguna anulación);
  - de antes (19/09): el socio Charles Quiroga y la cuenta `gerencia`.
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

- **2026-09-25 (tercer tramo)** — **El front, a tono con la revisión del
  backend** (casos borde + B9, en el working tree de `RamaLuciano` del backend,
  sin commitear; 211 tests en verde según su resumen).
  - Se leyó el diff del backend, no solo el resumen (venía cortado).
  - **B9 resuelto** en el backend. El front sigue sin mandar el Bearer en el
    logout: no lo necesita.
  - **Espejo en `zod` de los topes nuevos**, con los mismos mensajes:
    contraseñas de 8 a 72 (cuenta, staff, registro del socio); socio con
    `nombre`/`apellido` hasta 100 y `telefono` hasta 50; email hasta 150;
    nombre de staff hasta 100; plan con nombre hasta 100, precio hasta
    1.000.000.000 y duración hasta 3660 días; cobro con monto hasta
    1.000.000.000 y **fecha de pago no futura** (además `max` en el input de
    fecha).
  - La búsqueda vacía (400 nuevo) no hacía falta tocarla: el front solo
    busca con texto.
  - `CONTRATO-API.md` al día: 400/404/405/415 que antes eran 500, rate limit
    del registro, email en minúsculas, topes, fecha futura y el bloqueo del
    cobro concurrente.
  - Verificado: `pnpm build`, `pnpm lint` y `pnpm test` (40) en verde.

- **2026-09-25 (segundo tramo)** — **Revisión de seguridad y casos límite
  antes del MVP**, y el arreglo de los primeros tres grupos. Sin dependencias
  nuevas.
  - **Vulnerabilidad: el logout no cerraba la sesión.** Mandaba el Bearer, y
    con el token vencido el filtro JWT del backend respondía 401 antes del
    logout; el front se tragaba el error y mostraba el login con la cookie
    viva. En la PC del mostrador, F5 entraba como la persona anterior (también
    ADMIN). Ahora `logout` no manda `Authorization`, **cierra los dos
    portales** (`logoutDeTodo`) y tira el error: `auth/useCerrarSesion.ts`
    solo manda al login si el servidor confirmó, y si no, avisa y deja
    reintentar. Pedido **B9** al backend para que no dependa del front.
  - **Otras pestañas**: el logout se avisa por `BroadcastChannel`
    (`auth/sincronizacion.ts`) y las demás se cierran solas.
  - **Cache**: `queryClient` pasó a `api/queryClient.ts` y la sesión lo vacía
    al cerrar y cuando entra otra persona (no en el silent refresh).
  - **Login en un portal cierra la sesión del otro**, que si no quedaba viva
    en su cookie.
  - **Un error pasajero ya no saca al usuario**: el interceptor y el arranque
    cierran la sesión solo si el refresh responde 401/403
    (`sesionRechazada`). En el arranque, si el servidor no responde, se
    muestra el error con "Reintentar" en vez del login, y a los 8 s se avisa
    que el servidor puede estar arrancando.
  - **Timeout de 100 s** en las dos instancias de axios (`TIMEOUT_MS`), con
    mensaje propio, y mensajes para 502/503/504.
  - **Cobro con resultado incierto** (sin respuesta o 5xx): se refresca el
    listado igual y el botón queda bloqueado, con el aviso de mirar el
    vencimiento del socio antes de volver a cobrar (`resultadoIncierto`).
  - Verificado: `pnpm build`, `pnpm lint` y `pnpm test` (**40**, antes 31).
    En Chrome contra el backend local: el logout llama a los dos portales
    (200), la otra pestaña vuelve sola al login y el F5 después del logout se
    queda en el login (refresh 401).
  - **Sin probar en pantalla**: la pantalla de arranque con el backend
    apagado, y el cobro incierto (hace falta cortar el backend en el medio).
  - **Quedan para después del MVP** (casos 7, 9 y 10 de la revisión): varias
    pestañas refrescando a la vez, el motivo del cierre de una cuenta dada de
    baja, y un `?pagina=` fuera de rango en Pagos.

- **2026-09-25** — **Revisión del alcance antes de producción, y W14.**
  - Se comparó la web contra `ARQUITECTURA-APPS.md` §2.1 (no contra los
    tickets). Todo lo de GERENCIA y ADMIN estaba, salvo **planes: modificar y
    eliminar**, que el alcance pedía y ningún ticket W recogió. La bitácora
    decía "completa para el alcance" y no lo estaba.
  - **W14**: `FormularioPlan` (alta y edición) y `ConfirmarEliminacionPlan`
    en `features/planes/components/`, botones solo para ADMIN en
    `PlanesPage`. Sin dependencias nuevas.
  - **Corrección del contrato**: borrar un plan con pagos es **400**, no 409
    (`PlanServiceImpl.eliminar` → `IllegalArgumentException`). Arreglado en
    `CONTRATO-API.md` §2 y §3.
  - Verificado: `pnpm build`, `pnpm lint` y `pnpm test` (31) en verde.
  - **Probado en pantalla con ADMIN contra el backend local** (Claude in
    Chrome, sesión iniciada por el dueño): validación del formulario vacío;
    alta de "Prueba W14"; edición del precio, y el formulario de cobro tomó el
    precio nuevo al instante (sin registrar el pago); eliminación del plan de
    prueba; y el intento de borrar "Pase Mensual" mostró el mensaje del
    backend tal cual y no borró nada. La base quedó como estaba.
  - **Falta**: entrar con GERENCIA y confirmar que no aparecen los botones.

- **2026-09-24 (después del cierre)** — **Los `.env` salen del repo**, a pedido
  del dueño. `.gitignore` ya los listaba pero no servía: estaban commiteados, y
  git solo ignora lo que no sigue. Se sacaron del índice con `git rm --cached`
  (siguen en disco) y `.gitignore` pasó a `.env` / `.env.*` con la excepción
  `!.env.example`, que antes también se ignoraba y es justo la que tiene que
  subirse. No tenían secretos (URLs públicas), así que no se reescribió el
  historial.
  - **Riesgo que esto abría y se cerró**: sin `.env.production` en el repo, el
    build de Vercel habría salido apuntando a `localhost:8080`, roto y sin
    avisar. Ahora `config.ts` usa por defecto, en modo producción, el API
    relativo y el cartel "Producción". **Verificado compilando sin
    `.env.production`**: `baseURL` vacío, sin `localhost:8080`, y el cartel
    resuelto a "Producción" en el bundle. **En Vercel no hay que cargar
    variables.**
  - `.env.example` documenta todas las variables de los dos modos.
    `STACK.md` §4.1 al día.

- **2026-09-24 (cierre)** — Se ordenó lo que queda. El dueño **pausó la
  publicación** para charlar con el dueño del gimnasio si conviene un hosting
  pago, y le pasó al backend **B6, B7 y B8.1**. Se revisó la máquina para
  Tauri: hay WebView2 y `winget`, faltan Rust y las Build Tools de C++ (se
  instalan el 25/09). El 8.0 del front quedó hecho y sin commitear: lo
  commitea y pushea el dueño. Próximo paso: el shell (8.2), que no depende del
  hosting.

- **2026-09-24 (segundo tramo)** — **Paso 8.0: preparar la web para
  publicarse.** Decisiones del dueño: **Vercel con proxy** y **Tauri** para el
  shell.
  - **Hallazgo que ordenó el paso**: el shell carga la web *publicada*, y la
    web no estaba publicada. Y publicada con el API en otro dominio, la cookie
    de refresh ya es de tercero en el navegador: Safari la bloquea y un socio
    con iPhone perdería la sesión con cada F5. Con el rewrite `/api/*` →
    Render (`vercel.json`) la cookie queda del dominio de la web.
  - `VITE_API_URL` vacía en producción, y `config.ts` pasó de `||` a `??`
    (con `||` el string vacío caía en `localhost:8080`). Verificado en el
    bundle: `baseURL` vacío en las dos instancias de axios, y ni la URL de
    Render ni `localhost:8080` adentro.
  - `pnpm dev:prod` sigue andando con un **proxy de Vite** (`API_PROXY_TARGET`
    en `.env.production`, sin `VITE_`: no va al bundle). Probado en el puerto
    5174 contra el backend real: el login inválido volvió el 401 de Render.
  - **Del backend salieron dos cosas** (van en B8): el rate limit del login
    comparte un solo balde entre todos los usuarios (ya hoy, por el proxy de
    Render), y el **cold start** de Render tardó más de 90 s la primera vez.
  - Verificado: `pnpm build`, `pnpm lint` y `pnpm test` (31) en verde.

- **2026-09-24** — **Prueba en pantalla de toda la web**, hecha por el dueño
  contra el backend local, con la lista de nueve secciones. **Todo dio lo
  esperado**:
  1. GERENCIA ve solo Socios y Planes, las rutas de ADMIN escritas a mano
     redirigen, y cobra.
  2. El cobro anticipado se encadena al vencimiento vigente, el listado se
     actualiza sin recargar, y la fecha pasada avisa.
  3. Socios arranca por apellido, los encabezados ordenan, y en la búsqueda no
     se ofrecen.
  4. Dashboard: gráfico, tooltip, clic al desglose, vista de tabla, y la
     tarjeta de activos baja al dar de baja a alguien.
  5. Pagos (W12/W13): total igual al del dashboard, meses, orden, anulación
     con motivo, el 400 del encadenado, y el socio sigue ACTIVO si le queda
     otro pago (el arreglo `de3a0d8` del backend).
  6. Cuentas de staff (W7): alta, baja, "reactivala", reactivar y reset.
  7. Cambiar la propia contraseña (W8): la actual mal no cierra la sesión; la
     buena manda al login con aviso. `gerencia` quedó con `gerencia123`.
  8. Portal del socio (W10) de punta a punta, en ventana privada.
  9. F5, **la expiración del token a los 30 minutos** (un solo `/refresh`) y
     el backend caído (cada pantalla dice que no pudo conectar).
  - **Un solo hallazgo, de diseño**: el padrón estaba ordenado por apellido
    pero mostraba "Ana Pérez", así que el orden no se notaba. Ahora Socios y
    Pagos muestran **"Pérez, Ana"**; el resto de la web (modales,
    comprobante, portal) sigue con el nombre primero.
  - Además: pedido **B7** al backend en `TICKETS.md` §6 (el `sort` con un
    campo inexistente da 500 porque `PropertyReferenceException` cae en el
    handler genérico; verificado en `GlobalExceptionHandler`).

- **2026-09-23 (séptimo tramo)** — **Paso 6, el gráfico del dashboard.** Sin
  dependencias: **`recharts` se descartó** (decisión del dueño; razones en
  `STACK.md` §2.4).
  - **Ingresos de los últimos 12 meses en columnas**, entre las tarjetas y la
    tabla de socios. Se siguió el método del skill `dataviz`: forma primero
    (magnitud en el tiempo, una serie → columnas), color al final y
    **validado con su script** contra la superficie real de las tarjetas
    (`#16161b`): el azul `#3987e5` pasa con 4.95:1. El rojo de la marca no se
    usa para datos porque en esta UI significa error.
  - **El mes en curso va rayado y con "en curso"**: todavía está sumando, y sin
    esa marca parecería que la facturación se cayó. El rayado es la única
    textura del gráfico y marca un estado, no decora.
  - Tooltip por mes (el valor primero), foco por teclado, **clic abre el
    desglose de ese mes en Pagos** (W13), una sola etiqueta directa en el
    máximo, y **"Ver como tabla"** para que ningún valor dependa del mouse.
  - **Datos**: 12 peticiones en paralelo a `ganancias-mensuales`
    (`useGananciasDeMeses`), con la misma clave de cache que el resumen de
    Pagos. **Si falla una, falla la serie entera** con su mensaje: un gráfico
    con un hueco mentiría que ese mes no entró plata. Pedido de un endpoint
    con la serie anotado en "Abierto".
  - **Se miró renderizado** (capturas con Edge headless, con el CSS real del
    build) y apareció un caso que el código no mostraba: un mes con $1.000 al
    lado de uno con $1,5 M no se veía, igual que uno en cero. Ahora todo
    valor mayor a cero mide al menos 2 px.
  - `formatearPesosCompacto` a mano ("$35 mil", "$1,2 M"): el `compact` de
    Intl en es-AR mezcla "K" y "k" y mete espacios.
  - Verificado: `pnpm build`, `pnpm lint` y `pnpm test` (31) en verde.

- **2026-09-23 (sexto tramo)** — **Paso 4, ordenar los listados contra el
  servidor.** Sin dependencias: **`@tanstack/react-table` se descartó**
  (decisión del dueño; razones en `STACK.md` §2.2).
  - `lib/useOrden.ts` guarda columna y dirección y arma el `sort` de Spring con
    un **desempate por id** (sin él, dos filas iguales cambian de lugar entre
    páginas y un socio puede aparecer en dos o en ninguna).
    `components/ui/EncabezadoOrdenable.tsx` es el `<th>` clickeable, con
    `aria-sort`.
  - **Lista cerrada de columnas** por listado (`ORDENABLES_*` en cada
    `api.ts`, que es donde vive lo que el backend acepta). Verificado contra el
    backend: un campo inexistente da **500**, así que no se manda nada que no
    esté en la lista.
  - Socios arranca **por apellido** (antes salía en el orden de la base), y se
    ordena por socio o documento. "Vence" y "Plan" no se ordenan porque se
    calculan de los pagos; "Estado" tampoco, porque la base lo ordenaría
    alfabético. En la búsqueda los encabezados no se ofrecen: `/buscar` no
    acepta `sort`.
  - Pagos se ordena por socio (`cliente.apellido`, anidado: verificado), fecha
    o monto, y arranca por fecha descendente. Cuentas, por usuario, rol o
    estado, y arranca con las activas primero.
  - Cambiar el orden vuelve a la primera página.
  - Verificado: `pnpm build`, `pnpm lint` y `pnpm test` (31) en verde; los
    `sort` que arma cada listado se probaron contra el backend local.

- **2026-09-23 (quinto tramo)** — **Paso 7, tests.** Dependencias nuevas, las
  de `STACK.md` §7 más una que faltaba en el comando: `vitest`,
  `@testing-library/react`, `@testing-library/dom` (par obligatoria),
  `@testing-library/jest-dom`, `jsdom` y `msw`. Se corren con `pnpm test`.
  - **El alcance es el de §2.6, ni más ni menos**: el interceptor (9 tests,
    con `msw` en entorno Node), los guards (11) y los días hasta el
    vencimiento (11).
  - **Cada test se vio fallar**: se rompió a propósito el código que prueba y
    se comprobó que el test lo detecta. Sin la cola del interceptor fallan 2;
    si el refresh fallido no limpia la sesión, 1; si el guard ignora el rol,
    2; con el vencimiento leído en UTC contra el "ahora" local, 8. Todo se
    restauró y se verificó idéntico al commit.
  - **Lo que se aprendió de eso**: la primera rotura de fechas (`new Date` en
    las dos puntas de la resta) **no** era un bug: las dos fechas se corren
    igual y la diferencia da bien. El off-by-one de verdad aparece al mezclar
    una fecha leída en UTC con el "ahora" local. Se corrigió el comentario de
    `lib/fechas.ts`, que lo explicaba mal.
  - Zona horaria de los tests fijada a Argentina en `vite.config.ts`, para
    que el borde de las 23:30 dé igual en cualquier máquina (y en un CI en
    UTC).

- **2026-09-23 (cuarto tramo)** — **W7, cuentas de staff**. Sin dependencias
  nuevas. Feature nueva `features/staff`, pantalla `/staff/cuentas` con el
  ítem "Staff" en el menú, solo ADMIN.
  - Listado con las activas primero y las dadas de baja al final
    (`sort=activo,desc&sort=nombre,asc`), cada una con su acción: dar de baja
    o reactivar (el mismo `PATCH`), y resetear la contraseña.
  - **Reactivar es el camino, no crear otra igual.** El nombre de una cuenta
    dada de baja sigue ocupado, y el 400 del alta ya lo dice ("Reactivala en
    vez de crear una nueva"). El listado tiene el botón a mano.
  - **Sobre la propia cuenta no se ofrece ni la baja ni el reset**, porque el
    backend rechaza las dos (400). Para la propia está "Cambiar contraseña" del
    menú (W8). "Es el último administrador" no se adivina: si pasa, se muestra
    el 400. Comparar el id propio con el de la fila es seguro porque los dos
    son de `usuarios`.
  - El campo del reset se llama `nuevaContrasena`, como en el DTO, para que el
    400 de validación caiga en él.
  - **Corrección al contrato**: el nombre de usuario repetido es **400, no
    409**, y el reset también revoca sesiones.
  - Verificado por API (16/16). **No se probó "último administrador"**: habría
    que dar de baja la cuenta `admin`.
  - **Incidente de git, sin pérdidas.** El 23/09 a las 17:08 el `.git` local
    apareció recreado (sin objetos, con `RamaLuciano` vacía): la historia
    local se fue, pero toda estaba en GitHub (`master`, PR #1 mergeado en
    `d8312cc`). Se reconectó con `git reset origin/master` —sin `--hard`,
    verificando que ningún archivo cambiara— y W7 + W8 se commitearon encima.
    Si vuelve a pasar: la copia buena es `origin/master`.

- **2026-09-23 (tercer tramo)** — **W8, cambiar la propia contraseña**. Sin
  dependencias nuevas. Feature nueva `features/cuenta`.
  - Botón "Cambiar contraseña" en el pie del menú del staff, para los dos
    roles. Pide la actual, la nueva (mínimo 8, distinta de la actual) y
    repetirla; las dos primeras reglas son espejo del backend.
  - **Después del cambio, la web cierra la sesión sola** y manda al login con
    un aviso y el usuario ya escrito. Verificado contra el backend: el cambio
    revoca los refresh tokens pero **el access token viejo sigue sirviendo**
    hasta que vence. Sin el cierre explícito, la web seguiría andando hasta 30
    minutos y después te sacaría sin explicación.
  - La actual equivocada es un **400, no un 401**, así que el interceptor no la
    toma como sesión vencida; se muestra arriba del formulario.
  - Verificado por API con la cuenta `gerencia` (9/9), y su contraseña quedó
    restaurada a la original.

- **2026-09-23 (segundo tramo)** — **W12 (anular) y W13 (desglose del mes)**,
  juntos porque son la misma pantalla. Sin dependencias nuevas.
  - **Pagos pasó a ser el desglose de un mes** con un selector ‹ mes ›. El mes
    y la página viven en la URL (`/staff/pagos?anio=2026&mes=9&pagina=0`): la
    tarjeta "Ingresos del mes" del dashboard linkea al mes que sumó el backend,
    y un F5 no te devuelve al mes en curso.
  - **El total de arriba y la tabla coinciden por construcción, no porque el
    front los sume.** Los dos filtran por `fechaPago` del primer al último día
    del mes (`rangoDelMes` en `lib/fechas`). El total sale de
    `ganancias-mensuales` —el mismo número del dashboard— y excluye los
    anulados; la tabla los muestra tachados. Sumar la tabla en el navegador
    daría el total de 20 filas, no del mes.
  - **Orden**: `sort=fechaPago,desc&sort=id,desc`. Axios por defecto manda los
    arrays como `sort[]=…`, que Spring **ignora sin avisar**; se usa
    `paramsSerializer: { indexes: null }` en `listarPagos` (verificado con
    `axios.getUri`).
  - **Anular** (`ConfirmarAnulacion`): botón en cada fila válida, motivo
    obligatorio de hasta 300 caracteres, y dice claro que no se borra nada. El
    400 del pago encadenado (Fase 9) aparece arriba del formulario tal cual,
    porque ya nombra al pago que hay que anular primero. Invalida socios, pagos
    y dashboard: anular puede devolver al socio a su vencimiento anterior.
  - La tabla se sacó a `TablaPagos.tsx`. Componentes nuevos: `SelectorDeMes`,
    `ResumenDelMes` y `components/ui/CampoAreaTexto`. `TarjetaKpi` acepta un
    `enlace` opcional.
  - Verificado: `pnpm build` y `pnpm lint` en verde. **Contra el backend local
    por API, 22/22**, con las cuentas `admin` y `gerencia`: el total del mes
    coincide con la suma de los pagos válidos del listado (antes y después de
    cobrar y anular); `sort=` ordena y `sort[]=` se ignora; motivo vacío y de
    301 caracteres dan 400 con `errores.motivo`; anular con uno encadenado da
    el 400 que nombra al posterior; los anulados se siguen listando; GERENCIA
    recibe 403 en `/pagos`, en la anulación y en `/dashboard/socios`. De ahí
    salió un bug del backend: **anular un pago dejaba INACTIVO a un socio
    cubierto por otro pago válido** (dentro de la transacción de `anular`, el
    recálculo no veía el pago vigente y caía en `orElse(INACTIVO)`).
    Reproducido con pases diarios y mensuales; **arreglado en el backend en
    `de3a0d8`**. No se volvió a correr la prueba desde el front después del
    arreglo.

- **2026-09-23** — **Adaptar la web a la Fase 9 del backend**, que resolvió los
  cinco pedidos B1–B5 (`api\specs\2026-09-23-fase9-pedidos-del-front.md`, §8
  "Impacto en el front"). Sin dependencias nuevas.
  - **Cobro encadenado (B2).** `preverCobro` copia la regla nueva: si el socio
    todavía tiene días pagos, el período nuevo arranca cuando terminan. El
    aviso de "se pierden N días" **se borró**, porque ya no pasa. Para un cobro
    con **fecha pasada**, el aviso dice que el vencimiento lo va a mostrar el
    comprobante: el backend encadena con lo que el socio tenía pago en esa
    fecha, y eso sale de pagos que GERENCIA no puede leer. No se adivina.
  - **Contraseña de 8 (B3)** en el `zod` del registro del socio. El login
    **no** valida largo, a propósito: las cuentas viejas con contraseña corta
    tienen que poder seguir entrando.
  - **Tarjeta de socios activos (B5, cierra W9)**, leyendo
    `GET /dashboard/socios`, con morosos e inactivos al pie. Cuelga de
    `['dashboard', 'socios']`; por eso **el alta y la baja de socios ahora
    también invalidan `['dashboard']`**: si no, el conteo quedaba viejo
    después de dar de baja a alguien.
  - B1 (zona horaria) y B4 (UTF-8) no necesitaron cambios acá. Con B1, el
    "hoy" del navegador y el del backend coinciden en el gimnasio.
  - El anulado con pago encadenado (400 nuevo) queda documentado para W12, que
    todavía no tiene pantalla.
  - `CONTRATO-API.md` quedó al día con la Fase 9.
  - Verificado: `pnpm build` y `pnpm lint` en verde.

- **2026-09-22 (segundo tramo)** — Paso 5, segunda mitad: **W10, portal del
  socio**. Sin dependencias nuevas (`date-fns` ya había entrado con W5).
  - **Dos pantallas públicas nuevas**: `/socio/ingresar` (login por email
    contra `/clientes/login`) y `/socio/registro` (canje del código de
    activación). Son otra puerta, no una pestaña del login de staff: otro
    identificador, otra cookie, otro refresh. Las dos logins se linkean entre
    sí, y el registro, al terminar, manda al login con el email ya escrito
    porque **el backend no inicia sesión al registrar**.
  - **Cada área manda a su propio login.** `RutaProtegida` redirige según el
    portal de la ruta (`RUTAS_LOGIN` en `auth/rutas.ts`), y la raíz sin sesión
    va al login del último portal usado. Antes, un socio con la sesión vencida
    caía en el login del staff.
  - **El código de activación se normaliza** (mayúsculas, sin espacios ni
    guiones) porque se dicta en persona y el backend lo busca exacto.
  - **"Repetí la contraseña"** es solo del front; no se agregó un largo mínimo
    que el backend no exige (quedó como tema para el backend).
  - **Días restantes** (`portal-socio/components/DiasRestantes.tsx`): "te
    quedan N días", "vence hoy" o "venció hace N días", en ámbar desde 5 días
    antes. Si el socio está dado de baja **no se muestra cuenta regresiva**,
    para no contradecir el estado.
  - La tarjeta del login se sacó a `components/layout/PantallaAuth.tsx`, que
    usan las tres pantallas sin sesión.
  - Verificado: `pnpm build` y `pnpm lint` en verde. Contra el backend local,
    con `curl`: el código inexistente (400 solo `mensaje`), el 400 de
    validación del registro y del login (`errores` con los mismos nombres que
    los campos del formulario), el 401 del login (`{mensaje}` sin `status`),
    el refresh de socio sin cookie (401) y el preflight de CORS del registro.
    **No se probó el camino feliz**: hace falta un código nuevo, y eso sale de
    un alta con cuenta de staff.

- **2026-09-22** — Paso 5, primera mitad: **W5, cobrar**. Dependencia nueva:
  `date-fns`, la que `STACK.md` §7 tenía prevista para este paso, y por la
  razón de §2.3 (restar fechas ISO sin el off-by-one de UTC-3).
  - **Antes de escribir se leyó el backend** y salieron tres cosas que el
    ticket no decía o decía mal: el retroactivo vencido es **201, no 400**
    (corregido en `TICKETS.md` W5); el período nuevo **no se encadena** con el
    vigente; y el vencimiento del socio es el **máximo** entre sus pagos. Las
    tres quedaron en `CONTRATO-API.md` §3, Pagos.
  - **El botón "Cobrar" está en cada fila del listado de socios**, para ADMIN
    y GERENCIA, y también sobre un inactivo (es como vuelve). No está en la
    pantalla de pagos porque GERENCIA no puede leer ningún pago.
  - **El formulario** (`features/pagos/components/FormularioCobro.tsx`)
    precarga el plan vigente del socio y el precio del plan elegido; al
    cambiar de plan, el importe pasa a su precio. `zod` avisa el pago parcial
    antes de viajar, pero el que decide es el 400 del backend, que se muestra
    tal cual.
  - **Antes de confirmar, dice qué va a pasar** (`preverCobro` en
    `pagos/schemas.ts`, con las mismas reglas del backend): hasta cuándo queda
    al día, cuántos días que ya había pagado se superponen, si el
    vencimiento no cambia, o si el período ya terminó y no lo activa.
  - **Después de cobrar, el comprobante se arma con la respuesta**, no con lo
    tipeado. Si el pago no activa al socio, lo dice y avisa que no se vuelva a
    cobrar.
  - Invalida `['socios']`, `['pagos']` y `['dashboard']`, y espera a que se
    refresquen antes de mostrar el comprobante: cuando se cierra, el listado ya
    muestra el estado nuevo.
  - Nuevo `components/ui/CampoSelect.tsx`, hermano de `CampoTexto`.
  - Verificado: `pnpm build` y `pnpm lint` en verde. **Probado a mano por el
    dueño contra el backend** el mismo día: el aviso de días superpuestos, la
    reactivación de un inactivo, el pago parcial rechazado, el retroactivo
    vencido y el cobro con la cuenta GERENCIA.

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
