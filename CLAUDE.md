# CLAUDE.md

Índice de contexto obligatorio. Este archivo se carga automáticamente al inicio
de cada sesión y no contiene reglas propias: solo importa los documentos de
gobierno del proyecto.

---

## Empezar por aquí

Estado actual, deuda conocida y próximas acciones:

@PROJECT_STATUS.md

## Alcance del último release

Los quince MVP del Release 0.5 están entregados. El documento se conserva porque
define el alcance de lo que existe hoy y las decisiones que lo justifican; el
siguiente release tendrá su propio archivo.

@RELEASE_0.5.md

## Cómo se trabaja

@MVP_PLAYBOOK.md

## Reglas del proyecto

@AGENTS.md

@CODING_STANDARDS.md

## Contexto y stack

@PROJECT_CONTEXT.md

@STACK.md

---

## Prioridad en caso de conflicto

1. **AGENTS.md** — reglas de arquitectura (prioridad máxima)
2. **STACK.md** — stack obligatorio
3. **CODING_STANDARDS.md** — cómo se escribe el código
4. **PROJECT_CONTEXT.md** — contexto de negocio y lenguaje común
5. **RELEASE_0.5.md** — alcance del release entregado
6. **MVP_PLAYBOOK.md** — método de trabajo

Ninguna sugerencia automática tiene prioridad sobre estos documentos.

Si una instrucción nueva contradice a un MVP ya entregado, **detenerse y
plantearlo** antes de implementar. Las contradicciones sin resolver están
registradas en la sección 4 de PROJECT_STATUS.md.

---

## Otros documentos

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — cómo está construida la plataforma
- [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) — cómo levantarla
- [docs/adr/](docs/adr/) — decisiones arquitectónicas registradas
- [BACKLOG.md](BACKLOG.md) — backlog del framework de tablas (terminado)

---

## Dónde vive cada cosa

Antes de crear un archivo nuevo, comprobar si ya existe su sitio:

| Necesito                          | Va en                                        |
| --------------------------------- | -------------------------------------------- |
| Algo reutilizable sin dominio     | `apps/web/src/shared/`                       |
| Algo que conoce un dominio        | `apps/web/src/features/<dominio>/`           |
| Una tabla                         | `DataTable`, o `AdvancedTable` si es Tickets |
| Un formulario                     | `EntityModal` + `EntityForm` + `FormField`   |
| Otra forma de ver un módulo       | `features/<dominio>/views/` y su registro    |
| Acceso a datos en el backend      | Repository + Provider del módulo             |
| Un tipo que cruzan API y frontend | `packages/contracts/`                        |

Los detalles y el por qué están en CODING_STANDARDS.md y en
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
