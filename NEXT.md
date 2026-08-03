# NEXT.md

Última actualización: 31/07/2026

Qué se construye a continuación. **Nada de aquí está implementado.**

Este documento se reescribe al cerrar cada release: describe el siguiente, no la
historia. Lo entregado vive en [CHANGELOG.md](CHANGELOG.md); lo pendiente conocido,
en [TECH_DEBT.md](TECH_DEBT.md).

---

# Release 0.8 — Integración con Baserow

## Por qué ahora

Tickets es la única parte de la plataforma que funciona con datos inventados. Todo
lo demás —usuarios, roles, accesos, auditoría— ya habla con PostgreSQL. Hasta que
Tickets tenga un origen real, no se puede usar la plataforma para trabajar, que es
el objetivo declarado en PROJECT_CONTEXT.

Se hace después del framework de tablas, de la administración de accesos y del
espacio de trabajo del ticket a propósito: **la interfaz ya está terminada**. Si
Baserow se hubiera integrado antes, cada capacidad de tabla y cada sección del
detalle habrían exigido rehacer la capa de datos.

Y ahora hay una prueba concreta de que la arquitectura sirvió: el Release 0.7 dejó
la frontera declarada en `TicketRepository`. Si el diseño es correcto, conectar
Baserow es escribir otro proveedor.

## Qué debe seguir siendo cierto al terminar

- **Ninguna pantalla cambia.** La tabla, las tarjetas y las seis secciones del
  espacio de trabajo consumen los mismos hooks, que consumen el mismo contrato.
- **React nunca sabe de dónde vienen los datos.** Nadie llama a Baserow desde el
  frontend, ni conoce su forma, ni su paginación, ni sus identificadores.
- **Los contratos no se doblan al modelo de Baserow.** Si no encaja, el Provider
  traduce. El dominio manda sobre el proveedor.
- **Las reglas dejan de estar en el frontend.** Qué estado sigue a qué paso del
  flujo, qué se audita y qué va al timeline viven hoy en el origen simulado
  (`mocks/ticket-store.mock.ts`) precisamente para poder mudarse al servicio de
  NestJS sin tocar la interfaz. Ese traslado es parte del release.
- **Sustituir Baserow por PostgreSQL, Airtable o SAP sigue siendo escribir otro
  Provider.**

## Alcance previsto

Sin desglosar en MVP todavía; eso será el documento del release.

### Backend

1. **Módulo Tickets en NestJS.** Repository + Provider, como el resto. Hoy Tickets
   no existe en la API.
2. **Las reglas del ticket en el servicio**: transiciones del flujo, qué se audita y
   qué entra en el timeline. Se traen del origen simulado, donde ya están escritas y
   probadas.
3. **`BaserowTicketProvider`** con su cliente HTTP, su configuración por variables
   de entorno y su traducción entre el modelo de Baserow y los contratos `Ticket`,
   `TicketDetail`, `TicketEvent` y `TicketFieldChange`.
4. **Timeline y auditoría persistidos.** Hoy se derivan del propio ticket; con
   origen real necesitan dónde vivir. Decidir si van en Baserow junto al ticket o en
   PostgreSQL como el resto de la trazabilidad de la plataforma.
5. **Permisos del módulo aplicados en la API**, no solo en la interfaz:
   `tickets.view` y `tickets.edit` en los endpoints, con `@RequireModule`.

### Frontend

6. **Proveedor que llama a la API** en lugar del simulado. Es una línea en
   `ticket-repository.ts` más el proveedor nuevo.
7. **Modo servidor en la tabla.** El framework lo soporta (`mode: 'server'`,
   `onQueryChange`, `totalRows`) y **nunca se ha ejercitado contra un backend
   real**. Es el riesgo técnico principal del release.
8. **Filtros, orden y búsqueda en el servidor.** `TableQuery` ya lleva los filtros
   avanzados; falta traducirlos al lenguaje de Baserow.
9. **Manejo de fallos del proveedor externo.** Un origen que no responde no debe
   tumbar la pantalla: la tabla y las secciones del detalle ya tienen estado de
   error, y hay que decidir reintentos y caducidad de caché.
10. **Retirar los datos mock** y el interruptor "Simular fallo", que existía para
    poder ver el estado de error sin un origen real.

## Decisiones que hay que tomar antes de empezar

No conviene escribir código sin resolverlas:

- **¿Baserow es la fuente de verdad de los tickets, o una caché de otro sistema?**
  Cambia si la plataforma escribe en él o solo lee, y si `tickets.create` tiene
  sentido en la interfaz.
- **¿Dónde viven el timeline y la auditoría del ticket?** Junto al ticket en
  Baserow, o en PostgreSQL con el resto de la trazabilidad.
- **¿Quién crea los tickets?** Si llegan de un sistema externo, `tickets.create`
  puede no tener sentido en la interfaz.
- **¿Cómo se relacionan los tickets con clientes y sucursales**, que no existen como
  módulos? Hoy `Ticket` guarda `clientName` y `branchName` como texto, y
  `TicketDetail` la dirección y la zona igual.
- **¿Qué pasa si Baserow está caído?** Degradar, cachear o fallar de forma visible.
- **¿Paginación por cursor o por página?** El framework de tablas asume páginas
  numeradas.

## Antes de arrancar

De [TECH_DEBT.md](TECH_DEBT.md), lo que conviene cerrar primero:

1. **Comprobar el CI en verde.** Barato, y da la información más útil. Nunca se ha
   visto una ejecución completa.
2. **Ver Seguridad en un navegador real** con las tres cuentas.

Y resolver antes las seis preguntas de la sección anterior: son decisiones de
producto y de datos, no de código, y cada una cambia lo que hay que construir.

Y la decisión de arquitectura que este release fuerza: **Docker sigue sin
construirse**. Añadir un proveedor externo con su propia configuración es buen
momento para resolverlo, porque multiplica las variables de entorno que hay que
llevar a producción.
