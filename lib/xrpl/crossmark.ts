/**
 * Crossmark Wallet Integration
 * Crossmark is a browser extension wallet for XRPL
 * https://crossmark.io
 */

// Types for Crossmark API
interface CrossmarkAPI {
  isConnected: () => Promise<boolean>;
  connect: () => Promise<{ response: { address: string } }>;
  signAndSubmit: (payload: {
    TransactionType: string;
    Account: string;
    [key: string]: unknown;
  }) => Promise<{
    response: {
      data: {
        resp: {
          result: {
            hash: string;
            meta?: { TransactionResult?: string };
          };
        };
      };
    };
  }>;
  getAddress: () => Promise<{ response: { address: string } }>;
  signMessage: (message: string) => Promise<{ response: { signature: string } }>;
}

declare global {
  interface Window {
    crossmark?: CrossmarkAPI;
    xrpl?: CrossmarkAPI; // Some versions use window.xrpl
  }
}

/**
 * Check if Crossmark extension is installed
 */
export function isCrossmarkInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.crossmark || window.xrpl);
}

/**
 * Get the Crossmark API object
 */
function getCrossmarkAPI(): CrossmarkAPI | null {
  if (typeof window === "undefined") return null;
  return window.crossmark || window.xrpl || null;
}

/**
 * Connect to Crossmark wallet
 */
export async function connectCrossmark(): Promise<{ 
  success: boolean; 
  address?: string; 
  error?: string 
}> {
  const api = getCrossmarkAPI();
  
  if (!api) {
    return { 
      success: false, 
      error: "Crossmark wallet not installed. Please install from crossmark.io" 
    };
  }

  try {
    const result = await api.connect();
    const address = result.response?.address;
    
    if (address) {
      return { success: true, address };
    }
    
    return { success: false, error: "Failed to get address from Crossmark" };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to connect to Crossmark" 
    };
  }
}

/**
 * Check if Crossmark is connected
 */
export async function isCrossmarkConnected(): Promise<boolean> {
  const api = getCrossmarkAPI();
  if (!api) return false;
  
  try {
    return await api.isConnected();
  } catch {
    return false;
  }
}

/**
 * Get current address from Crossmark
 */
export async function getCrossmarkAddress(): Promise<string | null> {
  const api = getCrossmarkAPI();
  if (!api) return null;
  
  try {
    const result = await api.getAddress();
    return result.response?.address || null;
  } catch {
    return null;
  }
}

/**
 * Sign and submit a transaction using Crossmark
 */
export async function signAndSubmitWithCrossmark(transaction: {
  TransactionType: string;
  Account: string;
  [key: string]: unknown;
}): Promise<{
  success: boolean;
  hash?: string;
  error?: string;
}> {
  const api = getCrossmarkAPI();
  
  if (!api) {
    return { 
      success: false, 
      error: "Crossmark wallet not installed" 
    };
  }

  try {
    const result = await api.signAndSubmit(transaction);
    const txResult = result.response?.data?.resp?.result;
    
    if (txResult?.meta?.TransactionResult === "tesSUCCESS") {
      return { success: true, hash: txResult.hash };
    }
    
    return { 
      success: false, 
      error: txResult?.meta?.TransactionResult || "Transaction failed" 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to sign transaction" 
    };
  }
}

/**
 * Send RLUSD payment using Crossmark
 */
export async function sendRLUSDWithCrossmark(
  destination: string,
  amount: string,
  currency: string,
  issuer: string,
  memo?: string
): Promise<{
  success: boolean;
  hash?: string;
  error?: string;
}> {
  const address = await getCrossmarkAddress();
  if (!address) {
    return { success: false, error: "Not connected to Crossmark" };
  }

  const transaction: Record<string, unknown> = {
    TransactionType: "Payment",
    Account: address,
    Destination: destination,
    Amount: {
      currency,
      issuer,
      value: amount,
    },
  };

  if (memo) {
    transaction.Memos = [
      {
        Memo: {
          MemoType: Buffer.from("gift_message", "utf8").toString("hex").toUpperCase(),
          MemoData: Buffer.from(memo, "utf8").toString("hex").toUpperCase(),
        },
      },
    ];
  }

  return signAndSubmitWithCrossmark(transaction as { TransactionType: string; Account: string });
}

/**
 * Create trustline using Crossmark
 */
export async function createTrustlineWithCrossmark(
  currency: string,
  issuer: string,
  limit: string = "1000000000"
): Promise<{
  success: boolean;
  hash?: string;
  error?: string;
}> {
  const address = await getCrossmarkAddress();
  if (!address) {
    return { success: false, error: "Not connected to Crossmark" };
  }

  const transaction = {
    TransactionType: "TrustSet",
    Account: address,
    LimitAmount: {
      currency,
      issuer,
      value: limit,
    },
  };

  return signAndSubmitWithCrossmark(transaction);
}

