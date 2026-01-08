/**
 * Utility functions for sharing RWA token information
 * Helps users share token details so recipients can create trustlines
 */

import { RWAToken } from "@/lib/xrpl/rwa";

export interface ShareableTokenInfo {
  name: string;
  symbol: string;
  currency: string;
  issuer: string;
  description?: string;
  category?: string;
  unitValue?: string;
  shareUrl: string;
  trustlineInstructions: string;
}

/**
 * Generate shareable token information
 */
export function generateShareableTokenInfo(token: RWAToken, baseUrl: string = ""): ShareableTokenInfo {
  const shareUrl = `${baseUrl}/rwa?token=${encodeURIComponent(token.currency)}&issuer=${encodeURIComponent(token.issuer)}`;
  
  const trustlineInstructions = `To receive ${token.metadata?.name || token.currencyDisplay} tokens:

1. Go to SigmaPay RWA Marketplace
2. Search for "${token.metadata?.name || token.currencyDisplay}"
3. Click "Add to Wallet" to create a trustline
4. Share your XRPL address with the sender

Token Details:
• Name: ${token.metadata?.name || token.currencyDisplay}
• Symbol: ${token.currencyDisplay}
• Issuer: ${token.issuer}
• Category: ${token.metadata?.category || "N/A"}
${token.metadata?.unitValue ? `• Value per unit: $${token.metadata.unitValue}` : ""}

Or visit: ${shareUrl}`;

  return {
    name: token.metadata?.name || token.currencyDisplay,
    symbol: token.currencyDisplay,
    currency: token.currency,
    issuer: token.issuer,
    description: token.metadata?.description,
    category: token.metadata?.category,
    unitValue: token.metadata?.unitValue,
    shareUrl,
    trustlineInstructions,
  };
}

/**
 * Copy token information to clipboard
 * Handles cases where clipboard API is not available
 */
export async function copyTokenInfoToClipboard(token: RWAToken, baseUrl: string = ""): Promise<boolean> {
  try {
    // Check if clipboard API is available
    if (typeof window === "undefined" || !navigator.clipboard) {
      console.warn("Clipboard API not available");
      return false;
    }

    const shareInfo = generateShareableTokenInfo(token, baseUrl);
    await navigator.clipboard.writeText(shareInfo.trustlineInstructions);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    
    // Fallback: try the older execCommand method
    try {
      if (typeof window !== "undefined" && document.execCommand) {
        const shareInfo = generateShareableTokenInfo(token, baseUrl);
        const textArea = document.createElement("textarea");
        textArea.value = shareInfo.trustlineInstructions;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand("copy");
        document.body.removeChild(textArea);
        return result;
      }
    } catch (fallbackError) {
      console.error("Fallback copy method also failed:", fallbackError);
    }
    
    return false;
  }
}

/**
 * Generate a QR code data for token information
 */
export function generateTokenQRData(token: RWAToken, baseUrl: string = ""): string {
  const shareInfo = generateShareableTokenInfo(token, baseUrl);
  
  // Create a compact JSON representation for QR code
  const qrData = {
    type: "rwa_token",
    name: shareInfo.name,
    symbol: shareInfo.symbol,
    currency: shareInfo.currency,
    issuer: shareInfo.issuer,
    url: shareInfo.shareUrl,
  };
  
  return JSON.stringify(qrData);
}

/**
 * Create a shareable message for social media or messaging apps
 */
export function createShareMessage(token: RWAToken, amount?: string, baseUrl: string = ""): string {
  const shareInfo = generateShareableTokenInfo(token, baseUrl);
  
  let message = `🌍 Check out this RWA token on SigmaPay!\n\n`;
  message += `📄 ${shareInfo.name}\n`;
  message += `🏷️ Symbol: ${shareInfo.symbol}\n`;
  
  if (amount) {
    message += `💰 Amount: ${amount} ${shareInfo.symbol}\n`;
  }
  
  if (shareInfo.unitValue) {
    message += `💵 Value: $${shareInfo.unitValue} per unit\n`;
  }
  
  message += `\n🔗 ${shareInfo.shareUrl}\n\n`;
  message += `To receive this token, create a trustline in SigmaPay! 🚀`;
  
  return message;
}

/**
 * Validate if a token can be shared
 */
export function canShareToken(token: RWAToken): boolean {
  return !!(token.currency && token.issuer && token.currencyDisplay);
}