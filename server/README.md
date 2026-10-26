# Настройка отправки заявок в Telegram (Cloudflare Worker)

Форма на сайте не может вызывать Telegram Bot API напрямую — токен бота нельзя
публиковать в браузере. Поэтому заявки проходят через этот мини-скрипт
(`worker.js`) на бесплатном Cloudflare Workers (100 000 запросов/день —
для сайта-визитки более чем достаточно).

## 1. Создайте бота

1. В Telegram напишите **@BotFather** → команда `/newbot`
2. Придумайте имя бота — получите **токен** вида `123456:ABC...`

## 2. Узнайте свой chat_id

1. Напишите вашему новому боту любое сообщение (например, «привет»)
2. Откройте в браузере:
   `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
3. В ответе найдите `"chat":{"id":123456789` — это ваш **chat_id**

## 3. Задеплойте Worker

Нужна учётная запись Cloudflare (бесплатная) и [Node.js](https://nodejs.org).

```bash
npm install -g wrangler
wrangler login

cd server
wrangler secret put TELEGRAM_BOT_TOKEN   # вставьте токен бота
wrangler secret put TELEGRAM_CHAT_ID     # вставьте chat_id

# минимальный wrangler.toml:
#   name = "therapy-form"
#   main = "worker.js"
#   compatibility_date = "2025-01-01"

wrangler deploy
```

Вы получите URL вида `https://therapy-form.ваш-поддомен.workers.dev`.

## 4. Подключите к сайту

1. В `js/script.js` замените константу `FORM_ENDPOINT` на URL worker'а
2. В `worker.js` замените `ALLOWED_ORIGIN` на домен вашего сайта
   (и выполните `wrangler deploy` ещё раз)

## 5. Локальная проверка

```bash
cd server
wrangler dev   # worker на http://localhost:8787
```

Временно подставьте `http://localhost:8787` в `FORM_ENDPOINT`
и `ALLOWED_ORIGIN = "*"` — форму можно тестировать с открытого локально сайта.
Перед публикацией верните боевые значения.
