/** Feature flags for wallet platforms. Apple signing is temporarily unavailable. */
export const WALLET_FEATURES = {
  googleEnabled: true,
  /** When false, pass creation is Google-only and Apple UI shows “coming soon”. */
  appleEnabled: false,
} as const;

export const APPLE_COMING_SOON_MESSAGE =
  "Apple Wallet configuration is unavailable for now and will be activated soon.";
