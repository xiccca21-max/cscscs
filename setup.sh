#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "SKINSELL — настройка"

if [ ! -f .env ]; then
  echo "Ошибка: нет файла .env. Скопируйте .env.example в .env и заполните."
  exit 1
fi

npm run setup

echo ""
echo "Готово. Запуск: npm run dev → http://localhost:3000"
