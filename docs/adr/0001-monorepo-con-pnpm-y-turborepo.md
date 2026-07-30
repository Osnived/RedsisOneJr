# ADR 0001 — Monorepo con pnpm workspaces y TurboRepo

- Fecha: 2026-07-30
- Estado: Aceptado

## Contexto

STACK.md exige TurboRepo con la estructura `apps/`, `packages/` y `docs/`, y pnpm
como único gestor de paquetes. El repositorio partía de dos carpetas
independientes (`Front` y `Back`) sin relación entre ellas.

Frontend y backend necesitan compartir la forma de las peticiones y respuestas y
el catálogo de permisos. Sin un lugar común, esa información se duplica y se
desincroniza en silencio.

## Decisión

Reestructurar el repositorio como monorepo:

```
apps/api          Backend NestJS
apps/web          Frontend React
packages/contracts Tipos y esquemas Zod compartidos
```

`packages/contracts` se compila en dos formatos: ESM para el frontend (Vite) y
CommonJS para el backend (NestJS). Se usa `tsc` dos veces con configuraciones
distintas, sin herramientas de empaquetado adicionales.

## Alternativas consideradas

**Repositorios separados con un paquete publicado.** Cada cambio de contrato
requeriría publicar una versión y actualizar dos repositorios. Demasiada fricción
para un equipo pequeño y una plataforma en construcción.

**Duplicar los tipos en cada aplicación.** Es lo que ocurre por defecto y es
justamente lo que hay que evitar: los contratos se desvían sin que nada avise.

**Publicar el paquete compartido como código TypeScript sin compilar.** El
frontend lo aceptaría, pero el backend compila con `tsc` y no puede incluir
código fuente que está fuera de su `rootDir`.

## Consecuencias

A favor:

- Un solo lugar define los contratos; un cambio incompatible rompe la
  compilación en lugar de fallar en ejecución.
- Turbo evita recompilar lo que no cambió y ordena las dependencias entre
  paquetes.
- Una sola instalación, un solo lockfile, una sola configuración de formato y
  análisis estático.

En contra:

- `packages/contracts` debe compilarse antes de usarse. Turbo lo resuelve con
  `dependsOn: ["^build"]`, pero al clonar el repositorio hay que ejecutar una
  compilación inicial.
- La doble compilación ESM/CJS obliga a mantener dos `tsconfig`.

## Nota sobre `moduleResolution`

Las builds CommonJS (backend y contratos) usan `moduleResolution: Node10`, que
TypeScript 6 marca como obsoleta. Es la única resolución compatible con
`module: CommonJS`, que NestJS necesita. Se silencia de forma explícita con
`ignoreDeprecations: "6.0"` y acotada a esos archivos. Habrá que revisarlo antes
de adoptar TypeScript 7.
