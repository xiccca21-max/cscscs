SKINSELL (cs-ne-go)

Сайт на Next.js, база PostgreSQL, вход через Steam.

Подробная инструкция по установке на сервер и локально: файл DEPLOY.md в корне репозитория.

Быстрый старт у себя на компьютере:

Скопируйте `.env.example` в `.env` (macOS/Linux: `cp .env.example .env`, Windows PowerShell: `Copy-Item .env.example .env`).

Заполните в .env хотя бы STEAM_API_KEY, SESSION_SECRET (openssl rand -hex 32), NEXT_PUBLIC_APP_URL, ADMIN_STEAM_IDS.

npm run docker:db

npm run setup

(или один раз: `bash setup.sh` / `.\setup.ps1` — внутри вызывается тот же `npm run setup`)

npm run dev

Откройте http://localhost:3000

Обновление после `git pull`: достаточно `npm install`. Полный `npm run setup` снова не нужен, если база уже настроена; если менялась схема Prisma — `npm run db:push` (и при необходимости `npm run db:seed`).

Команды:

npm run build — production-сборка

npm run start — запуск после build

npm run db:push — применить схему Prisma к базе

npm run db:seed — залить способы оплаты

npm run docker:up — поднять приложение и Postgres из docker-compose.yml

Проверка живости API: GET /api/health
