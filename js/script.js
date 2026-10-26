/* ============================================================
   Форма заявки + плавное появление секций
   ============================================================ */

// ЗАМЕНИТЬ: после деплоя Cloudflare Worker вставьте его URL сюда
const FORM_ENDPOINT = "https://your-worker.your-subdomain.workers.dev";

/* ---------- Год в футере ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Появление секций при скролле ---------- */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
}

/* ---------- Форма заявки ---------- */
const form = document.getElementById("lead-form");
const status = document.getElementById("form-status");

const fields = {
  name: {
    input: document.getElementById("name"),
    error: document.getElementById("error-name"),
    validate: (v) => v.trim().length > 0,
  },
  contact: {
    input: document.getElementById("contact"),
    error: document.getElementById("error-contact"),
    validate: (v) => v.trim().length > 0,
  },
  consent: {
    input: document.getElementById("consent"),
    error: document.getElementById("error-consent"),
    validate: (_v, el) => el.checked,
  },
};

function setFieldState(field, valid) {
  field.error.hidden = valid;
  field.input.closest(".field").classList.toggle("invalid", !valid);
  field.input.setAttribute("aria-invalid", String(!valid));
}

function validateForm() {
  let allValid = true;
  for (const field of Object.values(fields)) {
    const valid = field.validate(field.input.value, field.input);
    setFieldState(field, valid);
    if (!valid) allValid = false;
  }
  return allValid;
}

// Живая валидация после первой ошибки
for (const field of Object.values(fields)) {
  field.input.addEventListener("input", () => {
    if (!field.error.hidden) {
      setFieldState(field, field.validate(field.input.value, field.input));
    }
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";
  status.className = "form-status";

  if (!validateForm()) return;

  const button = form.querySelector(".btn-submit");
  button.disabled = true;
  button.textContent = "Отправляю…";

  const payload = {
    name: fields.name.input.value.trim(),
    contact: fields.contact.input.value.trim(),
    message: document.getElementById("message").value.trim(),
  };

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("HTTP " + response.status);

    form.reset();
    document.getElementById("consent").checked = true;
    status.textContent = "Заявка отправлена. Я свяжусь с вами в течение дня.";
    status.classList.add("success");
  } catch {
    status.textContent =
      "Не удалось отправить заявку. Напишите, пожалуйста, напрямую в Telegram — ссылка в разделе «Контакты» ниже.";
    status.classList.add("error");
  } finally {
    button.disabled = false;
    button.textContent = "Отправить заявку";
  }
});
