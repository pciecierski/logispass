import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const SCRYPT_KEYLEN = 64;

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function shortId(size = 12): string {
  return randomBytes(Math.ceil((size * 3) / 4))
    .toString("base64url")
    .slice(0, size);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const derived = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeLocationName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
