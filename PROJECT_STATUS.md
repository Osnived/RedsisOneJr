# PROJECT_STATUS.md

Última actualización: 31/07/2026

Este documento es el punto de entrada para retomar el proyecto. Responde tres
preguntas: **qué funciona hoy**, **qué falta**, y **qué hacer a continuación**.

Se actualiza al terminar cada MVP.

---

# 1. Resumen en una línea

Plataforma empresarial modular con autenticación propia, CRUD de usuarios,
framework de tablas con capacidades avanzadas y Tickets adaptándose al
dispositivo. **Release 0.5 completo. Sin integrar Baserow todavía.**

| Métrica               | Valor                                    |
| --------------------- | ---------------------------------------- |
| Pruebas               | 578 (60 API + 495 web + 23 contratos)    |
| `any` en el código    | 0                                        |
| Componente más grande | Por debajo de 250 líneas                 |
| Lint / tipos / build  | Limpios                                  |
| Último commit         | `c52ecaa` (framework de tablas MVP 4–10) |

**Hay trabajo sin commitear**: el Release 0.5 completo (MVP 1 al 15) está en el
árbol de trabajo, no en la historia.

---

# 2. Qué funciona hoy

## Se puede usar en el navegador

Arrancar con las instrucciones de [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
y entrar con `admin@redsis.com` / `Redsis2026`.

| Pantalla | Ruta           | Estado                                                    |
| -------- | -------------- | --------------------------------------------------------- |
| Login    | `/login`       | Autenticación real contra la API                          |
| Panel    | `/`            | Tarjetas con datos reales (rol, permisos, total usuarios) |
| Tickets  | `/tickets`     | **Tabla avanzada**: vistas, filtros, agrupar, columnas    |
| Usuarios | `/users`       | **CRUD completo**: crear, editar, activar, suspender      |
| Roles    | `/roles`       | Solo lectura. Solo administrador                          |
| Permisos | `/permissions` | Catálogo de 18 permisos. Solo administrador               |

Cuentas de prueba existentes:

| Correo                  | Contraseña   | Rol           | Para probar                    |
| ----------------------- | ------------ | ------------- | ------------------------------ |
| `admin@redsis.com`      | `Redsis2026` | administrador | Todo                           |
| `supervisor@redsis.com` | `Redsis2026` | supervisor    | Que NO ve Roles ni Permisos    |
| `tecnico@redsis.com`    | `Redsis2026` | tecnico       | Tarjetas al reducir la ventana |

## Backend

| Módulo         | Endpoints                                  |
| -------------- | ------------------------------------------ |
| `auth`         | login, refresh, logout, me                 |
| `users`        | listar, ver, crear, actualizar, desactivar |
| `roles`        | listar, ver                                |
| `permissions`  | listar, listar agrupado por módulo         |
| `activity-log` | listar                                     |
| `health`       | estado del servicio y de la base de datos  |

Todos con Repository + Provider. Ningún servicio ni controlador inyecta Prisma.

## Framework de tablas

**BaseTable** (`shared/components/table/`) con las 10 capacidades: búsqueda
global, ordenamiento, paginación, loading, empty state, error state, selección de
filas, columnas por feature, toolbar y acciones por fila. Además redimensionar
columnas y preferencias persistidas.

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

**Column Registry**: cada módulo aporta solo su archivo de columnas. Cuatro
módulos ya lo usan (tickets, users, roles, permissions).

## Vista adaptativa

`useViewMode()` decide cómo se representa un módulo y devuelve `mode` y `reason`.
Considera el rol, el tamaño de pantalla y —preparado— la preferencia del usuario.
`useIsMobile` es el único sitio que mira el tamaño de la ventana.

Tickets registra sus vistas en `features/tickets/views/`: `TicketTableView` y
`TicketCardView`. La página consulta los datos una vez y entrega el resultado a la
vista elegida. Técnico en móvil ve tarjetas; cualquier otro caso, la tabla
avanzada.

## Infraestructura compartida

```
shared/
  components/
    form/     EntityModal, EntityForm, FormField, FormFooter
    layout/   AppShell
    table/    TableProvider, DataTableView, DataTable, AdvancedTable,
              ColumnSettingsPanel, ViewsBar, FilterBuilder, GroupingSelector,
              RowActions y componentes internos
    ui/       Button, Badge, Card, Input, Label, Select, Dialog,
              DropdownMenu, Checkbox, Alert, Spinner
  hooks/        useIsMobile, useViewMode
  hooks/table/  useDataTable, useTablePreferences, useTableContext,
                useTableColumnSettings, useTableViews, useTableGrouping,
                useTableFilters
  lib/          apiClient, queryClient, env, utils, createId, viewMode, table/
  types/table/  contratos del framework
```

---

# 3. Qué falta

## Del release actual

Nada. Los quince MVP de [RELEASE_0.5.md](RELEASE_0.5.md) están terminados.

## Módulos que no existen

Necesitan backend completo (esquema, Repository, Provider, Service, Controller)
antes de tener pantalla:

- **Clientes** — no existe en ningún sitio
- **Zonas** y **Sucursales** — tabla vacía en Prisma, sin endpoints
- **Catálogos** — no existe y **no está definido** en PROJECT_CONTEXT

## Del MVP original de la plataforma

- Pantalla de detalle de un Ticket (hoy "Ver detalle" solo avisa de que no existe)
- Dashboard con gráficas (ECharts está instalado y sin usar)
- Google Maps (la librería no está instalada)
- Módulo de Configuración (tabla `settings` vacía)
- Integración con Baserow

---

# 4. Deuda y riesgos conocidos

## Sin resolver

**Docker nunca se ha construido.** El proxy TLS de la red rompe `pnpm install`
dentro del contenedor. Ver [certs/README.md](certs/README.md). Es lo único de la
arquitectura que no ha corrido de verdad.

**CI nunca se ha verificado en verde.** El pipeline existe y hay repositorio con
remoto. Nadie ha comprobado el resultado. Si falla, el sospechoso es la
construcción de imágenes Docker.

**Bug del estado de error en Tickets.** El botón "Simular fallo" deja la tabla en
el esqueleto de carga sin llegar nunca al estado de error. Solo afecta a ese
interruptor de desarrollo. Las pruebas del estado de error pasan, así que es algo
de la interacción entre los reintentos de TanStack Query y `isPending`.

**Esquema muerto en Prisma.** `zones`, `branches`, `settings` y `user_zones`
existen pero cero código las usa.

**La vista de tarjetas no se ha visto en un navegador real.** Está cubierta por
pruebas en jsdom, incluida la decisión automática de técnico en móvil, pero
comprobarla en pantalla exige entrar con la cuenta del técnico. La tabla avanzada
sí se verificó en navegador: agrupación, filtros, barra de vistas y panel de
columnas.

## Limitaciones asumidas

**Agrupar y paginar se reparten mal.** Con la tabla agrupada, la paginación cuenta
también las cabeceras de grupo, así que un grupo puede quedar partido entre dos
páginas. El texto informa de "N registros en M grupos" para no mentir sobre el
total, pero el corte sigue existiendo. Se resolvería paginando por grupos.

**Una vista no guarda la agrupación.** El MVP 7 enumera cuatro cosas —columnas,
filtros, orden y tamaño de página— y se implementó exactamente eso. La agrupación
se persiste en las preferencias de la tabla, no dentro de la vista.

**Una vista no se puede actualizar.** Se crea, se aplica y se borra. Cambiar una
vista existente obliga a borrarla y volver a crearla con el mismo nombre.

**Los filtros comparan sobre el dato, no sobre lo que se ve.** Es coherente con el
orden y la búsqueda global, que ya operaban así. En la práctica significa que
filtrar por Estado usa el código (`en-ruta`); el constructor sugiere los valores
presentes para no obligar a recordarlos. Las fechas y los booleanos sí se comparan
como se muestran.

**El botón "Restaurar configuración" del panel de columnas restaura todo** (orden,
columnas y tamaño de página), no solo las columnas. Es el mismo comportamiento que
el desplegable del BaseTable, y el texto de ayuda lo dice.

## Contradicciones pendientes de decisión

**Reordenar columnas.** El BaseTable persiste `columnOrder` porque un MVP anterior
lo pidió, pero un MVP posterior lo lista como "no debe soportar". Hoy no hay
interfaz para reordenar. Se acordó dejarlo como está.

**Sucursales y Zonas con agrupar y filtrar.** Se pidió que usaran "el basetable
normal, pero que contengan las acciones de agrupar, filtrar", lo que contradice el
"no debe soportar" del MVP 1 del release. **Sin decidir.** No ha bloqueado nada
porque agrupar y filtrar se implementaron solo en la tabla avanzada, tal como
piden los MVP 8 y 9, y esas pantallas todavía no existen. También falta aclarar si
son una sola pantalla o dos.

**`rowActions` es una función, no un `ReactNode`.** Se desvió de la especificación
porque un nodo estático no puede saber sobre qué fila actúa. Nunca se confirmó
formalmente.

**`filters` no estaba en la lista de capacidades del MVP 5.** El MVP 9 la exige, así
que se añadió a `AdvancedTableCapabilities`. Es la única ampliación de ese
contrato.

**`TECH_STACK.md` se llama `STACK.md`.** Los documentos lo citan con el otro
nombre.

**`.gitignore` no se versiona**, por decisión del propietario. Quien clone el
repositorio no tendrá reglas de ignorado.

---

# 5. Próximas acciones

Recomendación por orden:

1. **Commitear el Release 0.5.** Es todo el trabajo desde `c52ecaa` y no está en
   la historia.
2. **Comprobar el CI en GitHub Actions.** Es lo más barato y lo que más
   información da.
3. **Ver la vista de tarjetas en un móvil real**, entrando con
   `tecnico@redsis.com` y reduciendo la ventana por debajo de 768 px.
4. **Resolver las contradicciones** de la sección 4, en especial Sucursales y
   Zonas, antes de empezar esos módulos.
5. **Cerrar el bug del estado de error**, en cualquier momento: es pequeño y
   aislado.

Lo siguiente en producto, ya fuera de este release: **integrar Baserow**. La
arquitectura está preparada: todas las vistas de Tickets consumen el mismo
servicio, así que cambia su interior y no la interfaz.

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

## Nota sobre la verificación en navegador

El panel de navegador integrado no compone frames, así que no hay capturas de
pantalla y los clics sintéticos no llegan a los componentes de Radix (menús,
selectores de shadcn). Eso **no es un fallo de la aplicación**: con ratón real
funcionan, y están cubiertos por pruebas en jsdom. Los controles nativos —los
`select` de agrupar y de filtros— sí responden a la automatización.

Si algo parece roto al automatizar, recargar con Ctrl+Shift+R antes de sospechar
del código.
