import { Payment, Wallet, xrpToDrops } from "xrpl";
import { getClient } from "./client";
import { RLUSD_ISSUER, RLUSD_CURRENCY } from "./constants";

export interface SendPaymentParams {
    wallet: Wallet;
    destination: string;
    amount: string; // RLUSD amount
    memo?: string;
}

export interface PaymentResult {
    success: boolean;
    hash?: string;
    error?: string;
}

export async function sendRLUSDPayment({
    wallet,
    destination,
    amount,
    memo,
}: SendPaymentParams): Promise<PaymentResult> {
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

        // Add memo if provided
        if (memo) {
            payment.Memos = [
                {
                    Memo: {
                        MemoType: Buffer.from("gift_message", "utf8")
                            .toString("hex")
                            .toUpperCase(),
                        MemoData: Buffer.from(memo, "utf8").toString("hex").toUpperCase(),
                    },
                },
            ];
        }

        const prepared = await client.autofill(payment);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        const meta = result.result.meta;
        const txResult = typeof meta === "object" && meta !== null && "TransactionResult" in meta
            ? (meta as { TransactionResult: string }).TransactionResult
            : "";

        if (txResult === "tesSUCCESS") {
            return {
                success: true,
                hash: result.result.hash,
            };
        } else {
            return {
                success: false,
                error: `Transaction failed: ${txResult}`,
            };
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to send payment";
        return {
            success: false,
            error: message,
        };
    }
}

export async function sendXRPPayment(
    wallet: Wallet,
    destination: string,
    amount: string // XRP amount
): Promise<PaymentResult> {
    try {
        const client = await getClient();

        const payment: Payment = {
            TransactionType: "Payment",
            Account: wallet.classicAddress,
            Destination: destination,
            Amount: xrpToDrops(amount),
        };

        const prepared = await client.autofill(payment);
        const signed = wallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        const meta = result.result.meta;
        const txResult = typeof meta === "object" && meta !== null && "TransactionResult" in meta
            ? (meta as { TransactionResult: string }).TransactionResult
            : "";

        if (txResult === "tesSUCCESS") {
            return {
                success: true,
                hash: result.result.hash,
            };
        } else {
            return {
                success: false,
                error: `Transaction failed: ${txResult}`,
            };
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to send XRP";
        return {
            success: false,
            error: message,
        };
    }
}
