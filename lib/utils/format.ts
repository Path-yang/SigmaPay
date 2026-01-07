import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatAddress(address: string, chars: number = 6): string {
    if (!address) return "";
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: string | number, decimals: number = 2): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "0.00";
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

export function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return formatDate(timestamp);
}

export function isValidXRPLAddress(address: string): boolean {
    // Basic XRPL address validation
    // Addresses start with 'r' and are 25-35 characters
    const xrplAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
    return xrplAddressRegex.test(address);
}

export function copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
}
