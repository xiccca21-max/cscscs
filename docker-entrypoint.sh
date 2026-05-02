#!/bin/sh
# Синхронизация схемы — только best-effort; от падения push приложение не блокируется (иначе upstream 502).
echo "[docker-entrypoint] prisma db push (best effort)..."
if CI=1 prisma db push --skip-generate 2>&1; then
  echo "[docker-entrypoint] schema ok"
else
  echo "[docker-entrypoint] WARNING: prisma db push failed — starting server anyway. Run manually: docker compose exec app prisma db push --skip-generate" >&2
fi
exec node server.js
