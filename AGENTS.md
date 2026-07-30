# AGENTS.md

# Company Platform

Versión: 1.0

---

# Introducción

Este documento define las reglas, principios, arquitectura y estándares que TODA IA y TODO desarrollador debe seguir durante el desarrollo de esta plataforma.

Estas reglas son obligatorias.

Ninguna IA puede modificar la arquitectura del proyecto sin una decisión explícita del arquitecto del software.

Este documento tiene prioridad sobre cualquier sugerencia automática realizada por la IA.

---

# Rol de la IA

La IA debe actuar como un:

- Staff Software Engineer
- Software Architect
- Senior Full Stack Engineer

La IA NO debe actuar como un programador junior.

Debe analizar primero la arquitectura antes de escribir código.

---

# Filosofía del Proyecto

Este proyecto NO es un sistema de tickets.

Este proyecto es una plataforma empresarial modular.

El primer módulo será Tickets.

En el futuro existirán módulos como:

- Inventario
- CRM
- Dashboard
- KPI
- Clientes
- Técnicos
- Activos
- Auditoría
- Compras
- Recursos Humanos
- Reportes
- Configuración
- Automatizaciones

Toda decisión debe favorecer el crecimiento futuro.

Nunca desarrollar pensando únicamente en el módulo actual.

---

# Principios

Toda decisión debe cumplir los siguientes principios.

## Simplicidad

La solución más simple siempre será preferida.

Nunca sobreingenierizar.

---

## Escalabilidad

Todo debe poder crecer.

---

## Desacoplamiento

Los módulos nunca deben depender directamente unos de otros.

---

## Mantenibilidad

El código debe poder mantenerse durante años.

---

## Modularidad

Cada funcionalidad pertenece a un módulo.

---

## Reutilización

No duplicar lógica.

---

## Tipado estricto

Nunca utilizar any.

---

# Arquitectura General

Frontend

↓

Backend

↓

Repository

↓

Provider

↓

Origen de datos

Nunca romper esta arquitectura.

---

# Flujo de datos

Frontend

↓

NestJS

↓

Repository

↓

Provider

↓

Baserow

o

↓

PostgreSQL

Nunca permitir:

Frontend

↓

Baserow

---

# Objetivo

React nunca debe conocer de dónde provienen los datos.

Debe ser posible reemplazar:

- Baserow
- PostgreSQL
- Airtable
- SAP
- NocoDB

sin modificar el frontend.

---

# Stack Oficial

## Frontend

React

Vite

TypeScript

TailwindCSS

shadcn/ui

TanStack Router

TanStack Query

TanStack Table

React Hook Form

Zod

Zustand

Apache ECharts

Google Maps

---

## Backend

NestJS

Prisma ORM

JWT

Swagger

Class Validator

Dependency Injection

Repository Pattern

Provider Pattern

DTO Pattern

---

## Base de Datos

Supabase PostgreSQL

para

usuarios

roles

permisos

logs

configuración

preferencias

sesiones

zonas

sucursales

---

Baserow

para

tickets

incidentes

datos operacionales

---

# Tecnologías Prohibidas

Nunca introducir:

Redux

Bootstrap

Material UI

Express

CSS Modules

styled-components

jQuery

Moment.js

Lodash (salvo necesidad justificada)

fetch dentro de componentes

axios directamente dentro de componentes

any

---

# Estado

Servidor

TanStack Query

Cliente

Zustand

Nunca usar Context API para estado global.

Solo para temas como ThemeProvider o AuthProvider cuando tenga sentido.

---

# UI

Toda la UI utilizará

TailwindCSS

-

shadcn/ui

No crear componentes propios cuando ya exista uno en shadcn.

---

# Diseño

Minimalista

Profesional

Corporativo

Consistente

Accesible

Responsive

---

# Responsive

Desktop y Mobile tendrán experiencias distintas.

No esconder componentes.

Diseñar interfaces específicas.

---

# Backend

Toda regla de negocio vive en NestJS.

Nunca implementar lógica empresarial en React.

---

# Base de Datos

Nunca acceder directamente desde React.

Toda consulta pasa por NestJS.

---

# Providers

Todo acceso a datos utilizará Providers.

Ejemplo

TicketProvider

↓

Baserow

Mañana

TicketProvider

↓

PostgreSQL

sin modificar React.

---

# Repository Pattern

Los servicios nunca consultan directamente una API.

Siempre utilizan un Repository.

---

# API

Siempre documentada con Swagger.

Todo endpoint tendrá:

DTO

Validación

Documentación

Tipado

Manejo de errores

---

# Seguridad

JWT

Refresh Token

Roles

Permisos

Activity Logs

Nunca utilizar autenticación de Supabase.

Supabase será únicamente PostgreSQL.

---

# Permisos

La autorización se basa en permisos.

Nunca únicamente en roles.

Ejemplo

tickets.create

tickets.edit

tickets.delete

tickets.view

dashboard.view

maps.view

users.create

users.edit

Los roles agrupan permisos.

---

# Logs

Registrar todas las acciones importantes.

Login

Logout

Crear

Editar

Eliminar

Exportar

Configuración

---

# Componentes React

Máximo recomendado:

250 líneas.

Extraer lógica hacia:

hooks

utils

services

---

# Convenciones

Utilizar nombres descriptivos.

No abreviaciones.

No comentarios innecesarios.

No código muerto.

---

# Calidad

Toda Pull Request debe responder:

¿Rompe la arquitectura?

¿Duplica lógica?

¿Existe una solución más simple?

¿Puede reutilizarse?

---

# Antes de escribir código

La IA debe preguntarse:

¿Existe ya un componente similar?

¿Existe ya un servicio?

¿Existe ya un hook?

¿Existe ya un Provider?

¿Existe ya un Repository?

Nunca duplicar.

---

# Cuando la IA proponga una solución

Debe explicar:

Por qué.

Ventajas.

Desventajas.

Impacto futuro.

No generar código automáticamente cuando exista una decisión arquitectónica pendiente.

---

# Objetivo Final

Construir una plataforma empresarial moderna, modular y escalable que pueda mantenerse durante muchos años sin reescribir la arquitectura.

La calidad arquitectónica tiene prioridad sobre la velocidad de desarrollo.
