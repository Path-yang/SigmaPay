import { Wallet } from "xrpl";
import { getClient } from "./client";

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
        
        if (isMnemonic) {
            // Import from mnemonic phrase (12/24 words)
            wallet = Wallet.fromMnemonic(input);
        } else {
            // Import from secret seed (starts with 's')
            wallet = Wallet.fromSeed(input);
        }
        
        return {
            address: wallet.classicAddress,
            seed: wallet.seed!,
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
        const client = await getClient();
        // Create a temporary wallet with the address to fund
        const result = await client.fundWallet();
        return {
            success: true,
            balance: result.balance,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fund wallet";
        return {
            success: false,
            error: message,
        };
    }
}

export async function fundExistingWallet(seed: string): Promise<{
    success: boolean;
    balance?: number;
    error?: string;
}> {
    try {
        const client = await getClient();
        const wallet = Wallet.fromSeed(seed);
        const result = await client.fundWallet(wallet);
        return {
            success: true,
            balance: result.balance,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fund wallet";
        return {
            success: false,
            error: message,
        };
    }
}
