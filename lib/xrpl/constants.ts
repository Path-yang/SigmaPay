// XRPL Network Configuration
// Using xrpl-labs testnet which may be faster than the default
export const XRPL_TESTNET_URL = "wss://testnet.xrpl-labs.com";
export const XRPL_TESTNET_FAUCET = "https://faucet.altnet.rippletest.net/accounts";

// RLUSD on Testnet - REAL ISSUER FROM tryrlusd.com
export const RLUSD_ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";
// XRPL requires non-3-char currencies to be 40-char hex
// "RLUSD" encoded as hex, padded to 40 chars
export const RLUSD_CURRENCY = "524C555344000000000000000000000000000000"; // "RLUSD" in hex
export const RLUSD_CURRENCY_DISPLAY = "RLUSD"; // Human-readable name

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
