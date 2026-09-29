#!/bin/sh
set -e
mkdir -p /pb_data
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb_data --migrationsDir=/pb/pb_migrations
fi
exec /pb/pocketbase serve --http=0.0.0.0:8080 --dir=/pb_data --migrationsDir=/pb/pb_migrations --publicDir=/pb/pb_public
