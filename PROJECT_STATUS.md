# PROJECT_STATUS.md

Última actualización: 31/07/2026 (Release 0.7)

Este documento es el punto de entrada para retomar el proyecto. Responde tres
preguntas: **qué funciona hoy**, **qué falta**, y **qué hacer a continuación**.

Se actualiza al terminar cada MVP.

---

# 1. Resumen en una línea

Plataforma empresarial modular con autenticación propia, autorización de dos
niveles administrable desde una pantalla, framework de tablas reutilizable y el
Ticket como centro de la operación, con su propio espacio de trabajo.
**Release 0.7 cerrado, comprobado en navegador e integrado en `main`. Sin integrar
Baserow todavía.**

| Métrica               | Valor                                          |
| --------------------- | ---------------------------------------------- |
| Pruebas               | 722 (84 API + 596 web + 42 contratos)          |
| `any` en el código    | 0                                              |
| Componente más grande | Por debajo de 250 líneas                       |
| Lint / tipos / build  | Limpios                                        |
| Rama                  | `main`, con los Releases 0.5, 0.6, 0.6.1 y 0.7 |

---

# 2. Qué funciona hoy

## Se puede usar en el navegador

Arrancar con las instrucciones de [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
y entrar con `admin@redsis.com` / `Redsis2026`.

| Pantalla  | Ruta           | Estado                                                    |
| --------- | -------------- | --------------------------------------------------------- |
| Login     | `/login`       | Autenticación real contra la API                          |
| Panel     | `/`            | Tarjetas con datos reales (rol, permisos, total usuarios) |
| Tickets   | `/tickets`     | **Tabla avanzada** para localizar: la fila abre el ticket |
| Ticket    | `/tickets/:id` | **Espacio de trabajo**: timeline, auditoría y operación   |
| Usuarios  | `/users`       | **CRUD completo**: crear, editar, activar, suspender      |
| Seguridad | `/security`    | **Administración de accesos** con auditoría e historial   |

Las pantallas `/roles` y `/permissions` **se retiraron** en el Release 0.6:
Seguridad las reemplaza por completo.

Cuentas de prueba existentes:

| Correo                  | Contraseña   | Rol           | Para probar                          |
| ----------------------- | ------------ | ------------- | ------------------------------------ |
| `admin@redsis.com`      | `Redsis2026` | administrador | Todo. Acceso total garantizado       |
| `supervisor@redsis.com` | `Redsis2026` | supervisor    | Que NO ve Seguridad ni entra por URL |
| `tecnico@redsis.com`    | `Redsis2026` | tecnico       | Tarjetas al reducir la ventana       |

## Backend

| Módulo         | Endpoints                                                      |
| -------------- | -------------------------------------------------------------- |
| `auth`         | login, refresh, logout, me                                     |
| `users`        | listar, ver, crear, actualizar, desactivar                     |
| `roles`        | listar, ver (para asignar roles a usuarios)                    |
| `permissions`  | listar, listar agrupado por módulo                             |
| `security`     | catálogo, roles, crear, actualizar, cambiar accesos, auditoría |
| `activity-log` | listar                                                         |
| `health`       | estado del servicio y de la base de datos                      |

Todos con Repository + Provider. Ningún servicio ni controlador inyecta Prisma.

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

Tickets sigue **sin módulo en el backend**. Mientras eso llegue, la frontera está
declarada en el frontend:

```
pantalla -> hook -> TicketRepository -> mockTicketProvider -> origen en memoria
```

`ticket-repository.ts` es el único sitio donde se decide de dónde salen los tickets,
igual que `{ provide: TicketRepository, useClass: ... }` en NestJS. Ningún componente
consume mocks.

El origen simulado guarda el estado una vez y aplica las reglas —qué estado sigue a
qué paso, qué se audita, qué va al timeline—, así que la tabla y el detalle no pueden
discrepar. **Vive en memoria: se pierde al recargar la página.**

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

## Del Release 0.7

Nada de su alcance. Lo que quedó declarado y sin implementar a propósito:

- **GPS y adjuntos del timeline.** `TicketEvent` lleva `location` y `attachments`
  y hoy llegan siempre vacíos. El MVP 5 pedía preparar la estructura, no
  implementarlos.
- **`tickets.create` y `tickets.delete`** siguen en el catálogo sin que ninguna
  acción los use. Crear y eliminar tickets depende de quién sea la fuente de verdad,
  que es una decisión del próximo release.
- **Módulo Tickets en el backend.** Es lo primero de la integración con Baserow.

## Módulos declarados sin construir

El catálogo declara once módulos. Cinco no tienen pantalla ni backend:
**Técnicos, Formularios, Clientes, Sucursales, Reportes**. Se les puede conceder
acceso desde Seguridad, y el menú no los dibuja hasta que existan.

## Del MVP original de la plataforma

- Integración con Baserow (siguiente release)
- Dashboard con gráficas (ECharts está instalado y sin usar)
- Google Maps (la librería no está instalada)
- Módulo de Configuración (tabla `settings` vacía)

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

**Bug del estado de error en Tickets.** El botón "Simular fallo" deja la tabla en
el esqueleto de carga sin llegar nunca al estado de error.

**Esquema muerto en Prisma.** `zones`, `branches`, `settings` y `user_zones`
existen pero cero código las usa.

**La pantalla de Seguridad no se ha visto en un navegador real.** Está cubierta
por pruebas, incluidas las reglas de acceso, pero no se ha comprobado en pantalla.

**La vista de tarjetas de Tickets tampoco.** Exige entrar con la cuenta del
técnico. El espacio de trabajo del ticket sí se comprobó al cerrar el Release 0.7.

**El estado de las acciones del ticket vive en memoria.** Asignar un técnico o
avanzar el flujo se pierde al recargar. Es lo esperado mientras el origen sea
simulado, pero conviene saberlo antes de probar.

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

1. **Comprobar el CI en GitHub Actions.** Es lo más barato y lo que más información
   da, y ahora hay algo que comprobar: `main` acaba de recibir tres releases.
2. **Comprobar la pantalla de Seguridad en el navegador**, con las tres cuentas:
   que el supervisor no vea Seguridad ni entre por URL, y que el administrador
   aparezca como acceso total y no editable.
3. **Decidir las seis preguntas del Release 0.8** antes de escribir código. Están en
   [NEXT.md](NEXT.md) y todas cambian el diseño: quién es la fuente de verdad de los
   tickets, dónde viven el timeline y la auditoría, quién los crea, cómo se
   relacionan con clientes y sucursales, qué pasa si Baserow no responde y cómo
   pagina.
4. **Empezar el Release 0.8**: módulo Tickets en NestJS e integración con Baserow.
   Ver [NEXT.md](NEXT.md).
5. **Resolver las contradicciones** que quedan en la sección 4. Ninguna bloquea.

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

Dos causas de entorno explican casi todos los fallos al levantar el proyecto, y
ninguna está en el código. Conviene descartarlas antes de buscar en otro sitio.

**PostgreSQL apagado.** Si Docker Desktop no está arrancado no hay base de datos, y
la aplicación falla en cuanto pide cualquier dato. Se comprueba en un segundo:

```bash
curl http://localhost:3000/api/health
```

Un `"database":"down"` significa que falta `docker compose -f docker-compose.dev.yml up -d`,
no que haya un fallo de la API: por eso el healthcheck existe.

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
