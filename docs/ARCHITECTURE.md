# Arquitectura

Este documento explica cómo está construida la plataforma y por qué. Las reglas
que la gobiernan están en [AGENTS.md](../AGENTS.md) y [STACK.md](../STACK.md);
aquí se describe la implementación concreta.

## Principio central

El frontend nunca sabe de dónde vienen los datos.

```
React  ->  NestJS  ->  Repository  ->  Provider  ->  PostgreSQL o Baserow
```

Cada flecha es una frontera que no se salta. En particular:

- React nunca consulta la base de datos ni Baserow.
- Los servicios de NestJS nunca usan Prisma directamente.
- Solo los Providers conocen el origen de datos concreto.

Sustituir PostgreSQL por otro origen significa escribir otro Provider. Ni el
servicio, ni el controlador, ni el frontend cambian.

## Repository y Provider

El patrón se implementa con clases abstractas que sirven a la vez de contrato y
de token de inyección de dependencias:

```ts
// user.repository.ts — el contrato. Lo consumen los servicios.
export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<UserWithCredentials | null>;
}

// providers/prisma-user.provider.ts — la implementación para PostgreSQL.
@Injectable()
export class PrismaUserProvider extends UserRepository { ... }

// users.module.ts — donde se decide qué origen se usa.
{ provide: UserRepository, useClass: PrismaUserProvider }
```

Los Repositories devuelven tipos de dominio (`UserWithAccess`), nunca modelos de
Prisma. Esto es lo que impide que el dominio quede atado al ORM.

Cambiar de origen de datos es cambiar una línea en el módulo.

## Contratos compartidos

`packages/contracts` contiene los tipos y esquemas Zod que comparten frontend y
backend: forma de las peticiones, forma de las respuestas, catálogo de permisos
y errores de la API.

Las reglas del proyecto piden Zod en el frontend y class-validator en el
backend. Para que ambos no se desvíen, los DTO del backend implementan las
interfaces del contrato:

```ts
export class LoginDto implements LoginInput { ... }
```

Si el contrato cambia y el DTO no, el backend deja de compilar. La duplicación
que quedaría sin vigilancia se convierte en un error de compilación.

## Autenticación

Autenticación propia con JWT. No se usa el sistema de autenticación de Supabase:
Supabase es únicamente el proveedor de PostgreSQL.

| Token   | Duración | Contenido                     | Dónde vive                             |
| ------- | -------- | ----------------------------- | -------------------------------------- |
| Access  | 15 min   | usuario, roles y permisos     | Solo en el cliente                     |
| Refresh | 30 días  | usuario e identificador único | Su hash SHA-256 en la tabla `sessions` |

Decisiones y su motivo:

- **Los permisos viajan en el access token.** El guard no consulta la base de
  datos en cada petición. Como el token dura minutos, un cambio de permisos se
  aplica en la siguiente renovación.
- **De la sesión solo se guarda el hash del refresh token.** Quien lea la tabla
  de sesiones no obtiene tokens utilizables. Se usa SHA-256 y no bcrypt porque
  el hash debe poder buscarse por índice.
- **El refresh token rota.** Al renovar, el anterior queda revocado. Un token
  robado deja de servir en cuanto el usuario legítimo renueva.
- **El login tarda lo mismo con un correo registrado que con uno inexistente.**
  Se compara siempre contra un hash, para no revelar qué cuentas existen.

## Autorización

La autorización se basa en permisos, nunca únicamente en roles. Los roles
agrupan permisos.

```ts
@Get()
@RequirePermissions(PERMISSIONS.USERS_VIEW)
list() { ... }
```

### Dos puertas, no una

Desde el Release 0.6 el acceso tiene dos niveles, y son preguntas distintas:

| Nivel              | Pregunta                             | Se declara con             |
| ------------------ | ------------------------------------ | -------------------------- |
| Acceso a módulo    | ¿Existe este módulo para el usuario? | `@RequireModule(...)`      |
| Permiso por acción | ¿Puede ejecutar esta acción?         | `@RequirePermissions(...)` |

Sin la primera, la segunda no se evalúa. Un rol al que se le retiró Tickets no
entra aunque conserve `tickets.view` de una configuración anterior. Sin este
nivel, retirar un módulo en la interfaz solo ocultaría el menú y la URL seguiría
funcionando.

Tres guards actúan de forma global, y el orden es parte del diseño:

1. `JwtAuthGuard` exige sesión. Un endpoint queda público solo si se declara con
   `@Public()`: si alguien olvida protegerlo, queda protegido por omisión.
2. `ModuleAccessGuard` verifica el acceso al módulo. Va antes que los permisos
   porque es la puerta de fuera.
3. `PermissionsGuard` verifica los permisos declarados. Se exigen todos los
   listados, no uno cualquiera.

### El catálogo de módulos une los dos niveles

`APP_MODULE_DEFINITIONS`, en los contratos compartidos, declara qué módulos
existen. Cada uno lista sus `permissionPrefixes`, y eso es lo que permite que
`roles.edit` pertenezca al módulo Seguridad: el prefijo de un permiso y la clave
de su módulo no tienen por qué coincidir. Sin ese mapa habría hecho falta
renombrar permisos ya almacenados.

El catálogo declara también los módulos que aún no tienen pantalla (`route: null`).
Se les puede conceder acceso desde ya; el menú solo dibuja los que existen. Cuando
llegue Clientes, ningún rol guardado hay que revisar.

Una invariante sostiene el diseño y está cubierta por pruebas: **todo permiso del
catálogo pertenece a algún módulo**. Un permiso que no se puede situar se niega
siempre, así que quedaría inservible sin que nadie lo notara.

### Una sola vía en el frontend

El frontend también comprueba el acceso, pero solo para no mostrar lo que no
sirve: **la autorización real siempre la aplica el backend**, y devuelve 403
aunque se evite la pantalla.

Toda la aplicación pregunta por `useAuthorization()`, que expone `can()` y
`canAccess()`. Ningún componente lee `user.permissions` ni compara nombres de rol.
El store de sesión guarda la sesión y nada más: si respondiera preguntas de
autorización, habría dos vías y acabarían divergiendo.

`can()` comprueba también el acceso al módulo, por la misma razón que el guard del
backend.

La protección de rutas vive en la ruta contenedora y deduce el módulo del camino a
través del catálogo. Así una pantalla nueva queda protegida por declarar su ruta,
y ninguna página necesita —ni puede olvidarse de— comprobarlo.

### Acceso total garantizado

Un rol marcado con `hasFullAccess` **calcula** su acceso desde el catálogo en lugar
de leerlo de la base de datos. Recibe todos los módulos y permisos que existan,
incluidos los que se añadan después, y su acceso no se puede recortar ni
desactivar.

Es un campo del rol y no una comparación por su nombre: renombrar "administrador"
no desarma la garantía, y decidir por el cargo está prohibido (ver AGENTS.md). El
objetivo es que la administración de la plataforma no pueda quedarse fuera por una
configuración incompleta, que es un fallo del que no se sale desde la interfaz.

### Trazabilidad de los cambios de acceso

Cambiar los accesos de un rol exige un motivo. La regla vive en el contrato
compartido, así que la exigen por igual la pantalla y la API.

Los accesos y su auditoría se escriben **en la misma transacción**: un cambio de
permisos sin rastro es exactamente lo que el módulo Seguridad existe para impedir.

Se guarda el antes y el después completos, no la diferencia. Reconstruir el estado
a partir de diferencias exige que la cadena esté intacta desde el origen, y una
sola pérdida la vuelve inútil.

### Cuándo se aplica un cambio de permisos

Los accesos se leen del access token, que dura pocos minutos. Un cambio tarda hasta
ese tiempo en aplicarse: es el precio de no consultar PostgreSQL en cada petición.
Si alguna vez hace falta revocación inmediata, la salida es invalidar sesiones, no
consultar en cada llamada.

## Fechas y horas

Una sola forma de representar el tiempo, de la base de datos a la pantalla:

| Capa      | Forma                               |
| --------- | ----------------------------------- |
| Prisma    | `DateTime`, nunca `Date`            |
| Contratos | texto ISO 8601                      |
| Frontend  | el componente compartido `DateTime` |

`DateTime` en Prisma y no `Date` porque un campo sin hora no se puede ampliar
después sin migrar datos, y casi todo lo que parece "solo una fecha" acaba
necesitando la hora: cuándo se creó, cuándo se cerró, cuándo caducó.

En el frontend **ninguna feature formatea fechas por su cuenta**. Todas pasan por
`shared/components/ui/date-time.tsx`, que se apoya en `formatDateTime`. Así el día
que cambie el formato, la zona horaria o el idioma, cambia en un solo archivo.

El componente usa `<time dateTime>` para que el instante exacto quede en el marcado
aunque en pantalla se muestre abreviado. Una fecha ilegible se marca como ausente
en lugar de imprimir "Invalid Date": un dato ilegible no debe parecer un dato.

## Estado en el frontend

| Tipo de estado     | Herramienta    | Ejemplo                    |
| ------------------ | -------------- | -------------------------- |
| Datos del servidor | TanStack Query | listado de usuarios, panel |
| Estado del cliente | Zustand        | sesión, permisos, tema     |

Ningún componente llama a `fetch`. Todo pasa por `lib/api-client.ts`, que es el
único lugar donde se adjunta el token, se renueva la sesión y se traducen los
errores. La regla está impuesta por ESLint, no solo por convención.

La renovación es compartida: si varias peticiones reciben un 401 a la vez, todas
esperan la misma renovación. Lanzar una por cada petición revocaría el token
recién emitido por la rotación.

## Base de datos

PostgreSQL guarda lo que indica PROJECT_CONTEXT.md: usuarios, roles, permisos,
sesiones, historial de actividad, configuración, zonas y sucursales. Los datos
operacionales (tickets) irán en Baserow mediante su propio Provider.

Prisma 7 se conecta con un driver adapter (`@prisma/adapter-pg`) y la URL de
conexión vive en `prisma.config.ts`, no en el esquema.

Dos decisiones sobre el modelo:

- **Los usuarios se desactivan, no se eliminan.** El historial de actividad debe
  seguir siendo trazable.
- **Un usuario no puede desactivarse a sí mismo.** Dejaría la cuenta inaccesible
  sin que nadie más pudiera revertirlo.

## Trazabilidad

Toda acción relevante deja un registro en `activity_logs`: inicios y cierres de
sesión, creaciones, ediciones y desactivaciones.

Un fallo al escribir el historial no interrumpe la operación que lo originó. Es
preferible perder un registro que impedir un login válido; el fallo se registra
en el log del servidor.

## Módulos

Cada módulo es independiente y reutiliza la infraestructura común. Los que ya
existen:

| Módulo         | Responsabilidad                           |
| -------------- | ----------------------------------------- |
| `auth`         | Login, renovación, cierre de sesión       |
| `users`        | Alta, consulta, edición y desactivación   |
| `roles`        | Consulta de roles y sus permisos          |
| `permissions`  | Catálogo de permisos, plano y agrupado    |
| `activity-log` | Historial de actividad                    |
| `health`       | Estado del servicio y de la base de datos |

Para añadir un módulo:

1. Definir sus permisos en `packages/contracts/src/permissions.ts`.
2. Crear el contrato del Repository y su Provider.
3. Crear el servicio con las reglas de negocio.
4. Crear el controlador con `@RequirePermissions(...)` y DTO documentados.
5. Registrarlo en `app.module.ts`.
6. Añadir la entrada de navegación en el frontend con su permiso.

Un módulo nunca accede a los datos de otro directamente: se comunica a través de
los servicios que el otro módulo exporta.

## Framework de tablas

Toda tabla de la plataforma se dibuja con el mismo componente. Vive en
`shared/components/table/` y no conoce ningún dominio.

```
ColumnDefinition (la feature)  ->  column-adapter  ->  TanStack Table
                                        |
                            componentes de presentación
```

Tres decisiones sostienen el diseño:

- **Las columnas las declara la feature**, en `features/<dominio>/columns/`. Añadir
  un módulo es añadir un archivo; el DataTable no se toca. Cuatro módulos ya lo
  usan sin haberlo modificado nunca.
- **Solo tres componentes conocen TanStack** (cabecera, cuerpo y selector de
  columnas), porque son los que renderizan su salida. El resto —barra, paginación,
  búsqueda, estados, selección— recibe datos planos y funcionaría con otro motor.
- **`AdvancedTable` extiende por composición, no por copia.** Delega en
  `DataTable` y solo añade las capacidades avanzadas a su alrededor. Mejorar el
  BaseTable mejora también la avanzada, que es justo lo que se perdería con una
  implementación paralela.

Las preferencias del usuario (columnas visibles, anchos, orden, búsqueda, página,
filtros, agrupación y vista activa) se persisten solas a través de
`useTablePreferences`. Ningún componente accede al almacenamiento: eso permitió
construir el selector de columnas sin que sepa siquiera que existe `localStorage`.

### El contexto de tabla

Hay controles que gobiernan la tabla sin estar dentro de ella: el panel de
columnas se dibuja al lado, y la barra de vistas encima. Un hermano no puede leer
el estado de otro, y exponerlo hacia arriba obligaría a que cada capacidad
añadiera su propia propiedad.

`TableProvider` monta el motor y lo comparte; `DataTableView` lo dibuja. La tabla
y sus controles laterales comparten una sola instancia y una sola fuente de
preferencias.

```
TableProvider  ->  DataTableView      (la tabla)
               ->  ColumnSettingsPanel (al lado)
               ->  ViewsBar / FilterBuilder / GroupingSelector
```

`DataTable` compone las dos piezas y conserva su API pública intacta, así que los
módulos administrativos no se enteraron del cambio.

### Capacidades avanzadas

Se declaran todas desde el principio en `AdvancedTableCapabilities` y se enciende
cada una por separado. `IMPLEMENTED_CAPABILITIES` dice cuáles existen ya; activar
una pendiente avisa por consola en lugar de no hacer nada en silencio.

Los filtros avanzados no se resuelven dentro del motor: `applyAdvancedFilters` es
una función pura que filtra los datos antes de entregárselos. La semántica de los
siete operadores queda en un solo archivo y se prueba sin montar nada.

## Vista adaptativa y multi vista

Un módulo puede representarse de más de una forma. Qué forma corresponde lo
decide `useViewMode()`, que devuelve `mode` y `reason`.

La decisión no es solo del tamaño de pantalla: entra también lo que el usuario
puede hacer y, en el futuro, su preferencia. La regla es que **quien administra la
plataforma trabaja en escritorio**: quien accede a Usuarios o a Seguridad ve la
tabla, y quien no, en una pantalla pequeña ve tarjetas.

Se pregunta al servicio de autorización, nunca por el nombre del rol: renombrar un
rol no debe cambiar lo que se ve, y decidir por el cargo está prohibido (ver
AGENTS.md). La regla vive en una función pura que recibe la respuesta ya resuelta,
así que se lee y se prueba sin montar nada.

`useIsMobile` es el único sitio de la aplicación que mira el tamaño de la ventana;
ninguna página lo consulta.

Cada módulo con varias vistas registra las suyas:

```
features/tickets/views/
  ticket-view.types.ts   contrato que cumple toda vista
  ticket-table-view.tsx  registrada como 'table'
  ticket-card-view.tsx   registrada como 'cards'
  index.ts               registro y resolución
```

La página consulta los datos una sola vez y los entrega a la vista elegida. Eso es
lo que garantiza que todas consuman el mismo Repository, el mismo Provider y la
misma consulta de React Query: solo cambia cómo dibujan la información.

Añadir Kanban, Calendario, Timeline o Mapa es escribir un componente que cumpla
`TicketViewProps` y registrarlo. Están declarados en `ViewKind` y ausentes de
`IMPLEMENTED_VIEW_KINDS`; pedir uno que aún no existe cae a la tabla en lugar de
dejar la pantalla en blanco.

## Infraestructura de formularios

`shared/components/form/` concentra lo que todo formulario necesita y es fácil
resolver distinto cada vez: el modal, dónde se muestra el error del servidor, el
comportamiento de los botones al guardar y el cableado de accesibilidad de cada
campo.

Un formulario de dominio solo aporta qué campos existen y cómo se validan. La
validación usa el esquema Zod del contrato compartido, así que el frontend y el
backend no pueden discrepar sobre qué es válido.

Cuando la forma del formulario difiere de la del contrato —el formulario pide
Nombre y Apellidos, el backend almacena un único `fullName`— la conversión es
explícita y vive en un solo archivo.

## Configuración

Toda la configuración viene de variables de entorno, validadas con Zod al
arrancar. Si falta una variable obligatoria o un secreto es demasiado corto, la
aplicación no arranca. En producción además se rechazan los secretos de ejemplo
y se exige que el secreto de acceso y el de refresco sean distintos.

Fallar al arrancar es preferible a descubrir el problema con la plataforma en
funcionamiento.
