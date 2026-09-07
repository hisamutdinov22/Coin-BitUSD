# Coin Mini App — Telegram tap game MVP

Готовый MVP Telegram Mini App: тап, монеты, энергия, улучшение силы тапа, daily bonus и реферальная ссылка.

## Быстрый запуск

### 1. Создай бота
В Telegram открой @BotFather, создай бота и скопируй BOT_TOKEN.

### 2. Установи Node.js 20+
В корне проекта:
```bash
npm install
npm run install:all
```

### 3. Запусти backend
Создай файл `backend/.env`:
```env
BOT_TOKEN=ВСТАВЬ_ТОКЕН_БОТА
WEBAPP_URL=https://ТВОЙ-АДРЕС-MINI-APP
PORT=3000
```

Потом:
```bash
npm run dev
```

### 4. Собери Mini App
```bash
npm run build
```
Папка `frontend/dist` — готовый сайт Mini App. Ее нужно разместить на HTTPS-хостинге.

### 5. Подключи Mini App к боту
В @BotFather: Bot Settings → Menu Button → Configure Menu Button.
Укажи URL `https://ТВОЙ-АДРЕС-MINI-APP`.

После этого `/start` покажет кнопку запуска.

## Важно
Это MVP для запуска и тестирования. Для публичной игры перед большими нагрузками стоит добавить PostgreSQL/Redis, полноценную авторизацию Telegram, античит, транзакционную модель начислений и админ-панель.
