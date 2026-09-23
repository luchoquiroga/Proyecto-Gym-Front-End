# Contrato del API: todo lo que el front necesita saber del backend

Fecha: 2026-09-18
Estado: vigente — refleja el backend después de sus 8 fases de replanteo
(última: `documento` del socio obligatorio y único, commit `57a5b2d`)

## 0. Qué es esto y qué NO es

Esto es un **resumen derivado**, escrito para que trabajar en el front no exija
abrir el repo del backend en cada duda. No es la fuente de verdad.

| Pregunta | Fuente de verdad real |
|---|---|
| ¿Quién puede llamar a este endpoint? | `api\specs\AUTHZ-MATRIX.md` |
| ¿Qué campos exactos tiene este DTO? | `/swagger-ui/index.html` del backend corriendo (`/v3/api-docs`) |
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

### Rate limit

Los dos `/login` están limitados a **5 intentos por minuto por IP**. Al pasarse:
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
| 400 | validación o regla de negocio (monto menor al plan, estado no aceptado) | mostrar `mensaje` / pintar `errores` |
| 401 | sin token o vencido | el interceptor intenta refresh; si falla, a login |
| 403 | el rol no alcanza | **mostrarlo, no tragarlo**: significa que la pantalla y los permisos se desincronizaron |
| 404 | no existe (el mensaje suele contener "no encontrado") | mensaje en pantalla |
| 409 | duplicado (documento, email, nombre de usuario) o borrado bloqueado | mensaje en pantalla, generalmente sobre un campo |
| 429 | rate limit de login | mensaje propio |

---

## 3. Superficie completa del API

Todo cuelga de `/api/v1`. Roles: quién puede llamar. `auth` = cualquiera
autenticado.

### Socios — `/clientes`

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| GET | `/clientes` | ADMIN, GERENCIA | paginado (`?page=&size=`, default 20). Devuelve `PaginaResponse<ClienteResponse>` |
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
  "documento": "12345678", "estado": "INACTIVO", "codigoActivacion": "A7F3K9" }
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
| GET | `/pagos?desde=&hasta=&page=&size=` | **solo ADMIN** | fechas ISO (`2026-09-01`). `PaginaResponse<PagoResponse>` |
| GET | `/pagos/{id}` | **solo ADMIN** | |
| GET | `/pagos/cliente/{clienteId}` | **solo ADMIN** | lista plana |
| POST | `/pagos` | ADMIN, GERENCIA | cobrar |
| POST | `/pagos/{id}/anulacion` | **solo ADMIN** | body `{motivo}`, obligatorio, máx. 300 |

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
- **El período nuevo arranca en `fechaPago`, no a continuación del vigente**:
  `fechaVencimiento = fechaPago + plan.duracion`. Cobrarle antes de tiempo a un
  socio al día le hace perder los días que se superponen. El vencimiento del
  socio es el **mayor** entre sus pagos válidos (verificado en
  `PagoServiceImpl.registrarPago` y `PagoRepository`, 22/09).
- **Un pago retroactivo cuyo período ya terminó responde 201, no 400**: se
  registra, pero no activa al socio (solo activa si el vencimiento es posterior
  a hoy). La UI no lo tiene que mostrar como error, o se cobra dos veces.
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

No hay `GET /planes/{id}` ni búsqueda: con un puñado de planes, el listado ya es
la pantalla. `DELETE` es el **único** borrado real del API, y devuelve 409 si el
plan ya tiene pagos.

### Staff — `/usuarios`

| Método | Ruta | Rol | Notas |
|---|---|---|---|
| GET | `/usuarios?page=&size=` | ADMIN | **incluye las cuentas dadas de baja**; `activo` las distingue |
| POST | `/usuarios` | ADMIN | `{nombre, contrasena, rol}` → 201 `UsuarioResponse` |
| PUT | `/usuarios/cambiar-contrasena` | ADMIN, GERENCIA | la **propia**; `{contrasenaActual, nuevaContrasena}` (mín. 8) |
| PUT | `/usuarios/{id}/contrasena` | ADMIN | reset de **otra** cuenta; `{nuevaContrasena}`. Contra uno mismo → error |
| PATCH | `/usuarios/{id}/activo` | ADMIN | `{activo: true|false}`. Es la baja **y** la reactivación |

`UsuarioResponse`: `{ "id": 1, "nombre": "admin", "rol": "ADMIN", "activo": true }`.

El backend rechaza auto-darse de baja y dar de baja al último ADMIN activo (400
con mensaje). Son mensajes para mostrar, no casos a prevenir adivinando.

### Dashboard — `/dashboard` (solo ADMIN)

`GET /dashboard/ganancias-mensuales?anio=&mes=` (sin params = mes en curso):

```jsonc
{ "anio": 2026, "mes": 9, "totalGanancias": 485000, "cantidadPagos": 32 }
```

Es un **agregado de un mes**. El desglose del mes (los pagos uno por uno, como
pide el alcance del dashboard) sale de `GET /pagos?desde=&hasta=`.

### Paginación — vale para `/clientes`, `/pagos` y `/usuarios`

```jsonc
{ "contenido": [ ... ], "pagina": 0, "tamanio": 20, "totalElementos": 137, "totalPaginas": 7 }
```

`page` arranca en **0**. Los nombres están en castellano y no son los de Spring
(`content`/`number`/`size`): es un DTO propio, no serializa `Page`.

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
- Detalle completo: `api\specs\DESPLIEGUE.md`.
