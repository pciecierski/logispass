import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import type { AppConfig } from "../types.js";
import { PassStore } from "../passes/store.js";
import { createPassSchema } from "../lib/schema.js";
import { appleStatus, buildApplePass, writeApplePreview } from "../passes/apple.js";
import {
  createGoogleSaveUrl,
  demoGoogleInstructions,
  googleStatus,
} from "../passes/google.js";

export function createApiRouter(config: AppConfig, store: PassStore): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "wallet-pass" });
  });

  router.get("/status", (_req, res) => {
    const apple = appleStatus(config);
    const google = googleStatus(config);
    res.json({
      publicBaseUrl: config.publicBaseUrl,
      apple: {
        enabled: config.apple.enabled,
        configured: apple.configured,
        missing: apple.missing,
        passTypeIdentifier: config.apple.passTypeIdentifier || null,
      },
      google: {
        enabled: config.google.enabled,
        configured: google.configured,
        missing: google.missing,
        issuerId: config.google.issuerId || null,
      },
    });
  });

  router.get("/passes", (_req, res) => {
    res.json({ passes: store.list() });
  });

  router.get("/passes/:id", (req, res) => {
    const pass = store.get(req.params.id);
    if (!pass) {
      res.status(404).json({ error: "Pass not found" });
      return;
    }
    res.json({
      pass,
      urls: {
        page: `${config.publicBaseUrl}${pass.statusPagePath}`,
        apple: `${config.publicBaseUrl}${pass.appleDownloadPath}`,
        google: `${config.publicBaseUrl}${pass.googleSavePath}`,
      },
    });
  });

  router.post("/passes", async (req, res) => {
    try {
      const parsed = createPassSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid pass payload", details: parsed.error.flatten() });
        return;
      }

      const input = parsed.data;
      const stored = store.create(input, config.publicBaseUrl);
      const dir = store.passDir(stored.id);

      let appleReady = false;
      let googleReady = false;
      let googleSaveUrl: string | undefined;
      const errors: string[] = [];

      const wantApple = input.platforms === "apple" || input.platforms === "both";
      const wantGoogle = input.platforms === "google" || input.platforms === "both";

      if (wantApple) {
        try {
          if (appleStatus(config).configured) {
            await buildApplePass(config, stored, dir);
            appleReady = true;
          } else {
            await writeApplePreview(config, stored, dir);
            errors.push(
              `Apple preview only — configure: ${appleStatus(config).missing.join(", ")}`,
            );
          }
        } catch (err) {
          errors.push(`Apple: ${(err as Error).message}`);
          await writeApplePreview(config, stored, dir).catch(() => undefined);
        }
      }

      if (wantGoogle) {
        try {
          if (googleStatus(config).configured) {
            googleSaveUrl = await createGoogleSaveUrl(config, stored);
            googleReady = true;
            fs.writeFileSync(
              `${dir}/google-save-url.txt`,
              googleSaveUrl,
              "utf8",
            );
          } else {
            const demo = demoGoogleInstructions(stored);
            fs.writeFileSync(
              `${dir}/google-preview.json`,
              JSON.stringify(demo, null, 2),
              "utf8",
            );
            errors.push(`Google preview only — configure: ${googleStatus(config).missing.join(", ")}`);
          }
        } catch (err) {
          errors.push(`Google: ${(err as Error).message}`);
        }
      }

      const updated = store.update(stored.id, {
        appleReady,
        googleReady,
        googleSaveUrl,
      });

      res.status(201).json({
        pass: updated,
        urls: {
          page: `${config.publicBaseUrl}${updated.statusPagePath}`,
          apple: `${config.publicBaseUrl}${updated.appleDownloadPath}`,
          google: `${config.publicBaseUrl}${updated.googleSavePath}`,
        },
        warnings: errors,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.get("/passes/:id/apple.pkpass", async (req, res) => {
    const pass = store.get(req.params.id);
    if (!pass) {
      res.status(404).json({ error: "Pass not found" });
      return;
    }

    const dir = store.passDir(pass.id);
    const pkpassPath = `${dir}/pass.pkpass`;

    try {
      if (!fs.existsSync(pkpassPath)) {
        if (!appleStatus(config).configured) {
          res.status(503).json({
            error: "Apple Wallet certificates are not configured",
            missing: appleStatus(config).missing,
            preview: fs.existsSync(`${dir}/pass.json`)
              ? `${config.publicBaseUrl}/api/passes/${pass.id}/preview`
              : null,
          });
          return;
        }
        await buildApplePass(config, pass, dir);
        store.update(pass.id, { appleReady: true });
      }

      res.setHeader("Content-Type", "application/vnd.apple.pkpass");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${pass.serialNumber}.pkpass"`,
      );
      fs.createReadStream(pkpassPath).pipe(res);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.get("/passes/:id/preview", (req, res) => {
    const pass = store.get(req.params.id);
    if (!pass) {
      res.status(404).json({ error: "Pass not found" });
      return;
    }
    const previewPath = `${store.passDir(pass.id)}/pass.json`;
    if (!fs.existsSync(previewPath)) {
      res.status(404).json({ error: "No preview available" });
      return;
    }
    res.type("json").send(fs.readFileSync(previewPath, "utf8"));
  });

  router.get("/passes/:id/google", async (req, res) => {
    const pass = store.get(req.params.id);
    if (!pass) {
      res.status(404).json({ error: "Pass not found" });
      return;
    }

    try {
      let url = pass.googleSaveUrl;
      if (!url) {
        if (!googleStatus(config).configured) {
          res.status(503).json(demoGoogleInstructions(pass));
          return;
        }
        url = await createGoogleSaveUrl(config, pass);
        store.update(pass.id, { googleReady: true, googleSaveUrl: url });
      }

      if (req.query.redirect === "1" || req.query.redirect === "true") {
        res.redirect(url);
        return;
      }
      res.json({ saveUrl: url });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.delete("/passes/:id", (req, res) => {
    const ok = store.delete(req.params.id);
    if (!ok) {
      res.status(404).json({ error: "Pass not found" });
      return;
    }
    res.status(204).end();
  });

  // Convenience typed handlers for TS
  void (null as unknown as Request);
  void (null as unknown as Response);

  return router;
}
