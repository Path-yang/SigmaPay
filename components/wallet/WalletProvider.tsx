"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Wallet } from "xrpl";
import { getStoredWallet, decryptSeed, clearStoredWallet, saveWallet, hasStoredWallet } from "@/lib/utils/encryption";
import { generateWallet, importWallet, getWalletFromSeed, fundExistingWallet } from "@/lib/xrpl/wallet";
import { getBalances, isAccountFunded } from "@/lib/xrpl/balance";
import { createRLUSDTrustline, checkTrustlineExists } from "@/lib/xrpl/trustline";
import { getClient, disconnectClient } from "@/lib/xrpl/client";
import { getDID, createDID, updateVerificationLevel, SigmaPayDID } from "@/lib/xrpl/did";
import { VerificationLevel, LIMITS } from "@/lib/xrpl/constants";
import type { Balances } from "@/lib/xrpl/balance";
import { 
    getEscrowsForAddress, 
    getStoredEscrows, 
    EscrowInfo, 
    StoredEscrow 
} from "@/lib/xrpl/escrow";

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
    
    // DID related
    did: SigmaPayDID | null;
    verificationLevel: VerificationLevel;
    sendLimit: number;
    isVerified: boolean;
    isFullyVerified: boolean;
    hasDID: boolean;

    // Actions
    createWallet: (password: string) => Promise<{ seed: string; address: string }>;
    importWalletFromSeed: (seed: string, password: string) => Promise<void>;
    unlockWallet: (password: string) => Promise<void>;
    lockWallet: () => void;
    logout: () => void;
    refreshBalances: () => Promise<void>;
    fundWallet: () => Promise<boolean>;
    setupTrustline: () => Promise<{ success: boolean; error?: string }>;
    
    // DID Actions
    initializeDID: () => Promise<boolean>;
    verifyIdentity: (level: VerificationLevel, data?: { name?: string; email?: string; phone?: string }) => Promise<boolean>;
    refreshDID: () => Promise<void>;
    
    // Escrow related
    escrows: {
        sent: (EscrowInfo | StoredEscrow)[];
        received: (EscrowInfo | StoredEscrow)[];
    };
    refreshEscrows: () => Promise<void>;
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
    
    // DID state
    const [did, setDID] = useState<SigmaPayDID | null>(null);
    
    // Escrow state
    const [escrows, setEscrows] = useState<{
        sent: (EscrowInfo | StoredEscrow)[];
        received: (EscrowInfo | StoredEscrow)[];
    }>({ sent: [], received: [] });

    // Check for stored wallet on mount
    useEffect(() => {
        const stored = getStoredWallet();
        if (stored) {
            setAddress(stored.address);
            setHasWallet(true);
        }
        setIsLoading(false);
    }, []);

    // Refresh DID when address changes
    const refreshDID = useCallback(async () => {
        if (!address) {
            setDID(null);
            return;
        }
        try {
            const didData = await getDID(address);
            setDID(didData);
        } catch (err) {
            console.error("Failed to fetch DID:", err);
        }
    }, [address]);

    // Refresh escrows
    const refreshEscrows = useCallback(async () => {
        if (!address) {
            setEscrows({ sent: [], received: [] });
            return;
        }
        try {
            // Get escrows from chain
            const chainEscrows = await getEscrowsForAddress(address);
            
            // Get escrows from local storage (includes fulfillments)
            const storedEscrows = getStoredEscrows(address);

            // Merge chain escrows with stored data
            const mergedSent = chainEscrows.sent.map(escrow => {
                const stored = storedEscrows.sent.find(
                    s => s.owner === escrow.owner && s.sequence === escrow.sequence
                );
                if (stored) {
                    return { ...escrow, ...stored, status: escrow.status };
                }
                return escrow;
            });

            setEscrows({
                sent: mergedSent,
                received: [...chainEscrows.received, ...storedEscrows.received],
            });
        } catch (err) {
            console.error("Failed to fetch escrows:", err);
        }
    }, [address]);

    // Connect to XRPL and refresh data when wallet is unlocked
    useEffect(() => {
        if (wallet) {
            const connectAndRefresh = async () => {
                try {
                    await getClient();
                    setIsConnected(true);
                    await refreshBalances();
                    await refreshDID();
                    await refreshEscrows();
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
    }, [wallet, refreshDID, refreshEscrows]);

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

    const createWalletAction = async (password: string): Promise<{ seed: string; address: string }> => {
        try {
            setIsLoading(true);
            const { address: newAddress, seed, publicKey } = generateWallet();

            saveWallet(newAddress, seed, publicKey, password);

            // DON'T auto-unlock - let user see the seed first
            // The WalletSetup component will show the seed, then user can unlock
            setAddress(newAddress);
            setHasWallet(true);
            // wallet stays null until user explicitly unlocks
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
        setDID(null);
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

    const setupTrustline = async (): Promise<{ success: boolean; error?: string }> => {
        if (!wallet) return { success: false, error: "No wallet connected" };

        try {
            setIsLoading(true);
            const result = await createRLUSDTrustline(wallet);

            if (result.success) {
                setHasTrustline(true);
                await refreshBalances();
                return { success: true };
            } else {
                const errorMsg = result.error || "Failed to create trustline";
                setError(errorMsg);
                return { success: false, error: errorMsg };
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create trustline";
            setError(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

    // DID Actions
    const initializeDID = async (): Promise<boolean> => {
        if (!wallet) return false;

        try {
            setIsLoading(true);
            const result = await createDID(wallet, {
                verificationLevel: VerificationLevel.UNVERIFIED,
            });

            if (result.success) {
                await refreshDID();
                return true;
            } else {
                setError(result.error || "Failed to initialize DID");
                return false;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to initialize DID";
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const verifyIdentity = async (
        level: VerificationLevel,
        data?: { name?: string; email?: string; phone?: string }
    ): Promise<boolean> => {
        if (!wallet) {
            console.error("Cannot verify: wallet not unlocked");
            return false;
        }

        try {
            setIsLoading(true);
            console.log("Starting verification:", level, data);
            const result = await updateVerificationLevel(wallet, level, data);

            console.log("Verification result:", result);

            if (result.success) {
                await refreshDID();
                return true;
            } else {
                const errorMsg = result.error || "Failed to verify identity";
                setError(errorMsg);
                console.error("Verification failed:", errorMsg);
                return false;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to verify identity";
            setError(message);
            console.error("Verification error:", err);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const verificationLevel = did?.verificationLevel || VerificationLevel.UNVERIFIED;
    const sendLimit = LIMITS[verificationLevel];

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
                
                // DID
                did,
                verificationLevel,
                sendLimit,
                isVerified: verificationLevel !== VerificationLevel.UNVERIFIED,
                isFullyVerified: verificationLevel === VerificationLevel.VERIFIED,
                hasDID: did !== null,
                
                // Actions
                createWallet: createWalletAction,
                importWalletFromSeed,
                unlockWallet,
                lockWallet,
                logout,
                refreshBalances,
                fundWallet,
                setupTrustline,
                
                // DID Actions
                initializeDID,
                verifyIdentity,
                refreshDID,
                
                // Escrow
                escrows,
                refreshEscrows,
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
