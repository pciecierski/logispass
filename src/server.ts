import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { PassStore } from "./passes/store.js";
import { createApiRouter } from "./routes/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = loadConfig();
const store = new PassStore(config.dataDir);

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use("/api", createApiRouter(config, store));

const publicDir = path.join(__dirname, "..", "public");

/** Signal Polish as the primary language for HTML documents (SEO / crawlers). */
function sendHtml(res: express.Response, file: string) {
  res.setHeader("Content-Language", "pl");
  res.sendFile(file);
}

app.use(
  express.static(publicDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Content-Language", "pl");
      }
    },
  }),
);

app.get("/p/:id", (_req, res) => {
  sendHtml(res, path.join(publicDir, "pass.html"));
});

app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  sendHtml(res, path.join(publicDir, "index.html"));
});

app.listen(config.port, () => {
  console.log(`LogisPass server listening on :${config.port}`);
  console.log(`Public base URL: ${config.publicBaseUrl}`);
  console.log(
    `Storage: ${config.dataDir} (${config.storage.persistent ? "persistent volume" : "ephemeral — attach Railway volume at /data"})`,
  );
  console.log(
    `Google Wallet: ${config.google.enabled ? "enabled" : "needs credentials"} · Apple Wallet: coming soon`,
  );
});
