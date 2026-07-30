# Redsis One Jr

Plataforma empresarial modular. El primer módulo será Tickets, pero la
plataforma no es un sistema de tickets: es la base sobre la que se montarán
Inventario, CRM, Dashboard, KPI y el resto de módulos.

Los documentos de gobierno del proyecto son obligatorios y tienen prioridad
sobre cualquier decisión posterior:

- [AGENTS.md](AGENTS.md) — reglas de arquitectura y estándares
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — contexto de negocio y lenguaje común
- [STACK.md](STACK.md) — stack tecnológico oficial

## Estado actual

Base de la arquitectura funcionando de punta a punta:

| Pieza                | Estado                                                       |
| -------------------- | ------------------------------------------------------------ |
| Monorepo             | pnpm workspaces + TurboRepo                                  |
| Backend              | NestJS 11 con Repository + Provider                          |
| Base de datos        | PostgreSQL 17 con Prisma 7                                   |
| Frontend             | React 19 + Vite + TanStack Router/Query + Tailwind v4        |
| Autenticación        | JWT con access token corto y refresh token rotativo          |
| Autorización         | Basada en permisos, aplicada en el backend                   |
| Trazabilidad         | Historial de actividad de las acciones relevantes            |
| Contenedores         | Dockerfiles multi-stage + docker-compose                     |
| Integración continua | GitHub Actions: formato, lint, tipos, pruebas e imágenes     |
| Pruebas              | 105 pruebas unitarias (Jest en el backend, Vitest en el web) |

## Estructura

```
apps/
  api/                 Backend NestJS
  web/                 Frontend React
packages/
  contracts/           Tipos y esquemas Zod compartidos
docs/
  ARCHITECTURE.md      Cómo está construida la plataforma
  GETTING_STARTED.md   Cómo levantarla
  adr/                 Decisiones arquitectónicas registradas
```

## Arrancar en desarrollo

```bash
pnpm install
```

```bash
docker compose -f docker-compose.dev.yml up -d
```

```bash
cp apps/api/.env.example apps/api/.env && cp apps/web/.env.example apps/web/.env
```

```bash
pnpm db:deploy && pnpm db:seed
```

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Documentación de la API: http://localhost:3000/api/docs

Usuario inicial: `admin@redsis.com` / `Redsis2026`.

Los detalles están en [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md).

## Comandos

| Comando           | Qué hace                                       |
| ----------------- | ---------------------------------------------- |
| `pnpm dev`        | Levanta backend y frontend                     |
| `pnpm build`      | Compila todo el monorepo                       |
| `pnpm test`       | Ejecuta las pruebas unitarias                  |
| `pnpm test:cov`   | Pruebas con informe de cobertura               |
| `pnpm lint`       | Análisis estático                              |
| `pnpm typecheck`  | Verificación de tipos                          |
| `pnpm format`     | Aplica el formato del proyecto                 |
| `pnpm db:migrate` | Crea y aplica una migración en desarrollo      |
| `pnpm db:deploy`  | Aplica migraciones existentes                  |
| `pnpm db:seed`    | Carga permisos, roles y el usuario inicial     |
| `pnpm db:studio`  | Abre Prisma Studio                             |
| `pnpm docker:up`  | Levanta la plataforma completa en contenedores |

## Antes de abrir una Pull Request

Según [AGENTS.md](AGENTS.md), toda Pull Request debe responder:

- ¿Rompe la arquitectura?
- ¿Duplica lógica?
- ¿Existe una solución más simple?
- ¿Puede reutilizarse?
