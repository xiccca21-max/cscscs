SKINSELL (cs-ne-go)

Сайт на Next.js, база PostgreSQL, вход через Steam.

Подробная инструкция по установке на сервер и локально: файл DEPLOY.md в корне репозитория.

Быстрый старт у себя на компьютере:

cp .env.example .env

Заполните в .env хотя бы STEAM_API_KEY, SESSION_SECRET (openssl rand -hex 32), NEXT_PUBLIC_APP_URL, ADMIN_STEAM_IDS.

npm install

npm run docker:db

npm run setup

npm run dev

Откройте http://localhost:3000

Команды:

npm run build — production-сборка

npm run start — запуск после build

npm run db:push — применить схему Prisma к базе

npm run db:seed — залить способы оплаты

npm run docker:up — поднять приложение и Postgres из docker-compose.yml

Проверка живости API: GET /api/health
