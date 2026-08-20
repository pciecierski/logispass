export type AccountRole = "user" | "admin";

export type Account = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  locationName: string;
  email: string;
  passwordHash: string | null;
  emailConfirmedAt: string | null;
  role: AccountRole;
  createdAt: string;
  updatedAt: string;
};

export type PublicAccount = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  locationName: string;
  email: string;
  emailConfirmed: boolean;
  role: AccountRole;
};

export type PasswordSetupToken = {
  token: string;
  accountId: string;
  expiresAt: string;
  usedAt: string | null;
};

export type Session = {
  id: string;
  accountId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export function toPublicAccount(account: Account): PublicAccount {
  return {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    company: account.company,
    locationName: account.locationName,
    email: account.email,
    emailConfirmed: Boolean(account.emailConfirmedAt),
    role: account.role,
  };
}
