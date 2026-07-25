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
app.use(express.static(publicDir));

app.get("/p/:id", (_req, res) => {
  res.sendFile(path.join(publicDir, "pass.html"));
});

app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(config.port, () => {
  console.log(`LogisPass server listening on :${config.port}`);
  console.log(`Public base URL: ${config.publicBaseUrl}`);
  console.log(
    `Apple Wallet: ${config.apple.enabled ? "enabled" : "needs certificates"} · Google Wallet: ${config.google.enabled ? "enabled" : "needs credentials"}`,
  );
});
