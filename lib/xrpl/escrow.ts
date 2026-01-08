/**
 * XRPL Escrow Management
 * 
 * Escrow allows time-locked and/or condition-locked XRP payments.
 * - Time-based: Funds release after a specific date/time
 * - Condition-based: Funds release when a secret code (fulfillment) is provided
 * - Combined: Both time AND condition must be met
 * 
 * Use cases:
 * - Conditional payments (pay when goods received)
 * - Scheduled payments (birthday gifts)
 * - Buyer/seller protection
 */

import { EscrowCreate, EscrowFinish, EscrowCancel, xrpToDrops, dropsToXrp, Client } from "xrpl";
import { getClient } from "./client";
import type { Wallet } from "xrpl";
import CryptoJS from "crypto-js";

// Ripple Epoch: seconds between Unix epoch (1970) and Ripple epoch (2000)
export const RIPPLE_EPOCH = 946684800;

// Escrow status types
export type EscrowStatus = "pending" | "claimable" | "cancellable" | "completed" | "cancelled";

// Escrow release type
export type EscrowReleaseType = "time" | "condition" | "both";

// Parameters for creating an escrow
export interface CreateEscrowParams {
  destination: string;
  amount: string; // XRP amount
  releaseType: EscrowReleaseType;
  finishAfter?: Date; // When escrow can be finished (time-based)
  cancelAfter?: Date; // When escrow can be cancelled
  memo?: string;
}

// Result of creating an escrow
export interface CreateEscrowResult {
  success: boolean;
  hash?: string;
  sequence?: number;
  condition?: string; // Hex-encoded condition (for condition-based)
  fulfillment?: string; // Secret code to release (SAVE THIS!)
  error?: string;
}

// Escrow information from the ledger
export interface EscrowInfo {
  index: string; // Ledger object index
  owner: string;
  destination: string;
  amount: string; // XRP
  sequence: number;
  finishAfter?: number; // Unix timestamp
  cancelAfter?: number; // Unix timestamp
  condition?: string;
  status: EscrowStatus;
  createdAt?: number;
}

// Parameters for finishing an escrow
export interface FinishEscrowParams {
  owner: string;
  sequence: number;
  condition?: string;
  fulfillment?: string;
}

// Parameters for cancelling an escrow
export interface CancelEscrowParams {
  owner: string;
  sequence: number;
}

/**
 * Convert Unix timestamp to Ripple time
 */
export function toRippleTime(unixSeconds: number): number {
  return unixSeconds - RIPPLE_EPOCH;
}

/**
 * Convert Ripple time to Unix timestamp
 */
export function fromRippleTime(rippleSeconds: number): number {
  return rippleSeconds + RIPPLE_EPOCH;
}

/**
 * Generate a crypto-condition and fulfillment for condition-based escrows
 * Uses PREIMAGE-SHA-256 crypto-condition
 * 
 * The condition is stored on-chain, the fulfillment is the secret that releases funds
 * 
 * Format based on RFC 5769 (Crypto-Conditions):
 * - Condition: A0258020{fingerprint}810100 where fingerprint = SHA256(preimage)
 * - Fulfillment: A0228020{preimage}
 */
export function generateEscrowCondition(): { condition: string; fulfillment: string } {
  // Generate 32 random bytes for the preimage
  const preimage = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(preimage);
  } else {
    // Fallback for SSR (not cryptographically secure, but works for testing)
    for (let i = 0; i < 32; i++) {
      preimage[i] = Math.floor(Math.random() * 256);
    }
  }

  // Convert preimage to hex
  const preimageHex = Array.from(preimage)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // Hash the preimage using CryptoJS
  const wordArray = CryptoJS.enc.Hex.parse(preimageHex);
  const hash = CryptoJS.SHA256(wordArray);
  const hashHex = hash.toString(CryptoJS.enc.Hex);

  // Build condition: A0258020 + hash + 810120
  // A0 = CHOICE tag for type 0 (PREIMAGE-SHA-256)
  // 25 = length (37 bytes)
  // 80 = context tag 0 (fingerprint)
  // 20 = length 32 bytes
  // [32 bytes fingerprint = SHA256 hash]
  // 81 = context tag 1 (cost/fulfillment length)
  // 01 = length 1 byte
  // 20 = cost value 32 (0x20 = length of preimage in bytes)
  const condition = ("A0258020" + hashHex + "810120").toUpperCase();

  // Build fulfillment: A0228020 + preimage
  // A0 = CHOICE tag for type 0 (PREIMAGE-SHA-256)
  // 22 = length (34 bytes)
  // 80 = context tag 0 (preimage)
  // 20 = length 32 bytes
  // [32 bytes preimage]
  const fulfillment = ("A0228020" + preimageHex).toUpperCase();

  return { condition, fulfillment };
}

/**
 * Create an escrow on the XRP Ledger
 */
export async function createEscrow(
  wallet: Wallet,
  params: CreateEscrowParams
): Promise<CreateEscrowResult> {
  try {
    const client = await getClient();
    
    // Validate parameters
    if (!params.destination || !params.amount) {
      return { success: false, error: "Destination and amount are required" };
    }

    const amountDrops = xrpToDrops(params.amount);
    
    // Build the escrow create transaction
    const escrowCreate: EscrowCreate = {
      TransactionType: "EscrowCreate",
      Account: wallet.classicAddress,
      Destination: params.destination,
      Amount: amountDrops,
    };

    let condition: string | undefined;
    let fulfillment: string | undefined;

    // Handle release type
    if (params.releaseType === "time" || params.releaseType === "both") {
      if (!params.finishAfter) {
        return { success: false, error: "Release date is required for time-based escrow" };
      }
      escrowCreate.FinishAfter = toRippleTime(Math.floor(params.finishAfter.getTime() / 1000));
    }

    if (params.releaseType === "condition" || params.releaseType === "both") {
      // Generate crypto-condition
      try {
        const conditionData = generateEscrowCondition();
        condition = conditionData.condition;
        fulfillment = conditionData.fulfillment;
        escrowCreate.Condition = condition;
        
        if (!condition || !fulfillment) {
          return { success: false, error: "Failed to generate escrow condition" };
        }
      } catch (err) {
        return { success: false, error: "Failed to generate escrow condition: " + (err instanceof Error ? err.message : String(err)) };
      }
    }

    // Set cancel time (default to 30 days after finish time, or 30 days from now)
    if (params.cancelAfter) {
      escrowCreate.CancelAfter = toRippleTime(Math.floor(params.cancelAfter.getTime() / 1000));
    } else if (params.finishAfter) {
      // Default: can cancel 7 days after finish time
      const cancelTime = new Date(params.finishAfter.getTime() + 7 * 24 * 60 * 60 * 1000);
      escrowCreate.CancelAfter = toRippleTime(Math.floor(cancelTime.getTime() / 1000));
    } else {
      // Condition-only: can cancel after 30 days
      const cancelTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      escrowCreate.CancelAfter = toRippleTime(Math.floor(cancelTime.getTime() / 1000));
    }

    // Add memo if provided
    if (params.memo) {
      escrowCreate.Memos = [
        {
          Memo: {
            MemoType: Buffer.from("escrow_memo", "utf8").toString("hex").toUpperCase(),
            MemoData: Buffer.from(params.memo, "utf8").toString("hex").toUpperCase(),
          },
        },
      ];
    }

    // Submit transaction
    const prepared = await client.autofill(escrowCreate);
    
    // Increase timeout
    if (prepared.LastLedgerSequence) {
      prepared.LastLedgerSequence = prepared.LastLedgerSequence + 20;
    }

    const signed = wallet.sign(prepared);
    
    // Add timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Transaction timed out after 60 seconds")), 60000);
    });

    const result = await Promise.race([
      client.submitAndWait(signed.tx_blob),
      timeoutPromise,
    ]);

    const txResult = result.result as {
      meta?: { TransactionResult?: string };
      hash?: string;
      Sequence?: number;
    };

    if (txResult.meta?.TransactionResult === "tesSUCCESS") {
      return {
        success: true,
        hash: txResult.hash,
        sequence: prepared.Sequence,
        condition,
        fulfillment,
      };
    }

    return {
      success: false,
      error: txResult.meta?.TransactionResult || "Failed to create escrow",
    };
  } catch (error) {
    console.error("Error creating escrow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create escrow",
    };
  }
}

/**
 * Finish (claim) an escrow
 */
export async function finishEscrow(
  wallet: Wallet,
  params: FinishEscrowParams
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    // Find the correct escrow on-chain by matching the condition
    // This ensures we use the right sequence even if there are multiple escrows
    let correctSequence = params.sequence;
    
    if (params.condition) {
      try {
        const escrowObjects = await client.request({
          command: "account_objects",
          account: params.owner,
          type: "escrow",
        });
        
        for (const obj of escrowObjects.result.account_objects) {
          if (obj.LedgerEntryType === "Escrow") {
            const escrowObj = obj as { Condition?: string; PreviousTxnID?: string; Amount?: string; Destination?: string };
            const conditionsMatch = escrowObj.Condition === params.condition;
            
            // If conditions match, look up the correct sequence from this escrow's transaction
            if (conditionsMatch && escrowObj.PreviousTxnID) {
              const txResponse = await client.request({
                command: "tx",
                transaction: escrowObj.PreviousTxnID,
              });
              const txSeq = (txResponse.result as { Sequence?: number }).Sequence;
              if (txSeq) {
                correctSequence = txSeq;
              }
            }
          }
        }
      } catch {
        // Silently continue with original sequence if verification fails
      }
    }

    const escrowFinish: EscrowFinish = {
      TransactionType: "EscrowFinish",
      Account: wallet.classicAddress,
      Owner: params.owner,
      OfferSequence: correctSequence,
    };

    // Add condition and fulfillment if provided
    if (params.condition && params.fulfillment) {
      escrowFinish.Condition = params.condition;
      escrowFinish.Fulfillment = params.fulfillment;
    }

    const prepared = await client.autofill(escrowFinish);
    
    // Escrow finish with fulfillment needs more fee
    if (params.fulfillment) {
      // Fulfillment increases transaction cost
      const baseFee = parseInt(prepared.Fee || "12");
      prepared.Fee = String(Math.max(baseFee, 330)); // Minimum for escrow with fulfillment
    }

    if (prepared.LastLedgerSequence) {
      prepared.LastLedgerSequence = prepared.LastLedgerSequence + 20;
    }

    const signed = wallet.sign(prepared);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Transaction timed out after 60 seconds")), 60000);
    });

    const result = await Promise.race([
      client.submitAndWait(signed.tx_blob),
      timeoutPromise,
    ]);

    const txResult = result.result as {
      meta?: { TransactionResult?: string };
      hash?: string;
    };

    if (txResult.meta?.TransactionResult === "tesSUCCESS") {
      return { success: true, hash: txResult.hash };
    }

    // Provide user-friendly error messages
    let errorMsg = txResult.meta?.TransactionResult || "Failed to finish escrow";
    if (errorMsg === "tecNO_TARGET") {
      errorMsg = "Escrow not found. It may have already been claimed or cancelled.";
    } else if (errorMsg === "tecNO_PERMISSION") {
      errorMsg = "Cannot claim yet. The release time has not been reached.";
    } else if (errorMsg === "tecCRYPTOCONDITION_ERROR") {
      errorMsg = "Invalid secret code. Please check and try again.";
    }

    return { success: false, error: errorMsg };
  } catch (error) {
    console.error("Error finishing escrow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to finish escrow",
    };
  }
}

/**
 * Cancel an escrow (only after CancelAfter time)
 */
export async function cancelEscrow(
  wallet: Wallet,
  params: CancelEscrowParams
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    const escrowCancel: EscrowCancel = {
      TransactionType: "EscrowCancel",
      Account: wallet.classicAddress,
      Owner: params.owner,
      OfferSequence: params.sequence,
    };

    const prepared = await client.autofill(escrowCancel);
    
    if (prepared.LastLedgerSequence) {
      prepared.LastLedgerSequence = prepared.LastLedgerSequence + 20;
    }

    const signed = wallet.sign(prepared);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Transaction timed out after 60 seconds")), 60000);
    });

    const result = await Promise.race([
      client.submitAndWait(signed.tx_blob),
      timeoutPromise,
    ]);

    const txResult = result.result as {
      meta?: { TransactionResult?: string };
      hash?: string;
    };

    if (txResult.meta?.TransactionResult === "tesSUCCESS") {
      return { success: true, hash: txResult.hash };
    }

    let errorMsg = txResult.meta?.TransactionResult || "Failed to cancel escrow";
    if (errorMsg === "tecNO_TARGET") {
      errorMsg = "Escrow not found. It may have already been claimed or cancelled.";
    } else if (errorMsg === "tecNO_PERMISSION") {
      errorMsg = "Cannot cancel yet. The cancel time has not been reached.";
    }

    return { success: false, error: errorMsg };
  } catch (error) {
    console.error("Error cancelling escrow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel escrow",
    };
  }
}

/**
 * Get all escrows for an address (both as owner and destination)
 */
export async function getEscrowsForAddress(address: string): Promise<{
  sent: EscrowInfo[];
  received: EscrowInfo[];
}> {
  try {
    const client = await getClient();

    // Get escrows associated with this address
    // Note: account_objects returns escrows where address is EITHER owner OR destination
    // (if DestinationNode is set on the escrow)
    const response = await client.request({
      command: "account_objects",
      account: address,
      type: "escrow",
    });

    const sent: EscrowInfo[] = [];
    const received: EscrowInfo[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const obj of response.result.account_objects) {
      if (obj.LedgerEntryType !== "Escrow") continue;

      const escrowObj = obj as {
        LedgerEntryType: string;
        Account: string;
        Destination: string;
        Amount: string;
        Condition?: string;
        FinishAfter?: number;
        CancelAfter?: number;
        PreviousTxnID?: string;
        PreviousTxnLgrSeq?: number;
        index: string;
        OwnerNode?: string;
        DestinationNode?: string;
      };

      // Get the actual sequence number from the original transaction
      let sequence = 0;
      if (escrowObj.PreviousTxnID) {
        const txSequence = await getSequenceFromTxHash(client, escrowObj.PreviousTxnID);
        if (txSequence !== null) {
          sequence = txSequence;
        }
      }

      // Skip if we couldn't get the sequence
      if (sequence === 0) {
        console.error("Could not determine sequence for escrow:", escrowObj.index);
        continue;
      }

      const finishAfter = escrowObj.FinishAfter 
        ? fromRippleTime(escrowObj.FinishAfter) 
        : undefined;
      const cancelAfter = escrowObj.CancelAfter 
        ? fromRippleTime(escrowObj.CancelAfter) 
        : undefined;

      // Determine status
      let status: EscrowStatus = "pending";
      if (cancelAfter && now >= cancelAfter) {
        status = "cancellable";
      } else if (finishAfter && now >= finishAfter) {
        status = "claimable";
      } else if (!finishAfter && escrowObj.Condition) {
        // Condition-only escrow is always claimable if you have the fulfillment
        status = "claimable";
      }

      const escrowInfo: EscrowInfo = {
        index: escrowObj.index,
        owner: escrowObj.Account,
        destination: escrowObj.Destination,
        amount: String(dropsToXrp(escrowObj.Amount)),
        sequence,
        finishAfter,
        cancelAfter,
        condition: escrowObj.Condition,
        status,
      };

      // Categorize based on whether this address is the owner or destination
      if (escrowObj.Account === address) {
        // This address is the owner (sender)
        sent.push(escrowInfo);
      } else if (escrowObj.Destination === address) {
        // This address is the destination (recipient)
        received.push(escrowInfo);
      }
    }

    return { sent, received };
  } catch (error) {
    console.error("Error fetching escrows:", error);
    return { sent: [], received: [] };
  }
}

/**
 * Get a specific escrow by owner and sequence
 */
export async function getEscrowBySequence(
  owner: string,
  sequence: number
): Promise<EscrowInfo | null> {
  try {
    const client = await getClient();

    // Get all escrows for the owner and find the matching one
    const response = await client.request({
      command: "account_objects",
      account: owner,
      type: "escrow",
    });

    for (const obj of response.result.account_objects) {
      if (obj.LedgerEntryType !== "Escrow") continue;

      const escrowObj = obj as {
        LedgerEntryType: string;
        Account: string;
        Destination: string;
        Amount: string;
        Condition?: string;
        FinishAfter?: number;
        CancelAfter?: number;
        PreviousTxnID?: string;
        index: string;
      };

      // Get the actual sequence number from the original transaction
      let objSequence = 0;
      if (escrowObj.PreviousTxnID) {
        const txSequence = await getSequenceFromTxHash(client, escrowObj.PreviousTxnID);
        if (txSequence !== null) {
          objSequence = txSequence;
        }
      }
      
      if (objSequence === sequence) {
        const now = Math.floor(Date.now() / 1000);
        const finishAfter = escrowObj.FinishAfter 
          ? fromRippleTime(escrowObj.FinishAfter) 
          : undefined;
        const cancelAfter = escrowObj.CancelAfter 
          ? fromRippleTime(escrowObj.CancelAfter) 
          : undefined;

        let status: EscrowStatus = "pending";
        if (cancelAfter && now >= cancelAfter) {
          status = "cancellable";
        } else if (finishAfter && now >= finishAfter) {
          status = "claimable";
        } else if (!finishAfter && escrowObj.Condition) {
          status = "claimable";
        }

        return {
          index: escrowObj.index,
          owner: escrowObj.Account,
          destination: escrowObj.Destination,
          amount: String(dropsToXrp(escrowObj.Amount)),
          sequence: objSequence,
          finishAfter,
          cancelAfter,
          condition: escrowObj.Condition,
          status,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching escrow:", error);
    return null;
  }
}

/**
 * Get the sequence number from a transaction hash
 * XRPL escrow objects don't store the sequence, so we need to look it up
 */
async function getSequenceFromTxHash(client: Client, txHash: string): Promise<number | null> {
  try {
    const response = await client.request({
      command: "tx",
      transaction: txHash,
    });
    
    const tx = response.result as { Sequence?: number };
    return tx.Sequence || null;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
}

// Local storage for tracking escrows (stores fulfillments for senders)
const ESCROW_STORAGE_KEY = "sigmapay_escrows";

export interface StoredEscrow {
  owner: string;
  destination: string;
  sequence: number;
  amount: string;
  releaseType: EscrowReleaseType;
  finishAfter?: number;
  cancelAfter?: number;
  condition?: string;
  fulfillment?: string; // Only stored for sender
  memo?: string;
  createdAt: number;
  hash?: string;
}

/**
 * Store escrow locally for tracking
 */
export function storeEscrow(escrow: StoredEscrow): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(ESCROW_STORAGE_KEY);
  const escrows: StoredEscrow[] = stored ? JSON.parse(stored) : [];

  // Check if already exists
  const existingIndex = escrows.findIndex(
    (e) => e.owner === escrow.owner && e.sequence === escrow.sequence
  );

  if (existingIndex >= 0) {
    escrows[existingIndex] = escrow;
  } else {
    escrows.push(escrow);
  }

  localStorage.setItem(ESCROW_STORAGE_KEY, JSON.stringify(escrows));
}

/**
 * Get stored escrows for an address
 */
export function getStoredEscrows(address: string): {
  sent: StoredEscrow[];
  received: StoredEscrow[];
} {
  if (typeof window === "undefined") return { sent: [], received: [] };

  const stored = localStorage.getItem(ESCROW_STORAGE_KEY);
  if (!stored) return { sent: [], received: [] };

  const escrows: StoredEscrow[] = JSON.parse(stored);

  return {
    sent: escrows.filter((e) => e.owner === address),
    received: escrows.filter((e) => e.destination === address && e.owner !== address),
  };
}

/**
 * Remove a stored escrow (after it's finished or cancelled)
 */
export function removeStoredEscrow(owner: string, sequence: number): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(ESCROW_STORAGE_KEY);
  if (!stored) return;

  const escrows: StoredEscrow[] = JSON.parse(stored);
  const filtered = escrows.filter(
    (e) => !(e.owner === owner && e.sequence === sequence)
  );

  localStorage.setItem(ESCROW_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Format escrow status for display
 */
export function getEscrowStatusDisplay(status: EscrowStatus): {
  label: string;
  color: string;
  description: string;
} {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        color: "yellow",
        description: "Waiting for release conditions to be met",
      };
    case "claimable":
      return {
        label: "Claimable",
        color: "green",
        description: "Ready to be claimed by recipient",
      };
    case "cancellable":
      return {
        label: "Cancellable",
        color: "orange",
        description: "Can be cancelled by sender",
      };
    case "completed":
      return {
        label: "Completed",
        color: "blue",
        description: "Escrow has been claimed",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: "gray",
        description: "Escrow was cancelled",
      };
    default:
      return {
        label: "Unknown",
        color: "gray",
        description: "",
      };
  }
}
