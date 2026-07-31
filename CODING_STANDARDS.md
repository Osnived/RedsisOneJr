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
  components/
    ui/          Componentes de interfaz sin dominio (Button, Badge, Checkbox)
    table/       Framework de tablas
  features/
    <dominio>/
      columns/   Definición de columnas del módulo
      mocks/     Datos de prueba, si aplica
      <d>.api.ts Servicio de datos
      use-<d>.ts Hook de consulta
  hooks/         Hooks transversales
  lib/           Lógica pura sin React
  routes/        Páginas y árbol de rutas
  stores/        Estado de cliente (Zustand)
  types/         Tipos transversales
```

Un módulo nuevo se crea dentro de `features/`, nunca en `modules/`: STACK.md
exige Feature First y el proyecto ya sigue esa convención.

---

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
