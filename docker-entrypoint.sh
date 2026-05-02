#!/bin/sh
set -e
# Схема в образе может опережать volume БД после git pull без ручного db push.
npx prisma db push --skip-generate
exec node server.js
