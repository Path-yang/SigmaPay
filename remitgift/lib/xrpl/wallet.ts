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

export function importWallet(seed: string): WalletInfo {
    try {
        const wallet = Wallet.fromSeed(seed);
        return {
            address: wallet.classicAddress,
            seed: wallet.seed!,
            publicKey: wallet.publicKey,
        };
    } catch (error) {
        throw new Error("Invalid seed phrase. Please check and try again.");
    }
}

export function getWalletFromSeed(seed: string): Wallet {
    return Wallet.fromSeed(seed);
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
