const id = location.pathname.split("/").filter(Boolean).pop();
const title = document.getElementById("pass-title");
const desc = document.getElementById("pass-desc");
const preview = document.getElementById("pass-preview");
const actions = document.getElementById("pass-actions");
const meta = document.getElementById("pass-meta");

async function main() {
  const res = await fetch(`/api/passes/${id}`);
  if (!res.ok) {
    title.textContent = "Pass not found";
    return;
  }
  const data = await res.json();
  const pass = data.pass;
  const input = pass.input;

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
  const apple = document.createElement("a");
  apple.className = "btn primary";
  apple.href = data.urls.apple;
  apple.textContent = "Add to Apple Wallet";
  const google = document.createElement("a");
  google.className = "btn secondary";
  google.href = `${data.urls.google}?redirect=1`;
  google.textContent = "Add to Google Wallet";
  actions.append(apple, google);

  meta.textContent = `Serial ${pass.serialNumber} · Apple ${
    pass.appleReady ? "ready" : "preview"
  } · Google ${pass.googleReady ? "ready" : "preview"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

main().catch((err) => {
  title.textContent = "Could not load pass";
  desc.textContent = err.message;
});
