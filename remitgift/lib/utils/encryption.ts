import CryptoJS from "crypto-js";

const WALLET_STORAGE_KEY = "sigmapay_wallet";

export interface StoredWallet {
    address: string;
    encryptedSeed: string;
    publicKey: string;
}

export function encryptSeed(seed: string, password: string): string {
    return CryptoJS.AES.encrypt(seed, password).toString();
}

export function decryptSeed(encrypted: string, password: string): string {
    try {
        const bytes = CryptoJS.AES.decrypt(encrypted, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
            throw new Error("Invalid password");
        }
        return decrypted;
    } catch {
        throw new Error("Invalid password or corrupted data");
    }
}

export function saveWallet(
    address: string,
    seed: string,
    publicKey: string,
    password: string
): void {
    const encryptedSeed = encryptSeed(seed, password);
    const walletData: StoredWallet = {
        address,
        encryptedSeed,
        publicKey,
    };
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
}

export function getStoredWallet(): StoredWallet | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as StoredWallet;
    } catch {
        return null;
    }
}

export function clearStoredWallet(): void {
    localStorage.removeItem(WALLET_STORAGE_KEY);
}

export function hasStoredWallet(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(WALLET_STORAGE_KEY) !== null;
}
