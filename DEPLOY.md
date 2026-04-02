# Развертывание SKINSELL

---

## 1. Что нужно перед стартом

### Серверы

| Компонент | Рекомендация | Альтернатива |
|-----------|-------------|--------------|
| **Сайт (фронт + API)** | [Vercel](https://vercel.com) — бесплатный план, автодеплой из GitHub, 0 конфига | VPS (Ubuntu 22+) + Docker |
| **База данных** | [Neon](https://neon.tech) — бесплатный Postgres, serverless, без обслуживания | Supabase / любой Postgres на VPS |

> **Vercel + Neon** = самый простой вариант. Ноль серверов, всё в облаке.

### API-ключи (3 штуки)

| Ключ | Где получить | Что делать |
|------|-------------|------------|
| **Steam Web API Key** | [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) | Авторизоваться в Steam → вписать любой домен → скопировать ключ |
| **SteamApis Key** | [steamapis.com](https://steamapis.com) | Зарегаться → Dashboard → API Key (бесплатно, 500 запросов/сутки) |
| **Session Secret** | Генерируешь сам | Любая случайная строка 32+ символов. Команда: `openssl rand -hex 32` |

### Steam ID администратора

Нужен твой **Steam64 ID** (17-значное число).  
Узнать: [steamid.io](https://steamid.io) — вставь ссылку на профиль → скопируй steamID64.

---

## 2. Вариант А: Vercel + Neon (рекомендуемый)

### 2.1. Создать базу данных на Neon

1. Зайти на [neon.tech](https://neon.tech), зарегаться
2. **Create Project** → регион `eu-west` (или ближайший)
3. После создания — на странице проекта будут 2 строки:
   - **Connection string** (pooled) — это `DATABASE_URL`
   - **Direct connection** — это `DIRECT_URL`
4. Скопировать обе

### 2.2. Залить код на GitHub

```bash
# Если ещё нет репо:
git init
git add -A
git commit -m "init"
git remote add origin https://github.com/ВАШ_ЮЗЕР/ВАШ_РЕПО.git
git push -u origin main
```

### 2.3. Подключить Vercel

1. Зайти на [vercel.com](https://vercel.com), залогиниться через GitHub
2. **Add New Project** → выбрать репозиторий
3. Framework: **Next.js** (определится автоматически)
4. **Environment Variables** — добавить ВСЕ переменные:

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | Pooled строка из Neon (с `-pooler` в хосте) |
| `DIRECT_URL` | Direct строка из Neon (без `-pooler`) |
| `STEAM_API_KEY` | Ключ со Steam |
| `STEAMAPIS_KEY` | Ключ с SteamApis.com |
| `SESSION_SECRET` | Результат `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://ваш-домен.vercel.app` (без `/` в конце) |
| `ADMIN_STEAM_IDS` | Ваш Steam64 ID (несколько через запятую) |

5. Нажать **Deploy**
6. Vercel сам сделает `npm install` → `prisma generate` → `next build`

### 2.4. Создать таблицы в БД

После первого деплоя — **один раз** локально:

```bash
# Клонировать репо (если ещё нет)
git clone https://github.com/ВАШ_ЮЗЕР/ВАШ_РЕПО.git
cd ВАШ_РЕПО

# Скопировать .env.example → .env, вписать те же значения что на Vercel
cp .env.example .env
# Отредактировать .env (nano .env / vim .env / открыть в блокноте)

# Запустить настройку — установит зависимости, создаст таблицы, зальёт базовые данные
chmod +x setup.sh
./setup.sh
```

**Или без скрипта:**

```bash
npm install
npx prisma generate
npx prisma db push        # создаёт все таблицы
npx tsx prisma/seed-payments.ts  # заливает 8 способов оплаты
```

### 2.5. Первый вход

1. Открыть `https://ваш-домен.vercel.app`
2. Нажать "Login with Steam" → авторизоваться
3. Если ваш Steam ID указан в `ADMIN_STEAM_IDS` → доступ к `/admin`
4. В админке (Оплата) — все 8 методов уже будут. Настраивайте комиссии/минималки

### 2.6. Свой домен (опционально)

1. В Vercel → Settings → Domains → Add Domain
2. Добавить CNAME запись у регистратора: `cname.vercel-dns.com`
3. Обновить `NEXT_PUBLIC_APP_URL` в Vercel на новый домен
4. Redeploy

---

## 3. Вариант Б: VPS + Docker

### Требования к серверу

- **Ubuntu 22.04+** или Debian 12
- **RAM:** 1 GB минимум (2 GB рекомендуется)
- **Диск:** 10 GB+
- Docker + Docker Compose установлены

Хостинги: [Hetzner](https://hetzner.com) (CX22 ~€4/мес), [Timeweb](https://timeweb.cloud), [DigitalOcean](https://digitalocean.com) Droplet $6/мес.

### 3.1. На сервере

```bash
# Установить Docker (если нет)
curl -fsSL https://get.docker.com | sh

# Клонировать репо
git clone https://github.com/ВАШ_ЮЗЕР/ВАШ_РЕПО.git
cd ВАШ_РЕПО

# Создать .env
cp .env.example .env
nano .env
# Заполнить ВСЕ переменные (DATABASE_URL и DIRECT_URL оставить localhost — Docker сам подменит)
```

### 3.2. Запустить

```bash
# Поднять всё: БД + приложение
docker compose up -d --build

# Дождаться запуска (10-30 сек), проверить:
docker compose logs app -f

# Создать таблицы и залить данные
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed-payments.ts
```

Сайт доступен на `http://IP-СЕРВЕРА:3000`

### 3.3. HTTPS через Nginx + Certbot

```bash
apt install nginx certbot python3-certbot-nginx -y
```

Создать файл `/etc/nginx/sites-available/skinsell`:

```nginx
server {
    server_name ваш-домен.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/skinsell /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d ваш-домен.com
```

---

## 4. Переменные окружения — полная таблица

| Переменная | Обязательная | Описание |
|------------|:----------:|----------|
| `DATABASE_URL` | ✅ | PostgreSQL. Для Neon — pooled URL (с `-pooler` в хосте) |
| `DIRECT_URL` | ✅ | PostgreSQL. Для Neon — direct URL. Для локального/VPS — та же строка что `DATABASE_URL` |
| `STEAM_API_KEY` | ✅ | Steam Web API Key |
| `SESSION_SECRET` | ✅ | 32+ символов случайных |
| `NEXT_PUBLIC_APP_URL` | ✅ | Полный URL сайта (`https://...`) без `/` в конце |
| `ADMIN_STEAM_IDS` | ✅ | Steam64 ID админа(ов), через запятую |
| `STEAMAPIS_KEY` | ⚠️ | SteamApis.com ключ. Без него инвентарь загружается медленнее |

---

## 5. После установки — чеклист

- [ ] Сайт открывается
- [ ] Логин через Steam работает
- [ ] `/admin` доступен (ваш Steam ID в `ADMIN_STEAM_IDS`)
- [ ] В админке → Оплата: 8 методов оплаты на месте
- [ ] На главной: 8 карточек методов оплаты
- [ ] На странице продажи: инвентарь загружается
- [ ] Создание заказа работает

---

## 6. Обновление

### Vercel
Просто `git push` — Vercel автоматически пересоберёт.

### VPS / Docker
```bash
cd /путь/к/проекту
git pull
docker compose up -d --build
# Если менялась схема БД:
docker compose exec app npx prisma db push
```

---

## 7. Частые проблемы

| Проблема | Решение |
|----------|---------|
| `P1017: Server has closed the connection` | Neon БД заснула. Зайти в Neon Dashboard → проект → активировать. Или подождать и повторить |
| Логин не работает | Проверить `NEXT_PUBLIC_APP_URL` — должен точно совпадать с доменом, включая `https://` |
| `?error=db_quota` после входа Steam | Лимит Neon (data transfer / compute). [Neon Dashboard](https://console.neon.tech) → проект → Usage / Upgrade план или дождаться сброса квоты |
| `?error=db_unavailable` | БД недоступна (холодный старт, P1017). Повторить позже или проверить `DATABASE_URL` |
| Админка не открывается | Проверить `ADMIN_STEAM_IDS` — должен быть Steam64 ID (17 цифр), не ссылка |
| Инвентарь не грузится | Проверить `STEAMAPIS_KEY`. Если пустой — работает через Steam напрямую (медленнее) |
| 404 на мобилке | Middleware перенаправляет на `/en`. Если не срабатывает — очистить кеш браузера |
