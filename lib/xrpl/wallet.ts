import { Wallet } from "xrpl";

export interface WalletInfo {
    address: string;
    seed: string;
    publicKey: string;
}

export function generateWallet(): WalletInfo {
    const wallet = Wallet.generate();
    return {
        address: wallet.classicAddress,
        seed: wallet.seed!,
        publicKey: wallet.publicKey,
    };
}

export function importWallet(seedOrMnemonic: string): WalletInfo {
    const input = seedOrMnemonic.trim();
    
    // Check if it's a mnemonic (multiple words separated by spaces)
    const words = input.split(/\s+/);
    const isMnemonic = words.length >= 12 && words.length <= 24;
    
    try {
        let wallet: Wallet;
        let seedToStore: string;
        
        if (isMnemonic) {
            // Import from mnemonic phrase (12/24 words)
            // Normalize the mnemonic (lowercase, single spaces)
            const normalizedMnemonic = words.map(w => w.toLowerCase()).join(' ');
            wallet = Wallet.fromMnemonic(normalizedMnemonic);
            // Store the mnemonic since wallet.seed is undefined for mnemonic-derived wallets
            seedToStore = normalizedMnemonic;
        } else {
            // Import from secret seed (starts with 's')
            wallet = Wallet.fromSeed(input);
            seedToStore = wallet.seed!;
        }
        
        return {
            address: wallet.classicAddress,
            seed: seedToStore,
            publicKey: wallet.publicKey,
        };
    } catch (error) {
        // Provide helpful error message
        if (isMnemonic) {
            throw new Error("Invalid mnemonic phrase. Make sure all words are correct and in the right order.");
        } else {
            throw new Error("Invalid seed. Enter a secret key (starting with 's') or a 12/24 word mnemonic phrase.");
        }
    }
}

export function getWalletFromSeed(seedOrMnemonic: string): Wallet {
    const input = seedOrMnemonic.trim();
    const words = input.split(/\s+/);
    const isMnemonic = words.length >= 12 && words.length <= 24;
    
    if (isMnemonic) {
        return Wallet.fromMnemonic(input);
    }
    return Wallet.fromSeed(input);
}

export async function fundWalletFromFaucet(address: string): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
}> {
    try {
        // Use our server-side API route for more reliable funding
        const response = await fetch("/api/faucet", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ address }),
        });
        
        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                balance: result.balance,
            };
        } else {
            return {
                success: false,
                error: result.error || "Failed to fund wallet",
            };
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fund wallet";
        return {
            success: false,
            error: message,
        };
    }
}

export async function fundExistingWallet(seedOrMnemonic: string): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
}> {
    try {
        const wallet = getWalletFromSeed(seedOrMnemonic);
        
        // Use our server-side API route for more reliable funding
        const response = await fetch("/api/faucet", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ address: wallet.classicAddress }),
        });
        
        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                balance: result.balance,
            };
        } else {
            return {
                success: false,
                error: result.error || "Failed to fund wallet",
            };
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fund wallet";
        return {
            success: false,
            error: message,
        };
    }
}
