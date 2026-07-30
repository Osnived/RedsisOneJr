#!/bin/sh
# Aplica las migraciones pendientes antes de arrancar.
#
# Se usa `migrate deploy` y no `migrate dev`: en producción solo se aplican
# migraciones ya existentes, nunca se generan nuevas ni se borran datos.
set -e

echo "Aplicando migraciones pendientes..."
node /app/node_modules/prisma/build/index.js migrate deploy

echo "Arrancando la API..."
exec "$@"
