import { initI18n, onLocaleChange, t } from "./i18n.js";

const id = location.pathname.split("/").filter(Boolean).pop();
const title = document.getElementById("pass-title");
const desc = document.getElementById("pass-desc");
const preview = document.getElementById("pass-preview");
const actions = document.getElementById("pass-actions");
const meta = document.getElementById("pass-meta");

/** @type {unknown} */
let lastPayload = null;

initI18n();

async function main() {
  const res = await fetch(`/api/passes/${id}`);
  if (!res.ok) {
    title.removeAttribute("data-i18n");
    title.textContent = t("pass.notFound");
    return;
  }
  const data = await res.json();
  lastPayload = data;
  renderPass(data);
}

function renderPass(data) {
  const pass = data.pass;
  const input = pass.input;

  title.removeAttribute("data-i18n");
  document.title = `${input.organizationName} · LogisPass`;
  title.textContent = input.eventName || input.discount || input.description;
  desc.textContent = `${input.organizationName} · ${input.style}`;

  const bg = input.backgroundColor || "#0B3D2E";
  const fg = input.foregroundColor || "#F4EFE6";
  preview.style.background = `linear-gradient(145deg, ${bg}, color-mix(in srgb, ${bg} 70%, black))`;
  preview.style.color = fg;
  preview.innerHTML = `
    <div class="org">${escapeHtml(input.organizationName)}</div>
    <div class="title">${escapeHtml(input.logoText || input.eventName || input.description)}</div>
    <p style="margin:0.75rem 0 0;opacity:.85">${escapeHtml(
      input.venue || input.balance || input.discount || pass.serialNumber,
    )}</p>
  `;

  actions.innerHTML = "";
  const google = document.createElement("a");
  google.className = "btn primary";
  google.href = `${data.urls.google}?redirect=1`;
  google.textContent = t("pass.addGoogle");
  actions.append(google);

  let appleNote = document.getElementById("apple-note");
  if (!appleNote) {
    appleNote = document.createElement("p");
    appleNote.id = "apple-note";
    appleNote.className = "availability-note";
    appleNote.setAttribute("role", "status");
    actions.after(appleNote);
  }
  appleNote.textContent = t("pass.appleNote");

  meta.textContent = t("pass.metaLine", {
    serial: pass.serialNumber,
    google: pass.googleReady ? t("pass.ready") : t("pass.preview"),
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

onLocaleChange(() => {
  if (lastPayload) renderPass(lastPayload);
});

main().catch((err) => {
  title.removeAttribute("data-i18n");
  title.textContent = t("pass.loadError");
  desc.textContent = err.message;
});
