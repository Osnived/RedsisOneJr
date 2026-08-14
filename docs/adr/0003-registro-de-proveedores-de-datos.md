# ADR 0003 — Registro de proveedores de datos para Tickets

- Fecha: 2026-08-14
- Estado: Aceptado

## Contexto

La plataforma resuelve el origen de datos de cada módulo al arrancar, con una
línea en su módulo de NestJS:

```ts
{ provide: UserRepository, useClass: PrismaUserProvider }
```

`docs/ARCHITECTURE.md` lo describe así: «cambiar de origen de datos es cambiar una
línea en el módulo». Para Usuarios, Roles, Seguridad y el resto es correcto: solo
hay una base de datos y el origen no depende de qué se consulte.

Tickets no encaja en eso. Un ticket es un registro operacional que vive fuera de
la plataforma, y **cada proyecto puede vivir en un sitio distinto**: un cliente en
un tablero de RedsisOne, otro en una tabla de Baserow, otro en ServiceNow. Los
proyectos se dan de alta mientras la aplicación está en marcha, así que el origen
no se puede conocer al construir el módulo.

Además, la configuración de esas conexiones debe administrarse desde la interfaz
—con sus credenciales, su selección de tablero y su prueba de conexión—, lo que
descarta resolverlo con una variable de entorno por despliegue.

## Decisión

Se introduce `TicketProviderRegistry`: un mapa de clave de proveedor a
implementación de `TicketRepository`, y el **único** sitio donde se decide qué
implementación atiende una petición.

Es el mismo patrón —un contrato, varias implementaciones, un solo punto de
decisión— con el punto de decisión movido de la construcción del módulo a la
ejecución.

Tres reglas lo acotan:

1. **Ninguna regla de negocio vive por debajo del Repository.** Qué estado sigue a
   qué paso, qué se audita y qué entra en el timeline lo decide `TicketsService`.
   Un Provider guarda lo que recibe. Cambiar de origen no puede cambiar el
   comportamiento del negocio.
2. **Un proveedor declarado y sin implementar impide arrancar.** El registro lo
   comprueba en `onModuleInit`, no en la primera petición.
3. **Pedir un proveedor sin implementar lanza**, en lugar de caer al simulado.
   Servir datos de prueba creyendo que son reales es peor que no servir nada.

Mientras no exista la administración de fuentes, el proveedor activo sale de
`TICKETS_PROVIDER`. Cuando exista, saldrá de la fuente configurada y el registro
no cambiará: seguirá resolviendo una clave a una implementación.

## Alternativas consideradas

**Mantener `{ provide, useClass }` y una sola implementación.** Es lo que hace el
resto de la plataforma, pero obliga a que todos los proyectos compartan proveedor.
Contradice el requisito de que cada proyecto tenga el suyo.

**Elegir el proveedor con condicionales en el servicio.** Rechazado explícitamente
por el MVP: reparte por el código decisiones que deben estar en un sitio, y cada
proveedor nuevo obliga a tocar todos esos sitios.

**Un módulo de NestJS por proveedor, con rutas distintas.** El frontend tendría
que saber a qué ruta llamar según el proyecto, que es exactamente el acoplamiento
que la arquitectura existe para evitar.

**Resolver por variable de entorno y nada más.** Simple, pero añadir un proyecto
exigiría desplegar, y dos proyectos con proveedores distintos serían imposibles.

## Consecuencias

A favor:

- Añadir RedsisOne, Baserow o ServiceNow es escribir su Provider y una entrada en
  el mapa. Ni el servicio, ni el controlador, ni el frontend cambian.
- El frontend sigue sin conocer el origen: consume la misma API pase lo que pase
  por debajo.
- Las credenciales de los proveedores nunca salen del backend.
- Un error de configuración se descubre al arrancar y no en producción.

En contra:

- Tickets deja de seguir literalmente lo que dice `ARCHITECTURE.md` sobre resolver
  el origen en el módulo. El documento se actualiza con esta excepción y su motivo;
  el resto de módulos no cambia.
- Hay una indirección más entre el servicio y el Provider. Se acepta porque es la
  que sostiene el requisito de multi proveedor.
- El registro es un punto único de fallo por diseño. Está cubierto por pruebas
  precisamente por eso.
