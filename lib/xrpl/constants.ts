// XRPL Network Configuration
export const XRPL_TESTNET_URL = "wss://s.altnet.rippletest.net:51233";
export const XRPL_TESTNET_FAUCET = "https://faucet.altnet.rippletest.net/accounts";

// RLUSD on Testnet
export const RLUSD_ISSUER = "rQhWct2fTR6gPgmc8sLMdM6U8Lwrjvzzyj";
export const RLUSD_CURRENCY = "RLUSD";

// Explorer URLs
export const EXPLORER_BASE_URL = "https://testnet.xrpl.org";

// Verification Levels
export enum VerificationLevel {
  UNVERIFIED = "unverified",
  BASIC = "basic",
  VERIFIED = "verified",
}

// Verification Limits (in RLUSD)
export const LIMITS: Record<string, number> = {
  [VerificationLevel.UNVERIFIED]: 100,
  [VerificationLevel.BASIC]: 1000,
  [VerificationLevel.VERIFIED]: Infinity,
};

// Get explorer link for a transaction
export function getExplorerTxLink(hash: string): string {
  return `${EXPLORER_BASE_URL}/transactions/${hash}`;
}

// Get explorer link for an account
export function getExplorerAccountLink(address: string): string {
  return `${EXPLORER_BASE_URL}/accounts/${address}`;
}

// Get limit display string
export function getLimitDisplay(level: VerificationLevel): string {
  const limit = LIMITS[level];
  if (limit === Infinity) {
    return "Unlimited";
  }
  return `$${limit.toLocaleString()}`;
}

// Verification level benefits
export const VERIFICATION_BENEFITS = {
  [VerificationLevel.UNVERIFIED]: {
    limit: "$100",
    method: "Claimable Checks",
    features: ["Basic transfers", "Receive payments"],
  },
  [VerificationLevel.BASIC]: {
    limit: "$1,000",
    method: "Direct Payments",
    features: ["Instant transfers", "Higher limits", "Priority support"],
  },
  [VerificationLevel.VERIFIED]: {
    limit: "Unlimited",
    method: "Direct Payments",
    features: ["Unlimited transfers", "Instant settlement", "Lowest fees", "Business features"],
  },
};
