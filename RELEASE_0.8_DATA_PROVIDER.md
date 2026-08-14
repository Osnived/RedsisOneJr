# RELEASE_0.8_DATA_PROVIDER.md

# Data Provider & Dynamic Ticket Data Layer

---

# Objetivo del Release

Construir la capa de adquisición, normalización y renderizado de los datos de
Tickets, de modo que la plataforma pueda consumir información de proveedores
distintos **sin que la interfaz conozca ninguno**.

Proveedores contemplados: Mock, RedsisOne / OneBoards, Baserow, ServiceNow y base
de datos propia. Solo el simulado está implementado; los demás quedan declarados y
con su sitio hecho.

---

# Estado

| MVP | Objetivo                                 | Estado    |
| --- | ---------------------------------------- | --------- |
| A   | Contratos compartidos                    | Terminado |
| B   | Módulo Tickets en NestJS                 | Terminado |
| C   | Fuentes de datos administrables          | Terminado |
| D   | Column Registry dinámico                 | Terminado |
| E   | React consume la API                     | Terminado |
| F   | Pantalla de administración de conexiones | Terminado |
| G   | Documentación                            | Terminado |

**Release cerrado.** Desarrollado en `feature/data-provider-ticket-layer` y
comprobado en un navegador real contra la API y PostgreSQL.

---

# Qué se entregó

## MVP A — Contratos compartidos

Tres archivos nuevos en `packages/contracts`:

| Archivo             | Qué declara                                                    |
| ------------------- | -------------------------------------------------------------- |
| `data-query.ts`     | Paginación, orden, búsqueda y los siete operadores de filtro   |
| `ticket-columns.ts` | Nueve tipos de dato, diez columnas estándar, veinte espacios   |
| `data-sources.ts`   | Los cinco proveedores, sus parámetros y los contratos del CRUD |

El modelo `Ticket` incorpora `title`, `zoneName` y `metadata`, y `TicketDetail`
incorpora `description`. **No se renombró ningún campo**: `clientName`,
`branchName` y `technicianName` siguen llamándose igual, así que ninguna vista
guardada en el navegador de ningún usuario quedó apuntando a columnas
inexistentes.

Los operadores de filtro dejaron de estar duplicados: viven en el contrato y el
framework de tablas los re-exporta.

## MVP B — Módulo Tickets en NestJS

Tickets deja de ser el único módulo sin backend. Nueve endpoints con las dos
puertas de autorización, el servicio con **todas** las reglas de negocio, y el
proveedor simulado detrás del Repository.

Las reglas —qué estado sigue a qué paso, qué se audita, qué entra en el timeline—
se mudaron desde el origen simulado del frontend sin alterarlas: era el sitio
previsto desde que se escribieron.

## MVP C — Fuentes de datos administrables

Modelo `DataSource` en PostgreSQL, credenciales cifradas con **AES-256-GCM**, y
siete endpoints para administrarlas desde la interfaz.

Se usa GCM y no un cifrado simple porque además **autentica**: si alguien altera
una fila, descifrar falla en lugar de devolver basura que la aplicación
intentaría enviar a un servicio externo.

## MVP D — Column Registry dinámico

`buildTicketColumns()` traduce la configuración de un proyecto a columnas del
framework: lee de `metadata`, convierte fechas y números, y aplica el ancho y la
alineación que corresponden al tipo.

`ColumnDefinition` **no cambió**. El tipo de dato pertenece al contrato de
configuración, no al motor de tablas, así que el framework sigue sin conocer
ningún dominio.

## MVP E — React consume la API

`httpTicketProvider` sustituye al origen simulado del frontend, que se retiró
entero. La tabla pasa a **modo servidor**: buscar, ordenar, filtrar y paginar los
resuelve el origen.

El actor de las operaciones dejó de viajar desde el frontend: lo toma el backend
del token.

## MVP F — Pantalla de administración

`/settings` administra las fuentes de datos, dentro del módulo Configuración que
el catálogo ya declaraba.

El formulario **dibuja los campos que declara el proveedor elegido**, sin saber
cuáles son. No hay ni un `if (provider === 'redsis-one')` en React.

---

# Decisiones

## El origen de Tickets se resuelve por petición, no al arrancar

Es la desviación arquitectónica del release y está registrada en el
[ADR 0003](docs/adr/0003-registro-de-proveedores-de-datos.md). El resto de módulos
fija su origen con una línea en su módulo de NestJS; Tickets no puede, porque cada
proyecto puede vivir en un proveedor distinto y los proyectos se dan de alta con la
aplicación en marcha.

Sigue habiendo **un solo punto de decisión**: lo que cambia es cuándo se toma.

## Las credenciales se separan de la configuración por su tipo, no por convención

Un parámetro es secreto porque el catálogo lo declara `secret`, y eso es lo que
decide que se cifre y que no vuelva. Si dependiera de que cada formulario recuerde
pintar un campo de contraseña, un formulario nuevo podría olvidarlo.

`toSummary` es el único camino por el que una fuente sale del backend, y no
incluye credenciales: un endpoint nuevo no puede saltárselo por descuido.

## El frontend recibe columnas normalizadas, nunca campos del proveedor

`TicketColumnConfig` es lo que viaja a React. `TicketColumnMapping` añade
`providerFieldId` —el UUID de columna de RedsisOne, el nombre de campo de
Baserow— y **solo existe en el backend**. La regla se cumple por construcción, no
por disciplina.

## Los datos adicionales son escalares

`TicketMetadataValue` admite texto, número, booleano o nulo. Ordenar, filtrar y
agrupar solo tienen sentido sobre algo comparable, y admitir objetos anidados
obligaría al framework de tablas a saber recorrerlos. Un proveedor con estructura
la aplana en su Adapter.

## Los veinte espacios son configuración, no campos

No existen veinte columnas esperando en el modelo. Un proyecto que use tres tiene
tres claves en `metadata`. Materializarlas como campos fijos sería exactamente la
tabla universal rígida que el MVP prohíbe.

## Las reglas del ticket viven en el servicio, no en el Provider

Un Provider guarda lo que recibe. Por eso `applyMutation` viaja entero —dato,
timeline y auditoría— y no en tres llamadas: un origen que guardara el dato y
fallara al escribir el rastro dejaría un cambio sin trazabilidad.

---

# Criterios de aceptación

| Criterio                                            | Estado |
| --------------------------------------------------- | ------ |
| Contrato claro de Provider                          | Sí     |
| `TicketRepository` en el backend                    | Sí     |
| `MockTicketProvider`                                | Sí     |
| React obtiene tickets solo por Repository / Service | Sí     |
| AdvancedTable sigue funcionando                     | Sí     |
| Column Registry con columnas estándar               | Sí     |
| Column Registry con columnas personalizadas         | Sí     |
| Veinte espacios configurables                       | Sí     |
| Cada proyecto con su configuración de columnas      | Sí     |
| Nombre configurable por columna                     | Sí     |
| Tipo de dato por columna                            | Sí     |
| Fuente del dato por columna                         | Sí     |
| Metadata del proveedor                              | Sí     |
| Arquitectura preparada para RedsisOne               | Sí     |
| Arquitectura preparada para Baserow                 | Sí     |
| Arquitectura preparada para ServiceNow              | Sí     |
| Ningún token externo llega al frontend              | Sí     |
| Loading / Error / Empty                             | Sí     |
| El Ticket Workspace usa `TicketRepository`          | Sí     |
| Las pruebas existentes siguen pasando               | Sí     |
| Lint limpio                                         | Sí     |
| TypeScript sin errores                              | Sí     |
| Build correcto                                      | Sí     |

---

# Cómo probarlo

Con Docker arrancado y `pnpm dev` corriendo:

1. **Volver a iniciar sesión.** El release añade cuatro permisos, y un token
   emitido antes no los lleva.
2. **Columnas del proyecto.** En `/tickets` la tabla muestra "Fecha compromiso",
   "Tipo de servicio" y "Número de equipo": columnas que **no existen en el
   código del frontend**, sino que las declara la fuente de datos.
3. **Modo servidor.** Escribir en la búsqueda y comprobar en el log de la API que
   llega `search=...`. Los resultados los decide el origen.
4. **Agrupar por una columna adicional.** "Tipo de servicio" aparece en el
   selector porque el proyecto la declara agrupable.
5. **Operación real.** Abrir un ticket, avanzar la intervención y comprobar que la
   auditoría registra el cambio con **el correo de quien lo hizo**, tomado del
   token y no del formulario.
6. **Fuentes de datos.** En `/settings`, crear una de RedsisOne: el formulario pide
   URL, token y tablero porque el proveedor los declara. Guardarla y comprobar que
   la tabla dice "Guardadas" y que la API nunca devuelve el token.
7. **Cifrado.** `docker exec redsis-postgres-dev psql -U redsis -d redsis -c "SELECT credentials FROM data_sources;"`
   debe mostrar `v1.…` y nunca el token.
8. **Proveedor sin implementar.** Intentar designar por defecto una fuente de
   RedsisOne responde 409 con una explicación.
9. **Arranque protegido.** Con `TICKETS_PROVIDER=baserow` en `.env`, la API no
   arranca y dice por qué.
