# RELEASE_0.7_TICKET_WORKSPACE.md

# Ticket Workspace

---

# Objetivo del Release

Construir el espacio de trabajo del Ticket.

A partir de este Release el Ticket es el centro del sistema: la tabla únicamente
permite localizarlo y toda la operación ocurre en la vista Detalle.

**No se integra Baserow.** Todo sigue funcionando con datos mock.

---

# Estado

| MVP | Objetivo                 | Estado    |
| --- | ------------------------ | --------- |
| 1   | Navegación al detalle    | Terminado |
| 2   | Cabecera del Ticket      | Terminado |
| 3   | Layout del detalle       | Terminado |
| 4   | Información General      | Terminado |
| 5   | Timeline                 | Terminado |
| 6   | Audit Log                | Terminado |
| 7   | Acciones del Coordinador | Terminado |
| 8   | Flujo del Técnico        | Terminado |
| 9   | Responsive               | Terminado |
| 10  | Preparación para Baserow | Terminado |

**Release cerrado.** Desarrollado en `feature/ticket-workspace`, comprobado en un
navegador real e integrado en `main`.

---

# Qué se entregó

## MVP 1 — Navegación al detalle

La tabla de Tickets dejó de ejecutar acciones. Pulsar cualquier fila lleva a
`/tickets/:id`.

El framework de tablas incorpora `rowNavigation`, que convierte la fila entera en
el acceso al registro: repone el foco, el teclado y el nombre accesible que un
botón trae de serie, y distingue por sí solo los gestos dirigidos a la casilla de
selección o al menú de acciones. Es lo contrario de `rowActions`, que sigue
existiendo para los módulos administrativos.

## MVP 2 — Cabecera del Ticket

`TicketHeader` muestra número, estado, prioridad, cliente, sucursal, zona, técnico
y fecha de creación. Es reutilizable dentro del módulo: cualquier pantalla que
presente un ticket la monta en lugar de rehacerla.

El número es el `h1` de la pantalla porque identifica el servicio durante toda su
vida (ver PROJECT_CONTEXT.md).

## MVP 3 — Layout del detalle

Secciones con nombre, sin pestañas: Información general, Timeline, Auditoría,
Intervención y Acciones. Cada una es una región que se puede alcanzar saltando por
secciones.

El orden del marcado es el orden de lectura en móvil —cabecera, información,
historia, cambios y por último las acciones—, y en escritorio la rejilla lleva las
acciones a una columna propia que acompaña al desplazamiento.

## MVP 4 — Información General

Ficha completa del servicio, solo lectura: cliente, sucursal, dirección, ciudad,
zona, categoría, prioridad, estado, técnico, creación y última actualización.

Se construye con `DetailField` y `DetailFieldList`, infraestructura compartida
nueva: es el equivalente de `FormField` para lo que no se edita.

## MVP 5 — Timeline

Historia de la operación con icono, usuario, fecha, hora y descripción. Se muestra
de lo más reciente a lo más antiguo.

El contrato `TicketEvent` ya transporta `location` y `attachments` —GPS y
fotografías— y hoy llegan siempre vacíos: **declarados y sin implementar**, para que
añadirlos no cambie la forma de una entrada.

## MVP 6 — Audit Log

Sección independiente del Timeline, solo lectura: campo, valor anterior, valor
nuevo, usuario, fecha y hora.

El timeline cuenta la operación y la auditoría responde otra pregunta —quién cambió
qué y desde qué valor—. Los valores se almacenan como el código real (`en-ruta`) y
se traducen al mostrarlos.

## MVP 7 — Acciones del Coordinador

Panel con asignar o reasignar técnico, cambiar prioridad y agregar observación.
Cada acción abre un formulario construido con la infraestructura compartida
(`EntityModal` + `EntityForm` + `FormField`) y validado con el esquema Zod del
contrato compartido.

Exige `tickets.edit`. Quien solo puede consultar ve el ticket y no las acciones.

## MVP 8 — Flujo del Técnico

Máquina de estados simulada con **una sola acción disponible**: confirmar
asistencia, salir hacia la sucursal, llegué, iniciar servicio, finalizar servicio y
cerrar intervención.

Cuál corresponde se deriva de los pasos completados con `nextWorkflowStep`, en el
contrato compartido, así que la interfaz no puede ofrecer un paso adelantado. El
origen de datos vuelve a comprobarlo y rechaza cualquier otro.

Cada paso deja rastro en el timeline y, cuando mueve el estado del servicio, en la
auditoría.

## MVP 9 — Responsive

En pantalla pequeña la acción de la intervención vive en una barra fija al pie, al
alcance del pulgar, y el botón existe una sola vez en el marcado. El resto son
fichas: no hay ninguna tabla en el espacio de trabajo, tampoco la auditoría.

## MVP 10 — Preparación para Baserow

`TicketRepository` es el contrato que consumen los hooks del módulo, y
`mockTicketProvider` su implementación sobre el origen simulado.
`ticket-repository.ts` es el **único** sitio donde se decide de dónde salen los
tickets.

Ningún componente consume mocks: pantalla → hook → contrato → proveedor → origen.

---

# Decisiones

## El detalle es un contrato aparte del listado

`TicketDetail` extiende `Ticket` con dirección, zona, categoría y los pasos
completados. Transportar esos campos en cada listado obligaría al origen a leer
datos que ninguna tabla muestra.

## El flujo de la intervención no es el estado del ticket

Son dos conceptos: el estado dice en qué situación está el servicio para toda la
plataforma, y el paso dice por dónde va la intervención de quien lo atiende. Hay
seis pasos y siete estados porque "iniciar servicio" y "cerrar intervención" no
cambian la situación del servicio.

Se resolvió así en lugar de ampliar el catálogo de estados, que habría alterado los
datos de la tabla, los filtros, las agrupaciones y sus pruebas.

## Las reglas viven en el origen, no en React

Qué estado sigue a qué paso, qué se audita y qué va al timeline lo decide
`mocks/ticket-store.mock.ts`, que hace el papel del servicio de NestJS. React no
contiene ninguna regla de negocio (ver AGENTS.md), y cuando Tickets tenga backend
esas reglas se mudan sin que la interfaz se entere.

## Un solo origen para la tabla y el detalle

El origen simulado guarda el estado una vez. Cambiar la prioridad en el detalle se
ve en la tabla al volver: con dos copias, la pantalla parecería mentir.

El estado vive en memoria y se pierde al recargar, igual que antes de que
existieran las acciones.

## Los colores del dominio, en un solo sitio

`TicketStatusBadge` y `TicketPriorityBadge` sustituyen las tres copias del mapa de
colores que iban a existir (columnas, tarjetas y cabecera). Con una copia por
pantalla, un estado nuevo se olvidaba en alguna y aparecía en gris.

## El `TicketRepository` del frontend es temporal

La arquitectura sitúa Repository y Provider en NestJS. Tickets todavía no tiene
módulo en el backend —es lo primero del próximo release—, así que la frontera se
declaró en el frontend para que nadie la pueda saltar sin que se note. Conectar el
origen real será escribir un proveedor que llame a la API y cambiar una línea.

---

# Criterios de aceptación

| Criterio                                     | Estado |
| -------------------------------------------- | ------ |
| Vista completa del Ticket                    | Sí     |
| Timeline operativo                           | Sí     |
| Audit Log separado                           | Sí     |
| Cabecera reutilizable                        | Sí     |
| Layout optimizado para escritorio            | Sí     |
| Layout optimizado para móvil                 | Sí     |
| Flujo guiado del técnico                     | Sí     |
| Panel de acciones del coordinador            | Sí     |
| Arquitectura preparada para conectar Baserow | Sí     |
| Sin integrar APIs externas                   | Sí     |

---

# Cómo probarlo

Con `pnpm dev` corriendo y la sesión iniciada:

1. **Navegación.** Entrar en `/tickets` y pulsar cualquier fila: lleva a
   `/tickets/:id`. La fila también se abre con Enter y con la barra espaciadora, y
   marcar la casilla de selección no navega.
2. **Detalle.** Comprobar cabecera, información general, timeline y auditoría.
   Escribir `/tickets/99` a mano debe avisar de que no existe.
3. **Coordinador.** Con `admin@redsis.com`, asignar un técnico al ticket
   `INC-2026-000101`: el estado pasa a Asignado, aparece en el timeline y en la
   auditoría. Cambiar la prioridad y agregar una observación.
4. **Técnico.** En un ticket asignado, recorrer el flujo: solo hay un botón cada
   vez, y el estado avanza a En ruta, En sitio y Resuelto.
5. **Móvil.** Reducir la ventana por debajo de 768 px: la acción de la intervención
   queda fija al pie y no hay ninguna tabla.
6. **Permisos.** Un rol sin `tickets.edit` ve el ticket y no ve ni las acciones ni
   la intervención.
