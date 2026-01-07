import { TrustSet } from "xrpl";
import { getClient } from "./client";
import { RLUSD_ISSUER, RLUSD_CURRENCY } from "./constants";
import type { Wallet } from "xrpl";

export async function createRLUSDTrustline(wallet: Wallet): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    console.log("Creating trustline to:", RLUSD_ISSUER, "for currency:", RLUSD_CURRENCY);
    console.log("Wallet address:", wallet.classicAddress);

    const trustSet: TrustSet = {
      TransactionType: "TrustSet",
      Account: wallet.classicAddress,
      LimitAmount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: "1000000000",
      },
    };

    console.log("Preparing transaction...");
    const prepared = await client.autofill(trustSet);
    console.log("Prepared tx:", JSON.stringify(prepared, null, 2));
    
    const signed = wallet.sign(prepared);
    console.log("Submitting transaction...");
    
    const result = await client.submitAndWait(signed.tx_blob);
    console.log("Transaction result:", JSON.stringify(result.result, null, 2));

    const txResult = result.result as { meta?: { TransactionResult?: string }; hash?: string };

    if (txResult.meta?.TransactionResult === "tesSUCCESS") {
      return {
        success: true,
        hash: txResult.hash,
      };
    }

    const errorCode = txResult.meta?.TransactionResult || "Unknown error";
    console.error("Trustline failed with:", errorCode);
    
    // Provide helpful error messages
    let errorMessage = errorCode;
    if (errorCode === "tecNO_DST") {
      errorMessage = "RLUSD issuer account not found on testnet. The issuer may not exist.";
    } else if (errorCode === "tecNO_LINE_INSUF_RESERVE") {
      errorMessage = "Insufficient XRP reserve. You need more XRP.";
    } else if (errorCode === "tecUNFUNDED") {
      errorMessage = "Account not funded. Please fund your wallet first.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error("Trustline error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create trustline",
    };
  }
}

export async function checkTrustlineExists(address: string): Promise<boolean> {
  try {
    const client = await getClient();

    const response = await client.request({
      command: "account_lines",
      account: address,
      peer: RLUSD_ISSUER,
    });

    interface TrustLine {
      currency: string;
    }

    // Check for both hex and readable currency formats
    return response.result.lines.some(
      (line: TrustLine) => line.currency === RLUSD_CURRENCY || line.currency === "RLUSD"
    );
  } catch {
    return false;
  }
}
