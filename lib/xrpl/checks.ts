import { CheckCreate, CheckCash } from "xrpl";
import { getClient } from "./client";
import { RLUSD_ISSUER, RLUSD_CURRENCY } from "./constants";
import type { Wallet } from "xrpl";

export interface CreateCheckParams {
  wallet: Wallet;
  destination: string;
  amount: string;
  memo?: string;
}

export interface CheckInfo {
  index: string;
  sender: string;
  destination: string;
  amount: string;
  currency: string;
  memo?: string;
  expiration?: number;
  sequence: number;
}

export async function createRLUSDCheck({
  wallet,
  destination,
  amount,
  memo,
}: CreateCheckParams): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    const checkCreate: CheckCreate = {
      TransactionType: "CheckCreate",
      Account: wallet.classicAddress,
      Destination: destination,
      SendMax: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: amount,
      },
    };

    if (memo) {
      checkCreate.Memos = [
        {
          Memo: {
            MemoType: Buffer.from("gift_message", "utf8").toString("hex").toUpperCase(),
            MemoData: Buffer.from(memo, "utf8").toString("hex").toUpperCase(),
          },
        },
      ];
    }

    const prepared = await client.autofill(checkCreate);
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
      error: txResult.meta?.TransactionResult || "Check creation failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create check",
    };
  }
}

export async function getIncomingChecks(address: string): Promise<CheckInfo[]> {
  try {
    const client = await getClient();

    const response = await client.request({
      command: "account_objects",
      account: address,
      type: "check",
    });

    const checks: CheckInfo[] = [];
    
    for (const obj of response.result.account_objects) {
      // Type guard to check if this is a Check object
      if (obj.LedgerEntryType !== "Check") continue;
      
      const checkObj = obj as {
        LedgerEntryType: string;
        Destination: string;
        Account: string;
        SendMax: string | { currency: string; value: string; issuer: string };
        index: string;
        Expiration?: number;
        Sequence: number;
      };
      
      if (checkObj.Destination !== address) continue;
      
      const sendMax = checkObj.SendMax;
      const isRLUSD = typeof sendMax === "object" && sendMax.currency === RLUSD_CURRENCY;

      checks.push({
        index: checkObj.index,
        sender: checkObj.Account,
        destination: checkObj.Destination,
        amount: typeof sendMax === "object" ? sendMax.value : "0",
        currency: isRLUSD ? "RLUSD" : "XRP",
        expiration: checkObj.Expiration,
        sequence: checkObj.Sequence,
      });
    }

    return checks;
  } catch (error) {
    console.error("Error fetching checks:", error);
    return [];
  }
}

export async function cashCheck(
  wallet: Wallet,
  checkId: string,
  amount: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    const checkCash: CheckCash = {
      TransactionType: "CheckCash",
      Account: wallet.classicAddress,
      CheckID: checkId,
      Amount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: amount,
      },
    };

    const prepared = await client.autofill(checkCash);
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
      error: txResult.meta?.TransactionResult || "Check cash failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cash check",
    };
  }
}
