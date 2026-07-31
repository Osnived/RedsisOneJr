# NEXT.md

Última actualización: 31/07/2026

Qué se construye a continuación. **Nada de aquí está implementado.**

Este documento se reescribe al cerrar cada release: describe el siguiente, no la
historia. Lo entregado vive en [CHANGELOG.md](CHANGELOG.md); lo pendiente conocido,
en [TECH_DEBT.md](TECH_DEBT.md).

---

# Release 0.7 — Integración con Baserow y refinamiento de Tickets

## Por qué ahora

Tickets es la única pantalla de la plataforma que funciona con datos inventados.
Todo lo demás —usuarios, roles, accesos, auditoría— ya habla con PostgreSQL. Hasta
que Tickets tenga un origen real, no se puede usar la plataforma para trabajar, que
es el objetivo declarado en PROJECT_CONTEXT.

Se hace después del framework de tablas y de la administración de accesos a
propósito: **la interfaz ya está terminada**. Si Baserow se hubiera integrado antes,
cada capacidad de tabla habría exigido rehacer la capa de datos.

## Qué debe seguir siendo cierto al terminar

Es la prueba de que la arquitectura sirvió para algo:

- **Ninguna pantalla cambia.** Las vistas de Tickets consumen el mismo hook, que
  consume el mismo servicio. Solo cambia el interior del Provider.
- **React nunca sabe de dónde vienen los datos.** Nadie llama a Baserow desde el
  frontend, ni conoce su forma, ni su paginación, ni sus identificadores.
- **El contrato `Ticket` no se dobla al de Baserow.** Si su modelo no encaja, el
  Provider traduce. El dominio manda sobre el proveedor.
- **Sustituir Baserow por PostgreSQL, Airtable o SAP sigue siendo escribir otro
  Provider.** Es la razón de ser del patrón (ver AGENTS.md).

## Alcance previsto

Sin desglosar en MVP todavía; eso será el documento del release.

### Integración

1. **Módulo Tickets en el backend.** Repository + Provider, como el resto. Hoy
   Tickets no existe en la API: vive entero en el frontend con datos en memoria.
2. **`BaserowTicketProvider`** con su cliente HTTP, su configuración por variables
   de entorno y su traducción entre el modelo de Baserow y el contrato `Ticket`.
3. **Modo servidor en la tabla.** El framework ya lo soporta (`mode: 'server'`,
   `onQueryChange`, `totalRows`) y **nunca se ha ejercitado contra un backend
   real**. Es el riesgo técnico principal del release.
4. **Filtros, orden y búsqueda en el servidor.** `TableQuery` ya lleva los filtros
   avanzados; falta traducirlos al lenguaje de Baserow.
5. **Manejo de fallos del proveedor externo.** Un origen que no responde no debe
   tumbar la pantalla: la tabla ya tiene estado de error, y hay que decidir
   reintentos y caducidad de caché.

### Refinamiento de Tickets

6. **Pantalla de detalle de un ticket.** Hoy "Ver detalle" solo avisa de que no
   existe.
7. **Permisos del módulo aplicados de verdad.** `tickets.create`, `tickets.edit` y
   `tickets.delete` están en el catálogo y ninguna acción los usa todavía.
8. **Retirar los datos mock** y el interruptor "Simular fallo", que existía para
   poder ver el estado de error sin un origen real.

## Decisiones que hay que tomar antes de empezar

No conviene escribir código sin resolverlas:

- **¿Baserow es la fuente de verdad de los tickets, o una caché de otro sistema?**
  Cambia si la plataforma escribe en él o solo lee.
- **¿Quién crea los tickets?** Si llegan de un sistema externo, `tickets.create`
  puede no tener sentido en la interfaz.
- **¿Cómo se relacionan los tickets con clientes y sucursales**, que no existen
  como módulos? Hoy `Ticket` guarda `clientName` y `branchName` como texto.
- **¿Qué pasa si Baserow está caído?** Degradar, cachear o fallar de forma visible.
- **¿Paginación por cursor o por página?** El framework de tablas asume páginas
  numeradas.

## Antes de arrancar

De [TECH_DEBT.md](TECH_DEBT.md), lo que conviene cerrar primero:

1. **Comprobar el CI en verde.** Barato, y da la información más útil.
2. **Ver Seguridad en un navegador real** con las tres cuentas.
3. **Cerrar el MVP 11**: retirar el formateo manual de fechas de las features.

Y una decisión de arquitectura que este release puede forzar: **Docker sigue sin
construirse**. Añadir un proveedor externo con su propia configuración es buen
momento para resolverlo, porque multiplica las variables de entorno que hay que
llevar a producción.
