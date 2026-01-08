import { Payment, xrpToDrops } from "xrpl";
import { getClient } from "./client";
import { RLUSD_ISSUER, RLUSD_CURRENCY } from "./constants";
import { canSendAmount } from "./did";
import type { Wallet } from "xrpl";

export interface SendPaymentParams {
  wallet: Wallet;
  destination: string;
  amount: string;
  memo?: string;
}

export interface PaymentResult {
  success: boolean;
  method: "direct" | "check";
  hash?: string;
  error?: string;
}

/**
 * Send XRP payment directly
 */
export async function sendXRPPayment({
  wallet,
  destination,
  amount,
  memo,
}: SendPaymentParams): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    const payment: Payment = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Destination: destination,
      Amount: xrpToDrops(amount), // Convert XRP to drops
    };

    if (memo) {
      payment.Memos = [
        {
          Memo: {
            MemoType: Buffer.from("gift_message", "utf8").toString("hex").toUpperCase(),
            MemoData: Buffer.from(memo, "utf8").toString("hex").toUpperCase(),
          },
        },
      ];
    }

    const prepared = await client.autofill(payment);
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
      error: txResult.meta?.TransactionResult || "Payment failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send payment",
    };
  }
}

/**
 * Send RLUSD payment directly
 */
export async function sendRLUSDPayment({
  wallet,
  destination,
  amount,
  memo,
}: SendPaymentParams): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    const payment: Payment = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Destination: destination,
      Amount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: amount,
      },
    };

    if (memo) {
      payment.Memos = [
        {
          Memo: {
            MemoType: Buffer.from("gift_message", "utf8").toString("hex").toUpperCase(),
            MemoData: Buffer.from(memo, "utf8").toString("hex").toUpperCase(),
          },
        },
      ];
    }

    const prepared = await client.autofill(payment);
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
      error: txResult.meta?.TransactionResult || "Payment failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send payment",
    };
  }
}

/**
 * Smart send - automatically chooses direct or check based on verification
 */
export async function smartSend({
  wallet,
  destination,
  amount,
  memo,
}: SendPaymentParams): Promise<PaymentResult> {
  const numAmount = parseFloat(amount);
  const { allowed, useCheck } = await canSendAmount(wallet.classicAddress, numAmount);

  if (!allowed) {
    return {
      success: false,
      method: "direct",
      error: "Amount exceeds your verification limit",
    };
  }

  if (useCheck) {
    // Use check creation for unverified users
    const { createRLUSDCheck } = await import("./checks");
    const result = await createRLUSDCheck({ wallet, destination, amount, memo });
    return {
      success: result.success,
      method: "check",
      hash: result.hash,
      error: result.error,
    };
  } else {
    // Direct payment for verified users
    const result = await sendRLUSDPayment({ wallet, destination, amount, memo });
    return {
      success: result.success,
      method: "direct",
      hash: result.hash,
      error: result.error,
    };
  }
}
