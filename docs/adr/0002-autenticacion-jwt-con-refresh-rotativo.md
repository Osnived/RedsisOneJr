# ADR 0002 — Autenticación JWT con refresh token rotativo

- Fecha: 2026-07-30
- Estado: Aceptado

## Contexto

AGENTS.md y STACK.md exigen autenticación propia con JWT, refresh token, roles,
permisos y registro de actividad, y prohíben explícitamente usar el sistema de
autenticación de Supabase: Supabase es únicamente el proveedor de PostgreSQL.

Hay que decidir dónde vive la información de sesión y cómo se limita el daño si
un token se filtra.

## Decisión

Dos tokens con responsabilidades separadas:

| Token   | Duración | Contenido                     | Almacenamiento                         |
| ------- | -------- | ----------------------------- | -------------------------------------- |
| Access  | 15 min   | usuario, roles y permisos     | Solo en el cliente                     |
| Refresh | 30 días  | usuario e identificador único | Su hash SHA-256 en la tabla `sessions` |

Cuatro decisiones concretas:

1. **Los permisos viajan dentro del access token.** El guard de autorización no
   consulta la base de datos en cada petición.
2. **De la sesión solo se guarda el hash SHA-256 del refresh token.** Se elige
   SHA-256 y no bcrypt porque el hash debe poder buscarse por índice.
3. **El refresh token rota en cada renovación** y el anterior queda revocado.
4. **El login tarda lo mismo exista o no el correo**, comparando siempre contra
   un hash.

## Alternativas consideradas

**Consultar los permisos en la base de datos en cada petición.** Siempre
actualizados, pero añade una consulta a cada llamada. Con tokens de 15 minutos, la
ventana de desincronización es aceptable.

**Sesiones en servidor con cookies.** Revocación inmediata, pero obliga a
almacenamiento de sesión compartido y complica escalar horizontalmente.

**Refresh token sin rotación.** Más simple, pero un token robado sirve durante
30 días sin que nada lo delate.

**Guardar el refresh token en texto plano.** Descartado: quien lea la tabla de
sesiones obtendría acceso directo a todas las cuentas.

## Consecuencias

A favor:

- La autorización no cuesta consultas a la base de datos.
- Un refresh token robado deja de servir en cuanto el usuario legítimo renueva.
- Las sesiones se pueden revocar de forma individual o todas las de un usuario.
- La tabla de sesiones no contiene material utilizable.

En contra:

- Un cambio de permisos tarda hasta 15 minutos en aplicarse, o hasta la siguiente
  renovación. Si en el futuro hace falta revocación inmediata, habrá que añadir
  una lista de tokens revocados.
- La rotación obliga al cliente a coordinar las renovaciones simultáneas. Se
  resuelve compartiendo una única renovación en `api-client.ts`.
- Los tokens se guardan en `localStorage`, accesible desde JavaScript. Se acepta
  porque el access token dura minutos y el refresh es rotativo. Migrar a cookies
  `httpOnly` es la mejora natural si aparece contenido de terceros en la
  aplicación.
