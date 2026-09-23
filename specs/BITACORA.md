# Bitácora de la web

Dónde va el trabajo del front, para retomar entre sesiones sin releer todo el
repo. **Es un índice, no una copia**: el detalle de cada tramo vive en
`TICKETS.md`, en `STACK.md` y en los mensajes de commit. Si esto y esos archivos
no coinciden, mandan ellos.

Se actualiza **al terminar cada tramo**, no al final de todo.

## Estado al 2026-09-23

- **El backend está terminado** para el alcance definido: nueve fases
  cerradas (la 9 fueron los pedidos del front, B1–B5), sin superficie de más, desplegado en Render desde `master`
  (migraciones V3–V7 ya corrieron). **No bloquea nada del front.**
- **La web ya no miente ni le cierra la puerta a GERENCIA.** Las cuatro lecturas
  están contra el contrato vigente (paginación, `documento`, `fechaVencimiento`,
  estados reales), no hay un solo `catch` con datos inventados, y el staff entra
  por dos áreas: mostrador (GERENCIA) y administración (ADMIN).
- **El mostrador está cubierto**: alta, edición y baja de socios (W6) y
  **cobrar** (W5), las dos probadas a mano contra el backend.
- **El stack quedó decidido** el 2026-09-18 (`STACK.md`): se conserva lo que ya
  existe y se agrega de a una pieza por ticket. Los pasos 1 y 2 no agregaron
  ninguna dependencia, como estaba previsto.
- **El portal del socio se puede alcanzar** (W10): login por email, registro
  con el código de activación y días restantes. Falta probarlo a mano de punta
  a punta.
- **El escritorio no empezó** y no debería empezar hasta que la web cubra lo que
  hoy hace la app Swing (o sea: hasta que GERENCIA pueda operar).

## Pasos

El orden sale de `STACK.md` §7. Los dos primeros no agregan ninguna dependencia
y son los que más deuda sacan.

| Paso | Qué cierra | Estado |
|---|---|---|
| 0 | `git init` + commit de la maqueta tal cual está, y los repos creados | **hecho** (`489cdb9`) |
| 1 | **W1**: sacar los mocks de los `catch` + normalizar el error del backend | **hecho** (19/09), junto con W11 |
| 2 | Los dos principals (`STACK.md` §5) + habilitar el área de GERENCIA | **hecho** (19/09), junto con W2, W3 y W4 |
| 3 | Socios: crear / editar / inhabilitar | **hecho** (19/09) — W6, con `react-hook-form` + `zod` |
| 4 | Listados paginados y búsqueda contra el servidor | pendiente |
| 5 | Cobrar, y portal del socio con los días restantes | **hecho** (22/09) — W5 y W10 |
| 6 | Dashboard de ADMIN | pendiente |
| 7 | Tests del interceptor y de los guards | pendiente |
| 8 | Shell de escritorio (repo aparte) | pendiente |

## Abierto al 2026-09-23

- **Falta probar W10 a mano de punta a punta**: dar de alta un socio, activar
  la cuenta con el código, entrar, F5 en el portal (silent refresh contra
  `/clientes/refresh`) y que la sesión vencida mande a `/socio/ingresar`.
- **Cuenta de staff de prueba `prueba_w7`** (id 5, GERENCIA), dada de baja,
  creada el 23/09 para probar W7. Su contraseña es `reseteada123`.
- **Datos de prueba que quedaron en `gym_api_local`** (23/09): socios 4 a 7
  (documentos `PRUEBA…`, `ESTADO…`, `CADENA…`, `CADMES…`). Los pagos #4, #5,
  #8 y #10 están anulados. **#6 ($35.000), #7 ($1.000) y #9 ($35.000) siguen
  válidos y suman al total de septiembre.**
  Se dejan a propósito, por decisión del dueño. El socio 7 quedó INACTIVO por
  el bug del estado al anular (ver el historial del 23/09, arreglado en el
  backend en `de3a0d8`): el estado ya guardado no se corrige solo.
- **Probar a mano W12 y W13** con la cuenta de admin: anular un pago (tiene
  que quedar tachado y bajar el total del mes), intentar anular uno que tiene
  otro encadenado después (tiene que mostrar el 400 que nombra al posterior),
  y que el total de arriba coincida con el de la tarjeta del dashboard.
- **Probar a mano la Fase 9 desde la web**: el cobro anticipado encadenado
  (Charles vence el 19/10: un mes cobrado hoy tiene que vencer el 18/11, no el
  23/10) y la tarjeta de socios activos, que cambia al dar de baja.
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
- **Los listados todavía no mandan `sort`.** Ya está confirmado que el
  backend lo acepta (`CONTRATO-API.md` §3, "Paginación", corregido el 23/09);
  usarlo, por ejemplo por apellido en socios, es parte del paso 4.
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
