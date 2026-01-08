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

// Escrow Types
export type EscrowStatus = "pending" | "claimable" | "cancellable" | "completed" | "cancelled";
export type EscrowReleaseType = "time" | "condition" | "both";

export interface EscrowInfo {
    index: string;
    owner: string;
    destination: string;
    amount: string;
    sequence: number;
    finishAfter?: number;
    cancelAfter?: number;
    condition?: string;
    status: EscrowStatus;
    memo?: string;
    fulfillment?: string; // Only for sender's view
    createdAt?: number;
}

export interface CreateEscrowParams {
    destination: string;
    amount: string;
    releaseType: EscrowReleaseType;
    finishAfter?: Date;
    cancelAfter?: Date;
    memo?: string;
}
