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
 * The issuer creates a trustline to themselves (cold wallet pattern)
 * Then "issues" tokens by sending to recipients
 */
export async function issueRWAToken(
  wallet: Wallet,
  currencyName: string,
  metadata: RWAMetadata
): Promise<RWAIssuanceResult> {
  try {
    // Check verification
    const canIssue = await canIssueRWA(wallet.classicAddress);
    if (!canIssue.allowed) {
      return { success: false, error: canIssue.reason };
    }

    const client = await getClient();
    const currency = currencyToXRPL(currencyName);

    console.log("Issuing RWA token:", currencyName, "->", currency);
    console.log("Metadata:", metadata);

    // For IOUs, the issuer doesn't need to create a trustline to themselves
    // Recipients will create trustlines to the issuer
    // We'll record the issuance via a self-payment with metadata

    // Create a "registration" transaction - payment to self with 0 value
    // This records the RWA creation on-chain with metadata
    const registration: Payment = {
      TransactionType: "Payment",
      Account: wallet.classicAddress,
      Destination: wallet.classicAddress,
      Amount: "1", // Minimal XRP to self (will be returned minus fee)
      Memos: metadataToMemo({
        ...metadata,
        createdAt: new Date().toISOString(),
      }),
    };

    const prepared = await client.autofill(registration);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result as { meta?: { TransactionResult?: string }; hash?: string };

    if (txResult.meta?.TransactionResult === "tesSUCCESS") {
      // Store the RWA info locally
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
        hash: txResult.hash,
      };
    }

    return {
      success: false,
      error: txResult.meta?.TransactionResult || "Failed to issue RWA token",
    };
  } catch (error) {
    console.error("RWA issuance error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to issue RWA token",
    };
  }
}

/**
 * Create trustline to receive RWA tokens from an issuer
 */
export async function createRWATrustline(
  wallet: Wallet,
  currency: string,
  issuer: string,
  limit: string = "1000000000"
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

    const trustSet: TrustSet = {
      TransactionType: "TrustSet",
      Account: wallet.classicAddress,
      LimitAmount: {
        currency,
        issuer,
        value: limit,
      },
    };

    const prepared = await client.autofill(trustSet);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result as { meta?: { TransactionResult?: string }; hash?: string };

    if (txResult.meta?.TransactionResult === "tesSUCCESS") {
      return { success: true, hash: txResult.hash };
    }

    return {
      success: false,
      error: txResult.meta?.TransactionResult || "Failed to create trustline",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create trustline",
    };
  }
}

/**
 * Send RWA tokens to a recipient
 */
export async function sendRWAToken(
  wallet: Wallet,
  recipient: string,
  currency: string,
  amount: string,
  issuer: string,
  memo?: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const client = await getClient();

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

    if (memo) {
      payment.Memos = [
        {
          Memo: {
            MemoType: Buffer.from("rwa_transfer", "utf8").toString("hex").toUpperCase(),
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
      return { success: true, hash: txResult.hash };
    }

    return {
      success: false,
      error: txResult.meta?.TransactionResult || "Failed to send RWA token",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send RWA token",
    };
  }
}

/**
 * Get all RWA tokens held by an address (from trustlines)
 */
export async function getRWATokens(address: string): Promise<RWAToken[]> {
  try {
    const client = await getClient();

    const response = await client.request({
      command: "account_lines",
      account: address,
    });

    const tokens: RWAToken[] = [];

    for (const line of response.result.lines) {
      // Skip RLUSD - it's handled separately
      if (line.currency === "524C555344000000000000000000000000000000" || line.currency === "RLUSD") {
        continue;
      }

      const storedToken = getStoredRWAToken(line.account, line.currency);
      
      tokens.push({
        currency: line.currency,
        currencyDisplay: storedToken?.currencyDisplay || currencyFromXRPL(line.currency),
        issuer: line.account,
        balance: line.balance,
        metadata: storedToken?.metadata,
        trustlineLimit: line.limit,
      });
    }

    // Also add tokens we've issued
    const issuedTokens = getIssuedRWATokens(address);
    for (const token of issuedTokens) {
      if (!tokens.find(t => t.currency === token.currency && t.issuer === token.issuer)) {
        tokens.push(token);
      }
    }

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
}

function getStoredRWAToken(issuer: string, currency: string): RWAToken | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem(RWA_STORAGE_KEY);
  if (!stored) return null;
  
  const tokens: Record<string, RWAToken[]> = JSON.parse(stored);
  return tokens[issuer]?.find(t => t.currency === currency) || null;
}

function getIssuedRWATokens(issuer: string): RWAToken[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(RWA_STORAGE_KEY);
  if (!stored) return [];
  
  const tokens: Record<string, RWAToken[]> = JSON.parse(stored);
  return tokens[issuer] || [];
}

/**
 * Get all RWA tokens in the marketplace (from all issuers)
 */
export function getAllMarketplaceTokens(): RWAToken[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(RWA_STORAGE_KEY);
  if (!stored) return [];
  
  const tokens: Record<string, RWAToken[]> = JSON.parse(stored);
  const all: RWAToken[] = [];
  
  for (const issuerTokens of Object.values(tokens)) {
    all.push(...issuerTokens);
  }
  
  return all;
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

