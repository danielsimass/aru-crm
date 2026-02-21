#!/bin/sh
set -e

# Optional: run TypeORM migrations when available
# pnpm typeorm migration:run

exec "$@"
