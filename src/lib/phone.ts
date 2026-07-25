/** Normalize a phone number to E.164. Accepts PL national numbers (9 digits). */
export function normalizePhone(raw: string): string {
  let value = raw.trim().replace(/[\s().-]/g, "");
  if (value.startsWith("00")) {
    value = `+${value.slice(2)}`;
  }
  if (/^\d{9}$/.test(value)) {
    value = `+48${value}`;
  }
  if (/^48\d{9}$/.test(value)) {
    value = `+${value}`;
  }
  if (!/^\+[1-9]\d{7,14}$/.test(value)) {
    throw new Error(
      "Invalid phone number. Use E.164 (e.g. +48123456789) or a 9-digit PL number.",
    );
  }
  return value;
}
