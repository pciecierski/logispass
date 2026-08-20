import { normalizeEmail } from "./authCrypto.js";
import type { Account, AccountRole } from "./types.js";

export function adminEmailsFromEnv(): Set<string> {
  const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((x) => normalizeEmail(x))
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string): boolean {
  return adminEmailsFromEnv().has(normalizeEmail(email));
}

export function roleForEmail(email: string, fallback: AccountRole = "user"): AccountRole {
  return isAdminEmail(email) ? "admin" : fallback;
}

/** Promote account to admin when e-mail is listed in ADMIN_EMAILS. */
export async function syncAdminRoleFromEnv(
  account: Account,
  update: (next: Account) => Promise<Account>,
): Promise<Account> {
  if (!isAdminEmail(account.email)) return account;
  if (account.role === "admin") return account;
  return update({
    ...account,
    role: "admin",
    updatedAt: new Date().toISOString(),
  });
}
