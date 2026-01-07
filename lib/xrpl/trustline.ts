import { TrustSet, Wallet } from "xrpl";
import { getClient } from "./client";
import { RLUSD_ISSUER, RLUSD_CURRENCY } from "./constants";

export async function createRLUSDTrustline(wallet: Wallet): Promise<{
    success: boolean;
    hash?: string;
    error?: string;
}> {
    try {
        const client = await getClient();

        const trustSet: TrustSet = {
            TransactionType: "TrustSet",
            Account: wallet.classicAddress,
            LimitAmount: {
                currency: RLUSD_CURRENCY,
                issuer: RLUSD_ISSUER,
                value: "1000000000", // 1 billion limit
            },
        };

        const prepared = await client.autofill(trustSet);
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
        const message = error instanceof Error ? error.message : "Failed to create trustline";
        return {
            success: false,
            error: message,
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

        return response.result.lines.some(
            (line) => line.currency === RLUSD_CURRENCY
        );
    } catch {
        return false;
    }
}
