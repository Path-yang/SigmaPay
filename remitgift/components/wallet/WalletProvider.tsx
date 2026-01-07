"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Wallet } from "xrpl";
import { getStoredWallet, decryptSeed, clearStoredWallet, saveWallet, hasStoredWallet } from "@/lib/utils/encryption";
import { generateWallet, importWallet, getWalletFromSeed, fundExistingWallet } from "@/lib/xrpl/wallet";
import { getBalances, isAccountFunded } from "@/lib/xrpl/balance";
import { createRLUSDTrustline, checkTrustlineExists } from "@/lib/xrpl/trustline";
import { getClient, disconnectClient } from "@/lib/xrpl/client";
import type { Balances } from "@/lib/xrpl/balance";

interface WalletContextType {
    address: string | null;
    wallet: Wallet | null;
    balances: Balances;
    isLoading: boolean;
    isConnected: boolean;
    hasTrustline: boolean;
    isFunded: boolean;
    error: string | null;
    hasWallet: boolean;

    // Actions
    createWallet: (password: string) => Promise<{ seed: string; address: string }>;
    importWalletFromSeed: (seed: string, password: string) => Promise<void>;
    unlockWallet: (password: string) => Promise<void>;
    lockWallet: () => void;
    logout: () => void;
    refreshBalances: () => Promise<void>;
    fundWallet: () => Promise<boolean>;
    setupTrustline: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [balances, setBalances] = useState<Balances>({ xrp: "0", rlusd: "0" });
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [hasTrustline, setHasTrustline] = useState(false);
    const [isFunded, setIsFunded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasWallet, setHasWallet] = useState(false);

    // Check for stored wallet on mount
    useEffect(() => {
        const stored = getStoredWallet();
        if (stored) {
            setAddress(stored.address);
            setHasWallet(true);
        }
        setIsLoading(false);
    }, []);

    // Connect to XRPL and refresh data when wallet is unlocked
    useEffect(() => {
        if (wallet) {
            const connectAndRefresh = async () => {
                try {
                    await getClient();
                    setIsConnected(true);
                    await refreshBalances();
                } catch (err) {
                    console.error("Failed to connect:", err);
                    setError("Failed to connect to XRPL network");
                }
            };
            connectAndRefresh();
        }

        return () => {
            if (!wallet) {
                disconnectClient();
            }
        };
    }, [wallet]);

    const refreshBalances = useCallback(async () => {
        if (!address) return;

        try {
            setIsLoading(true);

            // Check if funded
            const funded = await isAccountFunded(address);
            setIsFunded(funded);

            if (funded) {
                // Get balances
                const newBalances = await getBalances(address);
                setBalances(newBalances);

                // Check trustline
                const trustlineExists = await checkTrustlineExists(address);
                setHasTrustline(trustlineExists);
            } else {
                setBalances({ xrp: "0", rlusd: "0" });
                setHasTrustline(false);
            }

            setError(null);
        } catch (err) {
            console.error("Failed to refresh balances:", err);
            setError("Failed to fetch wallet data");
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    const createWallet = async (password: string): Promise<{ seed: string; address: string }> => {
        try {
            setIsLoading(true);
            const { address: newAddress, seed, publicKey } = generateWallet();

            saveWallet(newAddress, seed, publicKey, password);

            const newWallet = getWalletFromSeed(seed);
            setAddress(newAddress);
            setWallet(newWallet);
            setHasWallet(true);
            setError(null);

            return { seed, address: newAddress };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create wallet";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const importWalletFromSeed = async (seed: string, password: string): Promise<void> => {
        try {
            setIsLoading(true);
            const walletInfo = importWallet(seed);

            saveWallet(walletInfo.address, walletInfo.seed, walletInfo.publicKey, password);

            const newWallet = getWalletFromSeed(seed);
            setAddress(walletInfo.address);
            setWallet(newWallet);
            setHasWallet(true);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to import wallet";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const unlockWallet = async (password: string): Promise<void> => {
        const stored = getStoredWallet();
        if (!stored) {
            throw new Error("No wallet found");
        }

        try {
            setIsLoading(true);
            const seed = decryptSeed(stored.encryptedSeed, password);
            const unlockedWallet = getWalletFromSeed(seed);

            setWallet(unlockedWallet);
            setAddress(stored.address);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Invalid password";
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const lockWallet = () => {
        setWallet(null);
        setBalances({ xrp: "0", rlusd: "0" });
        setIsConnected(false);
    };

    const logout = () => {
        clearStoredWallet();
        setWallet(null);
        setAddress(null);
        setBalances({ xrp: "0", rlusd: "0" });
        setIsConnected(false);
        setHasWallet(false);
        setHasTrustline(false);
        setIsFunded(false);
        disconnectClient();
    };

    const fundWallet = async (): Promise<boolean> => {
        if (!wallet) return false;

        try {
            setIsLoading(true);
            const result = await fundExistingWallet(wallet.seed!);

            if (result.success) {
                await refreshBalances();
                return true;
            } else {
                setError(result.error || "Failed to fund wallet");
                return false;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fund wallet";
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const setupTrustline = async (): Promise<boolean> => {
        if (!wallet) return false;

        try {
            setIsLoading(true);
            const result = await createRLUSDTrustline(wallet);

            if (result.success) {
                setHasTrustline(true);
                await refreshBalances();
                return true;
            } else {
                setError(result.error || "Failed to create trustline");
                return false;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create trustline";
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                wallet,
                balances,
                isLoading,
                isConnected,
                hasTrustline,
                isFunded,
                error,
                hasWallet,
                createWallet,
                importWalletFromSeed,
                unlockWallet,
                lockWallet,
                logout,
                refreshBalances,
                fundWallet,
                setupTrustline,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}
