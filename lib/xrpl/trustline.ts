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

    // First try with peer filter
    const response = await client.request({
      command: "account_lines",
      account: address,
      peer: RLUSD_ISSUER,
    });

    console.log("Trustline check for", address);
    console.log("Looking for issuer:", RLUSD_ISSUER);
    console.log("Looking for currency:", RLUSD_CURRENCY);
    console.log("Found lines:", JSON.stringify(response.result.lines, null, 2));

    interface TrustLine {
      currency: string;
      account: string;
    }

    // Check for both hex and readable currency formats
    const found = response.result.lines.some(
      (line: TrustLine) => {
        const currencyMatch = line.currency === RLUSD_CURRENCY || line.currency === "RLUSD";
        console.log("Line:", line.currency, "matches:", currencyMatch);
        return currencyMatch;
      }
    );

    if (found) {
      console.log("Trustline found!");
      return true;
    }

    // If not found with peer filter, check all lines
    const allLines = await client.request({
      command: "account_lines",
      account: address,
    });

    console.log("All trustlines:", JSON.stringify(allLines.result.lines, null, 2));

    // Check if any line matches our currency
    const foundInAll = allLines.result.lines.some(
      (line: TrustLine) => {
        const currencyMatch = line.currency === RLUSD_CURRENCY || line.currency === "RLUSD";
        if (currencyMatch) {
          console.log("Found RLUSD trustline to issuer:", line.account);
        }
        return currencyMatch;
      }
    );

    return foundInAll;
  } catch (error) {
    console.error("Error checking trustline:", error);
    return false;
  }
}
