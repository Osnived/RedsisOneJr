# CODING_STANDARDS.md

Versión: 1.0

Estado: Vigente

---

# Propósito

[AGENTS.md](AGENTS.md) define **qué** reglas rigen la arquitectura.
[STACK.md](STACK.md) define **con qué** se construye.
Este documento define **cómo se escribe el código** para cumplirlas.

Recoge las convenciones que el proyecto ya sigue, no propone nuevas. Se escribió
al terminar el framework de tablas para dejar por escrito lo que hasta entonces
solo existía en el código.

---

# Nombres de archivos

| Tipo                    | Convención                     | Ejemplo                    |
| ----------------------- | ------------------------------ | -------------------------- |
| Componente React        | `kebab-case.tsx`               | `table-pagination.tsx`     |
| Hook                    | `use-<nombre>.ts`              | `use-table-preferences.ts` |
| Servicio de datos       | `<dominio>.api.ts`             | `tickets.api.ts`           |
| Columnas de módulo      | `<dominio>.columns.tsx`        | `ticket.columns.tsx`       |
| Tipos                   | `<concepto>.ts`                | `preferences.ts`           |
| Prueba                  | `<archivo>.spec.ts(x)`         | `use-tickets.spec.tsx`     |
| Contrato de repositorio | `<entidad>.repository.ts`      | `user.repository.ts`       |
| Provider                | `prisma-<entidad>.provider.ts` | `prisma-user.provider.ts`  |

Se usa `.tsx` solo cuando el archivo contiene JSX. Un archivo de columnas con
celdas propias es `.tsx`; uno sin render propio es `.ts`.

---

# Estructura del frontend

```
src/
  shared/            Infraestructura reutilizable, sin dominio
    components/
      form/          EntityModal, EntityForm, FormField, FormFooter
      layout/        AppShell
      table/         BaseTable, AdvancedTable, RowActions y componentes internos
      ui/            Button, Badge, Input, Select, Dialog, DropdownMenu...
    hooks/           Hooks transversales
    lib/             Lógica pura sin React y cliente HTTP
    types/           Contratos del framework
  features/
    <dominio>/
      columns/       Definición de columnas del módulo
      mocks/         Datos de prueba, si aplica
      views/         Formas alternativas de presentar el módulo
      <d>.api.ts     Servicio de datos
      use-<d>.ts     Hook de consulta
      <d>-form.tsx   Formulario, si el módulo lo tiene
  routes/            Páginas y árbol de rutas
  stores/            Estado de cliente (Zustand)
  test/              Preparación y fixtures de pruebas
```

La regla es binaria:

- **Si no conoce ningún dominio, va en `shared/`.** El BaseTable no sabe qué es un
  ticket.
- **Si conoce un dominio, va en `features/<dominio>/`.** Las columnas de tickets
  saben qué es un estado y de qué color se pinta.

Un módulo nuevo se crea dentro de `features/`, nunca en `modules/`: STACK.md
exige Feature First y el proyecto sigue esa convención.

Las páginas de `routes/` **orquestan y no deciden**: entregan columnas, datos y
callbacks. Cualquier regla que aparezca en una página pertenece a su feature.

# Estructura del backend

```
src/
  common/          Guards, decoradores, filtros, DTO transversales
  config/          Validación del entorno
  infrastructure/  Acceso técnico (Prisma)
  modules/
    <dominio>/
      dto/                       Entrada validada con class-validator
      providers/                 Implementación por origen de datos
      <d>.repository.ts          Contrato de acceso a datos
      <d>.service.ts             Reglas de negocio
      <d>.controller.ts          Endpoints
      <d>.module.ts              Ensamblado
```

---

# Reglas que el código ya cumple

## Nada de `any`

Sin excepciones. Cuando el tipo es desconocido se usa `unknown` y se estrecha.

## Solo los Providers conocen el origen de datos

Ningún servicio, controlador ni componente inyecta `PrismaService`. Si hace falta
consultar algo, se declara un método en el Repository correspondiente. Aplica
también a comprobaciones técnicas: el healthcheck tiene su propio Repository por
esta razón.

## Un Repository devuelve tipos de dominio

Nunca modelos de Prisma. Es lo que impide que el dominio quede atado al ORM.

## Ningún componente llama a `fetch`

Todo pasa por `lib/api-client.ts`. La regla la impone ESLint, no la costumbre.

## Los DTO implementan los contratos compartidos

```ts
export class LoginDto implements LoginInput { ... }
```

Si el contrato de `@redsis/contracts` cambia y el DTO no, el backend deja de
compilar. La duplicación que quedaría sin vigilancia se vuelve un error visible.

## Componentes por debajo de 250 líneas

Cuando uno crece, se extrae por responsabilidad, no por número de líneas. El
cuerpo de la tabla solo dibuja filas; los estados de carga, error y vacío son
componentes propios.

## Lógica pura fuera de los hooks

Si una función no usa React, vive en `lib/` o en un archivo aparte y se prueba
sin montar nada.

## Las acciones las declara la feature, no el framework

`RowActions` solo dibuja. Qué acciones existen, quién puede verlas y cuándo
aplican se declara en la feature:

```ts
buildUserActions({ can, currentUserId, onEdit, onSetActive });
```

## Los formularios reutilizan la infraestructura compartida

Ningún formulario monta su propio modal ni su propio pie de acciones. Se compone
con `EntityModal` + `EntityForm` + `FormField`, y solo aporta qué campos existen y
cómo se validan.

## La forma del formulario puede diferir de la del contrato

El formulario pide lo que el usuario espera rellenar; la API recibe lo que
almacena. Cuando difieren, la conversión es explícita y vive en un solo sitio
(`user-form.schema.ts` es el ejemplo: separa Nombre y Apellidos y los une al
guardar).

## Las fechas se almacenan como `DateTime` y se pintan con un solo componente

Regla global desde el Release 0.6.

En Prisma, todo campo de fecha es `DateTime`, nunca `Date`. Un campo sin hora no se
puede ampliar después sin migrar datos.

En los contratos viajan como texto ISO 8601.

En el frontend ninguna feature las formatea:

```tsx
// Mal: cada feature decide su formato
<span>{new Date(ticket.createdAt).toLocaleDateString('es')}</span>

// Bien
<DateTime value={ticket.createdAt} />
<DateTime value={ticket.createdAt} format="date" />
```

`shared/components/ui/date-time.tsx` es el único sitio que las renderiza, y
`shared/lib/format-date-time.ts` el único que las convierte en texto. Cambiar el
formato, la zona horaria o el idioma se hace en un archivo.

## La autorización se pregunta, no se calcula

Ningún componente lee `user.permissions`, y **nunca** se compara el nombre de un
rol:

```ts
// Prohibido
if (user.roles.includes('administrador')) { ... }
if (user.permissions.includes('tickets.edit')) { ... }

// Único camino
const auth = useAuthorization();
if (auth.canAccess(APP_MODULES.TICKETS)) { ... }
if (auth.can(PERMISSIONS.TICKETS_EDIT)) { ... }
```

Son dos preguntas distintas: `canAccess` pregunta si el módulo existe para el
usuario, `can` si puede ejecutar una acción. La segunda comprueba también la
primera.

El motivo es que cómo se calculan los accesos cambia —hoy se acumulan los roles,
mañana habrá alcance y vigencia— y ese cálculo no debe conocerlo ninguna pantalla.

## Sin `setState` dentro de un efecto

Provoca renders en cascada y el lint lo rechaza. Para ajustar estado ante un
cambio de propiedad se compara durante el render; para limpiar al cerrar algo, se
limpia en el propio manejador.

---

# Comentarios

Se comenta **por qué**, no **qué**. El código ya dice qué hace.

```ts
// Mal: incrementa la página
// Bien: un orden nuevo invalida la página actual, la fila buscada ya no está ahí
```

Se documenta con JSDoc lo que otro desarrollador consumirá desde fuera: props
públicas, contratos y decisiones no evidentes. No se documenta lo obvio.

---

# Pruebas

Cada pieza se prueba al nivel que corresponde:

| Pieza            | Herramienta              | Qué se comprueba            |
| ---------------- | ------------------------ | --------------------------- |
| Lógica pura      | Vitest, entorno `node`   | Entradas y salidas          |
| Hook             | Vitest + `renderHook`    | Estado y efectos            |
| Componente       | Vitest + Testing Library | Lo que ve y hace el usuario |
| Servicio backend | Jest + dobles            | Reglas de negocio           |

Convenciones:

- Los nombres describen el comportamiento esperado, en español, no el método que
  ejercitan: `no permite ocultar el número de ticket`, no `test hideable`.
- Se consulta por rol y nombre accesible (`getByRole`), no por clases CSS.
- Las pruebas de lógica pura declaran `/** @vitest-environment node */`: montar
  jsdom cuesta segundos por archivo.
- Un doble parcial es preferible a un objeto completo con campos que la prueba no
  usa.

---

# Antes de subir cambios

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
```

Es exactamente lo que ejecuta la integración continua.

Y las cuatro preguntas de [AGENTS.md](AGENTS.md):

- ¿Rompe la arquitectura?
- ¿Duplica lógica?
- ¿Existe una solución más simple?
- ¿Puede reutilizarse?
