#!/bin/bash
set -e

echo "══════════════════════════════════════"
echo "  SKINSELL — Настройка"
echo "══════════════════════════════════════"

# Проверка .env
if [ ! -f .env ]; then
  echo "ОШИБКА: файл .env не найден."
  echo "Скопируй .env.example → .env и заполни значения."
  exit 1
fi

# Установка зависимостей
echo ""
echo "→ Установка зависимостей..."
npm install

# Генерация Prisma Client
echo ""
echo "→ Генерация Prisma Client..."
npx prisma generate

# Создание таблиц в БД
echo ""
echo "→ Создание таблиц в базе данных..."
npx prisma db push

# Заливка базовых данных (способы оплаты)
echo ""
echo "→ Заливка способов оплаты..."
npx tsx prisma/seed-payments.ts

echo ""
echo "══════════════════════════════════════"
echo "  ✓ Настройка завершена!"
echo ""
echo "  Запуск:  npm run dev"
echo "  Открыть: http://localhost:3000"
echo "══════════════════════════════════════"
