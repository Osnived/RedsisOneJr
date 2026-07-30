# MVP_PLAYBOOK.md

Versión: 1.0

Estado: Vigente

---

# Propósito

Este documento define **cómo se trabaja** en este proyecto. Aplica a toda IA y a
todo desarrollador, en cada MVP, desde el primero hasta el último.

Los otros documentos definen **qué** se construye y **con qué**:

- [AGENTS.md](AGENTS.md) — reglas de arquitectura y estándares
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — contexto de negocio y lenguaje común
- [STACK.md](STACK.md) — stack tecnológico oficial (su título interno es TECH_STACK)

Este documento define **cómo**. No sustituye a los anteriores: los complementa.

---

# Rol asignado

Senior Full Stack Engineer del proyecto.

Antes de escribir código hay que leer completamente AGENTS.md,
PROJECT_CONTEXT.md y STACK.md. Todas las decisiones deben respetar dichos
documentos.

---

# Prohibiciones

No modificar la arquitectura del proyecto.

No introducir nuevas librerías sin justificarlo.

No romper el Repository Pattern.

No romper el Provider Pattern.

No romper el desacoplamiento entre Frontend y Backend.

No escribir soluciones rápidas.

No crear código duplicado.

No utilizar `any`.

No crear componentes gigantes.

---

# Mejoras arquitectónicas

Si se detecta una mejora arquitectónica, hay que **detenerse y proponerla antes
de implementarla**.

Nunca se implementa un cambio de arquitectura sobre la marcha, ni siquiera si
parece obviamente mejor.

---

# Método de trabajo por MVP

Se trabaja por MVP.

**No se implementa el siguiente MVP hasta que el anterior esté completamente
terminado.**

Al finalizar cada MVP hay que:

1. Resumir qué se implementó.
2. Explicar las decisiones tomadas.
3. Indicar cómo probarlo.
4. **Esperar aprobación antes de continuar.**

"Completamente terminado" significa: compila, pasa el análisis estático, pasa la
verificación de tipos, tiene pruebas unitarias que pasan, y se ha comprobado
funcionando. No significa "el código está escrito".

---

# Framework interno de tablas

## Objetivo

Construir un **sistema de tablas reutilizable** para toda la plataforma.

No se está construyendo una tabla para Tickets.

## Consumidores previstos

- Tickets
- Usuarios
- Clientes
- Inventario
- Equipos
- Activos
- Sucursales
- Técnicos
- Proyectos

La primera pantalla que utilizará este framework será **Tickets**.

## Consecuencia de diseño

Cada decisión del framework debe evaluarse contra la lista completa de
consumidores, no solo contra Tickets. Si una solución solo sirve para Tickets,
está mal planteada.
