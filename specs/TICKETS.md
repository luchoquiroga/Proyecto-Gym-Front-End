> **Dónde vive cada cosa.** Este documento y los tickets viven en ESTE repo (el
> del front). Los documentos que se citan abajo sin ruta —`ARQUITECTURA-APPS.md`,
> `AUTHZ-MATRIX.md`, `DESPLIEGUE.md`, `2026-09-15-replanteo-backend.md`— viven en
> el repo del backend, en `C:\Users\lucia\IdeaProjects\api\specs\`. Para el día a
> día no hace falta ir hasta allá: lo que el front necesita saber del API está
> resumido en `specs/CONTRATO-API.md`.

# Tickets de UI: la web

Fecha: 2026-09-15
Estado: backlog
Repo: `C:\Users\lucia\Project Visual Studio Code\Gym-Project-Front-End`
(React 19 + Vite + TS, react-query, zustand, axios, tailwind; sin repositorio git
todavía)

## 1. Por qué existe este documento

El replanteo del backend cerró cinco fases y el contrato quedó quieto
(`2026-09-15-replanteo-backend.md`). Estos son los tickets de la web contra ese
contrato.

**Corrección a §10 del replanteo:** ahí dice que la web "todavía no existe" y
que por eso "nace directamente contra el contrato nuevo, así que no acumula
ticket de migración". Es falso. La web existe, es del 3 al 5 de septiembre —
anterior a todo el replanteo— y está escrita contra el contrato viejo. Sí
acumula migración, y de las tres apps es la que más superficie rota tiene.

**Alcance:** el de `ARQUITECTURA-APPS.md` §2.1, definido el 2026-09-15. Los
tickets de abajo lo cubren; lo que no está en ese alcance no está acá.

## 2. Qué hay hoy

> **Desactualizado desde el 2026-09-19.** Esta sección describe la maqueta de
> septiembre; W1, W2, W3, W4 y W11 ya están hechos. El estado actual está en
> `BITACORA.md`. Se deja el texto original porque es el que explica de dónde
> salieron los tickets.

Una maqueta navegable con autenticación real de staff:

- **Auth que funciona:** login contra `/api/v1/usuarios/login`, access token solo
  en memoria (zustand, nunca en localStorage), silent refresh en
  `AuthInitializer` y reintento automático del 401 con cola de peticiones en el
  interceptor de axios. Es lo mejor que tiene y no hay que tocarlo.
- **Pantallas:** Login, Home, AdminDashboard, ClientesPage, PlanesPage,
  PagosPage, ClientePortal, AccesoRestringido.
- **Datos:** cuatro llamadas de lectura (`/dashboard/ganancias-mensuales`,
  `/clientes`, `/pagos`, `/planes`). **Ninguna de escritura**: los botones
  "Registrar Socio" y "Registrar Pago" no hacen nada.

## 3. La decisión que ordena todo el resto

Hoy la web **le prohíbe entrar a GERENCIA**: `RoleRoute` la manda a
`/acceso-restringido`, y `Login` también, con un comentario que dice que es a
propósito. Eso venía del diseño viejo, donde GERENCIA se quedaba en la app
Swing.

Ese supuesto se cae con el objetivo actual —que la web reemplace al escritorio—
porque **GERENCIA es exactamente el rol que usa el escritorio**: opera socios y
cobra. Una web sin área de GERENCIA no puede reemplazar nada.

**Entonces: la web tiene tres áreas, no dos.**

| Área | Quién entra | Para qué |
|---|---|---|
| staff-gerencia | GERENCIA (y ADMIN, que puede todo) | mostrador: socios y cobrar |
| staff-admin | ADMIN | lo anterior + plata y cuentas de staff |
| socio | CLIENTE | su propia ficha |

La división entre las dos primeras no es "lectura vs escritura": GERENCIA
escribe (da de alta socios, cobra) y aun así no ve ningún dato monetario. Es
**operar vs ver** (§2.2 del replanteo). Lo que cambia entre ADMIN y GERENCIA no
son las pantallas de socios, que son las mismas: es que ADMIN además tiene
dashboard, pagos y staff.

**El canal nunca es un rol.** La web no decide permisos: los pide y el backend
responde 403. Si una pantalla se esconde, se esconde por el rol del principal,
igual que hoy hace `RoleRoute`.

---

## 4. Tickets

Ordenados: primero lo que está roto o miente, después lo que falta.

### W1 — Sacar los mocks de los `catch` — HECHO el 2026-09-19

Las cuatro queries tienen la misma forma:

```ts
try { const res = await api.get('/api/v1/clientes'); return res.data; }
catch { return [ /* datos inventados */ ]; }
```

O sea que **cuando el backend falla, la pantalla muestra datos falsos sin avisar
nada**. Con el contrato cambiando debajo, esto es lo peor que puede pasar: el
dashboard muestra `$485.000` de ganancias inventadas y parece que funciona. Un
error tiene que verse como un error.

Sacar los `catch` con mock y usar los estados que react-query ya da (`isError`,
`error`), con un mensaje en pantalla. Si hace falta una maqueta sin backend, va
detrás de un flag explícito (`VITE_USE_MOCKS`), nunca de un `catch`.

**Hasta que esto no esté hecho, ninguno de los tickets siguientes se puede
verificar**: los errores de contrato quedan tapados por el mock.

### W2 — Los listados ahora vienen paginados — HECHO el 2026-09-19

`GET /clientes` y `GET /pagos` ya no devuelven un array. Devuelven
(`PaginaResponse`):

```json
{ "contenido": [...], "pagina": 0, "tamanio": 20, "totalElementos": 137, "totalPaginas": 7 }
```

Rompe en tres lugares, y **no** lo salva el `catch` de W1 porque la respuesta es
200: el error aparece al renderizar, cuando se llama `.filter`/`.length` sobre
un objeto.

- `ClientesPage`: `clientes?.filter(...)`
- `PagosPage`: itera el array directo
- `AdminDashboard`: `clientes?.length` y `clientes?.filter(...)` para los
  contadores → hoy contaría mal aunque no reviente.

Los parámetros son los de Spring: `?page=0&size=20&sort=nombre,asc`. Conviene un
tipo `PaginaResponse<T>` compartido y un hook de paginación, porque es la misma
forma para los dos listados.

Ojo con `AdminDashboard`: hoy cuenta socios trayendo **la lista entera**. Con
paginación, `totalElementos` es el número que quiere; los activos no salen de
ahí y necesitan otra cosa (ver W9).

`GET /planes` **no** se pagina (son un puñado de filas): `PlanesPage` sigue
funcionando igual.

### W3 — El socio ahora trae vencimiento, y `VENCIDO` no existe — HECHO el 2026-09-19

`ClienteResponse` es hoy: `id`, `nombre`, `apellido`, `telefono`, `documento`,
`email`, `estado`, `fechaVencimiento`, `planVigente`.

- **`documento` es obligatorio y único** (Fase 8), y es lo que distingue a dos
  socios que se llaman igual. Tiene que aparecer en el listado y en la ficha: es
  la columna que hace que dos "Juan Pérez" dejen de ser dos filas idénticas.
  Viene siempre normalizado (sin puntos), aunque se haya cargado con puntos.
- **`planVigente`** (id + nombre, sin precio) es el plan del último pago del
  socio. Null si nunca pagó, igual que `fechaVencimiento`.

- **`fechaVencimiento` es el dato nuevo de la Fase 2** y es la razón por la que
  GERENCIA puede trabajar sin ver pagos: responde "¿este socio está al día?" sin
  ningún monto. Hay que mostrarlo en la ficha y en el listado.
- El tipo del front declara `estado: 'ACTIVO' | 'INACTIVO' | 'VENCIDO'`.
  **`VENCIDO` no existe en el backend**, nunca existió: el enum es `ACTIVO`,
  `MOROSO`, `INACTIVO`. Hoy un socio moroso no matchea ningún caso y cae en el
  estilo por defecto.
- `email` es nuevo en la respuesta y sirve para saber si el socio ya activó su
  cuenta del portal.

### W4 — Abrirle la web a GERENCIA — HECHO el 2026-09-19

Implementa la decisión de §3.

- Sacar el corte por `GERENCIA` de `RoleRoute` y de la redirección de `Login`.
- Rutas de socios (`/clientes` y sus acciones) accesibles a `['ADMIN', 'GERENCIA']`.
- `/admin/dashboard` y `/admin/pagos` siguen siendo solo `['ADMIN']` — es la
  regla del backend, que devuelve 403 a GERENCIA en las cuatro lecturas de pagos.
- La navegación de `AdminLayout` tiene que ocultar lo que el rol no puede usar,
  para que GERENCIA no vea ítems que la llevan a un 403.
- `/acceso-restringido` deja de ser el destino de GERENCIA (sigue sirviendo para
  un rol sin área).

Conviene renombrar las rutas `/admin/*` a algo neutro (`/staff/*`): dejarlas
como están hace que la mitad de las pantallas de GERENCIA vivan bajo una URL que
dice "admin".

### W5 — Cobrar sin ver la tabla de pagos — HECHO el 2026-09-22

Es el ticket que desbloquea el reemplazo del escritorio, y **no es mover una
pantalla de lugar**: hoy el cobro vive dentro de la pantalla de pagos, que
GERENCIA no puede ver.

Una acción "Registrar pago" **desde la ficha del socio**, disponible para ADMIN
y GERENCIA: elegir plan (`GET /planes`) e importe, y `POST /api/v1/pagos`.
Al volver, refrescar el socio para que se vea el `fechaVencimiento` nuevo.

Dos errores del backend que la pantalla tiene que mostrar bien:
- **400 por monto menor al precio del plan.** No hay pago parcial: se rechaza
  entero y no se registra nada. El mensaje viene en `mensaje` del `ErrorResponse`
  y hay que mostrarlo tal cual, no un "error al guardar" genérico.
- ~~**400 por pago retroactivo ya vencido**: se registra pero no activa al socio.~~
  **Corregido el 2026-09-22:** no es un 400, es un **201**. El pago se registra
  y el socio no se activa. Mostrarlo como error haría que se cobre dos veces.

La respuesta **no** trae quién cobró (`registradoPor` no está en `PagoResponse`,
a propósito), así que no intentes mostrarlo.

### W6 — Alta y edición de socios — HECHO el 2026-09-19

Hoy el botón "Registrar Socio" no hace nada. ADMIN y GERENCIA.

- **Alta** (`POST /clientes`): nombre, apellido, telefono y **documento**. El
  socio nace `INACTIVO` hasta su primer pago; el estado no se manda.
- **El documento es obligatorio** y el backend devuelve **409** si ya pertenece
  a otro socio, con un mensaje que dice cuál es. Ese 409 hay que mostrarlo tal
  cual: es el caso de "esta persona ya está cargada", que el mostrador necesita
  entender, no un error genérico. Se puede escribir con o sin puntos: el backend
  lo normaliza antes de guardarlo, así que no hace falta validar el formato en
  el front (sí conviene no dejar mandar vacío).
- **Devuelve un dato de un solo uso:** `ClienteAltaResponse` trae el
  `codigoActivacion`, que el socio necesita para crearse la cuenta del portal.
  **Es la única vez que ese código viaja**: hay que mostrarlo en pantalla de
  forma que se pueda copiar o imprimir, porque si se pierde no se puede volver a
  consultar.
- **Edición** (`PUT /clientes/{id}`): datos de contacto **y documento**. Un
  documento mal tipeado en el alta hay que poder corregirlo, y el único que
  puede es el staff; también devuelve 409 si choca con otro socio. El email, en
  cambio, no se edita desde el mostrador porque es la identidad de login del
  socio en el portal y cambiárselo le sacaría el acceso sin que se entere. El
  formulario no debe ofrecer ni email ni contraseña.
- **Baja** (`PATCH /clientes/{id}/estado` con `{"estado":"INACTIVO"}`): pone al
  socio en INACTIVO y nunca borra la fila. La UI tiene que decir "dar de baja",
  no "eliminar" — y no hay ningún DELETE que llamar, porque no existe. El mismo
  endpoint rechaza `ACTIVO` y `MOROSO`: esos los determina el sistema.
- **Buscar** (`GET /clientes/buscar?nombre=`) ahora devuelve una **lista** con
  coincidencia parcial insensible a mayúsculas, no un único resultado. Hoy
  `ClientesPage` filtra en memoria sobre la lista completa: con paginación eso
  pasa a filtrar solo la página actual, así que el buscador tiene que pegarle al
  endpoint.

### W7 — Gestión de cuentas de staff (solo ADMIN) — HECHO el 2026-09-23

No existe ninguna pantalla. Es lo que cierra la Fase 5.

- Alta (`POST /usuarios`: nombre, contrasena, rol).
- **Baja y reactivación, un solo endpoint** (`PATCH /usuarios/{id}/activo` con
  `{"activo": false}` o `true`). Desactivar no borra: la cuenta deja de poder
  entrar y pierde sus sesiones. No hay `DELETE` que llamar.
- **Reactivar** con ese mismo endpoint hace
  falta de verdad, no es un extra. Una cuenta dada de baja sigue ocupando su
  nombre de login, así que si se dio de baja a la persona equivocada **no se
  puede arreglar creando otra igual**: hay que reactivar esa. El backend
  devuelve un 400 que lo explica; la UI tiene que ofrecer el camino.
- `UsuarioResponse` trae `activo`: el listado tiene que distinguir cuentas
  vigentes de dadas de baja.
- **Reset de contraseña de otro** (`PUT /usuarios/{id}/contrasena`): solo ADMIN,
  y el backend lo rechaza contra la propia cuenta. Esa es la razón de W8.

Hoy no hay ningún `GET /usuarios` (ni listado ni por id) en el backend: esta
pantalla lo necesita y **es un ticket de backend**, no de acá.

### W8 — Cambiar la propia contraseña (ADMIN y GERENCIA) — HECHO el 2026-09-23

No existe la pantalla, y ahora es el único camino para que un empleado cambie su
clave.

`PUT /usuarios/cambiar-contrasena` con `{ contrasenaActual, nuevaContrasena }`.
A quién se le cambia sale del token, **no del body** — el campo `nombre` que
tenía antes ya no existe.

- Contraseña actual equivocada → **400**, no 401. Es a propósito: la sesión es
  válida, lo que está mal es un dato del formulario. No dispares el logout.
- Al cambiarla, el backend **revoca todas las sesiones de esa cuenta**, así que
  el refresh siguiente va a fallar: conviene cerrar sesión y mandar al login con
  un mensaje claro, en vez de esperar a que el interceptor lo descubra solo.

### W9 — Dashboard con los números que el backend da — HECHO el 2026-09-23

> Ya está hecho lo que no dependía del backend: el total sale de
> `totalElementos` y la tarjeta de "socios activos" se sacó en vez de
> calcularla mal. **Cerrado el 2026-09-23**: la Fase 9 del backend agregó
> `GET /dashboard/socios` y la tarjeta volvió, con morosos e inactivos al pie.

`/api/v1/dashboard/ganancias-mensuales` sigue existiendo y es solo ADMIN.

Lo que hay que arreglar es de dónde salen los otros números: hoy los socios
totales y activos se calculan trayendo la lista entera y contando en el
navegador, algo que ya era frágil y con paginación queda mal directamente. El
total sale de `totalElementos`; **los activos no salen de ningún endpoint
existente**, así que o se agrega al dashboard del backend (ticket de backend) o
la tarjeta se saca hasta que exista. No inventar el número en el front.

### W10 — El portal del socio no se puede alcanzar — HECHO el 2026-09-22

> Hecho: el arreglo conceptual de los tipos (`Principal` como unión
> discriminada, `RolStaff` sin `CLIENTE`), el refresh por portal —así que la
> sesión de un socio ya se puede restaurar— y la pantalla, que dejó de estar
> hardcodeada y lee `GET /clientes/{id}`.
> **Completado el 2026-09-22**: login de socio en `/socio/ingresar`, registro
> con el código de activación en `/socio/registro`, y los días restantes en el
> portal (con `date-fns`).

`ClientePortal` y la ruta `/cliente/resumen` existen, pero **no hay forma de
loguearse como socio**: el front solo llama a `/api/v1/usuarios/login`, y
`/api/v1/clientes/login` y `/api/v1/clientes/registro` no se usan en ningún
lado. La pantalla además está toda hardcodeada ("Pase Libre Musculación",
"Membresía Activa") y no lee nada del backend.

Son dos flujos de autenticación **separados a propósito** (`Cliente` y `Usuario`
son entidades distintas, con tablas, cookies y endpoints propios), así que:

- Login de socio propio, contra `/clientes/login`, que deja una cookie
  `clienteRefreshToken` (el staff usa `refreshToken`; conviven sin pisarse).
- `AuthInitializer` hoy intenta el refresh de staff únicamente: para el socio
  tiene que intentar el suyo.
- Registro (`POST /clientes/registro`) con el **código de activación** que el
  staff le dio en persona (ver W6), más email y contraseña. No se identifica con
  nombre y teléfono: eso se cerró por ser adivinable.
- El portal lee sus datos reales de `GET /clientes/{id}`, que el propio socio
  puede consultar y que ya trae estado, `fechaVencimiento` y `planVigente` —
  alcanza para la pantalla completa del alcance.
- **Los pagos no**: desde la Fase 7 toda lectura de pagos es de ADMIN, así que
  un socio recibe 403 en `/pagos/{id}` y `/pagos/cliente/{id}`. Es deliberado,
  no un bug: el portal no muestra comprobantes. Si alguna vez tiene que
  mostrarlos, primero se reabre esa rama en el backend.

**Además, un arreglo conceptual:** `types/auth.ts` declara
`RolUsuario = 'ADMIN' | 'CLIENTE' | 'GERENCIA'`, mezclando en un tipo lo que el
backend mantiene deliberadamente separado. `CLIENTE` no es un `RolUsuario`: es
un principal de otra tabla que viaja como claim del token. Conviene
`RolStaff = 'ADMIN' | 'GERENCIA'` y un `Principal` que sea staff o socio, para
que el sistema de tipos no invite a tratarlos igual.

### W11 — Limpieza de compatibilidad muerta — HECHO el 2026-09-19

`LoginResponse` acepta tres formas a la vez (`accessToken` o `token`; `usuario`
anidado o `id`/`nombre`/`rol` sueltos) y `AuthInitializer`, `Login` y el
interceptor cada uno desarma las dos variantes. El backend hoy devuelve una
sola: `{ mensaje, accessToken, usuario: { id, nombre, rol, activo } }`. Tipar
esa y borrar las ramas muertas.

Nada está entregado todavía, así que no hay compatibilidad hacia atrás que
cuidar.

---

### W12 — Anular un pago cargado por error (solo ADMIN) — HECHO el 2026-09-23

Depende de F6.1. **No es un botón "eliminar":** el pago no desaparece, queda
marcado como anulado con quién, cuándo y por qué. La UI tiene que reflejar eso o
va a generar la expectativa equivocada.

- Acción "Anular" en la fila del pago, **con motivo obligatorio** (el backend lo
  exige; es lo que hace que la anulación sirva como auditoría).
- El pago anulado **se sigue mostrando** en el listado, tachado o con una marca
  clara, nunca oculto: esconderlo sería volver al borrado por la ventana.
- No hay forma de editar un pago. Corregir un importe es anular y volver a
  cobrar; si la pantalla ofrece "editar", está ofreciendo algo que el API no
  hace a propósito.
- Al anular hay que refrescar el socio: su `fechaVencimiento` puede haber vuelto
  al pago anterior.
- GERENCIA no ve esta acción (403 del backend si la intenta).

### W13 — Desglose de ganancias del mes (solo ADMIN) — HECHO el 2026-09-23

El dashboard hoy muestra el total agregado de `/dashboard/ganancias-mensuales`.
El alcance pide poder **abrir ese número**: ver los pagos que lo componen.

Con F6.3, es `GET /pagos?desde=&hasta=` paginado. El total de arriba y la suma
del listado tienen que coincidir —incluido el tratamiento de los anulados— o el
usuario no va a saber cuál de los dos creer.

**Mostrá el documento en cada fila.** `PagoResponse.cliente` trae
`{id, nombre, apellido, documento}`, y el documento está ahí por este ticket:
sin él, dos socios homónimos aparecen como dos cobros idénticos y es imposible
saber a cuál de los dos hay que anularle el pago (W12). El id no sirve para eso:
no se muestra y nadie lo reconoce.

### W14 — Planes: crear, editar y eliminar (solo ADMIN) — HECHO el 2026-09-25

Estaba en el alcance (`ARQUITECTURA-APPS.md` §2.1, ADMIN: "Planes: modificar y
eliminar") y **nunca se convirtió en ticket**, así que la web se dio por
completa sin él. Apareció el 25/09 revisando el alcance antes de producción.
Sin esto, subir la cuota no se podía hacer desde la web, y el precio del plan
es el mínimo que acepta el cobro.

- Alta (`POST /planes`) y edición (`PUT /planes/{id}`): nombre, precio y
  duración en días. El 400 de validación se pinta en el campo.
- **Editar no cambia los pagos ya cobrados** (guardan su importe y su
  vencimiento); el nombre sí cambia en todos lados. La UI lo avisa.
- Eliminar (`DELETE /planes/{id}`): es el único borrado real, así que acá sí
  dice "eliminar". Con pagos, el backend responde **400** (no 409, como decía
  el contrato) y se muestra tal cual.
- Invalida `['planes']` para que el cobro tome el precio nuevo de inmediato
  (si no, el `staleTime` de 5 minutos lo dejaba cobrando con el viejo); la
  edición invalida además `['socios']` y `['pagos']` por el nombre.
- GERENCIA ve los planes pero no los botones (403 del backend si lo intenta).

## 5. Orden sugerido

1. **W1** (sacar los mocks) — sin esto no se puede verificar nada de lo demás.
2. **W2, W3, W11** — poner las lecturas que ya existen a tono con el contrato.
   Hasta acá la web hace lo mismo que hoy, pero de verdad.
3. **W4** — abrirle la puerta a GERENCIA.
4. **W6 y W5** — socios y cobro: con esto la web ya cubre el mostrador, que es
   el trabajo del escritorio.
5. **W9, W13, W7, W8, W12** — lo de ADMIN (W13 y W12 esperan a la Fase 6).
6. **W10** — el portal del socio, que es la única área que no bloquea el
   reemplazo del escritorio.

Recién después de 4 tiene sentido volver a hablar del escritorio como envoltorio
de la web (`ARQUITECTURA-APPS.md` §5).

## 6. Tickets que caen del lado del backend

Los que aparecieron al escribir esto están especificados en
`2026-09-15-fase6-backend-para-la-web.md`:

- **F6.2 `GET /api/v1/usuarios`** — sin esto, W7 no se puede hacer.
- **F6.3 filtro por fechas en `GET /pagos`** — sin esto, W13 no se puede hacer.
- **F6.1 anulación de pagos** — sin esto, W12 no se puede hacer.
- **F6.5 el plan vigente del socio** — sin esto, W10 muestra el plan hardcodeado.
- **F6.4** restringe `PATCH /clientes/{id}/estado`: la UI de socios no debe
  ofrecer "poner en ACTIVO" a mano.

La cantidad de socios activos del dashboard (W9) no entró a la Fase 6. **Se
resolvió en la Fase 9** (`GET /dashboard/socios`, pedido B5) y la tarjeta
volvió el 2026-09-23.

### Pedidos del front después de la Fase 9

B1–B5 se resolvieron en la Fase 9 del backend
(`api\specs\2026-09-23-fase9-pedidos-del-front.md`).

#### B6 — La serie de ganancias por mes en una sola llamada (solo ADMIN)

**Por qué.** El gráfico de ingresos del dashboard (paso 6) muestra los últimos
12 meses, y hoy lo arma con **12 peticiones** a `ganancias-mensuales`, una por
mes. Funciona y queda en cache, pero es tráfico de más, y el front tiene que
decidir qué pasa si falla una (hoy: falla la serie entera).

**No es un endpoint de registros.** Uno de registros ya existe —
`GET /pagos?desde=&hasta=`, que usa el desglose de W13— y no sirve para esto:
traería cientos de pagos paginados para sumar 12 números, y la regla de qué
cuenta como ingreso (sin anulados, por `fechaPago`) pasaría a vivir también en
el front. Los totales los calcula el backend.

**Contrato propuesto.**

```
GET /api/v1/dashboard/ganancias-por-mes?desde=2025-10&hasta=2026-09
```

```jsonc
// 200 — una lista, un elemento por mes, del más viejo al más nuevo
[
  { "anio": 2025, "mes": 10, "totalGanancias": 420000, "cantidadPagos": 12 },
  { "anio": 2025, "mes": 11, "totalGanancias": 0,      "cantidadPagos": 0  },
  // ...
  { "anio": 2026, "mes": 9,  "totalGanancias": 215000, "cantidadPagos": 6  }
]
```

Reglas:

- **Solo ADMIN.** Ya lo cubre la regla de ruta de `/api/v1/dashboard/**`;
  GERENCIA y CLIENTE reciben 403.
- **Cada elemento es un `GananciasMensualesResponse`**, el DTO que ya existe:
  el front no cambia de tipos.
- **Todos los meses del rango, también los que dan cero.** Si un mes sin
  cobros no viene, el gráfico no puede distinguir "no hubo cobros" de "faltó
  el dato". Rellenar los huecos es del backend.
- **La misma regla que `ganancias-mensuales`**: sin anulados, por `fechaPago`
  del primer al último día del mes. Idealmente las dos salen del mismo método
  del service, para que un mes sume lo mismo en los dos endpoints.
- **`desde` y `hasta` en formato `AAAA-MM`**, los dos inclusive. Sin
  parámetros: los últimos 12 meses hasta el actual, con el "hoy" de Argentina
  (el `Clock` de la Fase 9).
- **400 con `mensaje`** si `desde` es posterior a `hasta`, si el formato no es
  `AAAA-MM`, o si el rango pasa de un **tope** (sugerido: 24 meses). Sin tope,
  alguien puede pedir cincuenta años.

**Implementación.** Dos caminos válidos: un bucle en el service que reutilice
el cálculo de un mes (12 consultas, pero dentro del servidor y sin duplicar la
regla), o un solo `GROUP BY` año/mes. Con el volumen de un gimnasio alcanza el
primero.

**Tests sugeridos.** Un mes sin cobros viene en cero y no falta; un pago
anulado no suma; la suma de un mes coincide con `ganancias-mensuales` de ese
mes; rango invertido, mal formado y de más de 24 meses → 400; GERENCIA → 403.

**Impacto en el front.** Cambia solo `useGananciasDeMeses` en
`features/dashboard/hooks.ts`: de 12 consultas a una, y se va la lógica de
"si falla una, falla todo". El gráfico, la tabla y los estados no cambian.
`CONTRATO-API.md` se actualiza con el endpoint nuevo.

#### B7 — `sort` con un campo inexistente responde 500 (debería ser 400)

**Qué pasa.** Los listados paginados (`/clientes`, `/pagos`, `/usuarios`)
reciben el `Pageable` de Spring, que acepta `?sort=campo,dir`. Con un campo que
no existe en la entidad (`/clientes?sort=noExiste,asc`), el backend responde
**500** "Ocurrió un error inesperado en el servidor". Verificado el 2026-09-23
contra el backend local. Viene de la `PropertyReferenceException` de Spring
Data, que el `GlobalExceptionHandler` no captura y termina en el handler
genérico.

**Por qué importa aunque la web no lo dispare.** El front solo manda campos de
una lista cerrada (`ORDENABLES_*` en cada `api.ts`), así que la web no llega
nunca a este caso. Pero un parámetro mal escrito es un error del que llama, no
del servidor: un 500 ensucia los logs, dispara alertas que no son y esconde los
500 de verdad. Y el escritorio o cualquier otro cliente puede mandarlo.

**Qué se pide.**

- **400 con `mensaje`** que nombre el campo, por ejemplo: "No se puede ordenar
  por 'noExiste'". Mismo cuerpo que el resto (`ErrorResponse`).
- Opcional, y mejor: una **lista blanca** de campos ordenables por endpoint,
  para no exponer a través de `sort` nombres internos de la entidad (o
  relaciones que disparen joins caros, como `cliente.pagos`).

**Implementación.** Un `@ExceptionHandler(PropertyReferenceException.class)` en
`GlobalExceptionHandler` que devuelva 400 alcanza para lo primero. La lista
blanca, si se hace, va en cada controller o en un validador del `Pageable`.

**Tests sugeridos.** `GET /clientes?sort=noExiste,asc` → 400 con el nombre del
campo en `mensaje`; un `sort` válido sigue ordenando; lo mismo en `/pagos` y
`/usuarios`.

**Impacto en el front.** Ninguno en el código. `CONTRATO-API.md` §3
("Paginación") cambia "un campo inexistente responde 500" por el 400.

#### B8 — El backend detrás de la web publicada en Vercel (casi todo configuración)

**Contexto.** Paso 8.0 (2026-09-24): la web se publica en **Vercel** y le pide
el API **a su propio dominio**; `vercel.json` reenvía `/api/*` al backend en
Render. Se eligió así, y no con web y API en dominios distintos, porque en ese
caso la cookie de refresh es **de tercero** y Safari la bloquea: un socio con
iPhone perdería la sesión con cada F5. Detrás del proxy la cookie queda del
dominio de la web, que es lo que ya asumía `STACK.md` §6.

**Lo que se verificó del código** (`UsuarioController.agregarCookieRefresh`,
`application.properties`, `RateLimitFilter`): la cookie no fija `Domain` y usa
`path=/`, así que detrás del proxy funciona sin cambios; `SameSite` y `Secure`
ya salen de variables de entorno.

Lo que se pide, de más urgente a menos:

1. **Rate limit del login por IP: ya está roto hoy en producción.**
   `RateLimitFilter` usa `request.getRemoteAddr()` y no lee `X-Forwarded-For`
   (lo dice su propio comentario). Pero Render **ya es un proxy** delante de
   la app, así que `getRemoteAddr()` es la IP del balanceador de Render: **todos
   los usuarios comparten el mismo balde de 5 intentos por minuto**, y un socio
   que se equivoca cinco veces le bloquea el login al mostrador. Con Vercel
   delante sigue igual.
   - Arreglo: tomar la IP del cliente de `X-Forwarded-For`.
   - **Ojo con la falsificación**: el backend también se puede llamar directo
     en `*.onrender.com`, salteando Vercel, y ahí el cliente puede mandar el
     header que quiera. Hay que decidir de qué proxy se confía (qué posición
     de la lista se toma) y dejarlo escrito. Aceptar esa limitación
     documentada es una decisión válida para el tamaño de esta app; lo que no
     es válido es el balde compartido de hoy.
   - Tests: dos IPs distintas en `X-Forwarded-For` tienen baldes separados.
2. **`CORS_ALLOWED_ORIGINS`**: agregar el origen de la web publicada
   (`https://<proyecto>.vercel.app`, y el dominio propio si se usa), sin sacar
   `http://localhost:5173`. Con el proxy el navegador no hace un pedido
   cruzado, pero Vercel reenvía el header `Origin` y el filtro de CORS de
   Spring rechaza un origen que no conoce con **403 "Invalid CORS request"**.
   Si el login desde la web publicada da ese 403, es esto.
3. **`REFRESH_COOKIE_SAMESITE=Lax`** (recomendado, solo variable de entorno).
   `None` era para el caso cruzado. Con la web y el API en el mismo sitio,
   `Lax` alcanza y suma protección contra CSRF. `REFRESH_COOKIE_SECURE` sigue
   en `true`.
4. **Cold start de Render (decisión del dueño).** En el plan gratis Render
   duerme el servicio sin tráfico; medido el 24/09, **la primera petición tardó
   más de 90 segundos**, y la siguiente 0,27 s. Detrás de Vercel esa primera
   petición puede cortarse antes. El front ya lo muestra como "no se pudo
   conectar" y reintentar funciona, pero la primera persona del día lo va a
   ver. Opciones: un ping periódico a `/ping` (un cron externo cada ~10
   minutos) o el plan pago de Render. Documentar la que se elija en
   `DESPLIEGUE.md`.

**Impacto en el front.** Ninguno en el código: ya está hecho del lado de la
web (`vercel.json`, `VITE_API_URL` vacía en producción, proxy de Vite para
`pnpm dev:prod`).

#### B9 — El filtro JWT no debería validar el Bearer en los endpoints públicos de auth — RESUELTO en el backend el 2026-09-25 (sin commitear)

**Qué pasa.** `JwtAuthenticationFilter` valida cualquier `Authorization: Bearer`
que llegue, sin `shouldNotFilter`, así que en una ruta `permitAll` un token
vencido corta con **401** antes del controller. En `/usuarios/logout` y
`/clientes/logout` eso significaba que el logout no revocaba nada: la web
mandaba el Bearer, y con más de 30 minutos sin uso la cookie de refresh
sobrevivía. En la PC compartida del mostrador, el siguiente entraba con F5 como
la persona anterior (encontrado en la revisión de seguridad del 25/09).

**Del lado del front ya está resuelto**: el logout no manda `Authorization`
(`auth/api.ts`). Lo que se pide es que el backend no dependa de eso:

- `shouldNotFilter` (o ignorar un token inválido) en login, refresh, logout y
  registro de los dos portales. Un Bearer vencido en una ruta pública no es
  motivo para rechazarla.
- Test: `POST /usuarios/logout` con un Bearer vencido y la cookie → 200, y la
  cookie queda revocada.

**Impacto en el front.** Ninguno.

**Cómo se resolvió** (revisión del backend del 25/09): el filtro ya no corta
la request con un token inválido; la deja seguir como anónima y decide la regla
de `SecurityConfig`. En una ruta protegida sigue siendo 401 con "Token inválido
o expirado" (el entry point lo distingue con un atributo de la request), así que
el interceptor del front no cambia. Es más general que `shouldNotFilter` en
cuatro rutas: sirve para cualquier ruta pública.
