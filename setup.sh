#!/bin/bash
set -e

echo "SKINSELL — настройка"

if [ ! -f .env ]; then
  echo "Ошибка: нет файла .env. Скопируйте .env.example в .env и заполните."
  exit 1
fi

echo ""
echo "Зависимости..."
npm install

echo ""
echo "Prisma generate..."
npx prisma generate

echo ""
echo "Таблицы в базе..."
npx prisma db push

echo ""
echo "Способы оплаты (сид)..."
npx tsx prisma/seed-payments.ts

echo ""
echo "Готово. Запуск: npm run dev → http://localhost:3000"
