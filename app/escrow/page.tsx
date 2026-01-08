"use client";

import { useWallet } from "@/components/wallet/WalletProvider";
import { WalletUnlock } from "@/components/wallet/WalletUnlock";
import { EscrowList } from "@/components/escrow/EscrowList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Plus, Lock, Info, Loader2 } from "lucide-react";

export default function EscrowPage() {
  const { wallet, hasWallet, isLoading } = useWallet();

  // Only show loading on initial page load, not during balance refreshes
  if (isLoading && !wallet && !hasWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Escrow</h1>
              <p className="text-slate-500">Conditional & scheduled payments</p>
            </div>
          </div>
          <Link href="/escrow/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </Link>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900">What is Escrow?</h3>
                <p className="text-sm text-indigo-700">
                  Escrow lets you lock XRP with conditions for release. Use it for:
                </p>
                <ul className="text-sm text-indigo-600 mt-2 space-y-1">
                  <li>• <strong>Scheduled payments</strong> - Birthday gifts, subscriptions</li>
                  <li>• <strong>Conditional payments</strong> - Release when work is done</li>
                  <li>• <strong>Buyer protection</strong> - Safe P2P transactions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escrow List */}
        <EscrowList />
      </div>
    </div>
  );
}
