# Puesta en marcha

## Requisitos

| Herramienta | Versión mínima | Comprobar con |
| ----------- | -------------- | ------------- |
| Node.js     | 24             | `node -v`     |
| pnpm        | 11             | `pnpm -v`     |
| Docker      | 27             | `docker -v`   |

pnpm es obligatorio; no se usa npm ni yarn (STACK.md). Si no está instalado:

```bash
corepack enable && corepack prepare pnpm@11.9.0 --activate
```

## Desarrollo

Modo recomendado para el día a día: la base de datos en Docker y el código en la
máquina, para conservar el recargado en caliente.

### 1. Dependencias

```bash
pnpm install
```

### 2. Base de datos

```bash
docker compose -f docker-compose.dev.yml up -d
```

Levanta PostgreSQL 17 en el puerto 5432 con usuario, contraseña y base `redsis`.

### 3. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
```

```bash
cp apps/web/.env.example apps/web/.env
```

Los valores de ejemplo funcionan en local. Los secretos de ejemplo están
bloqueados en producción a propósito.

### 4. Esquema y datos iniciales

```bash
pnpm db:deploy
```

```bash
pnpm db:seed
```

La semilla crea 18 permisos, 3 roles del sistema y el usuario administrador. Es
idempotente: puede repetirse sin duplicar datos, y no sobrescribe la contraseña
de un administrador que ya exista.

### 5. Arrancar

```bash
pnpm dev
```

| Servicio           | URL                              |
| ------------------ | -------------------------------- |
| Frontend           | http://localhost:5173            |
| API                | http://localhost:3000/api        |
| Documentación API  | http://localhost:3000/api/docs   |
| Estado del sistema | http://localhost:3000/api/health |

Credenciales iniciales: `admin@redsis.com` / `Redsis2026`.

## Plataforma completa en contenedores

```bash
cp .env.example .env
```

Rellenar `JWT_SECRET` y `REFRESH_TOKEN_SECRET` en `.env`. Son obligatorios y
deben ser distintos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

```bash
docker compose up -d --build
```

Las migraciones se aplican automáticamente al arrancar el contenedor de la API.
Los datos iniciales se cargan una vez con:

```bash
docker compose exec api node /app/node_modules/tsx/dist/cli.mjs prisma/seed.ts
```

| Servicio | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:8080 |
| API      | http://localhost:3000 |

Para detener todo:

```bash
docker compose down
```

Para detener y borrar también los datos:

```bash
docker compose down -v
```

## Trabajo diario

### Cambiar el esquema de la base de datos

Editar `apps/api/prisma/schema.prisma` y después:

```bash
pnpm db:migrate
```

Crea la migración, la aplica y regenera el cliente de Prisma.

### Verificar antes de subir cambios

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
```

Es lo mismo que ejecuta la integración continua.

### Pruebas

```bash
pnpm test
```

```bash
pnpm test:cov
```

Solo un paquete:

```bash
pnpm --filter @redsis/api test
```

### Reiniciar la base de datos

```bash
pnpm db:reset
```

Borra todos los datos, vuelve a aplicar las migraciones y ejecuta la semilla.

## Problemas frecuentes

**`Configuración de entorno inválida`**
Falta una variable o un secreto tiene menos de 32 caracteres. El mensaje indica
cuál. Revisar `apps/api/.env`.

**`Can't reach database server at localhost:5432`**
La base de datos no está levantada:

```bash
docker compose -f docker-compose.dev.yml up -d
```

**`Cannot find module '@redsis/contracts'`**
El paquete compartido no está compilado:

```bash
pnpm --filter @redsis/contracts build
```

**El frontend responde 401 en todo**
La sesión guardada apunta a otra base de datos (por ejemplo tras un
`db:reset`). Cerrar sesión o limpiar `localStorage` y volver a entrar.

**Prisma no encuentra el cliente generado**

```bash
pnpm db:generate
```

El cliente se genera en `apps/api/src/generated/prisma` y no se versiona.
