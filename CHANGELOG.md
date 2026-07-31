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
