/**
 * RWA (Real World Assets) Token Management
 * Uses XRPL IOUs for tokenizing real-world assets
 * 
 * RWA Token Structure:
 * - Currency: 3-char code (e.g., "GLD" for gold) or 40-char hex for longer names
 * - Issuer: The wallet that tokenizes the asset
 * - Metadata: Stored in transaction memos
 */

import { Payment, TrustSet } from "xrpl";
import { getClient } from "./client";
import { VerificationLevel } from "./constants";
import { getVerificationLevel } from "./did";
import type { Wallet } from "xrpl";

// RWA Asset Categories
export enum RWACategory {
  REAL_ESTATE = "real_estate",
  COMMODITIES = "commodities",
  ART = "art",
  SECURITIES = "securities",
  INVOICES = "invoices",
  COLLECTIBLES = "collectibles",
  CREDENTIALS = "credentials",
  OTHER = "other",
}

// RWA Token Metadata
export interface RWAMetadata {
  name: string;
  description: string;
  category: RWACategory;
  totalSupply: string;
  unitValue?: string; // Value per unit in USD
  documentUri?: string; // Link to legal documents (IPFS in production)
  imageUri?: string;
  location?: string; // For real estate
  expirationDate?: string; // For invoices/credentials
  issuerName?: string;
  createdAt: string;
}

// RWA Token Info
export interface RWAToken {
  currency: string; // 3-char or hex code
  currencyDisplay: string; // Human readable name
  issuer: string;
  balance: string;
  metadata?: RWAMetadata;
  trustlineLimit?: string;
}

// RWA Issuance Result
export interface RWAIssuanceResult {
  success: boolean;
  currency?: string;
  hash?: string;
  error?: string;
}

/**
 * Convert a currency name to XRPL format
 * 3 chars or less: use as-is
 * More than 3 chars: convert to 40-char hex
 */
export function currencyToXRPL(name: string): string {
  const cleaned = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  if (cleaned.length <= 3) {
    return cleaned.padEnd(3, "X"); // Pad to 3 chars if needed
  }
  
  // Convert to 40-char hex
  const hex = Buffer.from(cleaned.substring(0, 20), "utf8")
    .toString("hex")
    .toUpperCase();
  return hex.padEnd(40, "0");
}

/**
 * Convert XRPL currency back to display name
 */
export function currencyFromXRPL(currency: string): string {
  if (currency.length === 3) {
    return currency.replace(/X+$/, ""); // Remove trailing X padding
  }
  
  if (currency.length === 40) {
    // Remove trailing zeros and convert from hex
    const trimmed = currency.replace(/0+$/, "");
    if (trimmed.length % 2 !== 0) return currency; // Invalid
    try {
      return Buffer.from(trimmed, "hex").toString("utf8");
    } catch {
      return currency.substring(0, 8) + "...";
    }
  }
  
  return currency;
}

/**
 * Create RWA token metadata as hex memo
 */
function metadataToMemo(metadata: RWAMetadata): { Memo: { MemoType: string; MemoData: string } }[] {
  const memoData = JSON.stringify(metadata);
  return [
    {
      Memo: {
        MemoType: Buffer.from("rwa_metadata", "utf8").toString("hex").toUpperCase(),
        MemoData: Buffer.from(memoData, "utf8").toString("hex").toUpperCase(),
      },
    },
  ];
}

/**
 * Parse RWA metadata from transaction memo
 */
export function parseMetadataFromMemo(memoData: string): RWAMetadata | null {
  try {
    const decoded = Buffer.from(memoData, "hex").toString("utf8");
    return JSON.parse(decoded) as RWAMetadata;
  } catch {
    return null;
  }
}

/**
 * Check if user can issue RWA tokens (must be verified)
 */
export async function canIssueRWA(address: string): Promise<{ allowed: boolean; reason?: string }> {
  const level = await getVerificationLevel(address);
  
  if (level === VerificationLevel.UNVERIFIED) {
    return {
      allowed: false,
      reason: "You must verify your identity (at least Basic level) to tokenize assets.",
    };
  }
  
  return { allowed: true };
}

/**
 * Issue a new RWA token
 * In XRPL, IOU tokens are created when the issuer sends them to a recipient.
 * The issuer can hold tokens by sending them to an address with a trustline.
 * For the initial supply, we'll create a trustline and send tokens to the issuer.
 */
export async function issueRWAToken(
  wallet: Wallet,
  currencyName: string,
  metadata: RWAMetadata
): Promise<RWAIssuanceResult> {
  // Prevent creating XRP tokens - XRP is native and cannot be created
  const upperName = currencyName.toUpperCase().trim();
  if (upperName === "XRP" || upperName.match(/^XRP[A-Z0-9]*$/)) {
    return {
      success: false,
      error: "Cannot create XRP tokens. XRP is the native currency. Please use a different token symbol for your RWA.",
    };
  }

  // Validate metadata size to prevent transaction failures
  const metadataString = JSON.stringify(metadata);
  if (metadataString.length > 1000) {
    return {
      success: false,
      error: "Token metadata is too large. Please reduce the description or other fields.",
    };
  }

  const MAX_RETRIES = 2; // Allow 2 retries for slow testnet
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`=== Starting RWA Token Issuance (Attempt ${attempt}/${MAX_RETRIES}) ===`);
      console.log("Wallet:", wallet.classicAddress);
      console.log("Currency Name:", currencyName);
      
      // Check verification (only on first attempt)
      if (attempt === 1) {
        console.log("Checking if user can issue RWA...");
        const canIssue = await canIssueRWA(wallet.classicAddress);
        console.log("Can issue RWA:", canIssue);
        
        if (!canIssue.allowed) {
          return { success: false, error: canIssue.reason };
        }
      }

      console.log("Connecting to XRPL client...");
      const client = await getClient();
      const currency = currencyToXRPL(currencyName);

      console.log("Issuing RWA token:", currencyName, "->", currency);
      console.log("Metadata:", metadata);

      // Check if this token already exists for this issuer
      const existingToken = getStoredRWAToken(wallet.classicAddress, currency);
      if (existingToken && attempt === 1) {
        console.log("⚠️ Token already exists for this issuer:", existingToken);
        
        // Clean up any duplicates first
        clearDuplicateRWATokens(wallet.classicAddress);
        
        return {
          success: false,
          error: `A token with symbol "${currencyName}" already exists in your portfolio. Please choose a different symbol or check your RWA portfolio.`,
        };
      }

      // Step 1: Create a trustline from issuer to themselves
      // Note: In XRPL, you can't create a trustline to yourself directly.
      // Instead, we'll use a different approach: create a trustline from a holding account
      // OR we can issue tokens by sending them to recipients who have trustlines.
      // For simplicity, we'll register the token and the issuer will have the ability to issue tokens.

      // Step 1: Register the token with metadata via a memo-only transaction
      // Use AccountSet transaction instead of self-payment to avoid temRedundant
      const registration: any = {
        TransactionType: "AccountSet" as const,
        Account: wallet.classicAddress,
        // Add a unique identifier to prevent duplicate transactions
        Domain: Buffer.from(`sigmapay-rwa-${currency}-${Date.now()}`).toString('hex').substring(0, 64),
        Memos: metadataToMemo({
          ...metadata,
          createdAt: new Date().toISOString(),
        }),
      };

      console.log("Step 1: Registering token with metadata...");
      
      // Add timeout wrapper for autofill as well
      const autofillPromise = client.autofill(registration);
      const autofillTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Transaction preparation timed out. Please try again.")), 30000);
      });
      
      const preparedReg = await Promise.race([autofillPromise, autofillTimeout]);
      
      if (preparedReg.LastLedgerSequence) {
        // Increase LastLedgerSequence more to give more time for slow testnet
        preparedReg.LastLedgerSequence = preparedReg.LastLedgerSequence + 40; // Increased from 20 to 40
      }
      
      console.log("Transaction prepared, signing...");
      const signedReg = wallet.sign(preparedReg);
      const txHash = signedReg.hash || (signedReg as any).tx?.hash;
      console.log("Transaction signed, hash:", txHash);
      console.log("Submitting to network...");
      
      // Submit with better approach: submit first, then poll for confirmation
      let regResult;
      let submittedHash: string = txHash || ""; // Initialize with txHash
      try {
        console.log(`Submitting transaction (attempt ${attempt}/${MAX_RETRIES})...`);
        
        // Step 1: Submit the transaction (this is fast)
        const submitResponse = await client.submit(signedReg.tx_blob);
        console.log("Transaction submitted, response:", submitResponse);
        
        // Get transaction hash from response or signed transaction
        submittedHash = submitResponse.result.tx_json?.hash || 
                       (submitResponse.result as any).hash || 
                       txHash || 
                       (signedReg as any).hash ||
                       "";
        
        if (!submittedHash) {
          throw new Error("Could not determine transaction hash from submission response");
        }
        
        console.log("Transaction hash:", submittedHash);
        
        // Check if transaction was immediately rejected
        const engineResult = submitResponse.result.engine_result;
        console.log("Engine result:", engineResult);
        
        if (engineResult === "temREDUNDANT") {
          // This token might already exist - check if we can proceed anyway
          console.log("⚠️ Transaction marked as redundant, but this might be expected for token registration");
          
          // Store the token anyway since the registration might have succeeded previously
          storeRWAToken(wallet.classicAddress, {
            currency,
            currencyDisplay: currencyName,
            issuer: wallet.classicAddress,
            balance: metadata.totalSupply,
            metadata: { ...metadata, createdAt: new Date().toISOString() },
          });
          
          return {
            success: true,
            currency,
            hash: submittedHash,
          };
        } else if (engineResult !== "tesSUCCESS" && engineResult !== "terQUEUED" && !engineResult.startsWith("ter")) {
          // Transaction was rejected
          throw new Error(`Transaction rejected: ${engineResult}`);
        }
        
        // Step 2: Poll for transaction confirmation with exponential backoff
        console.log("Polling for transaction confirmation...");
        const startTime = Date.now();
        const maxPollTimeout = 180000; // 3 minutes for polling (increased from 2 minutes)
        let pollInterval = 2000; // Start with 2 seconds
        const maxPollInterval = 8000; // Max 8 seconds between polls
        let pollCount = 0;
        
        while (Date.now() - startTime < maxPollTimeout) {
          pollCount++;
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          console.log(`Poll attempt ${pollCount} (${elapsed}s elapsed, interval: ${pollInterval}ms)...`);
          
          try {
            // Try to get transaction result
            const txResult = await client.request({
              command: "tx",
              transaction: submittedHash,
            });
            
            if (txResult.result && txResult.result.validated) {
              // Transaction is validated!
              console.log(`✅ Transaction validated after ${elapsed} seconds!`);
              regResult = { result: txResult.result };
              break;
            } else {
              // Transaction exists but not yet validated
              console.log(`Transaction found but not yet validated (${elapsed}s), waiting...`);
            }
          } catch (pollError: any) {
            // Transaction not found yet, continue polling
            const errorCode = pollError?.data?.error || pollError?.error || "";
            if (errorCode === "txnNotFound" || errorCode.includes("not found")) {
              console.log(`Transaction not found yet (${elapsed}s), continuing to poll...`);
            } else {
              console.log(`Polling error (will retry):`, errorCode);
            }
          }
          
          // Wait before next poll with exponential backoff
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          
          // Increase poll interval for next attempt (exponential backoff)
          pollInterval = Math.min(pollInterval * 1.2, maxPollInterval);
        }
        
        // Check if we got a result
        if (!regResult) {
          // Transaction was submitted but not confirmed in time
          console.log("⚠️ Transaction submitted but not confirmed within timeout.");
          
          // For better UX, return a partial success with instructions
          return {
            success: false,
            error: `Transaction submitted (${submittedHash}) but not confirmed within 3 minutes. This may be due to testnet congestion. Please check your portfolio in a few minutes, or try again with a different token name.`,
          };
        }
        
        console.log("Transaction confirmed!");
      } catch (submitError) {
        const errorMsg = submitError instanceof Error ? submitError.message : "Failed to submit transaction";
        console.error(`❌ Transaction submission error (attempt ${attempt}):`, errorMsg);
        
        // If it's a timeout and we have retries left, throw to trigger retry
        if (errorMsg.includes("timeout") && attempt < MAX_RETRIES) {
          throw submitError; // This will be caught by outer catch and trigger retry
        }
        
        // Otherwise, throw the error
        throw new Error(errorMsg);
      }

      const regTxResult = regResult.result as { meta?: { TransactionResult?: string }; hash?: string };
      console.log("Registration result:", regTxResult);

      // Get hash from result or use submitted hash
      const finalHash = regTxResult.hash || submittedHash || txHash || "";

      if (regTxResult.meta?.TransactionResult !== "tesSUCCESS") {
        const errorMsg = regTxResult.meta?.TransactionResult || "Failed to register RWA token";
        console.error("❌ Registration failed:", errorMsg);
        
        // Provide user-friendly error messages
        let userError = errorMsg;
        if (errorMsg.includes("tecUNFUNDED")) {
          userError = "Insufficient XRP balance. You need XRP to pay transaction fees (minimum ~0.00001 XRP).";
        } else if (errorMsg.includes("temBAD")) {
          userError = "Invalid transaction parameters. Please check your input and try again.";
        } else if (errorMsg.includes("tecNO_DST")) {
          userError = "Destination account issue. Please try again.";
        } else if (errorMsg.includes("tefPAST_SEQ")) {
          userError = "Transaction sequence error. Please refresh and try again.";
        } else if (errorMsg.includes("tefMAX_LEDGER")) {
          userError = "Transaction expired. Please try again.";
        }
        
        return { success: false, error: userError };
      }

      console.log("✅ Token registered successfully!");

      // Step 2: Create a trustline to hold the tokens
      // In XRPL, to hold your own IOU tokens, you need a trustline.
      // However, you cannot create a trustline to yourself.
      // The solution: The issuer can issue tokens by sending them, and they'll appear
      // as a negative balance (the issuer owes tokens). To hold positive balance,
      // tokens must be sent to an address with a trustline.
      
      // For now, we'll just register the token. The issuer can send tokens to recipients
      // who have trustlines, and the issuer's balance will be negative (they owe tokens).
      // When the issuer receives tokens back, they'll have a positive balance if they have a trustline.

      // Store the RWA info locally
      // For issuers, the available balance is the total supply (they can issue up to this amount)
      storeRWAToken(wallet.classicAddress, {
        currency,
        currencyDisplay: currencyName,
        issuer: wallet.classicAddress,
        balance: metadata.totalSupply, // Available to issue
        metadata: { ...metadata, createdAt: new Date().toISOString() },
      });

      console.log("✅ RWA token created successfully!");
      return {
        success: true,
        currency,
        hash: finalHash,
      };
    } catch (error) {
      console.error(`❌ RWA issuance error (attempt ${attempt}):`, error);
      const errorMessage = error instanceof Error ? error.message : "Failed to issue RWA token";
      
      // Retry on timeout or network errors
      if (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("slow")) {
        lastError = errorMessage;
        if (attempt < MAX_RETRIES) {
          const retryDelay = attempt * 3000; // 3s, 6s delays
          console.log(`⏳ Network/timeout error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${retryDelay/1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue; // Retry the loop
        }
      }
      
      // Don't retry on other errors - fail fast
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  return {
    success: false,
    error: lastError || "Failed to issue RWA token. Please check your wallet balance and try again.",
  };
}

/**
 * Create trustline to receive RWA tokens from an issuer
 * Enhanced version with better error handling and validation
 */
export async function createRWATrustline(
  wallet: Wallet,
  currency: string,
  issuer: string,
  limit: string = "1000000000"
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    console.log("Creating RWA trustline:", { currency, issuer, limit });
    const client = await getClient();

    // Check if trustline already exists
    const existingTrustline = await checkTrustlineExists(wallet.classicAddress, currency, issuer);
    if (existingTrustline) {
      return {
        success: false,
        error: "Trustline already exists for this token.",
      };
    }

    // Validate limit
    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0) {
      return {
        success: false,
        error: "Invalid trustline limit. Please enter a positive number.",
      };
    }

    const trustSet: TrustSet = {
      TransactionType: "TrustSet",
      Account: wallet.classicAddress,
      LimitAmount: {
        currency,
        issuer,
        value: limit,
      },
    };

    console.log("Preparing trustline transaction...");
    
    // Add timeout for autofill
    const autofillPromise = client.autofill(trustSet);
    const autofillTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Transaction preparation timed out. Please try again.")), 30000);
    });
    
    const prepared = await Promise.race([autofillPromise, autofillTimeout]);
    
    if (prepared.LastLedgerSequence) {
      prepared.LastLedgerSequence = prepared.LastLedgerSequence + 20;
    }

    const signed = wallet.sign(prepared);
    console.log("Submitting trustline transaction...");
    
    // Use submit and poll approach for better reliability
    const submitResponse = await client.submit(signed.tx_blob);
    const submittedHash = submitResponse.result.tx_json?.hash || 
                         (submitResponse.result as any).hash || 
                         signed.hash || "";

    // Check engine result
    const engineResult = submitResponse.result.engine_result;
    if (engineResult !== "tesSUCCESS" && engineResult !== "terQUEUED" && !engineResult.startsWith("ter")) {
      let errorMessage = `Transaction rejected: ${engineResult}`;
      
      if (engineResult === "tecUNFUNDED") {
        errorMessage = "Insufficient XRP balance to pay transaction fees (~0.00001 XRP required).";
      } else if (engineResult === "tecNO_DST") {
        errorMessage = "Issuer account not found or invalid.";
      } else if (engineResult === "temREDUNDANT") {
        errorMessage = "Trustline already exists for this token.";
      } else if (engineResult === "temBAD_CURRENCY") {
        errorMessage = "Invalid currency code.";
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Poll for confirmation
    console.log("Polling for trustline confirmation...");
    const startTime = Date.now();
    const maxPollTimeout = 60000; // 1 minute for trustlines
    let pollInterval = 2000;
    
    while (Date.now() - startTime < maxPollTimeout) {
      try {
        const txResult = await client.request({
          command: "tx",
          transaction: submittedHash,
        });
        
        if (txResult.result && txResult.result.validated) {
          const result = txResult.result as { meta?: { TransactionResult?: string }; hash?: string };
          
          if (result.meta?.TransactionResult === "tesSUCCESS") {
            console.log("✅ Trustline created successfully!");
            return { success: true, hash: result.hash || submittedHash };
          } else {
            const errorCode = result.meta?.TransactionResult || "Failed to create trustline";
            let errorMessage = errorCode;
            
            if (errorCode === "tecUNFUNDED") {
              errorMessage = "Insufficient XRP balance to pay transaction fees.";
            } else if (errorCode === "tecNO_DST") {
              errorMessage = "Issuer account not found.";
            }
            
            return {
              success: false,
              error: `Trustline creation failed: ${errorMessage}`,
            };
          }
        }
      } catch (pollError) {
        // Continue polling
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      error: "Trustline transaction submitted but not confirmed within timeout. Please check your account later.",
    };

  } catch (error) {
    console.error("Error creating RWA trustline:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create trustline",
    };
  }
}

/**
 * Check if a trustline exists for a currency/issuer pair
 */
async function checkTrustlineExists(
  address: string,
  currency: string,
  issuer: string
): Promise<boolean> {
  try {
    const client = await getClient();
    const response = await client.request({
      command: "account_lines",
      account: address,
      peer: issuer,
    });

    return response.result.lines.some(
      (line: { currency: string; account: string }) =>
        line.currency === currency && line.account === issuer
    );
  } catch (error) {
    console.error("Error checking trustline:", error);
    return false;
  }
}

/**
 * Send RWA tokens to a recipient
 * Enhanced version with better error handling and trustline management
 */
export async function sendRWAToken(
  wallet: Wallet,
  recipient: string,
  currency: string,
  amount: string,
  issuer: string,
  memo?: string
): Promise<{ success: boolean; hash?: string; error?: string; needsTrustline?: boolean }> {
  const MAX_RETRIES = 2;
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`=== Starting RWA Token Transfer (Attempt ${attempt}/${MAX_RETRIES}) ===`);
      console.log("From:", wallet.classicAddress);
      console.log("To:", recipient);
      console.log("Amount:", amount, currency);
      console.log("Issuer:", issuer);

      const client = await getClient();

      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return {
          success: false,
          error: "Invalid amount. Please enter a positive number.",
        };
      }

      // Check if recipient address is valid
      if (!recipient.startsWith("r") || recipient.length < 25) {
        return {
          success: false,
          error: "Invalid recipient address. XRPL addresses start with 'r' and are at least 25 characters long.",
        };
      }

      // Check if sender has sufficient balance (for non-issuers)
      if (wallet.classicAddress !== issuer) {
        try {
          const senderTokens = await getRWATokens(wallet.classicAddress);
          const senderToken = senderTokens.find(t => t.currency === currency && t.issuer === issuer);
          
          if (!senderToken || parseFloat(senderToken.balance) < numAmount) {
            return {
              success: false,
              error: `Insufficient balance. You have ${senderToken?.balance || "0"} ${currency}, but trying to send ${amount}.`,
            };
          }
        } catch (error) {
          console.warn("Could not verify sender balance:", error);
          // Continue anyway - let XRPL handle the validation
        }
      }

      // Check if recipient has a trustline to the issuer
      const hasTrustline = await checkTrustlineExists(recipient, currency, issuer);
      
      if (!hasTrustline) {
        console.log(`Warning: Recipient ${recipient} does not have a trustline for ${currency} from ${issuer}`);
        
        // Return specific error for missing trustline
        return {
          success: false,
          needsTrustline: true,
          error: `The recipient does not have a trustline for ${currency}. They need to create a trustline to ${issuer.substring(0, 8)}... before they can receive this token. Please ask them to add this token to their wallet first.`,
        };
      }

      // Create the payment transaction
      const payment: Payment = {
        TransactionType: "Payment",
        Account: wallet.classicAddress,
        Destination: recipient,
        Amount: {
          currency,
          issuer,
          value: amount,
        },
      };

      // Add memo if provided
      if (memo) {
        payment.Memos = [
          {
            Memo: {
              MemoType: Buffer.from("rwa_transfer", "utf8").toString("hex").toUpperCase(),
              MemoData: Buffer.from(memo.substring(0, 1000), "utf8").toString("hex").toUpperCase(), // Limit memo size
            },
          },
        ];
      }

      console.log("Preparing payment transaction...");
      
      // Add timeout for autofill
      const autofillPromise = client.autofill(payment);
      const autofillTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Transaction preparation timed out. Please try again.")), 30000);
      });
      
      const prepared = await Promise.race([autofillPromise, autofillTimeout]);
      
      // Increase timeout for longer wait
      if (prepared.LastLedgerSequence) {
        prepared.LastLedgerSequence = prepared.LastLedgerSequence + 30; // Increased timeout
      }
      
      console.log("Transaction prepared, signing...");
      const signed = wallet.sign(prepared);
      const txHash = signed.hash || (signed as any).tx?.hash;
      console.log("Transaction signed, hash:", txHash);
      console.log("Submitting payment transaction...");
      
      // Submit with polling approach like token creation
      let result;
      let submittedHash: string = txHash || "";
      
      try {
        // Step 1: Submit the transaction
        const submitResponse = await client.submit(signed.tx_blob);
        console.log("Transaction submitted, response:", submitResponse);
        
        // Get transaction hash
        submittedHash = submitResponse.result.tx_json?.hash || 
                       (submitResponse.result as any).hash || 
                       txHash || 
                       "";
        
        if (!submittedHash) {
          throw new Error("Could not determine transaction hash from submission response");
        }
        
        // Check engine result
        const engineResult = submitResponse.result.engine_result;
        console.log("Engine result:", engineResult);
        
        if (engineResult !== "tesSUCCESS" && engineResult !== "terQUEUED" && !engineResult.startsWith("ter")) {
          // Transaction was rejected immediately
          let errorMessage = `Transaction rejected: ${engineResult}`;
          
          if (engineResult === "tecNO_LINE") {
            errorMessage = `Recipient does not have a trustline for this token. They need to create a trustline to ${issuer.substring(0, 8)}... first.`;
          } else if (engineResult === "tecPATH_PARTIAL") {
            errorMessage = "Cannot find a path to send this token. The recipient may need a trustline.";
          } else if (engineResult === "tecUNFUNDED_PAYMENT") {
            errorMessage = "Insufficient token balance to complete this transfer.";
          } else if (engineResult === "tecUNFUNDED") {
            errorMessage = "Insufficient XRP balance to pay transaction fees (~0.00001 XRP required).";
          } else if (engineResult === "tecNO_DST") {
            errorMessage = "Recipient account not found or not activated.";
          } else if (engineResult === "tecDST_TAG_NEEDED") {
            errorMessage = "Recipient account requires a destination tag.";
          }
          
          throw new Error(errorMessage);
        }
        
        // Step 2: Poll for confirmation
        console.log("Polling for transaction confirmation...");
        const startTime = Date.now();
        const maxPollTimeout = 120000; // 2 minutes
        let pollInterval = 2000; // Start with 2 seconds
        const maxPollInterval = 6000; // Max 6 seconds
        let pollCount = 0;
        
        while (Date.now() - startTime < maxPollTimeout) {
          pollCount++;
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          console.log(`Poll attempt ${pollCount} (${elapsed}s elapsed)...`);
          
          try {
            const txResult = await client.request({
              command: "tx",
              transaction: submittedHash,
            });
            
            if (txResult.result && txResult.result.validated) {
              console.log(`✅ Transaction validated after ${elapsed} seconds!`);
              result = { result: txResult.result };
              break;
            } else {
              console.log(`Transaction found but not yet validated (${elapsed}s), waiting...`);
            }
          } catch (pollError: any) {
            const errorCode = pollError?.data?.error || pollError?.error || "";
            if (errorCode === "txnNotFound" || errorCode.includes("not found")) {
              console.log(`Transaction not found yet (${elapsed}s), continuing to poll...`);
            } else {
              console.log(`Polling error (will retry):`, errorCode);
            }
          }
          
          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          pollInterval = Math.min(pollInterval * 1.2, maxPollInterval);
        }
        
        if (!result) {
          return {
            success: false,
            error: `Transaction submitted (${submittedHash}) but not confirmed within 2 minutes. This may be due to network congestion. Please check the transaction status later or try again.`,
          };
        }
        
      } catch (submitError) {
        const errorMsg = submitError instanceof Error ? submitError.message : "Failed to submit transaction";
        console.error(`❌ Transaction submission error (attempt ${attempt}):`, errorMsg);
        
        // If it's a timeout and we have retries left, throw to trigger retry
        if (errorMsg.includes("timeout") && attempt < MAX_RETRIES) {
          lastError = errorMsg;
          continue; // Retry
        }
        
        throw new Error(errorMsg);
      }

      // Process the result
      const txResult = result.result as { meta?: { TransactionResult?: string }; hash?: string };
      console.log("Payment result:", txResult);

      // Get hash from result
      const finalHash = txResult.hash || submittedHash || txHash || "";

      if (txResult.meta?.TransactionResult === "tesSUCCESS") {
        console.log("✅ RWA token transfer successful!");
        return { success: true, hash: finalHash };
      }

      // Handle failure
      const errorCode = txResult.meta?.TransactionResult || "Failed to send RWA token";
      let errorMessage = errorCode;
      
      if (errorCode === "tecNO_LINE") {
        errorMessage = `Recipient ${recipient.substring(0, 8)}... does not have a trustline for this token. They need to create a trustline to ${issuer.substring(0, 8)}... first.`;
      } else if (errorCode === "tecPATH_PARTIAL") {
        errorMessage = "Cannot find a path to send this token. The recipient may need a trustline.";
      } else if (errorCode === "tecUNFUNDED_PAYMENT") {
        errorMessage = "Insufficient token balance to complete this transfer.";
      } else if (errorCode === "tecUNFUNDED") {
        errorMessage = "Insufficient XRP balance to pay transaction fees.";
      } else if (errorCode === "tecNO_DST") {
        errorMessage = "Destination account not found or not activated.";
      } else if (errorCode === "tecDST_TAG_NEEDED") {
        errorMessage = "Destination account requires a destination tag.";
      }

      return {
        success: false,
        error: errorMessage,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send RWA token";
      console.error(`Error sending RWA token (attempt ${attempt}):`, errorMessage);
      lastError = errorMessage;
      
      // If we have retries left and it's a timeout, continue
      if (errorMessage.includes("timeout") && attempt < MAX_RETRIES) {
        console.log(`Retrying in 3 seconds... (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      
      // Otherwise return the error
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // If we get here, all retries failed
  return {
    success: false,
    error: lastError || "Failed to send RWA token after multiple attempts",
  };
}

/**
 * Get all RWA tokens held by an address (from trustlines)
 * For issuers, also includes tokens they've issued (even if balance is negative)
 */
export async function getRWATokens(address: string): Promise<RWAToken[]> {
  try {
    const client = await getClient();

    const response = await client.request({
      command: "account_lines",
      account: address,
    });

    const tokens: RWAToken[] = [];

    // Process trustlines (tokens received from others)
    for (const line of response.result.lines) {
      // Skip RLUSD - it's handled separately
      if (line.currency === "524C555344000000000000000000000000000000" || line.currency === "RLUSD") {
        continue;
      }

      const storedToken = getStoredRWAToken(line.account, line.currency);
      
      // Only include if balance is positive (tokens held)
      // Negative balances mean we owe tokens (we're the issuer)
      const balance = parseFloat(line.balance);
      if (balance > 0) {
        tokens.push({
          currency: line.currency,
          currencyDisplay: storedToken?.currencyDisplay || currencyFromXRPL(line.currency),
          issuer: line.account,
          balance: line.balance,
          metadata: storedToken?.metadata,
          trustlineLimit: line.limit,
        });
      }
    }

    // Add tokens we've issued (even if we don't have a trustline showing them)
    const issuedTokens = getIssuedRWATokens(address);
    console.log(`[getRWATokens] Found ${issuedTokens.length} issued tokens for ${address}`);
    
    for (const issuedToken of issuedTokens) {
      console.log(`[getRWATokens] Processing issued token:`, {
        currency: issuedToken.currency,
        currencyDisplay: issuedToken.currencyDisplay,
        balance: issuedToken.balance,
        totalSupply: issuedToken.metadata?.totalSupply,
      });
      
      // Check if we already have this token in our list
      const existing = tokens.find(
        t => t.currency === issuedToken.currency && t.issuer === issuedToken.issuer
      );
      
      if (!existing) {
        // Check if we have a trustline for this token (might have negative balance)
        const trustline = response.result.lines.find(
          (line: { currency: string; account: string; balance: string }) =>
            line.currency === issuedToken.currency && line.account === issuedToken.issuer
        );
        
        if (trustline) {
          // We have a trustline - use the actual balance (might be negative)
          const balance = parseFloat(trustline.balance);
          // For issuers, negative balance means tokens issued
          // Calculate available: totalSupply + balance (if negative)
          const totalSupply = parseFloat(issuedToken.metadata?.totalSupply || issuedToken.balance || "0");
          const available = balance < 0 ? totalSupply + balance : balance;
          
          console.log(`[getRWATokens] Trustline found, balance: ${balance}, totalSupply: ${totalSupply}, available: ${available}`);
          
          tokens.push({
            ...issuedToken,
            balance: available > 0 ? available.toString() : issuedToken.balance || "0",
          });
        } else {
          // No trustline yet - issuer hasn't received any tokens back
          // Use the stored balance (which should be totalSupply) or fallback to metadata
          const balance = issuedToken.balance || issuedToken.metadata?.totalSupply || "0";
          console.log(`[getRWATokens] No trustline, using stored balance: ${balance}`);
          
          tokens.push({
            ...issuedToken,
            balance: balance,
          });
        }
      } else {
        // Update existing token with metadata if available
        if (issuedToken.metadata) {
          existing.metadata = issuedToken.metadata;
        }
        if (issuedToken.currencyDisplay) {
          existing.currencyDisplay = issuedToken.currencyDisplay;
        }
        // Also update balance if it's higher (for issuers)
        const existingBalance = parseFloat(existing.balance);
        const issuedBalance = parseFloat(issuedToken.balance || issuedToken.metadata?.totalSupply || "0");
        if (issuedBalance > existingBalance) {
          existing.balance = issuedBalance.toString();
        }
      }
    }

    console.log(`[getRWATokens] Returning ${tokens.length} tokens`);
    return tokens;
  } catch (error) {
    console.error("Error fetching RWA tokens:", error);
    return [];
  }
}

// Local storage for RWA metadata (in production, use IPFS or database)
const RWA_STORAGE_KEY = "sigmapay_rwa_tokens";

function storeRWAToken(issuer: string, token: RWAToken): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem(RWA_STORAGE_KEY);
    const tokens: Record<string, RWAToken[]> = stored ? JSON.parse(stored) : {};
    
    if (!tokens[issuer]) {
      tokens[issuer] = [];
    }
    
    // Update or add
    const idx = tokens[issuer].findIndex(t => t.currency === token.currency);
    if (idx >= 0) {
      tokens[issuer][idx] = token;
    } else {
      tokens[issuer].push(token);
    }
    
    localStorage.setItem(RWA_STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error("Failed to store RWA token:", error);
  }
}

function getStoredRWAToken(issuer: string, currency: string): RWAToken | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(RWA_STORAGE_KEY);
    if (!stored) return null;
    
    const tokens: Record<string, RWAToken[]> = JSON.parse(stored);
    return tokens[issuer]?.find(t => t.currency === currency) || null;
  } catch (error) {
    console.error("Failed to get stored RWA token:", error);
    return null;
  }
}

function clearDuplicateRWATokens(issuer: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem(RWA_STORAGE_KEY);
    if (!stored) return;
    
    const tokens: Record<string, RWAToken[]> = JSON.parse(stored);
    if (!tokens[issuer]) return;
    
    // Remove duplicates based on currency
    const seen = new Set<string>();
    tokens[issuer] = tokens[issuer].filter(token => {
      if (seen.has(token.currency)) {
        console.log("Removing duplicate token:", token.currency);
        return false;
      }
      seen.add(token.currency);
      return true;
    });
    
    localStorage.setItem(RWA_STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error("Failed to clear duplicate RWA tokens:", error);
  }
}

function getIssuedRWATokens(issuer: string): RWAToken[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(RWA_STORAGE_KEY);
  if (!stored) {
    console.log(`[getIssuedRWATokens] No tokens stored in localStorage for issuer ${issuer}`);
    return [];
  }
  
  const tokens: Record<string, RWAToken[]> = JSON.parse(stored);
  const issuerTokens = tokens[issuer] || [];
  console.log(`[getIssuedRWATokens] Found ${issuerTokens.length} tokens for issuer ${issuer}:`, issuerTokens);
  return issuerTokens;
}

/**
 * Debug function to check what's stored in localStorage
 * Call this from browser console: window.debugRWATokens()
 */
if (typeof window !== "undefined") {
  (window as any).debugRWATokens = () => {
    const stored = localStorage.getItem(RWA_STORAGE_KEY);
    if (!stored) {
      console.log("No RWA tokens in localStorage");
      return {};
    }
    const tokens: Record<string, RWAToken[]> = JSON.parse(stored);
    console.log("RWA Tokens in localStorage:", tokens);
    return tokens;
  };
}

/**
 * Fetch token metadata from XRPL ledger by looking at issuer's transactions
 * This helps discover tokens that aren't in localStorage
 */
export async function fetchTokenMetadataFromLedger(
  currency: string, 
  issuer: string
): Promise<RWAToken | null> {
  try {
    console.log("Fetching token metadata from ledger:", { currency, issuer });
    const client = await getClient();
    
    // Get recent transactions from the issuer to find token creation metadata
    const response = await client.request({
      command: "account_tx",
      account: issuer,
      limit: 50, // Check last 50 transactions
      ledger_index_min: -1,
      ledger_index_max: -1,
    });
    
    // Look for AccountSet transactions with memos that might contain token metadata
    for (const tx of response.result.transactions) {
      const transaction = tx.tx;
      
      if (transaction?.TransactionType === "AccountSet" && transaction.Memos) {
        for (const memoWrapper of transaction.Memos) {
          const memo = memoWrapper.Memo;
          if (memo?.MemoType && memo.MemoData) {
            try {
              const memoType = Buffer.from(memo.MemoType, 'hex').toString('utf8');
              const memoData = Buffer.from(memo.MemoData, 'hex').toString('utf8');
              
              if (memoType === 'rwa_metadata') {
                const metadata = JSON.parse(memoData);
                
                // Check if this metadata is for our token
                const tokenCurrency = currencyToXRPL(metadata.name || "");
                if (tokenCurrency === currency || metadata.name === currencyFromXRPL(currency)) {
                  console.log("Found token metadata on ledger:", metadata);
                  
                  return {
                    currency,
                    currencyDisplay: currencyFromXRPL(currency),
                    issuer,
                    balance: "0", // User doesn't have any yet
                    metadata: {
                      ...metadata,
                      createdAt: metadata.createdAt || (tx.tx?.date ? new Date((tx.tx.date * 1000) + 946684800000).toISOString() : new Date().toISOString()),
                    }
                  };
                }
              }
            } catch (error) {
              // Skip invalid memo data
              continue;
            }
          }
        }
      }
    }
    
    // If no metadata found, create a basic token
    return {
      currency,
      currencyDisplay: currencyFromXRPL(currency),
      issuer,
      balance: "0",
      metadata: {
        name: currencyFromXRPL(currency),
        description: "Token discovered from XRPL ledger. Create a trustline to receive it.",
        category: RWACategory.OTHER,
        totalSupply: "Unknown",
        createdAt: new Date().toISOString(),
      }
    };
    
  } catch (error) {
    console.error("Failed to fetch token metadata from ledger:", error);
    return null;
  }
}
export function getAllMarketplaceTokens(): RWAToken[] {
  if (typeof window === "undefined") return [];
  
  try {
    const tokens: RWAToken[] = [];
    
    // Get tokens from localStorage
    const stored = localStorage.getItem(RWA_STORAGE_KEY);
    if (stored) {
      const localTokens: Record<string, RWAToken[]> = JSON.parse(stored);
      for (const issuerTokens of Object.values(localTokens)) {
        if (Array.isArray(issuerTokens)) {
          tokens.push(...issuerTokens);
        }
      }
    }
    
    // Check URL parameters for shared tokens
    const urlParams = new URLSearchParams(window.location.search);
    const tokenCurrency = urlParams.get('token');
    const tokenIssuer = urlParams.get('issuer');
    
    if (tokenCurrency && tokenIssuer) {
      // Check if this token is already in our list
      const existingToken = tokens.find(t => t.currency === tokenCurrency && t.issuer === tokenIssuer);
      
      if (!existingToken) {
        // Create a placeholder token for the shared token
        const sharedToken: RWAToken = {
          currency: tokenCurrency,
          currencyDisplay: currencyFromXRPL(tokenCurrency),
          issuer: tokenIssuer,
          balance: "0", // User doesn't have any yet
          metadata: {
            name: `Shared Token (${currencyFromXRPL(tokenCurrency)})`,
            description: "This token was shared with you. Create a trustline to receive it.",
            category: RWACategory.OTHER,
            totalSupply: "Unknown",
            createdAt: new Date().toISOString(),
          }
        };
        
        tokens.push(sharedToken);
        console.log("Added shared token from URL:", sharedToken);
      }
    }
    
    return tokens;
  } catch (error) {
    console.error("Failed to get marketplace tokens:", error);
    return [];
  }
}

// Demo RWA tokens for showcase
export const DEMO_RWA_TOKENS: RWAToken[] = [
  {
    currency: "GLD",
    currencyDisplay: "GLD",
    issuer: "demo",
    balance: "100",
    metadata: {
      name: "Tokenized Gold",
      description: "1 GLD = 1 gram of 24K gold stored in Singapore vault",
      category: RWACategory.COMMODITIES,
      totalSupply: "10000",
      unitValue: "65",
      location: "Singapore Bullion Vault",
      issuerName: "SigmaPay Gold Trust",
      createdAt: new Date().toISOString(),
    },
  },
  {
    currency: "PROP1",
    currencyDisplay: "PROP1",
    issuer: "demo",
    balance: "50",
    metadata: {
      name: "NYC Apartment Share",
      description: "Fractional ownership of luxury apartment in Manhattan",
      category: RWACategory.REAL_ESTATE,
      totalSupply: "1000",
      unitValue: "500",
      location: "350 5th Avenue, New York, NY",
      issuerName: "SigmaPay Real Estate",
      createdAt: new Date().toISOString(),
    },
  },
  {
    currency: "INV001",
    currencyDisplay: "INV001",
    issuer: "demo",
    balance: "1",
    metadata: {
      name: "Trade Invoice #2024-001",
      description: "Tokenized trade finance invoice, due in 90 days",
      category: RWACategory.INVOICES,
      totalSupply: "1",
      unitValue: "25000",
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      issuerName: "Global Trade Finance",
      createdAt: new Date().toISOString(),
    },
  },
];


/**
 * Add a token to marketplace by issuer address and currency
 * This helps users manually add tokens they know about
 */
export async function addTokenToMarketplace(
  currency: string,
  issuer: string
): Promise<{ success: boolean; token?: RWAToken; error?: string }> {
  try {
    // First check if token already exists in marketplace
    const existingTokens = getAllMarketplaceTokens();
    const existingToken = existingTokens.find(t => t.currency === currency && t.issuer === issuer);
    
    if (existingToken) {
      return { success: true, token: existingToken };
    }
    
    // Try to fetch metadata from ledger
    const token = await fetchTokenMetadataFromLedger(currency, issuer);
    
    if (token) {
      // Store the token locally so it appears in future marketplace loads
      storeRWAToken(issuer, token);
      return { success: true, token };
    }
    
    return {
      success: false,
      error: "Could not find token metadata on the ledger. The token may not exist or may not have been created through SigmaPay.",
    };
    
  } catch (error) {
    console.error("Failed to add token to marketplace:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add token to marketplace",
    };
  }
}