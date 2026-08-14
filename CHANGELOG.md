# CHANGELOG.md

Historial de cambios de la plataforma.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Las
versiones son las de los Releases del proyecto, no las de `package.json`: lo que
se versiona aquí es el producto.

Este archivo **solo crece**. Una entrada publicada no se reescribe: si algo se
corrigió después, se anota en la versión que lo corrigió.

Cada versión enlaza su documento de alcance y, cuando existe, su resumen en
`docs/releases/`.

---

## [0.8.0] — 14/08/2026 — Data Provider

Alcance: [RELEASE_0.8_DATA_PROVIDER.md](RELEASE_0.8_DATA_PROVIDER.md).

Tickets deja de funcionar con datos inventados dentro del frontend. La plataforma
puede consumir proveedores distintos —hoy solo el simulado— sin que la interfaz
conozca ninguno, y las conexiones se administran desde la propia aplicación.

### Añadido

- **Módulo Tickets en NestJS**: nueve endpoints con las dos puertas de
  autorización, servicio con todas las reglas de negocio y proveedor simulado
  detrás del Repository. Tickets deja de ser el único módulo sin backend.
- **`TicketProviderRegistry`**: el origen de los tickets se resuelve **por
  petición** en lugar de al arrancar, porque cada proyecto puede vivir en un
  proveedor distinto. Ver [ADR 0003](docs/adr/0003-registro-de-proveedores-de-datos.md).
- **Fuentes de datos administrables** (`/settings`): modelo `DataSource` en
  PostgreSQL, CRUD completo y "Probar conexión". El formulario dibuja los campos
  que declara cada proveedor, así que añadir uno no obliga a tocar React.
- **Credenciales cifradas con AES-256-GCM**, con `DATA_SOURCE_ENCRYPTION_KEY`
  validada al arrancar. Nunca vuelven al frontend: la API responde
  `hasCredentials` y nada más.
- **Columnas configurables por proyecto**: diez estándar más veinte espacios
  adicionales con nombre visible, tipo de dato, orden y visibilidad propios. La
  estructura la declara la fuente de datos, no el código.
- **`metadata` en el ticket**: los datos que un proveedor entrega y el modelo no
  nombra dejan de perderse. Se pueden mostrar, ordenar, filtrar y agrupar.
- **Modo servidor en la tabla**: buscar, ordenar, filtrar y paginar los resuelve
  el origen. El framework lo soportaba desde el Release 0.5 y nunca se había
  ejercitado.
- **Contratos nuevos**: `DataQuery`, `TicketColumnConfig`, `TicketColumnMapping`,
  `DataSourceSummary`, `DataSourceProviderDefinition` y los esquemas del CRUD.
- **Permisos** `data-sources.view/create/edit/delete`, dentro del módulo
  Configuración.

### Cambiado

- **El frontend consume la API.** `httpTicketProvider` sustituye al origen
  simulado, que se retiró entero junto con sus datos y sus reglas.
- **El actor de las operaciones lo toma el backend del token.** El frontend ya no
  puede decir quién hizo algo, que es la diferencia entre una auditoría y un campo
  de texto.
- **Las columnas de Tickets se construyen desde el catálogo compartido** en lugar
  de escribirse a mano. El orden pasó a ser el del catálogo y apareció la columna
  Zona, oculta por defecto.
- **Los operadores de filtro viven en los contratos.** En modo servidor un filtro
  viaja a la API, y declararlos en dos sitios permitía ofrecer un operador que el
  servidor no sabe interpretar.
- **El módulo Configuración tiene pantalla**: su `route` deja de ser nula.
- La búsqueda ignora acentos: "clinica" encuentra "Clínica Santa Fe".

### Retirado

- `features/tickets/mocks/` y `mock-ticket.provider.ts` del frontend. Los datos de
  prueba que necesitan las pruebas viven ahora en `src/test/`, donde no puede
  consumirlos ningún componente.
- El interruptor "Simular fallo" de la pantalla de Tickets, que existía para poder
  ver el estado de error sin un origen real.

### Corregido

- `token.service.spec.ts` construía un `JwtPayload` sin `modules`, obligatorio
  desde el Release 0.6. Estaba oculto por un `dist` de contratos desfasado.

### Notas

- Comprobado en un navegador real contra la API y PostgreSQL.
- **Hay que volver a iniciar sesión**: el release añade cuatro permisos y un token
  emitido antes no los lleva.
- `DATA_SOURCE_ENCRYPTION_KEY` es obligatoria. Sin ella la API no arranca.

---

## [0.7.0] — 31/07/2026 — Ticket Workspace

Alcance: [RELEASE_0.7_TICKET_WORKSPACE.md](RELEASE_0.7_TICKET_WORKSPACE.md).

El Ticket pasa a ser el centro del sistema: la tabla solo sirve para localizarlo y
toda la operación ocurre en su espacio de trabajo. Sigue sin integrarse Baserow.

### Añadido

- **Pantalla del ticket** (`/tickets/:id`) con cinco secciones con nombre y sin
  pestañas: información general, timeline, auditoría, intervención y acciones.
- **Cabecera reutilizable** del ticket con número, estado, prioridad, cliente,
  sucursal, zona, técnico y fecha de creación.
- **Timeline operativo**: qué ocurrió, quién y cuándo, de lo más reciente a lo más
  antiguo. El contrato ya transporta posición y adjuntos —GPS y fotografías—,
  declarados y sin implementar.
- **Auditoría** del ticket como sección independiente del timeline: campo, valor
  anterior, valor nuevo, usuario, fecha y hora. Solo lectura.
- **Acciones del coordinador**: asignar o reasignar técnico, cambiar prioridad y
  agregar observación, con la infraestructura de formularios compartida y validadas
  con los esquemas del contrato.
- **Flujo guiado del técnico**: seis pasos y una sola acción disponible en cada
  momento, derivada de lo ya completado con `nextWorkflowStep`. Cada paso deja
  rastro en el timeline y, si mueve el estado, en la auditoría.
- **`rowNavigation` en el framework de tablas**: la fila entera lleva a la pantalla
  del registro, con foco, teclado y nombre accesible, y sin que un clic en la
  casilla de selección o en el menú de acciones navegue.
- **`TicketRepository` y `mockTicketProvider`**: el contrato que consumen los hooks
  y su implementación sobre el origen simulado. `ticket-repository.ts` es el único
  sitio donde se decide de dónde salen los tickets.
- **Contratos nuevos**: `TicketDetail`, `TicketEvent`, `TicketFieldChange`,
  `TicketWorkflowStep` y los esquemas de las tres acciones del coordinador.
- **Infraestructura compartida**: `DetailField` y `DetailFieldList` para fichas de
  solo lectura, `DetailSection` para secciones con nombre, `Textarea`, y `asChild`
  en `Card`.

### Cambiado

- **La tabla de Tickets ya no ejecuta acciones.** Se retiró el menú de fila; pulsar
  la fila abre el ticket. Las tarjetas conservan su botón "Ver detalle" y llevan al
  mismo sitio.
- **El origen simulado guarda estado y aplica reglas.** Qué estado sigue a qué paso
  y qué se registra lo decide el origen, no React (ver AGENTS.md), y la tabla y el
  detalle leen del mismo sitio: cambiar la prioridad en el detalle se ve en la tabla.
- **Los colores de estado y prioridad viven en un solo componente**
  (`TicketStatusBadge`, `TicketPriorityBadge`). Antes se repetían en las columnas y
  en las tarjetas, y la cabecera habría sido la tercera copia.
- **`tickets.edit` se aplica de verdad**: sin ese permiso el ticket se consulta pero
  no se opera.

### Notas

- Comprobado en un navegador real antes de integrar en `main`.
- El estado del origen simulado vive en memoria y se pierde al recargar.

---

## [0.6.1] — 31/07/2026 — Estabilización

Alcance: `SPRINT_0.6.1_STABILIZATION.md`. Sin funcionalidad nueva: cierra las deudas
pequeñas antes de empezar el módulo principal de Tickets.

### Cambiado

- **Toda fecha visible pasa por el componente `DateTime`.** El adaptador de
  columnas renderiza las fechas con él en lugar de convertirlas a texto, y las
  tarjetas de Tickets dejaron de tener su propio formateador. `formatCellValue` y
  el texto contra el que comparan los filtros delegan en `formatDateTime`, así que
  el formato de fecha existe en un solo archivo.
- **`useViewMode()` ya no mira el nombre del rol.** Decide con el servicio de
  autorización: quien accede a Usuarios o a Seguridad administra la plataforma y
  ve la tabla; quien no, en pantalla pequeña ve tarjetas. El motivo pasó de
  `tecnico-en-movil` a `movil-sin-administracion`. Para los tres roles de la
  semilla el resultado es idéntico al anterior.
- **El formulario de usuario preselecciona el rol por identificador.** `UserSummary`
  incorpora `roleIds`; antes se buscaba por nombre y renombrar un rol dejaba el
  selector en blanco.
- **Una sola pantalla de acceso denegado.** Las páginas que negaban con una alerta
  roja ahora usan el mismo 403 que la protección de rutas: la misma situación se ve
  igual, la deniegue la ruta o la pantalla.

### Retirado

- `MODULES` y `ModuleName` de los contratos: `APP_MODULES` ya cubría lo mismo y
  tener dos catálogos de módulos invitaba a divergir. Los valores almacenados no
  cambian.
- `groupPermissionsByModule`, `IMPLEMENTED_APP_MODULES` e `isEmptyDiff`: sin
  consumidores fuera de sus propias pruebas.
- Los identificadores de tabla de las pantallas retiradas (`roles`, `permissions`)
  y uno que nunca se usó (`activity-logs`).

### Notas

- Docker queda marcado oficialmente como **Deferred**: se validará en el primer
  despliegue. Ver [TECH_DEBT.md](TECH_DEBT.md).

---

## [0.6.0] — 31/07/2026 — Administración de accesos

Alcance: `RELEASE_0.6_ACCESS_CONTROL.md`. Commit: `58ee086`.

Convierte la autorización en algo administrable desde la aplicación, con
trazabilidad obligatoria.

### Añadido

- **Módulo Seguridad** (`/security`) como única fuente de verdad de la
  autorización: roles, acceso a módulos, permisos por acción y auditoría en una
  sola pantalla de dos paneles.
- **Autorización de dos niveles.** El acceso a un módulo decide si existe para el
  rol; los permisos, qué se puede hacer dentro. Sin la primera puerta, la segunda
  no se evalúa.
- **Catálogo de once módulos** (`APP_MODULE_DEFINITIONS`), incluidos cinco que
  todavía no tienen pantalla, para poder concederlos antes de que existan.
- **`ModuleAccessGuard`** en el backend, ejecutado antes del guard de permisos.
  Devuelve 403 aunque se llame al endpoint directamente.
- **Protección de rutas en el frontend**: toda ruta privada valida el módulo antes
  de pintar y muestra una pantalla 403. El módulo se deduce de la ruta.
- **Sidebar dinámico**: un solo menú construido desde los accesos del usuario. Un
  módulo retirado desaparece sin tocar código.
- **Auditoría obligatoria.** Cambiar accesos exige un motivo, y el motivo vive en
  el contrato compartido, así que lo exigen por igual la pantalla y la API.
  Accesos y auditoría se guardan en la misma transacción.
- **Historial por rol**, solo lectura, con quién, cuándo y por qué.
- **`useAuthorization()`** con `can()` y `canAccess()` como única vía de consulta.
- **Acceso total garantizado** (`hasFullAccess`): un rol así calcula su acceso
  desde el catálogo en lugar de leerlo, recibe todo lo que exista —incluido lo que
  se añada después— y no se puede recortar ni desactivar.
- **Componente compartido `DateTime`** y su formateador puro, primer paso de la
  regla global de fechas.
- Migraciones `access_control` y `role_full_access`.

### Cambiado

- `RoleSummary` incorpora `isActive`, `modules` y `hasFullAccess`.
- `AuthenticatedUser` y `JwtPayload` incorporan `modules`.
- El store de sesión **ya no responde preguntas de autorización**: solo guarda la
  sesión. Tenerlas ahí invitaba a leer `user.permissions` desde cualquier sitio.
- La consulta de roles dejó de tener su propio Repository y delega en Seguridad,
  para que no existan dos formas de leer un rol que puedan divergir.
- Un rol desactivado deja de conceder acceso sin quitárselo a cada usuario.

### Retirado

- Pantallas `/roles` y `/permissions`, reemplazadas por Seguridad. `GET /roles`
  sigue existiendo, sin exigir el módulo Seguridad, para asignar roles a usuarios.
- La feature `permissions` del frontend y las columnas de roles, que quedaban sin
  consumidor.

### Corregido

- La sesión guardada sube de versión y se descarta al recargar. Sin esto, un token
  emitido antes del release no llevaba los módulos y la aplicación respondía 403
  en todas las pantallas.

### Pendiente dentro del release

- MVP 11 a medias: falta retirar el formateo manual de fechas dentro de features.
  Ver [TECH_DEBT.md](TECH_DEBT.md).

---

## [0.5.0] — 31/07/2026 — Product Experience

Alcance: [RELEASE_0.5.md](RELEASE_0.5.md). Commit: `f58d306`.

Convierte la plataforma en una aplicación utilizable para el negocio antes de
integrar Baserow. Quince MVP entregados.

### Añadido

- **CRUD completo de Usuarios**: crear, editar, activar y suspender. Sin eliminar.
- **Infraestructura de formularios** reutilizable: `EntityModal`, `EntityForm`,
  `FormField`, `FormFooter`.
- **BaseTable** como estándar de todas las tablas administrativas, con las diez
  capacidades pedidas más redimensionar columnas y preferencias persistidas.
- **`TableProvider`**: el motor de la tabla se comparte por contexto, de modo que
  un control dibujado al lado de la tabla puede gobernarla.
- **AdvancedTable** con panel de configuración de columnas, vistas guardadas,
  agrupaciones y constructor de filtros con los siete operadores.
- **Sistema de vistas** por usuario, guardadas en LocalStorage tras una
  abstracción que permite migrarlas a PostgreSQL.
- **Vista adaptativa**: `useViewMode()` decide por rol, tamaño de pantalla y
  —preparado— preferencia del usuario, y explica el motivo.
- **Multi vista en Tickets**: `TicketTableView` y `TicketCardView` registradas,
  consumiendo el mismo origen de datos.
- **`TicketCardView`** para técnicos en campo, optimizada para móvil.
- Arquitectura preparada para Kanban, Calendario, Timeline y Mapa, declaradas y
  sin implementar.

### Cambiado

- `DataTable` pasó a componerse de `TableProvider` + `DataTableView`, conservando
  su API pública intacta.
- Tickets usa AdvancedTable; el resto de módulos sigue con BaseTable.
- Con la tabla agrupada, el pie informa de "N registros en M grupos" en lugar de
  un rango de filas, porque las cabeceras de grupo también son filas.

### Corregido

- El recuento de la paginación contaba las cabeceras de grupo como registros.

---

## [0.4.0] — 30/07/2026 — Framework de tablas

Commit: `c52ecaa`. Alcance: [BACKLOG.md](BACKLOG.md).

- Framework interno de tablas sobre TanStack Table, con Column Registry por
  módulo: cada módulo aporta solo su archivo de columnas.
- Cuatro módulos adoptándolo sin haber modificado el componente.

---

## [0.1.0] — 30/07/2026 — Base de la plataforma

Commit: `382b916`.

- Monorepo con pnpm y TurboRepo. Ver
  [ADR 0001](docs/adr/0001-monorepo-con-pnpm-y-turborepo.md).
- Autenticación propia con JWT y refresh rotativo. Ver
  [ADR 0002](docs/adr/0002-autenticacion-jwt-con-refresh-rotativo.md).
- Backend NestJS con Repository + Provider, contratos compartidos y Swagger.
- Frontend React con TanStack Router y Query, Tailwind y shadcn/ui.
- Esquema PostgreSQL con usuarios, roles, permisos, sesiones y registro de
  actividad.
