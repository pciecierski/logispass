const STORAGE_KEY = "logispass.lang";

/** @typedef {"pl" | "en"} Locale */

const messages = {
  en: {
    "meta.title": "LogisPass — Wallet Pass Studio",
    "nav.create": "Create",
    "nav.passes": "Passes",
    "nav.setup": "Setup",
    "lang.label": "Language",
    "hero.title": "Access passes for logistics parks and secure sites.",
    "hero.lede":
      "Design once. Issue Google Wallet passes for logistics parks and secure sites. Apple Wallet will be activated soon.",
    "hero.ctaCreate": "Create a Google Wallet pass",
    "hero.ctaStatus": "Wallet status",
    "hero.availability":
      "Currently available: <strong>Google Wallet</strong>. Apple Wallet configuration is unavailable for now and will be activated soon.",
    "create.title": "Create",
    "create.lede":
      "Publish a Google Wallet pass. Optionally SMS the pass page link to the recipient. Apple Wallet is not available yet.",
    "form.organization": "Organization",
    "form.organizationPh": "Harbor Market",
    "form.description": "Description",
    "form.descriptionPh": "Loyalty membership card",
    "form.style": "Pass style",
    "form.style.generic": "Generic",
    "form.style.coupon": "Coupon",
    "form.style.eventTicket": "Event ticket",
    "form.style.storeCard": "Store / loyalty",
    "form.style.boardingPass": "Boarding pass",
    "form.platform": "Platform",
    "form.platform.google": "Google Wallet only",
    "form.platformHint":
      "Apple Wallet configuration is unavailable for now and will be activated soon.",
    "form.logoText": "Logo text",
    "form.barcode": "Barcode message",
    "form.barcodePh": "Auto-uses serial if empty",
    "form.phone": "Recipient phone (SMS)",
    "form.sendSms": "Send pass link by SMS",
    "form.background": "Background",
    "form.foreground": "Foreground",
    "form.discount": "Discount",
    "form.eventName": "Event name",
    "form.venue": "Venue",
    "form.balance": "Balance",
    "form.origin": "Origin",
    "form.destination": "Destination",
    "form.submit": "Publish pass",
    "form.publishing": "Publishing…",
    "result.title": "Pass ready",
    "result.openPage": "Open pass page",
    "result.google": "Google Wallet",
    "result.sendSms": "Send SMS link",
    "result.smsSending": "Sending…",
    "result.smsSent": "SMS sent to {{to}}",
    "result.smsDelivered": "SMS delivered via {{provider}} to {{to}}",
    "passes.title": "Passes",
    "passes.lede": "Recently published passes and their serve URLs.",
    "passes.empty": "No passes yet. Create one above.",
    "passes.open": "Open",
    "passes.google": "Google",
    "passes.sms": "SMS",
    "passes.smsSent": "Sent",
    "passes.smsTitle": "Send link to {{phone}}",
    "setup.title": "Setup",
    "setup.lede":
      "Google Wallet credentials stay on the server. Attach a Railway volume at <code>/data</code> so passes survive deploys (no database needed).",
    "setup.storage": "Storage",
    "setup.storage.ok": "Persistent volume",
    "setup.storage.bad": "Ephemeral (lost on deploy)",
    "setup.apple": "Apple Wallet",
    "setup.apple.bad": "Unavailable for now",
    "setup.apple.note":
      "Apple Wallet configuration is unavailable for now and will be activated soon.",
    "setup.google": "Google Wallet",
    "setup.configured": "Configured",
    "setup.needsSetup": "Needs setup",
    "setup.sms": "SMS",
    "setup.provider": "Provider: {{provider}}",
    "setup.storageHintPersistent":
      "Pass data is stored on a Railway volume and survives deploys.",
    "setup.storageHintEphemeral":
      "Pass data is on ephemeral disk and will be lost on redeploy. Attach a Railway volume mounted at /data (or set DATA_DIR to the volume mount path).",
    "footer.tagline": "Google Wallet · Apple Wallet coming soon",
    "pass.meta.title": "Your pass · LogisPass",
    "pass.loading": "Loading pass…",
    "pass.notFound": "Pass not found",
    "pass.loadError": "Could not load pass",
    "pass.addGoogle": "Add to Google Wallet",
    "pass.addApple": "Add to Apple Wallet",
    "pass.appleNote":
      "Apple Wallet is unavailable for now and will be activated soon. Use Google Wallet to save this pass.",
    "pass.device.ios": "iPhone detected — Apple Wallet is recommended for this device.",
    "pass.device.iosAppleSoon":
      "iPhone detected. Apple Wallet will be activated soon — save with Google Wallet for now.",
    "pass.device.android": "Android detected — Google Wallet is recommended for this device.",
    "pass.device.other": "Choose a wallet for your device.",
    "pass.alt.google": "Prefer Google Wallet instead?",
    "pass.alt.apple": "Prefer Apple Wallet instead?",
    "pass.metaLine": "Serial {{serial}} · Google {{google}} · Apple coming soon",
    "pass.ready": "ready",
    "pass.preview": "preview",
    "common.requestFailed": "Request failed",
  },
  pl: {
    "meta.title": "LogisPass — Studio przepustek Wallet",
    "nav.create": "Utwórz",
    "nav.passes": "Przepustki",
    "nav.setup": "Konfiguracja",
    "lang.label": "Język",
    "hero.title": "Przepustki na park logistyczny i tereny chronione.",
    "hero.lede":
      "Zaprojektuj raz. Wystawiaj przepustki Google Wallet dla parków logistycznych i stref zamkniętych. Apple Wallet uruchomimy wkrótce.",
    "hero.ctaCreate": "Utwórz przepustkę Google Wallet",
    "hero.ctaStatus": "Status walletów",
    "hero.availability":
      "Dostępne teraz: <strong>Google Wallet</strong>. Konfiguracja Apple Wallet jest na razie niedostępna i zostanie aktywowana wkrótce.",
    "create.title": "Utwórz",
    "create.lede":
      "Opublikuj przepustkę Google Wallet. Opcjonalnie wyślij link SMS do odbiorcy. Apple Wallet nie jest jeszcze dostępny.",
    "form.organization": "Organizacja",
    "form.organizationPh": "Harbor Market",
    "form.description": "Opis",
    "form.descriptionPh": "Karta lojalnościowa",
    "form.style": "Typ przepustki",
    "form.style.generic": "Ogólna",
    "form.style.coupon": "Kupon",
    "form.style.eventTicket": "Bilet na wydarzenie",
    "form.style.storeCard": "Karta sklepowa / lojalnościowa",
    "form.style.boardingPass": "Karta pokładowa / wjazdowa",
    "form.platform": "Platforma",
    "form.platform.google": "Tylko Google Wallet",
    "form.platformHint":
      "Konfiguracja Apple Wallet jest na razie niedostępna i zostanie aktywowana wkrótce.",
    "form.logoText": "Tekst logo",
    "form.barcode": "Treść kodu kreskowego",
    "form.barcodePh": "Jeśli puste — użyty zostanie numer seryjny",
    "form.phone": "Telefon odbiorcy (SMS)",
    "form.sendSms": "Wyślij link do przepustki SMS-em",
    "form.background": "Tło",
    "form.foreground": "Kolor tekstu",
    "form.discount": "Zniżka",
    "form.eventName": "Nazwa wydarzenia",
    "form.venue": "Miejsce",
    "form.balance": "Saldo",
    "form.origin": "Skąd",
    "form.destination": "Dokąd",
    "form.submit": "Opublikuj przepustkę",
    "form.publishing": "Publikowanie…",
    "result.title": "Przepustka gotowa",
    "result.openPage": "Otwórz stronę przepustki",
    "result.google": "Google Wallet",
    "result.sendSms": "Wyślij link SMS",
    "result.smsSending": "Wysyłanie…",
    "result.smsSent": "SMS wysłany na {{to}}",
    "result.smsDelivered": "SMS dostarczony przez {{provider}} na {{to}}",
    "passes.title": "Przepustki",
    "passes.lede": "Ostatnio opublikowane przepustki i ich adresy URL.",
    "passes.empty": "Brak przepustek. Utwórz jedną powyżej.",
    "passes.open": "Otwórz",
    "passes.google": "Google",
    "passes.sms": "SMS",
    "passes.smsSent": "Wysłano",
    "passes.smsTitle": "Wyślij link na {{phone}}",
    "setup.title": "Konfiguracja",
    "setup.lede":
      "Dane Google Wallet zostają na serwerze. Podłącz volume Railway pod <code>/data</code>, żeby przepustki przetrwały deploye (bez bazy danych).",
    "setup.storage": "Storage",
    "setup.storage.ok": "Trwały volume",
    "setup.storage.bad": "Efemeryczny (znika po deployu)",
    "setup.apple": "Apple Wallet",
    "setup.apple.bad": "Na razie niedostępny",
    "setup.apple.note":
      "Konfiguracja Apple Wallet jest na razie niedostępna i zostanie aktywowana wkrótce.",
    "setup.google": "Google Wallet",
    "setup.configured": "Skonfigurowano",
    "setup.needsSetup": "Wymaga konfiguracji",
    "setup.sms": "SMS",
    "setup.provider": "Dostawca: {{provider}}",
    "setup.storageHintPersistent":
      "Dane przepustek są na volume Railway i przetrwają deploye.",
    "setup.storageHintEphemeral":
      "Dane są na efemerycznym dysku i znikną po redeploy. Podłącz volume Railway pod /data (albo ustaw DATA_DIR na ścieżkę mountu).",
    "footer.tagline": "Google Wallet · Apple Wallet wkrótce",
    "pass.meta.title": "Twoja przepustka · LogisPass",
    "pass.loading": "Ładowanie przepustki…",
    "pass.notFound": "Nie znaleziono przepustki",
    "pass.loadError": "Nie udało się wczytać przepustki",
    "pass.addGoogle": "Dodaj do Google Wallet",
    "pass.addApple": "Dodaj do Apple Wallet",
    "pass.appleNote":
      "Apple Wallet jest na razie niedostępny i zostanie aktywowany wkrótce. Zapisz przepustkę w Google Wallet.",
    "pass.device.ios": "Wykryto iPhone — dla tego urządzenia rekomendujemy Apple Wallet.",
    "pass.device.iosAppleSoon":
      "Wykryto iPhone. Apple Wallet uruchomimy wkrótce — na razie zapisz w Google Wallet.",
    "pass.device.android": "Wykryto Androida — dla tego urządzenia rekomendujemy Google Wallet.",
    "pass.device.other": "Wybierz wallet dopasowany do swojego urządzenia.",
    "pass.alt.google": "Wolisz Google Wallet?",
    "pass.alt.apple": "Wolisz Apple Wallet?",
    "pass.metaLine": "Numer {{serial}} · Google {{google}} · Apple wkrótce",
    "pass.ready": "gotowy",
    "pass.preview": "podgląd",
    "common.requestFailed": "Żądanie nie powiodło się",
  },
};

/** @type {Locale} */
let currentLocale = detectInitialLocale();

/** @type {Set<() => void>} */
const listeners = new Set();

/** @returns {Locale} */
function detectInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "pl" || stored === "en") return stored;
  } catch {
    // ignore
  }
  // Polish is the site default (primary for Google indexing and first visit).
  // English is opted into via the language switch.
  return "pl";
}

/** @returns {Locale} */
export function getLocale() {
  return currentLocale;
}

/**
 * @param {string} key
 * @param {Record<string, string | number>=} vars
 */
export function t(key, vars) {
  const table = messages[currentLocale] || messages.pl;
  let value = table[key] ?? messages.pl[key] ?? messages.en[key] ?? key;
  if (vars) {
    for (const [name, raw] of Object.entries(vars)) {
      value = value.replaceAll(`{{${name}}}`, String(raw));
    }
  }
  return value;
}

/** @param {Locale} locale */
export function setLocale(locale) {
  if (locale !== "pl" && locale !== "en") return;
  if (locale === currentLocale) {
    applyDomTranslations(document);
    return;
  }
  currentLocale = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
  applyDomTranslations(document);
  for (const listener of listeners) listener();
}

/** @param {() => void} listener */
export function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** @param {ParentNode} root */
export function applyDomTranslations(root = document) {
  document.documentElement.lang = currentLocale;

  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const mode = el.getAttribute("data-i18n-mode") || "text";
    const value = t(key);
    if (mode === "html") el.innerHTML = value;
    else el.textContent = value;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key || !("placeholder" in el)) return;
    el.placeholder = t(key);
  });

  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    el.setAttribute("title", t(key));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });

  const titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) {
    const key = titleEl.getAttribute("data-i18n");
    if (key) document.title = t(key);
  }

  root.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    const active = lang === currentLocale;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

/** Wire header language buttons inside `root`. */
export function bindLanguageSwitch(root = document) {
  root.querySelectorAll(".lang-switch").forEach((group) => {
    if (group.dataset.langBound === "1") return;
    group.dataset.langBound = "1";
    group.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest("[data-lang]");
      if (!btn || !group.contains(btn)) return;
      event.preventDefault();
      const lang = btn.getAttribute("data-lang");
      if (lang === "pl" || lang === "en") setLocale(lang);
    });
  });
}

export function initI18n(root = document) {
  bindLanguageSwitch(root);
  applyDomTranslations(root);
}
