/**
 * Cloudflare Worker: форма сайта → Telegram Bot API
 *
 * Секреты (задаются через `wrangler secret put`, НЕ хранить в коде):
 *   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
 *   TELEGRAM_CHAT_ID   — ваш chat_id (узнать: @userinfobot)
 *
 * См. README.md в этой папке для пошаговой настройки.
 */

// ЗАМЕНИТЬ: домен вашего сайта после публикации (для CORS).
// На время разработки можно временно поставить "*".
const ALLOWED_ORIGIN = "https://your-domain.example";
const MAX_LENGTH = 500;

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowOrigin =
      ALLOWED_ORIGIN === "*" || origin === ALLOWED_ORIGIN ? origin || ALLOWED_ORIGIN : ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false }, 405, allowOrigin);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse({ ok: false }, 400, allowOrigin);
    }

    const name = String(data.name || "").trim();
    const contact = String(data.contact || "").trim();
    const message = String(data.message || "").trim();

    if (
      !name || !contact ||
      name.length > MAX_LENGTH || contact.length > MAX_LENGTH || message.length > MAX_LENGTH
    ) {
      return jsonResponse({ ok: false }, 400, allowOrigin);
    }

    const text =
      `<b>Новая заявка с сайта</b>\n\n` +
      `<b>Имя:</b> ${escapeHtml(name)}\n` +
      `<b>Связь:</b> ${escapeHtml(contact)}\n` +
      (message ? `<b>Запрос:</b> ${escapeHtml(message)}` : `<b>Запрос:</b> —`);

    const tgResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    if (!tgResponse.ok) {
      return jsonResponse({ ok: false }, 502, allowOrigin);
    }

    return jsonResponse({ ok: true }, 200, allowOrigin);
  },
};
