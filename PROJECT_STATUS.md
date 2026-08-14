# PROJECT_STATUS.md

Última actualización: 14/08/2026 (Release 0.8)

Este documento es el punto de entrada para retomar el proyecto. Responde tres
preguntas: **qué funciona hoy**, **qué falta**, y **qué hacer a continuación**.

Se actualiza al terminar cada MVP.

---

# 1. Resumen en una línea

Plataforma empresarial modular con autenticación propia, autorización de dos
niveles administrable desde una pantalla, framework de tablas reutilizable, el
Ticket como centro de la operación y una **capa de proveedores de datos
intercambiables** administrable desde la aplicación.
**Release 0.8 cerrado y comprobado en navegador. Ningún proveedor externo
implementado todavía: solo el origen simulado.**

| Métrica               | Valor                                                        |
| --------------------- | ------------------------------------------------------------ |
| Pruebas               | 839 (164 API + 595 web + 80 contratos)                       |
| `any` en el código    | 0                                                            |
| Componente más grande | Por debajo de 250 líneas                                     |
| Lint / tipos / build  | Limpios                                                      |
| Rama                  | `feature/data-provider-ticket-layer`, sin integrar en `main` |

---

# 2. Qué funciona hoy

## Se puede usar en el navegador

Arrancar con las instrucciones de [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
y entrar con `admin@redsis.com` / `Redsis2026`.

| Pantalla      | Ruta           | Estado                                                      |
| ------------- | -------------- | ----------------------------------------------------------- |
| Login         | `/login`       | Autenticación real contra la API                            |
| Panel         | `/`            | Tarjetas con datos reales (rol, permisos, total usuarios)   |
| Tickets       | `/tickets`     | **Tabla avanzada en modo servidor**: la fila abre el ticket |
| Ticket        | `/tickets/:id` | **Espacio de trabajo**: timeline, auditoría y operación     |
| Usuarios      | `/users`       | **CRUD completo**: crear, editar, activar, suspender        |
| Configuración | `/settings`    | **Fuentes de datos**: de dónde salen los tickets            |
| Seguridad     | `/security`    | **Administración de accesos** con auditoría e historial     |

Las pantallas `/roles` y `/permissions` **se retiraron** en el Release 0.6:
Seguridad las reemplaza por completo.

Cuentas de prueba existentes:

| Correo                  | Contraseña   | Rol           | Para probar                          |
| ----------------------- | ------------ | ------------- | ------------------------------------ |
| `admin@redsis.com`      | `Redsis2026` | administrador | Todo. Acceso total garantizado       |
| `supervisor@redsis.com` | `Redsis2026` | supervisor    | Que NO ve Seguridad ni entra por URL |
| `tecnico@redsis.com`    | `Redsis2026` | tecnico       | Tarjetas al reducir la ventana       |

## Backend

| Módulo         | Endpoints                                                                          |
| -------------- | ---------------------------------------------------------------------------------- |
| `auth`         | login, refresh, logout, me                                                         |
| `users`        | listar, ver, crear, actualizar, desactivar                                         |
| `roles`        | listar, ver (para asignar roles a usuarios)                                        |
| `permissions`  | listar, listar agrupado por módulo                                                 |
| `security`     | catálogo, roles, crear, actualizar, cambiar accesos, auditoría                     |
| `tickets`      | listar, columnas, técnicos, detalle, timeline, auditoría, y las cuatro operaciones |
| `data-sources` | proveedores, listar, crear, actualizar, retirar, por defecto, probar conexión      |
| `activity-log` | listar                                                                             |
| `health`       | estado del servicio y de la base de datos                                          |

Todos con Repository + Provider. Ningún servicio ni controlador inyecta Prisma.

**Tickets es la excepción a cómo se resuelve el Provider**: no se fija al arrancar
sino por petición, porque cada proyecto puede vivir en un proveedor distinto. Ver
[ADR 0003](docs/adr/0003-registro-de-proveedores-de-datos.md).

## Autorización

La autorización tiene **dos puertas** y las dos se aplican en backend y en
interfaz con la misma regla:

1. **Acceso al módulo** decide si el módulo existe para el rol. Sin él, no
   aparece en el menú, no se abre escribiendo la URL y la API responde 403.
2. **Permisos por acción** deciden qué se puede hacer dentro.

`ModuleAccessGuard` se ejecuta antes de `PermissionsGuard`. En el frontend,
`useAuthorization()` expone `can()` y `canAccess()` y es la **única** vía: el
store de sesión ya no responde preguntas de autorización, y comparar nombres de
rol está prohibido.

**Acceso total garantizado.** Un rol marcado con `hasFullAccess` calcula su acceso
desde el catálogo en lugar de leerlo de la base de datos: recibe todos los módulos
y permisos que existan, incluidos los que se añadan después. No se puede recortar
ni desactivar. La semilla marca el rol `administrador`, así que
`admin@redsis.com` no puede quedarse fuera por una configuración incompleta.

## Framework de tablas

**BaseTable** con las 10 capacidades: búsqueda global, ordenamiento, paginación,
loading, empty state, error state, selección de filas, columnas por feature,
toolbar y acciones por fila. Además redimensionar columnas y preferencias
persistidas.

**AdvancedTable** extiende BaseTable por composición, sobre un contexto de tabla
compartido (`TableProvider`). Capacidades implementadas:

| Capacidad        | Qué hace                                                      |
| ---------------- | ------------------------------------------------------------- |
| `columnSettings` | Panel lateral para mostrar, ocultar y restaurar columnas      |
| `views`          | Vistas guardadas: columnas, filtros, orden y tamaño de página |
| `grouping`       | Agrupar por una columna que el módulo declare agrupable       |
| `filters`        | Constructor visual con los siete operadores, combinados con Y |

Declaradas y **sin implementar**: `exports`, `kanban`, `timeline`, `maps`.
Activarlas avisa por consola en lugar de fallar en silencio.

## El Ticket como centro de la operación

Desde el Release 0.7 la tabla solo sirve para **localizar** un ticket: pulsar la
fila lleva a `/tickets/:id`, y ahí ocurre todo. La tabla ya no ejecuta acciones.

| Sección             | Qué hace                                                    |
| ------------------- | ----------------------------------------------------------- |
| Cabecera            | Número, estado, prioridad, cliente, sucursal, zona, técnico |
| Información general | Ficha completa del servicio, solo lectura                   |
| Timeline            | Qué ocurrió, quién y cuándo, de lo más reciente             |
| Auditoría           | Campo, valor anterior, valor nuevo, usuario, fecha y hora   |
| Intervención        | Flujo guiado del técnico: una sola acción disponible        |
| Acciones            | Coordinador: asignar técnico, prioridad, observación        |

Son secciones con nombre, no pestañas. En escritorio las acciones ocupan una
columna que acompaña al desplazamiento; en móvil la acción de la intervención queda
fija al pie, al alcance del pulgar, y no hay ninguna tabla.

**El flujo de la intervención no es el estado del ticket.** Son seis pasos
—confirmar asistencia, salir, llegué, iniciar, finalizar, cerrar— y cuál está
disponible se deriva de lo completado con `nextWorkflowStep`, en el contrato
compartido. El origen de datos rechaza cualquier otro: la interfaz ofrece uno solo,
pero quien guarda no confía en eso.

Operar exige `tickets.edit`. Quien solo consulta ve el ticket y no las acciones.

## Origen de datos de Tickets

Desde el Release 0.8 el camino completo es:

```
pantalla -> hook -> TicketRepository (contrato) -> httpTicketProvider -> API
                                                                          |
   TicketsService (todas las reglas) <- TicketProviderRegistry <----------+
                            |
        MockTicketProvider  |  RedsisOne · Baserow · ServiceNow · PostgreSQL
        (implementado)      |  (declarados, sin implementar)
```

**React no sabe de dónde vienen los datos.** Solo conoce la API; qué origen la
atiende lo decide el registro de proveedores en el backend.

Qué se puede administrar desde `/settings`:

| Concepto               | Qué es                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| Fuente de datos        | Un proyecto: un tablero concreto de un proveedor concreto                 |
| Parámetros             | Los que declara el proveedor. La pantalla los dibuja sin saber cuáles son |
| Credenciales           | Cifradas con AES-256-GCM. **Nunca vuelven al frontend**                   |
| Probar conexión        | Comprueba una configuración antes de guardarla                            |
| Estructura de columnas | Diez estándar más hasta veinte adicionales, por proyecto                  |

Las reglas del ticket —qué estado sigue a qué paso, qué se audita, qué va al
timeline— viven en `TicketsService`. Un Provider guarda lo que recibe, así que
cambiar de origen no puede cambiar el comportamiento del negocio.

**El origen simulado sigue viviendo en memoria**: sus cambios se pierden al
reiniciar la API. Es lo esperado mientras no haya proveedor real.

## Columnas por proyecto

La estructura de la tabla la declara la fuente de datos, no el código:

- **Diez columnas estándar** que corresponden a campos del contrato `Ticket`.
- **Hasta veinte adicionales** (`ColumnaAgrega1`…`ColumnaAgrega20`), cada una con
  su nombre visible, tipo de dato, orden y visibilidad. Son espacios de
  configuración, **no campos del modelo**: un proyecto que use tres tiene tres
  claves en el `metadata` del ticket.
- Nueve tipos de dato declarados; cinco con comportamiento propio (texto, número,
  booleano, fecha y hora, estado) y cuatro pendientes.

El origen simulado declara tres adicionales —"Fecha compromiso", "Tipo de
servicio" y "Número de equipo"— para que la capacidad se vea funcionando.

Lo que llega al frontend está **normalizado**: no contiene identificadores del
proveedor. El mapa entre una columna y el campo real del origen
(`TicketColumnMapping`) solo existe en el backend.

## Vista adaptativa

`useViewMode()` decide cómo se representa un módulo y devuelve `mode` y `reason`.
Considera el acceso del usuario, el tamaño de pantalla y —preparado— su
preferencia: quien accede a Usuarios o a Seguridad administra la plataforma y ve la
tabla; quien no, en pantalla pequeña ve tarjetas. **No mira el nombre del rol.**
`useIsMobile` es el único sitio que mira el tamaño de la ventana.

Tickets registra sus vistas en `features/tickets/views/`. Kanban, Calendario,
Timeline y Mapa están declarados en `ViewKind` y sin implementar.

## Infraestructura compartida

```
shared/
  components/
    form/     EntityModal, EntityForm, FormField, FormFooter
    layout/   AppShell, navigation, Forbidden
    table/    TableProvider, DataTableView, DataTable, AdvancedTable,
              ColumnSettingsPanel, ViewsBar, FilterBuilder, GroupingSelector,
              RowActions y componentes internos
    layout/   ... y DetailSection (sección con nombre de una ficha)
    ui/       Button, Badge, Card, Input, Textarea, Label, Select, Dialog,
              DropdownMenu, Checkbox, Alert, Spinner, DateTime,
              DetailField y DetailFieldList
  hooks/        useIsMobile, useViewMode, useAuthorization
  hooks/table/  useDataTable, useTablePreferences, useTableContext,
                useTableColumnSettings, useTableViews, useTableGrouping,
                useTableFilters
  lib/          apiClient, queryClient, env, utils, createId, authorization,
                viewMode, routeModule, formatDateTime, table/
  types/table/  contratos del framework
```

---

# 3. Qué falta

## Del Release 0.8

Nada de su alcance. Lo que quedó declarado y sin implementar a propósito:

- **Los cuatro proveedores externos.** RedsisOne, Baserow, ServiceNow y la base de
  datos propia están en el catálogo, con sus parámetros declarados y su sitio en el
  registro. Ninguno tiene implementación: pedirlos falla con un mensaje claro en
  lugar de caer al simulado.
- **Descubrimiento de recursos.** `supportsResourceDiscovery` está declarado y
  `DataSourceConnectionTest.resources` llega siempre vacío. Elegir un tablero de una
  lista exige antes el proveedor de RedsisOne.
- **La fuente configurada todavía no decide el origen.** El registro resuelve por
  `TICKETS_PROVIDER`; las fuentes se administran y se guardan, pero conectarlas al
  registro es el paso siguiente.
- **Cuatro tipos de dato sin comportamiento propio**: `select`, `user`, `location`
  y `currency` se muestran como texto.

## Del Release 0.7

- **GPS y adjuntos del timeline.** `TicketEvent` lleva `location` y `attachments`
  y hoy llegan siempre vacíos.
- **`tickets.create` y `tickets.delete`** siguen en el catálogo sin que ninguna
  acción los use. Depende de quién sea la fuente de verdad de los tickets.

## Módulos declarados sin construir

El catálogo declara once módulos. Cinco no tienen pantalla ni backend:
**Técnicos, Formularios, Clientes, Sucursales, Reportes**. Se les puede conceder
acceso desde Seguridad, y el menú no los dibuja hasta que existan.

## Del MVP original de la plataforma

- Integración con un proveedor real (la arquitectura está lista; falta escribirlo)
- Dashboard con gráficas (ECharts está instalado y sin usar)
- Google Maps (la librería no está instalada)
- Ajustes generales de la plataforma: `/settings` existe pero solo administra
  fuentes de datos. La tabla `settings` sigue vacía.

---

# 4. Deuda y riesgos conocidos

El detalle completo, con causa y coste estimado, está en
[TECH_DEBT.md](TECH_DEBT.md). Lo que no puede pasarse por alto al retomar:

**Docker nunca se ha construido. Aplazado (Deferred).** Por decisión del Sprint
0.6.1 se validará en el primer despliegue: el proxy TLS de la red rompe
`pnpm install` dentro del contenedor y el problema no es del proyecto. Ver
[certs/README.md](certs/README.md).

**CI nunca se ha verificado en verde.** El pipeline existe y hay repositorio con
remoto. Nadie ha comprobado el resultado.

**La clave de cifrado hay que custodiarla.** `DATA_SOURCE_ENCRYPTION_KEY` es
obligatoria y sin ella la API no arranca. Si se pierde, las credenciales guardadas
no se pueden descifrar y hay que volver a introducirlas; si se filtra, valen tanto
como los tokens que protege. En desarrollo hay una generada localmente en
`apps/api/.env`; **en despliegue hay que generar otra**.

**Esquema muerto en Prisma.** `zones`, `branches` y `user_zones` existen pero cero
código las usa. `settings` sigue vacía: las fuentes de datos tienen su propia
tabla, no son un ajuste.

**La pantalla de Seguridad no se ha visto en un navegador real.** Está cubierta
por pruebas, incluidas las reglas de acceso, pero no se ha comprobado en pantalla.

**La vista de tarjetas de Tickets tampoco.** Exige entrar con la cuenta del
técnico. El espacio de trabajo del ticket sí se comprobó al cerrar el Release 0.7,
y la tabla, el detalle y `/settings` al cerrar el 0.8.

**El estado del origen simulado vive en memoria.** Asignar un técnico o avanzar el
flujo se pierde **al reiniciar la API** —ya no al recargar la página, que era el
caso antes—. Es lo esperado mientras el origen sea simulado.

**Una columna nueva aparece visible aunque el proyecto la declare oculta**, si el
usuario ya tenía preferencias guardadas para esa tabla. El motor considera visible
toda columna que no esté en el mapa guardado. Es discutible, pero enseñar una
columna nueva molesta menos que esconderla sin que nadie sepa que existe.

## Contradicciones pendientes de decisión

**Sucursales y Zonas con agrupar y filtrar.** Se pidió que usaran el BaseTable con
agrupar y filtrar, lo que contradice el "no debe soportar" del MVP 1 del Release
0.5. No ha bloqueado nada porque esas pantallas no existen.

**`rowActions` es una función, no un `ReactNode`.** Se desvió de la
especificación porque un nodo estático no puede saber sobre qué fila actúa.

**`TECH_STACK.md` se llama `STACK.md`.** Los documentos lo citan con el otro
nombre.

**`.gitignore` no se versiona**, por decisión del propietario.

---

# 5. Próximas acciones

Recomendación por orden:

1. **Integrar el Release 0.8 en `main`.** Está terminado y comprobado, y vive en
   `feature/data-provider-ticket-layer` sin commitear.
2. **Comprobar el CI en GitHub Actions.** Es lo más barato y lo que más información
   da. Nunca se ha visto una ejecución en verde, y el 0.8 destapó que un `dist` de
   contratos desfasado ocultaba un error de compilación: construyendo desde cero
   habría fallado.
3. **Conectar la fuente configurada al registro de proveedores.** Hoy el origen lo
   decide `TICKETS_PROVIDER` y las fuentes se administran sin gobernar todavía qué
   atiende. Es el último eslabón de la cadena.
4. **Escribir el proveedor de RedsisOne.** La arquitectura está lista y su
   documentación OpenAPI está en `docs/RedsisOne-EndPoints.yaml`. Hace falta una
   respuesta de ejemplo: la exportación no trae cuerpos de respuesta, así que no se
   conoce la forma de lo que devuelve.
5. **Comprobar la pantalla de Seguridad en el navegador**, con las tres cuentas.
6. **Resolver las contradicciones** que quedan en la sección 4. Ninguna bloquea.

---

# 6. Cómo retomar

```bash
docker compose -f docker-compose.dev.yml up -d
```

```bash
pnpm install && pnpm db:deploy && pnpm db:seed
```

```bash
pnpm dev
```

Antes de subir cambios:

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
```

## Después de actualizar desde Git

El Release 0.6 cambió la forma de la sesión guardada y del token. **Hay que volver
a iniciar sesión una vez**: un token emitido antes no lleva los módulos, y sin
ellos la aplicación responde 403 en todas las pantallas. La sesión guardada sube
de versión y se descarta sola al recargar.

**No dejar corriendo `node dist/main.js` mientras se desarrolla.** Es una
compilación que no se reconstruye al cambiar el código, ocupa el puerto 3000 e
impide que arranque el watcher de `pnpm dev`. Un backend desactualizado servido
así fue la causa de un 403 general que parecía un fallo de permisos.

## Cuando la aplicación parece romperse al arrancar

Tres causas de entorno explican casi todos los fallos al levantar el proyecto, y
ninguna está en el código. Conviene descartarlas antes de buscar en otro sitio.

**PostgreSQL apagado.** Si Docker Desktop no está arrancado no hay base de datos, y
la aplicación falla en cuanto pide cualquier dato. Se comprueba en un segundo:

```bash
curl http://localhost:3000/api/health
```

Un `"database":"down"` significa que falta `docker compose -f docker-compose.dev.yml up -d`,
no que haya un fallo de la API: por eso el healthcheck existe.

**El contenedor arriba pero sin publicar el puerto.** Este es el que despista de
verdad, porque `docker ps` dice `Up (healthy)` y `docker compose up -d` responde que
ya está corriendo, así que parece que la base de datos no es el problema. Pasa cuando
Docker Desktop reinicia el contenedor por su cuenta —lo tiene declarado con
`restart: unless-stopped`— y su proxy de puertos no llega a enlazar el 5432.

Se distingue mirando la columna de puertos: tiene que decir
`0.0.0.0:5432->5432/tcp`, no `5432/tcp` a secas.

```bash
docker ps --format "{{.Names}} | {{.Status}} | {{.Ports}}"
```

Se arregla recreando el contenedor. El volumen con los datos no se toca, así que no
hay que volver a migrar ni a sembrar:

```bash
docker compose -f docker-compose.dev.yml up -d --force-recreate
```

No hace falta reiniciar la API: el pool de conexiones abre la siguiente por su
cuenta, y el healthcheck vuelve a `"database":"up"` en cuanto el puerto responde.

**Dos `pnpm dev` a la vez.** Es el fallo más engañoso. El segundo no avisa: Vite ve
el 5173 ocupado y se muda al 5174 o al 5175, así que el navegador abierto en el 5173
sigue sirviendo el código de la sesión anterior; y los dos vigilantes de contratos
escriben el mismo `dist`, lo que dispara recargas en cadena. Parece que la
aplicación se rompió sola.

Cerrar `pnpm dev` con Ctrl+C no siempre basta: si se mata el proceso padre, los
hijos —`tsc --watch`, `vite`, `nest start`, `node dist/main`— quedan huérfanos y
siguen ocupando los puertos. Para comprobar qué hay vivo y limpiarlo:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3000,5173,5174,5175 | Select-Object LocalPort,OwningProcess
```

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'RedsisOneJr' -and $_.CommandLine -match '(tsc|nest\.js|vite\.js|dist\\main|turbo)' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

La regla es una sola: **un único `pnpm dev`, y Vite tiene que decir 5173**. Si dice
otro puerto, hay algo anterior sin cerrar.

## Nota sobre la verificación en navegador

El panel de navegador integrado no compone frames, así que no hay capturas de
pantalla y los clics sintéticos no llegan a los componentes de Radix (menús,
selectores de shadcn). Eso **no es un fallo de la aplicación**: con ratón real
funcionan, y están cubiertos por pruebas en jsdom. Los controles nativos —los
`select` de agrupar y de filtros, las casillas de Seguridad— sí responden a la
automatización.

Si algo parece roto al automatizar, recargar con Ctrl+Shift+R antes de sospechar
del código.
