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

Dos guards actúan de forma global:

1. `JwtAuthGuard` exige sesión. Un endpoint queda público solo si se declara con
   `@Public()`: si alguien olvida protegerlo, queda protegido por omisión.
2. `PermissionsGuard` verifica los permisos declarados. Se exigen todos los
   listados, no uno cualquiera.

El frontend también comprueba permisos, pero solo para no mostrar lo que no
sirve. La autorización real siempre la aplica el backend.

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

La decisión no es solo del tamaño de pantalla: entran el rol y, en el futuro, la
preferencia del usuario. `useIsMobile` es el único sitio de la aplicación que mira
el tamaño de la ventana; ninguna página lo consulta.

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
