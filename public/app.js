const form = document.getElementById("pass-form");
const extras = document.getElementById("style-extras");
const styleSelect = form.querySelector('[name="style"]');
const result = document.getElementById("result");
const resultSerial = document.getElementById("result-serial");
const resultLinks = document.getElementById("result-links");
const resultWarnings = document.getElementById("result-warnings");
const formNote = document.getElementById("form-note");
const submitBtn = document.getElementById("submit-btn");
const passList = document.getElementById("pass-list");
const setupStatus = document.getElementById("setup-status");
const envHelp = document.getElementById("env-help");

function syncExtras() {
  extras.className = `style-extras show-${styleSelect.value}`;
}

styleSelect.addEventListener("change", syncExtras);
syncExtras();

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data?.error || res.statusText || "Request failed");
  }
  return data;
}

function linkButton(href, label, className = "btn secondary") {
  const a = document.createElement("a");
  a.href = href;
  a.className = className;
  a.textContent = label;
  if (href.endsWith(".pkpass")) a.download = "";
  return a;
}

function renderResult(payload) {
  result.hidden = false;
  resultSerial.textContent = `${payload.pass.serialNumber} · ${payload.pass.input.style}`;
  resultLinks.innerHTML = "";
  resultLinks.append(
    linkButton(payload.urls.page, "Open pass page", "btn primary"),
    linkButton(payload.urls.apple, "Apple .pkpass"),
    linkButton(`${payload.urls.google}?redirect=1`, "Google Wallet"),
  );
  resultWarnings.innerHTML = "";
  for (const warning of payload.warnings || []) {
    const li = document.createElement("li");
    li.textContent = warning;
    resultWarnings.append(li);
  }
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formNote.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Publishing…";

  const fd = new FormData(form);
  const style = String(fd.get("style"));
  const body = {
    organizationName: String(fd.get("organizationName") || "").trim(),
    description: String(fd.get("description") || "").trim(),
    style,
    platforms: String(fd.get("platforms") || "both"),
    logoText: String(fd.get("logoText") || "").trim() || undefined,
    barcodeMessage: String(fd.get("barcodeMessage") || "").trim() || undefined,
    backgroundColor: String(fd.get("backgroundColor") || "#0B3D2E"),
    foregroundColor: String(fd.get("foregroundColor") || "#F4EFE6"),
    labelColor: "#C8B8A0",
  };

  if (style === "coupon") {
    body.discount = String(fd.get("discount") || "").trim() || undefined;
  }
  if (style === "eventTicket") {
    body.eventName = String(fd.get("eventName") || "").trim() || undefined;
    body.venue = String(fd.get("venue") || "").trim() || undefined;
  }
  if (style === "storeCard") {
    body.balance = String(fd.get("balance") || "").trim() || undefined;
  }
  if (style === "boardingPass") {
    const origin = String(fd.get("origin") || "").trim();
    const destination = String(fd.get("destination") || "").trim();
    body.headerFields = [
      { key: "origin", label: "From", value: origin || "DEP" },
      { key: "destination", label: "To", value: destination || "ARR" },
    ];
    body.transitType = "PKTransitTypeAir";
  }

  try {
    const payload = await api("/api/passes", {
      method: "POST",
      body: JSON.stringify(body),
    });
    renderResult(payload);
    await loadPasses();
  } catch (err) {
    formNote.hidden = false;
    formNote.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Publish pass";
  }
});

async function loadPasses() {
  const data = await api("/api/passes");
  passList.innerHTML = "";
  if (!data.passes?.length) {
    passList.innerHTML = `<p class="muted">No passes yet. Create one above.</p>`;
    return;
  }
  for (const pass of data.passes) {
    const row = document.createElement("div");
    row.className = "pass-row";
    row.innerHTML = `
      <div>
        <h3>${escapeHtml(pass.input.organizationName)} · ${escapeHtml(pass.input.style)}</h3>
        <p>${escapeHtml(pass.serialNumber)} · ${new Date(pass.createdAt).toLocaleString()}</p>
      </div>
    `;
    const actions = document.createElement("div");
    actions.className = "pass-row-actions";
    actions.append(
      linkButton(pass.statusPagePath, "Open"),
      linkButton(pass.appleDownloadPath, "Apple"),
      linkButton(`${pass.googleSavePath}?redirect=1`, "Google"),
    );
    row.append(actions);
    passList.append(row);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadStatus() {
  const status = await api("/api/status");
  setupStatus.innerHTML = `
    <div class="setup-block">
      <h3>Apple Wallet</h3>
      <p class="${status.apple.configured ? "ok" : "bad"}">
        ${status.apple.configured ? "Configured" : "Needs setup"}
      </p>
      ${
        status.apple.missing?.length
          ? `<ul>${status.apple.missing.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`
          : `<p class="muted">Pass Type ID: ${escapeHtml(status.apple.passTypeIdentifier || "—")}</p>`
      }
    </div>
    <div class="setup-block">
      <h3>Google Wallet</h3>
      <p class="${status.google.configured ? "ok" : "bad"}">
        ${status.google.configured ? "Configured" : "Needs setup"}
      </p>
      ${
        status.google.missing?.length
          ? `<ul>${status.google.missing.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`
          : `<p class="muted">Issuer ID: ${escapeHtml(status.google.issuerId || "—")}</p>`
      }
    </div>
  `;

  envHelp.textContent = `PUBLIC_BASE_URL=${status.publicBaseUrl}

# Apple Wallet
APPLE_PASS_TYPE_ID=pass.com.your.company
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_ORG_NAME=Your Org
# Place PEM files in ./certs or set paths:
# APPLE_WWDR_CERT_PATH / APPLE_SIGNER_CERT_PATH / APPLE_SIGNER_KEY_PATH
# APPLE_SIGNER_KEY_PASSPHRASE=

# Google Wallet
GOOGLE_ISSUER_ID=3388xxxxxxxx
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
# or GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/secrets/google.json`;
}

loadPasses().catch(console.error);
loadStatus().catch(console.error);
