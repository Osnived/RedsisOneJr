# Resumen de release — Administración de accesos

Fecha de cierre: 31/07/2026
Rama: `feature/access-control` → `develop`
Commit del release: `58ee086`
Documento de alcance: `RELEASE_0.6_ACCESS_CONTROL.md`

> **Nota sobre el nombre del archivo.** El release cerrado aquí es el **0.6**
> (Access Control): el documento de alcance se llama `RELEASE_0.6_ACCESS_CONTROL.md`
> y el 0.7 es la integración con Baserow, todavía sin empezar (ver
> [NEXT.md](../../NEXT.md)). El archivo se creó con el nombre `0.7` porque así se
> pidió; si la numeración correcta es 0.6, basta renombrarlo.

---

# 1. Funcionalidades implementadas

## Módulo Seguridad

Pantalla única de administración de accesos en `/security`, con dos paneles:

- **Izquierda (35%)**: lista de roles con búsqueda por nombre y descripción, alta,
  edición, activación y desactivación. Los roles no se eliminan.
- **Derecha (65%)**: acceso completo del rol seleccionado. Cambiar de rol no recarga
  la página.

Reemplaza por completo a las pantallas de Roles y Permisos, que se retiraron.

## Acceso a módulos

Bloque que decide qué módulos existen para el rol. Sin acceso, el módulo no aparece
en el menú, no se abre escribiendo la URL y la API responde 403.

Los módulos sin pantalla se muestran marcados como tal en lugar de esconderse: se
les puede conceder acceso desde ya.

## Permisos por acción

Agrupados por módulo, sin tablas, con etiquetas legibles ("Ver", "Crear") en lugar
de códigos. Los grupos se derivan del catálogo, así que un permiso nuevo aparece en
su módulo sin tocar la pantalla.

## Guardado con motivo obligatorio

Pulsar Guardar no guarda: abre un modal que muestra exactamente qué va a cambiar
—módulos y permisos que gana y que pierde— y exige un motivo. Sin motivo no se puede
confirmar.

## Auditoría e historial

Cada cambio registra usuario, fecha, hora, rol, accesos y permisos anteriores y
nuevos, y el motivo. Panel inferior de solo lectura con el historial del rol
seleccionado.

## Sidebar dinámico y protección de rutas

Un solo menú, construido a partir de los accesos del usuario. Toda ruta privada
valida el módulo antes de pintar y muestra una pantalla 403 con explicación.

## Acceso total garantizado

El rol `administrador` calcula su acceso desde el catálogo en lugar de leerlo:
recibe todo lo que exista, incluido lo que se añada después, y su acceso no se puede
recortar ni desactivar.

## Regla global de DateTime (parcial)

Componente compartido `DateTime` y formateador único, más la regla documentada en
STACK.md, ARCHITECTURE.md y CODING_STANDARDS.md. **Queda pendiente** retirar el
formateo manual dentro de features.

---

# 2. Arquitectura agregada

## Base de datos

| Cambio                  | Qué aporta                                       |
| ----------------------- | ------------------------------------------------ |
| `roles.is_active`       | Desactivar un rol sin perder su configuración    |
| `roles.has_full_access` | Acceso calculado desde el catálogo               |
| `role_modules`          | Acceso de un rol a un módulo                     |
| `role_access_audits`    | Cambio de acceso, inmutable, con antes y después |

Dos migraciones: `20260731122558_access_control` y `20260731133318_role_full_access`.

## Backend

- Módulo `security` completo: Repository, Provider, Service, Controller y DTO.
- `@RequireModule` y `ModuleAccessGuard`, registrado antes del guard de permisos.
- `RolesService` dejó de tener Repository propio y delega en Seguridad, para que no
  existan dos formas de leer un rol.

## Contratos compartidos

- `modules.ts`: catálogo de once módulos con sus prefijos de permiso, etiquetas y
  rutas.
- `access-control.ts`: esquemas de creación y cambio de accesos, entrada de
  auditoría, y la documentación de Scope y de las ampliaciones previstas.

## Frontend

- `authorization.ts` y `useAuthorization()`: servicio único de autorización.
- `navigation.ts`: menú derivado del catálogo y de los accesos.
- `route-module.ts`: resolución de módulo a partir de la ruta.
- `Forbidden`: pantalla 403.
- `DateTime` y `formatDateTime`.
- Feature `security` con la pantalla, el borrador de accesos y sus componentes.

---

# 3. Decisiones importantes

## La autorización tiene dos puertas y el orden importa

El acceso al módulo se comprueba antes que los permisos. Un permiso heredado de una
configuración anterior no debe abrir un módulo ya cerrado. Sin este nivel, retirar
un módulo en la interfaz solo ocultaría el menú.

## El catálogo de módulos vive en el código, no en la base de datos

Un módulo existe cuando alguien lo programa, no cuando alguien inserta una fila. Lo
que se guarda es qué rol accede a qué módulo, por su clave.

## `permissionPrefixes` en lugar de renombrar permisos

`roles.edit` pertenece al módulo Seguridad aunque su prefijo sea `roles`. El mapa de
prefijos evitó renombrar permisos ya almacenados y mantiene una invariante probada:
todo permiso pertenece a algún módulo.

## Una sola vía de autorización, incluso a costa de quitar código que funcionaba

Se retiraron `can` y `canAny` del store de sesión. Funcionaban, pero eran una
segunda vía que no comprobaba el acceso al módulo, y dos vías acaban divergiendo.

## El acceso total es un campo, no un nombre

Comparar `role.name === 'administrador'` habría funcionado y habría sido frágil:
renombrar el rol desarmaría la garantía, y AGENTS.md prohíbe decidir por el cargo.

## Los accesos y su auditoría se escriben en la misma transacción

Partirlo dejaría la puerta abierta a un cambio sin rastro, que es exactamente lo que
este módulo existe para impedir.

## Se guarda el antes y el después completos, no la diferencia

Reconstruir el estado a partir de diferencias exige la cadena intacta desde el
origen; una sola pérdida la vuelve inútil.

## Los filtros avanzados se resuelven fuera del motor de tablas

`applyAdvancedFilters` es una función pura que filtra antes de entregar los datos.
La semántica de los siete operadores queda en un archivo y se prueba sin montar
nada. (Decisión del Release 0.5, confirmada aquí.)

---

# 4. Módulos modificados

| Módulo / zona             | Cambio                                                            |
| ------------------------- | ----------------------------------------------------------------- |
| `security` (API)          | Nuevo                                                             |
| `security` (web)          | Nuevo                                                             |
| `common/guards`           | `ModuleAccessGuard` nuevo                                         |
| `auth` (API)              | El token y el usuario incluyen módulos                            |
| `users` (API)             | El Provider resuelve el acceso efectivo y respeta roles activos   |
| `roles` (API)             | Delega en Seguridad; Repository y Provider retirados              |
| `permissions` (API)       | Exige acceso al módulo Seguridad                                  |
| `activity-log` (API)      | Exige acceso al módulo Seguridad                                  |
| `contracts`               | `modules.ts` y `access-control.ts` nuevos; roles y auth ampliados |
| `shared/lib` (web)        | `authorization`, `route-module`, `format-date-time` nuevos        |
| `shared/components` (web) | `navigation`, `Forbidden`, `DateTime` nuevos; AppShell reescrito  |
| `stores/auth` (web)       | Solo guarda la sesión; versión del almacenamiento                 |
| `routes` (web)            | `/security` nueva; `/roles` y `/permissions` retiradas            |

Se retiraron también la feature `permissions` del frontend y las columnas de roles,
que quedaban sin consumidor.

---

# 5. Riesgos conocidos

El detalle completo está en [TECH_DEBT.md](../../TECH_DEBT.md).

| Riesgo                                                | Impacto |
| ----------------------------------------------------- | ------- |
| Docker nunca se ha construido                         | Alto    |
| CI nunca se ha verificado en verde                    | Alto    |
| Seguridad no se ha visto en un navegador real         | Medio   |
| Un cambio de permisos tarda hasta que expira el token | Medio   |
| MVP 11 a medias: fechas formateadas en features       | Medio   |
| `useViewMode` compara el nombre del rol               | Medio   |

## Dos avisos operativos

**Hay que volver a iniciar sesión una vez.** Un token emitido antes del release no
lleva los módulos, y sin ellos la aplicación responde 403 en todas las pantallas. La
sesión guardada sube de versión y se descarta sola al recargar.

**No dejar corriendo `node dist/main.js` mientras se desarrolla.** Es una compilación
que no se reconstruye, ocupa el puerto 3000 e impide que arranque el watcher. Un
backend desactualizado servido así causó un 403 general que parecía un fallo de
permisos y no lo era.

---

# 6. Próximos pasos

1. Comprobar el CI en GitHub Actions.
2. Ver Seguridad en un navegador real con las tres cuentas.
3. Cerrar el MVP 11: retirar el formateo manual de fechas de las features.
4. Resolver las contradicciones registradas en TECH_DEBT.
5. Arrancar el Release 0.7: integración con Baserow. Ver [NEXT.md](../../NEXT.md).

---

# 7. Verificación al cierre

| Comprobación | Resultado                             |
| ------------ | ------------------------------------- |
| Lint         | 0 errores, 9 avisos heredados         |
| Tipos        | Limpio                                |
| Build        | Correcto                              |
| Pruebas      | 646 (84 API + 524 web + 38 contratos) |
| `any`        | 0                                     |
