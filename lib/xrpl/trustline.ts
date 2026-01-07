import { TrustSet } from "xrpl";
import { getClient } from "./client";
import { RLUSD_ISSUER, RLUSD_CURRENCY } from "./constants";
import type { Wallet } from "xrpl";

export async function createRLUSDTrustline(wallet: Wallet): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    const trustSet: TrustSet = {
      TransactionType: "TrustSet",
      Account: wallet.classicAddress,
      LimitAmount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: "1000000000",
      },
    };

    const prepared = await client.autofill(trustSet);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result as { meta?: { TransactionResult?: string }; hash?: string };

    if (txResult.meta?.TransactionResult === "tesSUCCESS") {
      return {
        success: true,
        hash: txResult.hash,
      };
    }

    return {
      success: false,
      error: txResult.meta?.TransactionResult || "Trustline creation failed",
    };
  } catch (error) {
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

    return response.result.lines.some(
      (line: TrustLine) => line.currency === RLUSD_CURRENCY
    );
  } catch {
    return false;
  }
}
