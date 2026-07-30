# PROJECT_CONTEXT.md

Versión: 1.0

Estado: En construcción

Última actualización: 30/07/2026

---

# 1. Introducción

Este documento representa el contexto completo del negocio y del producto.

Toda IA o desarrollador debe leer este documento antes de comenzar cualquier desarrollo.

El objetivo es evitar que el conocimiento del proyecto dependa únicamente de conversaciones o de una persona específica.

Este documento es la fuente oficial de contexto funcional.

No describe únicamente qué hace la aplicación.

Describe por qué existe.

---

# 2. Visión del Proyecto

El proyecto consiste en desarrollar una plataforma empresarial moderna, modular y escalable para la administración de procesos internos de la empresa.

Aunque el primer módulo será un sistema de gestión de tickets e incidentes, la plataforma no debe diseñarse como un software exclusivo para soporte técnico.

La arquitectura debe permitir incorporar nuevos módulos sin modificar la estructura base del sistema.

La plataforma deberá convertirse en el punto central de operación para diferentes áreas de la empresa.

Todos los nuevos desarrollos deberán integrarse como módulos independientes reutilizando la infraestructura existente.

---

# 3. Propósito

Centralizar la operación de la empresa en una única plataforma.

Actualmente la información se encuentra distribuida en diferentes herramientas.

Esto genera:

- duplicidad de información
- dificultad para obtener indicadores
- procesos manuales
- falta de trazabilidad
- dificultad para controlar permisos
- poca integración entre procesos

La plataforma solucionará estos problemas mediante una arquitectura modular.

---

# 4. Filosofía

La plataforma debe seguir los siguientes principios.

## Un único lugar para operar

Toda la operación diaria deberá realizarse desde esta plataforma.

No se crearán aplicaciones independientes para cada proceso.

Todo será un módulo.

---

## Arquitectura modular

Cada nueva funcionalidad será un módulo.

Ejemplos:

Tickets

Inventario

Clientes

Dashboard

KPI

Reportes

Usuarios

Mapas

Activos

Automatizaciones

Mantenimientos

Auditoría

Recursos Humanos

Configuración

Cada módulo será independiente.

Nunca deberá depender directamente de otro módulo.

---

## Escalabilidad

Cada decisión debe permitir crecimiento futuro.

No se desarrollarán soluciones pensando únicamente en el MVP.

Cada componente deberá poder reutilizarse.

Cada servicio deberá poder extenderse.

Cada módulo deberá poder evolucionar.

---

## Bajo acoplamiento

Los módulos deben comunicarse mediante servicios claramente definidos.

Nunca acceder directamente a la información de otro módulo.

---

## Reutilización

Toda funcionalidad que pueda ser utilizada por varios módulos deberá implementarse únicamente una vez.

Ejemplos:

Usuarios

Roles

Permisos

Logs

Archivos

Notificaciones

Configuración

Mapas

Exportaciones

Filtros

Tablas

---

# 5. Objetivos del Proyecto

## Objetivos funcionales

Permitir administrar incidentes.

Visualizar indicadores.

Gestionar usuarios.

Administrar permisos.

Visualizar mapas.

Controlar sucursales.

Administrar zonas de trabajo.

Registrar actividad del sistema.

Centralizar configuraciones.

Gestionar información empresarial.

---

## Objetivos técnicos

Mantener una arquitectura limpia.

Facilitar mantenimiento.

Permitir crecimiento.

Reducir duplicidad.

Facilitar automatización.

Permitir reemplazar proveedores externos.

---

# 6. Objetivos del MVP

El MVP debe demostrar el funcionamiento de la arquitectura.

No pretende cubrir todas las necesidades de la empresa.

Debe incluir únicamente los módulos necesarios para validar el diseño.

El MVP incluirá:

Autenticación

Usuarios

Roles

Permisos

Dashboard

Tabla dinámica

Integración con Baserow

Google Maps

Configuración

Logs

Responsive

---

# 7. Público Objetivo

La plataforma será utilizada por diferentes perfiles.

Cada perfil visualizará información distinta.

El sistema nunca deberá asumir que todos los usuarios poseen los mismos permisos.

La autorización siempre será basada en permisos.

---

# 8. Tipos de Usuario

La plataforma podrá manejar perfiles como:

Administrador

Supervisor

Coordinador

Analista

Técnico

Operador

Cliente

Invitado

Los nombres podrán modificarse.

Lo importante es el conjunto de permisos asociado.

---

# 9. Principios de Diseño

Toda pantalla debe responder las siguientes preguntas.

¿Qué necesita hacer el usuario?

¿Cuál es la información importante?

¿Cuál es la acción principal?

¿Cómo reducir clics?

¿Cómo mantener consistencia?

---

# 10. Principios de Desarrollo

No desarrollar funcionalidades por intuición.

Toda funcionalidad debe responder a un requerimiento.

Todo módulo debe poder documentarse.

Toda decisión debe quedar registrada.

---

# 11. Evolución Esperada

La plataforma deberá evolucionar durante varios años.

No debe requerir una reescritura completa cuando aparezcan nuevos módulos.

La arquitectura inicial debe soportar dicho crecimiento.

---

# 12. Definición de Éxito

La plataforma será considerada exitosa cuando:

Toda la operación principal pueda realizarse desde un único sistema.

Los nuevos módulos puedan desarrollarse reutilizando la infraestructura existente.

La incorporación de nuevas funcionalidades no requiera modificar la arquitectura base.

Los cambios de proveedores externos no afecten al frontend.

El sistema permita mantener una experiencia consistente para todos los módulos.

# CAPÍTULO 2

# Lenguaje del Negocio (Ubiquitous Language)

---

# Introducción

Este capítulo define el significado oficial de todos los términos utilizados dentro de la plataforma.

Estas definiciones deben utilizarse de manera consistente en:

- Código
- Base de datos
- APIs
- Interfaces
- Documentación
- Diagramas
- Conversaciones técnicas

Nunca se utilizará un término diferente para representar el mismo concepto.

---

# Ticket

## Definición

Un Ticket (también denominado Incidente) representa una solicitud de servicio generada por un cliente.

Ambos términos son equivalentes dentro del sistema.

No existe diferencia funcional entre Ticket e Incidente.

---

## Características

Todo Ticket posee un identificador único e irrepetible.

Ejemplo:

```
INC-2026-000145
```

o

```
10025489
```

dependiendo del cliente.

Ese número nunca cambia y será la referencia principal durante toda la vida del servicio.

---

## Ciclo de Vida

Un Ticket puede pasar por múltiples estados.

Ejemplo:

Nuevo

Asignado

En ruta

En sitio

Pendiente

Resuelto

Cancelado

El catálogo de estados podrá cambiar dependiendo del proyecto.

---

## Relaciones

Un Ticket puede estar relacionado con:

- Cliente
- Sucursal
- Zona
- Técnico
- Proyecto
- Evidencias
- Actividades
- Comentarios
- SLA
- Prioridad

---

# Sucursal

## Definición

Una Sucursal representa el lugar físico donde se realizará la atención del Ticket.

Dependiendo del cliente puede representar:

- Tienda
- Restaurante
- Oficina
- Local Comercial
- Centro de Distribución
- Bodega
- Planta
- Hospital
- Banco

La plataforma utilizará el término "Sucursal" como nombre genérico.

---

## Características

Una sucursal posee información como:

Nombre

Código

Dirección

Ciudad

Coordenadas

Zona de Trabajo

Cliente

Horario

Contacto

---

# Zona de Trabajo

## Definición

Una Zona de Trabajo representa un área geográfica definida por la empresa para organizar la operación de campo.

Generalmente coincide con límites administrativos como:

Estado

Departamento

Provincia

Municipio

Ciudad

Cantón

Distrito

aunque puede adaptarse a necesidades operativas.

---

## Objetivo

Su principal finalidad es distribuir la carga operativa.

Cada Zona agrupa múltiples sucursales.

Los técnicos normalmente serán asignados a una o varias zonas.

---

## Beneficios

Reducir tiempos de desplazamiento.

Optimizar rutas.

Mejorar tiempos de respuesta.

Balancear carga de trabajo.

---

# Usuario

## Definición

Un Usuario representa cualquier persona autorizada para acceder a la plataforma.

No implica necesariamente que sea empleado de la empresa.

---

## Ejemplos

Administrador

Supervisor

Coordinador

Analista

Cliente

Técnico

Almacenista

Proveedor

Auditor

---

## Características

Todo usuario posee:

Nombre

Correo

Estado

Roles

Permisos

Sucursales asignadas

Zonas asignadas

Configuraciones personales

---

# Técnico

## Definición

Un Técnico es un usuario especializado encargado de ejecutar servicios en campo.

Su principal responsabilidad consiste en atender Tickets dentro de las zonas asignadas.

---

## Características

Cada técnico puede tener:

Especialidades

Certificaciones

Disponibilidad

Ubicación

Zonas asignadas

Agenda

Historial

Indicadores

---

# Dashboard

## Definición

Un Dashboard es una vista analítica que resume el estado de la operación mediante indicadores visuales.

Su propósito es facilitar la toma de decisiones.

---

## Características

Puede contener:

KPIs

Gráficas

Mapas

Indicadores

Alertas

Tendencias

Comparativos

Filtros

---

# Módulo

## Definición

Un Módulo representa una unidad funcional independiente dentro de la plataforma.

Cada módulo agrupa herramientas relacionadas con un proceso específico.

---

## Ejemplos

Servicios

Field Service

Inventario

Usuarios

Configuración

Dashboard

Reportes

Clientes

Activos

---

## Principios

Todo módulo debe ser independiente.

Todo módulo puede evolucionar sin afectar otros módulos.

Todo módulo reutiliza la infraestructura común.

---

# Permiso

## Definición

Un Permiso representa una acción específica autorizada dentro del sistema.

Los permisos son la unidad mínima de autorización.

---

## Ejemplos

tickets.view

tickets.create

tickets.edit

tickets.delete

dashboard.view

users.create

maps.view

inventory.export

---

# Rol

## Definición

Un Rol representa un conjunto de permisos previamente definidos.

Los usuarios nunca reciben acceso únicamente por su cargo.

Reciben acceso mediante Roles.

Los Roles únicamente agrupan Permisos.

---

## Ejemplo

Rol:

Supervisor

Permisos:

tickets.view

tickets.edit

dashboard.view

reports.export

---

# Registro de Actividad

## Definición

Un Registro de Actividad representa el historial cronológico de todas las acciones relevantes realizadas dentro de la plataforma.

Su finalidad es proporcionar trazabilidad completa de la operación.

---

## Objetivos

Auditoría

Control

Seguimiento

Cumplimiento

Análisis

---

## Ejemplos

Creación de Ticket

Cambio de Estado

Asignación de Técnico

Inicio de Atención

Carga de Evidencias

Cambio de Prioridad

Inicio de Sesión

Cambio de Permisos

Configuraciones

Exportaciones

---

# Principio General

Toda acción importante realizada por un usuario deberá generar un Registro de Actividad.

No deberán existir cambios importantes sin trazabilidad.
