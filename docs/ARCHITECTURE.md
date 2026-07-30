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
| `permissions`  | Catálogo de permisos agrupado por módulo  |
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

## Configuración

Toda la configuración viene de variables de entorno, validadas con Zod al
arrancar. Si falta una variable obligatoria o un secreto es demasiado corto, la
aplicación no arranca. En producción además se rechazan los secretos de ejemplo
y se exige que el secreto de acceso y el de refresco sean distintos.

Fallar al arrancar es preferible a descubrir el problema con la plataforma en
funcionamiento.
