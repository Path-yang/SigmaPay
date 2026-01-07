import { getClient } from "./client";
import { RLUSD_CURRENCY, RLUSD_ISSUER } from "./constants";

export interface Transaction {
    hash: string;
    type: "sent" | "received";
    amount: string;
    currency: string;
    counterparty: string;
    memo?: string;
    timestamp: number;
    success: boolean;
}

export async function getTransactionHistory(address: string): Promise<Transaction[]> {
    try {
        const client = await getClient();

        const response = await client.request({
            command: "account_tx",
            account: address,
            limit: 50,
        });

        const transactions: Transaction[] = [];

        for (const tx of response.result.transactions) {
            const transaction = tx.tx;
            if (!transaction || typeof transaction !== 'object') continue;

            // Type guard for transaction object
            const txObj = transaction as {
                TransactionType?: string;
                Account?: string;
                Destination?: string;
                Amount?: string | { value: string; currency: string; issuer: string };
                hash?: string;
                date?: number;
                Memos?: Array<{ Memo: { MemoData?: string } }>;
            };

            // Only process Payment transactions
            if (txObj.TransactionType !== "Payment") continue;

            const isSent = txObj.Account === address;
            const amount = txObj.Amount;

            let amountValue = "0";
            let currency = "XRP";

            if (typeof amount === "string") {
                // XRP amount in drops
                amountValue = (parseInt(amount) / 1000000).toString();
                currency = "XRP";
            } else if (amount && typeof amount === "object") {
                amountValue = amount.value;
                currency = amount.currency;
                // Only include RLUSD transactions or XRP (check both hex and readable formats)
                if (currency !== RLUSD_CURRENCY && currency !== "RLUSD" && currency !== "XRP") continue;
                // Normalize currency name for display
                if (currency === RLUSD_CURRENCY) currency = "RLUSD";
            }

            // Extract memo
            let memo: string | undefined;
            if (txObj.Memos && txObj.Memos[0]?.Memo?.MemoData) {
                try {
                    memo = Buffer.from(txObj.Memos[0].Memo.MemoData, "hex").toString("utf8");
                } catch {
                    // Ignore memo decode errors
                }
            }

            const meta = tx.meta;
            const txResult = typeof meta === "object" && meta !== null && "TransactionResult" in meta
                ? (meta as { TransactionResult: string }).TransactionResult
                : "";

            transactions.push({
                hash: txObj.hash || "",
                type: isSent ? "sent" : "received",
                amount: amountValue,
                currency,
                counterparty: isSent ? (txObj.Destination || "") : (txObj.Account || ""),
                memo,
                timestamp: txObj.date ? (txObj.date + 946684800) * 1000 : Date.now(), // Ripple epoch to JS timestamp
                success: txResult === "tesSUCCESS",
            });
        }

        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
        return [];
    }
}
