"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "./WalletProvider";
import { formatAmount, formatAddress, copyToClipboard } from "@/lib/utils/format";
import { toast } from "@/components/ui/use-toast";
import { Copy, Check, RefreshCw, Wallet, DollarSign, Loader2, Zap, Link as LinkIcon } from "lucide-react";

export function WalletBalance() {
    const {
        address,
        balances,
        isLoading,
        isFunded,
        hasTrustline,
        refreshBalances,
        fundWallet,
        setupTrustline
    } = useWallet();

    const [copied, setCopied] = useState(false);
    const [isFunding, setIsFunding] = useState(false);
    const [isSettingTrustline, setIsSettingTrustline] = useState(false);

    const handleCopy = async () => {
        if (address) {
            await copyToClipboard(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({
                title: "Address copied!",
                description: "Your wallet address has been copied to clipboard",
                variant: "success",
            });
        }
    };

    const handleFund = async () => {
        setIsFunding(true);
        const success = await fundWallet();
        setIsFunding(false);

        if (success) {
            toast({
                title: "Wallet funded!",
                description: "Your wallet has been funded with test XRP",
                variant: "success",
            });
        } else {
            toast({
                title: "Funding failed",
                description: "Please try again in a few moments",
                variant: "destructive",
            });
        }
    };

    const handleSetupTrustline = async () => {
        setIsSettingTrustline(true);
        const success = await setupTrustline();
        setIsSettingTrustline(false);

        if (success) {
            toast({
                title: "Trustline created!",
                description: "You can now send and receive RLUSD",
                variant: "success",
            });
        } else {
            toast({
                title: "Trustline setup failed",
                description: "Please try again",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Wallet Address Card */}
            <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 border-0 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-white/70">Your Wallet</p>
                                <p className="font-mono text-sm">
                                    {address ? formatAddress(address, 8) : "..."}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-4">
                {/* XRP Balance */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-slate-600" />
                            </div>
                            <span className="text-sm text-slate-500">XRP</span>
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <p className="text-2xl font-bold text-slate-900">
                                {formatAmount(balances.xrp)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* RLUSD Balance */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-sm text-slate-500">RLUSD</span>
                        </div>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : hasTrustline ? (
                            <p className="text-2xl font-bold text-slate-900">
                                {formatAmount(balances.rlusd)}
                            </p>
                        ) : (
                            <p className="text-sm text-slate-400">No trustline</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {!isFunded && (
                    <Button
                        variant="success"
                        className="flex-1"
                        onClick={handleFund}
                        disabled={isFunding}
                    >
                        {isFunding ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Funding...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2" />
                                Fund Wallet
                            </>
                        )}
                    </Button>
                )}

                {isFunded && !hasTrustline && (
                    <Button
                        className="flex-1"
                        onClick={handleSetupTrustline}
                        disabled={isSettingTrustline}
                    >
                        {isSettingTrustline ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Setting up...
                            </>
                        ) : (
                            <>
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Enable RLUSD
                            </>
                        )}
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="icon"
                    onClick={refreshBalances}
                    disabled={isLoading}
                    className="shrink-0"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* Status Messages */}
            {!isFunded && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-700">
                        <strong>New wallet!</strong> Fund your wallet with test XRP to get started.
                    </p>
                </div>
            )}

            {isFunded && !hasTrustline && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-700">
                        <strong>Almost ready!</strong> Enable RLUSD to send and receive stable payments.
                    </p>
                </div>
            )}
        </div>
    );
}
