# RELEASE_0.5.md

# Product Experience

---

# Objetivo del Release

Convertir la plataforma en una aplicación utilizable para el negocio **antes** de
integrar Baserow.

Se desarrollarán:

- Gestión completa de usuarios.
- Infraestructura reutilizable para formularios.
- BaseTable como tabla estándar de la plataforma.
- AdvancedTable para Tickets.
- Sistema de vistas.
- Adaptación automática Desktop / Mobile.
- Vista tipo Cards para Técnicos.

**NO integrar todavía con Baserow.** Toda la información continuará utilizando
datos mock o los Providers existentes.

---

# Reglas Generales

Antes de comenzar cualquier MVP debes leer:

- [AGENTS.md](AGENTS.md)
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
- [STACK.md](STACK.md) (su título interno es TECH_STACK)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [CODING_STANDARDS.md](CODING_STANDARDS.md)

## Arquitectura

Debe respetarse completamente la arquitectura existente.

No romper:

- Repository Pattern
- Provider Pattern
- Feature First

No introducir nuevas dependencias sin justificarlo.

No utilizar `any`.

No crear componentes mayores a aproximadamente 250 líneas.

Toda infraestructura reutilizable debe vivir en `shared/`.

Todo componente del negocio debe vivir dentro de `features/`.

Al finalizar cada MVP debes:

- resumir lo implementado
- explicar las decisiones tomadas
- indicar cómo probarlo
- detenerte y esperar aprobación

No continúes automáticamente.

---

# Estado

Ver [PROJECT_STATUS.md](PROJECT_STATUS.md) para el detalle de lo terminado y lo
pendiente.

| MVP | Objetivo                         | Estado    |
| --- | -------------------------------- | --------- |
| 1   | BaseTable v1                     | Terminado |
| 2   | Gestión completa de Usuarios     | Terminado |
| 3   | Acciones reutilizables por fila  | Terminado |
| 4   | Infraestructura para Formularios | Terminado |
| 5   | Infraestructura AdvancedTable    | Terminado |
| 6   | Configuración de columnas        | Terminado |
| 7   | Sistema de Vistas                | Terminado |
| 8   | Agrupaciones                     | Terminado |
| 9   | Filtros Avanzados                | Terminado |
| 10  | Tickets utiliza AdvancedTable    | Terminado |
| 11  | Sistema de Vista Adaptativa      | Terminado |
| 12  | Infraestructura Multi Vista      | Terminado |
| 13  | TicketCardView                   | Terminado |
| 14  | Cambio Automático de Vista       | Terminado |
| 15  | Preparar futuras vistas          | Terminado |

**Release completo.** Ver la sección 4 de [PROJECT_STATUS.md](PROJECT_STATUS.md) para las
desviaciones y limitaciones conocidas.

---

# MVP 1

## BaseTable v1

Convertir el DataTable actual en el estándar para toda la aplicación.

Debe ser utilizado por: Usuarios, Roles, Permisos, Clientes, Zonas, Sucursales,
Catálogos.

Debe soportar: búsqueda global, ordenamiento, paginación, loading, empty state,
error state, selección de filas, columnas definidas por la feature, toolbar,
acciones por fila.

No debe soportar: agrupar, vistas guardadas, reordenar columnas, filtros
avanzados, drag & drop, kanban.

**Resultado esperado:** todas las tablas administrativas usan el mismo componente.

---

# MVP 2

## Gestión completa de Usuarios

Convertir Usuarios en el primer CRUD completo del sistema.

Implementar:

- Botón Nuevo Usuario
- Modal o Drawer
- Crear Usuario
- Editar Usuario
- Activar Usuario
- Suspender Usuario

No eliminar usuarios.

Campos mínimos: Nombre, Apellidos, Correo, Contraseña temporal, Rol, Estado.

Reutilizar los endpoints existentes. No crear nuevos endpoints.

**Resultado esperado:** la gestión completa de usuarios funciona de extremo a
extremo.

---

# MVP 3

## Acciones reutilizables por fila

Crear una infraestructura reutilizable. Cada módulo decidirá sus acciones.

Ejemplo: ⋮ → Editar, Ver detalle, Activar, Suspender, Eliminar (cuando aplique).

El DataTable únicamente renderiza las acciones. Toda la lógica pertenece a la
Feature.

---

# MVP 4

## Infraestructura reutilizable para Formularios

Crear componentes compartidos para:

- EntityModal
- EntityForm
- Footer
- Validaciones
- Loading
- Error Handling

Todos los futuros formularios deberán reutilizar esta infraestructura:
UserForm, ClientForm, BranchForm, TechnicianForm, TicketForm.

---

# MVP 5

## Infraestructura AdvancedTable

**IMPORTANTE:** no implementar todavía funcionalidades avanzadas. Crear
únicamente la arquitectura.

Debe extender BaseTable. No duplicar código.

Preparar soporte para: Views, Agrupaciones, Configuración de columnas,
Exportaciones, Kanban, Timeline, Maps. **Sin implementarlas.**

---

# MVP 6

## Configuración de columnas

Solo para AdvancedTable. Crear un panel lateral.

Debe permitir: mostrar columnas, ocultar columnas, restaurar configuración.

Guardar preferencias. Inicialmente en LocalStorage.

No implementar todavía: Drag & Drop, reordenamiento.

---

# MVP 7

## Sistema de Vistas

Solo para AdvancedTable. Cada usuario podrá crear vistas.

Una vista almacena: columnas, filtros, orden, tamaño de página.

Guardar inicialmente en LocalStorage. La arquitectura debe permitir migrar
posteriormente a PostgreSQL.

---

# MVP 8

## Agrupaciones

Solo para AdvancedTable. Permitir agrupar por: Estado, Técnico, Prioridad,
Ciudad.

No modificar BaseTable.

---

# MVP 9

## Filtros Avanzados

Crear constructor visual.

Operadores: es, no es, contiene, empieza por, termina por, vacío, no vacío.

Los filtros deben poder guardarse dentro de una Vista.

---

# MVP 10

## Tickets utiliza AdvancedTable

Migrar `/tickets` para utilizar AdvancedTable.

Los demás módulos continúan utilizando BaseTable.

---

# MVP 11

## Sistema de Vista Adaptativa

Crear un sistema reutilizable para decidir cómo visualizar un módulo.

No basarse únicamente en el tamaño de pantalla. Debe considerar: rol, tamaño de
pantalla, preferencias del usuario (preparado para el futuro).

Crear el hook `useViewMode()`, que expone `mode` y `reason`.

Valores posibles: `table`, `cards`.

Lógica inicial: Técnico + Mobile → Cards. Todos los demás casos → Table.

Toda la lógica debe permanecer encapsulada. Ninguna página debe consultar
directamente el tamaño de pantalla.

---

# MVP 12

## Infraestructura Multi Vista

Dentro de Tickets crear `views/` con `TicketTableView` y `TicketCardView`.

La página Tickets únicamente decidirá cuál renderizar utilizando `useViewMode()`.

No duplicar lógica. Ambas vistas deberán consumir exactamente el mismo origen de
datos.

---

# MVP 13

## TicketCardView

Crear la vista optimizada para Técnicos. Usar únicamente datos mock.

Cada Card debe mostrar: número de ticket, cliente, sucursal, estado, prioridad,
técnico, fecha de creación.

Agregar botón "Ver detalle".

No implementar todavía: edición, acciones, mapas.

Diseño optimizado para móviles.

---

# MVP 14

## Cambio Automático de Vista

Si rol = Técnico y dispositivo = Mobile → renderizar `TicketCardView`.

En cualquier otro caso → `AdvancedTable`.

Toda la decisión deberá venir desde `useViewMode()`. No utilizar condicionales
complejos dentro de la página.

---

# MVP 15

## Preparar futuras vistas

No implementar funcionalidades. Preparar la arquitectura para soportar
posteriormente: Kanban, Calendario, Timeline, Mapa.

Todas las vistas deberán reutilizar exactamente el mismo Provider, Repository y
React Query. Únicamente cambiará la forma de representar la información.

No duplicar lógica de negocio.

---

# Criterio de Finalización del Release

Al finalizar este Release la plataforma deberá contar con:

- CRUD completo de Usuarios.
- Infraestructura reutilizable para Formularios.
- BaseTable como estándar de todos los módulos administrativos.
- AdvancedTable preparado para Tickets.
- Sistema de Vistas.
- Configuración de columnas.
- Adaptación automática Desktop / Mobile.
- Vista tipo Cards para Técnicos.
- Arquitectura preparada para integrar posteriormente Baserow sin modificar la UI.
