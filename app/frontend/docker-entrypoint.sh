#!/bin/sh
# Ensure node_modules is present (useful when node_modules is mounted as a named volume)
if [ ! -d /app/node_modules ] || [ ! -f /app/node_modules/.package-lock ]; then
  echo "node_modules missing or incomplete, running npm ci..."
  npm ci --silent
else
  echo "node_modules present"
fi

# Exec the container command
exec "$@"
