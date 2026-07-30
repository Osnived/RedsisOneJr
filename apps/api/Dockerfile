# Imagen del backend. Multi-stage para no arrastrar el código fuente ni las
# dependencias de desarrollo a la imagen final (STACK.md).
#
# El contexto de build es la raíz del monorepo, porque la API depende del
# paquete @redsis/contracts.

# --- Dependencias ---------------------------------------------------------
FROM node:24-alpine AS deps
RUN corepack enable
WORKDIR /repo

# Certificados de confianza adicionales (redes con proxy TLS corporativo).
# Si certs/ solo contiene el .gitkeep, no se instala nada.
COPY certs/ /usr/local/share/ca-certificates/
RUN apk add --no-cache ca-certificates && update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @redsis/api... --filter @redsis/contracts...

# --- Compilación ----------------------------------------------------------
FROM deps AS build
WORKDIR /repo

COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

RUN pnpm --filter @redsis/contracts build \
    && pnpm --filter @redsis/api db:generate \
    && pnpm --filter @redsis/api build

# Se descartan las dependencias de desarrollo antes de copiar a la imagen final.
RUN pnpm prune --prod

# --- Imagen final ---------------------------------------------------------
FROM node:24-alpine AS runtime
RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production

# Ejecutar como usuario sin privilegios.
RUN addgroup -S redsis && adduser -S redsis -G redsis

COPY --from=build --chown=redsis:redsis /repo/node_modules ./node_modules
COPY --from=build --chown=redsis:redsis /repo/packages/contracts ./packages/contracts
COPY --from=build --chown=redsis:redsis /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=redsis:redsis /repo/apps/api/dist ./apps/api/dist
COPY --from=build --chown=redsis:redsis /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=redsis:redsis /repo/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=build --chown=redsis:redsis /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=redsis:redsis /repo/package.json ./package.json
COPY --from=build --chown=redsis:redsis /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --chown=redsis:redsis apps/api/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

USER redsis
WORKDIR /app/apps/api
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
