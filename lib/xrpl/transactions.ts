import { getClient } from "./client";
import { RLUSD_CURRENCY, RLUSD_ISSUER } from "./constants";

export interface Transaction {
    hash: string;
    type: "sent" | "received" | "escrow_created" | "escrow_finished" | "escrow_cancelled";
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
                Owner?: string;
                Amount?: string | { value: string; currency: string; issuer: string };
                hash?: string;
                date?: number;
                Memos?: Array<{ Memo: { MemoData?: string } }>;
            };

            const meta = tx.meta;
            const txResult = typeof meta === "object" && meta !== null && "TransactionResult" in meta
                ? (meta as { TransactionResult: string }).TransactionResult
                : "";

            // Handle Payment transactions
            if (txObj.TransactionType === "Payment") {
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

                transactions.push({
                    hash: txObj.hash || "",
                    type: isSent ? "sent" : "received",
                    amount: amountValue,
                    currency: currency,
                    counterparty: isSent ? (txObj.Destination || "") : (txObj.Account || ""),
                    memo,
                    timestamp: txObj.date ? (txObj.date + 946684800) * 1000 : Date.now(),
                    success: txResult === "tesSUCCESS",
                });
            }
            // Handle EscrowCreate transactions
            else if (txObj.TransactionType === "EscrowCreate") {
                const amount = txObj.Amount;
                let amountValue = "0";
                if (typeof amount === "string") {
                    amountValue = (parseInt(amount) / 1000000).toString();
                }

                transactions.push({
                    hash: txObj.hash || "",
                    type: "escrow_created",
                    amount: amountValue,
                    currency: "XRP",
                    counterparty: txObj.Destination || "",
                    timestamp: txObj.date ? (txObj.date + 946684800) * 1000 : Date.now(),
                    success: txResult === "tesSUCCESS",
                });
            }
            // Handle EscrowFinish transactions
            else if (txObj.TransactionType === "EscrowFinish") {
                // Get amount from meta (the actual transferred amount)
                let amountValue = "0";
                if (typeof meta === "object" && meta !== null && "delivered_amount" in meta) {
                    const delivered = (meta as { delivered_amount?: string }).delivered_amount;
                    if (typeof delivered === "string") {
                        amountValue = (parseInt(delivered) / 1000000).toString();
                    }
                }

                // Determine if we're the one who received the funds or the owner who sent them
                const isOwner = txObj.Owner === address;

                transactions.push({
                    hash: txObj.hash || "",
                    type: "escrow_finished",
                    amount: amountValue,
                    currency: "XRP",
                    counterparty: isOwner ? (txObj.Account || "") : (txObj.Owner || ""),
                    timestamp: txObj.date ? (txObj.date + 946684800) * 1000 : Date.now(),
                    success: txResult === "tesSUCCESS",
                });
            }
            // Handle EscrowCancel transactions
            else if (txObj.TransactionType === "EscrowCancel") {
                transactions.push({
                    hash: txObj.hash || "",
                    type: "escrow_cancelled",
                    amount: "0", // Amount is returned to owner, we'd need to look up the escrow
                    currency: "XRP",
                    counterparty: txObj.Owner || txObj.Account || "",
                    timestamp: txObj.date ? (txObj.date + 946684800) * 1000 : Date.now(),
                    success: txResult === "tesSUCCESS",
                });
            }
        }

        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
        return [];
    }
}
