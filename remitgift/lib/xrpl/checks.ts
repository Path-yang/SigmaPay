import { CheckCreate, CheckCash, Wallet } from "xrpl";
import { getClient } from "./client";
import { RLUSD_ISSUER, RLUSD_CURRENCY } from "./constants";

export interface CreateCheckParams {
    wallet: Wallet;
    destination: string;
    amount: string; // RLUSD amount
    memo?: string;
}

export interface CheckResult {
    success: boolean;
    hash?: string;
    error?: string;
}

export interface CheckObject {
    index: string;
    Destination: string;
    Account: string;
    SendMax: {
        currency: string;
        issuer: string;
        value: string;
    } | string;
    Memos?: Array<{
        Memo: {
            MemoType?: string;
            MemoData?: string;
        };
    }>;
}

export async function createRLUSDCheck({
    wallet,
    destination,
    amount,
    memo,
}: CreateCheckParams): Promise<CheckResult> {
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
                        MemoType: Buffer.from("gift_message", "utf8")
                            .toString("hex")
                            .toUpperCase(),
                        MemoData: Buffer.from(memo, "utf8").toString("hex").toUpperCase(),
                    },
                },
            ];
        }

        const prepared = await client.autofill(checkCreate);
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
                error: `Check creation failed: ${txResult}`,
            };
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create check";
        return {
            success: false,
            error: message,
        };
    }
}

export async function getIncomingChecks(address: string): Promise<CheckObject[]> {
    try {
        const client = await getClient();

        const response = await client.request({
            command: "account_objects",
            account: address,
            type: "check",
        });

        // Filter for checks where this address is the destination
        const checks = response.result.account_objects
            .filter((obj) =>
                obj.LedgerEntryType === "Check" &&
                "Destination" in obj &&
                (obj as unknown as CheckObject).Destination === address
            )
            .map((obj) => ({
                index: obj.index,
                Destination: (obj as unknown as CheckObject).Destination,
                Account: (obj as unknown as CheckObject).Account,
                SendMax: (obj as unknown as CheckObject).SendMax,
                Memos: (obj as unknown as CheckObject).Memos,
            }));

        return checks;
    } catch {
        return [];
    }
}

export async function getOutgoingChecks(address: string): Promise<CheckObject[]> {
    try {
        const client = await getClient();

        const response = await client.request({
            command: "account_objects",
            account: address,
            type: "check",
        });

        // Filter for checks where this address is the sender
        const checks = response.result.account_objects
            .filter((obj) =>
                obj.LedgerEntryType === "Check" &&
                "Account" in obj &&
                (obj as unknown as CheckObject).Account === address
            )
            .map((obj) => ({
                index: obj.index,
                Destination: (obj as unknown as CheckObject).Destination,
                Account: (obj as unknown as CheckObject).Account,
                SendMax: (obj as unknown as CheckObject).SendMax,
                Memos: (obj as unknown as CheckObject).Memos,
            }));

        return checks;
    } catch {
        return [];
    }
}

export async function cashCheck(
    wallet: Wallet,
    checkId: string,
    amount: string
): Promise<CheckResult> {
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
                error: `Check cashing failed: ${txResult}`,
            };
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to cash check";
        return {
            success: false,
            error: message,
        };
    }
}

// Helper to decode memo
export function decodeMemo(memoData?: string): string {
    if (!memoData) return "";
    try {
        return Buffer.from(memoData, "hex").toString("utf8");
    } catch {
        return "";
    }
}
