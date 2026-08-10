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
  resultSerial.textContent = `${payload.pass.serialNumber} · ${payload.pass.input.style} · Google Wallet`;
  resultLinks.innerHTML = "";
  resultLinks.append(
    linkButton(payload.urls.page, "Open pass page", "btn primary"),
    linkButton(`${payload.urls.google}?redirect=1`, "Google Wallet"),
  );

  if (payload.pass.input.recipientPhone || payload.sms) {
    const smsBtn = document.createElement("button");
    smsBtn.type = "button";
    smsBtn.className = "btn secondary";
    smsBtn.textContent = payload.sms?.sent
      ? `SMS sent to ${payload.sms.to}`
      : "Send SMS link";
    if (payload.sms?.sent) smsBtn.disabled = true;
    smsBtn.addEventListener("click", async () => {
      smsBtn.disabled = true;
      smsBtn.textContent = "Sending…";
      try {
        const resend = await api(`/api/passes/${payload.pass.id}/sms`, {
          method: "POST",
          body: JSON.stringify({
            phone: payload.pass.input.recipientPhone || undefined,
          }),
        });
        smsBtn.textContent = `SMS sent to ${resend.sms.to}`;
      } catch (err) {
        smsBtn.disabled = false;
        smsBtn.textContent = "Send SMS link";
        const li = document.createElement("li");
        li.textContent = `SMS: ${err.message}`;
        resultWarnings.append(li);
      }
    });
    resultLinks.append(smsBtn);
  }

  resultWarnings.innerHTML = "";
  for (const warning of payload.warnings || []) {
    const li = document.createElement("li");
    li.textContent = warning;
    resultWarnings.append(li);
  }
  if (payload.sms?.sent) {
    const li = document.createElement("li");
    li.className = "ok";
    li.textContent = `SMS delivered via ${payload.sms.provider} to ${payload.sms.to}`;
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
    platforms: "google",
    logoText: String(fd.get("logoText") || "").trim() || undefined,
    barcodeMessage: String(fd.get("barcodeMessage") || "").trim() || undefined,
    recipientPhone: String(fd.get("recipientPhone") || "").trim() || undefined,
    sendSms: fd.get("sendSms") === "1",
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
      linkButton(`${pass.googleSavePath}?redirect=1`, "Google"),
    );
    if (pass.input.recipientPhone) {
      const smsBtn = document.createElement("button");
      smsBtn.type = "button";
      smsBtn.className = "btn secondary";
      smsBtn.textContent = "SMS";
      smsBtn.title = `Send link to ${pass.input.recipientPhone}`;
      smsBtn.addEventListener("click", async () => {
        smsBtn.disabled = true;
        smsBtn.textContent = "…";
        try {
          await api(`/api/passes/${pass.id}/sms`, {
            method: "POST",
            body: JSON.stringify({}),
          });
          smsBtn.textContent = "Sent";
        } catch (err) {
          smsBtn.disabled = false;
          smsBtn.textContent = "SMS";
          alert(err.message);
        }
      });
      actions.append(smsBtn);
    }
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
    <div class="setup-block ${status.storage?.persistent ? "" : "coming-soon"}">
      <h3>Storage</h3>
      <p class="${status.storage?.persistent ? "ok" : "bad"}">
        ${status.storage?.persistent ? "Persistent volume" : "Ephemeral (lost on deploy)"}
      </p>
      <p class="muted">${escapeHtml(status.storage?.hint || "")}</p>
      <p class="muted">DATA_DIR: ${escapeHtml(status.storage?.dataDir || "—")}</p>
    </div>
    <div class="setup-block coming-soon">
      <h3>Apple Wallet</h3>
      <p class="bad">Unavailable for now</p>
      <p class="muted">
        Apple Wallet configuration is unavailable for now and will be activated soon.
      </p>
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
    <div class="setup-block">
      <h3>SMS</h3>
      <p class="${status.sms?.configured ? "ok" : "bad"}">
        ${status.sms?.configured ? `Configured (${escapeHtml(status.sms.provider)})` : "Needs setup"}
      </p>
      ${
        status.sms?.missing?.length
          ? `<ul>${status.sms.missing.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`
          : `<p class="muted">Provider: ${escapeHtml(status.sms?.provider || "none")}</p>`
      }
    </div>
  `;

  envHelp.textContent = `PUBLIC_BASE_URL=${status.publicBaseUrl}
DATA_DIR=${status.storage?.dataDir || "/data"}

# Persist passes on Railway (no database):
# railway volume add --service <service> --mount-path /data
# Keep DATA_DIR=/data so it matches the volume mount.

# Google Wallet (active)
GOOGLE_ISSUER_ID=3388xxxxxxxx
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
# or GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/secrets/google.json

# Apple Wallet — coming soon (not active yet)
# APPLE_PASS_TYPE_ID=pass.com.your.company
# APPLE_TEAM_ID=XXXXXXXXXX
# APPLE_ORG_NAME=Your Org

# SMS — Twilio or SMSAPI (PL)
# SMS_PROVIDER=twilio
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_FROM_NUMBER=+1...
# SMS_PROVIDER=smsapi
# SMSAPI_TOKEN=
# SMSAPI_FROM=LogisPass
# SMS_MESSAGE_TEMPLATE=LogisPass: Your pass from {{org}} — open {{url}}
# For local testing without a gateway: SMS_PROVIDER=log`;
}

loadPasses().catch(console.error);
loadStatus().catch(console.error);
