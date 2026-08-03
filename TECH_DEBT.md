# TECH_DEBT.md

Última actualización: 31/07/2026 (Release 0.7)

Registro de deuda técnica. **Nada de aquí está implementado**: este documento
existe para que lo pendiente esté escrito y no dependa de la memoria de nadie.

[PROJECT_STATUS.md](PROJECT_STATUS.md) responde "qué funciona hoy".
Este archivo responde "qué sabemos que falta o está a medias, y qué cuesta".

## Cómo leerlo

**Impacto**: qué pasa si no se toca.

- **Alto** — puede producir un fallo visible o una decisión equivocada.
- **Medio** — molesta, limita o confunde, pero no rompe.
- **Bajo** — cosmético o de conveniencia.

**Coste**: esfuerzo estimado. Horas, no días, salvo que se indique.

---

# 0. Cerrado en el Sprint 0.6.1

Se deja constancia para que nadie vuelva a registrarlo como pendiente:

- **Formateo manual de fechas dentro de features.** Toda fecha visible pasa por el
  componente `DateTime`, y el formato existe en un solo archivo.
- **`useViewMode` comparaba el nombre del rol.** Ahora decide con el servicio de
  autorización. Era la contradicción entre el MVP 8 del 0.6 y el MVP 11 del 0.5.
- **El formulario de usuario buscaba el rol por nombre.** Ahora por identificador.
- **Dos catálogos de módulos** (`MODULES` y `APP_MODULES`). Queda uno.
- **Dos presentaciones del acceso denegado.** Queda una.

---

# 1. Riesgos abiertos

## El Repository de Tickets vive en el frontend

**Impacto: medio. Coste: medio.**

La arquitectura sitúa Repository y Provider en NestJS (ver AGENTS.md). Tickets no
tiene módulo en el backend, así que el Release 0.7 declaró la frontera en el
frontend: `TicketRepository` como contrato, `mockTicketProvider` como
implementación y `ticket-repository.ts` como único punto de sustitución.

Es deliberado y está documentado, pero mientras exista hay una capa de acceso a
datos donde la arquitectura no la quiere. Se resuelve en la integración con
Baserow: el módulo Tickets en NestJS y un proveedor de este lado que llame a la
API.

## El estado de las acciones del ticket vive en memoria

**Impacto: medio hoy, nulo después. Coste: nulo.**

Asignar un técnico, cambiar la prioridad, agregar una observación o avanzar el
flujo cambian el origen simulado, que se pierde al recargar la página. Es lo
esperado mientras no haya origen real, pero al probar parece que algo no se guardó.

## Docker nunca se ha construido — **Deferred**

**Impacto: alto. Coste: medio, con incógnita.**

El proxy TLS de la red rompe `pnpm install` dentro del contenedor. Ver
[certs/README.md](certs/README.md). Es lo único de la arquitectura que no ha
corrido de verdad, y STACK.md exige que toda la plataforma se ejecute con Docker.

**Decisión del Sprint 0.6.1: aplazado.** Se validará únicamente durante el primer
despliegue del sistema. No se dedica tiempo a resolverlo en el entorno corporativo,
porque el problema es del proxy de la red y no del proyecto.

Mientras no se resuelva, el despliegue en EasyPanel sigue siendo una incógnita.

## CI nunca se ha verificado en verde

**Impacto: alto. Coste: bajo.**

El pipeline de GitHub Actions existe y hay repositorio con remoto. Nadie ha
comprobado el resultado de una ejecución. Si falla, el sospechoso principal es la
construcción de imágenes Docker, por el punto anterior.

Es lo más barato de comprobar y lo que más información da.

## Dos pantallas sin ver en un navegador real

**Impacto: medio. Coste: bajo.**

- **Seguridad**: cubierta por pruebas, incluidas las reglas de acceso y el motivo
  obligatorio, pero no se ha visto en pantalla. Comprobar con las tres cuentas: el
  supervisor no debe ver el módulo ni entrar por URL, y el administrador debe
  aparecer como acceso total y no editable.
- **TicketCardView**: exige entrar con `tecnico@redsis.com` y reducir la ventana
  por debajo de 768 px.

El espacio de trabajo del ticket ya no está en esta lista: se comprobó al cerrar el
Release 0.7.

El panel de navegador integrado no compone frames, así que la comprobación tiene
que ser manual.

---

# 2. Funcionalidad a medias

## El timeline no muestra posición ni adjuntos

**Impacto: bajo. Es intencionado.**

`TicketEvent` transporta `location` y `attachments` y el origen los devuelve
siempre vacíos. El MVP 5 del Release 0.7 pedía preparar la estructura sin
implementar GPS, fotografías ni archivos, y así está: la entrada del timeline no
cambiará de forma cuando se implementen.

## Los formularios del coordinador no tienen pruebas de componente

**Impacto: bajo. Coste: medio.**

Asignar técnico y cambiar prioridad usan el `Select` de shadcn, que no funciona con
clics sintéticos en jsdom. Es la misma razón por la que `UserForm` tampoco tiene
pruebas de componente desde el Release 0.5.

Lo que sí está cubierto: los esquemas de validación, las reglas del origen, y el
formulario de observación completo —usa un `textarea`—. Lo que falta es exactamente
lo que cubriría Playwright.

## Crear y eliminar tickets siguen sin existir

**Impacto: bajo. Es intencionado.**

`tickets.create` y `tickets.delete` están en el catálogo y ninguna acción los usa.
Depende de quién sea la fuente de verdad de los tickets, que es una decisión del
próximo release (ver NEXT.md).

## Vistas guardadas: crear, aplicar y borrar, no actualizar

**Impacto: medio. Coste: bajo.**

Una vista se crea, se aplica y se borra. Cambiarla obliga a borrarla y volver a
crearla con el mismo nombre.

## Una vista no guarda la agrupación

**Impacto: bajo. Coste: bajo.**

El MVP 7 enumeraba cuatro cosas —columnas, filtros, orden y tamaño de página— y se
implementó exactamente eso. La agrupación se persiste en las preferencias de la
tabla, fuera de la vista, así que aplicar una vista no restaura cómo estaba
agrupada.

## El historial de Seguridad no muestra el detalle del cambio

**Impacto: bajo. Coste: bajo.**

El antes y el después completos **se almacenan** en `role_access_audits`, pero el
panel solo muestra usuario, fecha y motivo. El MVP 7 pedía exactamente eso, así
que no es una desviación; es información guardada que todavía no se explota.

---

# 3. Limitaciones asumidas

## Agrupar y paginar se reparten mal

**Impacto: medio. Coste: alto.**

Con la tabla agrupada, la paginación cuenta también las cabeceras de grupo, así que
un grupo puede quedar partido entre dos páginas. El pie informa de "N registros en
M grupos" para no mentir sobre el total, pero el corte sigue existiendo.

Se resolvería paginando por grupos en lugar de por filas, que es un cambio de
fondo en el motor.

## Los filtros comparan sobre el dato, no sobre lo que se ve

**Impacto: bajo. Coste: medio.**

Es coherente con el orden y la búsqueda global, que ya operaban así. En la práctica
significa que filtrar por Estado usa el código (`en-ruta`) y no la etiqueta; el
constructor sugiere los valores presentes para no obligar a recordarlos. Las fechas
y los booleanos sí se comparan como se muestran.

## "Restaurar configuración" restaura todo

**Impacto: bajo. Coste: bajo.**

El botón del panel de columnas restaura orden, columnas y tamaño de página, no solo
las columnas. Es el mismo comportamiento que el desplegable del BaseTable y el
texto de ayuda lo dice, pero está dentro de un panel titulado "Columnas".

## Los permisos del token no se revalidan por petición

**Impacto: medio. Coste: medio.**

Los accesos se leen del access token, que dura pocos minutos. Un cambio de permisos
tarda hasta ese tiempo en aplicarse: retirar un acceso no expulsa al usuario de
inmediato.

Es una decisión consciente —evita consultar PostgreSQL en cada petición— y está
documentada en la estrategia JWT. Si alguna vez hace falta revocación inmediata, la
salida es una lista de sesiones invalidadas, no consultar en cada llamada.

---

# 4. Esquema y código sin usar

## Esquema muerto en Prisma

**Impacto: bajo. Coste: bajo.**

`zones`, `branches`, `settings` y `user_zones` existen en el esquema y cero código
las usa. Se crearon para los módulos que aún no existen.

No estorban, pero quien lea el esquema no puede distinguir lo que está en uso de lo
que está reservado.

## Cinco módulos declarados sin construir

**Impacto: bajo. Es intencionado.**

El catálogo declara **Técnicos, Formularios, Clientes, Sucursales y Reportes** sin
pantalla ni backend. Se puede conceder acceso desde Seguridad y el menú no los
dibuja hasta que existan. Está hecho a propósito para no revisar los roles
guardados cuando lleguen.

## Capacidades de tabla declaradas sin implementar

**Impacto: bajo. Es intencionado.**

`exports`, `kanban`, `timeline` y `maps` en `AdvancedTableCapabilities`, y
`kanban`, `calendar`, `timeline` y `map` en `ViewKind`. Activarlas avisa por consola
en lugar de fallar en silencio.

## ECharts instalado y sin usar

**Impacto: bajo. Coste: nulo.**

Está en las dependencias esperando el Dashboard con gráficas. Google Maps, en
cambio, **no** está instalado.

---

# 5. Errores conocidos

## Estado de error en Tickets

**Impacto: bajo. Coste: bajo.**

El botón "Simular fallo" deja la tabla en el esqueleto de carga sin llegar nunca al
estado de error. Solo afecta a ese interruptor de desarrollo, que desaparecerá
cuando exista el origen real.

Las pruebas del estado de error pasan, así que el estado funciona: es algo de la
interacción entre los reintentos de TanStack Query y `isPending`.

---

# 6. Contradicciones sin resolver

Estas necesitan una decisión, no código.

## Sucursales y Zonas con agrupar y filtrar

**Impacto: bajo hoy, medio cuando existan.**

Se pidió que usaran "el basetable normal, pero que contengan las acciones de
agrupar, filtrar", lo que contradice el "no debe soportar" del MVP 1 del Release
0.5. No ha bloqueado nada porque agrupar y filtrar solo existen en la tabla
avanzada y esas pantallas no existen. Falta aclarar también si son una pantalla o
dos.

## `rowActions` es una función, no un `ReactNode`

**Impacto: bajo.**

Se desvió de la especificación porque un nodo estático no puede saber sobre qué fila
actúa. Nunca se confirmó formalmente.

## `TECH_STACK.md` se llama `STACK.md`

**Impacto: bajo. Coste: nulo.**

El archivo se llama `STACK.md`, su título interno es `TECH_STACK.md` y varios
documentos lo citan con el segundo nombre. Renombrar o corregir las citas.

## `.gitignore` no se versiona

**Impacto: medio.**

Por decisión del propietario. Quien clone el repositorio no tendrá reglas de
ignorado y puede commitear `node_modules` o `dist` sin darse cuenta.

---

# 7. Mejoras futuras

Ninguna es necesaria hoy.

## Migrar las preferencias y vistas a PostgreSQL

Hoy viven en LocalStorage, así que no siguen al usuario entre dispositivos. La
arquitectura ya lo contempla: el almacén está detrás de una abstracción y solo hay
que sustituirlo.

## Ampliaciones de autorización ya preparadas

Declaradas en `packages/contracts/src/access-control.ts` y sin implementar:

- **Roles múltiples por usuario.** Ya es posible en base de datos y en el contrato;
  falta decidir cómo se combinan dos roles con accesos distintos. Hoy se acumulan.
- **Restricciones por alcance (Scope).** Un Scope no es un permiso: dice sobre qué
  datos se puede actuar, no qué acciones se pueden ejecutar.
- **Permisos temporales.** `role_permissions` tendría que llevar vigencia.
- **Herencia de permisos.** Un rol podría declarar un rol padre.

Las cuatro se resuelven en el cálculo del acceso efectivo, que está en un solo
sitio por diseño.

## Dividir el bundle del frontend

El build avisa de que un chunk pasa de 500 kB. No es urgente en una aplicación
interna, y se resolvería con importaciones dinámicas por ruta.

## Pruebas end to end

Playwright está en el stack oficial y no hay ninguna prueba escrita. Los dos huecos
de verificación en navegador de la sección 1 son exactamente lo que cubrirían.
