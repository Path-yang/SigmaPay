// XRPL Network Configuration
export const XRPL_TESTNET_URL = "wss://s.altnet.rippletest.net:51233";
export const XRPL_TESTNET_FAUCET = "https://faucet.altnet.rippletest.net/accounts";

// RLUSD on Testnet
export const RLUSD_ISSUER = "rQhWct2fTR6gPgmc8sLMdM6U8Lwrjvzzyj";
export const RLUSD_CURRENCY = "RLUSD";

// Explorer URLs
export const EXPLORER_BASE_URL = "https://testnet.xrpl.org";

// Get explorer link for a transaction
export function getExplorerTxLink(hash: string): string {
  return `${EXPLORER_BASE_URL}/transactions/${hash}`;
}

// Get explorer link for an account
export function getExplorerAccountLink(address: string): string {
  return `${EXPLORER_BASE_URL}/accounts/${address}`;
}
