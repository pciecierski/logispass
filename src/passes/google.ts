import { GoogleAuth } from "google-auth-library";
import { SignJWT, importPKCS8 } from "jose";
import type { AppConfig, CreatePassInput, StoredPass } from "../types.js";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function parseServiceAccount(config: AppConfig): ServiceAccount {
  if (!config.google.serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY (or KEY_PATH) is required");
  }
  const parsed = JSON.parse(config.google.serviceAccountKey) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Service account JSON must include client_email and private_key");
  }
  return parsed;
}

export function googleStatus(config: AppConfig): {
  configured: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!config.google.issuerId) missing.push("GOOGLE_ISSUER_ID");
  if (!config.google.serviceAccountKey) {
    missing.push("GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_PATH");
  } else {
    try {
      parseServiceAccount(config);
    } catch {
      missing.push("valid Google service account JSON");
    }
  }
  return { configured: missing.length === 0, missing };
}

function classId(config: AppConfig, style: CreatePassInput["style"]): string {
  return `${config.google.issuerId!}.${config.google.classSuffix}_${style}`;
}

function objectId(config: AppConfig, serial: string): string {
  const safe = serial.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${config.google.issuerId!}.${safe}`;
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 6 ? h : "0B3D2E", 16);
  return `#${((1 << 24) + n).toString(16).slice(1).toUpperCase()}`;
}

function buildGenericClass(config: AppConfig, style: CreatePassInput["style"]) {
  const id = classId(config, style);
  const base = {
    id,
    issuerName: "Wallet Pass",
    reviewStatus: "UNDER_REVIEW",
  };

  switch (style) {
    case "coupon":
      return {
        ...base,
        reviewStatus: "UNDER_REVIEW",
        redemptionChannel: "BOTH",
        provider: "Wallet Pass",
      };
    case "eventTicket":
      return {
        ...base,
        eventName: {
          defaultValue: { language: "en-US", value: "Event" },
        },
      };
    case "storeCard":
    case "generic":
    case "boardingPass":
    default:
      return {
        ...base,
        classTemplateInfo: {
          cardTemplateOverride: {
            cardRowTemplateInfos: [
              {
                twoItems: {
                  startItem: {
                    firstValue: {
                      fields: [{ fieldPath: "object.textModulesData['title']" }],
                    },
                  },
                  endItem: {
                    firstValue: {
                      fields: [{ fieldPath: "object.textModulesData['subtitle']" }],
                    },
                  },
                },
              },
            ],
          },
        },
      };
  }
}

function buildObject(config: AppConfig, stored: StoredPass) {
  const input = stored.input;
  const id = objectId(config, stored.serialNumber);
  const cid = classId(config, input.style);
  const bg = hexToRgb(input.backgroundColor || "#0B3D2E");
  const barcode = {
    type: "QR_CODE",
    value: input.barcodeMessage || stored.serialNumber,
    alternateText: stored.serialNumber,
  };

  const textModules = [
    {
      id: "title",
      header: "Title",
      body: input.primaryFields?.[0]?.value || input.eventName || input.description,
    },
    {
      id: "subtitle",
      header: "Details",
      body:
        input.secondaryFields?.[0]?.value ||
        input.venue ||
        input.discount ||
        input.organizationName,
    },
  ];

  const common = {
    id,
    classId: cid,
    state: "ACTIVE",
    barcode,
    hexBackgroundColor: bg,
    textModulesData: textModules,
  };

  switch (input.style) {
    case "coupon":
      return {
        ...common,
        offerId: stored.serialNumber,
        redemptionChannel: "BOTH",
        provider: input.organizationName,
        title: input.discount || input.description,
      };
    case "eventTicket":
      return {
        ...common,
        ticketHolderName: input.organizationName,
        ticketNumber: stored.serialNumber,
      };
    case "storeCard":
    case "boardingPass":
    case "generic":
    default:
      return {
        ...common,
        cardTitle: {
          defaultValue: { language: "en-US", value: input.organizationName },
        },
        header: {
          defaultValue: {
            language: "en-US",
            value:
              input.logoText ||
              (input.style === "boardingPass"
                ? `${input.headerFields?.[0]?.value || "DEP"} → ${input.headerFields?.[1]?.value || "ARR"}`
                : input.description),
          },
        },
        subheader: {
          defaultValue: {
            language: "en-US",
            value: input.balance || input.organizationName,
          },
        },
      };
  }
}

function resourcePaths(style: CreatePassInput["style"]): {
  classPath: string;
  objectPath: string;
  classKey: string;
  objectKey: string;
} {
  switch (style) {
    case "coupon":
      return {
        classPath: "offerClass",
        objectPath: "offerObject",
        classKey: "offerClasses",
        objectKey: "offerObjects",
      };
    case "eventTicket":
      return {
        classPath: "eventTicketClass",
        objectPath: "eventTicketObject",
        classKey: "eventTicketClasses",
        objectKey: "eventTicketObjects",
      };
    case "storeCard":
      return {
        classPath: "loyaltyClass",
        objectPath: "loyaltyObject",
        classKey: "loyaltyClasses",
        objectKey: "loyaltyObjects",
      };
    case "boardingPass":
    case "generic":
    default:
      // Boarding passes use Generic Wallet objects to avoid flight-class required fields.
      return {
        classPath: "genericClass",
        objectPath: "genericObject",
        classKey: "genericClasses",
        objectKey: "genericObjects",
      };
  }
}

async function getAuthClient(config: AppConfig) {
  const sa = parseServiceAccount(config);
  const auth = new GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });
  return auth.getClient();
}

async function ensureClass(config: AppConfig, style: CreatePassInput["style"]): Promise<void> {
  const client = await getAuthClient(config);
  const { classPath } = resourcePaths(style);
  const id = classId(config, style);
  const base = "https://walletobjects.googleapis.com/walletobjects/v1";

  try {
    await client.request({ url: `${base}/${classPath}/${id}`, method: "GET" });
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      const body = buildGenericClass(config, style);
      await client.request({
        url: `${base}/${classPath}`,
        method: "POST",
        data: body,
      });
    } else {
      throw err;
    }
  }
}

async function upsertObject(config: AppConfig, stored: StoredPass): Promise<string> {
  const client = await getAuthClient(config);
  const { objectPath } = resourcePaths(stored.input.style);
  const obj = buildObject(config, stored);
  const base = "https://walletobjects.googleapis.com/walletobjects/v1";
  const id = obj.id as string;

  try {
    await client.request({
      url: `${base}/${objectPath}/${id}`,
      method: "PUT",
      data: obj,
    });
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      await client.request({
        url: `${base}/${objectPath}`,
        method: "POST",
        data: obj,
      });
    } else {
      // If PUT failed for another reason, try insert
      try {
        await client.request({
          url: `${base}/${objectPath}`,
          method: "POST",
          data: obj,
        });
      } catch {
        throw err;
      }
    }
  }
  return id;
}

export async function createGoogleSaveUrl(
  config: AppConfig,
  stored: StoredPass,
): Promise<string> {
  const status = googleStatus(config);
  if (!status.configured) {
    throw new Error(`Google Wallet is not configured. Missing: ${status.missing.join(", ")}`);
  }

  // Prefer signed JWT "Save to Wallet" links — works without pre-creating via REST
  // when the class already exists. We still try to ensure class+object via API.
  try {
    await ensureClass(config, stored.input.style);
    await upsertObject(config, stored);
  } catch (err) {
    // Fall through to JWT-only claim if REST upsert fails (e.g. permissions pending)
    console.warn("Google Wallet REST upsert warning:", (err as Error).message);
  }

  const sa = parseServiceAccount(config);
  const { classKey, objectKey } = resourcePaths(stored.input.style);
  const claims = {
    iss: sa.client_email,
    aud: "google",
    typ: "savetowallet",
    payload: {
      [classKey]: [buildGenericClass(config, stored.input.style)],
      [objectKey]: [buildObject(config, stored)],
    },
  };

  const key = await importPKCS8(sa.private_key, "RS256");
  const token = await new SignJWT(claims as Record<string, unknown>)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .sign(key);

  return `https://pay.google.com/gp/v/save/${token}`;
}

/** Demo JWT-less placeholder when Google is not configured. */
export function demoGoogleInstructions(stored: StoredPass): {
  message: string;
  objectPreview: unknown;
} {
  return {
    message:
      "Configure GOOGLE_ISSUER_ID and a Google Wallet service account to enable Save to Wallet links.",
    objectPreview: {
      serialNumber: stored.serialNumber,
      style: stored.input.style,
      organizationName: stored.input.organizationName,
      description: stored.input.description,
    },
  };
}
