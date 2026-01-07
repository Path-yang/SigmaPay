"use client";

import { useWallet } from "@/components/wallet/WalletProvider";
import { WalletSetup } from "@/components/wallet/WalletSetup";
import { WalletUnlock } from "@/components/wallet/WalletUnlock";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Send, Inbox, Clock, ArrowRight } from "lucide-react";

export default function DashboardPage() {
    const { hasWallet, wallet, isLoading } = useWallet();

    // Show loading state
    if (isLoading && !hasWallet) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    // No wallet - show setup
    if (!hasWallet) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <WalletSetup />
            </div>
        );
    }

    // Has wallet but locked - show unlock
    if (!wallet) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <WalletUnlock />
            </div>
        );
    }

    // Wallet unlocked - show dashboard
    return (
        <div className="min-h-screen pb-24 md:pb-8">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Manage your wallet and send gifts</p>
                </div>

                {/* Wallet Balance */}
                <div className="mb-6">
                    <WalletBalance />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Link href="/send">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                            <CardContent className="p-4 text-center">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                                    <Send className="w-5 h-5 text-white" />
                                </div>
                                <p className="font-medium text-slate-900">Send</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/receive">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                            <CardContent className="p-4 text-center">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3">
                                    <Inbox className="w-5 h-5 text-white" />
                                </div>
                                <p className="font-medium text-slate-900">Receive</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/history">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                            <CardContent className="p-4 text-center">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mx-auto mb-3">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <p className="font-medium text-slate-900">History</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Info Card */}
                <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200/50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-slate-900 mb-2">How it works</h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                                Fund your wallet with test XRP
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
                                Enable RLUSD to receive stablecoin payments
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
                                Send RLUSD to anyone, anywhere instantly
                            </li>
                        </ul>
                        <Link href="/send">
                            <Button className="w-full mt-4" size="lg">
                                Send Your First Gift
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
