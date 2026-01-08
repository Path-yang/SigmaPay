/**
 * Utility functions to help users reset their RWA token storage
 * if they encounter issues with duplicate tokens or corrupted data
 */

const RWA_STORAGE_KEY = "sigmapay_rwa_tokens";

export function resetUserTokens(userAddress: string): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const stored = localStorage.getItem(RWA_STORAGE_KEY);
    if (!stored) return true;
    
    const tokens: Record<string, any[]> = JSON.parse(stored);
    
    // Remove all tokens for this user
    delete tokens[userAddress];
    
    localStorage.setItem(RWA_STORAGE_KEY, JSON.stringify(tokens));
    console.log(`✅ Reset tokens for user: ${userAddress}`);
    return true;
  } catch (error) {
    console.error("Failed to reset user tokens:", error);
    return false;
  }
}

export function resetAllTokens(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    localStorage.removeItem(RWA_STORAGE_KEY);
    console.log("✅ Reset all RWA tokens");
    return true;
  } catch (error) {
    console.error("Failed to reset all tokens:", error);
    return false;
  }
}

export function getTokenCount(userAddress?: string): number {
  if (typeof window === "undefined") return 0;
  
  try {
    const stored = localStorage.getItem(RWA_STORAGE_KEY);
    if (!stored) return 0;
    
    const tokens: Record<string, any[]> = JSON.parse(stored);
    
    if (userAddress) {
      return tokens[userAddress]?.length || 0;
    }
    
    return Object.values(tokens).reduce((total, userTokens) => total + userTokens.length, 0);
  } catch (error) {
    console.error("Failed to get token count:", error);
    return 0;
  }
}