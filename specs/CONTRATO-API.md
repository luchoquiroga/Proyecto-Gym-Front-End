# Contrato del API: todo lo que el front necesita saber del backend

Fecha: 2026-09-18
Estado: vigente — refleja el backend después de sus 9 fases
(última: Fase 9, los pedidos del front B1–B5, commit `9c47895`) **más la
revisión de seguridad y casos borde del 25/09** (B9 y los topes de §3), que al
escribir esto está en el working tree de `RamaLuciano` del backend, sin commitear

**El "hoy" del backend es el de Argentina** (Fase 9, B1): un `Clock` con zona
`America/Argentina/Buenos_Aires` decide la fecha de un cobro sin `fechaPago`,
el mes en curso del dashboard y la corrida de vencimientos (a medianoche de
Argentina). El front calcula "hoy" en el navegador, que en el gimnasio es la
misma zona.

## 0. Qué es esto y qué NO es

Esto es un **resumen derivado**, escrito para que trabajar en el front no exija
abrir el repo del backend en cada duda. No es la fuente de verdad.

| Pregunta | Fuente de verdad real |
|---|---|
| ¿Quién puede llamar a este endpoint? | `api\specs\AUTHZ-MATRIX.md` |
| ¿Qué campos exactos tiene este DTO? | `http://localhost:8080/swagger-ui/index.html` del backend **local** (`/v3/api-docs`). En producción (Render) Swagger está apagado desde el 25/09 |
| ¿Por qué el backend hace esto así? | `api\specs\2026-09-15-replanteo-backend.md` |

Repo del backend: `C:\Users\lucia\IdeaProjects\api`.

**Si este archivo y el backend no coinciden, el equivocado es este archivo.**
Cuando pase, corregilo acá mismo y anotalo en `BITACORA.md` — no lo "arregles"
adaptando el front a algo que el backend no hace.

Mientras el backend corre en local, la forma más rápida de verificar cualquier
cosa de acá es `http://localhost:8080/swagger-ui/index.html`.

---

## 1. Las dos autenticaciones

El backend tiene **dos tipos de principal completamente separados**. No es un
detalle de implementación: es la decisión que ordena todo el auth del front.

| | Staff | Socio |
|---|---|---|
| Entidad | `Usuario` (tabla `usuarios`) | `Cliente` (tabla `clientes`) |
| Roles | `ADMIN`, `GERENCIA` | no tiene rol; el token lleva `rol=CLIENTE` como claim |
| Login | `POST /api/v1/usuarios/login` con `{nombre, contrasena}` | `POST /api/v1/clientes/login` con `{email, contrasena}` |
| Refresh | `POST /api/v1/usuarios/refresh` | `POST /api/v1/clientes/refresh` |
| Logout | `POST /api/v1/usuarios/logout` | `POST /api/v1/clientes/logout` |
| Cookie de refresh | `refreshToken` | `clienteRefreshToken` |
| Identificador de login | el **nombre** de usuario | el **email** |

Los ids **se solapan**: `usuarios` y `clientes` son dos secuencias distintas que
las dos arrancan en 1, así que el socio 4 y el empleado 4 no tienen nada que ver.
Nunca compares un id sin saber de qué tabla es.

### Esquema de tokens (idéntico en los dos flujos)

- El **access token** viaja en `Authorization: Bearer <token>` y dura **30
  minutos**. Vive en memoria (zustand), nunca en `localStorage`.
- El **refresh token** viaja solo en una cookie **HttpOnly** que el JS no puede
  leer. Por eso todas las llamadas van con `withCredentials: true`.
- `/refresh` **rota** el refresh token: el anterior queda invalidado. Dos
  refresh en paralelo con la misma cookie → el segundo falla. De ahí que el
  interceptor tenga cola y un solo refresh en vuelo.
- Un refresh token **no sirve como access token**: el filtro lo rechaza fuera de
  `/refresh`.

### Respuestas de auth

```jsonc
// POST /usuarios/login  → 200
{ "mensaje": "...", "accessToken": "ey...", "usuario": { "id": 1, "nombre": "admin", "rol": "ADMIN", "activo": true } }
// POST /usuarios/refresh → 200
{ "accessToken": "ey...", "usuario": { ... } }

// POST /clientes/login → 200
{ "mensaje": "...", "accessToken": "ey...", "cliente": { ...ClienteResponse } }
// POST /clientes/refresh → 200
{ "accessToken": "ey...", "cliente": { ...ClienteResponse } }
```

Ojo con dos asimetrías reales (no las normalices en el front, esperalas):

- La clave del principal es **`usuario`** en staff y **`cliente`** en socio.
- Credenciales incorrectas devuelven 401 con cuerpos distintos: staff manda
  `{mensaje, status}`, socio manda `{mensaje}`.

### Logout: sin `Authorization`

Los dos `/logout` son públicos y solo leen la cookie, así que el front **no les
manda el Bearer**. Hasta el 25/09 era obligatorio: el filtro JWT del backend
validaba cualquier Bearer, también en rutas públicas, y con el access token
vencido respondía **401 antes de llegar al logout**, así que la cookie
sobrevivía. **B9 lo arregló del lado del backend**: un token inválido sigue como
anónimo y decide la regla de la ruta; en una ruta protegida sigue siendo 401 con
"Token inválido o expirado", así que para el interceptor no cambia nada. El front
igual no manda el Bearer: no lo necesita. Sin cookie, el logout responde 200, así
que el front cierra siempre los dos portales.

### Rate limit

Los dos `/login` y **`/clientes/registro`** (desde el 25/09: cada intento
prueba un código de activación) están limitados a **5 intentos por minuto por
IP**, cada uno con su propio contador. Al pasarse:
`429` con `{"status":429,"mensaje":"Demasiados intentos, esperá un minuto"}`.
La pantalla de login tiene que mostrar ese mensaje, no "credenciales
incorrectas".

---

## 2. Forma de los errores

Todo lo que sigue sale del `GlobalExceptionHandler` del backend.

```jsonc
// 400 por validación de campos — EL MÁS IMPORTANTE PARA LOS FORMULARIOS
{
  "status": 400,
  "mensaje": "Datos inválidos",
  "errores": { "documento": "El documento es obligatorio", "nombre": "..." },
  "timestamp": "2026-09-18T10:00:00"
}

// 400 / 404 / 403 / 409 / 500 por regla de negocio
{ "status": 409, "mensaje": "Ya existe un socio con ese documento", "timestamp": "..." }
```

**`errores` es un mapa `campo → mensaje` con el nombre exacto del campo del
DTO.** Eso es lo que hace barato mapear el error del servidor al campo del
formulario con `setError(campo, { message })` de react-hook-form. Cuando el 400
trae `errores`, se pintan los campos; cuando no, se muestra `mensaje` arriba.

| Status | Qué significa acá | Qué hace el front |
|---|---|---|
| 400 | validación o regla de negocio (monto menor al plan, estado no aceptado). Desde el 25/09 también: JSON mal formado, un enum que no existe o una fecha imposible ("El cuerpo de la solicitud es inválido o está mal formado"), y un parámetro obligatorio que falta ("Falta el parámetro obligatorio '…'"); antes eran 500 | mostrar `mensaje` / pintar `errores` |
| 401 | sin token o vencido | el interceptor intenta refresh; si falla, a login |
| 403 | el rol no alcanza | **mostrarlo, no tragarlo**: significa que la pantalla y los permisos se desincronizaron |
| 404 | no existe (el mensaje suele contener "no encontrado"). Una ruta inexistente también es 404 desde el 25/09, con "El recurso solicitado no existe" (antes 500) | mensaje en pantalla |
| 405 / 415 | método HTTP equivocado, o un `Content-Type` que no es JSON (desde el 25/09; antes 500). Son errores de programación del front, no del usuario | mensaje en pantalla |
| 409 | documento de socio duplicado. **Ojo:** el borrado de un plan con pagos es **400**, no 409 (corregido el 25/09); el email repetido del registro y el nombre de usuario repetido del staff son **400**, no 409 | mensaje en pantalla, generalmente sobre un campo |
| 429 | rate limit de login y del registro del socio | mensaje propio |

---

## 3. Superficie completa del API

Todo cuelga de `/api/v1`. Roles: quién puede llamar. `auth` = cualquiera
autenticado.

### Socios — `/clientes`

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| GET | `/clientes` | ADMIN, GERENCIA | paginado (`?page=&size=&sort=`, default 20). Devuelve `PaginaResponse<ClienteResponse>` |
| GET | `/clientes/buscar?nombre=` | ADMIN, GERENCIA | **lista plana, sin paginar** |
| GET | `/clientes/{id}` | ADMIN, GERENCIA, o el propio socio | el socio solo puede pedir su id; otro id → 403 |
| POST | `/clientes` | ADMIN, GERENCIA | 201. **Devuelve `ClienteAltaResponse`, con `codigoActivacion`** |
| PUT | `/clientes/{id}` | ADMIN, GERENCIA | cuerpo `ClienteRequest`, pero **solo aplica `nombre`, `apellido`, `telefono` y `documento`**: `email` y `contrasena` los ignora (verificado en `ClienteServiceImpl.actualizar`, 19/09) |
| PATCH | `/clientes/{id}/estado?nuevoEstado=INACTIVO` | ADMIN, GERENCIA | **query param, no body**, y solo acepta `INACTIVO` |
| POST | `/clientes/registro` | público | el socio reclama su ficha con `{codigoActivacion, email, contrasena}` |

```jsonc
// ClienteRequest (POST y PUT)
{ "nombre": "Ana", "apellido": "Pérez", "telefono": "3511234567",
  "documento": "12.345.678", "email": null, "contrasena": null }

// ClienteResponse (lo que se lee en todos lados)
{ "id": 4, "nombre": "Ana", "apellido": "Pérez", "telefono": "3511234567",
  "documento": "12345678", "email": "ana@mail.com", "estado": "ACTIVO",
  "fechaVencimiento": "2026-10-18",
  "planVigente": { "id": 2, "nombre": "Mensual" } }

// ClienteAltaResponse (SOLO en el 201 del alta)
{ "id": 9, "nombre": "...", "apellido": "...", "telefono": "...",
  "documento": "12345678", "estado": "INACTIVO", "codigoActivacion": "A7F3K9QM" }
```

Cosas que hay que saber sí o sí para las pantallas de socios:

- **`documento` es obligatorio y único**, y el backend lo **normaliza**: guarda
  `12.345.678` como `12345678` (sin puntos, espacios ni guiones, en mayúsculas).
  El front puede mandarlo con puntos; lo que vuelve es el normalizado. Dos
  socios homónimos se distinguen por acá.
  Las validaciones exactas, por si el formulario quiere avisar antes de viajar
  (verificadas el 19/09 en `ClienteRequest` y `normalizarDocumento`): máximo 20
  caracteres tal como se escribe, solo letras, números, puntos, espacios y
  guiones, y **al menos 6 caracteres ya normalizado**. No se valida contra el
  formato del DNI argentino a propósito, para que un pasaporte o una cédula
  puedan cargarse.
- **El registro del socio** (`POST /clientes/registro`) responde 200 con
  `{mensaje}` y **no inicia sesión**: después hay que pasar por `/clientes/login`.
  El código tiene **8 caracteres** en mayúsculas, sin `0/O/1/I`. Desde el 25/09
  el backend también lo normaliza (`trim` + mayúsculas); el front lo sigue
  haciendo, y además saca espacios y guiones del medio. Todos los rechazos son **400 con `mensaje`**
  —código inválido o usado, cuenta ya registrada, email de otro socio—; el email
  repetido acá es 400, no 409. **Si el email ya era de ese mismo socio** (el
  staff se lo cargó en el alta), desde el 25/09 no es un conflicto: antes se
  rechazaba y el socio no podía registrarse. La contraseña pide **entre 8 y 72
  caracteres** (el mínimo es de la Fase 9, B3; el máximo, del 25/09, porque
  BCrypt solo usa los primeros 72 bytes); el login no valida largo, así que una cuenta vieja con
  contraseña corta sigue entrando. Verificado contra el backend el 22/09.
- **El email se guarda en minúsculas y sin espacios** (desde el 25/09), y el
  login lo busca sin distinguir mayúsculas: `Juan@X.com` y `juan@x.com` son la
  misma cuenta. Un email vacío se guarda como `null`, así que dos socios sin
  email ya no chocan (antes el segundo daba 409).
- **Largos máximos** (desde el 25/09; más largo es 400 con el campo en
  `errores`, antes era un 409 engañoso): `nombre` y `apellido` 100, `telefono`
  50, `email` 150.
- **`/clientes/buscar` con el nombre vacío → 400** ("Escribí al menos una letra
  del nombre para buscar."), desde el 25/09. Antes traía a todos los socios sin
  paginar. El front solo busca con texto, así que no lo dispara.
- **`codigoActivacion` aparece una sola vez, en la respuesta del alta.** Es lo
  que el staff le entrega en mano al socio para que después se registre y entre
  al portal. La pantalla de alta **tiene que mostrarlo bien visible**: si se
  pierde esa respuesta, no hay otro endpoint que lo devuelva.
- **`fechaVencimiento` y `planVigente` vienen calculados del último pago válido
  y pueden ser `null`** (socio que nunca pagó, o cuyo único pago fue anulado).
  El front nunca los calcula ni los persiste.
- **`estado` es `ACTIVO` | `MOROSO` | `INACTIVO`.** `ACTIVO` lo determina un
  pago válido y `MOROSO` lo calcula el vencimiento: no se pueden fijar a mano.
  La única baja es `PATCH .../estado?nuevoEstado=INACTIVO`.
- **Ningún endpoint edita el email de un socio.** Es su identidad de login y hoy
  nadie lo cambia. Gap conocido, no lo inventes en el front.

### Pagos — `/pagos`

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| GET | `/pagos?desde=&hasta=&page=&size=&sort=` | **solo ADMIN** | fechas ISO (`2026-09-01`). `PaginaResponse<PagoResponse>` |
| GET | `/pagos/{id}` | **solo ADMIN** | |
| GET | `/pagos/cliente/{clienteId}` | **solo ADMIN** | lista plana |
| POST | `/pagos` | ADMIN, GERENCIA | cobrar |
| POST | `/pagos/{id}/anulacion` | **solo ADMIN** | body `{motivo}`, obligatorio, máx. 300. **400 si hay un pago encadenado después** (ver abajo) |

```jsonc
// PagoRequest — fechaPago es opcional (default: hoy)
{ "clienteId": 4, "planId": 2, "montoAbonado": 15000, "fechaPago": "2026-09-18" }

// PagoResponse
{ "id": 31, "montoAbonado": 15000, "fechaPago": "2026-09-18",
  "fechaVencimiento": "2026-10-18",
  "cliente": { "id": 4, "nombre": "Ana", "apellido": "Pérez", "documento": "12345678" },
  "plan": { "id": 2, "nombre": "Mensual" },
  "anulado": false }
```

Reglas del backend que la UI tiene que respetar:

- **No hay pago parcial:** `montoAbonado` menor al precio del plan → 400. El
  front debería avisar antes, pero el que decide es el backend.
- **Un pago no se edita ni se borra: se anula.** No existe `PUT` ni `DELETE` de
  pagos y no es un olvido. Corregir un importe = anular + volver a cobrar.
- **`registrado_por` sale del token**, nunca del body. No lo mandes.
- **`montoAbonado` es opcional**: si no va, el backend cobra el precio del plan.
  Tope: **1.000.000.000** (desde el 25/09; un `1e400` llegaba como Infinity y
  rompía la caja del mes).
- **`fechaPago` no puede ser futura → 400** "La fecha de cobro no puede ser
  posterior a hoy." (desde el 25/09; antes activaba al socio y sumaba en la caja
  de un día que no pasó). "Hoy" es el del `Clock` de Argentina.
- **Dos cobros simultáneos al mismo socio** (un doble clic) ya no parten del
  mismo vencimiento: el cobro y la anulación bloquean la fila del socio
  (`SELECT … FOR UPDATE`) desde el 25/09. Sin test de concurrencia en el
  backend. El front igual deshabilita el botón mientras cobra.
- **El cobro anticipado se encadena** (Fase 9, B2), sea cual sea el plan:

  ```
  vigente = MAX(fechaVencimiento) de los pagos válidos con fechaPago <= la del cobro
  inicio  = max(fechaPago, vigente)
  vence   = inicio + plan.duracion
  ```

  `fechaPago` sigue siendo el día en que entró la plata. Para un cobro con
  fecha de hoy, `vigente` es el `fechaVencimiento` del socio. Para uno
  **retroactivo** depende de los pagos de esa época, que GERENCIA no puede
  leer: el front no lo anticipa, lo muestra desde la respuesta.
- El vencimiento del socio es el **mayor** entre sus pagos válidos.
- **Un pago retroactivo cuyo período ya terminó responde 201, no 400**: se
  registra, pero no activa al socio (solo activa si el vencimiento es posterior
  a hoy). La UI no lo tiene que mostrar como error, o se cobra dos veces.
- **Anular un pago que tiene otro encadenado después → 400**, con un mensaje
  que nombra al pago posterior y dice que hay que anular ese primero. Es un
  pago registrado después (id mayor) y cobrado durante el período de este. No
  se recalcula nada: un pago no se edita.
- **GERENCIA cobra pero no lee ninguna lectura de pagos.** Si una pantalla de
  GERENCIA necesita saber si un socio está al día, usa `estado` +
  `fechaVencimiento` del socio, que no exponen plata.

### Planes — `/planes`

| Método | Ruta | Rol |
|---|---|---|
| GET | `/planes` | cualquier autenticado |
| POST / PUT `/{id}` / DELETE `/{id}` | | solo ADMIN |

```jsonc
// PlanRequest / PlanResponse — duracion en DÍAS, define el vencimiento del pago
{ "id": 2, "nombre": "Mensual", "precio": 15000, "duracion": 30 }
```

Validación (desde el 25/09): `nombre` obligatorio y de hasta 100 caracteres,
`precio` mayor a cero y hasta **1.000.000.000**, `duracion` mayor a cero y hasta
**3660 días** (diez años; más, el vencimiento se salía del rango de fechas de
Postgres y el primer cobro daba 500).

No hay `GET /planes/{id}` ni búsqueda: con un puñado de planes, el listado ya es
la pantalla. `DELETE` es el **único** borrado real del API (204), y devuelve
**400 con `mensaje`** si el plan ya tiene pagos, incluidos los anulados. No es
409: `PlanServiceImpl.eliminar` convierte la violación de FK en una
`IllegalArgumentException`, que el handler mapea a 400 (verificado en el código
el 25/09; antes este documento decía 409).

Editar un plan (`PUT`) no toca los pagos ya registrados: cada pago guarda su
`montoAbonado` y su `fechaVencimiento`. Lo que sí cambia es el **nombre** que
muestran los pagos viejos y el `planVigente` de los socios, que lo leen del
plan. Validación: nombre obligatorio, `precio` y `duracion` mayores a cero.

### Staff — `/usuarios`

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| GET | `/usuarios?page=&size=&sort=` | ADMIN | **incluye las cuentas dadas de baja**; `activo` las distingue |
| POST | `/usuarios` | ADMIN | `{nombre, contrasena, rol}` → 201 `UsuarioResponse`. Contraseña mín. 8 |
| PUT | `/usuarios/cambiar-contrasena` | ADMIN, GERENCIA | la **propia**; `{contrasenaActual, nuevaContrasena}` (mín. 8) |
| PUT | `/usuarios/{id}/contrasena` | ADMIN | reset de **otra** cuenta; `{nuevaContrasena}`. Contra uno mismo → error |
| PATCH | `/usuarios/{id}/activo` | ADMIN | `{activo: true|false}`. Es la baja **y** la reactivación |

`UsuarioResponse`: `{ "id": 1, "nombre": "admin", "rol": "ADMIN", "activo": true }`.

Desde el 25/09: las contraseñas (alta, reset y cambio propio) van de **8 a 72
caracteres**, el nombre de usuario hasta 100, y **el nombre se guarda sin
espacios alrededor** (`"juan "` y `"juan"` no pueden ser dos cuentas).

**Alta con nombre repetido → 400, no 409**, con dos mensajes: "ya existe" si
la cuenta está activa, o "pertenece a una cuenta dada de baja. Reactivala en vez
de crear una nueva" si no (el nombre sigue ocupado). La baja **y el reset**
revocan las sesiones de esa cuenta; reactivar no cambia la contraseña. El reset
funciona también sobre una cuenta dada de baja. Verificado el 23/09.

El backend rechaza auto-darse de baja y dar de baja al último ADMIN activo (400
con mensaje). Son mensajes para mostrar, no casos a prevenir adivinando.

### Dashboard — `/dashboard` (solo ADMIN)

`GET /dashboard/ganancias-mensuales?anio=&mes=` (sin params = mes en curso):

```jsonc
{ "anio": 2026, "mes": 9, "totalGanancias": 485000, "cantidadPagos": 32 }
```

Es un **agregado de un mes**. El desglose del mes (los pagos uno por uno, como
pide el alcance del dashboard) sale de `GET /pagos?desde=&hasta=`.

`GET /dashboard/socios` (Fase 9, B5), cuántos socios hay **hoy** en cada estado:

```jsonc
{ "activos": 87, "morosos": 12, "inactivos": 38 }
```

Es una foto de hoy, no de un período: por eso es un endpoint aparte y no
depende del mes que se pida en ganancias. Cuenta el estado guardado, que la
corrida diaria mantiene al día. GERENCIA recibe 403, como en todo el dashboard.

### Paginación — vale para `/clientes`, `/pagos` y `/usuarios`

```jsonc
{ "contenido": [ ... ], "pagina": 0, "tamanio": 20, "totalElementos": 137, "totalPaginas": 7 }
```

`page` arranca en **0**. Los nombres están en castellano y no son los de Spring
(`content`/`number`/`size`): es un DTO propio, no serializa `Page`.

**`sort` también se acepta** (`?sort=apellido,asc`, repetible para desempatar:
`&sort=nombre,asc`). Los tres controllers reciben un `Pageable` de Spring y los
servicios se lo pasan tal cual al repositorio (verificado el 23/09). Dos cosas:

- Se ordena por **campos de la entidad**, no del DTO. En socios sirven
  `nombre`, `apellido`, `documento` y `estado`, pero **no `fechaVencimiento` ni
  `planVigente`**: se calculan a partir de los pagos y no son columnas de
  `clientes`. En pagos, `fechaPago`, `fechaVencimiento` y `montoAbonado`.
- Sin `sort`, el orden es el de la base (en la práctica, por id), que no está
  garantizado.
- **Un campo inexistente responde 500** (verificado el 23/09), no 400. Por eso
  el front solo manda campos de una lista cerrada por listado
  (`ORDENABLES_*` en el `api.ts` de cada feature), nunca algo que venga de un
  input o de la URL.
- Las propiedades anidadas funcionan (`sort=cliente.apellido,asc` en pagos), y
  el orden de texto no distingue mayúsculas.
- `/clientes/buscar` **no** acepta `sort`: es una lista plana.

---

## 4. Lo que NO existe (y no hay que inventarlo)

Todo esto se sacó a propósito en la Fase 7 del backend. Si una pantalla lo
necesita, no se agrega un `fetch`: se abre la discusión en el repo del backend.

- No hay `DELETE` de socios ni de staff. Las bajas son `PATCH`.
- No hay `PUT` ni `DELETE` de pagos. Solo anulación.
- No hay `GET /planes/{id}` ni `/planes/buscar`.
- Un socio **no puede leer ningún pago**, ni los propios: `/pagos/**` es de
  ADMIN por regla de ruta. El portal del socio no muestra comprobantes.
- Un socio **no edita nada**, ni sus datos de contacto ni su email.
- No hay endpoint para reenviar o reimprimir un `codigoActivacion`.

## 5. Lo que hay que tener en cuenta al desplegar

- `CORS_ALLOWED_ORIGINS` en el backend tiene que incluir el origen exacto de la
  web. En local el default es `http://localhost:5173`, así que **el dev server
  tiene que correr en ese puerto**.
- En producción la cookie de refresh sale `SameSite=None; Secure`, o sea que la
  web tiene que estar en **https** para que el silent refresh funcione.
- **En producción la web no llama al API de Render directo** (paso 8.0,
  2026-09-24): pide `/api/...` a su propio dominio y Vercel lo reenvía
  (`vercel.json`). `VITE_API_URL` va vacía, y la cookie de refresh queda del
  mismo sitio que la web, que es lo que la hace funcionar en Safari. Lo que el
  backend tiene que configurar para esto está en `TICKETS.md` §6, **B8**.
- Detalle completo: `api\specs\DESPLIEGUE.md`.
