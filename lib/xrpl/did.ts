import { getClient } from "./client";
import { VerificationLevel } from "./constants";
import type { Wallet } from "xrpl";

// DID Document structure for SigmaPay
export interface SigmaPayDID {
  id: string;
  verificationLevel: VerificationLevel;
  createdAt: string;
  updatedAt?: string;
  name?: string;
  email?: string;
  phone?: string;
  kycCompleted?: boolean;
}

// Transaction types for DID operations
interface DIDSetTransaction {
  TransactionType: "DIDSet";
  Account: string;
  DIDDocument?: string;
  URI?: string;
  Data?: string;
}

interface DIDDeleteTransaction {
  TransactionType: "DIDDelete";
  Account: string;
}

/**
 * Create or update DID on XRPL
 * The DIDDocument field stores our verification data as hex-encoded JSON
 */
export async function createDID(
  wallet: Wallet,
  didData: Partial<SigmaPayDID>
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    console.log("Creating DID for wallet:", wallet.classicAddress);
    const client = await getClient();

    // Create DID document data
    const didDocument: SigmaPayDID = {
      id: `did:xrpl:${wallet.classicAddress}`,
      verificationLevel: didData.verificationLevel || VerificationLevel.UNVERIFIED,
      createdAt: didData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: didData.name,
      email: didData.email,
      phone: didData.phone,
      kycCompleted: didData.kycCompleted || false,
    };

    console.log("DID document:", didDocument);

    // Convert to hex for storage
    const didDocumentHex = Buffer.from(JSON.stringify(didDocument), "utf8")
      .toString("hex")
      .toUpperCase();

    // URI pointing to verification info
    const uriHex = Buffer.from(`https://sigmapay.app/did/${wallet.classicAddress}`, "utf8")
      .toString("hex")
      .toUpperCase();

    const didSet: DIDSetTransaction = {
      TransactionType: "DIDSet",
      Account: wallet.classicAddress,
      DIDDocument: didDocumentHex,
      URI: uriHex,
    };

    console.log("Preparing DIDSet transaction...");
    const prepared = await client.autofill(didSet, {
      maxLedgerVersionOffset: 75, // Increase timeout to ~5 minutes
    });
    console.log("Transaction prepared, signing...");
    const signed = wallet.sign(prepared);
    console.log("Transaction signed, submitting...");
    const result = await client.submitAndWait(signed.tx_blob, {
      autofill: false,
      failHard: false,
    });

    const txResult = result.result as { meta?: { TransactionResult?: string }; hash?: string };
    console.log("Transaction result:", txResult);

    if (txResult.meta?.TransactionResult === "tesSUCCESS") {
      console.log("DID created successfully! Hash:", txResult.hash);
      return {
        success: true,
        hash: txResult.hash,
      };
    }

    const errorMsg = txResult.meta?.TransactionResult || "Transaction failed";
    console.error("DID creation failed:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  } catch (error) {
    console.error("Error creating DID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create DID",
    };
  }
}

/**
 * Get DID data for an address
 */
export async function getDID(address: string): Promise<SigmaPayDID | null> {
  try {
    const client = await getClient();

    const response = await client.request({
      command: "account_objects",
      account: address,
      type: "did",
    });

    interface DIDObject {
      LedgerEntryType: string;
      DIDDocument?: string;
    }

    const didObject = response.result.account_objects.find(
      (obj: DIDObject) => obj.LedgerEntryType === "DID"
    ) as DIDObject | undefined;

    if (didObject && didObject.DIDDocument) {
      // Decode the DID document from hex
      const didDocString = Buffer.from(didObject.DIDDocument, "hex").toString("utf8");
      return JSON.parse(didDocString) as SigmaPayDID;
    }

    return null;
  } catch (error) {
    // Account might not have a DID yet
    console.log("No DID found for address:", address);
    return null;
  }
}

/**
 * Check verification level of an address
 */
export async function getVerificationLevel(address: string): Promise<VerificationLevel> {
  const did = await getDID(address);
  
  if (!did) {
    return VerificationLevel.UNVERIFIED;
  }
  
  return did.verificationLevel;
}

/**
 * Update verification level (simulated KYC completion)
 */
export async function updateVerificationLevel(
  wallet: Wallet,
  newLevel: VerificationLevel,
  additionalData?: { name?: string; email?: string; phone?: string }
): Promise<{ success: boolean; hash?: string; error?: string }> {
  // Get existing DID data
  const existingDID = await getDID(wallet.classicAddress);
  
  // Create updated DID
  return createDID(wallet, {
    ...existingDID,
    ...additionalData,
    verificationLevel: newLevel,
    kycCompleted: newLevel !== VerificationLevel.UNVERIFIED,
  });
}

/**
 * Delete DID
 */
export async function deleteDID(wallet: Wallet): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    const didDelete: DIDDeleteTransaction = {
      TransactionType: "DIDDelete",
      Account: wallet.classicAddress,
    };

    const prepared = await client.autofill(didDelete);
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
      error: txResult.meta?.TransactionResult || "Transaction failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete DID",
    };
  }
}

/**
 * Check if address can send a given amount
 */
export async function canSendAmount(
  address: string,
  amount: number
): Promise<{ allowed: boolean; reason?: string; limit: number; useCheck: boolean }> {
  const level = await getVerificationLevel(address);
  const limit = level === VerificationLevel.UNVERIFIED ? 100 : 
                level === VerificationLevel.BASIC ? 1000 : Infinity;

  if (amount > limit) {
    return {
      allowed: false,
      reason: `Amount exceeds your ${level} limit of $${limit === Infinity ? "unlimited" : limit}. Please verify your identity to increase limits.`,
      limit,
      useCheck: true,
    };
  }

  // Unverified users must use checks regardless of amount
  if (level === VerificationLevel.UNVERIFIED) {
    return {
      allowed: true,
      reason: "Unverified users send via claimable checks. Verify to enable instant transfers.",
      limit,
      useCheck: true,
    };
  }

  return { allowed: true, limit, useCheck: false };
}

