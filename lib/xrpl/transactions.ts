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

                // Check if current user is the creator or the recipient
                const isCreator = txObj.Account === address;
                
                // Only show "escrow_created" for the creator (sender)
                // Recipients will see it when they claim (EscrowFinish)
                if (isCreator) {
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
                // Skip for recipients - they'll see the escrow in their escrow list
            }
            // Handle EscrowFinish transactions
            else if (txObj.TransactionType === "EscrowFinish") {
                // Try to get amount from AffectedNodes in meta
                let amountValue = "0";
                if (typeof meta === "object" && meta !== null && "AffectedNodes" in meta) {
                    const affectedNodes = (meta as unknown as { AffectedNodes?: Array<Record<string, unknown>> }).AffectedNodes;
                    if (affectedNodes) {
                        // Look for DeletedNode of type Escrow to get the amount
                        for (const node of affectedNodes) {
                            if ("DeletedNode" in node) {
                                const deletedNode = node.DeletedNode as { 
                                    LedgerEntryType?: string; 
                                    FinalFields?: { Amount?: string; Destination?: string } 
                                };
                                if (deletedNode.LedgerEntryType === "Escrow" && deletedNode.FinalFields?.Amount) {
                                    amountValue = (parseInt(deletedNode.FinalFields.Amount) / 1000000).toString();
                                    break;
                                }
                            }
                        }
                    }
                }

                // Owner is who created the escrow (sender of funds)
                // Account is who submitted the finish transaction
                // Destination (from escrow object) is who receives the funds
                const isOwner = txObj.Owner === address;
                
                // Get the destination from the deleted escrow node
                let escrowDestination = "";
                if (typeof meta === "object" && meta !== null && "AffectedNodes" in meta) {
                    const affectedNodes = (meta as unknown as { AffectedNodes?: Array<Record<string, unknown>> }).AffectedNodes;
                    if (affectedNodes) {
                        for (const node of affectedNodes) {
                            if ("DeletedNode" in node) {
                                const deletedNode = node.DeletedNode as { 
                                    LedgerEntryType?: string; 
                                    FinalFields?: { Destination?: string } 
                                };
                                if (deletedNode.LedgerEntryType === "Escrow" && deletedNode.FinalFields?.Destination) {
                                    escrowDestination = deletedNode.FinalFields.Destination;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                const isRecipient = escrowDestination === address;

                // Only show for the recipient (who received funds)
                // Owner already saw "escrow_created" when they sent it - no need to duplicate
                if (isRecipient) {
                    transactions.push({
                        hash: txObj.hash || "",
                        type: "escrow_finished",
                        amount: amountValue,
                        currency: "XRP",
                        counterparty: txObj.Owner || "",
                        timestamp: txObj.date ? (txObj.date + 946684800) * 1000 : Date.now(),
                        success: txResult === "tesSUCCESS",
                    });
                }
                // Skip for owner - they already saw "escrow_created"
            }
            // Handle EscrowCancel transactions
            else if (txObj.TransactionType === "EscrowCancel") {
                // Only show for the owner (who gets funds back)
                const isOwner = txObj.Owner === address;
                
                if (isOwner) {
                    // Try to get amount from AffectedNodes in meta (deleted escrow)
                    let amountValue = "0";
                    if (typeof meta === "object" && meta !== null && "AffectedNodes" in meta) {
                        const affectedNodes = (meta as unknown as { AffectedNodes?: Array<Record<string, unknown>> }).AffectedNodes;
                        if (affectedNodes) {
                            for (const node of affectedNodes) {
                                if ("DeletedNode" in node) {
                                    const deletedNode = node.DeletedNode as { 
                                        LedgerEntryType?: string; 
                                        FinalFields?: { Amount?: string; Destination?: string } 
                                    };
                                    if (deletedNode.LedgerEntryType === "Escrow" && deletedNode.FinalFields?.Amount) {
                                        amountValue = (parseInt(deletedNode.FinalFields.Amount) / 1000000).toString();
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    transactions.push({
                        hash: txObj.hash || "",
                        type: "escrow_cancelled",
                        amount: amountValue,
                        currency: "XRP",
                        counterparty: "Self",
                        timestamp: txObj.date ? (txObj.date + 946684800) * 1000 : Date.now(),
                        success: txResult === "tesSUCCESS",
                    });
                }
                // Skip for non-owners - they don't need to see cancelled escrows they didn't create
            }
        }

        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
        return [];
    }
}
