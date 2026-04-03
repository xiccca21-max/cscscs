Полная настройка SKINSELL на своём VPS (один раз)

Ниже один рабочий путь: Ubuntu-сервер, Docker, Postgres и сайт на одной машине, как в docker-compose.yml репозитория. Делай по порядку, не перескакивай.

Что это даёт

На сервере поднимутся два контейнера: база PostgreSQL и сам сайт. Строка подключения к базе для приложения уже прописана внутри docker-compose.yml (хост db, логин postgres, база cs_ne_go). Тебе не нужно отдельно «искать» DATABASE_URL в интернете — для Docker ты либо оставляешь как в файле, либо меняешь пароль в одном месте и копируешь его в строку подключения (это расписано в шаге про пароль).

Файл .env на сервере нужен не для DATABASE_URL в типовом деплое через compose из этого репозитория: compose подставляет секреты из .env в переменные вроде SESSION_SECRET и STEAM_API_KEY. Подключение app к Postgres задаётся прямо в docker-compose.yml в блоке app → environment.


Нулевой шаг. Что подготовить до сервера

1) Сервер с Ubuntu 22.04 или новее, минимум около 2 ГБ ОЗУ, белый IP.

2) Доступ по SSH (логин и пароль или ключ).

3) Ключ Steam Web API: зайти на https://steamcommunity.com/dev/apikey , залогиниться, указать любой домен (можно заглушку), скопировать ключ.

4) Секрет для сессий: на своём ПК выполнить команду openssl rand -hex 32 и сохранить вывод в блокнот — это значение для SESSION_SECRET.

5) Твой Steam ID в виде длинного числа (steamID64): открыть https://steamid.io , вставить ссылку на профиль Steam, скопировать steamID64 — это для ADMIN_STEAM_IDS.

6) Решить, с какого адреса первый заход: только IP (например http://12.34.56.78:3000) или сразу домен. От этого зависит NEXT_PUBLIC_APP_URL (см. шаг 4).


Шаг 1. Зайти на сервер по SSH

Подставь свой пользователь и IP:

ssh ubuntu@ТВОЙ_IP

Дальше все команды выполняются на сервере, если не сказано иначе.


Шаг 2. Установить Docker

Выполнить по очереди:

sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

Выйти из SSH и зайти снова , чтобы группа docker подхватилась. Проверка:

docker run --rm hello-world


Шаг 3. Скачать код

Установи git, если спросит:

sudo apt install -y git

Клонируй репозиторий (подставь свой URL):

cd ~
git clone https://github.com/ТВОЙ_АККАУНТ/cs_ne_go.git
cd cs_ne_go


Шаг 4. Создать файл .env на сервере

Скопировать пример:

cp .env.example .env

Открыть редактором:

nano .env

Заполни так (пустые кавычки заменить реальными значениями):

STEAM_API_KEY — ключ с шага 0.

SESSION_SECRET — строка с openssl rand -hex 32.

NEXT_PUBLIC_APP_URL — очень важно. Это ровно тот адрес, по которому открываешь сайт в браузере, без слэша на конце.

  Если первый тест без домена, с порта 3000: http://ТВОЙ_IP:3000 (подставь белый IP сервера).

  Когда повесишь домен и HTTPS — поменяешь на https://твой-домен.ru

ADMIN_STEAM_IDS — steamID64 с шага 0, одно число или несколько через запятую.

STEAMAPIS_KEY - стимапис ключ

Строки DATABASE_URL и DIRECT_URL в .env для запуска через docker compose из этого проекта можно не трогать: они используются если гоняешь сайт локально без Docker. В контейнере app база задаётся в docker-compose.yml. Не путай.


Шаг 5. Пароль Postgres (обязательно для реального сервера)

Сейчас в docker-compose.yml везде пароль postgres — так нельзя оставлять в проде.

Открой файл:

nano docker-compose.yml

В сервисе db в блоке environment поменяй POSTGRES_PASSWORD на свой сложный пароль.

В сервисе app в блоке environment в двух строках DATABASE_URL и DIRECT_URL замени слово postgres после двоеточия на тот же пароль. Формат строки:

postgresql://postgres:ТВОЙ_НОВЫЙ_ПАРОЛЬ@db:5432/cs_ne_go?schema=public

Сохрани файл (в nano: Ctrl+O, Enter, Ctrl+X).


Шаг 6. Собрать и запустить контейнеры

Из папки проекта:

export DOCKER_BUILDKIT=1
docker compose up -d --build

Первая сборка может занять несколько минут. Посмотреть логи приложения:

docker compose logs -f app

Выйти из логов: Ctrl+C.


Шаг 7. Создать таблицы в базе и залить способы оплаты

Один раз после первого успешного запуска.

Таблицы (в образе приложения есть папка `prisma/` и Prisma CLI — команда выполняется **внутри** контейнера `app`):

docker compose exec app npx prisma db push

Сид способов оплат (`seed-payments.ts` тянет код из `src/`, его **нет** в минимальном production-образе). Запускай с **клона репозитория на сервере**, где уже есть `npm install` (или один раз `npm ci`):

export DATABASE_URL="postgresql://postgres:ТВОЙ_ПАРОЛЬ@127.0.0.1:5432/cs_ne_go?schema=public"
export DIRECT_URL="$DATABASE_URL"
npx tsx prisma/seed-payments.ts

Порт 5432 к Postgres в `docker-compose.yml` проброшен на хост — с сервера `127.0.0.1` подходит. Если Prisma ругается на подключение — смотри пароль в шаге 5 и что контейнер db в статусе healthy: docker compose ps


Шаг 8. Проверить, что сайт живой

На самом сервере:

curl -s http://127.0.0.1:3000/api/health

Должен быть ответ с ok и числом ts.

С другого компьютера в браузере (открой порт в фаерволе, см. шаг 9):

http://ТВОЙ_IP:3000


Шаг 9. Фаервол (чтобы снаружи открыть сайт)

Пример для ufw:

sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw enable

Проверь статус: sudo ufw status

Если провайдер даёт панель с отдельным фаерволом — открой там тоже порт 3000 для первого теста.


Шаг 10. Домен и HTTPS (когда будешь готов)

Поставь Nginx и certbot (пример для Ubuntu):

sudo apt install -y nginx certbot python3-certbot-nginx

Настрой server в Nginx: proxy_pass на http://127.0.0.1:3000 , заголовки как в любой инструкции для Next.js (Host, X-Forwarded-For, X-Forwarded-Proto).

Получи сертификат:

sudo certbot --nginx -d твой-домен.ru

Потом обязательно:

Открой .env на сервере и выстави NEXT_PUBLIC_APP_URL=https://твой-домен.ru

Перезапусти контейнеры, чтобы подтянулись переменные:

cd ~/cs_ne_go
docker compose up -d

Важно: адрес в браузере и NEXT_PUBLIC_APP_URL должны совпадать по схеме (https) и имени хоста. Иначе логин Steam часто ломается.


Шаг 11. Финальная проверка

Открыть главную страницу.

Нажать вход через Steam — должен пустить.

Зайти на /admin — только если твой steamID64 был в ADMIN_STEAM_IDS.

В админке раздел оплаты: должны быть методы; если пусто — кнопка добавления стандартного набора (тот же смысл, что seed).


Обновление сайта после правок в git

cd ~/cs_ne_go
git pull
docker compose up -d --build

Если менялась схема Prisma:

docker compose exec app npx prisma db push


Локальная разработка на своём ПК (кратко)

Нужны Node 20 и Postgres (или только контейнер с базой: npm run docker:db).

cp .env.example .env — заполнить ключи как на сервере, для локалки NEXT_PUBLIC_APP_URL=http://localhost:3000 , DATABASE_URL и DIRECT_URL на localhost как в примере.

npm install
npm run setup
npm run dev

Браузер: http://localhost:3000


Если что-то сломалось

Логин Steam не работает — почти всегда NEXT_PUBLIC_APP_URL не совпадает с реальным URL в адресной строке.

Нет админки — в ADMIN_STEAM_IDS только steamID64, не никнейм.

База — проверь docker compose ps , пароль в строках подключения и POSTGRES_PASSWORD.

docker compose logs app — смотреть ошибки приложения.
