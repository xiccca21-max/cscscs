# Деплой SKINSELL на VPS (Docker)

Стек: Ubuntu, Docker, Postgres + приложение из `docker-compose.yml`. Шаги по порядку.

**До сервера:** Ubuntu 22.04+, ~2 ГБ RAM, белый IP, SSH.  
Подготовь: [Steam Web API key](https://steamcommunity.com/dev/apikey), `SESSION_SECRET` (`openssl rand -hex 32`), [steamID64](https://steamid.io) для `ADMIN_STEAM_IDS`, решение по URL первого захода (IP:3000 или домен) → это будет `NEXT_PUBLIC_APP_URL`.

---

### 1. SSH

```bash
ssh ubuntu@ТВОЙ_IP
```

Дальше команды — на сервере.

### 2. Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Выйти из SSH и зайти снова. Проверка: `docker run --rm hello-world`

### 3. Код

```bash
sudo apt install -y git
cd ~
git clone https://github.com/ТВОЙ_АККАУНТ/cs_ne_go.git
cd cs_ne_go
```

### 4. `.env`

```bash
cp .env.example .env
nano .env
```

Заполнить:

| Переменная | Смысл |
|------------|--------|
| `STEAM_API_KEY` | ключ Steam API |
| `SESSION_SECRET` | вывод `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | **точный** URL, с которого открываешь сайт (без `/` в конце). Совпадает с адресной строкой: `http://ТВОЙ_IP:3000` / `https://домен`. Не используй в браузере `0.0.0.0` — только `localhost`, `127.0.0.1`, IP или домен |
| `ADMIN_STEAM_IDS` | steamID64, через запятую если несколько |
| `STEAMAPIS_KEY` | SteamApis, инвентарь |
| `TM_MARKET_API_KEY_CS2` и др. | TM Market, опционально |

`DATABASE_URL` / `DIRECT_URL` для **docker compose** приложения задаются в `docker-compose.yml`, не в `.env` (в `.env` они нужны для локального запуска без Docker).

### 5. Пароль Postgres (прод)

По умолчанию пароль `postgres`. Чтобы сменить, достаточно **одной** строки в `.env` (compose подставляет её в `POSTGRES_PASSWORD` и в `DATABASE_URL` / `DIRECT_URL` у сервиса `app`):

```bash
nano .env
```

Добавь или измени: `POSTGRES_PASSWORD=твой_надёжный_пароль` (без `#`, `@`, `:` в пароле — иначе нужно URL-кодирование в URI).

**Важно:** пароль в контейнере Postgres задаётся **только при первом создании** тома `pgdata`. Если база уже поднята со старым паролем, смена `POSTGRES_PASSWORD` в `.env` сама по себе пароль внутри БД **не обновит**. Варианты: (1) вернуть в `.env` тот пароль, с которым том изначально создали; (2) сбросить данные: `docker compose down -v`, затем снова `up -d` (удалит БД); (3) зайти в контейнер `db` и выполнить `ALTER USER postgres WITH PASSWORD '...';` под суперпользователем.

### 6. Запуск

Из папки проекта:

```bash
export DOCKER_BUILDKIT=1
docker compose up -d --build
```

Логи: `docker compose logs -f app` (выход: Ctrl+C)

### 7. База: таблицы + сиды оплат

Один раз после успешного старта. **Сначала схема, потом сид** (иначе «таблица не существует»).

На сервере **без Node** (обычный случай):

```bash
docker compose exec app sh -lc "npx prisma db push && tsx prisma/seed-payments.ts"
```

С Node на машине с репозиторием: `npm run docker:db:setup`  
Или по отдельности: `docker compose exec app npx prisma db push` затем `docker compose exec app tsx prisma/seed-payments.ts`

Проблемы с БД: `docker compose ps` (db healthy?), пароль в шаге 5.

### 8. Проверка

На сервере:

```bash
curl -s http://127.0.0.1:3000/api/health
```

В браузере с другой машины (порт 3000 открыт — см. шаг 9): `http://ТВОЙ_IP:3000`

### 9. Фаервол (ufw)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status
```

Если фаервол у провайдера в панели — открыть 3000 там тоже.

### 10. Домен и HTTPS (позже)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d твой-домен.ru
```

В `.env`: `NEXT_PUBLIC_APP_URL=https://твой-домен.ru`  
Перезапуск:

```bash
cd ~/cs_ne_go
docker compose up -d
```

URL в браузере и `NEXT_PUBLIC_APP_URL` должны совпадать (схема и хост) — иначе Steam OAuth часто ломается.

### 11. Проверка функционала

Сайт → вход Steam → при необходимости `/admin` (steamID64 в `ADMIN_STEAM_IDS`). В админке способы оплаты должны быть; если пусто — как при сиде / кнопка набора по умолчанию.

---

### Обновление кода

```bash
cd ~/cs_ne_go
git pull
docker compose up -d --build
```

Менялась схема Prisma:

```bash
docker compose exec app npx prisma db push
```

---

### Локально у себя

Node 20, Postgres или `npm run docker:db`.  
`cp .env.example .env` → `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `DATABASE_URL`/`DIRECT_URL` как в примере.  
`npm install` → `npm run setup` → `npm run dev` → http://localhost:3000

---

### Частые сбои

| Симптом | Что проверить |
|---------|----------------|
| Steam login / 503 после входа | Открывай сайт не с `0.0.0.0`, а с тем же хостом, что в `NEXT_PUBLIC_APP_URL`; после правки `.env` — `docker compose up -d --build` |
| Steam login | `NEXT_PUBLIC_APP_URL` = реальный URL в адресной строке |
| `?error=steam_openid` | OpenID не подтвердился: чаще всего **не совпадает хост/схема** с `NEXT_PUBLIC_APP_URL` (например `www` vs без, `http` vs `https`). Реже — повторный заход по закладке на `/api/auth/callback` (у Steam ответ `is_valid` одноразовый). Смотри `docker compose logs app`. |
| `?error=steam_api` | Профиль не отдался: `STEAM_API_KEY` в контейнере `app`, лимиты/ошибка Steam Web API. Логи `app`. |
| Нет админки | В `ADMIN_STEAM_IDS` только steamID64 |
| БД | `docker compose ps`; URI в compose у `app` и пароль у `db` |
| **502 Bad Gateway** (страница от nginx) | Бэкенд не отвечает: `docker compose ps` (есть ли `app` **Up**), `docker compose logs app --tail 150`, с VPS `curl -sI http://127.0.0.1:3000/api/health`. В конфиге nginx `proxy_pass` должен указывать на тот порт, где слушает контейнер (часто `127.0.0.1:3000`). |
| Ошибки приложения | `docker compose logs app` |
