# BACKLOG.md

# Framework de Tabla Reutilizable

> **Este backlog está TERMINADO.** Los 10 MVP se completaron.
> El trabajo en curso vive en [RELEASE_0.5.md](RELEASE_0.5.md) y el estado actual
> en [PROJECT_STATUS.md](PROJECT_STATUS.md).
>
> Se conserva porque documenta cómo se construyó el framework de tablas y por qué
> se tomó cada decisión.

---

# Reglas Generales

Antes de comenzar cualquier MVP debes leer:

- [AGENTS.md](AGENTS.md)
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
- [STACK.md](STACK.md) (su título interno es TECH_STACK)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [CODING_STANDARDS.md](CODING_STANDARDS.md)

Debes respetar completamente la arquitectura.

No puedes romper Repository Pattern.

No puedes romper Provider Pattern.

No puedes introducir dependencias nuevas sin justificarlo.

No puedes utilizar `any`.

No puedes crear componentes mayores a aproximadamente 250 líneas.

No puedes acoplar el DataTable al dominio de Tickets.

Todos los componentes deben diseñarse para reutilizarse posteriormente por
cualquier módulo de la plataforma.

Al finalizar cada MVP debes:

- resumir qué implementaste
- explicar las decisiones técnicas
- indicar cómo probarlo
- detenerte y esperar aprobación

No continúes automáticamente con el siguiente MVP.

---

# Estado

| MVP | Objetivo                      | Estado    |
| --- | ----------------------------- | --------- |
| 1   | Infraestructura del DataTable | Terminado |
| 2   | API pública del DataTable     | Terminado |
| 3   | Componentes internos          | Terminado |
| 4   | Column Registry               | Terminado |
| 5   | ColumnSelector                | Terminado |
| 6   | Sistema de preferencias       | Terminado |
| 7   | Vista Tickets y navegación    | Terminado |
| 8   | Datos mock                    | Terminado |
| 9   | Conectar mock al DataTable    | Pendiente |
| 10  | Refactor general              | Pendiente |

---

# MVP 1

## Objetivo

Crear toda la infraestructura del DataTable reutilizable.

No crear todavía la pantalla Tickets.

No utilizar datos reales.

## Tareas

- instalar y configurar correctamente TanStack Table
- crear la estructura de carpetas
- crear DataTable
- crear tipos reutilizables
- crear interfaces
- crear hooks necesarios
- crear carpeta components/table
- crear carpeta hooks/table
- crear carpeta types/table

NO crear lógica específica de Tickets.

## Resultado esperado

Debe existir el motor de tablas listo para utilizar.

---

# MVP 2

## Objetivo

Diseñar la API pública del DataTable.

No implementar todavía funcionalidades del negocio.

Debe ser completamente reutilizable.

Crear una interfaz similar a:

```ts
interface DataTableProps<T> {
  tableId: string;
  columns: ColumnDefinition<T>[];
  data: T[];

  loading?: boolean;
  error?: Error | null;

  toolbar?: React.ReactNode;
  rowActions?: React.ReactNode;
}
```

### Requisitos

- tableId obligatorio
- arquitectura preparada para preferencias futuras
- tipado completamente genérico
- TypeScript estricto

### Criterio de aceptación

El DataTable puede utilizarse desde cualquier módulo sin modificar el componente.

---

# MVP 3

## Objetivo

Crear todos los componentes internos reutilizables.

Crear:

- TableToolbar
- TablePagination
- TableSkeleton
- TableEmptyState
- TableErrorState
- TableSearch

### Requisitos

No implementar lógica del negocio.

No conocer Tickets.

No conocer Usuarios.

Solo infraestructura.

### Criterio de aceptación

Todos los componentes pueden reutilizarse en cualquier DataTable.

---

# MVP 4

## Objetivo

Crear el Column Registry.

Cada módulo será responsable únicamente de definir sus columnas.

Ejemplo:

```
modules/
  tickets/columns/ticket.columns.ts
  users/columns/user.columns.ts
  clients/columns/client.columns.ts
```

### Requisitos

No definir columnas dentro de páginas.

No definir columnas dentro del DataTable.

Separar completamente definición y renderizado.

### Criterio de aceptación

La creación de un nuevo módulo únicamente requiere crear su archivo de columnas.

---

# MVP 5

## Objetivo

Crear ColumnSelector.

Debe permitir:

- mostrar columnas
- ocultar columnas
- buscar columnas
- restaurar configuración

### Requisitos

NO acceder directamente a LocalStorage.

Debe utilizar una abstracción: `useTablePreferences()`.

El componente no debe conocer el origen de almacenamiento.

### Criterio de aceptación

El componente funciona independientemente del origen de datos.

---

# MVP 6

## Objetivo

Implementar el sistema de preferencias.

Inicialmente utilizando LocalStorage.

Guardar:

- columnas visibles
- orden de columnas
- tamaño de página
- ordenamiento
- filtros
- página actual

### Requisitos

Toda la lógica debe vivir dentro de `useTablePreferences()`.

El DataTable nunca accederá directamente a LocalStorage.

### Criterio de aceptación

Al recargar la página se mantienen las preferencias.

---

# MVP 7

## Objetivo

Crear la nueva vista: **Tickets**.

Agregarla al Sidebar.

Agregarla a la navegación móvil.

Ruta: `/tickets`

### Requisitos

La página debe utilizar el nuevo DataTable.

Todavía no integrar con Baserow.

### Criterio de aceptación

La navegación funciona correctamente.

---

# MVP 8

## Objetivo

Crear datos mock. Aproximadamente 25 registros.

Columnas sugeridas:

- Ticket
- Cliente
- Sucursal
- Ciudad
- Estado
- Prioridad
- Técnico
- Fecha creación
- Última actualización

### Requisitos

No consumir APIs.

No consumir Baserow.

No consumir PostgreSQL.

### Criterio de aceptación

La tabla puede probarse completamente utilizando datos mock.

---

# MVP 9

## Objetivo

Conectar los datos mock al DataTable.

Implementar:

- búsqueda
- ordenamiento
- paginación
- selección de filas
- mostrar/ocultar columnas
- loading
- empty state
- error state

### Requisitos

No implementar todavía:

- exportaciones
- filtros avanzados
- drag & drop
- redimensionar columnas
- vistas guardadas

### Criterio de aceptación

El DataTable queda completamente funcional para el MVP.

---

# MVP 10

## Objetivo

Refactor general. Revisar toda la implementación.

Buscar:

- duplicación
- componentes muy grandes
- hooks innecesarios
- tipos duplicados
- imports innecesarios
- malas prácticas

### Requisitos

No agregar funcionalidades nuevas.

Únicamente mejorar calidad.

### Criterio de aceptación

La infraestructura queda preparada para integrar Baserow.

---

# Próximo Release

Una vez finalizados estos MVP se iniciará la integración con Baserow.

La integración deberá respetar la arquitectura:

```
Baserow -> Provider -> Repository -> Service -> React Query -> DataTable
```

El DataTable no deberá modificarse para integrar Baserow.
