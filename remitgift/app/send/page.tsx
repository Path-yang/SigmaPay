"use client";

import { useWallet } from "@/components/wallet/WalletProvider";
import { SendForm } from "@/components/send/SendForm";
import { WalletUnlock } from "@/components/wallet/WalletUnlock";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SendPage() {
    const { wallet, hasWallet } = useWallet();

    // Redirect to dashboard if no wallet
    if (!hasWallet) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">No Wallet Found</h2>
                    <p className="text-slate-500 mb-6">Create or import a wallet to continue</p>
                    <Link href="/dashboard">
                        <Button>Go to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Show unlock if wallet is locked
    if (!wallet) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <WalletUnlock />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 md:pb-8">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Send Gift</h1>
                        <p className="text-slate-500">Send RLUSD to anyone</p>
                    </div>
                </div>

                <SendForm />
            </div>
        </div>
    );
}
