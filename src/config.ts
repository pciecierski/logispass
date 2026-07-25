import fs from "node:fs";
import path from "node:path";
import type { AppConfig } from "./types.js";

function truthy(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function resolvePath(maybePath: string | undefined, fallback: string): string {
  if (!maybePath) return fallback;
  return path.isAbsolute(maybePath) ? maybePath : path.resolve(process.cwd(), maybePath);
}

export function loadConfig(): AppConfig {
  const dataDir = resolvePath(process.env.DATA_DIR, path.join(process.cwd(), "data"));
  const certsDir = resolvePath(process.env.CERTS_DIR, path.join(process.cwd(), "certs"));

  const wwdrPath = process.env.APPLE_WWDR_CERT_PATH
    ? resolvePath(process.env.APPLE_WWDR_CERT_PATH, "")
    : path.join(certsDir, "wwdr.pem");
  const signerCertPath = process.env.APPLE_SIGNER_CERT_PATH
    ? resolvePath(process.env.APPLE_SIGNER_CERT_PATH, "")
    : path.join(certsDir, "signerCert.pem");
  const signerKeyPath = process.env.APPLE_SIGNER_KEY_PATH
    ? resolvePath(process.env.APPLE_SIGNER_KEY_PATH, "")
    : path.join(certsDir, "signerKey.pem");

  const appleCertsPresent =
    fs.existsSync(wwdrPath) && fs.existsSync(signerCertPath) && fs.existsSync(signerKeyPath);

  const appleEnabled =
    truthy(process.env.APPLE_WALLET_ENABLED) ||
    (Boolean(process.env.APPLE_PASS_TYPE_ID) &&
      Boolean(process.env.APPLE_TEAM_ID) &&
      appleCertsPresent);

  const googleKey =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH &&
    fs.existsSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH)
      ? fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH, "utf8")
      : undefined);

  const googleEnabled =
    truthy(process.env.GOOGLE_WALLET_ENABLED) ||
    (Boolean(process.env.GOOGLE_ISSUER_ID) && Boolean(googleKey));

  const port = Number(process.env.PORT || 3000);
  const publicBaseUrl = (process.env.PUBLIC_BASE_URL || `http://localhost:${port}`).replace(
    /\/$/,
    "",
  );

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(certsDir, { recursive: true });
  fs.mkdirSync(path.join(dataDir, "passes"), { recursive: true });

  return {
    port,
    publicBaseUrl,
    dataDir,
    certsDir,
    apple: {
      enabled: appleEnabled && appleCertsPresent && Boolean(process.env.APPLE_PASS_TYPE_ID),
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
      teamIdentifier: process.env.APPLE_TEAM_ID,
      organizationName: process.env.APPLE_ORG_NAME,
      wwdrPath,
      signerCertPath,
      signerKeyPath,
      signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE || "",
    },
    google: {
      enabled: googleEnabled,
      issuerId: process.env.GOOGLE_ISSUER_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      serviceAccountKey: googleKey,
      classSuffix: process.env.GOOGLE_CLASS_SUFFIX || "walletpass",
    },
  };
}
