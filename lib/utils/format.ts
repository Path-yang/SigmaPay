import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00";
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatAddress(address: string, chars: number = 6): string {
  if (!address || address.length < chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: string | Date | number): string {
  const d = typeof date === "string" ? new Date(date) : typeof date === "number" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return formatDate(d);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function isValidXRPLAddress(address: string): boolean {
  // Basic XRPL address validation
  // Addresses start with 'r' and are 25-35 characters
  if (!address || typeof address !== "string") return false;
  if (!address.startsWith("r")) return false;
  if (address.length < 25 || address.length > 35) return false;
  
  // Check for valid base58 characters (excludes 0, O, I, l)
  const validChars = /^r[1-9A-HJ-NP-Za-km-z]+$/;
  return validChars.test(address);
}

export function parseAmount(value: string): number {
  const num = parseFloat(value.replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

export function decodeMemo(memoHex: string): string {
  try {
    return Buffer.from(memoHex, "hex").toString("utf8");
  } catch {
    return "";
  }
}
