# NEXT.md

Última actualización: 14/08/2026

Qué se construye a continuación. **Nada de aquí está implementado.**

Este documento se reescribe al cerrar cada release: describe el siguiente, no la
historia. Lo entregado vive en [CHANGELOG.md](CHANGELOG.md); lo pendiente conocido,
en [TECH_DEBT.md](TECH_DEBT.md).

---

# Release 0.9 — El primer proveedor real

## Por qué ahora

El Release 0.8 dejó la arquitectura preparada para que Mock, RedsisOne, Baserow y
ServiceNow sean intercambiables. Está probada contra un proveedor: el simulado.

**Una arquitectura que solo ha visto un origen no está validada.** El simulado es
cómodo con el contrato porque se escribió sabiendo cuál era. Un proveedor real
entrega los datos como quiere, pagina como quiere y falla cuando quiere, y ahí es
donde se descubre si el contrato sirve o hay que doblarlo.

Se hace con RedsisOne y no con Baserow porque es el que tiene documentación en el
proyecto y el que el negocio usa hoy.

## Qué debe seguir siendo cierto al terminar

- **Ninguna pantalla cambia.** Conectar RedsisOne tiene que ser escribir su
  Provider y una entrada en el registro.
- **Los contratos no se doblan al modelo de RedsisOne.** Si no encaja, el Adapter
  traduce. El dominio manda sobre el proveedor.
- **Ningún token sale del backend.**
- **Sustituirlo por Baserow sigue siendo escribir otro Provider.**

## Alcance previsto

### Lo que hace falta antes de escribir código

1. **Una respuesta de ejemplo de cada endpoint.** `docs/RedsisOne-EndPoints.yaml`
   es una exportación de Bruno sin cuerpos de respuesta: se conocen las rutas, la
   autenticación y la forma de las peticiones, pero **no la forma de lo que
   devuelve**. Sin eso el Adapter se escribiría a ciegas.
2. **Saber si RedsisOne pagina y cómo.** El contrato asume páginas numeradas. Si
   solo pagina por cursor, lo resuelve su Provider; conviene saberlo antes.
3. **Decidir cómo se mapean sus columnas a las estándar.** Un tablero tiene sus
   propias columnas identificadas por UUID; cuál es "el cliente" y cuál "el estado"
   es una decisión de configuración, no de código.

### Backend

4. **`RedsisOneTicketProvider`** con su cliente HTTP, leyendo la configuración de
   la fuente y descifrando sus credenciales solo al llamar.
5. **Traducción del schema del tablero a `TicketColumnMapping`**: el
   `GET /boards/{id}/schema` produce las columnas del proyecto, y su `columnId` es
   el `providerFieldId`.
6. **Traducción de los items a `Ticket`**, incluyendo que RedsisOne entrega **todo
   como texto**: las fechas y los números se convierten en el Adapter.
7. **Traducción de la consulta**: búsqueda, orden y los siete operadores de filtro
   al lenguaje del proveedor, o resueltos en memoria cuando no sepa hacerlo.
8. **Probador de conexión y descubrimiento de tableros**, para que administrar una
   fuente sea elegir de una lista.

### Lo que cierra la cadena

9. **La fuente configurada decide el origen.** Hoy el registro resuelve por
   `TICKETS_PROVIDER`; tiene que resolver por la fuente por defecto, y la variable
   quedar solo como respaldo.
10. **Manejo de fallos del proveedor externo**: reintentos, caducidad de caché y
    qué se muestra cuando el origen no responde. La tabla y el detalle ya tienen
    estado de error; falta decidir la política.

## Decisiones pendientes

- **¿RedsisOne es la fuente de verdad de los tickets, o una caché de otro
  sistema?** Decide si la plataforma escribe en él y si `tickets.create` tiene
  sentido.
- **¿Dónde viven el timeline y la auditoría?** Junto al ticket en el proveedor, o
  en PostgreSQL con el resto de la trazabilidad. Con un proveedor externo esta
  pregunta ya no se puede aplazar: el origen simulado los guardaba en memoria.
- **¿Qué pasa si el proveedor está caído?** Degradar, cachear o fallar de forma
  visible.
- **¿Un usuario puede elegir proyecto?** Hoy hay una fuente por defecto. Si un
  coordinador atiende dos clientes en tableros distintos, hace falta un selector.

---

# Después

Sin fecha ni orden todavía:

- **Baserow y ServiceNow.** Con RedsisOne funcionando, son el mismo trabajo con
  otra traducción. ServiceNow además admite llegar por webhook, que es una decisión
  de arquitectura aparte.
- **Módulos sin construir**: Técnicos, Clientes, Sucursales, Formularios, Reportes.
  Técnicos es el más urgente: hoy los técnicos viajan como texto en el ticket.
- **Dashboard con gráficas.** ECharts lleva instalado desde el Release 0.1.
- **Docker.** Sigue sin construirse (ver [TECH_DEBT.md](TECH_DEBT.md)). Cada
  release añade variables de entorno que habrá que llevar a producción, y el 0.8
  añadió una que además hay que custodiar.
