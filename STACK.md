# TECH_STACK.md

Versión: 1.0

Estado: Oficial

---

# Objetivo

Este documento define el stack tecnológico oficial de la plataforma.

Las tecnologías aquí definidas son obligatorias.

No deben cambiarse sin una decisión arquitectónica documentada mediante un ADR (Architecture Decision Record).

El objetivo es garantizar consistencia durante toda la vida del proyecto.

---

# Filosofía

La selección de tecnologías se basa en los siguientes principios:

- Simplicidad
- Escalabilidad
- Bajo acoplamiento
- Mantenibilidad
- Comunidad activa
- Documentación oficial
- Facilidad para trabajar con IA
- Productividad

Nunca se elegirá una tecnología únicamente porque sea popular.

---

# Arquitectura General

                React
                   │
            TanStack Router
                   │
          TanStack Query
                   │
             NestJS API
                   │
              Repository
                   │
               Provider
           ┌────────┴────────┐
           │                 │
      PostgreSQL         Baserow

---

# Frontend

## Framework

React

Versión estable más reciente.

---

## Build Tool

Vite

Motivos:

- Inicio rápido
- Excelente DX
- HMR
- Ecosistema moderno

---

## Lenguaje

TypeScript

Configuración:

strict = true

No se permite JavaScript.

---

## Estilos

Tailwind CSS

Será el único sistema de estilos.

No se utilizarán hojas CSS tradicionales salvo casos muy específicos.

---

## Componentes

shadcn/ui

Todos los componentes reutilizables deberán construirse utilizando shadcn.

No se utilizarán librerías completas como Material UI.

---

## Routing

TanStack Router

Razones:

- Type Safe
- Excelente integración con TypeScript
- Arquitectura moderna
- Mejor experiencia para aplicaciones complejas

---

## Estado Remoto

TanStack Query

Toda comunicación con el backend deberá realizarse mediante TanStack Query.

Nunca realizar llamadas HTTP directamente desde componentes.

---

## Estado Local

Zustand

Únicamente para estado global del cliente.

Ejemplos:

Tema

Usuario autenticado

Configuración

Sidebar

Preferencias

Nunca almacenar información del servidor.

---

## Formularios

React Hook Form

---

## Validaciones

Zod

Toda validación del frontend utilizará Zod.

---

## Tablas

TanStack Table

Debe soportar:

- filtros
- ordenamiento
- paginación
- ocultar columnas
- redimensionar columnas
- guardar preferencias

---

## Gráficos

Apache ECharts

Razones:

- Alto rendimiento
- Gran cantidad de tipos de gráfico
- Dashboards profesionales

---

## Mapas

Google Maps

Librería:

@vis.gl/react-google-maps

---

## Iconos

lucide-react

---

# Backend

## Framework

NestJS

Toda la lógica del negocio reside en NestJS.

---

## Lenguaje

TypeScript

strict = true

---

## ORM

Prisma

Nunca escribir SQL dentro de servicios.

---

## Base de Datos Principal

PostgreSQL

Proveedor recomendado:

Supabase

Supabase será utilizado únicamente como proveedor de PostgreSQL.

No se utilizará su sistema de autenticación.

---

## Base de Datos Operacional

Baserow

Utilizado exclusivamente para datos operativos como Tickets.

Nunca almacenar usuarios o permisos en Baserow.

---

## Autenticación

JWT

Refresh Token

Guards

Passport

---

## Validaciones

class-validator

class-transformer

---

## Documentación

Swagger

Toda API debe documentarse automáticamente.

---

## Logs

Pino

No utilizar console.log en producción.

---

# Infraestructura

## Contenedores

Docker

Toda la plataforma debe ejecutarse mediante Docker.

---

## Orquestación Local

docker-compose

---

## Despliegue

EasyPanel

---

## Proxy

Traefik (preferido)

o

Nginx

---

# CI/CD

GitHub Actions

Toda integración deberá pasar por el pipeline.

---

# Testing

## Frontend

Vitest

React Testing Library

---

## Backend

Jest

---

## E2E

Playwright

---

# Gestión de Paquetes

pnpm

Nunca utilizar npm ni yarn.

---

# Monorepo

TurboRepo

Estructura:

apps/

packages/

docs/

---

# Editor recomendado

Visual Studio Code

---

# Extensiones recomendadas

ESLint

Prettier

Tailwind IntelliSense

Prisma

Docker

GitLens

Error Lens

---

# Variables de Entorno

Toda configuración debe provenir de variables de entorno.

Nunca escribir secretos en el código.

---

# Arquitectura de Datos

El frontend nunca conoce el origen de los datos.

Siempre consume la API.

La API decide qué Provider utilizar.

---

# Providers

Ejemplo:

TicketProvider

↓

Baserow

o

↓

PostgreSQL

El frontend nunca cambia.

---

# Tecnologías Prohibidas

No utilizar:

Material UI

Bootstrap

Redux

Express

CSS Modules

styled-components

jQuery

Moment.js

Axios directamente dentro de componentes

fetch directamente dentro de componentes

any

---

# Convenciones

Todo código debe cumplir:

SOLID

Clean Architecture

Repository Pattern

DTO Pattern

Dependency Injection

Feature First

Type Safety

# Docker

Toda la plataforma debe ejecutarse mediante Docker.

No debe existir una dependencia de ejecutar manualmente servicios en la máquina local.

Todo desarrollador debe poder levantar el proyecto ejecutando únicamente:

pnpm install

docker compose up -d

pnpm dev

o, en producción:

docker compose up -d

sin realizar configuraciones adicionales.

---

Cada aplicación tendrá su propio Dockerfile.

Frontend

Backend

Opcionalmente:

Playwright

Documentación

---

La plataforma debe ser compatible con:

- Docker Desktop
- EasyPanel
- Portainer
- Coolify
- Kubernetes (futuro)

---

Toda imagen deberá ser multi-stage.

No utilizar imágenes innecesariamente grandes.

Preferir imágenes Alpine cuando sea posible.

# Objetivo Final

Construir una plataforma empresarial preparada para evolucionar durante años sin requerir cambios estructurales importantes.
