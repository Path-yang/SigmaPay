export interface WalletState {
    address: string | null;
    seed: string | null;
    publicKey: string | null;
    isConnected: boolean;
    isLoading: boolean;
}

export interface BalanceState {
    xrp: string;
    rlusd: string;
    isLoading: boolean;
    error: string | null;
}

export interface TransactionState {
    hash: string;
    status: "pending" | "success" | "failed";
    type: "payment" | "check" | "trustline";
    message?: string;
}

export interface CheckInfo {
    index: string;
    sender: string;
    amount: string;
    currency: string;
    memo?: string;
}

export type SendMethod = "direct" | "check";
