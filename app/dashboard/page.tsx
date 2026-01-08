"use client";

import { useWallet } from "@/components/wallet/WalletProvider";
import { WalletSetup } from "@/components/wallet/WalletSetup";
import { WalletUnlock } from "@/components/wallet/WalletUnlock";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { DIDStatus } from "@/components/did/DIDStatus";
import { VerificationBadge } from "@/components/did/VerificationBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationLevel, getLimitDisplay } from "@/lib/xrpl/constants";
import Link from "next/link";
import { Send, Inbox, Clock, ArrowRight, Shield, ShieldCheck, Lock } from "lucide-react";

export default function DashboardPage() {
    const { 
        hasWallet, 
        wallet, 
        isLoading, 
        verificationLevel,
        sendLimit,
        isVerified,
        hasDID 
    } = useWallet();

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
                {/* Header with verification status */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500">Manage your wallet</p>
                    </div>
                    <VerificationBadge level={verificationLevel} />
                </div>

                {/* Verification Prompt for Unverified Users */}
                {!isVerified && (
                    <Card className="mb-6 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-amber-800">Verify Your Identity</h3>
                                    <p className="text-sm text-amber-700 mb-3">
                                        Your current limit is {getLimitDisplay(verificationLevel)}. Verify to unlock instant transfers and higher limits.
                                    </p>
                                    <Link href="/verify">
                                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                                            <ShieldCheck className="w-4 h-4 mr-2" />
                                            Verify Now
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Wallet Balance */}
                <div className="mb-6">
                    <WalletBalance />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    <Link href="/send">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                            <CardContent className="p-3 text-center">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-2">
                                    <Send className="w-4 h-4 text-white" />
                                </div>
                                <p className="font-medium text-slate-900 text-sm">Send</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/receive">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                            <CardContent className="p-3 text-center">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-2">
                                    <Inbox className="w-4 h-4 text-white" />
                                </div>
                                <p className="font-medium text-slate-900 text-sm">Receive</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/escrow">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                            <CardContent className="p-3 text-center">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-2">
                                    <Lock className="w-4 h-4 text-white" />
                                </div>
                                <p className="font-medium text-slate-900 text-sm">Escrow</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/history">
                        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                            <CardContent className="p-3 text-center">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-2">
                                    <Clock className="w-4 h-4 text-white" />
                                </div>
                                <p className="font-medium text-slate-900 text-sm">History</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* DID Status Card */}
                <div className="mb-6">
                    <DIDStatus level={verificationLevel} showUpgradePrompt={!isVerified} />
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
                                Verify your identity for higher limits
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">4</span>
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
