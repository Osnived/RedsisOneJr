# Imagen del frontend: se compila a archivos estáticos y se sirven con nginx.
#
# El contexto de build es la raíz del monorepo, porque el frontend depende del
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
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @redsis/web... --filter @redsis/contracts...

# --- Compilación ----------------------------------------------------------
FROM deps AS build
WORKDIR /repo

# Vite incrusta las variables en el bundle, por eso deben existir al compilar
# y no en tiempo de ejecución.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web

RUN pnpm --filter @redsis/contracts build \
    && pnpm --filter @redsis/web build

# --- Imagen final ---------------------------------------------------------
FROM nginx:1.29-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

# nginx:alpine ya trae un usuario sin privilegios configurado para el puerto 8080.
USER nginx

CMD ["nginx", "-g", "daemon off;"]
